import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs'
import * as iam from 'aws-cdk-lib/aws-iam';
import { AWSConstants } from '../../../infrabaseline/lib/constants';


export interface ServiceCreationProps extends cdk.StackProps {
  serviceName: string;
  imageVersion: string
}

export class ServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServiceCreationProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromVpcAttributes(this, 'BaselineVPC', {
      vpcId: cdk.Fn.importValue('Baseline:VpcId'),
      availabilityZones: [cdk.Fn.importValue('Baseline:AvailabilityZone')],
      publicSubnetIds: [cdk.Fn.importValue('Baseline:PublicSubnetId')],
      publicSubnetRouteTableIds: [cdk.Fn.importValue('Baseline:PublicSubnetRouteTableId')],
    });

    const ecsCluster = ecs.Cluster.fromClusterAttributes(this, 'EcsCluster', {
      clusterName: cdk.Fn.importValue('Baseline:ECSClusterName'),
      vpc: vpc,
    });

    const logGroup = new logs.LogGroup(this, 'EcsServiceLogGroup', {
      logGroupName: `/ecs/${props.serviceName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });
    taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromRegistry(`${AWSConstants.ECR_REPOSITORY_PREFIX}fh-wedel/${props.serviceName}:${props.imageVersion}`),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: `ecs-${props.serviceName}`, logGroup: logGroup }),
    });

    const ecsService = new ecs.FargateService(this, 'FargateService', {
      serviceName: props.serviceName,
      cluster: ecsCluster,
      taskDefinition: taskDefinition,
      assignPublicIp: true,
      desiredCount: 1,
    });

    ecsService.taskDefinition.addToExecutionRolePolicy(new iam.PolicyStatement({
      actions: ['ecr:GetAuthorizationToken', 'ecr:BatchCheckLayerAvailability', 'ecr:GetDownloadUrlForLayer', 'ecr:BatchGetImage'],
      resources: [`arn:aws:ecr:${AWSConstants.AWS_REGION}:${AWSConstants.AWS_ACCOUNT_ID}:repository/fh-wedel/${props.serviceName}`],
    }));
  }
}
