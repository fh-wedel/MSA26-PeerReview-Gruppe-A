# AWS Infrastructure Baseline
Dieser Stack stellt die grundlegende Infrastruktur für die Bereitstellung von ECS Services bereit. Er beinhaltet die notwendigen Ressourcen, um einen ECS Service zu erstellen und zu betreiben. Der Baseline Stack beinhaltet die folgenden Ressourcen:
- VPC mit öffentlichen und privaten Subnetzen
- Internet Gateway
- ECS Cluster mit Fargate Spot Capacity Provider
- ECR Repository für die Bereitstellung von Docker Images
- Cognito User Pool und App Client für Authentifizierung

Ebenfalls umfasst der Baseline Stack wichtige Konstanten und CDK Outputs, die von den Service Stacks benötigt werden, um auf die bereitgestellten Ressourcen zuzugreifen. Dazu gehören beispielsweise die VPC ID, die Subnet IDs, die Security Group IDs und die ECR Repository URI.

## Zusammenspiel mit Service Stacks
Die Service Stacks erstellen APIs in API Gateway, Verified Permissions Policy Stores und die eigentlichen ECS Services. Dabei greifen sie auf Baseline Outputs zu, insbesondere auf die Cognito IDs für Authentifizierung und Autorisierung. Autoscaling wird pro Service Stack konfiguriert, der Baseline Stack liefert dafür das ECS Cluster und die Netzwerkinfrastruktur.

## Gedanken zur Kostenoptimierung
Damit ein ECS Service Internetzugriff hat muss er entweder in einem öffentlichen Subnetz bereitgestellt werden oder über einen NAT Gateway in einem privaten Subnetz Zugriff auf das Internet haben. Da NAT Gateways mit Kosten permanenten hohen verbunden sind, ist die Bereitstellung von ECS Services in öffentlichen Subnetzen eine kostengünstigere Alternative, wenn nur weniger Services deployed werden. Allerdings müssen dabei Sicherheitsaspekte berücksichtigt werden, da die Services direkt dem Internet ausgesetzt sind. Es ist wichtig, geeignete Sicherheitsgruppen und Netzwerk-ACLs zu konfigurieren, um den Zugriff auf die Services zu beschränken und potenzielle Angriffe zu verhindern.

AWS Fargate Spot Capacity Provider ermöglicht die Nutzung von ungenutzten EC2-Kapazitäten zu einem reduzierten Preis. Durch die Verwendung von Spot-Instanzen können erhebliche Kosteneinsparungen erzielt werden, da es sich bei dem Projekt um eine Testumgebung handelt, in der die Verfügbarkeit der Services nicht kritisch ist. Es ist jedoch wichtig zu beachten, dass Spot-Instanzen jederzeit von AWS zurückgerufen werden können.

Es wird keine High Availability Architektur implementiert, da es sich um eine Testumgebung handelt und die Verfügbarkeit der Services nicht kritisch ist. Durch die Bereitstellung der Services in einer einzigen Availability Zone können Kosten gespart werden, da keine zusätzlichen Ressourcen für die Bereitstellung in mehreren Availability Zones erforderlich sind. Es ist jedoch wichtig zu beachten, dass dies zu Ausfallzeiten führen kann, wenn die Availability Zone ausfällt.
Eine dieser gesparten Ressourcen wäre ein Application Load Balancer, da dieser für die Bereitstellung von mehreren Services zum Verteilen des Traffics notwendig wäre. Da nur ein Service bereitgestellt wird, ist ein Load Balancer nicht notwendig und die Services können direkt über die öffentliche IP-Adresse angesprochen werden. Es ist jedoch wichtig zu beachten, dass dies zu Skalierungsproblemen führen kann, wenn mehrere Services bereitgestellt werden oder wenn der Traffic auf den Service steigt.

## Tests
Um die Tests für die Infrasturktur zu implementieren, kann der Befehl `npm run test` ausgeführt werden. Dieser Befehl führt die Tests aus, die in der `infrabaseline/test`-Datei definiert sind. Die Tests überprüfen, ob die Ressourcen korrekt erstellt werden beim deployment.