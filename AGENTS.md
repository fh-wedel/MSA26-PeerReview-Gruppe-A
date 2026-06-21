# AI Agent Guidelines (AGENTS.md)

Welcome to the **MSA26-PeerReview-Gruppe-A** repository. This document provides context, architectural guidelines, and conventions to help AI agents understand and contribute to this project effectively.

## 1. Project Context
This project is an AWS infrastructure and software setup for a "PeerReview" system (Ein System zum gegenseitigen Begutachten von wissenschaftlichen Arbeiten). It is built using an Event-Driven Microservice Architecture.

## 2. Planned Architecture & Services
Based on the high-level architecture, the system consists of a Web UI and several independent backend microservices. These communicate via REST (synchronous) and Amazon SQS (asynchronous events):

- **Web UI:** The frontend interface for the system.
- **API Gateway:** Central entry point routing REST requests to the respective microservices.
- **User Management Service:** Manages users, roles, and authentication.
- **Submission Service:** Handles document uploads and submission details.
- **Workflow Service:** Orchestrates the life cycle of a submission. 
  - *Crucial Requirement:* This service must implement a **Plugin Architecture** to support different kinds of review workflows (e.g., double-blind review, open-review).
- **Review Service:** Manages the actual reviews, gradings, and comments.
- **Notification Service:** Handles external notifications (triggered via SQS events).
- **Communication Service:** Manages stored messages and communication between users.
- **Analytics & Reporting Service:** Generates statistics and aggregates data.

### Architectural Rules
- **Database-per-Service:** Every backend service uses its own isolated JDBC-based database (e.g., AWS RDS/Aurora). Services must *never* share databases or perform cross-database joins. Data synchronization should happen via SQS events.
- **Document Storage:** Actual reviewed documents and submissions are stored as objects in **AWS S3**, not in the relational databases.

## 3. Technology Stack
- **Frontend Application:** React and Vite
- **Backend Services:** Java and Spring Boot
- **Databases:** JDBC-based SQL databases per service (with potential NoSQL for the Communication Service) and AWS S3 for files.
- **Asynchronous Messaging:** Amazon SQS (and potentially SNS).
- **Infrastructure as Code (IaC):** AWS CDK v2 (TypeScript)
- **Compute:** Amazon ECS with AWS Fargate (ARM64 / AWS Graviton)
- **Container Registry:** Amazon ECR
- **Networking:** VPC with Public IPv4 and Private IPv6 subnets

## 4. Repository Structure & IaC
The infrastructure is organized into:
- **`infrabaseline/`**: Foundational AWS infrastructure (Network/VPC, ECR Repositories, ECS Cluster). This must be deployed first as other stacks depend on its exported CloudFormation values.
- **`templateEcsService/`**: A template for creating new microservices. Each service is deployed as an Amazon ECS Fargate task containing its specific CDK stack (`infra/`).

## 5. Development & Deployment Workflow
### AWS Baseline Deployment
1. Navigate to `infrabaseline/`
2. Install dependencies: `npm install`
3. Deploy the baseline stacks: `npx cdk deploy --all`

### Microservice Creation and Deployment
1. Copy the `templateEcsService/` folder to a new directory named after the service.
2. Replace the placeholder code in `src/` with a standard Java/Spring Boot application (or React/Vite for the Web UI).
3. Build the Docker image and push it to the ECR repository.
4. Navigate to the `infra/` folder, adjust the `ServiceStack` properties (e.g., injecting SQS queues, S3 buckets, RDS credentials), and deploy via `npx cdk deploy`.

### Adding a Microservice to CI/CD
When a new microservice is fully structured, integrate it into `.github/workflows/ci.yml`:
1. **Path Filters:** Add new outputs and filters in the `dorny/paths-filter` step for `_code`, `_infra`, and `_any`.
2. **Workflow Job:** Create a new job utilizing `.github/workflows/reusable-service.yml` alongside the other services.
3. **CloudFront Integration:** Update the `cloudfront-deploy` job to `needs` your new service, and register your API routing (e.g. `/api/<service>/*`) in `cloudfront/bin/cloudfront.ts`.

