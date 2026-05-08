import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ImportedRessources } from '../../../infraLibrary/importedRessources';
import { EcsInfra } from '../../../infraLibrary/ecs';
import { SqsInfra } from '../../../infraLibrary/sqs';
import { LogsInfra } from '../../../infraLibrary/logs';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

export interface ServiceCreationProps extends cdk.StackProps {
  serviceName: string;
  imageVersion: string;
  enablePublicIpV4?: boolean;
  requestQueueName?: string;
  responseQueueName?: string;
}

export class ServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServiceCreationProps) {
    super(scope, id, props);

    const vpc = ImportedRessources.getVpcByAttributes(this);
    const ecsCluster = ImportedRessources.getECSClusterByAttributes(this);

    let subnet: ec2.ISubnet;
    if (props.enablePublicIpV4) {
      logger.warn('Public IPv4 is enabled. The service will be accessible over the public internet. Ensure that this is intended and that appropriate security measures are in place. The costs will be higher compared to using private IPv6 connectivity.');
      subnet = EcsInfra.getIpV4Subnet();
    } else {
      subnet = EcsInfra.getIpV6Subnet();
    }

    const logGroup = LogsInfra.createLogGroup(this, {
      logGroupName: `/ecs/${props.serviceName}`,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const imageName = props.enablePublicIpV4
      ? EcsInfra.getDefaultImageNameIpv4(props.serviceName, props.imageVersion)
      : EcsInfra.getDefaultImageNameIpv6(props.serviceName, props.imageVersion);

    taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromRegistry(imageName),
      logging: LogsInfra.createEcsLogDriver(logGroup, props.serviceName),
      portMappings: [
        {
          containerPort: 8080,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSg', {
      vpc,
      allowAllOutbound: false,
    });

    if (props.enablePublicIpV4) {
      ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'Inbound HTTP IPv4');
      ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Inbound HTTPS IPv4');
      ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Outbound HTTP IPv4');
      ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Outbound HTTPS IPv4');
    } else {
      ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(8080), 'Inbound HTTP IPv6');
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

    if (props.requestQueueName) {
      const requestQueues = SqsInfra.createQueue(this, {
        queueName: props.requestQueueName,
        enableDeadLetterQueue: false,
      });

      SqsInfra.grantReadPermissions(requestQueues, ecsService.taskDefinition.taskRole);
    }

    if (props.responseQueueName) {
      const responseQueues = SqsInfra.createQueue(this, {
        queueName: props.responseQueueName,
        enableDeadLetterQueue: false,
      });

      SqsInfra.grantWritePermissions(responseQueues, ecsService.taskDefinition.taskRole);
    }
  }
}
