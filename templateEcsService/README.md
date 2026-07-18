# Template ECS Service

Dieses Modul ist die Vorlage für neue Spring-Boot-Microservices. Es zeigt die im Projekt verwendete Grundstruktur aus Anwendung, Tests, OpenAPI-Beschreibung, Dockerfile und eigenem CDK-Stack.

Der Infrastrukturteil stellt abhängig von der Konfiguration ECS Fargate, API Gateway, Amazon Verified Permissions, CloudWatch Logs und Autoscaling bereit. Er importiert Netzwerk-, Cluster-, Cognito- und ECR-Werte aus `infrabaseline/`.

## Neuen Service ableiten

1. Verzeichnis kopieren und Modulnamen in Root-`pom.xml`, Dockerfile und CDK-Konfiguration anpassen.
2. Template-Endpunkte, OpenAPI-Spezifikation und Cedar-Policies durch die fachliche Implementierung ersetzen.
3. Service in `.github/workflows/ci.yml`, `.github/workflows/reusable-service.yml` und `cloudfront/bin/cloudfront.ts` registrieren.

## Lokale Prüfung

Dockerfiles der Maven-Module werden immer aus dem Repository-Wurzelverzeichnis gebaut:

```bash
mvn test -pl templateEcsService -am
docker build -f templateEcsService/Dockerfile -t peerreview/template .
```

Die Beispiel-Policies liegen unter `infra/verified-permissions/template-policies.json`.
