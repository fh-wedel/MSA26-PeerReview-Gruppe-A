
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { LogsInfra } from '../../infraLibrary/lib/logs';

export interface CognitoProps extends cdk.StackProps {
    userPoolName: string;
    appClientName: string;
    groups?: string[];
}

export class CognitoStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: CognitoProps) {
        super(scope, id, props);


        const lambdaLogGroup = LogsInfra.createLogGroup(this, {
            logGroupName: `/lambda/${props.userPoolName}`,
        });
        const customMessageLambda = new lambda.Function(this, 'CustomSignUpMessageTrigger', {
            functionName: `CustomSignUpMessageTrigger-${props.userPoolName}`,
            runtime: lambda.Runtime.NODEJS_24_X,
            handler: 'index.handler',
            logGroup: lambdaLogGroup,
            code: lambda.Code.fromInline(`
                exports.handler = async (event) => {
                    if (event.triggerSource === "CustomMessage_SignUp") {
                        const username = event.userName;
                        event.response.emailSubject = "Verify your email for the Peer Review System";
                        
                        const emailMessage = 
                            '<div style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 40px 20px; color: #333333;">' +
                                '<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">' +
                                    
                                    '<div style="background-color: #0056b3; padding: 25px; text-align: center;">' +
                                        '<h2 style="color: #ffffff; margin: 0; font-size: 24px;">Peer Review System</h2>' +
                                    '</div>' +
                                    
                                    '<div style="padding: 30px; font-size: 16px; line-height: 1.6;">' +
                                        '<p style="margin-top: 0;">Hello <strong>' + username + '</strong>,</p>' +
                                        '<p>Welcome! We are excited to have you on board. Please verify your email address to fully activate your account and get started.</p>' +
                                        
                                        '<div style="text-align: center; margin: 35px 0; padding: 20px; background-color: #f8f9fa; border-radius: 5px; border: 1px dashed #cccccc; font-size: 18px; font-weight: bold;">' +
                                            '{##Verify Email##}' +
                                        '</div>' +
                                        
                                        '<p>If you did not request an account, you can safely ignore this email.</p>' +
                                        '<p style="margin-bottom: 0;">Best regards,<br><strong>The Peer Review Team</strong></p>' +
                                    '</div>' +
                                    
                                    '<div style="background-color: #f4f4f7; padding: 15px; text-align: center; font-size: 12px; color: #888888;">' +
                                        '&copy; 2026 Peer Review System. All rights reserved.' +
                                    '</div>' +
                                    
                                '</div>' +
                            '</div>';

                        event.response.emailMessage = emailMessage;
                    }
                    return event;
                };
            `),
        });

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
                emailStyle: cognito.VerificationEmailStyle.LINK,
            },
            lambdaTriggers: {
                customMessage: customMessageLambda,
            },
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