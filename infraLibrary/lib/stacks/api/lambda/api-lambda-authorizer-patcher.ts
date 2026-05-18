import {
    APIGatewayClient,
    CreateDeploymentCommand,
    GetResourcesCommand,
    UpdateMethodCommand,
} from '@aws-sdk/client-api-gateway';
import type { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';

const apigateway = new APIGatewayClient({});

type PatchResult = {
    status: 'SUCCESS' | 'FAILED';
    message: string;
};

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
        PhysicalResourceId:
            event.RequestType === 'Update'
                ? event.PhysicalResourceId
                : `${event.StackId}-ApiGatewayAuthorizerPatch`,
        Status: responseStatus,
        Reason: `${responseData.Message}. See the details in CloudWatch Log Stream: ${context.logStreamName}`,
        Data: responseData,
    });

    console.log('Response body to send to CloudFormation:', responseBody);

    try {
        const responseFromCfn = await fetch(event.ResponseURL, {
            method: 'put',
            body: responseBody,
            headers: {
                'Content-Type': '',
                'Content-Length': `${responseBody.length}`,
            },
        });
        console.log('Response status from CloudFormation responseUrl:', responseFromCfn.status);
    } catch (error) {
        console.log('Error sending response to CloudFormation:', error);
    }
}

export async function handler(event: CloudFormationCustomResourceEvent, context: Context) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const restApiId = process.env.API_GATEWAY_ID ?? (event.ResourceProperties?.RestApiId as string | undefined);
    const stage = process.env.API_GATEWAY_STAGE ?? (event.ResourceProperties?.StageName as string | undefined);
    const authorizerId = process.env.AUTHORIZER_ID ?? (event.ResourceProperties?.AuthorizerId as string | undefined);

    if (!restApiId || !stage || !authorizerId) {
        await sendResponse(event, context, 'FAILED', {
            Message: 'API_GATEWAY_ID, API_GATEWAY_STAGE, and AUTHORIZER_ID must be set',
        });
        return;
    }

    const apiUpdateResult = await patchMethods(restApiId, authorizerId, stage, event.RequestType);
    await sendResponse(event, context, apiUpdateResult.status, { Message: apiUpdateResult.message });
}

export async function patchMethods(
    restApiId: string,
    authorizerId: string,
    stage: string,
    requestType: string,
): Promise<PatchResult> {
    const methodInfoList = await getAllMethodsForApi(restApiId, authorizerId, requestType);
    let patchOperations;
    if (requestType === 'Delete') {
        patchOperations = [
            {
                op: 'replace',
                path: '/authorizationType',
                value: 'NONE',
            },
        ];
    } else {
        patchOperations = [
            {
                op: 'replace',
                path: '/authorizationType',
                value: 'CUSTOM',
            },
            {
                op: 'replace',
                path: '/authorizerId',
                value: authorizerId,
            },
        ];
    }

    try {
        for (const methodInfo of methodInfoList) {
            const params = {
                httpMethod: methodInfo.method,
                resourceId: methodInfo.resourceId,
                restApiId: restApiId,
                patchOperations: patchOperations,
            };

            console.log(`Updating method: ${methodInfo.path} ${methodInfo.method}`);
            const updateMethodCommand = new UpdateMethodCommand(params);
            const updateMethodResponse = await apigateway.send(updateMethodCommand);
            console.log('UpdateMethod response status code:', updateMethodResponse?.$metadata?.httpStatusCode);
        }

        const deploymentParams = {
            restApiId: restApiId,
            stageName: stage,
        };
        const createDeploymentCommand = new CreateDeploymentCommand(deploymentParams);
        const deploymentResponse = await apigateway.send(createDeploymentCommand);
        console.log('Deployment response:', deploymentResponse);

        return {
            status: 'SUCCESS',
            message: 'Custom resource operation successful',
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            status: 'FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * This function gets all methods in the API that need to be updated. When creating/updating, we attach
 * the authorizer to everything. When deleting, we detach it only from the resources where it's attached.
 * OPTIONS method is always ignored.
 */
export async function getAllMethodsForApi(
    restApiId: string,
    authorizerId: string,
    requestType: string,
) {
    const resourcesResponse = await apigateway.send(
        new GetResourcesCommand({ restApiId, embed: ['methods'], limit: 500 }),
    );
    const methodsToPatch: Array<{ method: string; resourceId: string; path: string }> = [];

    for (const resourceInfo of resourcesResponse.items ?? []) {
        if (!resourceInfo.path || !resourceInfo.id) {
            continue;
        }

        const methodDetails = resourceInfo.resourceMethods ?? {};
        const methodNames = Object.keys(methodDetails);

        for (const methodName of methodNames) {
            if (methodName.toLowerCase() === 'options') {
                continue;
            }

            const isCreateOrUpdate = requestType !== 'Delete';
            const shouldAuthorizerBeDetached =
                requestType === 'Delete' && methodDetails[methodName]?.authorizerId === authorizerId;
            const shouldIncludeMethodInResult = isCreateOrUpdate || shouldAuthorizerBeDetached;

            if (shouldIncludeMethodInResult) {
                methodsToPatch.push({
                    method: methodName,
                    resourceId: resourceInfo.id,
                    path: resourceInfo.path,
                });
            }
        }
    }

    return methodsToPatch;
}
