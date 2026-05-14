import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as fs from 'fs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { ImportedRessources } from '../../importedRessources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as yaml from 'js-yaml';
import { AWSConstants } from '../../../../infrabaseline/lib/constants';
import { CfnOutput } from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import path from 'path';
import { LogsInfra } from '../../logs';


export interface ApiStackProps extends cdk.StackProps {
    /**
     * The name of the REST API. The name is used to generate the API endpoint.
     */
    apiName: string;

    /**
     * A description of the REST API.
     */
    description: string;

    /**
     * The name of the target ECS service to which the API will proxy requests. The Lambda function will forward incoming requests to this ECS service.
     */
    targetServiceName: string;


    /**
     * The port on which the target ECS service is listening. The Lambda function will forward incoming requests to this port on the ECS service.
     */
    targetPort: number;

    /**
     * The path to the OpenAPI definition file.Supported only for HTTP APIs.
     * If not provided, an empty API will be created. If provided, the API will be created based on the OpenAPI definition. 
     * Supported only for HTTP APIs.
     */
    openApiSpecPath?: string;
}

export class ApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        const vpc = ImportedRessources.getVpcByAttributes(this);
        const subnet = ImportedRessources.getDualStackSubnetByAttributes(this, vpc);
        const cloudMapNamespaceName = ImportedRessources.getCloudMapNamespaceName();
        const targetUrl = `http://${props.targetServiceName}.${cloudMapNamespaceName}`;

        const apiName = props.apiName;

        const lambdaSg = new ec2.SecurityGroup(this, 'LambdaSg', {
            vpc,
            allowAllOutbound: true,
        });

        const logGroup = LogsInfra.createLogGroup(this, {
            logGroupName: `/aws/lambda/${apiName}ProxyLambda`,
        });
        const proxyLambda = new NodejsFunction(this, `${apiName}ProxyLambda`, {
            functionName: `${apiName}ProxyLambda`,
            runtime: lambda.Runtime.NODEJS_24_X,
            projectRoot: path.resolve(__dirname, '../../../../'),
            entry: path.join(__dirname, 'lambda', 'api-lambda-proxy-ecs.ts'),
            handler: 'handler',
            bundling: {
                format: OutputFormat.CJS,
                target: 'node24',
            },
            vpc: vpc,
            vpcSubnets: { subnets: [subnet] },
            environment: {
                TARGET_URL: targetUrl + `:${props.targetPort}`,
            },
            timeout: cdk.Duration.seconds(29),
            memorySize: 256,
            ipv6AllowedForDualStack: true,
            securityGroups: [lambdaSg],
            logGroup: logGroup,
        });

        proxyLambda.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));
        lambdaSg.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(props.targetPort), 'Allow Lambda to send requests to ECS service over IPv6');

        let api;
        if (props.openApiSpecPath) {
            api = this.createApiFromOpenApiSpec(props.apiName, props.openApiSpecPath, props.description, proxyLambda.functionArn);
        } else {
            api = new apigateway.RestApi(this, 'RestApi', {
                restApiName: props.apiName,
                description: props.description,
                endpointConfiguration: {
                    types: [apigateway.EndpointType.REGIONAL],
                    ipAddressType: apigateway.IpAddressType.DUAL_STACK
                },
                deploy: true,
            });
        }

        const integration = new apigateway.LambdaIntegration(proxyLambda, {
            proxy: true,
        });

        // Here need to add the authorizer
        api.root.addMethod('ANY', integration);

        new CfnOutput(this, 'ApiUrl', {
            value: api.url,
            description: `URL of the API endpoint for ${props.apiName}`,
            exportName: `:${props.apiName}:ApiUrl`,
        });

        new CfnOutput(this, 'ProxyLambdaSecurityGroupId', {
            value: lambdaSg.securityGroupId,
            description: `Security group ID of the proxy Lambda function for ${props.apiName}`,
            exportName: `${props.targetServiceName}:ProxyLambdaSecurityGroupId`,
        });
    }


    private createApiFromOpenApiSpec(name: string, openApiSpecPath: string, description: string, lambdaArn: string): apigateway.SpecRestApi {
        let openApiSpec: string;
        try {
            openApiSpec = fs.readFileSync(openApiSpecPath, 'utf-8');
        } catch (error) {
            throw new Error(`Could not read OpenAPI spec file for api ${name}: ${error}`);
        }

        let specObj: any;
        try {
            if (openApiSpecPath.toLowerCase().endsWith('.json')) {
                specObj = JSON.parse(openApiSpec);
            } else {
                specObj = yaml.load(openApiSpec);
            }
        } catch (error) {
            throw new Error(`Failed to parse OpenAPI spec file for api ${name}. Ensure it is valid JSON or YAML. Error: ${error}`);
        }
        
        let basePath = '';
        if (specObj.servers && specObj.servers.length > 0 && specObj.servers[0].url) {
            basePath = specObj.servers[0].url;
            if (basePath.endsWith('/')) {
                basePath = basePath.slice(0, -1);
            }
        }

        if (basePath && specObj.paths) {
            const newPaths: any = {};
            for (const pathKey of Object.keys(specObj.paths)) {
                const newPathKey = `${basePath}${pathKey}`.replace(/\/\//g, '/');
                newPaths[newPathKey] = specObj.paths[pathKey];
            }
            specObj.paths = newPaths;
        }

        const awsIntegration = {
            type: 'aws_proxy',
            httpMethod: 'POST',
            uri: `arn:aws:apigateway:${AWSConstants.AWS_REGION}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`,
            passthroughBehavior: 'when_no_match'
        };

        const httpMethods = new Set(['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'any']);
        for (const path of Object.keys(specObj.paths ?? {})) {
            for (const method of Object.keys(specObj.paths[path] ?? {})) {
                if (httpMethods.has(method.toLowerCase())) {
                    specObj.paths[path][method]['x-amazon-apigateway-integration'] = awsIntegration;
                }
            }
        }

        const api = new apigateway.SpecRestApi(this, 'SpecRestApi', {
            restApiName: name,
            description: description,
            apiDefinition: apigateway.ApiDefinition.fromInline(specObj),
            endpointConfiguration: {
                types: [apigateway.EndpointType.REGIONAL],
                ipAddressType: apigateway.IpAddressType.DUAL_STACK
            },
            deploy: true,
            deployOptions: {
                stageName: 'prod',
            },
        });

        return api;
    }
}