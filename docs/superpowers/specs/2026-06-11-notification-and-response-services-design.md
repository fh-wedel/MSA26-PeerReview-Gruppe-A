# Design Spec: Notification Service & Response Service

## Overview

Two new Spring Boot microservices for the MSA26-PeerReview system:

1. **Notification Service** — Multi-channel notification dispatch (Discord, Email, Slack) triggered via REST (frontend) and SQS (other services). Persists a log of all sent notifications.
2. **Response Service** — Consumes "review completed" SQS events from the Workflow Service, stores final review results in PostgreSQL, references documents in S3, and exposes results to authors via REST.

Both services follow the existing project patterns: Spring Boot 4.0.6, Java 25, ECS Fargate (IPv6 private subnet), CDK v2 infrastructure, and the templateEcsService as baseline.

---

## Notification Service

### Architecture

- **Pattern:** Strategy Pattern for multi-channel dispatch
- **Channels:** Discord (Webhook), Email (SMTP), Slack (Webhook)
- **Triggers:** REST endpoint (manual/frontend) + SQS listener (automated from other services)
- **Persistence:** PostgreSQL (RDS) for notification log
- **Secrets:** AWS Secrets Manager for channel credentials

### Package Structure

```
notificationService/
├── src/main/java/com/fh_wedel/notification/
│   ├── NotificationApplication.java
│   ├── controller/
│   │   ├── NotificationController.java      # REST: POST /api/notification/send
│   │   └── SqsNotificationListener.java     # SQS Events from other services
│   ├── service/
│   │   ├── NotificationDispatcher.java       # Orchestrates channel selection + dispatch
│   │   └── NotificationLogService.java       # Persists sent notifications
│   ├── channel/
│   │   ├── NotificationChannel.java          # Interface: send(NotificationRequest)
│   │   ├── DiscordChannel.java               # Discord Webhook implementation
│   │   ├── EmailChannel.java                 # SMTP/SES implementation
│   │   └── SlackChannel.java                 # Slack Webhook implementation
│   ├── model/
│   │   ├── NotificationRequest.java          # DTO: channels, recipients, subject, body
│   │   └── NotificationLog.java              # Entity: id, channel, recipient, status, timestamp
│   ├── repository/
│   │   └── NotificationLogRepository.java    # Spring Data JPA
│   └── config/
│       └── SecretsConfig.java                # AWS Secrets Manager integration
├── src/main/resources/
│   ├── application.properties
│   └── openapi/notification.json
├── infra/
│   ├── bin/infra.ts
│   └── lib/service-stack.ts
├── Dockerfile
└── pom.xml
```

### REST Endpoint

```
POST /api/notification/send
```

Request body:
```json
{
  "channels": ["DISCORD", "EMAIL", "SLACK"],
  "recipients": ["user@example.com"],
  "subject": "Review abgeschlossen",
  "body": "Ihr Review fuer Submission X wurde abgeschlossen."
}
```

Response:
```json
{
  "notificationIds": ["uuid-1", "uuid-2"],
  "status": "DISPATCHED"
}
```

### SQS Event Schema (incoming from other services)

```json
{
  "eventType": "REVIEW_COMPLETED",
  "channels": ["EMAIL", "DISCORD"],
  "recipientUserId": "author-uuid",
  "subject": "Review Result Available",
  "body": "Your submission has been reviewed.",
  "metadata": {
    "submissionId": "sub-123"
  }
}
```

### Database Schema (PostgreSQL)

```sql
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(20) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP
);

CREATE INDEX idx_notification_log_status ON notification_log(status);
CREATE INDEX idx_notification_log_created ON notification_log(created_at);
```

Status values: `PENDING`, `SENT`, `FAILED`

### Channel Interface

```java
public interface NotificationChannel {
    String getChannelType();  // "DISCORD", "EMAIL", "SLACK"
    void send(String recipient, String subject, String body);
    boolean isEnabled();
}
```

The `NotificationDispatcher` collects all `NotificationChannel` beans, filters by requested channels, and dispatches. Each result is logged.

### Secrets Manager Structure

Secret name: `msa26/notification/credentials`
```json
{
  "discord.webhook.url": "https://discord.com/api/webhooks/...",
  "slack.webhook.url": "https://hooks.slack.com/services/...",
  "email.smtp.host": "email-smtp.eu-north-1.amazonaws.com",
  "email.smtp.port": "587",
  "email.smtp.username": "...",
  "email.smtp.password": "..."
}
```

### CDK Infrastructure

- RDS PostgreSQL instance (t3.micro, single-AZ for dev)
- SQS Queue: `notification-request-queue` (with DLQ)
- Secrets Manager read access (IAM)
- ECR repository: `fh-wedel/notification`
- ECS Fargate task (512 MiB / 256 CPU)
- CloudMap AAAA record: `notification.internal.services`

### Environment Variables

```
SERVER_PORT=8081
AWS_REGION=eu-north-1
SQS_REQUEST_QUEUE=notification-request-queue
DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
SECRETS_NAME=msa26/notification/credentials
```

---

## Response Service

### Architecture

- **Pattern:** SQS Consumer + REST Provider
- **Storage:** PostgreSQL (RDS) for structured results, S3 for review documents
- **Input:** SQS event from Workflow Service (full payload)
- **Output:** REST endpoints for authors to retrieve their results

