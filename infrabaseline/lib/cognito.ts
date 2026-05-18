
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface CognitoProps extends cdk.StackProps {
    userPoolName: string;
    appClientName: string;
    groups?: string[];
}

export class CognitoStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: CognitoProps) {
        super(scope, id, props);
        const userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: props.userPoolName,
            selfSignUpEnabled: true,
            autoVerify: { email: true },
            standardAttributes: {
                email: { required: true, mutable: false },
            },
            signInAliases: {
                username: true,
                email: true
            },
            mfa: cognito.Mfa.OFF,
            passwordPolicy: {
                minLength: 8,
            },
            email: cognito.UserPoolEmail.withCognito("stud106970@fh-wedel.de"),
            featurePlan: cognito.FeaturePlan.ESSENTIALS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            userVerification: {
                emailSubject: 'Verify your email for the Peer Review System',
                emailBody: 'Hello {username},<br><br>Please verify your email by clicking the link below:<br><br>{##Verify Email##}<br><br>Thank you!',
                emailStyle: cognito.VerificationEmailStyle.LINK,
            }
        });

        userPool.addDomain('CognitoDomain', {
            cognitoDomain: {
                domainPrefix: props.userPoolName.toLowerCase() + '-domain',
            },
            managedLoginVersion: cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN,
        });

        for (const groupName of props.groups ?? []) {
            new cognito.CfnUserPoolGroup(this, `Group${groupName}`, {
                groupName: groupName,
                userPoolId: userPool.userPoolId,
            });
        }

        const appClient = new cognito.UserPoolClient(this, 'AppClient', {
            userPool: userPool,
            generateSecret: false,
            userPoolClientName: props.appClientName,
            supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                },
                scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL],
            },
            authFlows: {
                userPassword: true,
                userSrp: true,
            },
        });

        const ManagedLoginBranding = new cognito.CfnManagedLoginBranding(this, 'ManagedLoginBranding', {
            userPoolId: userPool.userPoolId,
            clientId: appClient.userPoolClientId,

            useCognitoProvidedValues: true,

            /* // Wenn du eigene Farben, Logos etc. via CDK definieren willst, 
            // musst du 'useCognitoProvidedValues' weglassen oder auf 'false' setzen 
            // und stattdessen das 'settings'-Attribut nutzen:
            settings: {
                // ... komplexes JSON-Objekt mit dem Design ...
            }
            */
        });

        new cdk.CfnOutput(this, 'UserPoolId', {
            value: userPool.userPoolId,
            exportName: `${props.userPoolName}-UserPoolId`,
        });
        new cdk.CfnOutput(this, 'AppClientId', {
            value: appClient.userPoolClientId,
            exportName: `${props.appClientName}-AppClientId`,
        });
    }
}