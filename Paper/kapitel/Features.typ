= Features der App

Die Applikation (das "PeerReview"-System) umfasst eine interaktive Web-Oberfläche sowie sieben dedizierte Backend-Services.
Im Folgenden werden alle im aktuellen MVP (Minimum Viable Product) implementierten Features aus Nutzersicht anhand von typischen Benutzergeschichten (User Stories) dargestellt.

== Lastenheft

Das Lastenheft beschreibt das Grundkonzept des Systems sowie die daraus abgeleiteten funktionalen und nichtfunktionalen Anforderungen.

=== Konzept

Das Konzept legt die Zielgruppen des Systems und deren jeweilige Ziele als Grundlage für die nachfolgenden Anforderungen fest.

==== Zielgruppen

Das System unterscheidet fünf Zielgruppen mit jeweils eigenen Rollen und Berechtigungen.

*Autoren / Studierende*: Autoren bzw. Studierende nutzen das System als zentrale Plattform zur Abwicklung ihrer Einreichungen, wie beispielsweise Abschlussarbeiten oder Seminararbeiten.

*Lehrende*: Dozierende legen Abgaben an, konfigurieren das gewünschte Begutachtungsverfahren sowie den Bewertungsbogen und behalten den Fortschritt der ihnen zugeordneten Einreichungen im Blick.

*Reviewer*: Reviewer begutachten ihnen zugewiesene Arbeiten, vergeben Bewertungen anhand des vorgegebenen Bewertungsbogens und beantworten Rückfragen der Autoren.

*Prüfungsamt*: Das Prüfungsamt nimmt eine administrative Rolle ein. Die Mitarbeiter pflegen den Gutachterpool, hinterlegen Fachgebiete und steuern Profile. Sie konfigurieren globale Abgaben mit einheitlichen Fristen und Bewertungsbögen.

*System-Administration*: Die System-Administration ist für die technische Überwachung und globale Konfiguration zuständig. Sie verwaltet Profile, Berechtigungen und globale Themen-Tags und behält den Überblick über registrierte Review-Typen (Plugins) und aktive Templates.

==== Ziele der Nutzer

Autoren verfolgen das Ziel, ihre wissenschaftlichen Arbeiten fristgerecht einzureichen und nachvollziehbares Feedback zu erhalten. Lehrende möchten den Begutachtungsprozess für ihre Abgaben passend konfigurieren und dessen Fortschritt überblicken. Reviewer wollen ihnen zugewiesene Arbeiten effizient und strukturiert begutachten können. Das Prüfungsamt verfolgt das Ziel, zentrale Abgaben sowie den Gutachterpool zu verwalten und jederzeit den Gesamtüberblick über laufende Verfahren zu behalten. Die System-Administration möchte Nutzer, Berechtigungen und Systemkomponenten zentral pflegen können.

=== Funktionale Anforderungen

Die funktionalen Anforderungen gliedern sich nach den fünf Zielgruppen und beschreiben die ihnen jeweils zur Verfügung stehenden Funktionen im MVP.

==== Autoren / Studierende
- *Abgaben selbstständig anlegen:* Erstellen eigener Arbeiten (z. B. Abschlussarbeiten) als Einzel- oder Gruppenarbeit unter Angabe von Mitautoren sowie (je nach Vorlage) Wunschprüfern und individuellen Fristen.
- *Wissenschaftliche Arbeiten einreichen:* Hochladen des PDF-Dokuments zur konfigurierten Abgabe vor Ablauf der Abgabefrist.
- *Fristen und Status im Blick behalten:* Übersicht anstehender Fristen im Kalender und Live-Verfolgung des Bearbeitungsstands der eigenen Abgabe auf dem Dashboard.
- *Ergebnisse & Feedback abrufen:* Detaillierte Einsicht in Noten, Kommentare und ausgefüllte Kriterien sowie Download der korrigierten PDF-Datei nach Abschluss der Bewertung.
- *Fragen klären (Chat):* Austausch mit Gutachtern über den integrierten Chat (aktiviert bei Open Review, deaktiviert bei Doppelblind / Einfach-Blind zur Wahrung der Anonymität).
- *Echtzeit-Benachrichtigungen:* Erhalt von In-App-Meldungen bei Statusänderungen der eigenen Abgabe (z. B. nach erfolgreicher Erstellung oder Vorliegen einer Bewertung).
- *KI-Gutachten anfordern:* Ein KI-generiertes Gutachten kann zur eigenen Arbeit angefordert werden.

