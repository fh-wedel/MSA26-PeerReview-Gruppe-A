# Internal Service-to-Service Communication

> **Audience:** AI agents and developers adding new microservices that need to call other services
> within the ECS cluster.

---

## Overview

Services inside the ECS cluster communicate with each other by resolving **CloudMap `AAAA`
DNS records** and connecting over IPv6 — the same mechanism the API Gateway proxy Lambdas use.

> **ECS Service Connect is NOT used for ECS-to-ECS calls.**  
> ECS Service Connect's Envoy sidecar proxy supports IPv4 only. All ECS tasks in this
> project run in an **IPv6-only private subnet** (`ipv6Native = true`), so Service Connect

---

## How Calls Work

```
┌────────────────────────────────────────────────────────────────┐
│  VPC — IPv6-only private subnet                                │
│                                                                │
│  CloudMap: internal.services                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  workflow-service  AAAA → [IPv6 task address]           │  │
│  │  matching          AAAA → [IPv6 task address]           │  │
│  └─────────────────────────────────────────────────────────┘  │
│          ▲                         ▲                           │
│   Lambda proxy resolves       ECS task resolves                │
│   (API Gateway → ECS)         (ECS → ECS, same mechanism)     │
│                                                                │
│  ┌──────────────────┐   HTTP over IPv6   ┌──────────────────┐ │
│  │  Matching Service│ ─────────────────▶ │  Workflow Service│ │
│  │  resolves AAAA   │                    │  SG allows :8081 │ │
│  └──────────────────┘                    │  from anyIpv6    │ │
│                                          └──────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Resolution flow:**
1. Caller resolves `workflow-service.internal.services` → gets the task's `AAAA` IPv6 address
2. Caller opens a TCP connection to `[IPv6]:8081` over the IPv6-only subnet
3. The callee's security group allows the traffic (`anyIpv6` on the container port)

---

## One CloudMap Namespaces — Why They Exist

| Namespace | Purpose | Used by |
|-----------|---------|---------|
| `internal.services` | `AAAA` records → actual IPv6 task addresses | Lambda proxies AND ECS-to-ECS calls |

---

## Infrastructure: CDK Setup

### Namespace references (`infraLibrary/lib/importedRessources.ts`)

```typescript
// For AAAA records (Lambda→ECS AND ECS→ECS actual traffic)
ImportedRessources.getCloudMapNamespace(stack)        // internal.services

```

### Service stack pattern — every `infra/lib/service-stack.ts`

```typescript
const cloudMapNamespace = ImportedRessources.getCloudMapNamespace(this);       // internal.services

// ① AAAA record — used by BOTH Lambda proxies and other ECS tasks
const sdService = EcsInfra.createServiceDiscoveryAAAARecord(
  this, props.serviceName, cloudMapNamespace  // ← always internal.services
);

const ecsService = new ecs.FargateService(this, 'FargateService', { ... });

const cfnService = ecsService.node.defaultChild as ecs.CfnService;
cfnService.serviceRegistries = [{ registryArn: sdService.attrArn }];

```

### Security group rule — callee must allow IPv6 ingress

Any service that receives calls from other ECS tasks must explicitly open its container
port to IPv6 traffic. Add this **in the callee's service stack**:

```typescript
// Lambdas → ECS (existing, unchanged)
ecsSecurityGroup.addIngressRule(lambdaSg, ec2.Port.tcp(containerPort), 'Lambda proxy');

