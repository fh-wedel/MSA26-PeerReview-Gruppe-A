import * as cdk from 'aws-cdk-lib/core';
import {Construct} from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import {ImportedRessources} from '../../../infraLibrary/lib/importedRessources';
import {EcsInfra} from '../../../infraLibrary/lib/ecs';
import {SqsInfra} from '../../../infraLibrary/lib/sqs';
import {LogsInfra} from '../../../infraLibrary/lib/logs';
import {AWSConstants} from '../../../infrabaseline/lib/constants';

export interface ResponseServiceStackProps extends cdk.StackProps {
  serviceName: string;
  imageVersion: string;
  containerPort: number;
  memory: number;
  cpu: number;
  minTaskCount: number;
  maxTaskCount: number;
  requestQueueName: string;
  submissionReadyQueueName: string;
  aiReviewQueueName: string;
  s3BucketName: string;
  dynamoDbTableName: string;
}

export class ResponseServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ResponseServiceStackProps) {
    super(scope, id, props);

    const vpc = ImportedRessources.getVpcByAttributes(this);
    const ecsCluster = ImportedRessources.getECSClusterByAttributes(this, vpc);
    const subnet = EcsInfra.getIpV6Subnet(this);

    const logGroup = LogsInfra.createLogGroup(this, {
      logGroupName: `/ecs/${props.serviceName}`,
    });

    // =============================================
    // DynamoDB Table (single-table design)
    //   - ReviewResult: PK SUBMISSION#{submissionId}, SK RESULT
    //   - GSI AuthorIndex(authorId, submissionId)
    // =============================================
    const resultsTable = new dynamodb.Table(this, 'ResultsTable', {
      tableName: props.dynamoDbTableName,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    resultsTable.addGlobalSecondaryIndex({
      indexName: 'AuthorIndex',
      partitionKey: { name: 'authorId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submissionId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // S3 Bucket for review documents
    const documentBucket = new s3.Bucket(this, 'ResponseDocumentsBucket', {
      bucketName: props.s3BucketName,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: props.memory,
      cpu: props.cpu,
      runtimePlatform: EcsInfra.getDefaultRuntimePlatform(),
    });

    const imageName = EcsInfra.getDefaultImageNameIpv6(props.serviceName, props.imageVersion);
    const containerPort = props.containerPort;

    // Internal service discovery namespace (internal.services AAAA records).
    // Used both for this service's own record and to build ECS-to-ECS target URLs.
    const cloudMapNamespace = ImportedRessources.getCloudMapNamespace(this);

    taskDefinition.addContainer('AppContainer', {
      containerName: props.serviceName,
      image: ecs.ContainerImage.fromRegistry(imageName),
      logging: LogsInfra.createEcsLogDriver(logGroup, props.serviceName),
      portMappings: [{ containerPort, protocol: ecs.Protocol.TCP }],
      environment: {
        'SQS_REQUEST_QUEUE': props.requestQueueName,
        'SQS_SUBMISSION_READY_QUEUE': props.submissionReadyQueueName,
        'SQS_AI_REVIEW_QUEUE': props.aiReviewQueueName,
        'SQS_NOTIFICATION_QUEUE': 'notification-request-queue',
        'SERVER_PORT': containerPort.toString(),
        'AWS_REGION': AWSConstants.AWS_REGION,
        'S3_BUCKET_NAME': props.s3BucketName,
        'DYNAMODB_TABLE_NAME': props.dynamoDbTableName,
        // ECS-to-ECS targets via internal.services AAAA records (NOT sc.internal).
        // Used to enrich review results: grading schema (workflow), examiner
        // (matching) and review deadline / end date (configuration).
        'WORKFLOW_SERVICE_URL': `http://workflow.${cloudMapNamespace.namespaceName}:8081`,
        'MATCHING_SERVICE_URL': `http://matching.${cloudMapNamespace.namespaceName}:8081`,
        'CONFIGURATION_SERVICE_URL': `http://configuration.${cloudMapNamespace.namespaceName}:8080`,
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

    EcsInfra.addAutoScalingToService(ecsService, props.minTaskCount, props.maxTaskCount, 75);

    EcsInfra.grantDefaultTaskRolePermissions(taskDefinition);

    // DynamoDB permissions
    resultsTable.grantReadWriteData(ecsService.taskDefinition.taskRole);

    // SQS Queue
    const requestQueues = SqsInfra.createQueue(this, {
      queueName: props.requestQueueName,
      enableDeadLetterQueue: true,
    });
    SqsInfra.grantReadPermissions(requestQueues, ecsService.taskDefinition.taskRole);

    const submissionReadyQueues = SqsInfra.createQueue(this, {
      queueName: props.submissionReadyQueueName,
      enableDeadLetterQueue: true,
    });
    SqsInfra.grantReadPermissions(submissionReadyQueues, ecsService.taskDefinition.taskRole);

    const aiReviewQueues = SqsInfra.createQueue(this, {
      queueName: props.aiReviewQueueName,
      enableDeadLetterQueue: true,
      visibilityTimeout: cdk.Duration.minutes(10), // Bedrock calls can take longer
    });
    SqsInfra.grantReadPermissions(aiReviewQueues, ecsService.taskDefinition.taskRole);
    SqsInfra.grantWritePermissions(aiReviewQueues, ecsService.taskDefinition.taskRole);

    // Grant Bedrock InvokeModel permissions
    ecsService.taskDefinition.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: ['arn:aws:bedrock:*::foundation-model/*'],
      })
    );

    // Grant S3 read access
    documentBucket.grantRead(ecsService.taskDefinition.taskRole);

    // Grant SQS SendMessage permissions to the notification request queue
    ecsService.taskDefinition.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl'],
        resources: [
          `arn:aws:sqs:${AWSConstants.AWS_REGION}:${AWSConstants.AWS_ACCOUNT_ID}:notification-request-queue`,
        ],
      }),
    );
  }
}
