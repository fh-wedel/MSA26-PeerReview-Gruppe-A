import { CognitoIdentityProviderClient, UpdateUserPoolClientCommand, DescribeUserPoolClientCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';
import { AWSConstants } from '../../../infrabaseline/lib/constants';

const cognito = new CognitoIdentityProviderClient({});

async function sendResponse(
  event: CloudFormationCustomResourceEvent,
  context: Context,
  responseStatus: 'SUCCESS' | 'FAILED',
  responseData: { Message: string },
) {
  const responseBody = JSON.stringify({
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: event.RequestType === 'Update' ? event.PhysicalResourceId : `${event.StackId}-UpdateCognitoClient`,
    Status: responseStatus,
    Reason: `${responseData.Message}. See the details in CloudWatch Log Stream: ${context.logStreamName}`,
    Data: responseData,
  });

  try {
    await fetch(event.ResponseURL, {
      method: 'put',
      body: responseBody,
      headers: {
        'Content-Type': '',
        'Content-Length': `${responseBody.length}`,
      },
    });
  } catch (error) {
    console.log('Error sending response to CloudFormation:', error);
  }
}

export async function handler(event: CloudFormationCustomResourceEvent, context: Context) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  if (event.RequestType === 'Delete') {
    await sendResponse(event, context, 'SUCCESS', { Message: 'Nothing to delete' });
    return;
  }

  const userPoolId = process.env.USER_POOL_ID;
  const clientId = process.env.CLIENT_ID;
  const clientName = process.env.CLIENT_NAME;
  const webUrl = process.env.WEB_URL;

  if (!userPoolId || !clientId || !clientName || !webUrl) {
    await sendResponse(event, context, 'FAILED', { Message: 'Missing required environment variables' });
    return;
  }

  try {
    const describeCommand = new DescribeUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
    });
    const { UserPoolClient } = await cognito.send(describeCommand);

    if (!UserPoolClient) {
      throw new Error('UserPoolClient not found');
    }

    AWSConstants.DNS_DOMAIN_NAME

    const updateCommand = new UpdateUserPoolClientCommand({
      ...UserPoolClient,
      UserPoolId: userPoolId,
      ClientId: clientId,
      ClientName: clientName,
      CallbackURLs: [webUrl, `${webUrl}/`, `{AWSConstants.DNS_DOMAIN_NAME}`, `{AWSConstants.DNS_DOMAIN_NAME}/`, 'http://localhost:5173/'],
      LogoutURLs: [webUrl, `${webUrl}/`, `{AWSConstants.DNS_DOMAIN_NAME}`, `{AWSConstants.DNS_DOMAIN_NAME}/, 'http://localhost:5173/'],
      AllowedOAuthFlowsUserPoolClient: true,
      SupportedIdentityProviders: ['COGNITO'],
      AllowedOAuthFlows: ['code'],
      AllowedOAuthScopes: ['openid', 'email'],
      ExplicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_USER_SRP_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH'
      ],
    });

    // Remove read-only properties returned by DescribeUserPoolClient that cause Update to fail
    delete (updateCommand.input as any).CreationDate;
    delete (updateCommand.input as any).LastModifiedDate;
    delete (updateCommand.input as any).ClientSecret;

    await cognito.send(updateCommand);

    await sendResponse(event, context, 'SUCCESS', { Message: 'Successfully updated User Pool Client' });
  } catch (error) {
    console.error('Error updating User Pool Client:', error);
    await sendResponse(event, context, 'FAILED', {
      Message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
