# Matching Service - AI Agent Guidelines

This document contains specific context, conventions, and learnings for the Matching Service to help future AI agents.

## 1. Domain & Scope
The Matching Service pairs submitted papers with eligible reviewers. It manages examiner pools (fetching from Cognito) and persists matches into a DynamoDB table. It receives asynchronous matching requests via AWS SQS.

## 2. Security & Authorization (ABAC)
- **Roles:** The service relies on Cognito user groups mapped to Spring Security roles (`ROLE_Author`, `ROLE_Reviewer`, `ROLE_Admin`, `ROLE_ExaminationOfficer`).
- **Dynamic Roles:** Note that the concept of a `Teacher` is dynamically mapped to the `Reviewer` group inside Cognito. Cedar policies do not explicitly check for a `Teacher` role.
- **Ownership Checks:** Authorization leverages `@PreAuthorize` to perform attribute-based access control (ABAC):
  - `Author`s can only fetch matches for submissions they own.
  - `Reviewer`s can only access their own examiner match records.
  - `Admin`s and `ExaminationOfficer`s have global read access.
  - Ownership is determined by checking the current user's Cognito `sub` UUID (passed via the `x-auth-principal-id` header as `poolId|uuid`) against the ID of the resource owner.

## 3. Testing Conventions
- Controller security checks (`isCurrentUser`, `isAdminOrOfficer`) are tested using pure Mockito unit tests. This avoids the overhead and potential dependency conflicts of full `@WebMvcTest` contexts. In `MatchingControllerSecurityTest`, we manually inject mock `Authentication` objects to verify access denial and acceptance directly.

## 4. Infrastructure & Context Overrides
- **DynamoDB Single Table Design:** The service uses the AWS SDK v2 Enhanced Client (`DynamoDbEnhancedClient`) with a single table for all match-related items to maximize query performance without JOINs.
  - **Item Separation Strategy:** Status metadata and match assignments are intentionally stored as separate items. This avoids Race Conditions and locking issues that occur when appending to a nested array in a single document during concurrent updates.
  - `MatchRecord` objects use `SUBMISSION#{id}` as PK and `MATCH#{examinerId}` as SK. This represents a 1-to-N relationship (one submission, multiple matches).
  - `SubmissionStatusRecord` objects use `SUBMISSION#{id}` as PK and `STATUS` as SK. This stores the overall metadata (status, submitterId, required examiners).
  - Secondary Index (`ExaminerIndex`) allows querying all submissions assigned to an examiner efficiently.
- **Amazon Verified Permissions (Cedar):** The infrastructure deploys policies (defined in `infra/verified-permissions/matching-policies.json`). We map groups strictly to their application domain roles (e.g., `Author` and `Reviewer`), avoiding extraneous mapping for dynamic types like `Teacher`. **Critical:** Cedar action IDs must use the exact API Gateway resource template format (e.g., `patch /api/matching/examiners/{examinerId}`) — never glob wildcards like `*`. Cedar uses strict string equality, so `{examinerId}` must match `event.resource` at runtime.
- **SQS Configuration:** The `SqsRequestListener` relies on an explicitly configured `ObjectMapper` bean defined in `AppConfig` (including `JavaTimeModule`) to handle JSON parsing of incoming `MatchingRequestEvent`s. This explicit definition ensures it works perfectly even when certain web auto-configurations are conditionally disabled or altered in Lambda/SQS setups.
- **CloudFront & CI/CD Integrations:** When adding new capabilities or spinning up related microservices, the API endpoints MUST be manually exported in `cloudfront/bin/cloudfront.ts` (e.g. `pathPattern: '/api/matching/*'`). Additionally, any new service needs path filters and jobs registered in `.github/workflows/ci.yml`.
