import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { ContainerInsights } from 'aws-cdk-lib/aws-ecs';


export interface ECSClusterStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class ECSClusterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ECSClusterStackProps) {
    super(scope, id, props);

    const clusterCreationProps: ecs.ClusterProps = {
      clusterName: 'ecs-fh-wedel',
      vpc: props.vpc,
      containerInsightsV2: ContainerInsights.DISABLED,
      enableFargateCapacityProviders: true,
    };
    const cluster = new ecs.Cluster(this, 'ECSCluster', clusterCreationProps);

    cluster.addDefaultCapacityProviderStrategy(
      [{
        capacityProvider: 'FARGATE_SPOT',
        weight: 0,
      }]
    );

    new cdk.CfnOutput(this, 'ECSClusterName', {
      value: cluster.clusterName,
      description: 'Name of the ECS Cluster',
      exportName: 'Baseline:ECSClusterName',
    });
  }
}
