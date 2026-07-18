# Web UI Infrastructure

Dieser AWS-CDK-Stack stellt die Web UI als ARM64-Container auf ECS Fargate bereit und bindet sie über API Gateway an die zentrale CloudFront-Distribution an.

Zusätzlich aktualisiert eine Custom-Resource-Lambda den Cognito App Client um die aktuelle CloudFront Callback- und Logout-URL. Die benötigten Baseline-Ressourcen werden über CloudFormation-Exports importiert.

## Prüfung

```bash
cd web-ui/infra
npm ci
npm test
npm run build
npx cdk synth -c serviceName=web-ui
```

Die reguläre Bereitstellung übernimmt die zentrale GitHub-Actions-Pipeline.
