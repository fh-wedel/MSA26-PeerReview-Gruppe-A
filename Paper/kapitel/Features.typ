= Features der App

Die Applikation (das "PeerReview"-System) umfasst eine interaktive Web-Oberfläche sowie sieben dedizierte Backend-Services (Java/Spring Boot).
Im Folgenden werden alle im aktuellen MVP (Minimum Viable Product) implementierten Features aus Nutzersicht anhand von typischen Benutzergeschichten (User Stories) dargestellt.

== Nutzertypen und ihre User Stories

=== Dozenten / Lehrende (Dozenten und Prüfer)
Aus Sicht eines Lehrenden stellt das System folgende Funktionen bereit:
- *Abgaben anlegen und konfigurieren:* Neue wissenschaftliche Arbeiten für Kurse oder Projekte erstellen und detailliert konfigurieren (Titel, Abgabe- und Review-Fristen).
- *Flexibler Review-Prozess:* Auswahl des gewünschten Begutachtungsverfahrens (Doppelblind, Einfach-Blind oder Open Review).
- *Prüferanzahl steuern:* Festlegen, wie viele Gutachter für eine Arbeit benötigt werden (z. B. Erst- und Zweitprüfer).
- *Bewertungskriterien definieren:* Erstellen eines individuellen Bewertungsbogens mit Kriterien (z. B. Methodik, Struktur) und Festlegen, ob diese für Studierende vorab sichtbar sind.
- *Zugeordnete Arbeiten einsehen:* Übersicht der Arbeiten, bei denen man als Gutachter eingeteilt ist.
- *Abgaben begutachten:* Einfacher Download der eingereichten PDF-Dokumente der Studierenden zur Korrektur.
- *Bewertungen abgeben:* Ausfüllen des Bewertungsbogens im System, Notenvergabe und Verfassen eines textuellen Feedbacks.
- *Korrekturstatus aktualisieren:* Ändern des Bearbeitungsstatus (z. B. "In Bearbeitung" oder "Abgeschlossen"), um Studierende und das Prüfungsamt auf dem Laufenden zu halten.
- *Direktkommunikation (Chat):* Austausch mit den Autoren der Arbeiten über einen integrierten Chat (sofern dieser durch die Workflow-Regeln des Review-Verfahrens freigeschaltet ist, wie z. B. bei Open Review). In anonymen Verfahren (Doppelblind / Einfach-Blind) ist der direkte Chat zum Schutz der Identitäten deaktiviert.
- *Benachrichtigungen:* Automatische Hinweise bei nahenden Deadlines oder neu zur Begutachtung eingereichten Arbeiten.

=== Autoren / Studierende
Aus Sicht eines Studierenden bietet die Plattform folgende Funktionen:
- *Eigenständige Abgaben erstellen:* Anlegen eigener Abgaben (z. B. für Abschlussarbeiten) unter Angabe von Wunschprüfern, Deadlines und Mitautoren.
- *Gruppenarbeiten organisieren:* Arbeiten im Team erstellen, bei denen alle Gruppenmitglieder Zugriff haben, Details bearbeiten und das finale Dokument einreichen können.
- *Wissenschaftliche Arbeiten einreichen:* Hochladen des PDF-Dokuments inklusive Titel und einer Kurzbeschreibung (Abstract) vor Ablauf der Abgabefrist.
- *Fristen und Status im Blick behalten:* Einsehen anstehender Deadlines in einem Kalender sowie Live-Verfolgung des aktuellen Status der Einreichung (z. B. "Eingereicht", "In Bewertung").
- *Ergebnisse abrufen:* Detaillierte Einsicht in Noten, Kommentare und ausgefüllte Bewertungskriterien nach Abschluss des Begutachtungsprozesses.
- *Feedback-Dokumente herunterladen:* Zugriff auf korrigierte oder mit Feedback versehene Versionen der eingereichten PDF-Datei.
- *Fragen klären (Chat):* Kontaktaufnahme mit den Gutachtern über das integrierte Chatsystem, sofern das gewählte Review-Verfahren dies erlaubt (z. B. bei Open Review). In anonymen Verfahren (Doppelblind / Einfach-Blind) ist der Chat deaktiviert, um die Anonymität zu wahren.
- *Notenspiegel einsehen:* Einsicht in anonymisierte Leistungsstatistiken und Notenverteilungen des gesamten Moduls zur Einordnung der eigenen Leistung.
- *Benachrichtigungseinstellungen:* Individuelles Festlegen, bei welchen Statusänderungen (z. B. Beginn der Bewertung) Benachrichtigungen gesendet werden.

