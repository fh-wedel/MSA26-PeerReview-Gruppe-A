import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { ApiStack } from '../lib/stacks/api/api';

jest.mock('aws-cdk-lib/aws-lambda-nodejs', () => {
    const lambdaActual = jest.requireActual('aws-cdk-lib/aws-lambda') as typeof lambda;

    class MockNodejsFunction extends lambdaActual.Function {
        constructor(scope: any, id: string, props: any) {
            const {
                logGroup,
                bundling,
                entry,
                projectRoot,
                ...rest
            } = props ?? {};

            super(scope, id, {
                ...rest,
                code: lambdaActual.Code.fromInline('exports.handler = async () => {};'),
                handler: rest.handler ?? 'index.handler',
                runtime: rest.runtime ?? lambdaActual.Runtime.NODEJS_18_X,
            });
        }
    }

    return {
        NodejsFunction: MockNodejsFunction,
        OutputFormat: { CJS: 'cjs' },
    };
});

test('ApiStack creates proxy Lambda and REST API', () => {
    const app = new cdk.App();
    const stack = new ApiStack(app, 'TestApiStack', {
        apiName: 'orders',
        description: 'Orders API',
        targetServiceName: 'orders',
        targetPort: 8081,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'ordersProxyLambda',
        MemorySize: 256,
        Timeout: 29,
        Environment: {
            Variables: {
                TARGET_URL: Match.anyValue(),
            },
        },
    });

    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    template.resourceCountIs('AWS::ApiGateway::Method', 1);
    template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'ANY',
    });

    template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/ordersProxyLambda',
    });

    template.hasOutput('ApiUrl', {
        Export: {
            Name: ':orders:ApiUrl',
        },
    });

    template.hasOutput('ProxyLambdaSecurityGroupId', {
        Export: {
            Name: 'orders:ProxyLambdaSecurityGroupId',
        },
    });
});

test('ApiStack creates Verified Permissions authorizer when configured', () => {
    const app = new cdk.App();
    const stack = new ApiStack(app, 'TestApiStack', {
        apiName: 'orders',
        description: 'Orders API',
        targetServiceName: 'orders',
        targetPort: 8081,
        authorizerConfig: {
            policyStoreId: 'store-123',
            namespace: 'PeerReview',
            tokenType: 'accessToken',
        },
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ApiGateway::Authorizer', 1);
    template.resourceCountIs('Custom::ApiGatewayAuthorizerPatch', 1);
    template.resourceCountIs('AWS::Lambda::Function', 3);
});

test('ApiStack applies OpenAPI base path and integrations', () => {
    const app = new cdk.App();
    const openApiSpecPath = path.resolve(__dirname, 'fixtures', 'openapi.json');

    const stack = new ApiStack(app, 'TestApiStack', {
        apiName: 'orders',
        description: 'Orders API',
        targetServiceName: 'orders',
        targetPort: 8081,
        openApiSpecPath,
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Body: Match.objectLike({
            paths: Match.objectLike({
                '/api/health': Match.objectLike({
                    get: Match.objectLike({
                        'x-amazon-apigateway-integration': Match.objectLike({
                            type: 'aws_proxy',
                            httpMethod: 'POST',
                            uri: Match.anyValue(),
                        }),
                    }),
                }),
            }),
        }),
    });
});
