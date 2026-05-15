import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { EcsInfra } from '../lib/ecs';
import { AWSConstants } from '../../infrabaseline/lib/constants';

test('Default image names use expected registries', () => {
    const ipv4 = EcsInfra.getDefaultImageNameIpv4('orders', 'v1');
    const ipv6 = EcsInfra.getDefaultImageNameIpv6('orders', 'v1');

    expect(ipv4).toBe(`${AWSConstants.ECR_REPOSITORY_PREFIX}fh-wedel/orders:v1`);
    expect(ipv6).toBe(
        `${AWSConstants.AWS_ACCOUNT_ID}.dkr-ecr.${AWSConstants.AWS_REGION}.on.aws/fh-wedel/orders:v1`
    );
});

test('grantDefaultTaskRolePermissions adds ECR permissions', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const taskDefinition = new ecs.FargateTaskDefinition(stack, 'TaskDef', {
        memoryLimitMiB: 512,
        cpu: 256,
    });

    taskDefinition.addContainer('AppContainer', {
        image: ecs.ContainerImage.fromRegistry(
            EcsInfra.getDefaultImageNameIpv4('orders', 'v1')
        ),
        memoryLimitMiB: 256,
    });

    EcsInfra.grantDefaultTaskRolePermissions(taskDefinition);

    const template = Template.fromStack(stack);
    const policies = template.findResources('AWS::IAM::Policy') as Record<string, any>;
    const statements = Object.values(policies).flatMap(
        (policy) => policy.Properties.PolicyDocument.Statement ?? []
    );
    const actions = statements.flatMap((statement: any) =>
        Array.isArray(statement.Action) ? statement.Action : [statement.Action]
    );
    const resources = statements.flatMap((statement: any) =>
        Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource]
    );

    expect(actions).toEqual(
        expect.arrayContaining([
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
        ])
    );

    const serializedResources = resources.map((resource) => JSON.stringify(resource));

    expect(resources).toEqual(expect.arrayContaining(['*']));
    expect(
        serializedResources.some((resource) => resource.includes('repository/fh-wedel/orders'))
    ).toBe(true);
});

test('createServiceDiscoveryAAAARecord creates a DNS AAAA service', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const namespace = servicediscovery.PrivateDnsNamespace.fromPrivateDnsNamespaceAttributes(
        stack,
        'Namespace',
        {
            namespaceId: 'ns-1234567890',
            namespaceName: 'internal.local',
            namespaceArn: 'arn:aws:servicediscovery:eu-north-1:123456789012:namespace/ns-1234567890',
        }
    );

    EcsInfra.createServiceDiscoveryAAAARecord(stack, 'orders', namespace);

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ServiceDiscovery::Service', 1);
    template.hasResourceProperties('AWS::ServiceDiscovery::Service', {
        Name: 'orders',
        NamespaceId: 'ns-1234567890',
        DnsConfig: Match.objectLike({
            RoutingPolicy: 'MULTIVALUE',
            DnsRecords: Match.arrayWith([
                Match.objectLike({
                    Type: 'AAAA',
                    TTL: 30,
                }),
            ]),
        }),
        HealthCheckCustomConfig: Match.objectLike({
            FailureThreshold: 1,
        }),
    });
});
