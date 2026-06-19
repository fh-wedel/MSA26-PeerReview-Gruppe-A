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

const policyFilePath = path.resolve(__dirname, '..', 'verified-permissions', 'user-policies.json');
const authStack = new AuthStack(app, 'UserAuthStack', {
  env,
  policyFilePath: policyFilePath,
  serviceName: serviceNameContext,
});

const apiStack = new ApiStack(app, 'UserApiStack', {
  env,
  apiName: 'UserServiceAPI',
  description: 'API Gateway for User service',
  targetServiceName: serviceNameContext,
  targetPort: containerPort,
  openApiSpecPath: '../src/main/resources/openapi/user.json',
  authorizerConfig: {
    policyStoreId: authStack.policyStore.policyStore.policyStoreId,
    namespace: authStack.policyConfig.namespace,
    tokenType: 'accessToken',
  },
});

apiStack.addDependency(authStack);

const serviceStack = new ServiceStack(app, 'UserServiceStack', {
  env,
  serviceName: serviceNameContext,
  imageVersion: imageTag,
  description: 'Central proxy for Cognito User Pool interactions',
  enablePublicIpV4: false,
  containerPort: containerPort,
  minTaskCount: 1,
  maxTaskCount: 2,
  memory: 512,
  cpu: 256,
});

serviceStack.addDependency(apiStack);