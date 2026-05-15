
Grundlegender Rahmen:
- Weboberfläche zum Begutachten von Arbeiten aus dem Universitärem Kontext
- Einreichen von Arbeiten durch Autoren
- Zuweisung von Gutachtern zu Arbeiten
- Gutachten durch Gutachter erstellen
- Gutachten an Autoren zurückgeben
- Vollständige Web-UI mit extern angebotenen REST-APIs für die Interaktion mit der Software

Die folgenden Features aus Businesssicht sind zentral für die Entwicklung der Software:

Konfiguration und Einreiche Service:
- Erstellen einer Abgabe:
    - Autoren selber können eine Abgabe erstellen. Dann bleibt es dem Autor überlassen ein Review Prozess, Abgabezeitraum zu wählen. Auch kann er bestimmen wer/wie die Gutachter zugewiesen werden (Im Matching Service). 
    - Gutachter könnnen eine Abgabe von Autoren einfordern, quasi als Projektarbeit von Studenten. Dann kann der Gutachter den Review Prozess, Abgabezeitraum und die Zuweisung der Gutachter bestimmen.
    - Das Prüfungsamt kann eine Abgabe erstellen, quasi als Prüfungsleistung von Studenten. Dann kann das Prüfungsamt den Review Prozess, Abgabezeitraum und die Zuweisung der Gutachter bestimmen.
    - In allen Fällen kann definiert werden, welche Autoren beteiligt sind. So ist auch eine Gruppenarbeit möglich, bei der mehrere Autoren an einer Abgabe beteiligt sind. Alle beteiligten Autoren können die Abgabe einsehen und bearbeiten und die Abgabe einreichen.
- Erstellungszeitraum für Arbeiten:
    - Sowohl für die Abgabe als auch für die Gutachten können Deadlines definiert werden, um sicherzustellen, dass der Begutachtungsprozess effizient und termingerecht abläuft. Das System ermöglicht die Verwaltung von Deadlines und sendet Benachrichtigungen (Notifikation Service) an Autoren und Gutachter, um sie über bevorstehende Fristen zu informieren.
- Definieren eines Bewertungshorizonts: 
    - Das System ermöglicht die Definition von Bewertungskriterien und -richtlinien für die Gutachter/Prüfungsamt, um eine konsistente und faire Bewertung der Arbeiten sicherzustellen. Das System ermöglicht die Erstellung von Bewertungsformularen, die von den Gutachtern ausgefüllt werden können, um ihre Bewertungen und Kommentare zu den Arbeiten abzugeben.
    - Die Bewertungskriterien können für den Autor sichtbar oder unsichtbar sein, je nach den Anforderungen.

Matching Service:
- Zuweisung von Gutachtern zu Arbeiten:
    - Es gibt stand jetzt drei Review Prozesse, die das System unterstützt: Doppelblind, Open Review und Einfach-Blind. Je nach gewähltem Review Prozess können die Gutachter auf unterschiedliche Weise zugewiesen werden:
        - Bei Doppelblind: Das System stellt sicher, dass die Identität der Autoren und Gutachter anonym bleibt. Das System erstellt das Gutachten Autor Paar. Wenn die Gutachter manuell zugewiesen werden, dann erfolgt das immer durch das Prüfungsamt. Der Gutachter selber kann nicht manuell zugewiesen werden, da er ja anonym bleiben soll. Das System ermöglicht die Kommunikation zwischen Autoren und Gutachtern, um Fragen zu klären oder Feedback zu geben, ohne die Anonymität zu gefährden.
        - Bei Einfach-Blind: Das System stellt sicher, dass die Identität der Gutachter anonym bleibt, während die Identität der Autoren bekannt ist. Die Gutachter werden vom Prüfungsamt oder dem Gutachter selber ausgewählt. Das System ermöglicht die Kommunikation zwischen Autoren und Gutachtern, um Fragen zu klären oder Feedback zu geben.
        - Bei Open Review: Das System ermöglicht die Offenlegung der Identität von Autoren und Gutachtern, wenn dies gewünscht wird. Die Gutachter werden vom Prüfungsamt, dem Gutachter selber oder durch den Autor ausgewählt. Das System ermöglicht die Kommunikation zwischen Autoren und Gutachtern, um Fragen zu klären oder Feedback zu geben.
    - Es können Regeln für die Zuweisung von Gutachtern definiert werden (z.B. basierend auf Fachgebiet, Verfügbarkeit, etc.)
    - Es ist möglich zweit und dritt Gutachter zuzuweisen, um eine umfassendere Bewertung der Arbeiten zu ermöglichen.
