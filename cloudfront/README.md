# CloudFront Stack

The `PeerReviewCloudFrontStack` acts as the **single, stable entry point** for the entire PeerReview system. It provides a unified domain name (e.g., `https://d123...cloudfront.net`) that serves both the Web UI (React frontend) and all backend microservice APIs.

## 🏗 Architecture & Routing

This stack implements an **API Gateway Reverse Proxy pattern** using CloudFront's path-based routing (`CacheBehaviors`):

- **Default Behavior (`/*`)**: Routes all unmatched requests to the Web UI API Gateway. This serves the static React application.
- **Microservice Behaviors (`/api/<service-name>/*`)**: Routes requests targeting specific paths to their respective backend API Gateways (e.g., `/api/template/*` goes to the Template Service).

### How Path Forwarding Works

CloudFront sits in front of the API Gateways. API Gateways deploy their endpoints into a "stage" (e.g., `/prod`). 

1. CloudFront accepts a request like `GET /api/template/status`.
2. CloudFront is configured with an `originPath: /prod`.
3. CloudFront transparently prepends `/prod` and forwards the request to the backend API Gateway as `GET /prod/api/template/status`.
4. API Gateway strips the `/prod` stage and routes the request to the ECS backend.

> [!IMPORTANT]  
> Because CloudFront manages the stage prefix internally, clients (browsers, CURL, Postman) should **never** include `/prod` in their URLs. Always use `https://<dist>.cloudfront.net/api/...`.

## ➕ Adding a New Microservice

When a new backend microservice is created (e.g., `SubmissionService`), it must be exposed through this CloudFront distribution.

### 1. Update Backend OpenAPI Spec
The OpenAPI specification (`api.yaml`) for the new service **must** define a `servers` block to prefix all its routes:
```yaml
servers:
  - url: /api/submission
```
This ensures the API Gateway expects the path that CloudFront will forward to it.

### 2. Register in CloudFront
Open `cloudfront/bin/cloudfront.ts` and add the new service to the `apiServices` array:
```typescript
apiServices: [
    { apiName: 'TemplateServiceAPI', pathPattern: '/api/template/*' },
    { apiName: 'SubmissionServiceAPI', pathPattern: '/api/submission/*' },
]
```
- `apiName`: Must precisely match the `apiName` prop used when creating the API Stack in the service's `infra.ts`.
- `pathPattern`: Must match the prefix defined in the OpenAPI spec, followed by `/*`.

### 3. Deploy CloudFront
After deploying the new microservice, deploy the CloudFront stack so it learns about the new origin:
```bash
cd cloudfront
npx cdk deploy --profile fh-wedel-msa
```

## 🔒 Cross-Origin Resource Sharing (CORS)

Because the Web UI and all backend APIs share the exact same CloudFront domain name, the browser treats them as the same origin. 
**No complex CORS headers are required.** You do not need to configure `Access-Control-Allow-Origin` on the API Gateways.

## 🔐 Authentication & Cognito

Because the Web UI is served via CloudFront, the AWS Cognito App Client must be configured to accept CloudFront as a valid redirect URI (`CallbackURLs` / `LogoutURLs`). 

The `web-ui` stack includes a Custom Resource Lambda (`update-cognito-client.ts`) that automatically updates the Cognito User Pool Client during deployment to whitelist the CloudFront URL.

> [!WARNING]  
> The React application must be configured with `base: '/'` in `vite.config.ts` (and its internal Router basename) because CloudFront hides the API Gateway `/prod` stage.

## ⚡ Caching

Currently, CloudFront is configured to use the AWS Managed Policy **CachingDisabled**. 
- API requests bypass the cache so dynamic data is always fresh.
- Web UI assets bypass the cache to ensure you don't see stale React bundles during active development. 

*(If caching for static assets is desired later, the `DefaultBehavior` cache policy can be updated to `CACHING_OPTIMIZED` in `cloudfront-stack.ts`)*.
