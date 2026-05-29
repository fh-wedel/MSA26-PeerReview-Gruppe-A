# Submission Service (Konfiguration- und Einreiche-Service)

Dieser Service Stack stellt den **Submission Service** für das gegenseitige Begutachten von wissenschaftlichen Arbeiten bereit. Er verwaltet Abgabe-Konfigurationen (Fristen, Gutachter-Zuweisung, dynamische Bewertungsbögen) und studentische Gruppenarbeiten. 

Der Stack beinhaltet die folgenden Ressourcen:
- ECS Service & ECS Task Definition (Fargate)
- CloudWatch Log Group
- API Gateway (Lambda Proxy auf den ECS Service)
- AWS Verified Permissions Policy Store und Policies
- AWS Cognito Integration (User Pool und App Client werden importiert)
- ECS Service Autoscaling (min/max Tasks mit CPU Target)
- AWS S3 Integration für Direkt-Uploads von PDF-Arbeiten

## API Gateway und Auth
Der Service stellt eine REST-API über das API Gateway bereit. Die Autorisierung erfolgt über einen Verified Permissions Authorizer, der Cognito Access-Tokens gegen einen Policy Store prüft. Die Policy-Definitionen werden aus [submission-service/infra/verified-permissions/template-policies.json](submission-service/infra/verified-permissions/template-policies.json) geladen.

Exponierte REST-API-Endpunkte unter `/api/submission`:
- `GET /status` — API-Statusabfrage
- `GET /time` — Server-Uhrzeit & Benutzerkennung
- `POST /configurations` — Erstellen einer Abgabefrist (durch Lehrende/Prüfungsamt oder Autoren)
- `POST /submissions` — Erstellen eines Entwurfs (durch Autoren, Gruppenarbeit unterstützt)
- `POST /submissions/{id}/presigned-url` — S3 Presigned URL Generierung für Direkt-Uploads
- `PUT /submissions/{id}` — Bearbeitung von Metadaten und Hochladepfaden
- `POST /submissions/{id}/submit` — Abgabe finalisieren und SQS-Ereignis auslösen
- `GET /configurations/{id}/grading-form` — Abruf des zugehörigen Bewertungsbogens (Fakultäts-Rubriken)

## SQS & Messaging
Der Service kommuniziert asynchron über SQS. Wenn eine Abgabe finalisiert wird, veröffentlicht der Service ein `SUBMISSION_SUBMITTED`-Ereignis in die SQS-Antwort-Queue (`SQS_RESPONSE_QUEUE`).

## Deployment
Bevor der Service Stack bereitgestellt werden kann, muss das Docker-Image in ECR bereitgestellt werden.

### Manuelles Deployment:
1. Docker Image lokal bauen:
    `docker build -t fh-wedel/submission-service .`
2. Docker bei AWS ECR authentifizieren:
    `aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 720830544039.dkr.ecr.eu-north-1.amazonaws.com`
3. Image taggen:
    `docker tag fh-wedel/submission-service:latest 720830544039.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/submission-service:latest`
4. Image zu ECR pushen:
    `docker push 720830544039.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/submission-service:latest`
5. Service Stack per CDK bereitstellen:
    `cd infra/`
    `npx cdk deploy`

Ein vollständiges Beispiel für ein Profil `fh-wedel`:
```bash
cd submission-service/
docker build -t fh-wedel/submission-service .
aws ecr get-login-password --region eu-north-1 --profile fh-wedel | docker login --username AWS --password-stdin 720830544039.dkr.ecr.eu-north-1.amazonaws.com
docker tag fh-wedel/submission-service:latest 720830544039.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/submission-service:latest
docker push 720830544039.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/submission-service:latest
cd infra/
npx cdk deploy --profile fh-wedel
```