import { CognitoIdentityProviderClient, UpdateUserPoolClientCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';

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
    const command = new UpdateUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      ClientName: clientName,
      SupportedIdentityProviders: ['COGNITO'],
      AllowedOAuthFlows: ['code'],
      AllowedOAuthScopes: ['openid', 'email'],
      AllowedOAuthFlowsUserPoolClient: true,
      CallbackURLs: [webUrl, 'http://localhost:5173/'],
      LogoutURLs: [webUrl, 'http://localhost:5173/'],

    });

    await cognito.send(command);

    await sendResponse(event, context, 'SUCCESS', { Message: 'Successfully updated User Pool Client' });
  } catch (error) {
    console.error('Error updating User Pool Client:', error);
    await sendResponse(event, context, 'FAILED', {
      Message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
