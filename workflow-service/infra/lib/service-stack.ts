import * as cdk from 'aws-cdk-lib/core';
import {Construct} from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import {ImportedRessources} from '../../../infraLibrary/lib/importedRessources';
import {EcsInfra} from '../../../infraLibrary/lib/ecs';
import {LogsInfra} from '../../../infraLibrary/lib/logs';
import pino from 'pino';
import {AWSConstants} from '../../../infrabaseline/lib/constants';
import {SqsInfra} from '../../../infraLibrary/lib/sqs';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

export interface ServiceCreationProps extends cdk.StackProps {
  serviceName: string;
  imageVersion: string;
  containerPort: number;
  memory: number;
  cpu: number;
  minTaskCount: number;
  maxTaskCount: number;
  cpuTargetUtilizationPercent?: number;
  enablePublicIpV4?: boolean;
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
      memoryLimitMiB: props.memory,
      cpu: props.cpu,
      runtimePlatform: EcsInfra.getDefaultRuntimePlatform(),
    });

    const imageName = props.enablePublicIpV4
      ? EcsInfra.getDefaultImageNameIpv4(props.serviceName, props.imageVersion)
      : EcsInfra.getDefaultImageNameIpv6(props.serviceName, props.imageVersion);

    const containerPort = props.containerPort;

    const cloudMapNamespace = ImportedRessources.getCloudMapNamespace(this);

    const reviewTable = new dynamodb.Table(this, 'ReviewTable', {
      tableName: 'workflow-service-reviews',
      partitionKey: {name: 'pk', type: dynamodb.AttributeType.STRING},
      sortKey: {name: 'sk', type: dynamodb.AttributeType.STRING},
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      const workflowQueue = SqsInfra.createQueue(this, {
          queueName: 'workflow-request-queue',
          enableDeadLetterQueue: true,
          maxReceiveCount: 3,
      });

    taskDefinition.addContainer('AppContainer', {
      containerName: props.serviceName,
      image: ecs.ContainerImage.fromRegistry(imageName),
      logging: LogsInfra.createEcsLogDriver(logGroup, props.serviceName),
      portMappings: [
        {
          name: 'app-port',
          containerPort: containerPort,
          protocol: ecs.Protocol.TCP,
        },
      ],
      environment: {
        'SERVER_PORT': containerPort.toString(),
        "AWS_REGION": AWSConstants.AWS_REGION,
        'CONFIGURATION_SERVICE_URL': `http://configuration.${cloudMapNamespace.namespaceName}:8080`,
        'MATCHING_SERVICE_URL': `http://matching.${cloudMapNamespace.namespaceName}:8081`,
        'DYNAMODB_TABLE_NAME': reviewTable.tableName,
        'AWS_SQS_WORKFLOW_REQUEST_QUEUE_NAME': workflowQueue.queue.queueName,
        'AWS_USE_DUALSTACK_ENDPOINT': 'true',
      },
      healthCheck: EcsInfra.springBootHealthCheckCommand(containerPort, cdk.Duration.seconds(90)),
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSg', {
      vpc,
      allowAllOutbound: true,
    });

    if (props.enablePublicIpV4) {
      ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(containerPort), 'Inbound HTTP IPv4');
      ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Inbound HTTPS IPv4');
      ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Outbound HTTP IPv4');
      ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Outbound HTTPS IPv4');
    } else {
      ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(443), 'Outbound HTTPS IPv6');
      ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(80), 'Outbound HTTP IPv6');
      ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.allTcp(), 'Outbound all TCP IPv6 (ECS-to-ECS)');
    }

    const lambdaSgId = cdk.Fn.importValue(`${props.serviceName}:ProxyLambdaSecurityGroupId`);
    const lambdaSg = ec2.SecurityGroup.fromSecurityGroupId(this, 'LambdaSg', lambdaSgId);
    ecsSecurityGroup.addIngressRule(lambdaSg, ec2.Port.tcp(containerPort), 'Allow incoming traffic from API Gateway proxy Lambda');
    // Allow ECS-to-ECS calls over IPv6 via the internal.services AAAA records.
    // Service Connect does not support IPv6-only subnets, so callers resolve the
    // CloudMap AAAA record and connect directly over IPv6.
    // Inbound IPv6 from the internet is blocked at the network level (no inbound
    // route on the IPv6-only private subnet — only an Egress-Only IGW exists).
    ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(containerPort), 'Inbound HTTP IPv6 from VPC services (ECS-to-ECS via AAAA record)');

    const sdService = EcsInfra.createServiceDiscoveryAAAARecord(this, props.serviceName, cloudMapNamespace);

    const ecsService = new ecs.FargateService(this, 'FargateService', {
      serviceName: props.serviceName + '-service',
      cluster: ecsCluster,
      taskDefinition: taskDefinition,
      assignPublicIp: props.enablePublicIpV4,
      desiredCount: props.minTaskCount,
      vpcSubnets: { subnets: [subnet] },
      circuitBreaker: {
        rollback: true,
      },
      securityGroups: [ecsSecurityGroup],
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
    });

    const cfnService = ecsService.node.defaultChild as ecs.CfnService;
    cfnService.serviceRegistries = [
      {
        registryArn: sdService.attrArn,
      },
    ];


    EcsInfra.grantDefaultTaskRolePermissions(taskDefinition);

      reviewTable.grantReadWriteData(taskDefinition.taskRole);
      SqsInfra.grantReadPermissions(workflowQueue, taskDefinition.taskRole);

    if (props.minTaskCount !== props.maxTaskCount) {
      logger.info(`Setting up auto-scaling for service ${props.serviceName} with min ${props.minTaskCount} and max ${props.maxTaskCount} tasks.`);
      if (!props.cpuTargetUtilizationPercent) {
        logger.warn("CPU target utilization percent not provided. Defaulting to 75%.");
      }
      EcsInfra.addAutoScalingToService(ecsService, props.minTaskCount, props.maxTaskCount, props.cpuTargetUtilizationPercent ?? 75);
    }
  }
}