- Die Regeln für die Zuweisung von Gutachtern können flexibel gestaltet werden, um den Anforderungen verschiedener Begutachtungsprozesse gerecht zu werden. Das System ermöglicht die Verwaltung und Anpassung dieser Regeln, um sicherzustellen, dass die Zuweisung von Gutachtern effizient und fair erfolgt.
- Einzelne Gutachter können deaktiviert werden, um sie von der Zuweisung auszuschließen, z.B. wenn sie nicht verfügbar sind oder wenn es Konflikte gibt. Das System ermöglicht die Verwaltung des Gutachterpools, um sicherzustellen, dass nur aktive und geeignete Gutachter für die Zuweisung berücksichtigt werden.

Submission Management:
- Einreichen von Arbeiten: 
    - Autoren können ihre Arbeiten einreichen, inklusive Titel, (Abstract), PDF-Datei
        - Neben einer PDF können weitere Projektdaten in anderen Formaten (z.B. Code, Datensätze, etc.) eingereicht werden, um die Bewertung der Arbeit zu unterstützen. Das System ermöglicht die Verwaltung und Organisation dieser zusätzlichen Projektdaten, um sicherzustellen, dass sie für die Gutachter zugänglich und verständlich sind.
    - Beim Einreichen von Arbeiten sind die Deadlines zu beachten
    - Nach dem Einreichen von Arbeiten können Autoren den Status ihrer Einreichung verfolgen

Workflow Prozess - Das Reviewen der Arbeiten:
- Erstellen von Gutachten:
    - Gutachter können Gutachten für die ihnen zugewiesenen Arbeiten erstellen, indem sie die Bewertungsformulare ausfüllen und ihre Bewertungen und Kommentare (Keine in den PDF Dateien selber) abgeben.
    - Gutachter können den Status ihrer Gutachten verfolgen und erhalten Benachrichtigungen über Änderungen oder Aktualisierungen im Begutachtungsprozess.
    - Gutachter können den Status der Gutachten aktualisieren, um den Fortschritt ihrer Bewertungen dem Autor und dem Prüfungsamt mitzuteilen (z.B. "In Bearbeitung", "Abgeschlossen", etc.)
    - Gutachter können mit Autoren kommunizieren, um Fragen zu klären oder Feedback zu geben, wenn dies im Begutachtungsprozess vorgesehen ist.

Rückgabe Prozess:
- Rückgabe von Gutachten an Autoren:
    - Nach Abschluss der Gutachten werden die Bewertungen und Kommentare an die Autoren zurückgegeben, damit sie Feedback zu ihren Arbeiten erhalten und gegebenenfalls Verbesserungen vornehmen können.
    - Autoren können den Status ihrer Einreichungen verfolgen und erhalten Benachrichtigungen über Änderungen oder Aktualisierungen im Begutachtungsprozess.


--- Quer Dazu: -----
- Benutzerverwaltung: 
    - Registrierung von Benutzern (Autoren, Gutachter, Prüfungsamt, System Administratoren)
    - Authentifizierung und Autorisierung von Benutzern
    - Verwaltung von Benutzerrollen - RBAC

- Notfikations und Scheduling Service:
    - Vor Fristablauf der Bearbeitungszeit erhalten Autoren und Gutachter Benachrichtigungen über bevorstehende Fristen, um sicherzustellen, dass sie rechtzeitig ihre Arbeiten einreichen oder ihre Gutachten abgeben können.
    - Nach dem Einreichen von Arbeiten erhalten die zugewiesenen Gutachter eine Benachrichtigung über die neue Einreichung
    - Der Autor kann einstellen ob er bei Status Änderungen des Gutachten eine Benachrichtigung erhalten möchte oder nicht. So kann er z.B. benachrichtigt werden, wenn der Gutachter den Status auf "In Bearbeitung" oder "Abgeschlossen" ändert.

Analytics und Reporting:
- Statisken und Berichte:
    - Das System ermöglicht die Erstellung von Statistiken und Berichten über den Begutachtungsprozess, um Einblicke in die Anzahl der Einreichungen, die durchschnittliche Bewertung, die Bearbeitungszeit, etc. zu erhalten. Diese Statistiken können von Prüfungsamt genutzt werden, um den Begutachtungsprozess zu überwachen und zu verbessern.
    - Das System erlaubt es nach Abschluss aller Gutachten eines Moduls Statistiken für die Autoren zu erstellen, um ihnen Einblicke in die Bewertung ihrer Arbeiten im Vergleich zu anderen Einreichungen zu geben. Diese Statistiken können den Autoren helfen, ihre Stärken und Schwächen zu erkennen und ihre zukünftigen Arbeiten zu verbessern. (Notenspiegel)



Verantwortlichkeiten:
Infrastruktur und Reporting: -- Marcel
Security: -- Gideon -- Matthias
Web UI (Gideon), Service Supplements, Framework: -- Matthias -- Luca -- Gideon
