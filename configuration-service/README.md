# Configuration Service

## Service Allgemein
Der Configuration Service (auch Creation Service genannt) ist für die Erstellung und Verwaltung von Abgabe-Konfigurationen (Submission Configurations) zuständig. Er ermöglicht es Dozenten oder Prüfungsämtern, die Rahmenbedingungen für wissenschaftliche Arbeiten festzulegen. 

Zu den konfigurierbaren Parametern gehören:

- Der Review-Prozess-Typ (z. B. `SINGLE_BLIND`, `OPEN_REVIEW`, `DOUBLE_BLIND`).
- Die Anzahl der benötigten Prüfer/Gutachter (`numberOfExaminers`).
- Fristen für die Abgabe (`submissionDeadline`) und die Begutachtung (`reviewDeadline`).
- Bewertungskriterien (`evaluationCriteria`) und deren Sichtbarkeit für Autoren (`criteriaVisibleToAuthor`).

Nach erfolgreicher Konfigurationserstellung stößt der Service ereignisgesteuert (Event-Driven) den Zuweisungsprozess an, indem er ein `MatchingRequestEvent` in die SQS-Queue (`matching-request-queue`) publiziert.

---

## MVP (Minimum Viable Product)
Der MVP umfasst die Kernfunktionalitäten zur Verwaltung der Konfigurationen und der Event-Auslieferung:
* REST-Schnittstellen zum Erstellen, Auslesen und Auflisten von Konfigurationen.
* Autorisierungsprüfungen auf Basis von Cognito-Rollen und Benutzer-IDs.
* Persistierung der Daten in einer DynamoDB-Tabelle unter Verwendung des Single-Table-Designs.
* Asynchrone Benachrichtigung des Matching Services via SQS.

---

## Business- und Sicherheitsregeln

### Rollen- und Berechtigungskonzept
Die Autorisierung erfolgt über AWS Verified Permissions (Cedar-Policies). Auf Code-Ebene ist die Absicherung über Spring Securitys `@PreAuthorize` umgesetzt:
* **Admin / ExaminationOfficer**: Vollzugriff auf alle Endpunkte, einschließlich der Auflistung aller Konfigurationen im System.
* **Teacher / Reviewer**: Lese- und Schreibzugriff (Erstellung von Konfigurationen).
* **Author (Student)**: 
  * Darf Konfigurationen nur erstellen, wenn er selbst in der Liste der Autoren (`authorIds`) aufgeführt ist.
  * Darf nur die Konfigurationen einsehen, bei denen er als Autor eingetragen ist.
  * Sieht die Bewertungskriterien (`evaluationCriteria`) nur, wenn `criteriaVisibleToAuthor` auf `true` gesetzt ist. Andernfalls werden diese in der API-Antwort maskiert (ausgeblendet).

---

## Technische Umsetzung

### REST API

* **`POST /api/configuration`**: Erstellt eine neue Konfiguration.
  * **Payload (JSON):**
    ```json
    {
      "title": "Masterarbeit - PeerReview System",
      "reviewProcessType": "SINGLE_BLIND",
      "authorIds": ["author-uuid-222"],
      "numberOfExaminers": 2,
      "submissionDeadline": "2026-06-30T23:59:59Z",
      "reviewDeadline": "2026-07-31T23:59:59Z",
      "evaluationCriteria": ["Originalität", "Methodik", "Verständlichkeit"],
      "criteriaVisibleToAuthor": true
    }
    ```
* **`GET /api/configuration/{submissionId}`**: Ruft die Konfiguration für eine spezifische Abgabe ab.
* **`GET /api/configuration/author/{authorId}`**: Listet alle Konfigurationen eines bestimmten Autors auf (GSI-Abfrage).
* **`GET /api/configuration`**: Listet alle Konfigurationen im System auf (nur Admin/ExaminationOfficer).

---

### SQS (Asynchrone Kommunikation)
Nach der Speicherung einer neuen Konfiguration in der Datenbank wird ein Event an die `matching-request-queue` gesendet:
* **Payload (Event):**
  ```json
  {
    "submissionId": "0e19eceb-1c99-44f7-a1f5-646da332d2e1",
    "numberOfExaminers": 2,
    "reviewProcessType": "SINGLE_BLIND"
  }
  ```

---

### Datenbank (DynamoDB Single-Table Design)
Die Datenhaltung erfolgt in der Tabelle `configuration-service-configs` mit folgendem Schema:

