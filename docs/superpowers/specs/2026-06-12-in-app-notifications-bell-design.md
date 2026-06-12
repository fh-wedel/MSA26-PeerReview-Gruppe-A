# Design: In-App-Benachrichtigungen für die Glocke

**Datum:** 2026-06-12
**Status:** Genehmigt (Design), bereit für Implementierungsplan

## Ziel

Die Glocke (Notification-Icon) in der Navbar des Web-UI zeigt aktuell **Mock-Daten**
([web-ui/src/stubs/notifications.ts](../../../web-ui/src/stubs/notifications.ts)). Sie soll stattdessen
**echte, user-adressierte In-App-Benachrichtigungen** aus dem Notification Service anzeigen — mit
serverseitig persistentem Lese-Status und Echtzeit-Updates via Server-Sent Events (SSE).

### Entscheidungen (mit dem Nutzer abgestimmt)
- **Lese-Status:** voll persistent pro User (überlebt Reload/Gerätewechsel).
- **Aktualisierung:** Echtzeit via SSE (Pattern wie Communication Service) + Initial-Load.
- **Quellen:** echte Trigger in mehreren Services (siehe unten), nicht nur die Pipeline.

## Ausgangslage (Ist-Zustand)

- Der **Notification Service** kann ausschließlich **nach außen** versenden (EMAIL/SLACK/DISCORD) über
  ein pluggable Channel-System ([NotificationChannel](../../../notificationService/src/main/java/com/fh_wedel/notification/channel/NotificationChannel.java)).
  Zwei Eingänge: SQS-Listener und `POST /api/notification/send`. Beide laufen in den
  [NotificationDispatcher](../../../notificationService/src/main/java/com/fh_wedel/notification/service/NotificationDispatcher.java),
  der pro Versuch einen Audit-`NotificationLog` schreibt.
