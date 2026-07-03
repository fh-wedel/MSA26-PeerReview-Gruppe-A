= Features der App

Die Applikation (das "PeerReview"-System) umfasst eine interaktive Web-Oberfläche sowie sieben dedizierte Backend-Services.
Im Folgenden werden alle im aktuellen MVP (Minimum Viable Product) implementierten Features aus Nutzersicht anhand von typischen Benutzergeschichten (User Stories) dargestellt.

== Nutzertypen und ihre User Stories

=== Dozenten / Lehrende (Dozenten und Prüfer)
Aus Sicht eines Lehrenden stellt das System folgende Kernfunktionen bereit:
- *Abgaben anlegen und konfigurieren:* Erstellen neuer Arbeiten mit individuellen Titeln, Deadlines, Mitautoren und Themen-Tags.
- *Review-Verfahren & Kriterien bestimmen:* Auswahl des Review-Prozesses (Doppelblind, Einfach-Blind, Open Review) sowie Definition des Bewertungsbogens und dessen Sichtbarkeit für Studierende.
- *Zugeordnete Arbeiten einsehen:* Übersicht über alle Einreichungen, bei denen man als Gutachter eingeteilt ist.
- *Abgaben begutachten:* Download der eingereichten PDF-Arbeiten der Studierenden zur Korrektur.
- *Bewertungen abgeben:* Ausfüllen des Bewertungsbogens im System mit Noten und textuellem Gesamt-Feedback.
- *Statusverfolgung der Begutachtung:* Automatische Aktualisierung des Korrekturfortschritts (z. B. „X von Y Gutachten abgeschlossen“) für Autoren und Prüfungsamt nach Absenden einer Bewertung.
- *Direktkommunikation (Chat):* Austausch mit Autoren über einen integrierten Chat (aktiviert bei Open Review, deaktiviert bei Doppelblind / Einfach-Blind zum Schutz der Anonymität).
- *Echtzeit-Benachrichtigungen:* Erhalt von In-App-Meldungen bei neu zugewiesenen Arbeiten zur Begutachtung.

=== Autoren / Studierende
Aus Sicht eines Studierenden bietet die Plattform folgende Kernfunktionen:
- *Abgaben selbstständig anlegen:* Erstellen eigener Arbeiten (z. B. Abschlussarbeiten) als Einzel- oder Gruppenarbeit unter Angabe von Mitautoren sowie (je nach Vorlage) Wunschprüfern und individuellen Fristen.
- *Wissenschaftliche Arbeiten einreichen:* Hochladen des PDF-Dokuments zur konfigurierten Abgabe vor Ablauf der Abgabefrist.
- *Fristen und Status im Blick behalten:* Übersicht anstehender Fristen im Kalender und Live-Verfolgung des Bearbeitungsstands der eigenen Abgabe auf dem Dashboard.
- *Ergebnisse & Feedback abrufen:* Detaillierte Einsicht in Noten, Kommentare und ausgefüllte Kriterien sowie Download der korrigierten PDF-Datei nach Abschluss der Bewertung.
- *Fragen klären (Chat):* Austausch mit Gutachtern über den integrierten Chat (aktiviert bei Open Review, deaktiviert bei Doppelblind / Einfach-Blind zur Wahrung der Anonymität).
- *Echtzeit-Benachrichtigungen:* Erhalt von In-App-Meldungen bei Statusänderungen der eigenen Abgabe (z. B. nach erfolgreicher Erstellung oder Vorliegen einer Bewertung).

=== Prüfungsamt (Administrative Nutzer)
Aus Sicht von Mitarbeitern des Prüfungsamts stehen folgende administrative Funktionen bereit:
- *Zentrale Abgaben konfigurieren:* Erstellen offizieller Abgaben mit globalen Fristen und Bewertungsbögen für Studierende.
- *Gutachterpool pflegen:* Registrierung von Prüfern im System inklusive Hinterlegen von Fachgebieten (Themen-Tags) und Aktivieren/Deaktivieren von Profilen.
- *Manuelle Zuweisungen vornehmen:* Gezieltes Festlegen bestimmter Gutachter beim Anlegen einer Abgabe, wodurch der automatische Zuweisungs-Algorithmus überschrieben wird.
- *Überwachung des Gesamtprozesses:* Uneingeschränkte Sicht auf den Status aller Abgaben, Zuweisungen, Deadlines und Korrekturfortschritte im System.
- *Systemstatistiken einsehen:* Übersicht über globale Kennzahlen wie Benutzerzahlen, aktive Plugins und Templates im Admin-Bereich.
- *Benutzer und Rollen verwalten:* Zuweisung von Berechtigungsgruppen (z. B. Dozent, Autor, Prüfungsamt) für registrierte Benutzer.

=== System-Administratoren
Aus Sicht der System-Administration werden folgende administrative Kontrollfunktionen geboten:
- *Globale Benutzerverwaltung:* Umfassende Verwaltung aller Profile und Systemberechtigungen.
- *Systemkomponenten einsehen:* Übersicht und Verwaltung der registrierten Review-Typen (Plugins), aktiven Templates und globalen Themen-Tags.
- *Fehlerbehebung und Administration:* Administrative Eingriffe bei technischen Störungen oder Zuweisungskonflikten.

