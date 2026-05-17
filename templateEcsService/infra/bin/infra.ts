#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ServiceStack } from '../lib/service-stack';
import { AWSConstants } from '../../../infrabaseline/lib/constants';
import { ApiStack } from '../../../infraLibrary/lib/constructs/api/api';
import path from 'path/win32';
import {
  VerifiedPermissionsStore,
  VerifiedPermissionsPolicySet,
  loadVerifiedPermissionsPolicyFile,
} from '../../../infraLibrary/lib/constructs/verified-permissions/verified-permissions';


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

const policyFilePath = path.join(__dirname, '..', 'verified-permissions', 'template-policies.json');
const policyConfig = loadVerifiedPermissionsPolicyFile(policyFilePath);

const authStack = new cdk.Stack(app, 'TemplateAuthStack', { env });
const userPoolId = cdk.Fn.importValue(`${AWSConstants.COGNITO_USER_POOL_NAME}-UserPoolId`);
const appClientId = cdk.Fn.importValue(`${AWSConstants.COGNITO_APP_CLIENT_NAME}-AppClientId`);

const policyStore = new VerifiedPermissionsStore(authStack, 'TemplatePolicyStore', {
  namespace: policyConfig.namespace,
  userPoolId: userPoolId,
  description: 'Policy store for Template service API',
  appClientId: appClientId,
  policies: policyConfig.policies,
  validationMode: 'STRICT',
});

new VerifiedPermissionsPolicySet(authStack, 'TemplateApiPolicies', {
  namespace: policyConfig.namespace,
  policyStore: policyStore.policyStore,
  userPoolId: userPoolId,
  policies: policyConfig.policies,
  resourceId: policyConfig.resourceId,
  entityTypeNames: policyConfig.entityTypeNames,
});

const apiGatewayStack = new ApiStack(app, 'TemplateApiStack', {
  env,
  apiName: 'TemplateServiceAPI',
  description: 'API Gateway for Template project',
  targetServiceName: serviceNameContext,
  targetPort: containerPort,
  openApiSpecPath: '../src/main/resources/openapi/template.json',
  authorizerConfig: {
    policyStoreId: policyStore.policyStore.policyStoreId,
    namespace: policyConfig.namespace,
    tokenType: 'accessToken',
  },
});

apiGatewayStack.addDependency(authStack);

const serviceStack = new ServiceStack(app, 'TemplateServiceStack', {
  env,
  serviceName: serviceNameContext,
  imageVersion: imageTag,
  description: ' This stack is an example service for a microservice architecture.',
  enablePublicIpV4: false,
  containerPort: containerPort,
  requestQueueName: 'template-request-queue',
  responseQueueName: 'template-response-queue',
  minTaskCount: 1,
  maxTaskCount: 2,
  memory: 512,
  cpu: 256,
});

serviceStack.addDependency(apiGatewayStack);