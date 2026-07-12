= Einleitung

Diese Ausarbeitung beschreibt die Konzeption und Umsetzung des Systems „PeerReview“, welches im Rahmen der Lehrveranstaltung Moderne Softwarearchitekturen im Sommersemester 2026 an der Fachhochschule Wedel entstanden ist. Im folgenden Kapitel werden zunächst der fachliche und organisatorische Kontext der Aufgabenstellung dargestellt, anschließend die daraus abgeleiteten Ziele des Projekts erläutert sowie das grundsätzliche Vorgehen bei der Umsetzung und der Einsatz KI-gestützter Werkzeuge skizziert. Abschließend wird die Aufteilung der Aufgaben innerhalb des vierköpfigen Teams dargestellt.

== Kontext der Aufgabenstellung

Ausgangspunkt des Projekts ist die von Prof. Dr. Ulrich Hoffmann gestellte Aufgabe, ein webbasiertes System zu entwerfen und zu realisieren, das die gegenseitige Begutachtung wissenschaftlicher Arbeiten, etwa Seminar- oder Projektarbeiten, durch Studierende oder Mitarbeitende einer Organisation systematisch unterstützt. Also ein PeerReview-System, welches die Einreichung von Arbeiten, die Zuweisung von Gutachtern, die Erfassung von Bewertungen und Kommentaren sowie die Aggregation und Rückgabe der Gutachten an die Einreichenden übernimmt. 

Als denkbare Funktionen wurden in der Aufgabenstellung unter anderem die Einreichung von Dokumenten, eine regelbasierte oder manuelle Zuweisung von Gutachtern, strukturierte Bewertungsformulare, anonymisierte Begutachtung sowie eine Fristen- und Erinnerungsverwaltung genannt. Eine zentrale fachliche Anforderung besteht darin, über eine Plugin-Architektur unterschiedliche Begutachtungsworkflows wie Einfachblind, Doppelblind oder Open Review zu unterstützen, ohne dass die jeweilige Verfahrenslogik fest im Kern des Systems verankert wird. Die Aufgabenstellung legte hierbei einen starken Fokus auf die zugrunde liegende Architektur und warf explizit die Fragen auf, wie Workflow-Zustände zuverlässig verwaltet, Benachrichtigungen ereignisgesteuert ausgelöst und die einzelnen Komponenten geeignet skaliert werden können.

Darüber hinaus wurde der Einsatz KI-basierter Werkzeuge wie GitHub Copilot, Claude oder ChatGPT bei Entwurf, Implementierung, Test und Dokumentation ausdrücklich erwünscht, verbunden mit der Anforderung, den jeweiligen Einsatz sowie dessen Nutzen und Grenzen im Rahmen der Projektdokumentation zu reflektieren. Als weitere Vorgaben galten die Programmierung isolierter Komponenten samt zugehöriger Test-Clients, die gemeinsame Orchestrierung und Bereitstellung des Gesamtsystems auf einem Server sowie eine abschließende Präsentation der Ergebnisse.

== Zielsetzung <sec:goals>

Aus der beschriebenen Aufgabenstellung wurden für dieses Projekt mehrere konkrete Ziele abgeleitet. Ein erstes Ziel bestand darin, den Begutachtungsprozess in fachlich klar abgegrenzte Zuständigkeiten (Bounded Contexts) zu zerlegen und diese als eigenständige, lose gekoppelte Microservices umzusetzen, welche im Sinne des Database-per-Service-Prinzips jeweils über eine eigene Datenhaltung verfügen und überwiegend über asynchrone Nachrichten sowie punktuell über REST-Schnittstellen miteinander kommunizieren. Ein zweites Ziel war die Umsetzung der geforderten Plugin-Architektur für unterschiedliche Begutachtungsworkflows, sodass sich neue Review-Typen oder Bewertungsformate ohne Anpassung des Kernsystems ergänzen lassen. Weiterhin sollte das gesamte System zunächst als @MVP realisiert werden, dessen Funktionsumfang wir gemeinsam festlegten und im weiteren Verlauf agil erweitern konnten.

Auf infrastruktureller Ebene wurde das Ziel verfolgt, sämtliche Komponenten vollständig über @IaC zu beschreiben und automatisiert in eine öffentlich erreichbare Cloud-Umgebung auf Basis von @AWS auszurollen, ergänzt durch eine durchgängige Continuous-Integration- und Continuous-Deployment-Pipeline (CI/CD) für Build, Test und Deployment.

