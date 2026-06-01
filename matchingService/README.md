# Matching Service
## Service Allgemein
Der Matching Service ist das Bindeglied zwischen der Erstellung einer Abgabe und deren finaler Einreichung. Er hat die Aufgabe, initial erstellte Abgaben (vom Creation Service) mit einem oder mehreren Prüfern zu matchen.

Der Service agiert ereignisgesteuert (Event-Driven). Er empfängt asynchron Zuweisungsanfragen, ermittelt die zuständigen Prüfer aus dem zentralen Identity Provider (AWS Cognito), persistiert den Match und informiert den nachgelagerten Submission Service. Zusätzlich stellt er eine logische REST-Schnittstelle bereit, um als Proxy (Durchreiche) für Prüfer-Stammdaten zu fungieren und Matching-Informationen abzufragen.

## MVP (Minimum Viable Product)
Der MVP umfasst ausschließlich die Kernfunktionalität für einen funktionierenden "Happy Path"-Workflow:
* Empfang einer SQS-Nachricht vom Creation Service, um eine neue Abgabe zu erfassen.
* Zuweisung eines beliebigen (random) Users aus dem AWS Cognito User Pool (Gruppe "Prüfer") zur Abgabe.
* Persistierung des erfolgreichen Matches in einer DynamoDB-Tabelle.
* Versand einer SQS-Nachricht an den Submission Service, um den erfolgreichen Match zu melden.
* Bereitstellung grundlegender REST-APIs zum Auslesen von Matches sowie zur Verwaltung von Prüfern in Cognito (Proxy-Funktion).

## Business Regeln
* **Dynamische Prüferanzahl:** Eine Abgabe kann von mehr als einem Prüfer geprüft werden. Die exakte Anzahl der benötigten Prüfer (`numberOfExaminers`) wird vom Creation Service dynamisch im Event-Payload mitgeliefert.
* **Prüfer-Auswahl (MVP):** Für den MVP erfolgt die Auswahl der Prüfer zufällig aus dem Pool der vorhandenen Prüfer. Komplexeres Kapazitäts- und Fachgebiets-Routing ist im MVP noch nicht aktiv.
* **Single Source of Truth:** Alle Stammdaten, Verfügbarkeiten und Metadaten der Prüfer liegen exklusiv in AWS Cognito. Der Matching Service hält keinen eigenen dauerhaften Zustand über die Prüfer selbst, sondern fragt diese zur Laufzeit ab.

## Technische Umsetzung

### SQS (Asynchrone Kommunikation)
* **Input (Creation Service -> Matching Service):**
    * Der Matching Service stellt eine `MatchingRequestQueue` bereit.
    * **Payload (Event):** Enthält die `SubmissionID` sowie die `numberOfExaminers`.
* **Output (Matching Service -> Submission Service):**
    * Der Matching Service publiziert das Ergebnis in die `SubmissionRequestQueue` (bereitgestellt vom Submission Service).
    * **Payload (Event):** Enthält die `SubmissionID` und ein Array der zugewiesenen `ExaminerIDs` (Cognito IDs).

### REST API (Synchrone Kommunikation)
Um das Prinzip der *Separation of Concerns* logisch einzuhalten, werden die Endpunkte in zwei fachliche Handler/Proxies unterteilt:

**1. Matching API (Kern-Domäne):**
* `GET /matches/submissions/{submissionId}`: Gibt alle gematchten Prüfer zu einer bestimmten Abgabe zurück.
* `GET /matches/examiners/{examinerId}`: Gibt alle Abgaben zurück, die diesem Prüfer (identifiziert via Cognito ID oder E-Mail) zugewiesen wurden.

**2. User Proxy API (Cognito-Durchreiche):**
* `GET /examiners`: Gibt alle verfügbaren Prüfer aus Cognito zurück.
* `GET /examiners/{examinerId}`: Gibt alle Details zu einem spezifischen Prüfer zurück.
* `POST /examiners`: Legt einen neuen Prüfer in Cognito an (inkl. Custom Attributes für Fachgebiet, Verfügbarkeit, Aktiv-Status).
* `PATCH /examiners/{examinerId}`: Aktualisiert die Metadaten/Custom Attributes eines Prüfers in Cognito.
* `DELETE /examiners/{examinerId}`: Löscht einen Prüfer aus Cognito.

### Rollen- und Berechtigungskonzept
Die Autorisierung erfolgt zentral über AWS Verified Permissions (Cedar Policies). Der Zugriff auf die APIs ist wie folgt geregelt:
* **Admin**: Vollzugriff auf alle Endpunkte.
* **ExaminationOfficer (Prüfungsamt)**: Lesezugriff auf Matches pro Abgabe (`/matches/submissions/*`) sowie Lese- und Schreibzugriff zur Prüferverwaltung (User Proxy API).
* **Reviewer (Gutachter)**: Lesezugriff auf die *eigenen* zugewiesenen Abgaben (`/matches/examiners/*`).
* **Author (Verfasser)**: Lesezugriff auf die Matches der *eigenen* Abgabe (`/matches/submissions/*`).
* **Teacher (Dozent)**: Kein zusätlzicher Zugriff, da sowieso Berechtigung des Reviewers gegeben ist.

### Datenbank (DynamoDB Single Table Design)
Die Speicherung der Matches erfolgt in einer einzigen DynamoDB-Tabelle, die auf Abfrage-Performance optimiert ist.

* **Primärschlüssel (Für Abfragen pro Abgabe):**
    * **Partition Key (PK):** `SUBMISSION#{SubmissionID}`
    * **Sort Key (SK):** `MATCH#{ExaminerID}`
    * *Attribute:* `Timestamp`
* **Global Secondary Index / GSI (Für Abfragen pro Prüfer):**
    * **GSI-PK:** `{ExaminerID}`
    * **GSI-SK:** `{SubmissionID}` (oder `Timestamp`)

### AWS Cognito (User Management)
* Ein dedizierter User Pool enthält alle Nutzer. Prüfer sind durch die Zuweisung zu einer spezifischen Gruppe ("Prüfer") gekennzeichnet.
* Metadaten (Fachgebiet, Auslastung, Aktivitätsstatus) werden über *Custom Attributes* direkt am User-Objekt in Cognito verwaltet.

## Out of Scope / Limitierungen
Da dieser Service im Rahmen eines universitären Proof-of-Concepts (PoC) entwickelt wird und von einem geringen Traffic-Volumen auszugehen ist, werden folgende Aspekte für den MVP bewusst vernachlässigt:
* **Idempotenz:** Es gibt keine Absicherung gegen mehrfach eintreffende SQS-Nachrichten (Exactly-Once-Processing).
* **Fehlerbehandlung (DLQ):** Es werden keine Dead Letter Queues (DLQs) für nicht verarbeitbare Nachrichten oder fehlgeschlagene API-Aufrufe zum Submission Service implementiert.
* **Transaktionssicherheit (Outbox Pattern):** Das Schreiben in die DynamoDB und das Absenden der nachgelagerten SQS-Nachricht erfolgen nicht in einer verteilten Transaktion. Schlägt der SQS-Versand fehl, verbleibt der Match dennoch in der Datenbank.
* **Rate Limiting / Caching:** Die Live-Abfrage der Prüfer-Daten gegen AWS Cognito bei jedem Match verzichtet auf eine Caching-Schicht, da AWS-Quotas durch die erwartete Last nicht erreicht werden.