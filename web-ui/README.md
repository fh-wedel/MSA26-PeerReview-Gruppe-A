# PeerReview Web UI

Die Weboberfläche des PeerReview-Systems basiert auf React, TypeScript, Vite und Material UI. Sie bündelt Anmeldung, Abgaben, Reviews, Benutzerverwaltung, Benachrichtigungen und Chats in einer Anwendung.

## Lokale Entwicklung

```bash
cd web-ui
npm ci
npm run dev
```

Für die lokale Cognito-Anmeldung werden `VITE_COGNITO_CLIENT_ID` und `VITE_COGNITO_DOMAIN` aus `.env.development` verwendet. Das produktive Container-Image enthält Platzhalter, die beim Start durch `entrypoint.sh` mit den ECS-Umgebungsvariablen ersetzt werden.

## Qualitätssicherung

```bash
npm test
npm run lint
npm run build
```

Die Tests werden mit Vitest und Testing Library ausgeführt.

## API-Clients

Die Dateien unter `src/api/generated/` werden aus den OpenAPI-Beschreibungen der Backend-Services erzeugt:

```bash
npm run generate:api
```

Manuelle Änderungen an generierten Clients sollten vermieden werden.

## Echtzeitfunktionen

Chats und In-App-Benachrichtigungen verwenden Server-Sent Events. Da API Gateway REST API Verbindungen nach spätestens 29 Sekunden beendet und die Anmeldung einen `Authorization`-Header benötigt, nutzt das Frontend `@microsoft/fetch-event-source` für automatische Wiederverbindungen.

## Deployment

Das Docker-Image wird als ARM64-Fargate-Service mit Nginx betrieben. Der CDK-Stack liegt unter `infra/`; CloudFront bildet die gemeinsame öffentliche Domain für Web UI und Backend-APIs.
