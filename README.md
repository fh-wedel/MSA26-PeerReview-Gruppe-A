<div align="center">

# PeerReview

### Eine cloud-native Plattform für die Begutachtung wissenschaftlicher Arbeiten

[Live-System](https://msa26-peer-review.fh-wedel.dev) · [Projektbericht](Paper/main.pdf) · [Architektur](#architektur-auf-einen-blick) · [Mitwirkende](#team)

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

Melden Sie sich zunächst über das [Live-System](https://msa26-peer-review.fh-wedel.dev) an. Für einen schnellen Einstieg stehen vorbereitete Demo-Konten mit unterschiedlichen Rollen und Datenbeständen zur Verfügung:

| Benutzername | Passwort | Rolle |
| --- | --- | --- |
| DemoStudent | DemoStudent | Autor |
| DemoStudent2 | DemoStudent2 | Autor |
| DemoReviewer | DemoReviewer | Reviewer |
| DemoReviewer2 | DemoReviewer2 | Reviewer |
| DemoTeacher | DemoTeacher | Teacher |
| DemoExaminationOfficer | DemoExaminationOfficer | Examination Officer |
| Admin | AdminAdmin | Admin |

Die Demo-Konten ermöglichen insbesondere folgende Einblicke in den Ablauf:

| Konto | Vorbereiteter Datenbestand |
| --- | --- |
| `DemoStudent` | Drei Abgaben: eine abgeschlossene Abgabe mit Bewertung sowie zwei laufende Abgaben, für die noch Ausarbeitungen hochgeladen werden können. Nach dem Upload kann der zugeordnete Reviewer Feedback hinterlegen; zudem lässt sich ein KI-Review anfordern. Ein direkter Chat mit `DemoReviewer` und Gruppenunterhaltungen zu *Meine Submission* und *Unsere Gruppenarbeit* sind bereits vorhanden. |
| `DemoReviewer` | Ein abgeschlossenes Review zu einer Abgabe von `DemoStudent` sowie zwei offene Reviews, die noch auf Einreichungen warten. Der zugehörige direkte Chat und die beiden Gruppenunterhaltungen sind ebenfalls vorhanden. |
| `DemoStudent2` | Keine Einzelabgaben oder direkten Chats, aber Mitglied der Gruppenunterhaltungen zu *Meine Submission* und *Unsere Gruppenarbeit*. |
| `DemoReviewer2` | Leeres Reviewer-Konto ohne Reviews, Abgaben oder Chats. |
| `DemoTeacher` | Leeres Lehrenden-Konto ohne eigene Abgaben, Reviews oder Chats. |
| `DemoExaminationOfficer` | Kann alle Abgaben und Reviews einsehen, Benutzerrollen zuweisen und die fachlichen Schwerpunkte von Reviewern verwalten. |
| `Admin` | Kann alle Abgaben und Reviews einsehen, erhält einen Systemüberblick und kann neue Themengebiete für Abgaben anlegen. |

Neue Benutzer registrieren sich direkt im Live-System und bestätigen ihre E-Mail-Adresse. Anschließend muss ihnen eine Rolle zugewiesen werden. Für die Demo-Verwaltung geschieht dies im AWS-Konto `395982336633` unter **Amazon Cognito** über die Benutzergruppe des jeweiligen Kontos. Alternativ kann die Rollenzuweisung im Live-System mit einem Admin- oder Examination-Officer-Konto erfolgen. Voraussetzung ist, dass der Nutzer zuvor registriert wurde und seine E-Mail-Adresse bestätigt hat. Eine Beschreibung der Rollen und ihrer Berechtigungen befindet sich im [Projektbericht](Paper/main.pdf).

### Verfügbarkeit des Live-Systems
Um Kosten zu sparen, sind die ECS-Services werktags standardmäßig nur von 16:00 bis 22:00 Uhr in der Zeitzone `Europe/Berlin` erreichbar. Am Wochenende stehen die Services von 11:00 bis 23:00 Uhr zur Verfügung.

Falls eine längere Verfügbarkeit erforderlich ist, kann im GitHub-Projekt unter **Actions** die CI-Pipeline für den Branch `infra/concurrent-lambda-for-performace` manuell gestartet werden. Dadurch werden die Services für 24 Stunden durchgehend betrieben. Dies führt jedoch zu deutlich höheren Kosten.

Um anschließend wieder zum regulären Zeitplan zurückzukehren, kann der `main`-Branch erneut bereitgestellt werden. Die Services laufen dann wieder ausschließlich zu den oben genannten Standardzeiten.

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
├── doc/                     Aufgabenstellung und bearbeitbares Architekturdiagramm
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

Testen und Dokumentation wurden gemeinschaftlich verantwortet. Weitere technische und organisatorische Details sind im [Projektbericht](Paper/main.pdf) sowie in den [Agentenrichtlinien](AGENTS.md) dokumentiert.
