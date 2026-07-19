#import "../template.typ": lst

#set heading(numbering: "A.1")
#counter(heading).update(0)

= Repository

Der vollständige Quellcode, die Infrastrukturdefinitionen und die begleitende Dokumentation werden in einem Monorepository verwaltet. Das Repository ist öffentlich unter #link("https://github.com/fh-wedel/MSA26-PeerReview-Gruppe-A")[github.com/fh-wedel/MSA26-PeerReview-Gruppe-A] verfügbar. Die folgende Übersicht beschreibt die wichtigsten Bereiche.

- *Anwendungscode:*
  - `configuration-service/`, `matchingService/`, `submission-service/` und `responseService/` enthalten die fachlichen Kernservices für Konfiguration, Gutachterzuordnung, Einreichung und Ergebnisverwaltung.
  - `communicationService/`, `notificationService/` und `userService/` enthalten die ergänzenden Services für Kommunikation, Benachrichtigungen und Nutzerverwaltung.
  - `web-ui/` enthält die React-basierte Benutzeroberfläche.
  - `api-client/` enthält gemeinsam verwendete Java-Komponenten für die Backend-Services.
  - `templateEcsService/` dient als Vorlage für die Anlage weiterer Services.

- *Infrastruktur und Deployment:*
  - `infrabaseline/` enthält die grundlegende Infrastruktur auf @AWS, die vor den Services bereitgestellt wird.
  - `infraLibrary/` enthält wiederverwendbare Bausteine für @CDK zur Service-Infrastruktur.
  - `cloudfront/` enthält die zentrale Routing- und Auslieferungskonfiguration.
  - `.github/` enthält die GitHub-Actions-Workflows für Build, Tests und Deployment.

- *Dokumentation und Tests:*
  - `Paper/` enthält den Projektbericht als Typst-Projekt inklusive Abbildungen und Literaturverzeichnis.
  - `doc/` enthält Aufgabenstellung und Architekturdiagramme
  - `postman/` enthält Collections und Hilfsdateien für manuelle Tests der API.
  - `Präsentation/` enthält die Präsentationsfolien.


- *Entwicklungsunterstützung:*
  - `AGENTS.md` und weitere gleichnamige Dateien enthalten projektspezifische Hinweise für Coding-Agenten.
  - `.opencode/` enthält die Konfiguration der verwendeten OpenCode-Agenten.

