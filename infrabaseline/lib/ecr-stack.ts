import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
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
                lifecycleRules: [
                    {
                        maxImageCount: 5,
                        tagStatus: ecr.TagStatus.ANY,
                        description: `Lifecycle rule to limit the number of images in the repository ${repositoryName} to 5. This helps to manage storage costs and keep the repository clean by automatically removing older images when new ones are pushed.`,
                    }
                ]
            });
        }
    }
}
