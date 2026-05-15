#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ServiceStack } from '../lib/service-stack';
import { AWSConstants } from '../../../infrabaseline/lib/constants';
import { ApiStack } from '../../../infraLibrary/lib/constructs/api/api';
import path from 'path/win32';


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

const apiGatewayStack = new ApiStack(app, 'TemplateApiStack', {
  env,
  apiName: 'TemplateServiceAPI',
  description: 'API Gateway for Template project',
  targetServiceName: serviceNameContext,
  targetPort: containerPort,
  openApiSpecPath: '../src/main/resources/openapi/template.json',
});

const serviceStack = new ServiceStack(app, 'TemplateServiceStack', {
  env,
  serviceName: serviceNameContext,
  imageVersion: imageTag,
  description: ' This stack is an example service for a microservice architecture.',
  enablePublicIpV4: false,
  containerPort: containerPort,
  requestQueueName: 'template-request-queue',
  responseQueueName: 'template-response-queue',
});

serviceStack.addDependency(apiGatewayStack);