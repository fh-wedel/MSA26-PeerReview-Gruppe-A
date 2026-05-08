import * as cdk from 'aws-cdk-lib/core';
import { Template } from 'aws-cdk-lib/assertions';
import { ECRRepositoryStack } from '../lib/ecr-stack';

test('ECR repositories are created', () => {
    const app = new cdk.App();
    const stack = new ECRRepositoryStack(app, 'TestEcrStack', {
        ecrRepositoryNames: ['service-a', 'service-b'],
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ECR::Repository', 2);

    template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'fh-wedel/service-a',
        ImageTagMutability: 'MUTABLE',
    });

    template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'fh-wedel/service-b',
        ImageTagMutability: 'MUTABLE',
    });
});

test('Single ECR repository is created', () => {
    const app = new cdk.App();
    const stack = new ECRRepositoryStack(app, 'TestEcrStack', {
        ecrRepositoryNames: ['service-a'],
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ECR::Repository', 1);

    template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'fh-wedel/service-a',
        ImageTagMutability: 'MUTABLE',
    });
});
