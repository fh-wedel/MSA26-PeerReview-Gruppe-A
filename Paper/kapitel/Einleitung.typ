= Einleitung

Diese Ausarbeitung beschreibt die Konzeption und Umsetzung des Systems „PeerReview“, welches im Rahmen der Lehrveranstaltung Moderne Softwarearchitekturen im Sommersemester 2026 an der Fachhochschule Wedel entstanden ist. Im folgenden Kapitel werden zunächst der fachliche und organisatorische Kontext der Aufgabenstellung dargestellt, anschließend die daraus abgeleiteten Ziele des Projekts erläutert sowie das grundsätzliche Vorgehen bei der Umsetzung und der Einsatz KI-gestützter Werkzeuge skizziert. Abschließend wird die Aufteilung der Aufgaben innerhalb des vierköpfigen Teams dargestellt.

== Kontext der Aufgabenstellung <sec:context>

Ausgangspunkt des Projekts ist die von Prof. Dr. Ulrich Hoffmann gestellte Aufgabe, ein webbasiertes System zu entwerfen und zu realisieren, das die gegenseitige Begutachtung wissenschaftlicher Arbeiten, etwa Seminar- oder Projektarbeiten, durch Studierende oder Mitarbeitende einer Organisation systematisch unterstützt. Also ein PeerReview-System, welches die Einreichung von Arbeiten, die Zuweisung von Gutachtern, die Erfassung von Bewertungen und Kommentaren sowie die Aggregation und Rückgabe der Gutachten an die Einreichenden übernimmt. 

Als denkbare Funktionen wurden in der Aufgabenstellung unter anderem die Einreichung von Dokumenten, eine regelbasierte oder manuelle Zuweisung von Gutachtern, strukturierte Bewertungsformulare, anonymisierte Begutachtung sowie eine Fristen- und Erinnerungsverwaltung genannt. Eine zentrale fachliche Anforderung besteht darin, über eine Plugin-Architektur unterschiedliche Begutachtungsworkflows wie Einfachblind, Doppelblind oder Open Review zu unterstützen, ohne dass die jeweilige Verfahrenslogik fest im Kern des Systems verankert wird. Die Aufgabenstellung legte hierbei einen starken Fokus auf die zugrunde liegende Architektur und warf explizit die Fragen auf, wie Workflow-Zustände zuverlässig verwaltet, Benachrichtigungen ereignisgesteuert ausgelöst und die einzelnen Komponenten geeignet skaliert werden können.

Darüber hinaus wurde der Einsatz KI-basierter Werkzeuge wie GitHub Copilot, Claude oder ChatGPT bei Entwurf, Implementierung, Test und Dokumentation ausdrücklich erwünscht, verbunden mit der Anforderung, den jeweiligen Einsatz sowie dessen Nutzen und Grenzen im Rahmen der Projektdokumentation zu reflektieren. Als weitere Vorgaben galten die Programmierung isolierter Komponenten samt zugehöriger Test-Clients, die gemeinsame Orchestrierung und Bereitstellung des Gesamtsystems auf einem Server sowie eine abschließende Präsentation der Ergebnisse.

== Zielsetzung <sec:goals>

Aus der in @sec:context beschriebenen Aufgabenstellung wurden für dieses Projekt konkrete Umsetzungsziele abgeleitet. Die geforderte Plugin-Fähigkeit sowie die fachliche Zerlegung des Begutachtungsprozesses sollten dabei nicht nur erfüllt, sondern durch eine konsequente Microservice-Architektur mit eigenständigen, lose gekoppelten Services technisch untermauert werden; wie diese Architektur im Detail aussieht, wird im Kapitel zum Architekturentwurf (@ch:architecture) hergeleitet. Weiterhin sollte das gesamte System zunächst als @MVP realisiert werden, dessen Funktionsumfang gemeinsam im Team festgelegt und im weiteren Verlauf agil erweitert werden konnte.

Auf infrastruktureller Ebene wurde das Ziel verfolgt, sämtliche Komponenten vollständig über @IaC zu beschreiben und automatisiert in eine öffentlich erreichbare Cloud-Umgebung auf Basis von @AWS auszurollen, ergänzt durch eine durchgängige Continuous-Integration- und Continuous-Deployment-Pipeline (CI/CD) für Build, Test und Deployment.

Neben diesen technischen Zielen verfolgte das Team ein übergeordnetes, eher experimentelles Ziel: den geforderten Einsatz KI-gestützter Werkzeuge nicht nur pflichtgemäß umzusetzen, sondern bewusst zu untersuchen, in welchem Umfang sich eine verteilte, sicherheitsrelevante Microservice-Architektur auf @AWS mithilfe agentischer Coding-Werkzeuge realisieren lässt und wo die Grenzen eines solchen Vorgehens liegen. Diese Fragestellung wurde als fortlaufendes Experiment über die gesamte Projektlaufzeit begleitet. Die dabei gewonnenen Erkenntnisse werden in @ch:implementation-workflow beschrieben und in @ch:vibecoding-critique kritisch eingeordnet.

== Umsetzung und Werkzeugeinsatz

Das grundsätzliche Vorgehen bei der Realisierung der genannten Ziele gliederte sich in drei aufeinanderfolgende Schritte. Zunächst wurde die Architektur des Gesamtsystems gemeinsam im Team entworfen. Darauf aufbauend wurde eine technische Grundlage geschaffen, die den einzelnen Komponenten als gemeinsamer Ausgangspunkt diente. Erst im dritten Schritt wurden die fachlichen Anforderungen der einzelnen Services unter intensivem Einsatz agentischer Coding-Werkzeuge implementiert. Wie die einzelnen Komponenten fachlich zusammenwirken und wie die Architektur sowie die Infrastruktur im Detail umgesetzt wurden, wird im nachfolgenden Kapitel zu den Features der Anwendung sowie im Kapitel zum Architekturentwurf (@ch:architecture) ausführlich beschrieben.

Bei der eigentlichen Entwicklung wurde in großem Umfang auf agentische Coding-Werkzeuge zurückgegriffen. Den Schwerpunkt bildeten hierbei Claude Code von Anthropic sowie Google Antigravity, ergänzt um punktuelle Erprobungen von OpenCode für einzelne Services sowie den Einsatz von GitHub Copilot als automatisierte Code-Review-Instanz innerhalb des Pull-Request-Workflows. Die konkrete Vorgehensweise, die verwendeten Werkzeuge sowie die dabei gemachten Erfahrungen werden in @ch:implementation-workflow beschrieben.

== Aufgabenverteilung im Team

Das Projekt wurde von einem vierköpfigen Team aus Marcel Ossig, Luca Jannsen, Matthias Matthies und Gideon Gyebi umgesetzt. Marcel übernahm die Rolle des Projektleiters und Architekten und verantwortete maßgeblich den Architekturentwurf sowie den Aufbau der grundlegenden AWS-Infrastruktur. Luca, Matthias und Gideon fungierten als Softwareentwickler und implementierten jeweils eigene, ihnen zugeordnete Services innerhalb der beschriebenen Microservice-Architektur. Testen und Dokumentation wurden als geteilte Verantwortung des gesamten Teams verstanden und liefen begleitend zur eigentlichen Implementierung.

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
