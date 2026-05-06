
Grundlegender Rahmen:
- Weboberfläche zum Begutachten von Arbeiten aus dem Universitärem Kontext
- Einreichen vbon Arbeiten durch Autoren
- Zuweisung von Gutachtern zu Arbeiten (durch Administratoren?)
- Gutachten durch Gutachter erstellen
- Gutachten an Autoren zurückgeben
- Vollständige Web-UI mit extern angebotenen REST-APIs für die Interaktion mit der Software

Die folgenden Features aus Businesssicht sind zentral für die Entwicklung der Software:
- Benutzerverwaltung: 
    - Registrierung von Benutzern (Autoren, Gutachter, Prüfungsamt, System Administratoren)
    - Authentifizierung und Autorisierung von Benutzern
    - Verwaltung von Benutzerrollen und  - ABAC?
- Zuweisung von Gutachtern zu Arbeiten: 
    - Das Prüfungsamt legt die Art des Gutachten fest (einfach-blind, doppeltblind, open review, etc.)
        - Bei Doppelblind: Das System stellt sicher, dass die Identität der Autoren und Gutachter anonym bleibt. Das System erstellt das Gutachten Autor Paar
        - Bei Open Review: Das System ermöglicht die Offenlegung der Identität von Autoren und Gutachtern, wenn dies gewünscht wird. Die Gutachter werden vom Prüfungsamt, dem Gutachter selber oder wenn gewünscht durch den Autor ausgewählt. Das System ermöglicht die Kommunikation zwischen Autoren und Gutachtern, um Fragen zu klären oder Feedback zu geben.
        - Bei Einfach-Blind: Das System stellt sicher, dass die Identität der Gutachter anonym bleibt, während die Identität der Autoren bekannt ist. Die Gutachter werden vom Prüfungsamt oder dem Gutachter selber ausgewählt. Das System ermöglicht die Kommunikation zwischen Autoren und Gutachtern, um Fragen zu klären oder Feedback zu geben.
    - Es können Regeln für die Zuweisung von Gutachtern definiert werden (z.B. basierend auf Fachgebiet, Verfügbarkeit, etc.)
    - Es ist möglich zweit und dritt Gutachter zuzuweisen, um eine umfassendere Bewertung der Arbeiten zu ermöglichen.
- Definieren eines Bewertungshorizonts: 
    - Das System ermöglicht die Definition von Bewertungskriterien und -richtlinien für die Gutachter/Prüfungsamt, um eine konsistente und faire Bewertung der Arbeiten sicherzustellen. Das System ermöglicht die Erstellung von Bewertungsformularen, die von den Gutachtern ausgefüllt werden können, um ihre Bewertungen und Kommentare zu den Arbeiten abzugeben.
    - Die Bewertungskriterien können für den Autor sichtbar oder unsichtbar sein, je nach den Anforderungen des Begutachtungsprozesses.
- Erstellungszeitraum für Arbeiten:
    - Vor Fristablauf der Bearbeitungszeit erhalten Autoren und Gutachter Benachrichtigungen über bevorstehende Fristen, um sicherzustellen, dass sie rechtzeitig ihre Arbeiten einreichen oder ihre Gutachten abgeben können.
- Einreichen von Arbeiten: 
    - Autoren können ihre Arbeiten einreichen, inklusive Titel, (Abstract), PDF-Datei
        - Neben einer PDF können weitere Projektdfaten in anderen Formaten (z.B. Code, Datensätze, etc.) eingereicht werden, um die Bewertung der Arbeit zu unterstützen. Das System ermöglicht die Verwaltung und Organisation dieser zusätzlichen Projektdaten, um sicherzustellen, dass sie für die Gutachter zugänglich und verständlich sind.
    - Beim Einreichen von Arbeiten sind Deadlines zu beachten, die von den Administratoren festgelegt werden
    - Nach dem Einreichen von Arbeiten können Autoren den Status ihrer Einreichung verfolgen
    - Nach dem Einreichen von Arbeiten erhalten die zugewiesenen Gutachter eine Benachrichtigung über die neue Einreichung
- Erstellen von Gutachten:
    - Gutachter können Gutachten für die ihnen zugewiesenen Arbeiten erstellen, indem sie die Bewertungsformulare ausfüllen und ihre Bewertungen und Kommentare abgeben.
    - Gutachter können den Status ihrer Gutachten verfolgen und erhalten Benachrichtigungen über Änderungen oder Aktualisierungen im Begutachtungsprozess.
    - Gutachter können mit Autoren kommunizieren, um Fragen zu klären oder Feedback zu geben, wenn dies im Begutachtungsprozess vorgesehen ist.
- Rückgabe von Gutachten an Autoren:
    - Nach Abschluss der Gutachten werden die Bewertungen und Kommentare an die Autoren zurückgegeben, damit sie Feedback zu ihren Arbeiten erhalten und gegebenenfalls Verbesserungen vornehmen können.
    - Autoren können den Status ihrer Einreichungen verfolgen und erhalten Benachrichtigungen über Änderungen oder Aktualisierungen im Begutachtungsprozess.
- Statisken und Berichte:
    - Das System ermöglicht die Erstellung von Statistiken und Berichten über den Begutachtungsprozess, um Einblicke in die Anzahl der Einreichungen, die durchschnittliche Bewertung, die Bearbeitungszeit, etc. zu erhalten. Diese Statistiken können von Prüfungsamt genutzt werden, um den Begutachtungsprozess zu überwachen und zu verbessern.
    - Das System erlaubt es nach Abschluss aller Gutachten eines Moduls Statistiken für die Autoren zu erstellen, um ihnen Einblicke in die Bewertung ihrer Arbeiten im Vergleich zu anderen Einreichungen zu geben. Diese Statistiken können den Autoren helfen, ihre Stärken und Schwächen zu erkennen und ihre zukünftigen Arbeiten zu verbessern. (Notenspiegel)


Microservice Komponenten:
 - Web-UI: Frontend-Komponente für die Interaktion mit Benutzern - Nutzt REST-APIs für die Kommunikation mit den anderen Microservices - Monolithise Web-UI um eine geschlossene Benutzererfahrung zu bieten
 - User Managment Service:
 - 