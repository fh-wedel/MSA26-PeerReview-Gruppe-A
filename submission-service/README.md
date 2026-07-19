# Submission Service

Der Submission Service verwaltet Einreichungsentwürfe, Dokumentmetadaten und den Übergang zur final eingereichten Abgabe. Die eigentlichen Dokumente liegen in Amazon S3; Metadaten und Status werden in DynamoDB gespeichert.

## Funktionen

- Abgabeentwürfe erstellen und Details abrufen
- Abgabekonfigurationen an den Configuration Service weiterleiten
- zeitlich begrenzte S3-URLs für Upload und Download erzeugen
- hochgeladene Dokumente einer Abgabe auflisten
- Abgaben finalisieren und den weiteren Workflow über SQS anstoßen

Die vollständige Schnittstelle ist in `src/main/resources/openapi/submission.json` beschrieben.

## Kommunikation

Direkte Konfigurationsabfragen erfolgen intern über die IPv6-Service-Discovery-Adresse des Configuration Service. Statusänderungen und Benachrichtigungen werden über Amazon SQS ausgetauscht.

## Lokale Prüfung

Vom Repository-Wurzelverzeichnis aus:

```bash
mvn test -pl submission-service -am
docker build -f submission-service/Dockerfile -t peerreview/submission .
```

Der CDK-Stack unter `infra/` stellt ECS Fargate, API Gateway, Verified Permissions, DynamoDB, S3-Zugriffe und SQS-Integration bereit.
