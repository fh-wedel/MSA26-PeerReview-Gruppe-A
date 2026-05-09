import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';


export class GithubCIConfig extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const gitHubOIDCIProvider = new iam.OpenIdConnectProvider(this, 'GitHubOIDCProvider', {
            url: 'https://token.actions.githubusercontent.com',
            clientIds: ['sts.amazonaws.com'],
        });

        const githubActionsRole = new iam.Role(this, 'GithubActionsRole', {
            description: 'Role for GitHub Actions to deploy the cdk stacks',
            roleName: 'GithubActionsRole',
            maxSessionDuration: cdk.Duration.hours(1),
            assumedBy: new iam.WebIdentityPrincipal('arn:aws:iam::' + cdk.Aws.ACCOUNT_ID + ':oidc-provider/token.actions.githubusercontent.com', {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                },
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": "repo:fh-wedel/MSA26-PeerReview-Gruppe-A:*"
                }

            }),
        });

        githubActionsRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));

    }
}