import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

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
        const username = typeof authorizerContext.username === 'string' ? authorizerContext.username : undefined;
        const groups = typeof authorizerContext.groups === 'string' ? authorizerContext.groups : undefined;
        const principalId = typeof authorizerContext.principalId === 'string' ? authorizerContext.principalId : undefined;

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
        const responseBody = await response.text();

        console.log(`Proxied request to ${targetUrl} with method ${event.httpMethod}. Received status ${response.status}`);

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        return {
            statusCode: response.status,
            headers: responseHeaders,
            body: responseBody,
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