import { VerifiedPermissions } from '@aws-sdk/client-verifiedpermissions';
import type {
    APIGatewayAuthorizerResult,
    APIGatewayRequestAuthorizerEvent,
} from 'aws-lambda';

const policyStoreId = process.env.POLICY_STORE_ID ?? '';
const namespace = process.env.NAMESPACE ?? '';
const tokenType = process.env.TOKEN_TYPE ?? '';
const resourceType = `${namespace}::Application`;
const resourceId = namespace;
const actionType = `${namespace}::Action`;

const endpoint = process.env.ENDPOINT;
const verifiedpermissions = endpoint
    ? new VerifiedPermissions({
        endpoint: endpoint.startsWith('http') ? endpoint : `https://${endpoint}`,
    })
    : new VerifiedPermissions();

function toSmithyStringRecord(input: Record<string, string | undefined>) {
    const cleaned = Object.keys(input).reduce((acc, key) => {
        const value = input[key];
        if (typeof value === 'string') {
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, string>);

    return {
        record: Object.keys(cleaned).reduce((acc, key) => {
            acc[key] = { string: cleaned[key] };
            return acc;
        }, {} as Record<string, { string: string }>),
    };
}

function getContextMap(event: APIGatewayRequestAuthorizerEvent) {
    const pathParams = event.pathParameters ?? {};
    const queryParams = event.queryStringParameters ?? {};

    const hasPathParameters = Object.keys(pathParams).length > 0;
    const hasQueryString = Object.keys(queryParams).length > 0;

    if (!hasPathParameters && !hasQueryString) {
        return undefined;
    }

    const pathParametersObj = !hasPathParameters
        ? {}
        : {
            pathParameters: toSmithyStringRecord(pathParams),
        };

    const queryStringObj = !hasQueryString
        ? {}
        : {
            queryStringParameters: toSmithyStringRecord(queryParams),
        };

    return {
        contextMap: {
            ...queryStringObj,
            ...pathParametersObj,
        },
    };
}

function extractBearerToken(headers?: Record<string, string | undefined>) {
    if (!headers) {
        return undefined;
    }

    const authHeader = headers.Authorization ?? headers.authorization;
    if (!authHeader) {
        return undefined;
    }

    const normalized = authHeader.trim();
    if (normalized.toLowerCase().startsWith('bearer ')) {
        return normalized.split(' ')[1];
    }

    return normalized;
}

function decodeJwtPayload(token: string) {
    const parts = token.split('.');
    if (parts.length < 2) {
        return undefined;
    }

    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    const json = Buffer.from(padded, 'base64').toString('utf-8');

    try {
        return JSON.parse(json) as Record<string, unknown>;
    } catch (error) {
        console.log('Failed to parse JWT payload:', error);
        return undefined;
    }
}

function normalizeGroups(value: unknown): string | undefined {
    if (Array.isArray(value)) {
        return value.filter((entry) => typeof entry === 'string').join(',');
    }

    if (typeof value === 'string') {
        return value;
    }

    return undefined;
}

export const handler = async (
    event: APIGatewayRequestAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
    try {
        if (!policyStoreId || !namespace || !tokenType) {
            throw new Error('POLICY_STORE_ID, NAMESPACE, and TOKEN_TYPE must be set');
        }

        const bearerToken = extractBearerToken(event.headers ?? undefined);
        if (!bearerToken) {
            throw new Error('Authorization token is missing');
        }

        const actionPath = event.resource || event.path || '/';
        const actionId = `${event.httpMethod.toLowerCase()} ${actionPath}`;
        const contextMap = getContextMap(event);

        const input: Record<string, unknown> = {
            policyStoreId: policyStoreId,
            action: {
                actionType: actionType,
                actionId: actionId,
            },
            resource: {
                entityType: resourceType,
                entityId: resourceId,
            },
        };

        if (contextMap) {
            input.context = contextMap;
        }

        input[tokenType] = bearerToken;

        const authResponse = await verifiedpermissions.isAuthorizedWithToken(input as any);
        console.log('Decision from AVP:', authResponse.decision);

        const parsedToken = decodeJwtPayload(bearerToken);
        let principalId = 'unknown';
        const issuer = typeof parsedToken?.iss === 'string' ? parsedToken.iss : undefined;
        const subject = typeof parsedToken?.sub === 'string' ? parsedToken.sub : undefined;
        if (issuer && subject) {
            const issuerParts = issuer.split('/').filter(Boolean);
            const issuerId = issuerParts.length > 0 ? issuerParts[issuerParts.length - 1] : 'unknown';
            principalId = `${issuerId}|${subject}`;
        }

        const username =
            (typeof parsedToken?.['cognito:username'] === 'string'
                ? parsedToken?.['cognito:username']
                : undefined) ??
            (typeof parsedToken?.username === 'string' ? parsedToken?.username : undefined) ??
            subject;

        const groups = normalizeGroups(parsedToken?.['cognito:groups'] ?? parsedToken?.groups);

        if (authResponse.principal) {
            principalId = `${authResponse.principal.entityType}::"${authResponse.principal.entityId}"`;
        }

        const effect = authResponse.decision?.toUpperCase() === 'ALLOW' ? 'Allow' : 'Deny';

        const context: Record<string, string> = {
            actionId,
        };

        if (username) {
            context.username = username;
        }

        if (groups) {
            context.groups = groups;
        }

        context.principalId = principalId;

        return {
            principalId,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: effect,
                        Resource: event.methodArn,
                    },
                ],
            },
            context,
        };
    } catch (error) {
        console.log('Error:', error);
        return {
            principalId: 'unknown',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: event.methodArn,
                    },
                ],
            },
            context: {},
        };
    }
};