=== Prüfungsamt (Administrative Nutzer)
Aus Sicht von Mitarbeitern des Prüfungsamts stehen folgende Funktionen bereit:
- *Zentrale Abgaben erstellen:* Anlegen offizieller Abgaben mit globalen Fristen und Bewertungsbögen für Studierende.
- *Gutachterpool pflegen:* Registrierung von Prüfern im System inklusive Hinterlegen von Fachgebieten, maximaler Auslastung und zeitweiser Deaktivierung (z. B. bei Abwesenheit).
- *Manuelle Zuweisungen vornehmen:* Gezielte Zuordnung von Gutachtern zu Abgaben oder Anpassung automatischer Zuweisungen.
- *Überwachung des Gesamtprozesses:* Uneingeschränkte Sicht auf alle Abgaben, Zuweisungen, Deadlines und Korrekturfortschritte im System.
- *Statistiken und Berichte generieren:* Abrufen aggregierter Kennzahlen über Notenschnitte, Gesamtzahl der Arbeiten und durchschnittliche Bearbeitungszeiten zur Evaluierung des Prozessablaufs.
- *Benutzer und Rollen verwalten:* Zuweisung von Berechtigungen und Gruppen (z. B. Autor, Dozent, Prüfungsamt) für alle Benutzer.

=== System-Administratoren
Aus Sicht der System-Administration werden folgende administrative Kontrollfunktionen geboten:
- *Globale Benutzerverwaltung:* Verwaltung aller Profile und Systemberechtigungen.
- *Systemüberwachung:* Einsicht in aktive Services, genutzte Erweiterungen (Plugins) und die Auslastung der Plattform.
- *Konfliktlösung:* Manuelle Korrekturen an Datenbankeinträgen, Nutzergruppen oder festgefahrenen Zuweisungen bei Prozessstörungen.

== Out of scope
Für das MVP wurde sich bewusst gegen die Implementierung bestimmter Features entschieden oder diese wurden zugunsten eines reduzierten Scopes zurückgestellt:

- *PDF-Annotationen:* Direkte visuelle Markierungen, Kommentare oder Zeichnungen auf den PDF-Dokumenten im Browser wurden nicht implementiert. Die Begutachtung erfolgt stattdessen strukturiert über Bewertungsbögen und textuelles Gesamt-Feedback. (Begründung: Hohe UI-Komplexität bei geringem Mehrwert für das MVP).
- *Dateiformate abseits von PDF:* Es wird ausschließlich das `.pdf`-Format für Einreichungen unterstützt. Andere in der Aufgabenstellung denkbare Formate (z. B. `.zip`-Dateien für Quellcode-Abgaben) wurden nicht realisiert.
- *Erinnerungsverwaltung (Reminder Service):* Es gibt kein automatisiertes System, das Benutzer vor Ablauf von Deadlines (Abgabe- oder Review-Fristen) benachrichtigt oder an ausstehende Aufgaben erinnert.
- *Externe API-Schnittstelle (z. B. für LMS-Anbindung):* Eine API-Schnittstelle zur direkten Einbindung in externe Systeme wie Lernmanagementsysteme (z. B. Moodle, Canvas via LTI) wurde nicht realisiert.
- *Dedizierter Statistik- & Reporting-Service:* Statistische Auswertungen sind auf einfache KPIs im Admin-Dashboard (Nutzerzahlen, aktive Plugins) beschränkt. Ein eigenständiger Dienst zur Aggregation komplexer Kennzahlen (z. B. Notenverläufe) wurde nicht umgesetzt.

