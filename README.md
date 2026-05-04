# MSA26-PeerReview Gruppe A
PeerReview: Ein System zum gegenseitigen Begutachten von wissenschaftlichen Arbeiten


# AWS Infrastructure
Die AWS Infrastruktur besteht aus einem Baseline Stack, welcher die grundlegende Infrastruktur bereitstellt, und mehreren Service Stacks, welcher die eigentliche Service-Infrastruktur in einer Microservice Architektur bereitstellt. Der Baseline Stack muss vor den Service Stacks bereitgestellt werden, da der Service Stack auf Ressourcen des Baseline Stacks zugreift.

Zum Start sollte die AWS CLI installiert und konfiguriert sein. Aufgrund der kurzen Sessionszeit empfiehlt es sich, die AWS CLI über SSO zu konfigurieren. Dazu muss die AWS CLI mit dem folgenden Befehl konfiguriert werden:
    ``aws configure sso``
