# Notification Service

The `notificationService` is responsible for handling all outbound communications from the PeerReview system to the users. It supports multi-channel dispatch, allowing other services to reliably send messages via asynchronous events without worrying about the underlying delivery mechanisms.

## Responsibilities

*   **Multi-Channel Dispatch:** Routes messages to `IN_APP`, `EMAIL`, `SLACK`, and `DISCORD` channels based on the request.
*   **Asynchronous Event Processing:** Consumes `NotificationEvent` messages from a dedicated Amazon SQS queue, ensuring decoupled communication with other microservices.
*   **In-App Inbox & Real-Time Delivery:** Exposes REST endpoints to fetch the user's notification inbox and mark items as read. It leverages Server-Sent Events (SSE) to push real-time notifications to connected clients.
*   **Audit & Logging:** Persists a `NotificationLog` for every dispatch attempt across all channels, tracking whether the message was `PENDING`, `SENT`, or `FAILED`.

## Architecture & Data Storage

This service uses **Amazon DynamoDB** for persistence, following the Single-Table Design pattern. 

*   **`InAppNotificationRepository`**: Stores notifications that are meant to be displayed in the user's Web UI inbox.
*   **`NotificationLogRepository`**: Maintains the history and status of all dispatched notifications across all channels for auditing and error tracking.

All database interactions are managed via the AWS SDK v2 `DynamoDB Enhanced Client`. 

## Event-Driven Integration

The service listens to an SQS queue (configured via `aws.sqs.request.queue-name`) for incoming requests. Other services (like the `ResponseService` oder `ConfigurationService`) can enqueue a `NotificationEvent` JSON payload:

```json
{
  "eventName": "REVIEW_RESULT_AVAILABLE",
  "channels": ["IN_APP", "EMAIL"],
  "recipientUserId": "user-uuid",
  "subject": "Review Result Available",
  "body": "A review result is available for submission sub-123.",
  "metadata": { "submissionId": "sub-123" }
}
```
The `SqsNotificationListener` picks up the event, maps it to a `NotificationRequest`, and passes it to the `NotificationDispatcher` which routes the message to the appropriate channel implementations (`EmailChannel`, `SlackChannel`, `DiscordChannel`, `InAppChannel`).

## Synchronous REST API

While most notifications are triggered asynchronously via SQS, the service also exposes a synchronous API for direct integrations and Web UI inbox management:

*   **`POST /api/notification/send`**: Dispatches a notification immediately and returns the generated UUIDs and aggregate status (`DISPATCHED`, `PARTIAL`, `FAILED`).
*   **`GET /api/notification/me`**: Retrieves the list of `IN_APP` notifications for the authenticated user.
*   **`GET /api/notification/me/stream`**: Establishes an SSE stream to receive real-time notifications.
*   **`PATCH /api/notification/{id}/read`**: Marks a specific `IN_APP` notification as read.
*   **`POST /api/notification/me/read-all`**: Marks all unread `IN_APP` notifications as read for the authenticated user.

## External Integrations & Secrets

The service integrates with third-party platforms for external notifications. Credentials and Webhook URLs are retrieved securely at runtime using **AWS Secrets Manager**:
*   **Discord / Slack**: Webhook URLs are required for the `DiscordChannel` and `SlackChannel`.
*   **Email**: SMTP server credentials are required for the `EmailChannel` (via `spring-boot-starter-mail`).

*(See `SecretsConfig.java` for the mapping of secrets into the Spring environment).*

## Security

The REST endpoints use standard `@PreAuthorize` annotations and Spring Security. The `InboxController` extracts the `x-auth-principal-id` header (injected by the API Gateway / Lambda Authorizer) to securely isolate the inbox data per user.
