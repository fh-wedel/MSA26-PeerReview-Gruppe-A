# Workflow Service Guidelines

- **API Gateway Permissions:** Any new endpoint must be explicitly added to `infra/verified-permissions/workflow-policies.json` for all relevant roles (Admin, Student, Teacher, Guest, ExaminationOfficer).
- **OpenAPI Spec:** The OpenAPI spec (`workflow-core/src/main/resources/openapi/workflow.json`) must be manually kept in sync with Spring controllers, as it is used by the CDK stack (`infra.ts`) to configure API Gateway routing.