==== Lehrende
- *Abgaben anlegen und konfigurieren:* Erstellen neuer Arbeiten mit individuellen Titeln, Deadlines, Mitautoren und Themen-Tags.
- *Review-Verfahren & Kriterien bestimmen:* Auswahl des Review-Prozesses (Doppelblind, Einfach-Blind, Open Review) sowie Definition des Bewertungsbogens und dessen Sichtbarkeit für Studierende.
- *Zugeordnete Arbeiten einsehen:* Übersicht über alle Einreichungen der eigenen Abgaben, inklusive Zuweisungs- und Korrekturfortschritt.
- *Statusverfolgung der Begutachtung:* Automatische Aktualisierung des Korrekturfortschritts (z. B. „X von Y Gutachten abgeschlossen“) nach Absenden einer Bewertung durch einen Reviewer.
- *Echtzeit-Benachrichtigungen:* Erhalt von In-App-Meldungen bei relevanten Statusänderungen der eigenen Abgaben.

==== Reviewer
- *Zugewiesene Arbeiten einsehen:* Übersicht über alle Einreichungen, bei denen man als Gutachter eingeteilt ist.
- *Abgaben begutachten:* Download der eingereichten PDF-Arbeiten der Studierenden zur Korrektur.
- *Bewertungen abgeben:* Ausfüllen des vom Lehrenden vorgegebenen Bewertungsbogens im System mit Noten und textuellem Gesamt-Feedback.
- *Direktkommunikation (Chat):* Austausch mit Autoren über einen integrierten Chat (aktiviert bei Open Review, deaktiviert bei Doppelblind / Einfach-Blind zum Schutz der Anonymität).
- *Echtzeit-Benachrichtigungen:* Erhalt von In-App-Meldungen bei neu zugewiesenen Arbeiten zur Begutachtung.
- *KI-Gutachten anfordern:* Ein KI-generiertes Gutachten kann als Unterstützung bei der Begutachtung angefordert werden.

==== Prüfungsamt
- *Zentrale Abgaben konfigurieren:* Erstellen offizieller Abgaben mit globalen Fristen und Bewertungsbögen für Studierende.
- *Gutachterpool pflegen:* Registrierung von Prüfern im System inklusive Hinterlegen von Fachgebieten (Themen-Tags) und Aktivieren/Deaktivieren von Profilen.
- *Überwachung des Gesamtprozesses:* Uneingeschränkte Sicht auf den Status aller Abgaben, automatischen Zuweisungen, Deadlines und Korrekturfortschritte im System.
- *Systemstatistiken einsehen:* Übersicht über globale Kennzahlen wie Benutzerzahlen, aktive Plugins und Templates im Admin-Bereich.
- *Benutzer und Rollen verwalten:* Zuweisung von Berechtigungsgruppen (z. B. Lehrender, Reviewer, Autor, Prüfungsamt) für registrierte Benutzer.

Die Zuweisung von Reviewern zu Abgaben erfolgt ausschließlich automatisiert durch den Matching-Algorithmus. Weder das Prüfungsamt noch andere Rollen verfügen im MVP über eine Funktion zur manuellen Zuweisung oder nachträglichen Korrektur einzelner Zuweisungen (siehe @sec:out-of-scope).

==== System-Administration
- *Globale Benutzerverwaltung:* Umfassende Verwaltung aller Profile und Systemberechtigungen.
- *Systemkomponenten einsehen:* Übersicht über registrierte Review-Typen (Plugins) und aktive Templates sowie Verwaltung globaler Themen-Tags.

Für technische Störungen oder Zuweisungskonflikte existiert im MVP keine dedizierte, korrigierende Eingriffsmöglichkeit über die Anwendung. Weder Lehrende noch die System-Administration können fehlerhafte automatische Zuweisungen manuell übersteuern (siehe @sec:out-of-scope).

=== Nichtfunktionale Anforderungen

Die nichtfunktionalen Anforderungen umfassen allgemeine Qualitätsmerkmale der Anwendung sowie technische Rahmenbedingungen der zugrunde liegenden Infrastruktur.

