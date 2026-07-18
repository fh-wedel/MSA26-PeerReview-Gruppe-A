# User Service

Der User Service ist die zentrale Schnittstelle des PeerReview-Systems zu Amazon Cognito. Andere Services müssen Cognito nicht direkt ansprechen, sondern können Nutzer, Gruppen und Reviewer-Attribute über diese API abfragen und verwalten.

## Funktionen

- Nutzer nach Benutzernamen suchen oder über ihre Cognito-Sub-ID auflösen
- mehrere Sub-IDs gesammelt in Benutzernamen auflösen
- Gruppenmitglieder auflisten, hinzufügen und entfernen
- vollständige Nutzerprofile lesen
- benutzerdefinierte Attribute, etwa Fachgebiete oder Aktivstatus, aktualisieren
- häufig verwendete Daten zwischenspeichern und den Cache über SQS invalidieren

Die vollständige Schnittstelle ist in `src/main/resources/openapi/user.json` beschrieben.

## Sicherheit und Infrastruktur

Der CDK-Stack unter `infra/` stellt den ARM64-Fargate-Service, API Gateway und Amazon Verified Permissions bereit. Der Service läuft in den privaten IPv6-Subnetzen und verwendet die vom Baseline-Stack exportierten Cognito-Ressourcen.

## Lokale Prüfung

Vom Repository-Wurzelverzeichnis aus:

```bash
mvn test -pl userService -am
docker build -f userService/Dockerfile -t peerreview/user .
```

Die produktive Bereitstellung erfolgt über `.github/workflows/ci.yml` und `.github/workflows/reusable-service.yml`.
