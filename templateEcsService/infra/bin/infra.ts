#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ServiceStack } from '../lib/service-stack';
import { AWSConstants } from '../../../infrabaseline/lib/constants';

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


const serviceStack = new ServiceStack(app, 'TemplateServiceStack', {
  env,
  serviceName: serviceNameContext,
  imageVersion: imageTag,
  description: ' This stack is an example service for a microservice architecture.',
  enablePublicIpV4: false,
  requestQueueName: 'template-request-queue',
  responseQueueName: 'template-response-queue',
});