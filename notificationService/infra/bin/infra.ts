#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { NotificationServiceStack } from '../lib/service-stack';
import { AWSConstants } from '../../../infrabaseline/lib/constants';
import { ApiStack } from '../../../infraLibrary/lib/stacks/api/api';
import { AuthStack } from '../../../infraLibrary/lib/stacks/verified-permissions/auth-stack';
import path from 'path';

const app = new cdk.App();

const env = {
  account: AWSConstants.AWS_ACCOUNT_ID,
  region: AWSConstants.AWS_REGION,
};

const imageContext = app.node.tryGetContext('imageTag');
const imageTag = imageContext || 'latest';

const serviceNameContext = app.node.tryGetContext('serviceName');
if (!serviceNameContext) {
  throw new Error('Service name context is required. Please provide it using -c serviceName=your-service-name');
}

const containerPort = 8081;

const policyFilePath = path.resolve(__dirname, '..', 'verified-permissions', 'notification-policies.json');
const authStack = new AuthStack(app, 'NotificationAuthStack', {
  env,
  policyFilePath,
  serviceName: serviceNameContext,
});

const apiStack = new ApiStack(app, 'NotificationApiStack', {
  env,
  apiName: 'NotificationServiceAPI',
  description: 'API Gateway for Notification service',
  targetServiceName: serviceNameContext,
  targetPort: containerPort,
  openApiSpecPath: '../src/main/resources/openapi/notification.json',
  authorizerConfig: {
    policyStoreId: authStack.policyStore.policyStore.policyStoreId,
    namespace: authStack.policyConfig.namespace,
    tokenType: 'accessToken',
  },
});

apiStack.addDependency(authStack);

const serviceStack = new NotificationServiceStack(app, 'NotificationServiceStack', {
  env,
  serviceName: serviceNameContext,
  imageVersion: imageTag,
  description: 'Notification service for multi-channel message dispatch',
  containerPort,
  requestQueueName: 'notification-request-queue',
  secretsName: 'msa26/notification/credentials',
  dynamoDbTableName: 'notification-service-notifications',
  minTaskCount: 1,
  maxTaskCount: 1,
  memory: 512,
  cpu: 256,
});

serviceStack.addDependency(apiStack);
