# Template ECS Service
Dieser Service Stack dient als Vorlage für die Bereitstellung eines ECS Services. Er beinhaltet die notwendigen Ressourcen, um einen ECS Service zu erstellen und zu betreiben. Als Vorbedingung muss der Baseline Stack bereitgestellt sein, da der Service Stack auf Ressourcen des Baseline Stacks zugreift. Der Service Stack beinhaltet die folgenden Ressourcen:
- ECS Service
- ECS Task Definition
- CloudWatch Log Group

## Deployment
Bevor der Service Stack bereitgestellt werden kann, muss das Docker Image in ECR bereitgestellt werden. Dazu muss das Image gebaut und in das ECR Repository gepusht werden. Das ECR Repository wird im Baseline Stack bereitgestellt.

Zum bauen des Image stehen zwei Methoden zur auswahl:

### Manuelles Deployment:
1. Das Docker Image wird lokal gebaut und in das ECR Repository gepusht. Um das Image zu bauen (Aktuelles Arbeitsverzeichniss `<<ServiceName>>/`):
    `docker build -t fh-wedel/<<ServiceName>> .`
2. Anschließend muss Docker sich bei AWS ECR authentifizieren:
    `aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 720830544039.dkr.ecr.eu-north-1.amazonaws.com`
3. Das Image muss mit getaggt werden:
    `docker tag fh-wedel/<<ServiceName>>:latest 720830544039.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/<<ServiceName>>:latest`
4. Das Image wird in das ECR Repository gepusht:
    `docker push 720830544039.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/<<ServiceName>>:latest`
5. Optional kann mit dem folgenden Befehl vor dem Deployment überprüft werden welche CDK Änderungen vorgenommen werden:
    `npx cdk diff`
6. Der Service Stack wird mit dem folgenden Befehl deployt (Aktuelles Arbeitsverzeichniss `<<ServiceName>>/infra`):
    `npx cdk deploy`

Ein gesamtes Beispiel für den `template` Service mit einer AWS SSO konfigurierten AWS CLI und dem Profil `fh-wedel` könnte wie folgt aussehen:
```bash
cd templateEcsService/
docker build -t fh-wedel/template .
aws ecr get-login-password --region eu-north-1 --profile fh-wedel | docker login --username AWS --password-stdin 720830544039.dkr.ecr.eu-north-1.amazonaws.com
docker tag fh-wedel/template:latest 720830544039.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/template:latest
docker push 720830544039.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/template:latest
cd infra/
npx cdk deploy --profile fh-wedel
```


### Automatisiertes Deployment mit GitHub Actions:
ToDo