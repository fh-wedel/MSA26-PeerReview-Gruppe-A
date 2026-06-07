# Internal Service-to-Service Communication

> **Audience:** AI agents and developers adding new microservices that need to call other services
> within the ECS cluster.

---

## Overview

Services inside the ECS cluster communicate with each other over **plain HTTP** using
**ECS Service Connect** for load-balanced, resilient calls.  
An external-facing **CloudMap `AAAA` record** per service is used separately by the
**API Gateway proxy Lambdas**, which need stable IPv6 DNS names.

These two mechanisms use **different CloudMap namespaces** to avoid a CloudFormation
conflict where both would try to register the same service name in the same namespace.

| Mechanism | CloudMap Namespace | Purpose |
|-----------|-------------------|---------|
| AAAA records | `internal.services` | Lambda → ECS (external, IPv6) |
| ECS Service Connect | `sc.internal` | ECS → ECS (internal mesh) |

---

## Architecture: Two CloudMap Namespaces

Both namespaces are `PrivateDnsNamespace` resources created by `BaselineCloudMapStack`
(`infrabaseline/lib/cloudmap.ts`) and exported via CloudFormation.

```
┌─────────────────────────────────────────────────────────────────┐
│  VPC                                                            │
│                                                                 │
│  CloudMap: internal.services          CloudMap: sc.internal     │
│  ┌─────────────────────────┐          ┌───────────────────────┐ │
│  │ workflow-service  [AAAA]│          │ workflow-service  [SC]│ │
│  │ matching          [AAAA]│          │ matching          [SC]│ │
│  └─────────────────────────┘          └───────────────────────┘ │
│          ▲                                      ▲               │
│   Lambda proxy                          ECS sidecar             │
│   (IPv6 DNS lookup)                     (localhost proxy)       │
│                                                                 │
│  ┌──────────────────┐   HTTP (via SC sidecar)  ┌─────────────┐ │
│  │  Matching Service│ ─────────────────────── ▶│  Workflow   │ │
│  └──────────────────┘                          └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Why the namespace split is necessary

ECS Service Connect automatically creates a CloudMap **`SRV`-type service** entry using
the same service name you supply in `discoveryName`. If a manual `CfnService` with a
`AAAA` record for the same service name already exists in the same namespace,
CloudFormation fails with **"The Service already exists"** during deployment.

By routing Service Connect to `sc.internal` the two registrations never collide.

---

## Infrastructure: CDK Setup

### 1. Exported namespace references (`infraLibrary/lib/importedRessources.ts`)

```typescript
// External-facing (Lambda → ECS) — AAAA records
ImportedRessources.getCloudMapNamespace(stack)        // internal.services

// Internal mesh (ECS → ECS) — Service Connect only
ImportedRessources.getServiceConnectNamespace(stack)  // sc.internal
```

### 2. Service stack pattern (every service's `infra/lib/service-stack.ts`)

Both namespaces must be imported and used for their respective roles:

```typescript
// Import both namespaces
const cloudMapNamespace = ImportedRessources.getCloudMapNamespace(this);   // internal.services
const scNamespace       = ImportedRessources.getServiceConnectNamespace(this); // sc.internal

// ① AAAA record — keeps the Lambda proxy working via IPv6 DNS
const sdService = EcsInfra.createServiceDiscoveryAAAARecord(
  this, props.serviceName, cloudMapNamespace
);

const ecsService = new ecs.FargateService(this, 'FargateService', { ... });

// Attach the AAAA record to the ECS service
const cfnService = ecsService.node.defaultChild as ecs.CfnService;
cfnService.serviceRegistries = [{ registryArn: sdService.attrArn }];

// ② Service Connect — uses the SEPARATE sc.internal namespace
ecsService.enableServiceConnect({
  namespace: scNamespace.namespaceName,   // ← sc.internal, NOT internal.services
});
```

> **If the service also needs to be reachable by other ECS services** (i.e., it acts as a
> *server* in the mesh), add a `services` block to `enableServiceConnect` with a named
> `portMappingName` (the container port mapping must also be given a `name`):
>
> ```typescript
> // Container port mapping must have a name
> portMappings: [{ name: 'app-port', containerPort: 8081, protocol: ecs.Protocol.TCP }]
>
> // Service Connect — expose this service inside the mesh
> ecsService.enableServiceConnect({
>   namespace: scNamespace.namespaceName,
>   services: [{
>     portMappingName: 'app-port',
>     port: 8081,
>     discoveryName: props.serviceName,
>     dnsName: `${props.serviceName}.${scNamespace.namespaceName}`,
>   }],
> });
> ```
>
> A service that only *calls* others (consumer-only) can omit the `services` array.

---

## Calling Another Service from Java (Spring Boot)

ECS Service Connect injects a **localhost sidecar proxy** on port 80 (or the declared
`port`) per registered upstream service.  The DNS name is resolved automatically inside
the task network.

### Step 1 — Inject the target URL via environment variable

In the caller's CDK `service-stack.ts`, pass the URL as an environment variable:

```typescript
environment: {
  // Resolves to http://workflow-service.sc.internal:8081 at runtime
  'WORKFLOW_SERVICE_URL':
    `http://workflow-service.${scNamespace.namespaceName}:${workflowPort}`,
},
```

> **Use `scNamespace.namespaceName` (= `sc.internal`), not `cloudMapNamespace.namespaceName`**,
> because Service Connect DNS resolution only works within the `sc.internal` namespace.

### Step 2 — Read the URL in Spring Boot

```java
@Value("${aws.workflow-service.url:http://workflow-service.sc.internal:8081}")
private String workflowServiceUrl;
```

The default value (`http://workflow-service.sc.internal:8081`) lets the service start
locally without the env var being set, though the call will fail without the actual
service running.

