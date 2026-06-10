#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ServiceStack } from '../lib/service-stack';
import { AWSConstants } from '../../../infrabaseline/lib/constants';
import { ApiStack } from '../../../infraLibrary/lib/stacks/api/api';
import path from 'path';
import {
  AuthStack,
} from '../../../infraLibrary/lib/stacks/verified-permissions/auth-stack';

const app = new cdk.App();

const env = {
  account: AWSConstants.AWS_ACCOUNT_ID,
  region: AWSConstants.AWS_REGION
}

const imageContext = app.node.tryGetContext('imageTag');
const imageTag = imageContext || 'latest';

const serviceNameContext = app.node.tryGetContext('serviceName');
if (!serviceNameContext) {
  throw new Error('Service name context is required. Please provide it using -c serviceName=your-service-name');
}

const containerPort = 8081

const policyFilePath = path.resolve(__dirname, '..', 'verified-permissions', 'communication-policies.json');
const authStack = new AuthStack(app, 'CommunicationAuthStack', {
  env,
  policyFilePath: policyFilePath,
  serviceName: serviceNameContext,
});

const apiStack = new ApiStack(app, 'CommunicationApiStack', {
  env,
  apiName: 'CommunicationServiceAPI',
  description: 'API Gateway for Communication service',
  targetServiceName: serviceNameContext,
  targetPort: containerPort,
  openApiSpecPath: '../src/main/resources/openapi/communication.json',
  authorizerConfig: {
    policyStoreId: authStack.policyStore.policyStore.policyStoreId,
    namespace: authStack.policyConfig.namespace,
    tokenType: 'accessToken',
  },
});

apiStack.addDependency(authStack);

const serviceStack = new ServiceStack(app, 'CommunicationServiceStack', {
  env,
  serviceName: serviceNameContext,
  imageVersion: imageTag,
  description: 'This stack deploys the Communication Service',
  enablePublicIpV4: false,
  containerPort: containerPort,
  minTaskCount: 1,
  maxTaskCount: 2,
  memory: 512,
  cpu: 256,
});

serviceStack.addDependency(apiStack);