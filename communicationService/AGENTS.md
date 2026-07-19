# Communication Service Learnings

- **User resolution:** Resolve participant data through the User Service; do not access Cognito directly or duplicate user profiles.
- **Deterministic chat IDs:** Create chat IDs from sorted participant Sub-UUIDs and the context to avoid duplicate threads during concurrent creation.
- **DynamoDB layout:** Store chat metadata, participant links, and messages as separate PK/SK items rather than nested arrays.
- **SSE scaling:** The in-memory `SseEmitter` registry only reaches clients connected to the same task. Multiple ECS tasks require a shared Pub/Sub backend.