### Step 3 — Make the HTTP call using `RestTemplate`

Register `RestTemplate` as a bean (already done in `AppConfig.java`):

```java
@Bean
public RestTemplate restTemplate(RestTemplateBuilder builder) {
    return builder.build();
}
```

Inject and use it:

```java
private final RestTemplate restTemplate;
private final String workflowServiceUrl;

public MyService(RestTemplate restTemplate,
                 @Value("${aws.workflow-service.url}") String workflowServiceUrl) {
    this.restTemplate = restTemplate;
    this.workflowServiceUrl = workflowServiceUrl;
}

public WorkflowRulesDto fetchWorkflowRules(String submissionId) {
    String url = workflowServiceUrl + "/api/workflow/submissions/" + submissionId + "/rules";
    return restTemplate.getForObject(url, WorkflowRulesDto.class);
}
```

**Always wrap the call in a try-catch** — a network failure must not crash the caller:

```java
try {
    WorkflowRulesDto rules = restTemplate.getForObject(url, WorkflowRulesDto.class);
    // use rules
} catch (Exception e) {
    log.warn("Failed to call workflow service for submission {}", submissionId, e);
    // apply a safe default
}
```

### Real-world example

See how the **Matching Service** calls the **Workflow Service** to determine whether
examiner identities should be hidden:

- CDK env var: [`matchingService/infra/lib/service-stack.ts` L118](../../matchingService/infra/lib/service-stack.ts)
- Spring constructor injection: [`MatchingController.java` L55](../../matchingService/src/main/java/com/fh_wedel/matching/controller/MatchingController.java)
- HTTP call with fallback: [`MatchingController.java` L99–L109](../../matchingService/src/main/java/com/fh_wedel/matching/controller/MatchingController.java)

---

## Checklist: Adding a New Internal Caller

When service **A** needs to call service **B** (B must already be deployed and expose
itself via Service Connect):

- [ ] **CDK (A's `service-stack.ts`)**
  - Import `scNamespace` via `ImportedRessources.getServiceConnectNamespace(this)`
  - Add `enableServiceConnect({ namespace: scNamespace.namespaceName })` to A's `FargateService`
  - Inject B's URL as an env var: `'B_SERVICE_URL': \`http://${bServiceName}.${scNamespace.namespaceName}:${bPort}\``
- [ ] **CDK (B's `service-stack.ts`)** — B must advertise itself in the mesh:
  - Port mapping must have `name: 'app-port'`
  - `enableServiceConnect` must include a `services` block with `portMappingName`, `port`, `discoveryName`, and `dnsName`
- [ ] **Java (A's application)**
  - Add `@Value("${b.service.url:http://<b-name>.sc.internal:<port>}")` field
  - Declare `RestTemplate` as a bean in `AppConfig` (if not already present)
  - Wrap the HTTP call in `try-catch` and apply a safe fallback

---

## Quick Reference: Namespace DNS Names

| Service name (CDK `serviceName`) | Service Connect DNS name |
|----------------------------------|--------------------------|
| `workflow-service` | `workflow-service.sc.internal` |
| `matching` | `matching.sc.internal` |
| `<your-service>` | `<your-service>.sc.internal` |

Default port: whatever `containerPort` was declared in the CDK stack.

---

## Why NOT to use `internal.services` for Service Connect

The `internal.services` namespace holds `AAAA` (IPv6 address) records used by the
**Lambda → ECS** communication path.  If you point `enableServiceConnect` at that same
namespace, CloudFormation will try to create a second CloudMap `Service` entry with the
same service name and fail:

```
Resource handler returned message: "The Service already exists."
```

Always use `sc.internal` (= `ImportedRessources.getServiceConnectNamespace()`) for
any `enableServiceConnect` calls.
