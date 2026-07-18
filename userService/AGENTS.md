# User Service Learnings

- **Cognito boundary:** Other services should resolve users, groups, and reviewer attributes through the User Service rather than calling Cognito directly.
- **Cache invalidation:** Changes to users or group memberships must invalidate cached profiles through the configured SQS queue.
- **Docker build context:** Build the module from the repository root with `docker build -f userService/Dockerfile .` so Maven can resolve `api-client` through the root aggregator.
- **OpenAPI synchronization:** After changing `user.json`, regenerate the Web UI client with `npm run generate:api:users`.
