import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';


export interface ECRRepositoryStackProps extends cdk.StackProps {
    ecrRepositoryNames: string[];
}

export class ECRRepositoryStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ECRRepositoryStackProps) {
        super(scope, id, props);

        for (const repositoryName of props.ecrRepositoryNames) {
            new ecr.Repository(this, `ECRRepository-${repositoryName}`, {
                repositoryName: `fh-wedel/${repositoryName}`,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                emptyOnDelete: true,
                imageTagMutability: ecr.TagMutability.MUTABLE,
            });
        }
    }
}