==== Allgemeine Anforderungen
- *Rollenbasierte Oberfläche:* Jede der fünf Zielgruppen erhält ein auf ihre Aufgaben zugeschnittenes Dashboard mit den jeweils relevanten Funktionen.
- *Anonymität:* Bei Doppelblind- und Einfach-Blind-Verfahren müssen identifizierende Informationen (Namen, Chat) für die jeweils andere Partei zuverlässig verborgen bleiben.
- *Echtzeit-Rückmeldung:* Statusänderungen (neue Zuweisung, abgeschlossene Bewertung) müssen den betroffenen Nutzern zeitnah als In-App-Benachrichtigung angezeigt werden.
- *Bedienbarkeit:* Die Web-Oberfläche muss ohne Schulung durch die genannten Zielgruppen bedienbar sein.

==== Technische Anforderungen
- *Microservice-Architektur:* Die sieben Backend-Services sind eigenständig deploybar und kommunizieren synchron über REST sowie asynchron über Amazon SQS (siehe @ch:architecture).
- *Database-per-Service:* Jeder Service verwaltet seine eigene, isolierte Datenbank; ein Datenaustausch zwischen Services erfolgt ausschließlich über APIs oder SQS-Events, nicht über direkte Datenbankzugriffe.
- *Dokumentenablage:* Eingereichte und korrigierte PDF-Dokumente werden als Objekte in AWS S3 gespeichert.
- *Plugin-Architektur im Workflow Service:* Unterschiedliche Begutachtungsverfahren (Doppelblind, Einfach-Blind, Open Review) müssen als austauschbare Plugins ohne Änderung der Kernlogik unterstützt werden.
- *Cloud-Infrastruktur:* Betrieb auf AWS ECS Fargate (ARM64 / Graviton) mit Infrastructure as Code via AWS CDK v2.
- *Skalierbarkeit & Kostenoptimierung:* Die Services werden per Scheduled Application Auto Scaling an Werktagen zwischen 08:00 und 18:00 UTC hochskaliert; außerhalb dieser Zeiten sowie am Wochenende laufen sie mit 0 Instanzen, um Betriebskosten zu minimieren.

== Out of scope <sec:out-of-scope>
Für das MVP wurde sich bewusst gegen die Implementierung bestimmter Features entschieden oder diese wurden zugunsten eines reduzierten Scopes zurückgestellt:
- *Manuelle Zuweisungssteuerung:* Es gibt keine Funktion, mit der Prüfungsamt, Lehrende oder System-Administration die automatische Reviewer-Zuweisung manuell überschreiben oder im Fehlerfall nachträglich korrigieren können. Die Zuweisung erfolgt ausschließlich algorithmisch.
- *PDF-Annotationen:* Direkte visuelle Markierungen, Kommentare oder Zeichnungen auf den PDF-Dokumenten im Browser wurden nicht implementiert. Die Begutachtung erfolgt stattdessen strukturiert über Bewertungsbögen und textuelles Gesamt-Feedback. (Begründung: Hohe UI-Komplexität bei geringem Mehrwert für das MVP).
- *Dateiformate abseits von PDF:* Es wird ausschließlich das `.pdf`-Format für Einreichungen unterstützt. Andere in der Aufgabenstellung denkbare Formate (z. B. `.zip`-Dateien für Quellcode-Abgaben) wurden nicht realisiert.
- *Erinnerungsverwaltung (Reminder Service):* Es gibt kein automatisiertes System, das Benutzer vor Ablauf von Deadlines (Abgabe- oder Review-Fristen) benachrichtigt oder an ausstehende Aufgaben erinnert.
- *Externe API-Schnittstelle (z. B. für LMS-Anbindung):* Eine Einbindung der API-Schnittstelle in externe Systeme wie Lernmanagementsysteme (z. B. Moodle, Canvas via LTI) wurde nicht umgesetzt. Die Endpunkte stehen jedoch zur Verfügung.
- *Dedizierter Statistik- & Reporting-Service:* Statistische Auswertungen sind auf einfache KPIs im Admin-Dashboard (Nutzerzahlen, aktive Plugins) beschränkt. Ein eigenständiger Dienst zur Aggregation komplexer Kennzahlen (z. B. Notenverläufe) wurde nicht umgesetzt.
- *Lokales Einzelkommando-Deployment:* Statt eines lokalen Aufbaus per einzelnem Kommando wie `docker compose up` wird das System vollautomatisiert über eine CI/CD-Pipeline (GitHub Actions) gebaut und live auf AWS deployed. (Begründung: Durchgängiges Cloud-natives Deployment mit Continuous Deployment statt lokalem Docker-Compose-Stack; das System ist dauerhaft über eine öffentliche URL erreichbar.)
