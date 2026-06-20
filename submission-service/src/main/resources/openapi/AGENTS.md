# OpenAPI Learnings

- **OpenAPI enum mismatch:** If an expected backend enum value (e.g. `WAITING_FOR_SUBMISSION`) is omitted from
  `submission.json`'s enum definition, the frontend TypeScript client (`submission.ts`) will fail to typecheck it.
  Always keep the OpenAPI spec strictly in sync with Java domain enums (`SubmissionStatus.java`).
