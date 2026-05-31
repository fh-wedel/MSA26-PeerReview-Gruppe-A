# Template ECS Service
Dieser Service Stack dient als Vorlage für die Bereitstellung eines ECS Services. Er beinhaltet die notwendigen Ressourcen, um einen ECS Service zu erstellen und zu betreiben. Als Vorbedingung muss der Baseline Stack bereitgestellt sein, da der Service Stack auf Ressourcen des Baseline Stacks zugreift. Der Service Stack beinhaltet die folgenden Ressourcen:
- ECS Service
- ECS Task Definition
- CloudWatch Log Group
- API Gateway (Lambda Proxy auf den ECS Service)
- AWS Verified Permissions Policy Store und Policies
- AWS Cognito Integration (User Pool und App Client werden importiert)
- ECS Service Autoscaling (min/max Tasks mit CPU Target)

## API Gateway und Auth
Der Template-Stack stellt eine API über API Gateway bereit, das Anfragen per Lambda Proxy an den ECS Service weiterleitet. Die Autorisierung erfolgt ueber einen Verified Permissions Authorizer, der Cognito Access Tokens gegen einen Policy Store prueft. Die Policy Definitionen werden aus [templateEcsService/infra/verified-permissions/template-policies.json](templateEcsService/infra/verified-permissions/template-policies.json) geladen.

## Autoscaling
Autoscaling wird aktiv, sobald `minTaskCount` und `maxTaskCount` unterschiedlich sind. Die Zielauslastung fuer CPU kann optional gesetzt werden; sonst wird ein Default genutzt.

## Deployment
Bevor der Service Stack bereitgestellt werden kann, muss das Docker Image in ECR bereitgestellt werden. Dazu muss das Image gebaut und in das ECR Repository gepusht werden. Das ECR Repository wird im Baseline Stack bereitgestellt.

Zum bauen des Image stehen zwei Methoden zur auswahl:

### Manuelles Deployment:
Alternativ zum lokalen Vorgehen kann das Deployment auch manuell ueber die CI (workflow_dispatch) gestartet werden. Das lokale Vorgehen bleibt weiterhin moeglich und ist unten beschrieben.
1. Das Docker Image wird lokal gebaut und in das ECR Repository gepusht. Um das Image zu bauen (Aktuelles Arbeitsverzeichniss `<<ServiceName>>/`):
    `docker build -t fh-wedel/<<ServiceName>> .`
2. Anschließend muss Docker sich bei AWS ECR authentifizieren:
    `aws ecr get-login-password --region eu-north-1 --profile fh-wedel-msa | docker login --username AWS --password-stdin 395982336633.dkr.ecr.eu-north-1.amazonaws.com`
3. Das Image muss mit getaggt werden:
    `docker tag fh-wedel/<<ServiceName>>:latest 395982336633.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/<<ServiceName>>:latest`
4. Das Image wird in das ECR Repository gepusht:
    `docker push 395982336633.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/<<ServiceName>>:latest`
5. Optional kann mit dem folgenden Befehl vor dem Deployment überprüft werden welche CDK Änderungen vorgenommen werden:
    `npx cdk diff`
6. Der Service Stack wird mit dem folgenden Befehl deployt (Aktuelles Arbeitsverzeichniss `<<ServiceName>>/infra`):
    `npx cdk deploy`

Ein gesamtes Beispiel für den `template` Service mit einer AWS SSO konfigurierten AWS CLI und dem Profil `fh-wedel` könnte wie folgt aussehen:
```bash
cd templateEcsService/
docker build -t fh-wedel/template .
aws ecr get-login-password --region eu-north-1 --profile fh-wedel-msa | docker login --username AWS --password-stdin 395982336633.dkr.ecr.eu-north-1.amazonaws.com
docker tag fh-wedel/template:latest 395982336633.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/template:latest
docker push 395982336633.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/template:latest
cd infra/
npx cdk deploy --profile fh-wedel
```


### Automatisiertes Deployment mit GitHub Actions:
Die Service-Pipeline wird in [.github/workflows/ci.yml](.github/workflows/ci.yml) definiert und ruft das Template aus [.github/workflows/reusable-service.yml](.github/workflows/reusable-service.yml) auf.

Voraussetzungen im Repository:
- GitHub Actions Variable `AWS_REGION`
- GitHub Actions Secret `AWS_ROLE_ARN` (OIDC Role fuer `aws-actions/configure-aws-credentials`)

So startest du den Pipeline-Lauf:
1. Code aendern und pushen (Push auf `main` oder Pull Request).
2. Optional im GitHub UI den Workflow "CI" manuell starten (workflow_dispatch).

Was die Pipeline fuer den Service macht:
- Maven Build und Tests fuer den Service
- Infra Tests fuer den Service-Stack
- Docker Build und Push nach ECR
- `cdk diff` und optionales Deploy in die Umgebung `fh-wedel-prod`