import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs'
import * as iam from 'aws-cdk-lib/aws-iam';
import { AWSConstants } from '../../../infrabaseline/lib/constants';


export interface ServiceCreationProps extends cdk.StackProps {
  serviceName: string;
  imageVersion: string;
  enablePublicIpV4?: boolean;
}

export class ServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServiceCreationProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromVpcAttributes(this, 'BaselineVPC', {
      vpcId: cdk.Fn.importValue('Baseline:VpcId'),
      availabilityZones: [cdk.Fn.importValue('Baseline:AvailabilityZone')],
      publicSubnetIds: [cdk.Fn.importValue('Baseline:PublicIPV4SubnetId')],
      publicSubnetRouteTableIds: [cdk.Fn.importValue('Baseline:PublicIPV4SubnetRouteTableId')],
      privateSubnetIds: [cdk.Fn.importValue('Baseline:PrivateIPV6SubnetId')],
      privateSubnetRouteTableIds: [cdk.Fn.importValue('Baseline:PrivateIPV6SubnetRouteTableId')],
    });

    const ecsCluster = ecs.Cluster.fromClusterAttributes(this, 'EcsCluster', {
      clusterName: cdk.Fn.importValue('Baseline:ECSClusterName'),
      vpc: vpc,
    });

    let subnetId: string;
    let routeTableId: string;
    if (props.enablePublicIpV4) {
      subnetId = cdk.Fn.importValue('Baseline:PublicIPV4SubnetId');
      routeTableId = cdk.Fn.importValue('Baseline:PublicIPV4SubnetRouteTableId');
    } else {
      subnetId = cdk.Fn.importValue('Baseline:PrivateIPV6SubnetId');
      routeTableId = cdk.Fn.importValue('Baseline:PrivateIPV6SubnetRouteTableId');
    }
    const subnet = ec2.Subnet.fromSubnetAttributes(this, 'BaselinePrivateSubnet', {
      subnetId: subnetId,
      availabilityZone: cdk.Fn.importValue('Baseline:AvailabilityZone'),
      routeTableId: routeTableId,
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

    const imageName = props.enablePublicIpV4
      ? `${AWSConstants.ECR_REPOSITORY_PREFIX}fh-wedel/${props.serviceName}:${props.imageVersion}`
      : `${AWSConstants.AWS_ACCOUNT_ID}.dkr-ecr.${AWSConstants.AWS_REGION}.on.aws/fh-wedel/${props.serviceName}:${props.imageVersion}`;

    taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromRegistry(imageName),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `ecs-${props.serviceName}`,
        logGroup: logGroup,
      }),
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSg', {
      vpc,
      allowAllOutbound: false,
    });

    if (props.enablePublicIpV4) {
      ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Inbound HTTP IPv4');
      ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Inbound HTTPS IPv4');
      ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Outbound HTTP IPv4');
      ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Outbound HTTPS IPv4');
    } else {
      ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(443), 'Outbound HTTPS IPv6');
      ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(80), 'Outbound HTTP IPv6');
    }

    const ecsService = new ecs.FargateService(this, 'FargateService', {
      serviceName: props.serviceName,
      cluster: ecsCluster,
      taskDefinition: taskDefinition,
      assignPublicIp: props.enablePublicIpV4,
      desiredCount: 1,
      vpcSubnets: { subnets: [subnet] },
      circuitBreaker: {
        rollback: true,
      },
      securityGroups: [ecsSecurityGroup],
    });

    ecsService.taskDefinition.addToExecutionRolePolicy(new iam.PolicyStatement({
      actions: ['ecr:BatchCheckLayerAvailability', 'ecr:GetDownloadUrlForLayer', 'ecr:BatchGetImage'],
      resources: [`arn:aws:ecr:${AWSConstants.AWS_REGION}:${AWSConstants.AWS_ACCOUNT_ID}:repository/fh-wedel/${props.serviceName}`],
    }));

    ecsService.taskDefinition.addToExecutionRolePolicy(new iam.PolicyStatement({
      actions: ['ecr:GetAuthorizationToken'],
      resources: [`*`],
    }));
  }
}