Neben diesen technischen Zielen verfolgten wir ein übergeordnetes, eher experimentelles Ziel. Da der Einsatz KI-gestützter Werkzeuge in der Aufgabenstellung ausdrücklich gewünscht war, wollten wir bewusst untersuchen, in welchem Umfang sich eine verteilte, sicherheitsrelevante Microservice-Architektur auf @AWS mithilfe agentischer Coding-Werkzeuge realisieren lässt und wo die Grenzen eines solchen Vorgehens liegen. Wir begleiteten diese Fragestellung als fortlaufendes Experiment über die gesamte Projektlaufzeit und dokumentierten die dabei gewonnenen Erkenntnisse. Auf unsere hierbei gemachten Erfahrungen wird in @ch:implementation-workflow detailliert eingegangen; eine kritische Einordnung erfolgt zudem im Kapitel @ch:vibecoding-critique.

== Umsetzung und Werkzeugeinsatz

Zur Realisierung der genannten Ziele wurde ein einzelnes Repository angelegt, in dem sowohl die acht Backend- und Frontend-Komponenten des Systems als auch die zugehörige Infrastruktur als Code gemeinsam verwaltet werden. Das Backend wurde durchgängig in Java mit dem Spring-Boot-Framework umgesetzt, während die Web-Oberfläche als Single-Page-Application auf Basis von React und Vite realisiert wurde. Die Bereitstellung erfolgt containerisiert über AWS Fargate, wobei sämtliche Infrastrukturressourcen mit dem AWS Cloud Development Kit deklarativ beschrieben sind. Die Entwicklung selbst fand, wie in der Aufgabenstellung gefordert, im bereitgestellten GitHub-Repository in Form eines eigenen Gruppen-Forks statt, wobei über Feature-Branches gearbeitet und eine GitHub-Actions-Pipeline für Build, Test und Deployment eingerichtet wurde. Wie die einzelnen Komponenten fachlich zusammenwirken, wird im nachfolgenden Kapitel zu den Features der Anwendung sowie im Kapitel zum Architekturentwurf ausführlich beschrieben.

Bei der eigentlichen Entwicklung wurde in großem Umfang auf agentische Coding-Werkzeuge zurückgegriffen. Den Schwerpunkt bildeten hierbei Claude Code von Anthropic sowie Google Antigravity, ergänzt um punktuelle Erprobungen von OpenCode für einzelne Services sowie den Einsatz von GitHub Copilot als automatisierte Code-Review-Instanz innerhalb des Pull-Request-Workflows. Die konkrete Vorgehensweise, die verwendeten Werkzeuge sowie die dabei gemachten Erfahrungen werden dabei in @ch:implementation-workflow beschrieben.

== Aufgabenverteilung im Team

Wir, Marcel Ossig, Luca Jannsen, Matthias Matthies und Gideon Gyebi, setzten das Projekt als vierköpfiges Team um. Marcel übernahm die Rolle des Projektleiters und Architekten und verantwortete maßgeblich den Architekturentwurf sowie den Aufbau der grundlegenden AWS-Infrastruktur. Luca, Matthias und Gideon implementierten als Softwareentwickler jeweils eigene, ihnen zugeordnete Services innerhalb der beschriebenen Microservice-Architektur. Testen und Dokumentation verstanden wir als geteilte Verantwortung und führten sie begleitend zur eigentlichen Implementierung durch.

@tab:task-distribution fasst die grobe Verteilung der Aufgabenbereiche innerhalb des Teams zusammen.

#figure(
  caption: [Aufgabenverteilung im Team],
  table(
    columns: 2,
    [*Aufgabenbereich*], [*Verantwortlich*],
    [Projektleitung, Architekturentwurf und AWS-Infrastruktur (inkl. initialer Baseline und CI/CD)], [Marcel],
    [Matching Service, Communication Service und User Service], [Marcel],
    [Configuration Service], [Luca, Matthias],
    [Submission Service], [Matthias],
    [Response Service und Notification Service], [Gideon],
    [Web-UI], [Luca],
    [KI-Einrichtung (`AGENTS.md` / `CLAUDE.md`) und Code-Optimierung (CRAP-Index)], [Luca],
    [Testen (u. a. Postman) und Dokumentation], [Alle],
  )
) <tab:task-distribution>

Im folgenden Kapitel werden zunächst die Features des PeerReview-Systems aus Nutzersicht vorgestellt, bevor in den weiteren Kapiteln detailliert auf Architektur, Umsetzung und die kritische Reflexion des Projekts eingegangen wird.
