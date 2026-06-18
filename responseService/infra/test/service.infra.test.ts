import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ResponseServiceStack } from '../lib/service-stack';

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
        minTaskCount: 1,
        maxTaskCount: 1,
        memory: 512,
        cpu: 256,
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
