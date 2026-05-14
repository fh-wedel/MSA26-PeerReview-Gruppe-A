import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ServiceStack } from '../lib/service-stack';
import { EcsInfra } from '../../../infraLibrary/lib/ecs';
import { AWSConstants } from '../../../infrabaseline/lib/constants';

const collectSecurityGroupRules = (
    template: Template,
    direction: 'ingress' | 'egress'
): Array<Record<string, any>> => {
    const ruleType =
        direction === 'ingress'
            ? 'AWS::EC2::SecurityGroupIngress'
            : 'AWS::EC2::SecurityGroupEgress';
    const inlineProp =
        direction === 'ingress' ? 'SecurityGroupIngress' : 'SecurityGroupEgress';

    const rules: Array<Record<string, any>> = [];

    const ruleResources = template.findResources(ruleType) as Record<string, any>;
    for (const resource of Object.values(ruleResources)) {
        rules.push(resource.Properties ?? {});
    }

    const groups = template.findResources('AWS::EC2::SecurityGroup') as Record<string, any>;
    for (const group of Object.values(groups)) {
        const inlineRules = group.Properties?.[inlineProp] ?? [];
        if (Array.isArray(inlineRules)) {
            rules.push(...inlineRules);
        }
    }

    return rules;
};

test('Service stack uses IPv6 defaults and creates queues', () => {
    const app = new cdk.App();
    const stack = new ServiceStack(app, 'TestServiceStack', {
        serviceName: 'orders',
        imageVersion: 'v1',
        enablePublicIpV4: false,
        requestQueueName: 'orders-request',
        responseQueueName: 'orders-response',
        containerPort: 8081,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SQS::Queue', 2);
    template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'orders-request',
    });
    template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'orders-response',
    });

    template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/orders',
    });

    template.hasResourceProperties('AWS::ECS::Service', {
        NetworkConfiguration: {
            AwsvpcConfiguration: Match.objectLike({
                AssignPublicIp: 'DISABLED',
            }),
        },
        DeploymentConfiguration: Match.objectLike({
            MaximumPercent: 200,
            MinimumHealthyPercent: 50,
        }),
        ServiceRegistries: Match.arrayWith([
            Match.objectLike({
                RegistryArn: Match.anyValue(),
            }),
        ]),
    });

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
            Match.objectLike({
                Name: 'AppContainer',
                Image: EcsInfra.getDefaultImageNameIpv6('orders', 'v1'),
                PortMappings: Match.arrayWith([
                    Match.objectLike({
                        ContainerPort: 8081,
                        Protocol: 'tcp',
                    }),
                ]),
                Environment: Match.arrayWith([
                    { Name: 'SQS_REQUEST_QUEUE', Value: 'orders-request' },
                    { Name: 'SQS_RESPONSE_QUEUE', Value: 'orders-response' },
                    { Name: 'SERVER_PORT', Value: '8081' },
                    { Name: 'AWS_REGION', Value: AWSConstants.AWS_REGION },
                ]),
                HealthCheck: Match.objectLike({
                    Command: [
                        'CMD-SHELL',
                        'wget -qO- http://localhost:8081/actuator/health || exit 1',
                    ],
                    Interval: 15,
                    Timeout: 5,
                    Retries: 5,
                    StartPeriod: 60,
                }),
            }),
        ]),
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 8081,
        ToPort: 8081,
        IpProtocol: 'tcp',
        SourceSecurityGroupId: {
            'Fn::ImportValue': 'orders:ProxyLambdaSecurityGroupId',
        },
    });

    const egressRules = collectSecurityGroupRules(template, 'egress');
    expect(egressRules).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                CidrIpv6: '::/0',
                FromPort: 80,
                ToPort: 80,
                IpProtocol: 'tcp',
            }),
            expect.objectContaining({
                CidrIpv6: '::/0',
                FromPort: 443,
                ToPort: 443,
                IpProtocol: 'tcp',
            }),
        ])
    );
});

test('Service stack with public IPv4 enables public IP and ingress rules', () => {
    const app = new cdk.App();
    const stack = new ServiceStack(app, 'TestServiceStack', {
        serviceName: 'orders',
        imageVersion: 'v2',
        enablePublicIpV4: true,
        containerPort: 8081,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SQS::Queue', 0);

    template.hasResourceProperties('AWS::ECS::Service', {
        NetworkConfiguration: {
            AwsvpcConfiguration: Match.objectLike({
                AssignPublicIp: 'ENABLED',
            }),
        },
        DeploymentConfiguration: Match.objectLike({
            MaximumPercent: 200,
            MinimumHealthyPercent: 50,
        }),
        ServiceRegistries: Match.arrayWith([
            Match.objectLike({
                RegistryArn: Match.anyValue(),
            }),
        ]),
    });

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
            Match.objectLike({
                Image: EcsInfra.getDefaultImageNameIpv4('orders', 'v2'),
                Environment: Match.arrayWith([
                    { Name: 'AWS_REGION', Value: AWSConstants.AWS_REGION },
                ]),
            }),
        ]),
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 8081,
        ToPort: 8081,
        IpProtocol: 'tcp',
        SourceSecurityGroupId: {
            'Fn::ImportValue': 'orders:ProxyLambdaSecurityGroupId',
        },
    });

    const ingressRules = collectSecurityGroupRules(template, 'ingress');
    expect(ingressRules).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                CidrIp: '0.0.0.0/0',
                FromPort: 8081,
                ToPort: 8081,
                IpProtocol: 'tcp',
            }),
            expect.objectContaining({
                CidrIp: '0.0.0.0/0',
                FromPort: 443,
                ToPort: 443,
                IpProtocol: 'tcp',
            }),
        ])
    );

    const egressRules = collectSecurityGroupRules(template, 'egress');
    expect(egressRules).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                CidrIp: '0.0.0.0/0',
                Description: 'Allow all outbound traffic by default',
                IpProtocol: '-1',
            }),
        ])
    );
});
