# Communication ECS Service

Der Communication Service ist Teil des PeerReview-Systems und verantwortlich für die Bereitstellung einer Chat-Funktionalität, über die Benutzer miteinander kommunizieren können. Er verwendet DynamoDB als Datenspeicher (Single-Table Design) und bietet REST-APIs zum Suchen von Benutzern (Proxy für Cognito), Listen von Chats und Senden/Abrufen von Nachrichten.

## Architektur & Entscheidungen

Der Service basiert auf:
- Java 25 & Spring Boot 4
- AWS SDK v2 (DynamoDB Enhanced Client & Cognito Client)
- AWS ECS Fargate
- Amazon API Gateway mit Lambda Authorizer (Amazon Verified Permissions)

### Architectural Decisions (ADR)
1. **DynamoDB Single-Table Design**: Da Chatverläufe und Metadaten eine hohe Skalierbarkeit erfordern und rein transaktional sind, wurde auf RDS/PostgreSQL verzichtet. Stattdessen wird DynamoDB genutzt:
   - `PK: CHAT#{chatId}`, `SK: META` (Chat Metadaten)
   - `PK: CHAT#{chatId}`, `SK: MSG#{sentAt}#{messageId}` (Nachrichten sortiert nach Zeit)
   - `PK: USER#{userId}`, `SK: CHAT#{chatId}` (Bidirektionale Linking-Tabelle für effizientes Auflisten aller Chats eines Nutzers).
2. **Deterministische Chat-IDs**: Um Race Conditions beim Erstellen eines neuen Chats (zwei Nutzer schreiben gleichzeitig die erste Nachricht) zu verhindern, wird die `chatId` deterministisch erzeugt: `UUID.nameUUIDFromBytes(lowerSub + ":" + upperSub + ":" + context)`.
3. **Cognito Wrapper**: Der Service agiert als Wrapper um AWS Cognito (`listUsers`), damit die Web-UI Empfänger über Benutzernamen (Prefix-Suche) finden kann, ohne dass direkte Frontend-Cognito-Berechtigungen nötig sind.
4. **Server-Sent Events (SSE)**: Für Echtzeitkommunikation liefert der Endpoint `/chats/stream` Spring `SseEmitter` Instanzen. Da das AWS API Gateway (REST API) Verbindungen jedoch nach 29 Sekunden hart trennt, muss der Client transparent neu verbinden (`@microsoft/fetch-event-source`). Bei einem Scale-out (mehrere ECS Tasks) ist zudem ein Pub/Sub-Broker nötig; aktuell wird der Zustand in-memory gehalten.
5. **Kein Caching**: Da es sich um Echtzeit-Kommunikation handelt, ist das API Gateway Caching in CloudFront explizit für diesen Service deaktiviert.

## OpenAPI Generierung
Die Schnittstellen (Interfaces und Models) werden über das `openapi-generator-maven-plugin` aus `src/main/resources/openapi/communication.json` generiert. Um Kompilierungsfehler mit fehlenden `ApiUtil`-Klassen zu vermeiden, ist in der `pom.xml` `<skipDefaultInterface>true</skipDefaultInterface>` gesetzt. Optionale Felder verwenden `JsonNullable<T>`, Zeitstempel `OffsetDateTime`.

## Lokale Entwicklung

```bash
# Baue das Projekt und generiere OpenAPI Klassen
mvn clean install

# Starte den Service lokal
mvn spring-boot:run
```

Stelle sicher, dass in deiner Entwicklungsumgebung AWS Credentials konfiguriert sind, falls du auf AWS Ressourcen wie DynamoDB zugreifen möchtest.