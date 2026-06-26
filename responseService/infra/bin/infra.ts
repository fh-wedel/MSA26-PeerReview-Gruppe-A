#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import {ResponseServiceStack} from '../lib/service-stack';
import {AWSConstants} from '../../../infrabaseline/lib/constants';
import {ApiStack} from '../../../infraLibrary/lib/stacks/api/api';
import {AuthStack} from '../../../infraLibrary/lib/stacks/verified-permissions/auth-stack';
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

const policyFilePath = path.resolve(__dirname, '..', 'verified-permissions', 'response-policies.json');
const authStack = new AuthStack(app, 'ResponseAuthStack', {
  env,
  policyFilePath,
  serviceName: serviceNameContext,
});

const apiStack = new ApiStack(app, 'ResponseApiStack', {
  env,
  apiName: 'ResponseServiceAPI',
  description: 'API Gateway for Response service',
  targetServiceName: serviceNameContext,
  targetPort: containerPort,
  openApiSpecPath: '../src/main/resources/openapi/response.json',
  authorizerConfig: {
    policyStoreId: authStack.policyStore.policyStore.policyStoreId,
    namespace: authStack.policyConfig.namespace,
    tokenType: 'accessToken',
  },
});

apiStack.addDependency(authStack);

const serviceStack = new ResponseServiceStack(app, 'ResponseServiceStack', {
  env,
  serviceName: serviceNameContext,
  imageVersion: imageTag,
  description: 'Response service for storing and exposing review results',
  containerPort,
  requestQueueName: 'response-request-queue',
  submissionReadyQueueName: 'submission-ready-queue',
  aiReviewQueueName: 'response-ai-review-queue',
  s3BucketName: 'msa26-peer-review-response-documents',
  dynamoDbTableName: 'response-service-results',
  minTaskCount: 1,
  maxTaskCount: 2,
  memory: 512,
  cpu: 256,
});

serviceStack.addDependency(apiStack);
