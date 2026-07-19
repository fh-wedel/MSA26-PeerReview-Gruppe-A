# Configuration Service

Der Configuration Service verwaltet Abgabekonfigurationen, Fristen, Themengebiete und die Regeln des Review-Prozesses. Konfigurationen werden in DynamoDB gespeichert; neue Abgaben stoßen über Amazon SQS den Matching-Prozess an.

## Plugin-Architektur

Review-Verfahren und Abgabevorlagen sind nicht im Kernservice fest verdrahtet. Der Service lädt beim Start Plugin-JARs aus dem konfigurierten Verzeichnis (`PLUGINS_DIRECTORY`, standardmäßig `/app/plugins`) über Java SPI und `ServiceLoader`.

- `configuration-api/` enthält die Schnittstellen `ReviewTypePlugin` und `ReviewTemplatePlugin`.
- `configuration-core/` enthält REST-API, Persistenz und Plugin-Loader.
- `configuration-type-*/` implementiert Open, Single-Blind und Double-Blind Review.
- `configuration-template-*/` implementiert Vorlagen für unterschiedliche Abgabearten.

Neue Plugins werden als eigenes Maven-Modul implementiert und über eine passende Datei unter `META-INF/services/` registriert.

## API

Die OpenAPI-Beschreibung liegt unter `configuration-core/src/main/resources/openapi/configuration.json`. Sie umfasst:

- Erstellen und Lesen von Abgabekonfigurationen
- Abfragen von Fristen, Workflow-Regeln und Feedbackformularen
- Auflisten der verfügbaren Review-Verfahren und Vorlagen
- Verwalten von Themengebieten

## Lokale Prüfung

Vom Repository-Wurzelverzeichnis aus:

```bash
mvn test -pl configuration-service -am
docker build -f configuration-service/Dockerfile -t peerreview/configuration .
```

Der Docker-Build muss wegen der Maven-Module und Plugin-Abhängigkeiten aus dem Repository-Wurzelverzeichnis gestartet werden.

## Infrastruktur

Der CDK-Stack befindet sich unter `infra/` und stellt ECS Fargate, API Gateway, Verified Permissions, DynamoDB sowie die benötigten SQS-Berechtigungen bereit. Die Bereitstellung erfolgt regulär über die zentrale GitHub-Actions-Pipeline.
