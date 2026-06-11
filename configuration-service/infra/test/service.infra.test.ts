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

test('Service stack uses IPv6 defaults and creates DynamoDB table', () => {
    const app = new cdk.App();
    const stack = new ServiceStack(app, 'TestServiceStack', {
        serviceName: 'configuration',
        imageVersion: 'v1',
        enablePublicIpV4: false,
        containerPort: 8080,
        memory: 512,
        cpu: 256,
        minTaskCount: 1,
        maxTaskCount: 2,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::DynamoDB::Table', 1);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'configuration-service-configs',
        KeySchema: [
            { AttributeName: 'pk', KeyType: 'HASH' },
            { AttributeName: 'sk', KeyType: 'RANGE' }
        ],
        GlobalSecondaryIndexes: [
            Match.objectLike({
                IndexName: 'AuthorIndex',
                KeySchema: [
                    { AttributeName: 'authorId', KeyType: 'HASH' },
                    { AttributeName: 'submissionId', KeyType: 'RANGE' }
                ]
            })
        ]
    });

    template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/configuration',
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
    });

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
            Match.objectLike({
                Name: 'configuration',
                Image: EcsInfra.getDefaultImageNameIpv6('configuration', 'v1'),
                PortMappings: Match.arrayWith([
                    Match.objectLike({
                        ContainerPort: 8080,
                        Protocol: 'tcp',
                    }),
                ]),
                Environment: Match.arrayWith([
                    { Name: 'SQS_MATCHING_REQUEST_QUEUE', Value: 'matching-request-queue' },
                    { Name: 'DYNAMODB_TABLE_NAME', Value: 'configuration-service-configs' },
                    { Name: 'SERVER_PORT', Value: '8080' },
                    { Name: 'AWS_REGION', Value: AWSConstants.AWS_REGION },
                ]),
                HealthCheck: Match.objectLike({
                    Command: [
                        'CMD-SHELL',
                        'wget -qO- http://localhost:8080/actuator/health || exit 1',
                    ],
                }),
            }),
        ]),
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 8080,
        ToPort: 8080,
        IpProtocol: 'tcp',
        SourceSecurityGroupId: {
            'Fn::ImportValue': 'configuration:ProxyLambdaSecurityGroupId',
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
        serviceName: 'configuration',
        imageVersion: 'v2',
        enablePublicIpV4: true,
        containerPort: 8080,
        memory: 512,
        cpu: 256,
        minTaskCount: 1,
        maxTaskCount: 2,
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::ECS::Service', {
        NetworkConfiguration: {
            AwsvpcConfiguration: Match.objectLike({
                AssignPublicIp: 'ENABLED',
            }),
        },
    });

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
            Match.objectLike({
                Image: EcsInfra.getDefaultImageNameIpv4('configuration', 'v2'),
                Environment: Match.arrayWith([
                    { Name: 'AWS_REGION', Value: AWSConstants.AWS_REGION },
                ]),
            }),
        ]),
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 8080,
        ToPort: 8080,
        IpProtocol: 'tcp',
        SourceSecurityGroupId: {
            'Fn::ImportValue': 'configuration:ProxyLambdaSecurityGroupId',
        },
    });

    const ingressRules = collectSecurityGroupRules(template, 'ingress');
    expect(ingressRules).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                CidrIp: '0.0.0.0/0',
                FromPort: 8080,
                ToPort: 8080,
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
});