### Package Structure

```
responseService/
├── src/main/java/com/fh_wedel/response/
│   ├── ResponseApplication.java
│   ├── controller/
│   │   ├── ResultController.java             # REST: GET results for authors
│   │   └── SqsResultListener.java           # SQS Event from Workflow Service
│   ├── service/
│   │   ├── ResultService.java                # Business logic: store + retrieve
│   │   └── DocumentStorageService.java       # S3 pre-signed URL generation
│   ├── model/
│   │   ├── ReviewResult.java                 # JPA Entity
│   │   └── ReviewResultDto.java              # Response DTO
│   ├── repository/
│   │   └── ReviewResultRepository.java       # Spring Data JPA
│   └── config/
│       └── S3Config.java                     # S3 Client/Presigner bean
├── src/main/resources/
│   ├── application.properties
│   └── openapi/response.json
├── infra/
│   ├── bin/infra.ts
│   └── lib/service-stack.ts
├── Dockerfile
└── pom.xml
```

### SQS Event Schema (from Workflow Service)

```json
{
  "submissionId": "sub-123",
  "reviewerId": "rev-456",
  "authorId": "auth-789",
  "finalGrade": "1.7",
  "reviewComments": "Gute Arbeit, kleine Verbesserungen noetig...",
  "documentS3Key": "reviews/sub-123/final-review.pdf",
  "completedAt": "2026-06-11T14:30:00Z"
}
```

### REST Endpoints

```
GET /api/response/results?authorId={authorId}
```
Returns all review results for an author.

```
GET /api/response/results/{submissionId}
```
Returns the result for a specific submission.

```
GET /api/response/results/{submissionId}/document
```
Returns a pre-signed S3 URL (15 min validity) to download the review document.

### Response DTO

```json
{
  "id": "uuid",
  "submissionId": "sub-123",
  "reviewerId": "rev-456",
  "authorId": "auth-789",
  "finalGrade": "1.7",
  "reviewComments": "...",
  "documentUrl": null,
  "completedAt": "2026-06-11T14:30:00Z",
  "createdAt": "2026-06-11T14:30:05Z"
}
```

The `documentUrl` is only populated when explicitly requested via the `/document` endpoint (pre-signed, time-limited).

### Database Schema (PostgreSQL)

```sql
CREATE TABLE review_result (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id VARCHAR(100) NOT NULL,
  reviewer_id VARCHAR(100) NOT NULL,
  author_id VARCHAR(100) NOT NULL,
  final_grade VARCHAR(10),
  review_comments TEXT,
  document_s3_key VARCHAR(500),
  completed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_result_author ON review_result(author_id);
CREATE INDEX idx_review_result_submission ON review_result(submission_id);
```

### S3 Integration

- Bucket: `msa26-peer-review-response-documents`
- Documents are uploaded by the Workflow Service prior to sending the event
- Response Service only reads (GetObject) and generates pre-signed download URLs
- Pre-signed URL validity: 15 minutes

### CDK Infrastructure

- RDS PostgreSQL instance (t3.micro, single-AZ for dev)
- S3 Bucket with versioning enabled, private access only
- SQS Queue: `response-request-queue` (with DLQ)
- ECR repository: `fh-wedel/response`
- ECS Fargate task (512 MiB / 256 CPU)
- CloudMap AAAA record: `response.internal.services`
- IAM: `s3:GetObject` on bucket, `sqs:ReceiveMessage` on queue, RDS connect

### Environment Variables

```
SERVER_PORT=8081
AWS_REGION=eu-north-1
SQS_REQUEST_QUEUE=response-request-queue
DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
S3_BUCKET_NAME=msa26-peer-review-response-documents
```

---

## Shared Patterns (Both Services)

### Docker

Multi-stage build following templateEcsService pattern:
- Stage 1: maven:3.9-eclipse-temurin-25 (dependency cache + build)
- Stage 2: eclipse-temurin:25-jre-alpine (runtime, non-root user)

### Health Check

```
GET /actuator/health (port 8081)
```

### Dependencies (pom.xml)

```xml
spring-boot-starter-web
spring-boot-starter-actuator
spring-boot-starter-validation
spring-boot-starter-data-jpa
spring-cloud-aws-starter-sqs
postgresql (runtime)
lombok
```

Additional for Notification Service:
```xml
spring-boot-starter-mail          # SMTP
software.amazon.awssdk:secretsmanager
```

Additional for Response Service:
```xml
software.amazon.awssdk:s3
software.amazon.awssdk:s3-transfer-manager
```

### CI/CD Integration

Both services added to `.github/workflows/ci.yml`:
- Path filters for `_code`, `_infra`, `_any`
- New jobs using `reusable-service.yml`
- CloudFront routing: `/api/notification/*` and `/api/response/*`

### CloudFront Routing

```
/api/notification/*  → Notification Service API Gateway
/api/response/*      → Response Service API Gateway
```

---

## Out of Scope

- User resolution (recipientUserId → email/discord handle) — assumes the caller provides contact info or a future lookup is added
- Authentication/Authorization details — follows existing AVP/Cedar pattern
- Frontend UI components
- Retry logic beyond SQS DLQ
