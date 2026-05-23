import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Content types that should be treated as text (not base64-encoded).
 * Everything else is considered binary and will be base64-encoded in the
 * API Gateway response.
 */
const TEXT_CONTENT_TYPE_PATTERNS = [
    'text/',
    'application/json',
    'application/xml',
    'application/javascript',
    'application/x-javascript',
    'application/ecmascript',
    'application/x-httpd-php',
    'application/xhtml+xml',
    'application/ld+json',
    'application/manifest+json',
    'image/svg+xml',
];

function isBinaryContentType(contentType: string | null): boolean {
    if (!contentType) {
        return false;
    }
    const lower = contentType.toLowerCase();
    return !TEXT_CONTENT_TYPE_PATTERNS.some(pattern => lower.includes(pattern));
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

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const baseUrl = process.env.TARGET_URL;
    if (!baseUrl) {
        return { statusCode: 500, body: 'TARGET_URL environment variable is missing' };
    }
    console.log("Received event:", JSON.stringify(event, null, 2));

    const path = event.path || '/';
    const queryString = event.queryStringParameters
        ? `?${new URLSearchParams(event.queryStringParameters as Record<string, string>).toString()}`
        : '';

    const targetUrl = `${baseUrl}${path}${queryString}`;

    try {
        const requestHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(event.headers)) {
            if (value && key.toLowerCase() !== 'host') {
                requestHeaders[key] = value;
            }
        }

        const authorizerContext = event.requestContext?.authorizer ?? {};
        let username = typeof authorizerContext.username === 'string' ? authorizerContext.username : undefined;
        let groups = typeof authorizerContext.groups === 'string' ? authorizerContext.groups : undefined;
        let principalId = typeof authorizerContext.principalId === 'string' ? authorizerContext.principalId : undefined;

        if (!username || !groups || !principalId) {
            const bearerToken = extractBearerToken(event.headers ?? undefined);
            if (bearerToken) {
                const payload = decodeJwtPayload(bearerToken);
                const subject = typeof payload?.sub === 'string' ? payload.sub : undefined;
                const issuer = typeof payload?.iss === 'string' ? payload.iss : undefined;

                if (!username) {
                    username =
                        (typeof payload?.['cognito:username'] === 'string'
                            ? payload?.['cognito:username']
                            : undefined) ??
                        (typeof payload?.username === 'string' ? payload?.username : undefined) ??
                        subject;
                }

                if (!groups) {
                    groups = normalizeGroups(payload?.['cognito:groups'] ?? payload?.groups);
                }

                if (!principalId && issuer && subject) {
                    const issuerParts = issuer.split('/').filter(Boolean);
                    const issuerId = issuerParts.length > 0 ? issuerParts[issuerParts.length - 1] : 'unknown';
                    principalId = `${issuerId}|${subject}`;
                }
            }
        }

        if (username) {
            requestHeaders['x-auth-username'] = username;
        }

        if (groups) {
            requestHeaders['x-auth-groups'] = groups;
        }

        if (principalId) {
            requestHeaders['x-auth-principal-id'] = principalId;
        }

        const options: RequestInit = {
            method: event.httpMethod,
            headers: requestHeaders,
        };

        if (event.body && ['POST', 'PUT', 'PATCH'].includes(event.httpMethod)) {
            options.body = event.isBase64Encoded
                ? Buffer.from(event.body, 'base64').toString('utf-8')
                : event.body;
        }


        const response = await fetch(targetUrl, options);
        const contentType = response.headers.get('content-type');
        const binary = isBinaryContentType(contentType);

        let responseBody: string;
        if (binary) {
            const arrayBuffer = await response.arrayBuffer();
            responseBody = Buffer.from(arrayBuffer).toString('base64');
        } else {
            responseBody = await response.text();
        }

        console.log(`Proxied request to ${targetUrl} with method ${event.httpMethod}. Received status ${response.status} (binary=${binary})`);

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        return {
            statusCode: response.status,
            headers: responseHeaders,
            body: responseBody,
            isBase64Encoded: binary,
        };

    }
    catch (error: any) {
        console.error("Proxy Error:", error);
        if (error.cause && error.cause.message.includes('getaddrinfo')) {
            return {
                statusCode: 502,
                body: JSON.stringify({
                    message: "Bad Gateway: Target service not found in DNS",
                    error: error.message
                }),
            };
        }

        return {
            statusCode: 502,
            body: JSON.stringify({
                message: "Bad Gateway: ECS Service unreachable",
                error: error.message
            }),
        };
    }
};