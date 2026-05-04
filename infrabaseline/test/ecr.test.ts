import * as cdk from 'aws-cdk-lib/core';
import { Template } from 'aws-cdk-lib/assertions';
import { ECRRepositoryStack } from '../lib/ecr-stack';

test('ECR two Repositories Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new ECRRepositoryStack(app, 'TestEcrStack', {
        ecrRepositoryNames: ['service-a', 'service-b'],
    });
    // THEN
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

test('ECR one Repository Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new ECRRepositoryStack(app, 'TestEcrStack', {
        ecrRepositoryNames: ['service-a'],
    });
    // THEN
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ECR::Repository', 1);

    template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'fh-wedel/service-a',
        ImageTagMutability: 'MUTABLE',
    });
});
