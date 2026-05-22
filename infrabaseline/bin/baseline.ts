#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { NetworkStack } from '../lib/network-stack';
import { ECSClusterStack } from '../lib/ecs-stack';
import { AWSConstants } from '../lib/constants';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { ECRRepositoryStack } from '../lib/ecr-stack';
import { GithubCIConfig } from '../lib/github-ci-config';
import { CloudMapStack } from '../lib/cloudmap';
import { CognitoStack } from '../lib/cognito';

const app = new cdk.App();

const env = {
  account: AWSConstants.AWS_ACCOUNT_ID,
  region: AWSConstants.AWS_REGION
}

const networkStack = new NetworkStack(app, 'BaselineNetworkStack', { env });

const ecrRepositoryNames = ['template'];
const ecrRepositoryStack = new ECRRepositoryStack(app, 'BaselineECRRepositoryStack', {
  env,
  ecrRepositoryNames: ecrRepositoryNames,
});

const vpcId = cdk.Fn.importValue('Baseline:VpcId');
const vpc = ec2.Vpc.fromVpcAttributes(networkStack, 'BaselineVPC', {
  vpcId: vpcId,
  availabilityZones: [AWSConstants.AVAILABILITY_ZONE],
  publicSubnetIds: [cdk.Fn.importValue('Baseline:PublicSubnetId')],
  publicSubnetRouteTableIds: [cdk.Fn.importValue('Baseline:PublicSubnetRouteTableId')],
});

const ecsClusterStack = new ECSClusterStack(app, 'BaselineECSClusterStack', {
  env,
  vpc: vpc,
});

ecsClusterStack.addDependency(networkStack);
ecsClusterStack.addDependency(ecrRepositoryStack);

const githubCIConfigStack = new GithubCIConfig(app, 'BaselineGithubCIConfigStack', { env });

const cloudMapStack = new CloudMapStack(app, 'BaselineCloudMapStack', {
  env,
  namespaceName: 'internal.services',
});

const cognitoStack = new CognitoStack(app, 'BaselineCognitoStack', {
  env,
  userPoolName: AWSConstants.COGNITO_USER_POOL_NAME,
  appClientName: AWSConstants.COGNITO_APP_CLIENT_NAME,
  groups: ['Admin', 'Student', 'Guest', 'Teacher', 'ExaminationOfficer'],
});