1. **Konfigurations-Metadaten:**
   * **PK:** `CONFIG#{SubmissionID}`
   * **SK:** `METADATA`
   * *Attribute:* `title`, `reviewProcessType`, `numberOfExaminers`, `submissionDeadline`, `reviewDeadline`, `evaluationCriteria`, `criteriaVisibleToAuthor`, `creatorId`, `creatorRole`, `createdAt`

2. **Author-Zuordnung (1-zu-N):**
   * **PK:** `CONFIG#{SubmissionID}`
   * **SK:** `AUTHOR#{AuthorID}`
   * *Attribute:* `authorId`, `submissionId`
   * *Zweck:* Ermöglicht die schnelle Zuordnung von Autoren zu Konfigurationen.

* **Global Secondary Index (GSI):**
  Um effizient alle Konfigurationen für einen bestimmten Autor abzufragen, ist der Index **`AuthorIndex`** eingerichtet:
  * **Partition Key (GSI-PK):** `authorId`
  * **Sort Key (GSI-SK):** `submissionId`

---

## Lokale Entwicklung und Testing

### Voraussetzungen
1. **AWS CLI & SSO konfigurieren:** Der lokale Container verbindet sich mit den echten AWS-Ressourcen (DynamoDB/SQS) in der Cloud unter Verwendung deines lokalen AWS SSO-Profils (`fh-wedel-msa`).
   ```bash
   aws sso login --profile fh-wedel-msa
   ```

### Starten mit Docker Compose
1. Baue das Docker Image und starte den Service zusammen mit den restlichen Microservices im Repository-Root:
   ```bash
   docker compose up --build configuration-service
   ```
2. **Hinweis zum lokalen Networking (IPv6 vs IPv4):**
   Da die AWS-Dienste in ECS Fargate standardmäßig über native IPv6-Subnetze angesprochen werden, ist die JVM im Dockerfile standardmäßig auf IPv6 konfiguriert. Für die lokale Ausführung auf dem Mac ist in `docker-compose.yml` ein `entrypoint`-Override hinterlegt, um IPv4-Fallback für die Verbindung zu AWS zu erzwingen.

### Manuelles Testen via curl
Da der API Gateway im lokalen Docker-Compose-Setup umgangen wird, kannst du die HTTP-Header manuell setzen, um Authentifizierung und Rollen zu simulieren:

* **Als Dozent eine Konfiguration erstellen:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
       -H "x-auth-username: prof-teacher" \
       -H "x-auth-groups: Teacher" \
       -H "x-auth-principal-id: PeerReviewUserPool|teacher-uuid-333" \
       -d '{"title": "A Study on Peer Review System", "reviewProcessType": "SINGLE_BLIND", "authorIds": ["author-uuid-222"], "numberOfExaminers": 2, "submissionDeadline": "2026-06-30T23:59:59Z", "reviewDeadline": "2026-07-31T23:59:59Z", "evaluationCriteria": ["Originality", "Clarity"], "criteriaVisibleToAuthor": true}' \
       http://localhost:8082/api/configuration
  ```

---

## Deployment in AWS ECR und ECS

### 1. ECR Repository erstellen (falls noch nicht vorhanden)
Falls das ECR-Repository in AWS noch nicht existiert, muss der Baseline ECR-Stack neu bereitgestellt werden:
```bash
cd infrabaseline/
npx cdk deploy BaselineECRRepositoryStack --profile fh-wedel-msa
```

### 2. Docker Image bauen und in ECR pushen
1. Authentifiziere Docker bei AWS ECR:
   ```bash
   aws ecr get-login-password --region eu-north-1 --profile fh-wedel-msa | docker login --username AWS --password-stdin 395982336633.dkr.ecr.eu-north-1.amazonaws.com
   ```
2. Tagge und pushe das lokale Image:
   ```bash
   docker tag 395982336633.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/configuration:latest 395982336633.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/configuration:latest
   docker push 395982336633.dkr.ecr.eu-north-1.amazonaws.com/fh-wedel/configuration:latest
   ```

### 3. CDK Stacks deployen
Navigiere in das `infra/`-Verzeichnis des Services und deploye die Stacks (`ConfigurationAuthStack`, `ConfigurationApiStack`, `ConfigurationServiceStack`):
```bash
cd configuration-service/infra
npm install
npx cdk deploy --all -c serviceName=configuration --profile fh-wedel-msa --require-approval never
```
