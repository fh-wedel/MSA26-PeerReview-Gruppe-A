import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { EcsInfra } from '../ecs';
import { AWSConstants } from '@shared/constants';

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

    expect(actions).toEqual(
        expect.arrayContaining([
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
        ])
    );
});