*Note: Deployment currently uses the AWS CLI configured via SSO.*

## 6. Architecture Highlights & Infrastructure Best Practices
- **ARM64 / Graviton Architecture:** All ECS services are configured to run on `ARM64` architecture (AWS Graviton) for better cost-performance ratio. When creating Dockerfiles, ensure that dependencies or base images support `linux/arm64`.
- **Scheduled Scaling:** To minimize costs, services are subject to Scheduled Application Auto Scaling. They automatically scale up at 08:00 UTC and scale down to 0 at 18:00 UTC on weekdays. On weekends and outside these hours, the backend services are offline.

## 7. Coding Conventions and Guidelines
- **Backend Code:** Follow Spring Boot best practices. For the Workflow Service, leverage interfaces and dependency injection (or established Java plugin frameworks) to keep review processes pluggable.
- **Frontend Code:** Use functional React components and hooks.
- **AWS CDK:** 
  - Prefer using L2 constructs.
  - Use `cdk.Fn.importValue` to consume outputs from the `infrabaseline` stack.
  - Keep stack definitions modular and pass configurations via `StackProps`.

## 8. Important Notes for AI Agents
- **Extensibility & Plugins:** Always design the Workflow Service features with the plugin system in mind. Avoid hardcoding review logic (like masking names for double-blind) into the core service. Instead, abstract this into configurable plugin strategies.
- **Data Isolation & Communication:** If a service needs data from another, it must fetch it via a REST API call or, preferably, react to an asynchronous SQS event. 
- **Avoid hardcoding:** Values like Account IDs, Regions, and VPC CIDRs are managed in `infrabaseline/lib/constants.ts`.
- **IPv6 Networking:** Note that the private subnets use IPv6 (`ipv6Native = true`). Ensure security groups and routing are configured correctly for IPv6 when deploying private services.
- **Multi-module Docker Builds:** Module Dockerfiles must be executed from the project root (`docker build -f module/Dockerfile .`) to access the parent `pom.xml`. The root `.dockerignore` enforces a strict allowlist pattern.
- **Lombok Configuration:** Lombok must be explicitly added to the `maven-compiler-plugin`'s `<annotationProcessorPaths>` in the root `pom.xml`. Just adding the dependency causes silent processor failures and compile errors for `@Slf4j` in child modules. Also note that since we moved to `<dependencyManagement>`, you must declare `lombok` (and Spring Boot/AWS starters) explicitly in child modules that need them.
- **Testing Spring Security:** Avoid using `@WebMvcTest` when unit-testing controllers that rely on custom ABAC rules (`@PreAuthorize`). Write pure Mockito tests that inject the mock `Authentication` object directly. This bypasses missing/conflicting Spring Boot 4/3 test auto-configurations and speeds up testing.
- **AWS SQS Listeners:** If using `@ConditionalOnExpression` to disable AWS `@SqsListener` locally, ensure required dependencies (like `ObjectMapper`) are explicitly registered as `@Bean`s in an `@Configuration` class to prevent "missing bean" errors during deployment.
- **Amazon Verified Permissions (Cedar) Action IDs:** Cedar does **not** support glob/wildcard matching (`*`) in action IDs — it uses strict exact string equality. The `actionId` values in policy JSON files (e.g., `matching-policies.json`) must exactly match the string the Lambda authorizer sends to AVP at runtime. Since the Lambda constructs the action as `${httpMethod} ${event.resource}`, and `event.resource` uses API Gateway path templates (e.g., `/api/matching/examiners/{examinerId}`), policies must use the same template form: `patch /api/matching/examiners/{examinerId}` — **never** `patch /api/matching/examiners/*`. The Lambda authorizer must also avoid sending a `context` field to AVP unless the Cedar schema explicitly defines context attributes for each action.
- **DynamoDB Single-Table Design:** Services utilizing DynamoDB (like the Matching and Communication Services) implement the Single-Table Design pattern. Different entity types (e.g., a Submission's Status metadata and its 1-to-N Examiner Match relationships, or Chat Metadata and Messages) are stored in the same table, grouped by the Partition Key (`SUBMISSION#{id}`, `CHAT#{id}`) but separated by the Sort Key (`STATUS` vs `MATCH#{id}`, `META` vs `MSG#{sentAt}#{messageId}`). This separation prevents Race Conditions that would occur if appending to a nested array in a single item. Always structure DynamoDB interactions to leverage this PK/SK layout rather than creating multiple tables or using JOINs.
- **Communication Service Deterministic Chat IDs:** The `communicationService` creates Chat IDs deterministically by hashing the sorted participant Sub-UUIDs and the context string (`UUID.nameUUIDFromBytes()`). This avoids race conditions where two clients might simultaneously initiate a chat and duplicate the thread.
- **Server-Sent Events (SSE) & API Gateway Constraints:** The `communicationService` streams real-time messages to the `web-ui` using Spring's `SseEmitter`. However, **Amazon API Gateway REST APIs have a hard 29-second connection timeout**, meaning the connection drops periodically. The frontend uses `@microsoft/fetch-event-source` which natively handles these silent reconnects while allowing us to pass the `Authorization` header required by the Lambda Authorizer. *Note: In a multi-instance scaling scenario, the in-memory `SseEmitter` map will require a Pub/Sub backend (like Redis) to broadcast events between tasks.*
- **OpenAPI Code Generation:** When configuring the `openapi-generator-maven-plugin` to generate Spring Boot interfaces with `<interfaceOnly>true</interfaceOnly>` and `<generateSupportingFiles>false</generateSupportingFiles>`, you must also set `<skipDefaultInterface>true</skipDefaultInterface>` in the `<configOptions>`. Otherwise, the generated default methods will try to reference the missing `ApiUtil` class and cause compilation errors. Watch out for exact type mappings (like `JsonNullable<String>` and `OffsetDateTime`) which must be strictly passed when implementing the generated interfaces.
- **Spring Boot 4 WebMvcTest:** The project uses Spring Boot 4.x. The import for `@WebMvcTest` has changed to `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest` (it is no longer under `org.springframework.boot.test.autoconfigure.web.servlet`).
- **CloudFront API Caching:** API Gateway caching is configured globally in `cloudfront/lib/cloudfront-stack.ts`. The default `CACHING_OPTIMIZED` policy has a 24-hour TTL; if a shorter TTL is required, create and assign a custom `CachePolicy`.
- **Internal Service-to-Service Communication (ECS Service Connect):** Services call each other over HTTP using ECS Service Connect. Two CloudMap namespaces are used to avoid a CloudFormation collision:
  - `internal.services` — holds `AAAA` DNS records for **Lambda → ECS** communication. Use `ImportedRessources.getCloudMapNamespace()` for `createServiceDiscoveryAAAARecord()` only.
  - Never point `enableServiceConnect` at `internal.services` — doing so causes CloudFormation to fail with *"The Service already exists"* because both a `AAAA` record and a Service Connect entry would share the same name.
  - **ECS Service Connect does NOT support IPv6-only subnets.** The Envoy sidecar uses IPv4 iptables rules. Since all tasks run in an IPv6-only private subnet, `sc.internal` DNS names are unresolvable at runtime — `enableServiceConnect` is called only to satisfy CDK, not for actual traffic routing.
  - **ECS-to-ECS traffic uses the same `internal.services` AAAA records as Lambda.** Target service URLs follow the pattern `http://<service-name>.internal.services:<port>` and must be injected as environment variables using `cloudMapNamespace.namespaceName` (NOT `scNamespace.namespaceName`).
  - **The callee's security group must allow IPv6 ingress** on the container port: `ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(containerPort), '...')`. Internet-inbound IPv6 is blocked at the network level (Egress-Only IGW only).
  - See **`doc/notes/InternalServiceCommunication.md`** for a complete guide, CDK checklist, and the Matching → Workflow Service example.
