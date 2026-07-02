= Features der App

// MVP Feature set liste (Matthias) -- Explizit auch Features gegen Entschieden

Die Applikation (das "PeerReview"-System) ist als eine moderne, ereignisgesteuerte Microservice-Architektur implementiert. Sie umfasst eine interaktive Web-Oberfläche (React/Vite) sowie sieben dedizierte Backend-Services (Java/Spring Boot).

Im Folgenden werden alle im aktuellen MVP (Minimum Viable Product) implementierten Features detailliert aufgeschlüsselt.

== Web-UI (Frontend)
Das Frontend ist als Single-Page-Application (SPA) mit React, TypeScript und Material-UI (MUI) realisiert. Es bietet folgende Features:

- *Authentifizierung & Registrierung:* Login- und Registrierungsformulare, die nahtlos an AWS Cognito angebunden sind.
- *Rollenabhängiges Dashboard:* Zentrale Übersicht über Einreichungen, Zuweisungen, offene Chats und Benachrichtigungen. Die UI passt sich dynamisch an die Rolle des Benutzers an.
- *Einreichungserstellung & -verwaltung:*
  - Benutzeroberfläche zum Erstellen von Abgaben mit der Konfiguration von Titeln, Deadlines und Autoren.
  - Upload-Bereich für PDF-Dokumente via AWS S3 Presigned URLs mit direktem Client-Upload.
  - Möglichkeit, Einreichungen final abzugeben (Finalize & Submit), was weitere Uploads sperrt und den Review-Prozess triggert.
- *Intelligente Anonymisierung (Smart Anonymity):* Dynamisches Ausblenden (Redacting) von Autoren- oder Reviewer-Identitäten in der Detailansicht basierend auf den Workflow-Regeln (z.B. Double-Blind). Administratoren und Lehrer sehen die echten Namen, während sie für Autoren/Reviewer unleserlich geschwärzt werden.
- *Interaktiver Bewertungsbogen (Start Review):* Dynamisches Formular, das sich an das konfigurierte Schema (Rating-Sterne, Punkteskalen, Multiple-Choice oder Freitext) anpasst.
- *In-App Kommunikationsbereich (Chats):*
  - Chat-Übersicht getrennt nach generellen Direktnachrichten ("General") und abgabebezogenen Gruppen-Chats ("Submissions").
  - Dynamisches Suchen von Chatpartnern per Autocomplete.
  - Live-Streaming neuer Chatnachrichten im aktiven Widget über Server-Sent Events (SSE).
- *Echtzeit-Benachrichtigungen:* Eine Notification-Glocke und eine Inbox-Seite mit Live-Updates bei neuen Systemereignissen via SSE.
- *Benutzerverwaltung (User Management):*
  - Für Administratoren/Prüfungsbeamte: Tabellarische Ansicht aller Nutzer, Filterung nach Cognito-Gruppen (Admin, Reviewer, etc.).
  - Zuweisung von Nutzern zu Rollengruppen.
  - Spezifische Konfiguration von Reviewern (Aktivieren/Deaktivieren für das Matching, Zuweisen von fachlichen Themenbereichen via Autocomplete).
- *Admin-Dashboard:*
  - Übersicht der globalen Systemstatistiken (Benutzerzahlen, aktive Plugins).
  - Verwaltung gültiger Fachgebiet-Tags (Topic Tags) (Hinzufügen, Auflisten, Löschen).
  - Übersicht der registrierten Review-Typen und Review-Templates.
- *Theme-Support:* Umschaltbares Design zwischen Light-Mode und Dark-Mode.

== Backend-Microservices
Jeder Microservice arbeitet mit einer eigenen, isolierten Datenbank (PostgreSQL für relationale Daten, DynamoDB für dokumentenbasierte bzw. Single-Table-Strukturen) und kommuniziert über REST-Schnittstellen (synchron) sowie Amazon SQS (asynchron).

=== Benutzerverwaltung (User Service)
- *Cognito-Integration:* Zentrales Identitätsmanagement durch Anbindung an den AWS Cognito User Pool.
- *Benutzersuche (Präfixbasiert):* Endpunkt für die effiziente Suche nach Benutzern anhand von Namenspräfixen.
- *Massenauflösung (Bulk Resolve):* Post-Endpunkt zur schnellen Auflösung einer Liste von Cognito-Subs (UUIDs) in verständliche Benutzernamen (reduziert API-Calls im Frontend).
- *Gruppen- und Attributsverwaltung:* Endpunkte zum Hinzufügen/Entfernen von Nutzern zu Cognito-Gruppen und Editieren von Custom Attributes (z.B. `isActive` und `topicTags` für Reviewer).

