# Response Service

The `responseService` manages the final review outcomes and feedback in the PeerReview system. It provides the API for submitting grades/feedback, storing these results, and allowing authors or admins to query the finalized outcomes and download associated reviewed documents.

## Responsibilities

*   **Review Submission:** Provides a REST API for reviewers and admins to submit grading and feedback (`SubmitReviewRequest`) for a submission.
*   **Result Querying:** Allows authors to view their aggregated results and final grades. Adheres strictly to data isolation rules — authors can only query their own results (derived securely from the `x-auth-principal-id` header).
*   **Document Access:** Generates short-lived, pre-signed AWS S3 URLs so users can securely download reviewed documents.
*   **Asynchronous Result Processing:** Listens for `ReviewCompletedEvent` payloads via SQS to ingest final grades processed or published by other microservices.
*   **Configuration Integration:** Calls the `Configuration Service` synchronously via REST to fetch submission authors, reviewers, and deadline data to validate access control dynamically.

## Architecture & Data Storage

This service relies on **Amazon DynamoDB** for persistence and **Amazon S3** for document access:

*   **`ReviewResultRepository`**: Stores the grading data, feedback, and metadata using the DynamoDB Enhanced Client.
*   **`DocumentStorageService`**: Uses the AWS S3 Presigner to generate temporary `GET` URLs for accessing the actual reviewed document files stored securely in an S3 bucket (configured via `aws.s3.bucket-name`).

## REST API

*   **`POST /api/response/results`**: Submit a new review result (Admin/Reviewer only).
*   **`GET /api/response/results`**: Retrieve all results for the authenticated author.
*   **`GET /api/response/results/{submissionId}`**: Retrieve a specific result.
*   **`GET /api/response/results/{submissionId}/document`**: Get a short-lived S3 pre-signed URL to download the reviewed document.

## Event-Driven Integration

The service participates in the asynchronous event choreography:
*   **Incoming SQS Events**:
    *   `SqsResultListener`: Listens to `aws.sqs.request.queue-name` to consume `ReviewCompletedEvent`s and store the finalized grading data.
    *   `SqsSubmissionReadyListener`: Listens to `aws.sqs.submission-ready.queue-name` for `SubmissionReadyEvent`s (currently used for logging state transitions).

## Service-to-Service Communication

To enforce access control without storing duplicate user data, the `responseService` uses an OpenAPI-generated client to query the **Configuration Service** directly:
*   **`SubmissionsApi.submissionsSubmissionIdGet`**: Fetches the submission configuration to verify the configured author(s), reviewer(s), and review deadlines before granting access to results or generating document download URLs.

## Security

Endpoints are protected by Spring Security `@PreAuthorize` rules mapping to Cedar policy outcomes. The internal `AuthHeaderFilter` parses the incoming `x-auth-principal-id` header (provided by the API Gateway Lambda Authorizer) to extract the Cognito UUID. This prevents IDOR (Insecure Direct Object Reference) attacks by strictly enforcing that the requested `authorId` matches the authenticated `sub` token for non-admin users.
