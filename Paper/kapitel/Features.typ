= Features der App

Die Applikation (das "PeerReview"-System) umfasst eine interaktive Web-Oberfläche sowie sieben dedizierte Backend-Services.
Im Folgenden werden alle im aktuellen @MVP implementierten Features aus Nutzersicht anhand eines einfachen Lastenhefts und der Nutzung von typischen Benutzergeschichten (User Stories) dargestellt.

== Lastenheft

Das Lastenheft beschreibt das Grundkonzept des Systems sowie die daraus abgeleiteten funktionalen und nichtfunktionalen Anforderungen.

=== Konzept

Das Konzept legt die Zielgruppen des Systems und deren jeweilige Ziele als Grundlage für die nachfolgenden Anforderungen fest.

==== Zielgruppen

Das System unterscheidet fünf Zielgruppen mit jeweils eigenen Rollen und Berechtigungen.

*Autoren / Studierende*: Autoren bzw. Studierende nutzen das System als zentrale Plattform zur Abwicklung ihrer Einreichungen, wie beispielsweise Abschlussarbeiten oder Seminararbeiten.

*Lehrende*: Dozierende legen Abgaben für Autoren an, konfigurieren das gewünschte Begutachtungsverfahren sowie den Bewertungsbogen.

*Reviewer*: Reviewer begutachten ihnen zugewiesene Arbeiten, vergeben Bewertungen anhand des vorgegebenen Bewertungsbogens und beantworten Rückfragen der Autoren.

*Prüfungsamt*: Das Prüfungsamt nimmt eine administrative Rolle ein. Die Mitarbeiter pflegen den Gutachterpool, hinterlegen Fachgebiete und steuern Profile.

*System-Administration*: Die System-Administration ist für die technische Überwachung und globale Konfiguration zuständig. Sie verwaltet Profile, Berechtigungen und globale Themen-Tags und behält den Überblick über registrierte Review-Typen (Plugins) und aktive Templates.

==== Ziele der Nutzer

Autoren verfolgen das Ziel, ihre wissenschaftlichen Arbeiten fristgerecht einzureichen und nachvollziehbares Feedback zu erhalten. Lehrende möchten den Begutachtungsprozess für ihre Abgaben passend konfigurieren. Reviewer wollen ihnen zugewiesene Arbeiten effizient und strukturiert begutachten können. Das Prüfungsamt verfolgt das Ziel, zentrale Abgaben sowie den Gutachterpool zu verwalten und jederzeit den Gesamtüberblick über laufende Verfahren zu behalten. Die System-Administration möchte Nutzer, Berechtigungen und Systemkomponenten zentral pflegen können.

=== Funktionale Anforderungen

Die funktionalen Anforderungen gliedern sich nach den fünf Zielgruppen und beschreiben die ihnen jeweils zur Verfügung stehenden Funktionen im @MVP.

==== Autoren / Studierende
- *Abgaben selbstständig anlegen:* Erstellen eigener Arbeiten (z. B. Abschlussarbeiten) als Einzel- oder Gruppenarbeit unter Angabe von Mitautoren sowie (je nach Vorlage) Wunschprüfern und individuellen Fristen.
- *Wissenschaftliche Arbeiten einreichen:* Hochladen eines Dokuments im Format PDF zur konfigurierten Abgabe vor Ablauf der Abgabefrist.
- *Fristen und Status im Blick behalten:* Übersicht anstehender Fristen im Kalender und Live-Verfolgung des Bearbeitungsstands der eigenen Abgabe auf dem Dashboard.
- *Ergebnisse & Feedback abrufen:* Detaillierte Einsicht in Noten, Kommentare und ausgefüllte Kriterien nach Abschluss der Bewertung.
- *Fragen klären (Chat):* Austausch mit Gutachtern über den integrierten Chat (aktiviert bei Open Review, deaktiviert bei Doppelblind / Einfach-Blind zur Wahrung der Anonymität).
- *Echtzeit-Benachrichtigungen:* Erhalt von In-App-Meldungen bei Statusänderungen der eigenen Abgabe (z. B. nach erfolgreicher Erstellung oder Vorliegen einer Bewertung).
- *Gutachten durch KI anfordern:* Ein durch KI generiertes Gutachten kann zur eigenen Arbeit angefordert werden.

