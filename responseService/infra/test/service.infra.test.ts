import * as cdk from 'aws-cdk-lib/core';
import {Match, Template} from 'aws-cdk-lib/assertions';
import {ResponseServiceStack} from '../lib/service-stack';

const synth = () => {
    const app = new cdk.App();
    const stack = new ResponseServiceStack(app, 'TestResponseServiceStack', {
        serviceName: 'response',
        imageVersion: 'v1',
        description: 'Response service for storing and exposing review results',
        containerPort: 8081,
        requestQueueName: 'response-request-queue',
        s3BucketName: 'msa26-peer-review-response-documents',
        dynamoDbTableName: 'response-service-results',
        aiReviewQueueName: 'response-ai-review-queue',
        minTaskCount: 1,
        maxTaskCount: 1,
        memory: 512,
        cpu: 256,
        bedrockModelId: 'eu.anthropic.claude-sonnet-4-5-20250929-v1:0',
    });
    return Template.fromStack(stack);
};

test('Response stack creates its own DynamoDB table and log group', () => {
    const template = synth();

    template.resourceCountIs('AWS::DynamoDB::Table', 1);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'response-service-results',
        GlobalSecondaryIndexes: Match.arrayWith([
            Match.objectLike({ IndexName: 'AuthorIndex' }),
        ]),
    });
    template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/response',
    });
});

test('Response stack provisions the documents bucket and the request queue', () => {
    const template = synth();

    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'msa26-peer-review-response-documents',
    });
    template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'response-request-queue',
    });
});

test('Response stack creates a Bedrock proxy Lambda and injects it into ECS environment', () => {
    const template = synth();

    template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'response-bedrock-proxy',
        Runtime: 'python3.12',
        Handler: 'bedrock_proxy.handler',
    });

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
            Match.objectLike({
                Environment: Match.arrayWith([
                    Match.objectLike({ Name: 'BEDROCK_PROXY_LAMBDA_NAME' }),
                ]),
            }),
        ]),
    });
});

test('Response stack grants Bedrock invoke to proxy Lambda and Lambda invoke to ECS task role', () => {
    const template = synth();

    template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
            Statement: Match.arrayWith([
                Match.objectLike({
                    Action: 'bedrock:InvokeModel',
                    Effect: 'Allow',
                    Resource: Match.arrayWith([
                        'arn:aws:bedrock:*::foundation-model/*',
                        'arn:aws:bedrock:*:*:inference-profile/*',
                        'arn:aws:bedrock:*:*:application-inference-profile/*',
                    ]),
                }),
            ]),
        },
    });

    template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
            Statement: Match.arrayWith([
                Match.objectLike({
                    Action: 'lambda:InvokeFunction',
                    Effect: 'Allow',
                }),
            ]),
        },
    });
});

test('Response task runs the container on the IPv6 port behind the API Gateway Lambda', () => {
    const template = synth();

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
            Match.objectLike({
                Name: 'response',
                PortMappings: Match.arrayWith([
                    Match.objectLike({ ContainerPort: 8081, Protocol: 'tcp' }),
                ]),
                Environment: Match.arrayWith([
                    { Name: 'SERVER_PORT', Value: '8081' },
                ]),
            }),
        ]),
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 8081,
        ToPort: 8081,
        IpProtocol: 'tcp',
        SourceSecurityGroupId: {
            'Fn::ImportValue': 'response:ProxyLambdaSecurityGroupId',
        },
    });
});
