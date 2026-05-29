# Submission Service (Developer Guidelines)

This file documents local conventions, gotchas, and architectural guidelines specifically for the **Submission Service**.

## 1. Local Development & Testing
- **Test Context Isolation**: Do not run integration tests against a live PostgreSQL server. A test profile (`activeProfiles("test")`) is configured under `src/test/resources/application-test.properties` mapping connectivity to H2 in-memory mode.
- **Dependency Management**: Lombok and spring starters must be explicitly declared in this module's `pom.xml`.

## 2. Relational Database & Migrations
- **Isolated Schema**: Relational operations must strictly target tables inside `db/migration/V1__init_submission_schema.sql`.
- **JSONB Serialization**: The table column `additional_files_s3_keys` is typed as `JSONB`. All updates in Java code must serialize lists using the Jackson `ObjectMapper` instance to store valid JSON arrays (e.g. `["key1", "key2"]`) and avoid database persistence errors.

## 3. REST & SQS Security
- **Header-Based RBAC**: User identity checks rely on headers mapped by API Gateway: `x-auth-username` (JWT sub/username) and `x-auth-groups` (Cognito groups).
- **Security Check Integrity**: Configuration creation is privileged. Ensure Authors can only create configurations where `createdById` strictly matches their authenticated username header value.
- **SQS Event Construction**: Always serialize structured event models using the mapped `ObjectMapper` instance inside `publishEvent(...)` to prevent string escaping bugs or payload injection vulnerabilities.