==== Lehrende
- *Abgaben anlegen und konfigurieren:* Erstellen neuer Arbeiten mit individuellen Titeln, Deadlines, Mitautoren und Themen-Tags, die von Autoren einzureichen sind.
- *Review-Verfahren & Kriterien bestimmen:* Auswahl des Review-Prozesses (Doppelblind, Einfach-Blind, Open Review) sowie Auswahl des Bewertungsbogens über die Art der Abgabe.
- *Automatische oder manuelle Definition des Reviewers*: Manuelle Auswahl eines Reviewers (sich selbst, wenn eine anschließende Einsicht über den Status erwünscht ist) oder Verzicht auf eine Auswahl für das automatische Matching.

==== Reviewer
- *Zugewiesene Arbeiten einsehen:* Übersicht über alle Einreichungen, bei denen man als Gutachter eingeteilt ist.
- *Abgaben begutachten:* Download der eingereichten Arbeiten im Format PDF zur Korrektur.
- *Bewertungen abgeben:* Ausfüllen des vom Lehrenden vorgegebenen Bewertungsbogens im System mit Noten und textuellem Gesamt-Feedback.
- *Direktkommunikation (Chat):* Austausch mit Autoren über einen integrierten Chat (aktiviert bei Open Review, deaktiviert bei Doppelblind / Einfach-Blind zum Schutz der Anonymität).
- *Echtzeit-Benachrichtigungen:* Erhalt von In-App-Meldungen bei neu zugewiesenen Arbeiten zur Begutachtung.
- *Gutachten durch KI anfordern:* Ein durch KI generiertes Gutachten kann als Unterstützung bei der Begutachtung angefordert werden.

==== Prüfungsamt
- *Zentrale Abgaben konfigurieren:* Erstellen offizieller Abgaben mit globalen Fristen und Bewertungsbögen für Studierende.
- *Gutachterpool pflegen:* Registrierung von Prüfern im System inklusive Hinterlegen von Fachgebieten (Themen-Tags) und Aktivieren/Deaktivieren von Profilen.
- *Überwachung des Gesamtprozesses:* Uneingeschränkte Sicht auf den Status aller Abgaben, automatischen Zuweisungen, Deadlines und Korrekturfortschritte im System.
- *Systemstatistiken einsehen:* Übersicht über globale Kennzahlen wie Benutzerzahlen, aktive Plugins und Templates im Admin-Bereich.
- *Benutzer und Rollen verwalten:* Zuweisung von Berechtigungsgruppen (z. B. Lehrender, Reviewer, Autor, Prüfungsamt) für registrierte Benutzer.

==== System-Administration
- *Globale Benutzerverwaltung:* Umfassende Verwaltung aller Profile und Systemberechtigungen.
- *Systemkomponenten einsehen:* Übersicht über registrierte Review-Typen (Plugins) und aktive Templates sowie Verwaltung globaler Themen-Tags.

Für technische Störungen oder Zuweisungskonflikte existiert im @MVP keine dedizierte, korrigierende Eingriffsmöglichkeit über die Anwendung. Weder Lehrende noch die System-Administration können fehlerhafte automatische Zuweisungen manuell übersteuern (siehe @sec:out-of-scope).

=== Nichtfunktionale Anforderungen

Die nichtfunktionalen Anforderungen umfassen allgemeine Qualitätsmerkmale der Anwendung sowie technische Rahmenbedingungen der zugrunde liegenden Infrastruktur.

==== Allgemeine Anforderungen
- *Rollenbasierte Oberfläche:* Jede der fünf Zielgruppen erhält ein auf ihre Aufgaben zugeschnittenes Dashboard mit den jeweils relevanten Funktionen.
- *Anonymität:* Bei Doppelblind- und Einfach-Blind-Verfahren müssen identifizierende Informationen (Namen, Chat) für die jeweils andere Partei zuverlässig verborgen bleiben.
- *Echtzeit-Rückmeldung:* Statusänderungen (neue Zuweisung, abgeschlossene Bewertung) müssen den betroffenen Nutzern zeitnah als In-App-Benachrichtigung angezeigt werden.
- *Bedienbarkeit:* Die Web-Oberfläche muss ohne Schulung durch die genannten Zielgruppen bedienbar sein.

