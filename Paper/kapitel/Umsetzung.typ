#set heading(numbering: "1.1")
#import "@preview/glossarium:0.5.10": gls, glspl

= Umsetzung und Workflow <ch:implementation-workflow>
Ein wesentlicher Bestandteil der praktischen Umsetzung umfasste den Einsatz von KI-gestützten Coding-Agenten wie Claude Code oder Google Antigravity. Vor Beginn der eigentlichen Projektphase wurden strategische Entscheidungen bezüglich deren Evaluierung getroffen, um eine bestmögliche Integration in den Entwicklungsprozess zu gewährleisten. Neben diesen modernen, #gls("LLM")-basierten Ansätzen fanden klassische Verfahren des Software-Lebenszyklus Anwendung. Hierzu zählen die Einrichtung einer Continuous-Integration- und Continuous-Deployment-Pipeline (CI/CD) sowie das automatisierte und manuelle Testen.

== Baseline <sec:baseline>
Zu Beginn der Implementierungsphase wurde die Entscheidung für ein Mono-Repository (Monorepo) getroffen. Die primäre Absicht bestand darin, den KI-Agenten den vollständigen Kontext über alle Microservices hinweg agnostisch bereitzustellen, ohne dass ein isolierter Wechsel zwischen verschiedenen Projektarchiven erforderlich ist. Obwohl es sich bei dem Vorhaben um eine vollständige Greenfield-Entwicklung handelte, wurde die initiale Baseline bewusst nicht agentisch, sondern lediglich KI-unterstützt und manuell entwickelt.

Im Rahmen dieser Baseline wurden alle grundlegenden Infrastrukturkomponenten mittels des AWS CDK implementiert. Dadurch konnte sichergestellt werden, dass die Services keine kostenintensiven Default-Ressourcen verwenden. Gleichzeitig förderte dieses Vorgehen das Systemverständnis innerhalb des Entwicklungsteams, was das spätere Debugging erheblich erleichterte. Da die Inter-Service-Kommunikation vollständig transparent war, ließ sich die Ursachenanalyse (Root-Cause-Analysis) im Fehlerfall schnell auf einzelne, isolierte Microservices eingrenzen. Dies erwies sich in einem verteilten System als fundamentaler Vorteil: Da autonome Agenten in komplexen AWS-Cloud-Infrastrukturen ohne vordefinierten Rahmen den Gesamtüberblick verlieren können, war es hocheffizient, den betroffenen Service vorab manuell zu identifizieren und den Agenten anschließend mit dedizierten Fehlermeldungen in einer isolierten Umgebung arbeiten zu lassen.

Ergänzend zur infrastrukturellen Basis wurde eine applikative Grundlage in Form eines *Template Service* geschaffen. Dieser diente den Coding-Agenten als struktureller Anker und Referenzarchitektur, um nahezu direkt lauffähige, neue Services zu generieren. Zu diesem Zweck wurde dieser Prototyp manuell implementiert, mit minimalen funktionalen Features ausgestattet und so auf die Infrastruktur abgestimmt, dass das Zusammenspiel aus Netzwerk, Autoscaling, DynamoDB-Datenbanken und dem API Gateway fehlerfrei funktionierte. Erst nach erfolgreicher Validierung dieser Basis wurden die Agenten eingesetzt, um die eigentliche Geschäftslogik in Kopien dieses Template-Service zu implementieren.

Die Praxis zeigte, dass die Coding-Agenten die vorgegebene Baseline sowohl auf infrastruktureller als auch auf applikativer Ebene weitgehend adaptierten, was zu einer konsistenten Systemlandschaft führte. Dennoch war auffällig, dass die Agenten vereinzelt unvorhergesehene und nicht an die Architekturrichtlinien angepasste Entscheidungen trafen. Beispielsweise versuchte ein Agent eigenständig, eine PostgreSQL-Datenbank zu provisionieren, was für den vorliegenden Anwendungsfall fachlich nicht erforderlich war und zudem durch den Verzicht auf vollständige Serverless-Eigenschaften die Betriebskosten unnötig erhöht hätte.