- Es gibt **kein** Konzept einer user-adressierten In-App-Notification mit Lese-Status.
- Der Service hat **keinen** Auth-/Security-Filter.
- CloudFront-Routing `/api/notification/*` existiert bereits ([cloudfront.ts:55](../../../cloudfront/bin/cloudfront.ts#L55)).
- Identität propagiert per `x-auth-principal-id`-Header (Lambda-Authorizer), normalisiert via
  `PrincipalNormalizer` (Referenz: [ChatController.getUserId()](../../../communicationService/src/main/java/com/fh_wedel/communication/controller/ChatController.java#L30)).
- SSE-Referenz-Implementierung: [ChatService](../../../communicationService/src/main/java/com/fh_wedel/communication/service/ChatService.java#L53).

## Datenfluss (End-to-End)

```
Producer-Service              Notification Service                 Web-UI (Glocke)
────────────────              ────────────────────                 ───────────────
Ereignis tritt ein
   │ SQS: NotificationEvent
   │ {channels:[IN_APP],
   │  recipientUserId: sub,…}
   └──────────────►  SqsNotificationListener
                          │
                     NotificationDispatcher  (unverändert)
                          │ channel = IN_APP
                          ▼
                     InAppChannel.send()
                          ├─ persist InAppNotification(userSub, read=false)
                          └─ SSE-Push an verbundene Clients dieses Users
                                          │
   GET  /me        (Initial-Load) ◄───────┤
   GET  /me/stream (SSE, live)    ◄────────┘
   PATCH /{id}/read · POST /me/read-all ──► read-Status persistent
```

## Komponenten

### 1. Notification Service — In-App-Konzept

**`ChannelType`**: Enum-Wert `IN_APP` ergänzen (zu DISCORD/EMAIL/SLACK).

**Neue Entity `InAppNotification`** (eigene Tabelle `in_app_notification`, **getrennt** vom
`notification_log`-Audit — der Audit-Log bleibt das Versand-Protokoll, die Entity ist der
user-sichtbare Posteingang mit Lese-Status):

| Feld | Typ | Hinweis |
|---|---|---|
| `id` | UUID | PK, generiert |
| `userSub` | String | Cognito-`sub` des Empfängers, indexiert |
| `title` | String | = `subject` |
| `body` | String (TEXT) | Nachrichtentext |
| `read` | boolean | default `false` |
| `createdAt` | Instant | default `now()` |

**`InAppNotificationRepository extends JpaRepository<InAppNotification, UUID>`**
- `List<InAppNotification> findByUserSubOrderByCreatedAtDesc(String userSub)`

**`InAppChannel implements NotificationChannel`** (fügt sich ins bestehende pluggable System ein):
- `getChannelType() = IN_APP`, `isEnabled() = true`
- `send(recipient, subject, body)`: persistiert `InAppNotification(userSub=recipient, title=subject,
  body=body, read=false)` und ruft den SSE-Service für den Live-Push auf.

Der `NotificationDispatcher` bleibt **unverändert** — er routet IN_APP automatisch an den Channel und
schreibt wie gehabt einen Audit-`NotificationLog` (bewusste, harmlose Doppelspeicherung: Audit =
„versendet an sub X", Entity = der Inbox-Eintrag mit Lese-Status).

### 2. SSE-Service

**`NotificationSseService`** spiegelt den ChatService-Pattern exakt:
- `ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>>` keyed by `userSub`.
- `subscribe(sub)`: `SseEmitter(25000L)` (< 29 s API-Gateway-Timeout), Auto-Detach bei
  completion/timeout/error.
- `push(sub, dto)`: sendet Event an alle Emitter des Users und ruft `complete()` direkt nach Send
  (damit der Lambda-Proxy die Response auflöst); Client reconnectet via fetch-event-source.

### 3. REST + SSE Endpoints (am bestehenden `/api/notification`)

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/me` | In-App-Notifications des Users, neueste zuerst → `List<NotificationDto>` |
| `GET` | `/me/stream` | SSE-Live-Stream (`text/event-stream`), Event-Name `notification` |
| `PATCH` | `/{id}/read` | Einzelne als gelesen markieren; Ownership-Check (`userSub == caller`) sonst 404 |
| `POST` | `/me/read-all` | Alle Notifications des Users als gelesen markieren |

**`NotificationDto`** (Vertrag zum Frontend, passt zur bestehenden `Notification`-Interface-Form):
`{ id: String, title: String, message: String (=body), read: boolean, date: String (ISO, =createdAt) }`

**Identität:** `x-auth-principal-id`-Header direkt im Controller lesen, via `PrincipalNormalizer`
(1:1 aus Communication Service übernehmen) zum `sub` normalisieren. Fehlt der Header → 401. Kein
volles Spring Security nötig.

### 4. Producer-Trigger (Quellen der Notifications)

Gemeinsamer JSON-Vertrag (= bestehende
[NotificationEvent](../../../notificationService/src/main/java/com/fh_wedel/notification/model/NotificationEvent.java)-Form):
```json
{ "eventType": "...", "channels": ["IN_APP"], "recipientUserId": "<sub>",
  "subject": "...", "body": "...", "metadata": { "submissionId": "..." } }
```
Jeder Producer definiert dafür ein **lokales** Record/DTO (Feld `channels` als `List<String>` →
Jackson mappt `"IN_APP"` beim Empfänger auf den Enum). Emit nur, wenn die Notification-Queue
konfiguriert ist (Guard wie beim bestehenden Success-Event in matching).

| # | Trigger | Service | Stelle | Empfänger | subject / body |
|---|---|---|---|---|---|
| 1 | Reviewer zugewiesen | Matching | nach `saveMatchBatch`, [MatchingService.java:113-118](../../../matchingService/src/main/java/com/fh_wedel/matching/service/MatchingService.java#L113) | jeder ausgewählte Reviewer (`examinerSub`) | „Review Assigned" / „You have been assigned to review submission `<id>`." |
| 2 | Matching fehlgeschlagen | Matching | FAILED-Branch, [MatchingService.java:90-96](../../../matchingService/src/main/java/com/fh_wedel/matching/service/MatchingService.java#L90) | Autor (`submitterId`) | „Matching Failed" / Grund-Text (nicht genug Reviewer) |
| 3 | Submission angelegt | Configuration | in `createConfiguration`, [ConfigurationService.java:42](../../../configuration-service/src/main/java/com/fh_wedel/configuration/service/ConfigurationService.java#L42) | Autor (`authorIds.get(0)`) | „Submission Created" / „Your submission '`<title>`' was submitted." |
| 4 | Review-Ergebnis verfügbar | Response | in `ResultService.save`, [ResultService.java:23](../../../responseService/src/main/java/com/fh_wedel/response/service/ResultService.java#L23) | Autor (`result.getAuthorId()`) | „Review Result Available" / „A review result is available for submission `<id>`." |

Hinweise pro Producer:
- **Matching** (#1, #2): nutzt bereits `SqsTemplate`. Nur neue Config `aws.sqs.notification.queue-name`
  + Emit-Logik.
- **Configuration** (#3): nutzt bereits `SqsTemplate`. Neue Config + Emit.
- **Response** (#4): hat **noch keinen** SQS-Producer → `SqsTemplate`-Nutzung + ggf. `spring-cloud-aws-sqs`-
  Dependency prüfen/ergänzen + Config + Emit. **Risiko/Mehraufwand** gegenüber den anderen.

### 5. Infrastruktur

- **Notification-Stack** erstellt seine Request-Queue bereits
  ([service-stack.ts:126](../../../notificationService/infra/lib/service-stack.ts#L126)) → Queue-Name/ARN
  als `CfnOutput` exportieren.
- **Producer-Stacks** (matching, configuration, response): Queue per ARN importieren
  (`Queue.fromQueueArn`), dem `taskDefinition.taskRole` **Write-Permission** geben und
  `SQS_NOTIFICATION_QUEUE` als Env injizieren (über `infra.ts`-Prop, analog zu
  `requestQueueNameNextService`).
- **Deploy-Reihenfolge:** Notification-Stack vor den Producer-Stacks.
- Response-Stack ggf. zusätzlich: SQS-Client-Auto-Config / Region-Env prüfen (erster SQS-Producer dort).

### 6. Frontend

- **Neuer Client `web-ui/src/api/notification.ts`** (Pattern wie
  [communication.ts](../../../web-ui/src/api/communication.ts), `getHeaders()`-Bearer-Token):
  - `fetchNotifications(): Promise<Notification[]>` → `GET /api/notification/me`
  - `markRead(id): Promise<void>` → `PATCH /api/notification/{id}/read`
  - `markAllRead(): Promise<void>` → `POST /api/notification/me/read-all`
  - `streamNotifications(onMessage, signal)` → `GET /api/notification/me/stream` via
    `@microsoft/fetch-event-source` (bereits Dependency) mit Authorization-Header + Auto-Reconnect.
- **[Navbar.tsx](../../../web-ui/src/components/Navbar.tsx)**: Mock ersetzen — Initial-Load via
  `fetchNotifications()`, Live-Updates via `streamNotifications()` (neue Notification vorne
  einfügen), „Mark all read" → `markAllRead()`, Klick auf Eintrag → `markRead(id)`. State-Form bleibt
  kompatibel (`id/title/message/read/date`); Icon-Logik (`title.includes('Review')`) funktioniert weiter.
- **`web-ui/src/stubs/notifications.ts`** entfernen.

## Bewusste Vereinfachungen (Projekt-Scope, YAGNI)

- **In-Memory-SSE-Map** ⇒ bei mehreren ECS-Tasks kann ein Live-Push verloren gehen (der SQS-Message-
  verarbeitende Task ist nicht zwingend der, der die SSE-Verbindung hält). Abgefangen durch
  Initial-Load + Reconnect: Notifications erscheinen spätestens beim nächsten Öffnen. Multi-Instance
  bräuchte Redis-Pub/Sub (gleiche bekannte Einschränkung wie Communication Service).
- Notification-Body referenziert nur die `submissionId` (Producer kennen keinen aufgelösten Titel,
  außer Configuration, das den Titel hat).
- Keine Pagination / kein „Löschen" von Notifications im MVP.

## Tests

- **Notification Service:** `InAppChannel.send` persistiert + pusht; Repository-Query-Reihenfolge;
  Controller-Endpoints inkl. Ownership-Check und 401 bei fehlendem Header (Mockito, kein `@WebMvcTest`
  — siehe AGENTS.md).
- **Producer:** je Service Unit-Test, dass bei dem Ereignis ein korrektes `NotificationEvent`-JSON an
  die Notification-Queue gesendet wird (SqsTemplate gemockt), inkl. Guard bei leerem Queue-Namen.
- **Infra:** CDK-Snapshot/Assertions für Queue-Export und Write-Grants (Stil wie bestehende
  Stack-Tests).
- **Frontend:** API-Client-Funktionen (fetch gemockt); Navbar rendert geladene Notifications und ruft
  bei Aktionen die richtigen Endpoints.
