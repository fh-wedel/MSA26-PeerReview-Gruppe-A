# MSA26-PeerReview Gruppe A
PeerReview: Ein System zum gegenseitigen Begutachten von wissenschaftlichen Arbeiten


# AWS Infrastructure
Die AWS Infrastruktur besteht aus einem Baseline Stack, welcher die grundlegende Infrastruktur bereitstellt, und mehreren Service Stacks, welcher die eigentliche Service-Infrastruktur in einer Microservice Architektur bereitstellt. Der Baseline Stack muss vor den Service Stacks bereitgestellt werden, da der Service Stack auf Ressourcen des Baseline Stacks zugreift.

Zum Start sollte die AWS CLI installiert und konfiguriert sein. Aufgrund der kurzen Sessionszeit empfiehlt es sich, die AWS CLI über SSO zu konfigurieren. Dazu muss die AWS CLI mit dem folgenden Befehl konfiguriert werden:
    ``aws configure sso``

# GitHub Actions Pipeline
Die CI/CD Pipelines laufen automatisch bei Push auf `main`, bei Pull Requests und manuell über "Run workflow".

## Voraussetzungen
- GitHub Actions Variable `AWS_REGION`
- GitHub Actions Secret `AWS_ROLE_ARN` (OIDC Role für `aws-actions/configure-aws-credentials`)

## Verhalten
- Änderungen in [infrabaseline/](infrabaseline/) triggern Tests und ein `cdk diff`; Deploy läuft nur bei `main` oder manueller Ausführung.
- Änderungen in [infraLibrary/](infraLibrary/) triggern deren Tests und können Service-Infrastruktur beeinflussen.
- Änderungen in [templateEcsService/](templateEcsService/) triggern Maven-Tests, Infra-Tests, Docker Build/Push und optional Deploy.

## Manuelles Deployment
1. Im GitHub UI den Workflow "CI" starten (workflow_dispatch).
2. Das Deploy läuft dann in der Umgebung `deploy-manual`.

## Hinweise
- `cdk diff` läuft immer vor einem Deploy.
- Docker Images werden in das konfigurierte ECR Repository gepusht.