Auch der Einsatz des Monorepos wirkte sich im Hinblick auf das Kontextfenster (Context Window) der verwendeten Sprachmodelle positiv aus, da die Modelle jederzeit serviceübergreifendes Systemwissen in ihre Generierung einbeziehen konnten. Aus ökonomischer Sicht offenbarte dieser Ansatz jedoch auch Nachteile: Bei der Initiierung neuer Prompts fiel das Kontextfeld und insbesondere die Anzahl der Input-Tokens sehr groß aus, was zu erhöhten API-Gebühren führte. Zudem besteht bei sehr großen Kontexten das inhärente Risiko von Qualitätseinbußen, da @LLM dazu neigen, feine Details inmitten umfangreicher Datenmengen zu übersehen (Lost-in-the-Middle-Phänomen).

== Agentic Coding <sec:agentic-coding>

=== Agents.MD / Claude.MD <sec:agents-md>
// (Gideon)

=== Antigravity <sec:antigravity>
// (Matthias)

=== Claude Code <sec:claude-code>
// (Gideon)

=== Open Code <sec:open-code>
// (Luca)

KI-Coding-Harnesses wie Claude Code, Antigravity oder Codex haben gemeinsam, dass sie üblicherweise für die Softwareentwicklung in Kombination mit den hauseigenen @LLM:pl und Abonnements der jeweiligen Hersteller wie Anthropic, Google oder OpenAI vorgesehen werden. Es wird versucht, die Verwendung der Abonnements außerhalb der jeweiligen Plattformen zu unterbinden und das Ökosystem durch die Bindung an die proprietären Dienste zu stärken. Insbesondere Anthropic hat sich zum Beispiel bestrebt gezeigt, eine Verwendung mit nicht unternehmenseigener Software zu verhindern und den Zugriff von Benutzern vollständig zu sperren @engelking_anthropic_2026. Eine Migration 

=== GitHub Copilot Reviewer <sec:github-reviewer>
// (Matthias)

== CI / CD Integration <sec:cicd-integration>
Als etabliertes Verfahren der modernen Softwareentwicklung wurde eine Continuous-Integration- und Continuous-Deployment-Pipeline eingerichtet. Diese erlaubt ein automatisiertes Deployment der aktuellen Softwareversion auf Knopfdruck. Hierdurch werden fehleranfällige manuelle Bereitstellungsprozesse eliminiert. Gleichzeitig stellt der Ansatz der kontinuierlichen Integration sicher, dass Modifikationen frühzeitig zusammengeführt werden, wodurch potenzielle Integrationskonflikte oder Laufzeitfehler in einem frühen Stadium sichtbar werden. Neben der Option, spezifische Feature-Branches manuell zu deployen, wird bei jedem Merge auf den geschützten Hauptzweig (`main` branch) automatisch das Deployment aller vom Commit betroffenen Microservices initiiert.

Die Pipeline ist technologisch auf Basis von GitHub Actions realisiert. Der Workflow umfasst das automatisierte Kompilieren des Java-Backend-Codes sowie die Ausführung der Unit-Tests für die Applikation und den TypeScript-basierten IaC-Code. Nach erfolgreicher Verifikation wird das Docker-Image erstellt und in die Amazon Elastic Container Registry (ECR) gepusht. Im anschließenden Schritt initiiert die Pipeline mittels des Befehls `cdk deploy` das infrastrukturelle Deployment, wodurch sowohl die modifizierten Cloud-Ressourcen aktualisiert als auch die neuen Applikations-Images auf den ECS-Fargate-Instanzen ausgerollt werden.

== Testen (Manuell) <sec:manual-testing>
// (Gideon)

== Optimierung <sec:optimization>
// (Luca)

== Dokumentation <sec:documentation>
// (Claude, Matthias)

=== Postman Collection <sec:postman-collection>

=== AI Written Documentation <sec:ai-documentation>