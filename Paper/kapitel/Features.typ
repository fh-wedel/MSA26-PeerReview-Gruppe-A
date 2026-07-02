= Features der App

// MVP Feature set liste (Matthias) -- Explizit auch Features gegen Entschieden

Die Applikation (das "PeerReview"-System) ist in eine Web-Oberfläche und diverse zuständige Backend-Microservices unterteilt. Die folgenden Funktionen wurden für das MVP (Minimum Viable Product) implementiert:

== Benutzer- und Rollenverwaltung (User Service)
- *Identitätsmanagement:* Anbindung an AWS Cognito zur Verwaltung der Benutzer und Authentifizierung.
- *Benutzersuche & -auflösung:* Endpunkte zum Suchen von Benutzern anhand von Präfixen oder zum massenhaften Auflösen von IDs (Sub-UUIDs) zu Benutzernamen.
- *Rollenbasierter Zugriff (RBAC):* Gruppenverwaltung für Rollen wie Admin, ExaminationOfficer, Teacher, Reviewer und Author, inklusive Zugriffsbeschränkungen auf bestimmte Systemaktionen.
- *Profil-Details:* Abrufen und Ändern von Benutzer-Metadaten (Custom Attributes).

== Prozess- und Formular-Konfiguration (Configuration Service)
- *Einrichtungs-Parameter:* Konfigurieren von Parametern für Einreichungen wie Deadlines (Abgabe/Review), Anzahl der Prüfer und der gewünschte Begutachtungsprozess.
- *Review-Typen (Plugin-Architektur):* Flexibles System zur Unterstützung unterschiedlicher Begutachtungs-Workflows (z.B. Double-Blind, Open-Review) mit anpassbaren Regeln (Anonymität, Chat-Erlaubnis).
- *Review-Templates:* Bereitstellung von Bewertungsschemata und Formularen (Feedback Forms), die für Einreichungen gelten.
- *Themen und Kategorisierung:* Verwaltung von fachlichen Themen-Tags (Topic Tags), die für das Routing/Matching genutzt werden können.

== Automatisierte Zuweisung (Matching Service)
- *Ereignisgesteuertes Matching:* Automatischer Start eines Zuteilungs-Prozesses nach Eingang des SQS-Events.
- *Themenbasiertes Matching:* Zuweisung einer definierten Anzahl von Prüfern (Examinern) zu einer abgeschlossenen Einreichung, gefiltert nach den Topic-Tags des Prüfers und der Einreichung (oder direkter Zuweisung von Custom Reviewers).
- *Zuweisungs-Übersichten:* Abfragen für Prüfer (zugewiesene Arbeiten) und für Arbeiten (zuständige Prüfer).

== Einreichungen & Dokumentenverwaltung (Submission Service)
- *Gruppenabgaben:* Unterstützung für Einreichungen mit mehreren Autoren (1-zu-N Bindung).
- *Einreichungsprozess:* Erstellen einer Einreichung, Upload von Dokumenten und finales Abschließen der Einreichung.
- *Status-Tracking:* Verfolgung und Aktualisierung des Einreichungsstatus basierend auf SQS-Events (z.B. Match gefunden, Review abgeschlossen).
- *Cloud-Speicherung:* Hochladen und Herunterladen von Dokumenten (PDFs) direkt über AWS S3 mittels Presigned URLs.
- *Zugriffskontrolle:* Rollenbasierte Filterung, sodass Autoren nur auf ihre eigenen und Prüfer nur auf zugewiesene Einreichungen Zugriff haben.

== Begutachtungsprozess & Resultate (Response Service)
- *Manuelles Review:* Einreichen von ausgefüllten Bewertungsformularen und Feedback zu Dokumenten.
- *AI-Review (Integration):* Anfragen von automatisiertem, KI-generiertem Feedback zu hochgeladenen wissenschaftlichen Arbeiten.
- *Ergebnis-Einsicht:* Aggregierte Ansicht von Review-Ergebnissen je Einreichung oder gefiltert nach Autor.

== In-App Kommunikation (Communication Service)
- *Chats:* Chat-Sitzungen zwischen Nutzern mit dem Austausch von Textnachrichten.
- *Echtzeit-Synchronisation:* Server-Sent Events (SSE) für das Livestreaming neuer Chat-Nachrichten im Frontend.

== Benachrichtigungssystem (Notification Service)
- *System-Benachrichtigungen:* Versenden von Benachrichtigungen aufgrund von Ereignissen im Backend (via SQS).
- *Benutzer-Inbox:* Verwaltung ungelesener Benachrichtigungen im System und Markieren als (alle) gelesen.
- *Echtzeit-Benachrichtigungen:* Integration von SSE für sofortige Updates bei Benachrichtigungseingang.
