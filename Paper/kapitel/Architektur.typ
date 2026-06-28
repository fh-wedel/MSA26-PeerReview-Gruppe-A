= Architektur
Ein Kernpunkt dieser Ausarbeitung stellt die Architektur der Softwrae dar. Dabei wurden moderne Architektur patterns verwenden, um eine Ausfallsichere und Skallierbare Software zu entwickeln. Die verschiedene Archtekturmuster wurden auf allen Ebenen der Software berücksigitigt und angeandt. Beginnend bei der Klassifizierung der Software als Micro Service Architektur bis hin zu spzifischen modernen Protollen zur Kommunikation wie Server Side Events. Im Folgenden werden die verschiedenen Ebenen dargestellt und die Motivation sowie Einschräkungen die darudch entstanden sind werden beleuchtet.


== Übersicht
Die entwickelte Software implement eine Micro Service Architektur, bei der Domain-Spezifische Fachlichkeiten gekaspelt und in einen eigenen Service ausgelagert werden. Hierbei wurde zu beginn der gesamte Prozess eines Peer-Review begutachtet und Fachliche Schwerpunkt haben sich herausgebilted.

Insgesamt wurden acht Fachlichkeiten identifiziert, wobei Abbildung ... eine Übericht über alle Services sowie der Relationen zwischeneinander darstellt. Vier der Services bilden das Framework des tatsäclihen Reviews und vier weitere zusätzliche allgemeine oder technisch bedingte Domainen zusätzliche Services. Die Services des Frameworks umfassen: Configuration, Matching, Submission und Response Servcie. Die Architektur Erstenes wird im nachfolgenden Abschnitt Configuration Service (Link!) geneuaer erläutert Grundsätzlich besteht die Fachlichekit jedoch darin verschiedene Abage Typen sowie Review Formate bereit zu stellen und das Erstellen neuer Abgaben zu ermöglichen. Nach erfolgreichen anlegen einer Abgabe bildet der Matching Service ein passende Kombination zwischen Abgabe und Reviewer, wobei die Allgemeine verfügbarkeit und die Fahcgebiete berückstigit werden erstellt. Anschließend ist über den Submission Service eine Abgabe der Arbeit durch den Autor möglich. Dazu wird eine PDF hochgeladen. Abschließend nimmt der Response Service die Reviews durch die Reviewer entgegen und stellt nach abschluss aller die Reviews dem Autor zur verfügung.


#set figure.caption(position: bottom)

#figure(
  image("../bilder/Architecture High Level.drawio.pdf", width: 100%),
  caption: [Applikationsarchitektur],
) <fig:application-architecture>


Äuffällig ist, dass es keine Orchestrieden Service gibt, der Häufig bei Micro Service Architekturen zum einsatz kommt. Dies war durch die Eigenschften eines Peer-Review Möglich, denn diese haben immer einen festen Ablauf, wobei nach jedem Abgeschlossensn Schritt klar der nächste Schritt folgt. Die Einzlenen Services des Frameworks konnten so direkt mit dem nächsten über eine Asynchrone Queue kommunizieren.

Die zusätzlichen Services umfassen ein Communication, Notification, User und Web-Ui Service. Ersterer erlaubt die Kommunikation zwischen Usern über die Platform in form von Direkt Narchithten entweder als Direkt Chat mit einem User oder als Kommunikation über eine spezifische Abgabe, wobei hier mehr als zwei User beteiligt sein können. Diese Funtion berückstigti die Review Formate des Configuration Service, die zum Teil eine Kommunikation wie bei einem Double Blind verfahrne nicht erlauben. Der Notifaction Service hat die Verantwortlichekit, Nutzer zu Benarchitgen. Die Benarchitugnen werden von dem System aufgrudn von ereignissen in dem Review Prozess erzeugt und dem Nutzer angezeigt. Der User-Service bietet eine einheitliche Schnittstelle des User Managment und wird in Unterabschnitt User Service (Link!). Die Web-UI ist realisiert eine Client-Side API Aggregation indem sie alle Rest APIS der Services nutzt und gebündelt für den Nutzer darstellt.

Verwendete Technologien sind im Backend Java 25 mit dem Spring Boot Framework, sowie Ract mit Vite für das Frontend. Die Infrastruktur basiert vollständig auf AWS und wird in Unterabschnitt  Infra Architektur (Link!) beleuchtet. Durch die Implementierung als Microservice können jedoch auch belibige Technologien verwendet werden, sofern die Schnittstellen entsprechend kompatibel sind. Desweiteren stellen alle Backend Service vollstndige Funktionalitäten über eine Rest APi bereit. Hierfür werden jeweils OpenApi Spec Dateien bereitgestellt.

Die Backend Services lassen sich zudem als Basis-Service kategorisieren, denn diese haben möglichst kleine Fachlichkeitein und bilden einzeln keinen eigenständigen Prozess. Erst mit der zustandslosen Web-UI, die als Zusammengestzer Service kategorieisert, alle Backend Services kombiniert entsteht ein Prozess und die Software. Der Vorteil durch das Webseiteseitige Bündeln besteht darin, dass jederzeit eine neues Frontend entwickelt werden kann und, wenn notwendig und über die Rest APIs möglich, noch weitere oder weniger Details anzeigt. Die Web-UI wird so gut austauschbar, genauso wie alle anderen Service durch die Microservice Architektur und der Eigeschaft der Basis-Services.


== Infrastruktur Architektur
Die Architrktur basiert auf Containierisierten Deployments der einzelnen Microsrvies. Dazu wird die gesamte Bereitstellung der Compute und weiteren Services durch AWS realsiiert
// (Marcel)

== Datenbank Architekturen
// (Marcel)

== Configuration Service (Plugin Service)
// Luca

== Communikation / Notifaction -- SSE
// (Marcel)

== User Service (Cognito)
// (Marcel)

== Frontend
// Luca -- (Gideon)

== Sonstiges
// CI CD Integration (ggf. nur leicht Architketur anschneiden), IaC Integration, Native AWS Integration, Kosten Optimierung (Marcel)
