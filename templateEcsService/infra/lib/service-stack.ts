import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ImportedRessources } from '../../../infraLibrary/importedRessources';
import { EcsInfra } from '../../../infraLibrary/ecs';
import { SqsInfra } from '../../../infraLibrary/sqs';
import { LogsInfra } from '../../../infraLibrary/logs';
import pino from 'pino';
import { LogGroup } from 'aws-cdk-lib/aws-logs';

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
    const ecsCluster = ImportedRessources.getECSClusterByAttributes(this, vpc);

    let subnet: ec2.ISubnet;
    if (props.enablePublicIpV4) {
      logger.warn('Public IPv4 is enabled. The service will be accessible over the public internet. Ensure that this is intended and that appropriate security measures are in place. The costs will be higher compared to using private IPv6 connectivity.');
      subnet = EcsInfra.getIpV4Subnet(this);
    } else {
      subnet = EcsInfra.getIpV6Subnet(this);
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

    const containerPort = 8081;

    taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromRegistry(imageName),
      logging: LogsInfra.createEcsLogDriver(logGroup, props.serviceName),
      portMappings: [
        {
          containerPort: containerPort,
          protocol: ecs.Protocol.TCP,
        },
      ],
      environment: {
        'SQS_REQUEST_QUEUE': props.requestQueueName ?? '',
        'SQS_RESPONSE_QUEUE': props.responseQueueName ?? '',
        'SERVER_PORT': containerPort.toString(),
      },
      healthCheck: {
        command: ['CMD-SHELL', `wget -qO- http://localhost:${containerPort}/actuator/health || exit 1`],
        interval: cdk.Duration.seconds(15),
        timeout: cdk.Duration.seconds(5),
        retries: 5,
        startPeriod: cdk.Duration.seconds(60),
      }
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSg', {
      vpc,
      allowAllOutbound: false,
    });

    if (props.enablePublicIpV4) {
      ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(containerPort), 'Inbound HTTP IPv4');
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
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
    });

    EcsInfra.grantDefaultTaskRolePermissions(taskDefinition);

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
