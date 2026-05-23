#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ServiceStack } from '../lib/service-stack';
import { AWSConstants } from '../../../infrabaseline/lib/constants';
import { ApiStack } from '../../../infraLibrary/lib/stacks/api/api';

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

const containerPort = 80;

const apiStack = new ApiStack(app, 'WebUiApiStack', {
  env,
  apiName: 'WebUiServiceAPI',
  description: 'API Gateway for Web UI service',
  targetServiceName: serviceNameContext,
  targetPort: containerPort,
  enableGreedyProxy: true,
});

const serviceStack = new ServiceStack(app, 'WebUiServiceStack', {
  env,
  serviceName: serviceNameContext,
  imageVersion: imageTag,
  description: 'ECS Fargate service for the PeerReview Web UI (React/Vite, served by Nginx).',
  enablePublicIpV4: false,
  containerPort: containerPort,
  minTaskCount: 1,
  maxTaskCount: 2,
  memory: 512,
  cpu: 256,
});

serviceStack.addDependency(apiStack);
