import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { ImportedRessources } from '../../../infraLibrary/lib/importedRessources';
import { EcsInfra } from '../../../infraLibrary/lib/ecs';
import { SqsInfra } from '../../../infraLibrary/lib/sqs';
import { LogsInfra } from '../../../infraLibrary/lib/logs';
import { AWSConstants } from '../../../infrabaseline/lib/constants';

export interface NotificationServiceStackProps extends cdk.StackProps {
  serviceName: string;
  imageVersion: string;
  containerPort: number;
  memory: number;
  cpu: number;
  minTaskCount: number;
  maxTaskCount: number;
  requestQueueName: string;
  secretsName: string;
}

export class NotificationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NotificationServiceStackProps) {
    super(scope, id, props);

    const vpc = ImportedRessources.getVpcByAttributes(this);
    const ecsCluster = ImportedRessources.getECSClusterByAttributes(this, vpc);
    const subnet = EcsInfra.getIpV6Subnet(this);

    const logGroup = LogsInfra.createLogGroup(this, {
      logGroupName: `/ecs/${props.serviceName}`,
    });

    // RDS PostgreSQL
    const dbCredentials = rds.Credentials.fromGeneratedSecret('notification_admin', {
      secretName: `${props.serviceName}/db-credentials`,
    });

    const dbInstance = new rds.DatabaseInstance(this, 'NotificationDb', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnets: [subnet] },
      databaseName: 'notification',
      credentials: dbCredentials,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // Import existing notification secrets
    const notificationSecrets = secretsmanager.Secret.fromSecretNameV2(
      this, 'NotificationSecrets', props.secretsName
    );

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: props.memory,
      cpu: props.cpu,
    });

    const imageName = EcsInfra.getDefaultImageNameIpv6(props.serviceName, props.imageVersion);
    const containerPort = props.containerPort;

    taskDefinition.addContainer('AppContainer', {
      containerName: props.serviceName,
      image: ecs.ContainerImage.fromRegistry(imageName),
      logging: LogsInfra.createEcsLogDriver(logGroup, props.serviceName),
      portMappings: [{ containerPort, protocol: ecs.Protocol.TCP }],
      environment: {
        'SQS_REQUEST_QUEUE': props.requestQueueName,
        'SERVER_PORT': containerPort.toString(),
        'AWS_REGION': AWSConstants.AWS_REGION,
        'SECRETS_NAME': props.secretsName,
        'DB_HOST': dbInstance.dbInstanceEndpointAddress,
        'DB_PORT': dbInstance.dbInstanceEndpointPort,
        'DB_NAME': 'notification',
      },
      secrets: {
        'DB_USERNAME': ecs.Secret.fromSecretsManager(dbCredentials.secret!, 'username'),
        'DB_PASSWORD': ecs.Secret.fromSecretsManager(dbCredentials.secret!, 'password'),
      },
      healthCheck: EcsInfra.springBootHealthCheckCommand(containerPort, cdk.Duration.seconds(90)),
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSg', {
      vpc,
      allowAllOutbound: true,
    });

    ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(443), 'Outbound HTTPS IPv6');
    ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(80), 'Outbound HTTP IPv6');
    ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.allTcp(), 'Outbound all TCP IPv6 (ECS-to-ECS)');

    const lambdaSgId = cdk.Fn.importValue(`${props.serviceName}:ProxyLambdaSecurityGroupId`);
    const lambdaSg = ec2.SecurityGroup.fromSecurityGroupId(this, 'LambdaSg', lambdaSgId);
    ecsSecurityGroup.addIngressRule(lambdaSg, ec2.Port.tcp(containerPort), 'Allow incoming from API Gateway Lambda');

    // Allow ECS to connect to RDS
    dbInstance.connections.allowFrom(ecsSecurityGroup, ec2.Port.tcp(5432), 'ECS to RDS');

    const cloudMapNamespace = ImportedRessources.getCloudMapNamespace(this);
    const sdService = EcsInfra.createServiceDiscoveryAAAARecord(this, props.serviceName, cloudMapNamespace);

    const ecsService = new ecs.FargateService(this, 'FargateService', {
      serviceName: props.serviceName + '-service',
      cluster: ecsCluster,
      taskDefinition,
      assignPublicIp: false,
      desiredCount: props.minTaskCount,
      vpcSubnets: { subnets: [subnet] },
      circuitBreaker: { rollback: true },
      securityGroups: [ecsSecurityGroup],
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
    });

    const cfnService = ecsService.node.defaultChild as ecs.CfnService;
    cfnService.serviceRegistries = [{ registryArn: sdService.attrArn }];

    EcsInfra.grantDefaultTaskRolePermissions(taskDefinition);

    // SQS Queue
    const requestQueues = SqsInfra.createQueue(this, {
      queueName: props.requestQueueName,
      enableDeadLetterQueue: true,
    });
    SqsInfra.grantReadPermissions(requestQueues, ecsService.taskDefinition.taskRole);

    // Grant Secrets Manager read access
    notificationSecrets.grantRead(ecsService.taskDefinition.taskRole);
  }
}
