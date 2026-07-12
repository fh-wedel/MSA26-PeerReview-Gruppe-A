<div align="center">

# PeerReview

### Eine cloud-native Plattform für die Begutachtung wissenschaftlicher Arbeiten

[Live-System](https://msa26-peer-review.fh-wedel.dev) · [Projektbericht](Paper/main.typ) · [Architektur](#architektur-auf-einen-blick) · [Mitwirkende](#team)

[![CI](https://github.com/fh-wedel/MSA26-PeerReview-Gruppe-A/actions/workflows/ci.yml/badge.svg)](https://github.com/fh-wedel/MSA26-PeerReview-Gruppe-A/actions/workflows/ci.yml)
![Coverage](.github/badges/jacoco.svg)
![Java](https://img.shields.io/badge/Java-25-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![AWS CDK](https://img.shields.io/badge/AWS%20CDK-v2-FF9900?logo=amazonaws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

</div>

> Entstanden im Sommersemester 2026 im Modul **Moderne Softwarearchitekturen** an der Fachhochschule Wedel.

## Projektidee

PeerReview digitalisiert den Ablauf wissenschaftlicher Begutachtungen. Lehrende oder das Prüfungsamt konfigurieren eine Abgabe, Autoren reichen ihre Arbeit ein, das System ordnet Gutachter zu und stellt Bewertungen sowie Feedback nach Abschluss des Review-Prozesses bereit.

Im Mittelpunkt steht eine ereignisgesteuerte Microservice-Architektur. Unterschiedliche Review-Verfahren — Open Review, Single Blind und Double Blind — lassen sich über eine Plugin-Architektur konfigurieren, ohne die Kernanwendung anzupassen.

## Was das System bietet

| Konfiguration | Workflow | Kommunikation | Rückmeldung |
| --- | --- | --- | --- |
| Abgaben, Fristen, Kriterien und Review-Verfahren definieren | Gutachter automatisch oder gezielt zuordnen | Kontextbezogene Chats und Echtzeit-Benachrichtigungen | Bewertungen, Feedback und Dokumente zentral bereitstellen |

## Architektur auf einen Blick

Die Anwendung setzt sich aus sieben fachlichen Backend-Services und einer React-basierten Web-Oberfläche zusammen. Jeder Service ist für einen klar abgegrenzten Fachbereich zuständig und besitzt eine eigene Datenhaltung. Fachliche Ereignisse werden überwiegend über Amazon SQS ausgetauscht; REST wird für direkte Abfragen verwendet.


| Service | Verantwortung |
| --- | --- |
| Configuration Service | Abgaben, Review-Verfahren und Workflow-Plugins konfigurieren |
| Matching Service | Gutachter passenden Abgaben zuordnen |
| Submission Service | Einreichungen und PDF-Dokumente verwalten |
| Response Service | Bewertungen und Ergebnisse bereitstellen |
| Communication Service | Direkt- und abgabebezogene Chats ermöglichen |
| Notification Service | In-App- und externe Benachrichtigungen versenden |
| User Service | Nutzer, Rollen und Attribute über Cognito verwalten |
| Web UI | Services für die Nutzeroberfläche zusammenführen |

## Technologie-Stack

| Bereich | Technologien |
| --- | --- |
| Frontend | React, TypeScript, Vite, Material UI |
| Backend | Java, Spring Boot, OpenAPI |
| Cloud & Infrastruktur | AWS CDK, ECS Fargate, Lambda, API Gateway, CloudFront |
| Daten & Kommunikation | DynamoDB, S3, SQS, Cloud Map |
| Sicherheit | Amazon Cognito, Amazon Verified Permissions, Spring Security |
| Qualität | GitHub Actions, Maven, Vitest, JaCoCo, AWS-CDK-Tests |

## Live-Deployment und CI/CD

Die Anwendung ist unter **[msa26-peer-review.fh-wedel.dev](https://msa26-peer-review.fh-wedel.dev)** erreichbar.

Die Bereitstellung erfolgt vollständig automatisiert über GitHub Actions. Bei Pull Requests und Änderungen auf `main` führt die Pipeline die relevanten Anwendungs- und Infrastrukturtests aus, erstellt ARM64-Containerimages, veröffentlicht diese in Amazon ECR und aktualisiert die betroffenen AWS-CDK-Stacks.

## Repository-Navigation

```text
.
├── web-ui/                  React-/Vite-Frontend
├── configuration-service/   Konfiguration und Workflow-Plugins
├── matchingService/         Gutachterzuordnung
├── submission-service/      Einreichungen und Dokumente
├── responseService/         Bewertungen und Ergebnisse
├── communicationService/    Chat-Funktionalität
├── notificationService/     Benachrichtigungen
├── userService/             Benutzerverwaltung
├── api-client/              Gemeinsame Java-Komponenten
├── infrabaseline/           AWS-Basisinfrastruktur
├── infraLibrary/            Wiederverwendbare CDK-Bausteine
├── cloudfront/              Zentraler CloudFront-Stack
├── templateEcsService/      Vorlage für neue Services
├── .github/                 CI/CD-Workflows
├── postman/                 Collections für manuelle API-Tests
├── Paper/                   Projektbericht als Typst-Projekt
├── doc/ und docs/           Aufgabenstellung, Diagramme und Notizen
└── Präsentation/            Präsentationsfolien
```

Die Service-Verzeichnisse enthalten jeweils den Anwendungscode, automatisierte Tests, OpenAPI-Beschreibungen und — sofern erforderlich — einen eigenen CDK-Stack im Unterordner `infra/`.

## Team

| Mitglied | Schwerpunkte |
| --- | --- |
| Marcel Ossig | Projektleitung, Architektur, AWS-Infrastruktur, CI/CD, Matching-, Communication- und User-Service |
| Luca Jannsen | Web UI, Configuration Service, KI-Konfiguration und Code-Optimierung |
| Matthias Matthies | Configuration- und Submission-Service |
| Gideon Gyebi | Response- und Notification-Service |

Testen und Dokumentation wurden gemeinschaftlich verantwortet. Weitere technische und organisatorische Details sind im [Projektbericht](Paper/main.typ) sowie in den [Agentenrichtlinien](AGENTS.md) dokumentiert.
