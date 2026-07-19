# AWS Infrastructure Baseline

Die Baseline stellt die gemeinsam genutzte AWS-Infrastruktur bereit, auf die alle Service-Stacks über CloudFormation-Exports zugreifen. Sie muss vor den einzelnen Microservices ausgerollt werden.

## Ressourcen

- VPC mit öffentlichen IPv4- und privaten IPv6-Subnetzen
- Internet Gateway und Egress-Only Internet Gateway
- ECS-Cluster für ARM64-Fargate-Tasks
- ECR-Repositories für die Container-Images
- Cognito User Pool und App Client
- Cloud-Map-Namespaces für interne Service-Erreichbarkeit
- gemeinsame Security Groups und Zertifikats-/DNS-Konfiguration

Account, Region, Domains und weitere zentrale Werte werden in `lib/constants.ts` gepflegt.

## Kosten- und Netzwerkentscheidungen

Die Backend-Tasks laufen überwiegend in IPv6-only-Subnetzen. Ausgehender Internetverkehr nutzt ein Egress-Only Internet Gateway, sodass weder öffentliche IPv4-Adressen noch NAT Gateways für jeden Service erforderlich sind. Eingehende Anfragen erreichen die Services über CloudFront, API Gateway und Lambda-Proxys.

ECS-Services verwenden Fargate Spot und zeitgesteuertes Autoscaling. Die Umgebung ist als universitäres Proof-of-Concept kostenoptimiert und nicht als hochverfügbare Produktionsarchitektur ausgelegt.

## Deployment

```bash
cd infrabaseline
npm ci
npm test
npx cdk deploy --all
```

Nach Änderungen an exportierten Werten müssen abhängige Service-Stacks gegebenenfalls erneut bereitgestellt werden.
