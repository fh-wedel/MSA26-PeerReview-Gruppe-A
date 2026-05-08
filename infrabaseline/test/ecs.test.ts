import * as cdk from 'aws-cdk-lib/core';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ECSClusterStack } from '../lib/ecs-stack';

test('ECS cluster is created with capacity providers', () => {
    const app = new cdk.App();
    const vpcStack = new cdk.Stack(app, 'VpcStack');
    const vpc = new ec2.Vpc(vpcStack, 'TestVpc');

    const stack = new ECSClusterStack(app, 'TestEcsStack', {
        vpc,
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ECS::Cluster', 1);

    template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'ecs-fh-wedel',
        ClusterSettings: [
            {
                Name: 'containerInsights',
                Value: 'disabled',
            },
        ],
    });

    template.hasResourceProperties('AWS::ECS::ClusterCapacityProviderAssociations', {
        CapacityProviders: ['FARGATE', 'FARGATE_SPOT'],
        DefaultCapacityProviderStrategy: [
            {
                CapacityProvider: 'FARGATE_SPOT',
                Weight: 0,
            },
        ],
    });

    const clusterId = template.getResourceId('AWS::ECS::Cluster');

    template.hasOutput('ECSClusterName', {
        Value: { Ref: clusterId },
        Export: {
            Name: 'Baseline:ECSClusterName',
        },
    });
});