// ECS → ECS via AAAA record resolution over IPv6.
// Internet-inbound IPv6 is blocked at the network layer (only an Egress-Only IGW
// exists on the private subnet — no inbound route from the internet).
ecsSecurityGroup.addIngressRule(
  ec2.Peer.anyIpv6(),
  ec2.Port.tcp(containerPort),
  'Inbound HTTP IPv6 from VPC services (ECS-to-ECS via AAAA record)'
);
```

---

## Calling Another Service from Java (Spring Boot)

### Step 1 — Inject the URL via CDK environment variable

In the **caller's** `service-stack.ts`, pass the target URL using `cloudMapNamespace`
(`internal.services`), not `scNamespace`:

```typescript
environment: {
  // ECS-to-ECS uses the AAAA record in internal.services (same as Lambda→ECS).
  // Do NOT use scNamespace — that namespace is IPv4 Service Connect only.
  'WORKFLOW_SERVICE_URL':
    `http://workflow.${cloudMapNamespace.namespaceName}:8081`,
},
```

### Step 2 — Read the URL in Spring Boot

```java
@Value("${aws.workflow-service.url:http://workflow.internal.services:8081}")
private String workflowServiceUrl;
```

### Step 3 — HTTP call with `RestTemplate`

Register `RestTemplate` as a bean in `AppConfig` (already present in every service):

```java
@Bean
public RestTemplate restTemplate(RestTemplateBuilder builder) {
    return builder.build();
}
```

Inject and call with a safe fallback:

```java
public MyService(RestTemplate restTemplate,
                 @Value("${aws.workflow-service.url}") String workflowServiceUrl) {
    this.restTemplate = restTemplate;
    this.workflowServiceUrl = workflowServiceUrl;
}

public WorkflowRulesDto fetchWorkflowRules(String submissionId) {
    String url = workflowServiceUrl + "/api/workflow/submissions/" + submissionId + "/rules";
    try {
        return restTemplate.getForObject(url, WorkflowRulesDto.class);
    } catch (Exception e) {
        log.warn("Failed to call workflow service for submission {}", submissionId, e);
        return null; // apply a safe default in the caller
    }
}
```

### Real-world example

The **Matching Service** calls the **Workflow Service** to check if examiner anonymity
is enforced:

- CDK env var: [`matchingService/infra/lib/service-stack.ts`](../../matchingService/infra/lib/service-stack.ts) — `WORKFLOW_SERVICE_URL`
- Spring `@Value` injection: [`MatchingController.java` L55](../../matchingService/src/main/java/com/fh_wedel/matching/controller/MatchingController.java)
- HTTP call with fallback: [`MatchingController.java` L99–L109](../../matchingService/src/main/java/com/fh_wedel/matching/controller/MatchingController.java)

---

## Checklist: Adding a New Caller (Service A calls Service B)

### On service B (callee — the one being called)

- [ ] AAAA record already registered via `createServiceDiscoveryAAAARecord(..., cloudMapNamespace)` ✓ (all services have this)
- [ ] **Add IPv6 ingress** to B's security group:
  ```typescript
  ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(containerPort),
    'Inbound HTTP IPv6 from VPC services (ECS-to-ECS via AAAA record)');
  ```

### On service A (caller)

- [ ] **CDK** — inject B's URL using `cloudMapNamespace` (NOT `scNamespace`):
  ```typescript
  'B_SERVICE_URL': `http://${bServiceName}.${cloudMapNamespace.namespaceName}:${bPort}`,
  ```
- [ ] **Java** — read the URL with a fallback default:
  ```java
  @Value("${b.service.url:http://<b-name>.internal.services:<port>}")
  private String bServiceUrl;
  ```
- [ ] **Java** — inject `RestTemplate` (bean in `AppConfig`) and wrap calls in `try-catch`

---

## Quick Reference: DNS Names

| Service | AAAA DNS name (actual traffic) |
|---------|-------------------------------|
| `workflow-service` | `workflow.internal.services` |
| `matching` | `matching.internal.services` |
| `<your-service>` | `<your-service>.internal.services` |

Port: whatever `containerPort` is declared in the service's CDK stack
(e.g. `workflow-service` → `8081`, `matching` → `8081`).

---

## Why ECS Service Connect Cannot Be Used Here

ECS Service Connect injects an **Envoy proxy sidecar** that intercepts traffic using
**iptables rules on IPv4 loopback**. This requires the container to have an IPv4 address.

All ECS tasks in this project run in an **IPv6-only subnet** (`ipv6Native = true`,
no IPv4 addresses assigned). The Envoy sidecar cannot bind or redirect traffic without
IPv4, so:

- `workflow.sc.internal` will resolve to nothing → `UnresolvedAddressException`
- Even if DNS somehow resolved, the Envoy iptables rules would not fire → `ConnectException`

The correct pattern — AAAA record + direct IPv6 TCP — is what both Lambda proxies and
ECS-to-ECS callers use.
