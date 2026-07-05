# MSA26-PeerReview Gruppe A

[![CI](https://github.com/fh-wedel/MSA26-PeerReview-Gruppe-A/actions/workflows/ci.yml/badge.svg)](https://github.com/fh-wedel/MSA26-PeerReview-Gruppe-A/actions/workflows/ci.yml)

**Zweck:** Ein verteiltes System zum gegenseitigen Begutachten von wissenschaftlichen Arbeiten (Peer-Review).
**Umgebung:** [msa26-peer-review.fh-wedel.dev](https://msa26-peer-review.fh-wedel.dev)

---

## 1. Initiales Setup & Deployment

### Voraussetzungen
* **AWS CLI** (konfiguriert via AWS SSO)
* **Node.js & npm** (für AWS CDK)
* **Docker** (für Container-Builds)

### Deployment-Schritte

1. **AWS SSO Login initiieren:**
   ```bash
   aws sso login
   ```

2. **Baseline Infrastruktur deployen:**
   Die Basis-Infrastruktur (VPC, Cluster, ECR) muss zwingend zuerst bereitgestellt werden:
   ```bash
   cd infrabaseline
   npm install
   npx cdk deploy --all
   cd ..
   ```

3. **Services deployen:**
   Die einzelnen Microservices (z.B. `configuration-service`, `matchingService`, `web-ui`) werden primär über die GitHub Actions CI/CD Pipeline deployt. 
   
   Für ein manuelles Deployment eines Services:
   1. Docker-Image bauen und in das ECR pushen.
   2. CDK Stack deployen:
      ```bash
      cd <service-ordner>/infra
      npm install
      npx cdk deploy
      ```

---

## 2. AWS Infrastruktur & Architektur

Die Gesamtanwendung basiert auf einer cloud-nativen Microservice-Architektur in AWS. Die Bereitstellung (Infrastructure as Code via AWS CDK) ist modular in einen **Baseline Stack** und mehrere **Service Stacks** unterteilt. Der Baseline Stack stellt die geteilte Kerninfrastruktur (VPC, Cluster, zentrale Rollen) bereit und muss zwingend vor den einzelnen Service Stacks deployt werden.

### Zentrale Services und Sicherheit
* **Zentraler Einstiegspunkt:** Das **AWS API Gateway** nimmt REST-Anfragen entgegen und leitet den Traffic per Lambda-Proxy-Integration an die jeweiligen ECS-Services weiter.
* **Authentifizierung:** **AWS Cognito** stellt zentrale User Pools und App Clients bereit.
* **Endpoint Security:** **AWS Verified Permissions** fungiert als API Gateway Authorizer und erzwingt eine feingranulare Autorisierung auf Basis von **Cedar-Policies**, bevor Anfragen die Services überhaupt erreichen.
* **Application Security:** Spring Security validiert innerhalb der Java-Services die durch Cognito übergebenen Rollen (bzw. JWT-Claims), um Aktionen auf Ressourcen-Ebene (z.B. "Darf Nutzer X dieses spezifische Review sehen?") abzusichern.
* **Skalierung:** Das Autoscaling wird feingranular pro Service Stack über **ECS Service Auto Scaling** gesteuert (Definition von minimalen/maximalen Tasks und CPU-Target-Tracking).
* **Datenhaltung:** Jeder Service besitzt eine eigene **AWS DynamoDB-Tabelle**.
* **Orchestrierung:** Es existiert kein zentraler Orchestrator. Die Workflow-Steuerung erfolgt rein choreografisch über einen definierten Event-Ablauf via **AWS SQS** (Message Queues). Alle Backend-Services sind in Java mit Spring Boot implementiert.

---

## 3. Service-Struktur

### Core-Services
Die Services kommunizieren untereinander asynchron über SQS und bieten synchrone REST-Schnittstellen für das Frontend an.

1. **Creation Service:**
   * **Aufgabe:** Verantwortlich für die Erstellung von Reviews.
   * **Ablauf:** Empfängt REST-Requests, validiert die Eingaben (nur Autoren dürfen für sich selbst Reviews anlegen) und speichert diese. Nach erfolgreicher Erstellung sendet er ein Event an die SQS Queue des Matching Services.
2. **Matching Service:**
   * **Aufgabe:** Zuordnung von Reviewern zu den erstellten Reviews.
   * **Ablauf:** Empfängt SQS-Nachrichten des Creation Services und ordnet Reviews automatisch passenden Reviewern zu (basierend auf Kriterien wie Fachgebiet und Verfügbarkeit). Nach dem erfolgreichen Matching sendet er ein Event an den Submission Service.
3. **Submission Service:**
   * **Aufgabe:** Entgegennahme der eigentlichen wissenschaftlichen Arbeiten/Dokumente.
   * **Ablauf:** Der Service konsumiert die eingehende SQS-Nachricht des Matching Services *sofort* und speichert den
     Status "WAITING_FOR_SUBMISSION" in seiner eigenen DynamoDB. Er wartet persistent, bis der Autor das Dokument via
    Nach erfolgreicher Einreichung triggert er den Configuration Service via SQS.
4. **Configuration Service:**
   * **Aufgabe:** Konfiguriert und steuert den eigentlichen Gutachter-Prozess.
   * **Ablauf:** Empfängt die SQS-Nachricht des Submission Services. Nutzt interne Konfigurationen, um flexibel verschiedene Review-Verfahren abzubilden. Nach Abschluss der Begutachtung wird ein SQS-Event an den Response Service gesendet.
5. **Response Service:**
   * **Aufgabe:** Ablage und Kommunikation der Ergebnisse.
   * **Ablauf:** Konsumiert das Event des Configuration Services, speichert die finalen Review-Ergebnisse und stellt diese den Autoren über REST-Endpunkte bereit.

### Zusätzliche Services
* **Web UI (Frontend):** Ein Service, der über REST mit allen Core-Services kommuniziert, um Status und Daten zu aggregieren und darzustellen. Die Datenhoheit liegt bei den jeweiligen Backend-Services, das Frontend fungiert als reiner Konsument.
* **Analytics Service (Zukünftig / Non-MVP):** Aggregiert asynchron (via SQS) Daten aus allen Services, bereitet diese für statistische Analysen auf und stellt sie über REST-Endpunkte für das Prüfungsamt (Gesamtübersicht) bereit.

---

## 4. Rollen- und Berechtigungskonzept

Die Zugriffssteuerung ist strikt nach dem Least-Privilege-Prinzip implementiert.

| Rolle | Berechtigungen innerhalb der Services |
| :--- | :--- |
| **Admin** | Systemadministrator mit uneingeschränktem Vollzugriff auf alle Ressourcen und Endpunkte. |
| **ExaminationOfficer** <br>*(Prüfungsamt)* | **Matching Service:** Schreib-/Lesezugriff zur Prüferverwaltung (Anlegen, Bearbeiten, Löschen) sowie Lesezugriff auf zugewiesene Prüfer pro Abgabe.<br>**Analytics Service:** Voller Zugriff für statistische Auswertungen.<br>**Sonstige:** Kein Zugriff auf laufende Reviews, Abgaben oder Ergebnisse. |
| **Reviewer** <br>*(Gutachter)* | **Matching Service:** Lesezugriff, um zugewiesene Arbeiten zu sehen.<br>**Submission Service:** Lesezugriff auf zugewiesene Dokumente.<br>**Configuration Service:** Lese-/Schreibzugriff zur Durchführung der Begutachtung.<br>**Response Service:** Lesezugriff auf finale Ergebnisse.<br>**Sonstige:** Kein Zugriff auf Analytics oder Creation. |
| **Author** <br>*(Verfasser)* | **Creation Service:** Schreibzugriff zur Erstellung *eigener* Reviews.<br>**Matching Service:** Lesezugriff auf zugewiesene Prüfer (nur eigene Reviews).<br>**Submission Service:** Schreib-/Lesezugriff für *eigene* Abgaben.<br>**Configuration/Response Service:** Lesezugriff auf Status und Ergebnisse der *eigenen* Arbeiten. |
| **Teacher** <br>*(Dozent - Non-MVP)* | **Creation Service:** Schreibzugriff, um stellvertretend Abgaben für Studierende anzulegen.<br>Agiert im weiteren Verlauf automatisch in der Rolle des **Reviewers** für diese spezifischen Prüfungen. Daher muss er immer die Rolle **Reviewer** innehaben. |

---

## 5. CI/CD Pipeline (GitHub Actions)

Die Continuous Integration und Deployment (CI/CD) Pipelines sind vollständig über GitHub Actions automatisiert. Sie werden bei einem Push auf den `main`-Branch, bei Pull Requests oder manuell via `workflow_dispatch` gestartet.

### Voraussetzungen & Secrets
Für die Interaktion mit AWS müssen folgende Variablen und Secrets in GitHub hinterlegt sein:
* **Variable:** `AWS_REGION` (Zielregion für das Deployment)
* **Secret:** `AWS_ROLE_ARN` (OIDC-Rolle für den passwortlosen, sicheren AWS-Zugriff via `aws-actions/configure-aws-credentials`)

### Pfadabhängiges Pipeline-Verhalten
Die Pipeline reagiert gezielt auf Änderungen in spezifischen Unterverzeichnissen des Repositories:
* **`infrabaseline/`:** Änderungen triggern automatisierte Infrastruktur-Tests und ein `cdk diff`. Das tatsächliche Deployment in AWS erfolgt ausschließlich bei einem Push auf den `main`-Branch oder bei manueller Freigabe.
* **`infraLibrary/`:** Änderungen triggern die zugehörigen Unit- und Integrationstests der Core-Library, da diese direkte Auswirkungen auf die restliche Service-Infrastruktur haben können.
* **`templateEcsService/`:** Änderungen triggern die vollständige Anwendungs-Pipeline: Maven Build & Software-Tests, CDK-Infrastruktur-Tests, Docker Build & Push in das konfigurierte AWS ECR Repository sowie das optionale Deployment des ECS-Services.

### Manuelles Deployment
1. Navigiere im GitHub-Repository zum Reiter **Actions**.
2. Wähle den Workflow **CI** aus.
3. Klicke auf **Run workflow** (`workflow_dispatch`).
4. Das Deployment startet automatisch sequenziell für alle definierten CDK Stacks. Vor jeder Bereitstellung wird automatisch ein `cdk diff` ausgeführt und protokolliert.

---

## 6. Architekturentscheidungen & Trade-offs

Da es sich um ein universitäres Projekt mit einer überschaubaren Anzahl an Services (ca. 5-10) handelt, wurden folgende pragmatische Architekturentscheidungen getroffen:

1. **Client-Side Aggregation vs. BFF/CQRS:**
   Da jeder Service seine eigene Datenbank besitzt, muss die Web-UI die benötigten Daten für Übersichtstabellen durch parallele REST-Aufrufe an die jeweiligen Services aggregieren (Chatty Client). In großen Enterprise-Systemen würde dies zu signifikanten Latenzen (N+1 Problem) führen und den Einsatz eines Backend-for-Frontend (BFF) oder CQRS-Patterns (dedizierte Read-Models) erfordern. Für den Scope und die Skalierung dieses Projekts ist die clientseitige Aggregation jedoch ausreichend und reduziert die Komplexität der Infrastruktur massiv.
2. **Umgang mit langlaufenden Prozessen in SQS (Retention Limits):**
   AWS SQS hat eine maximale Message Retention Period von 14 Tagen. Da der Peer-Review-Prozess (z.B. die Zeit zwischen Matching und dem finalen Upload einer Hausarbeit im Submission Service) Wochen dauern kann, warten die Services *nicht* blockierend auf der Queue. Stattdessen konsumieren Services eingehende SQS-Nachrichten *sofort* und persistieren den aktuellen Zustand (z.B. "Wartet auf Dokument") in ihrer lokalen DynamoDB. Der Prozess wird erst durch einen expliziten REST-Call (Upload) fortgesetzt. Dadurch ist ein Nachrichtenverlust durch SQS-Timeouts bei langlaufenden, menschlichen Prozessen ausgeschlossen.
3. **Datenmodellierung in DynamoDB:**
   Anstelle eines komplexen relationalen Datenmodells nutzt jeder Service eine isolierte DynamoDB-Tabelle (Single Table Design). Abfragemuster, die über einfache Key-Value-Lookups hinausgehen (z. B. "Zeige dem Prüfungsamt alle offenen Reviews eines spezifischen Prüfers aus Fachgebiet X"), werden durch gezielt gesetzte **Global Secondary Indexes (GSIs)** auf den Tabellen gelöst. Dies ermöglicht die notwendigen performanten Abfragen, ohne die lose Kopplung und Datenhoheit der einzelnen Microservices aufzugeben.