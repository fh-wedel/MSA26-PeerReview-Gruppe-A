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

### Nutzung der Software
- Am Anfnag einloggen. Dazu kann entweder ein neuer User angelegt werden und mit der Email die versendet wird bestätigen, dann ist man jedoch noch in keiner Usergruppe. Dafür muss man sich in der AWS Oberfläche des Accounts mit der ID 395982336633 anmelden, zu Cognito navigieren und dort links auf User Klicken. Dort den User anklicken und in den detials unten eine Gruppe zuweisen (Die beschreibungen der Gruppe sind in dem Paper geneauer zu entnehmne)
- Alternativ kann man einen User nehmen der bereits exisitert und auch bereist CHats, Abgaben Reviews etc. hat. Die User sind in Cognito unter dem Account mit der ID 395982336633 zu finden, wo entweder die Passwörter auch über die Oberfläche zurückgestezt werden, oder es werden die folgenden verwendet:
Username | Passwort | Usergruppe
| --- | --- | --- |
| DemoStudent | DemoStudent | Autor |
| DemoStudent2 | DemoStudent2 | Autor |
| DemoReviewer | DemoReviewer | Reviewer |
| DemoReviewer2 | DemoReviewer2 | Reviewer |
| DemoTeacher | DemoTeacher | Teacher |
| DemoExaminationOfficer | DemoExaminationOfficer | ExaminationOfficer |
| Admin | AdminAdmin | Admin |
| --- | -- | -- |

Dabei haben die User brets folgende Abgabe/Reviews:
DemoStudent: Hat drei Abgaben, eine Abgeschlossne (Inklusive Bewertung) und zwei noch laufende Abgaben, wo als nächstes die Ausarbeitungen hochgeladen werden müssten. (Daraufhin würde dann der zuständige Reviewer die Ausarbeitungen bewerten und Feedback geben, was dann wiederum der Autor einsehen kann -- Man könnte auch das AI Review anfordern bei allen arbeiten). Zusätzlih hat der der DemoStuden einen Chat mit dem DemoReviewer, wo er eine Frage gestellt hat (diese ist beim Demoreviewer dann in einem Chat sichtbar). Zusätzlich hat der DemoStudent in einer Gruppe über die Abgaben Meine Submission und auch Unsere Gruppenarbeit.

DemoReviewer: Hat ein review Abgeschlossen (das vom DemoStudent) und zwei Reviews in dem Sattus das auf die Abgabe gewartet wird (die beiden vom DemoStudent). Auch hat der DemoReviewer einen Chat mit dem DemoStudent, wo er die Frage beantwortet kann. Zusätzlich hat der DemoReviewer die Chats in einer Gruppe über die Abgaben Meine Submission und auch Unsere Gruppenarbeit.

DemoReviewer2: Hat keine Abgaben/Reviews und auch keine Chats.

DemoStudent2: Hat keine einzelabgaben aber auch die beiden Gruppenabgaben Meine Submission und Unsere Gruppenarbeit. DemoStudent2 hat keine einzelchats aber auch die beiden Gruppenabgaben Meine Submission und Unsere Gruppenarbeit.

DemoTeacher: Hat keine Abgaben/Review,weil er auch keine haben kann (siehe Rolle des Lehrenden) und hat auch keine Chats.

DemoExaminationOfficer: Hat auch keine eigenen Abgaben/Reviews aber haben die Möglichkeit alle Abgaben/Reviews einzusehen. Zudem kann der ExaminationOfficer die Usergruppen zu den Usern zuweisen. Dazu gehört auch das verwarten der Schwerpunkte der Review Fachgebiete eines Reviewers. Der ExaminationOfficer hat auch keine Chats.

Admin: Hat auch keine eigenen Abgaben/Reviews aber haben die Möglichkeit alle Abgaben/Reviews einzusehen. Zudem hat er einen Systemüberblich und kann neue Abgabe Themengebiete erstellen.


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
| Marcel Ossig | Projektleitung, Architekturentwurf, AWS-Infrastruktur, CI/CD, Matching-, Communication- und User-Service |
| Luca Jannsen | Web UI, Configuration Service, KI-Konfiguration und Code-Optimierung |
| Matthias Matthies | Configuration- und Submission-Service |
| Gideon Gyebi | Response- und Notification-Service |

Testen und Dokumentation wurden gemeinschaftlich verantwortet. Weitere technische und organisatorische Details sind im [Projektbericht](Paper/main.typ) sowie in den [Agentenrichtlinien](AGENTS.md) dokumentiert.
