# Matching Service

Der Matching Service ordnet Abgaben geeigneten Reviewern zu. Matching-Aufträge werden über Amazon SQS empfangen, Ergebnisse in DynamoDB gespeichert und anschließend an nachgelagerte Services weitergegeben.

## Matching-Ablauf

1. Der Service erhält Abgabe-ID, Autoren, gewünschte Reviewer-Anzahl, Themengebiet und optional vorgegebene Reviewer.
2. Reviewer-Profile werden über den User Service geladen.
3. Autoren, inaktive Nutzer und fachlich unpassende Reviewer werden ausgeschlossen.
4. Vorgegebene Reviewer werden direkt verwendet; andernfalls wird die benötigte Anzahl aus dem geeigneten Pool ausgewählt.
5. Status und einzelne Zuordnungen werden im DynamoDB-Single-Table-Design persistiert.
6. Beteiligte Services und Nutzer werden über SQS-Ereignisse informiert.

## API

Die OpenAPI-Beschreibung liegt unter `src/main/resources/openapi/matching.json`.

- `GET /matches/submissions/{submissionId}` liefert Status und Reviewer einer Abgabe.
- `GET /matches/examiners/{examinerUsername}` liefert die einem Reviewer zugeordneten Abgaben.

## Datenhaltung

Einträge einer Abgabe verwenden gemeinsam `PK = SUBMISSION#{id}`. Der Sort Key trennt den Status (`STATUS`) von den einzelnen Zuordnungen (`MATCH#{reviewerId}`). Ein sekundärer Index ermöglicht die Abfrage nach Reviewer.

## Lokale Prüfung

Vom Repository-Wurzelverzeichnis aus:

```bash
mvn test -pl matchingService -am
docker build -f matchingService/Dockerfile -t peerreview/matching .
```

Der CDK-Stack unter `infra/` stellt ECS Fargate, API Gateway, Verified Permissions, DynamoDB und die SQS-Integration bereit.