== Out of scope
Für das MVP wurde sich bewusst gegen die Implementierung bestimmter Features entschieden oder diese wurden zugunsten eines reduzierten Scopes zurückgestellt:
- *PDF-Annotationen:* Direkte visuelle Markierungen, Kommentare oder Zeichnungen auf den PDF-Dokumenten im Browser wurden nicht implementiert. Die Begutachtung erfolgt stattdessen strukturiert über Bewertungsbögen und textuelles Gesamt-Feedback. (Begründung: Hohe UI-Komplexität bei geringem Mehrwert für das MVP).
- *Dateiformate abseits von PDF:* Es wird ausschließlich das `.pdf`-Format für Einreichungen unterstützt. Andere in der Aufgabenstellung denkbare Formate (z. B. `.zip`-Dateien für Quellcode-Abgaben) wurden nicht realisiert.
- *Erinnerungsverwaltung (Reminder Service):* Es gibt kein automatisiertes System, das Benutzer vor Ablauf von Deadlines (Abgabe- oder Review-Fristen) benachrichtigt oder an ausstehende Aufgaben erinnert.
- *Externe API-Schnittstelle (z. B. für LMS-Anbindung):* Eine API-Schnittstelle zur direkten Einbindung in externe Systeme wie Lernmanagementsysteme (z. B. Moodle, Canvas via LTI) wurde nicht realisiert.
- *Dedizierter Statistik- & Reporting-Service:* Statistische Auswertungen sind auf einfache KPIs im Admin-Dashboard (Nutzerzahlen, aktive Plugins) beschränkt. Ein eigenständiger Dienst zur Aggregation komplexer Kennzahlen (z. B. Notenverläufe) wurde nicht umgesetzt.

== So könnte der Fließtext aussehen
Im Rahmen des Minimum Viable Products (MVP) fokussiert sich die Plattform "PeerReview" auf die Kernprozesse der wissenschaftlichen Begutachtung. Hierzu werden die vier primären Nutzertypen, Dozierende, Autoren, das Prüfungsamt sowie System-Administratoren genutzt.

=== Dozierende und Prüfende
Für Dozierende und Prüfende bietet das System weitreichende Konfigurationsmöglichkeiten. Sie können neue Abgaben unter Angabe von Titeln, Deadlines und Themenbereichen anlegen und das gewünschte Begutachtungsverfahren, sei es Doppelblind, Einfach-Blind oder Open Review, festlegen. Darüber hinaus definieren sie den zugehörigen Bewertungsbogen und regeln dessen Sichtbarkeit für Studierende. Ihnen zugeteilte Arbeiten können Dozierende in einer zentralen Übersicht einsehen, die eingereichten PDF-Dokumente herunterladen und die Bewertungen inklusive Noten und Freitext-Feedback im System erfassen. Das System aktualisiert den Begutachtungsfortschritt kontinuierlich und benachrichtigt Prüfende in Echtzeit über neu zugewiesene Arbeiten. Bei Open-Review-Verfahren steht ihnen zudem ein integrierter Chat für den direkten Austausch mit den Autoren zur Verfügung, welcher bei anonymisierten Verfahren zum Schutz der Identitäten deaktiviert bleibt.

=== Autoren und Studierende
Autoren und Studierende nutzen das System als zentrale Plattform zur Abwicklung ihrer Einreichungen, wie beispielsweise Abschlussarbeiten. Sie können Arbeiten selbstständig als Einzel- oder Gruppenleistung anlegen, Mitautoren sowie Wunschprüfende angeben und das PDF-Dokument fristgerecht hochladen. Ein übersichtliches Dashboard und ein integrierter Kalender unterstützen sie dabei, Deadlines und den aktuellen Status ihrer Einreichung stets im Blick zu behalten. Nach Abschluss des Gutachterprozesses erhalten sie Zugriff auf ihre Noten, das detaillierte Feedback sowie die korrigierte Arbeit. Wie auch die Prüfenden werden sie über Statusänderungen per Echtzeit-Meldung informiert und können bei Open-Review-Verfahren über den Chat Rückfragen direkt klären.

=== Prüfungsamt
Das Prüfungsamt nimmt eine administrative Rolle ein. Die Mitarbeiter pflegen den Gutachterpool, hinterlegen Fachgebiete und steuern Profile. Sie können globale Abgaben mit einheitlichen Fristen und Bewertungsbögen konfigurieren sowie bei Bedarf manuelle Prüferzuweisungen vornehmen, um den automatischen Zuweisungs-Algorithmus gezielt zu überschreiben. Für eine lückenlose Qualitätssicherung behält das Prüfungsamt stets die volle Übersicht über alle Einreichungen, Deadlines und den aktuellen Korrekturfortschritt. Zudem erhalten sie im Admin-Bereich Einsicht in grundlegende Systemstatistiken und verwalten Benutzerrollen.

=== System-Administration
Die System-Administration ist für die technische Überwachung und globale Konfiguration zuständig. Sie verwaltet Profile und Berechtigungen, überwacht registrierte Review-Typen (Plugins), aktive Templates sowie globale Themen-Tags und greift bei technischen Störungen oder Zuweisungskonflikten korrigierend ein.

Um den Scope des MVPs fokussiert zu halten, wurden bestimmte Funktionen bewusst ausgeschlossen. So verfügt das System über keine webbasierten PDF-Annotationswerkzeuge. Kommentare und Bewertungen werden stattdessen strukturiert über den Bewertungsbogen und ein textuelles Gesamt-Feedback erfasst. Die Einreichungen sind auf das PDF-Format beschränkt, und ein automatisierter Erinnerungsdienst für ausstehende Fristen ist nicht implementiert. Ebenso wurde auf Schnittstellen zu externen Lernmanagementsystemen (wie Moodle) sowie auf einen eigenständigen, komplexen Reporting-Service verzichtet.