=== Konfigurations- & Workflow-Service (Configuration Service)
- *Workflow-Abstraktion (Plugin-Architektur):* Schnittstelle zur dynamischen Bereitstellung von Begutachtungsprozessen (z.B. Open Review, Double-Blind) mit anpassbaren Regeln (Wer darf wen sehen? Ist ein Chat erlaubt?).
- *Dynamische Bewertungsbögen (Review Templates):* Bereitstellung von strukturierten Feedback-Formularen mit Fragen und Datentypen (Rating, Scale, Multiple Choice, Text).
- *Themen-Tag-Verwaltung:* CRUD-Schnittstelle für Topic-Tags, die zur thematischen Zuordnung von Arbeiten und Reviewern dienen.
- *Fristen- und Metadaten-Management:* Verwaltung von Deadlines für Einreichungen und Reviews sowie die Zuweisung von Fachbereichen zu einer Abgabekonfiguration.

=== Zuteilungsservice (Matching Service)
- *Automatisches Zuweisungs-Event:* SQS-Listener startet die Reviewer-Zuteilung automatisch, sobald eine Abgabe finalisiert wurde.
- *Fachgebiet-Matching:* Filtert Reviewer nach aktiven Profilen (`isActive=true`), schließt Selbstbegutachtung aus (Abgleich mit den `submitterIds`) und wählt nur Reviewer mit übereinstimmenden `topicTags` aus.
- *Prüfer-Zuteilung:* Wählt zufällig eine konfigurierte Anzahl von Prüfern aus dem gefilterten Pool aus.
- *Manuelle Zuweisung (Custom Reviewers):* Option zur gezielten Übergabe von Reviewer-IDs, was den automatischen Matching-Algorithmus überschreibt.
- *Transaktionale Persistenz:* Match-Datensätze werden transaktional in DynamoDB gespeichert. Bei unzureichender Reviewer-Anzahl wird der Status "FAILED" gesetzt.
- *SQS-Broker-Zuweisung:* Informiert den Submission-Service über erfolgreiche Zuweisungen und sendet Benachrichtigungsaufträge an den Notification-Service.

=== Einreichungs- & Dokumentenservice (Submission Service)
- *Abgabe-Lebenszyklus:* Steuerung des Prozesses von der Entwurfserstellung (Draft) bis zur finalen Abgabe.
- *Gruppenabgaben-Unterstützung:* Verwaltung von n-Autoren pro Einreichung über ein `authorIds`-Array.
- *AWS S3-Integration:* Generierung von sicheren, zeitlich begrenzten Presigned Upload- und Download-URLs für PDF-Arbeiten, um direkte, performante Dokumenten-Uploads ins S3-Bucket zu ermöglichen.
- *Event-gesteuertes Status-Tracking:* Ein SQS-Listener lauscht auf Ereignisse der anderen Services (z.B. "MATCHED" oder "REVIEW_COMPLETED") und aktualisiert den internen Status der Einreichung in der relationalen Datenbank.


=== Bewertungs- & Feedback-Service (Response Service)
- *Manuelles Review:* Endpunkt zum Einreichen von ausgefüllten Bewertungsformularen durch Reviewer (Abgleich der IDs mit den Zuweisungen des Matching-Service).
- *Asynchrones KI-Gutachten (Bedrock-Integration):*
  - SQS-Listener empfängt Anfragen für KI-Reviews.
  - Das PDF wird aus S3 geladen, das Formular-Schema vom Configuration-Service abgefragt und eine Bedrock-Proxy-Lambda aufgerufen.
  - Das LLM generiert ein strukturiertes Gutachten basierend auf den genauen Kriterien der Einreichung.
- *KI-Antwortvalidierung:* Automatisches Validieren und Parsen der KI-generierten JSON-Struktur gegen Datentypen, Wertegrenzen (z.B. maxPoints) und Pflichtfelder des hinterlegten Feedback-Schemas.
- *Ergebnis-Freigabe (Anonymitätsschutz):* Autoren können KI-Gutachten sofort einsehen, menschliche Gutachten werden jedoch erst freigegeben, sobald alle zugewiesenen menschlichen Reviews abgeschlossen sind.

=== Kommunikationsservice (Communication Service)
- *DynamoDB Single-Table Design:* Speicherung von Chats und Nachrichten in einer einzigen Tabelle zur Vermeidung von Race Conditions und Performance-Engpässen bei parallelen Zugriffen.
- *Deterministische Chat-IDs:* Generierung von Chat-IDs über Hashes der Teilnehmer-UUIDs zur Vermeidung doppelter Chats.
- *Server-Sent Events (SSE):* Streaming-Schnittstelle zur Echtzeitübertragung neuer Nachrichten an verbundene Clients.

=== Benachrichtigungsservice (Notification Service)
- *In-App Inbox:* Zentrale Datenbank für persönliche Benachrichtigungen der Benutzer.
- *Asynchrone Benachrichtigungs-Pipeline:* SQS-Listener verarbeitet Events aus dem Backend (z.B. "Review Assigned", "Matching Failed") und erstellt in-app Einträge.
- *Live-Push-Notification (SSE):* Streamt Benachrichtigungen in Echtzeit an den Browser, sobald ein SQS-Event verarbeitet wurde.
- *Statusverwaltung:* Endpunkte zum Markieren einzelner oder aller Benachrichtigungen als gelesen.
