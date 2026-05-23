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


export interface VerifiedPermissionsAuthorizerProps {
    /**
     * The Verified Permissions policy store ID.
     */
    policyStoreId: string;

    /**
     * The Cedar namespace used for entities and actions.
     */
    namespace: string;

    /**
     * Token type provided to Verified Permissions (accessToken or identityToken).
     */
    tokenType: 'accessToken' | 'identityToken';

    /**
     * Optional Verified Permissions endpoint override.
     */
    endpoint?: string;

    /**
     * Cache TTL for the authorizer in seconds. Set to 0 to disable caching.
     * @default 0
     */
    cacheTtlSeconds?: number;

    /**
     * If true, a custom resource will attach the authorizer to every method.
     * @default true
     */
    applyToAllMethods?: boolean;
}


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

    /**
     * Optional configuration for a Verified Permissions lambda authorizer.
     */
    authorizerConfig?: VerifiedPermissionsAuthorizerProps;
}

export class ApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        const vpc = ImportedRessources.getVpcByAttributes(this);
        const subnet = ImportedRessources.getDualStackSubnetByAttributes(this, vpc);
        const cloudMapNamespaceName = ImportedRessources.getCloudMapNamespaceName();
        const targetUrl = `http://${props.targetServiceName}.${cloudMapNamespaceName}`;
        const projectRoot = path.resolve(__dirname, '../../../../');
        const depsLockFilePath = path.join(path.resolve(__dirname, '../../../'), 'package-lock.json');

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
            projectRoot: projectRoot,
            depsLockFilePath: depsLockFilePath,
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

        let authorizer: apigateway.RequestAuthorizer | undefined;
        const authorizerConfig = props.authorizerConfig;
        if (authorizerConfig) {
            const authorizerLogGroup = LogsInfra.createLogGroup(this, {
                logGroupName: `/aws/lambda/${apiName}VerifiedPermissionsAuthorizer`,
            });

            const authorizerLambda = new NodejsFunction(this, `${apiName}VerifiedPermissionsAuthorizer`, {
                functionName: `${apiName}VerifiedPermissionsAuthorizer`,
                runtime: lambda.Runtime.NODEJS_24_X,
                projectRoot: projectRoot,
                depsLockFilePath: depsLockFilePath,
                entry: path.join(__dirname, 'lambda', 'api-lambda-verified-permissions-authorizer.ts'),
                handler: 'handler',
                bundling: {
                    format: OutputFormat.CJS,
                    target: 'node24',
                },
                environment: {
                    POLICY_STORE_ID: authorizerConfig.policyStoreId,
                    NAMESPACE: authorizerConfig.namespace,
                    TOKEN_TYPE: authorizerConfig.tokenType,
                    ...(authorizerConfig.endpoint ? { ENDPOINT: authorizerConfig.endpoint } : {}),
                },
                timeout: cdk.Duration.seconds(10),
                memorySize: 256,
                logGroup: authorizerLogGroup,
            });

            authorizerLambda.addToRolePolicy(
                new iam.PolicyStatement({
                    actions: ['verifiedpermissions:IsAuthorizedWithToken'],
                    resources: ['*'],
                }),
            );

            authorizer = new apigateway.RequestAuthorizer(this, 'VerifiedPermissionsAuthorizer', {
                handler: authorizerLambda,
                identitySources: [apigateway.IdentitySource.header('Authorization')],
                resultsCacheTtl: cdk.Duration.seconds(authorizerConfig.cacheTtlSeconds ?? 0),
            });

            if (authorizerConfig.applyToAllMethods ?? true) {
                const patcherLogGroup = LogsInfra.createLogGroup(this, {
                    logGroupName: `/aws/lambda/${apiName}AuthorizerPatcher`,
                });

                const patcherLambda = new NodejsFunction(this, `${apiName}AuthorizerPatcher`, {
                    functionName: `${apiName}AuthorizerPatcher`,
                    runtime: lambda.Runtime.NODEJS_24_X,
                    projectRoot: projectRoot,
                    depsLockFilePath: depsLockFilePath,
                    entry: path.join(__dirname, 'lambda', 'api-lambda-authorizer-patcher.ts'),
                    handler: 'handler',
                    bundling: {
                        format: OutputFormat.CJS,
                        target: 'node24',
                    },
                    environment: {
                        API_GATEWAY_ID: api.restApiId,
                        API_GATEWAY_STAGE: api.deploymentStage.stageName,
                        AUTHORIZER_ID: authorizer.authorizerId,
                    },
                    timeout: cdk.Duration.seconds(60),
                    memorySize: 256,
                    logGroup: patcherLogGroup,
                });

                patcherLambda.addPermission(`${apiName}AuthorizerPatcherInvoke`, {
                    principal: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
                    action: 'lambda:InvokeFunction',
                });

                patcherLambda.addToRolePolicy(
                    new iam.PolicyStatement({
                        actions: ['apigateway:GET', 'apigateway:PATCH', 'apigateway:POST'],
                        resources: [`arn:aws:apigateway:${cdk.Aws.REGION}::/restapis/${api.restApiId}/*`],
                    }),
                );

                const authorizerPatch = new cdk.CustomResource(this, 'ApiGatewayAuthorizerPatch', {
                    serviceToken: patcherLambda.functionArn,
                    resourceType: 'Custom::ApiGatewayAuthorizerPatch',
                    properties: {
                        RestApiId: api.restApiId,
                        AuthorizerId: authorizer.authorizerId,
                        StageName: api.deploymentStage.stageName,
                    },
                });
                authorizerPatch.node.addDependency(api);
                authorizerPatch.node.addDependency(authorizer);
            }
        }

        const integration = new apigateway.LambdaIntegration(proxyLambda, {
            proxy: true,
        });

        const methodOptions = authorizer
            ? { authorizer, authorizationType: apigateway.AuthorizationType.CUSTOM }
            : undefined;

        api.root.addMethod('ANY', integration, methodOptions);

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

        const api = new apigateway.SpecRestApi(this, 'SpecRestOpenApi', {
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