# Postman-Dateien im YAML-Format

In diesem Ordner liegen die Postman-Dateien im **YAML-Format fuer lokale Dateien**.
JSON-basierte Exporte von Sammlungen und Umgebungen sind hier nicht mehr die massgebliche Quelle.

## Quelle der Anfragen

Die Anfragen werden ausschliesslich aus den externen OpenAPI-Spezifikationen erzeugt:

- `userService/src/main/resources/openapi/user.json`
- `responseService/src/main/resources/openapi/response.json`
- `submission-service/src/main/resources/openapi/submission.json`
- `matchingService/src/main/resources/openapi/matching.json`
- `communicationService/src/main/resources/openapi/communication.json`
- `notificationService/src/main/resources/openapi/notification.json`
- `configuration-service/configuration-core/src/main/resources/openapi/configuration.json`

Template-Spezifikationen und `openapi/client/*` werden bewusst ignoriert.

## Struktur

- `postman/collections/PeerReview External APIs/` enthaelt die Sammlung als Ordnerstruktur.
- Jede Anfrage liegt als `*.request.yaml` vor.
- Metadaten pro Sammlung/Ordner liegen unter `.resources/definition.yaml`.
- `postman/environments/default.environment.yaml` enthält alle benötigten Variablen.

## Authentifizierung

- Der Ordner `00 Auth` enthaelt Cognito-Anfragen fuer Anmeldung und Token-Aktualisierung.
- Der Authentifizierungs-Body nutzt `ClientId` als Umgebungsvariable.
- Benutzername/Passwort werden als Vault-Variablen referenziert (`{{vault:AWS_Cognito_User}}`, `{{vault:AWS_Cognito_Password}}`).
- Die Cognito-Region ist in den Authentifizierungsanfragen fest auf `eu-north-1` gesetzt.

## Neu erzeugen

Aus dem Wurzelverzeichnis des Repositorys:

```bash
python3 postman/generate_postman_assets.py
```

Das Skript verwendet nur die Python-Standardbibliothek und:

- erzeugt die komplette YAML-Sammlungsstruktur neu,
- entfernt veraltete Dateien innerhalb der erzeugten Sammlung,
- aktualisiert `default.environment.yaml` inklusive aller verwendeten `{{variablen}}` (ausser Vault-Variablen),
- entfernt veraltete JSON-Umgebungsdateien unter `postman/environments/`.