==== Technische Anforderungen
- *Microservice-Architektur:* Die sieben Backend-Services sind eigenständig deploybar und kommunizieren synchron über REST sowie asynchron über @SQS (siehe @ch:architecture).
- *Database-per-Service:* Jeder Service verwaltet seine eigene, isolierte Datenbank; ein Datenaustausch zwischen Services erfolgt ausschließlich über APIs oder @SQS, nicht über direkte Datenbankzugriffe.
- *Dokumentenablage:* Eingereichte Dokumente im Format PDF werden als Objekte in @S3 gespeichert.
- *Plugin-Architektur im Workflow Service:* Unterschiedliche Begutachtungsverfahren (Doppelblind, Einfach-Blind, Open Review) müssen als austauschbare Plugins ohne Änderung der Kernlogik unterstützt werden.
- *Cloud-Infrastruktur:* Betrieb auf @ECS Fargate (ARM64 / Graviton) mit @IaC über @CDK.
- *Skalierbarkeit & Kostenoptimierung:* Die Services werden per Scheduled Application Auto Scaling an Werktagen zwischen 16:00 und 22:00 UTC+2 und am Wochenende zwischen 11:00 und 23:00 UTC+2 hochskaliert; außerhalb dieser Zeiten laufen sie mit 0 Instanzen, um Betriebskosten zu minimieren.

== Out of scope <sec:out-of-scope>
Für das @MVP wurde sich bewusst gegen die Implementierung bestimmter Features entschieden oder diese wurden zugunsten eines reduzierten Scopes zurückgestellt:
- *Korrigieren Fehlerhafter Zusweisungen:* Es gibt keine Funktion, mit der Prüfungsamt, Lehrende oder System-Administration fehlerhafte Zuweisungen nachträglich korrigieren können.
- *Annotationen in Dokumenten im Format PDF:* Direkte visuelle Markierungen, Kommentare oder Zeichnungen auf den Dokumenten im Format PDF im Browser wurden nicht implementiert. Die Begutachtung erfolgt stattdessen strukturiert über Bewertungsbögen und textuelles Gesamt-Feedback. (Begründung: Hohe Komplexität der UI bei geringem Mehrwert für das @MVP).
- *Dateiformate abseits von PDF:* Es wird ausschließlich das `.pdf`-Format für Einreichungen unterstützt. Andere in der Aufgabenstellung denkbare Formate (z. B. `.zip`-Dateien für Quellcode-Abgaben) wurden nicht realisiert. Die Ausweitung auf weitere Datei-Formate ist zu einem möglichen späteren Zeitpunkt einfach umzusetzen.
- *Erinnerungsverwaltung (Reminder Service):* Es gibt kein automatisiertes System, das Benutzer vor Ablauf von Deadlines (Abgabe- oder Review-Fristen) benachrichtigt oder an ausstehende Aufgaben erinnert.
- *Externe Schnittstelle zur Anwendungsprogrammierung (z. B. zur Anbindung an ein LMS):* Eine Einbindung in externe Systeme wie Lernmanagementsysteme (z. B. Moodle, Canvas über LTI) wurde nicht umgesetzt. Die Endpunkte stehen jedoch zur Verfügung.
- *Dedizierter Statistik- & Reporting-Service:* Statistische Auswertungen sind auf einfache Kennzahlen wie KPI im Admin-Dashboard (Nutzerzahlen, aktive Plugins) beschränkt. Ein eigenständiger Dienst zur Aggregation komplexer Kennzahlen (z. B. Notenverläufe) wurde nicht umgesetzt.
- *Lokales Einzelkommando-Deployment:* Statt eines lokalen Aufbaus per `docker compose up` wird das System entweder vollautomatisiert über eine @CI/@CD\-Pipeline (GitHub Actions) oder manuell via `docker build` und `docker push` ins ECR geladen und anschließend per `cdk deploy` auf AWS bereitgestellt. (Begründung: Durchgängiges Cloud-natives Deployment mit @CD statt lokalem Docker-Compose-Stack; das System ist dauerhaft über eine öffentliche URL erreichbar.)

