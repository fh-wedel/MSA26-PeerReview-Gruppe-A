import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { NotificationServiceStack } from '../lib/service-stack';

const synth = () => {
    const app = new cdk.App();
    const stack = new NotificationServiceStack(app, 'TestNotificationServiceStack', {
        serviceName: 'notification',
        imageVersion: 'v1',
        description: 'Notification service for multi-channel message dispatch',
        containerPort: 8081,
        requestQueueName: 'notification-request-queue',
        secretsName: 'msa26/notification/credentials',
        minTaskCount: 1,
        maxTaskCount: 1,
        memory: 512,
        cpu: 256,
    });
    return Template.fromStack(stack);
};

test('Notification stack creates its own RDS database and log group', () => {
    const template = synth();

    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBName: 'notification',
    });
    template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/notification',
    });
});

test('Notification stack provisions the request queue', () => {
    const template = synth();

    template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'notification-request-queue',
    });
});

test('Notification task runs the container on the IPv6 port behind the API Gateway Lambda', () => {
    const template = synth();

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
            Match.objectLike({
                Name: 'notification',
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
            'Fn::ImportValue': 'notification:ProxyLambdaSecurityGroupId',
        },
    });
});
