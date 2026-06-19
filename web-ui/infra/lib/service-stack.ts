import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { ImportedRessources } from '../../../infraLibrary/lib/importedRessources';
import { EcsInfra } from '../../../infraLibrary/lib/ecs';
import { LogsInfra } from '../../../infraLibrary/lib/logs';
import pino from 'pino';
import { AWSConstants } from '../../../infrabaseline/lib/constants';

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

    const userPoolId = cdk.Fn.importValue(`${AWSConstants.COGNITO_USER_POOL_NAME}-UserPoolId`);
    const appClientId = cdk.Fn.importValue(`${AWSConstants.COGNITO_APP_CLIENT_NAME}-AppClientId`);

    // Import the stable CloudFront distribution domain instead of the API Gateway URL
    const cloudfrontDomain = cdk.Fn.importValue('Baseline:CloudFrontDomainName');
    const webUrl = `https://${cloudfrontDomain}`;


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

    taskDefinition.addContainer('AppContainer', {
      containerName: props.serviceName,
      image: ecs.ContainerImage.fromRegistry(imageName),
      logging: LogsInfra.createEcsLogDriver(logGroup, props.serviceName),
      portMappings: [
        {
          containerPort: containerPort,
          protocol: ecs.Protocol.TCP,
        },
      ],
      environment: {
        'SERVER_PORT': containerPort.toString(),
        'AWS_REGION': AWSConstants.AWS_REGION,
        'COGNITO_CLIENT_ID': appClientId,
        'COGNITO_DOMAIN': `${AWSConstants.COGNITO_USER_POOL_NAME.toLowerCase()}-domain.auth.${AWSConstants.AWS_REGION}.amazoncognito.com`,
      },
      // Nginx health check: request the root path; exit 1 on failure
      healthCheck: {
        command: ['CMD-SHELL', `wget -qO- http://127.0.0.1:${containerPort}/ || exit 1`],
        interval: cdk.Duration.seconds(15),
        timeout: cdk.Duration.seconds(5),
        retries: 5,
        startPeriod: cdk.Duration.seconds(30),
      },
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
    }

    const lambdaSgId = cdk.Fn.importValue(`${props.serviceName}:ProxyLambdaSecurityGroupId`);
    const lambdaSg = ec2.SecurityGroup.fromSecurityGroupId(this, 'LambdaSg', lambdaSgId);
    ecsSecurityGroup.addIngressRule(lambdaSg, ec2.Port.tcp(containerPort), 'Allow incoming traffic from API Gateway proxy Lambda');

    const cloudMapNamespace = ImportedRessources.getCloudMapNamespace(this);
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

    const lambdaLogGroup = LogsInfra.createLogGroup(this, {
      logGroupName: `/aws/lambda/${props.serviceName}-update-cognito-client`,
    });

    // Custom Resource to dynamically update the Cognito App Client with the CloudFront URL
    const updateCognitoClientLambda = new lambda_nodejs.NodejsFunction(this, 'UpdateCognitoClientLambda', {
      functionName: `${AWSConstants.COGNITO_USER_POOL_NAME.toLowerCase()}-update-cognito-client`,
      description: `Custom Resource to dynamically update the Cognito App Client ${AWSConstants.COGNITO_APP_CLIENT_NAME} with the CloudFront URL.`,
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: path.join(__dirname, 'update-cognito-client.ts'),
      handler: 'handler',
      bundling: {
        format: lambda_nodejs.OutputFormat.CJS,
        target: 'node24'
      },
      environment: {
        USER_POOL_ID: userPoolId,
        CLIENT_ID: appClientId,
        CLIENT_NAME: AWSConstants.COGNITO_APP_CLIENT_NAME,
        WEB_URL: webUrl,
      },
      timeout: cdk.Duration.seconds(10),
      logGroup: lambdaLogGroup,
      memorySize: 256,
    });

    updateCognitoClientLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:UpdateUserPoolClient', 'cognito-idp:DescribeUserPoolClient'],
        resources: [
          `arn:aws:cognito-idp:${AWSConstants.AWS_REGION}:${AWSConstants.AWS_ACCOUNT_ID}:userpool/${userPoolId}`,
        ],
      })
    );

    const updateCognitoClientProvider = new cr.Provider(this, 'UpdateCognitoClientProvider', {
      onEventHandler: updateCognitoClientLambda,
    });

    new cdk.CustomResource(this, 'UpdateCognitoClientCR', {
      serviceToken: updateCognitoClientProvider.serviceToken,
      properties: {
        // We use these properties to trigger updates when they change
        UserPoolId: userPoolId,
        ClientId: appClientId,
        WebUrl: webUrl,
        Timestamp: Date.now().toString(), // Force execution on every deploy to ensure client is updated
      },
    });

    if (props.minTaskCount !== props.maxTaskCount) {
      logger.info(`Setting up auto-scaling for service ${props.serviceName} with min ${props.minTaskCount} and max ${props.maxTaskCount} tasks.`);
      if (!props.cpuTargetUtilizationPercent) {
        logger.warn('CPU target utilization percent not provided. Defaulting to 75%.');
      }
      EcsInfra.addAutoScalingToService(ecsService, props.minTaskCount, props.maxTaskCount, props.cpuTargetUtilizationPercent ?? 75);
    }
  }
}
