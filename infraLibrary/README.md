# Infrastructure Library
Dies ist eine Library die nicht selber deployed wird aber von den Service Stacks genutzt wird, um die Infrastruktur für die Services bereitzustellen. Die Library enthält Methoden zum Erstellen von Ressourcen die von mehreren Services genutzt werden.

Dadurch wird vermieden, dass es zu duplikaten Code in den Service Stacks kommt und die Infrastruktur konsistent bleibt. Zudem können Änderungen an der Infrastruktur zentral in der Library vorgenommen werden, ohne dass alle Service Stacks angepasst werden müssen.

## Enthaltene Bausteine (Auszug)
- EcsInfra: Hilfsfunktionen fuer ECS Services, Health Checks und Autoscaling (CPU Target).
- ApiStack: API Gateway mit Lambda Proxy zu ECS Services, optional mit AWS Verified Permissions Authorizer.
- VerifiedPermissionsStore/VerifiedPermissionsPolicySet: Aufbau eines Policy Stores, Cedar Policies und Cognito Identity Source.
- LogsInfra und SqsInfra: standardisierte Log Groups und SQS Queues.