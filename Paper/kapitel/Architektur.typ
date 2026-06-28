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
Die Architrktur basiert auf Containierisierten Deployments der einzelnen Microsrvies. Dazu wird die gesamte Bereitstellung der Compute und weiteren Services durch AWS realsiiert. Ein wichtes Kriterium der gesasmten Infrastrukturen Architektur ist die sehr starke Kosteneffizien, wodruch ausschließlich modernen Serverless Komponenten verwendet werden. Zudem wurde auf High Avaiblibily verzichetet, wodurch auch erhöhte Kosten entstehen würden. Die Möglichkeit besteht jedoch High Avaiblability umzusetzen.

Abbildung .... gibt einen Überblick über die verwendeten Servis in der AWS Cloud, die folgend näher beschrieben werden.
#set figure.caption(position: bottom)

#figure(
  image("../bilder/Infra Architecture High Level-AWS.drawio.pdf", width: 100%),
  caption: [Applikationsarchitektur],
) <fig:application-architecture>

=== Compute
Die Basis für die Compute Bereitstellung wird durch AWS Elastic Container Services (ECS) realisiert, wobei hierbei auf die AWS Managed Serverless Version Fargate zurück gegriffen wird. AWS ECS Fargate erlaubt das einfache provisionieren von Compute Runtimes für Docker Images, wobei die Docker Images in der Elastic Container Registry (ECR) hinterlget sind.

Die Ausfallsicherheit der Services ist hoch und kann durch das vertikale Skallieren weiter erhöht werden. Um Lastspitzen abzufangen wird ein Autoscaler verwendet, der mittels Target Tracking Policy versucht die CPU Auslastung bei 75% zu halten, bei höher nutzung wird Vertikal Skalliert und bei geringerer Nutung wieder runterskalliert. Auch das kontinuerliche Ausrollen neuer Software Versionen wird durch AWS ECS Farget bestens unterstützte, wobei es die Möglicheiten des Blue/Green Deployments, Canary Deployments oder dem Rolling Deployment besteht, wobei neue Servceis erst parallel gesratte werden und erst nachdem sie verfügbar sind auch von dem Nutzer verwendet werden können.

Um weiter Kosten zu sparen basieren alle ECS Services als CPU Architektur auf ARM64, die kostengünstiger ist. Zudem werden sogennate Spot Instanzen verwendet, die stark reduziert sind, jedoch nicht so stabil. Für das aktuelle Projekt, ideal, denn kurze Downtimes sind akzeptierbar und zusätzlich sorgt das Autscalling dafür das neue Instanzen anch gestartet werden. Für den weiteren Betrieb könnte zusätzlich eine Multi Avalibilty Zone Strategie verwendet werden, sodass bei einzelnen Ausfällen von Rechenzentraen keine Auswirkungen in der Appliaktion spürbar ist. Dies würde jedoch erhöhte Kosten erzeugeund und wurde daher nicht berücksitgt.

Da jede Instanz die kleinst Mögliche Konfiguration mit 0.256 vCpus und 512MB ram konfigurert sind belaufen sich unter der anahme das kein Autoscaling stattfidnet und durchgehd nur eine Instanz läuf, die reinene Compute Kosten auf 0,078192€ Pro Tag, sodass eine Summe von 0,625536€, was eine sehr effizienten Compute Infrastruktur erfüllt.

Die Compute Instanzen kommunizieren größtenteils entkoppelt voneinander durch Asynchrone Queues die durch den AWS Simple Queuing Service (SQS) bereit gestellt werden. Hierbei wurde das prinzip des Datawoners verfolgt, sodass jeder Service seine eigene Queue als Einagbe Queue bereitstellt und andere Services auf die Einagbe Queues andere servies schriebt.

Einige direkte Kommunikationen sind Aufgrund der Fachlichkeit notwendig gewesen, welche direkt ber REst realsiert wurden. DAbei nutzen die Servcies interen DNS Namen die im folgende nNetzwerk Abschnitt (link) beschriebn werden.

=== Netwerk
Netzwerkseitig wird die Software in ein Virtuell Private Network (VPC) größtentiels in ein sicheres privates Subnetzwerk installiert. Dabei ist das Netzwerk ein wichtiger Aspekt der Kosteneffizienz stellen passive Kosten dar, welche in der AWS Infrastruktur sehr schnell im Bereich Netzwerk entstehen.

Die Software wird in einem privaten Subnetz Deployed, wodruch eine Sicherheit entsteht da die Instanzen aus dem Öffentlichen Internet nicht Routbar sind. Gleichezit bedeuted es, dass keine Verbnung möglich ist und die Instanzen auch selber nicht nach außen kommunieziren können um zum Beispiel das Image von ECR zu beziehen. Nicht so stark Kostenoptimierte Lösungen würden ein Network Adress Translation (NAT) Gateway installieren, welches von AWS geamaneged wird und die Instanzen so die Verbindung ins Internet und insbesondere das zurück Routen der Antworten ermöglicht. Ein NAT Gateway ist jedoch Kostspilig und hat passive Kosten von ~50€ pro Monat, wobei Traffic Kosten zu addieren sind. Eine alterntive ist es jede Instanz mit einer Öffetnlichen routbaren IPv4 auszustallen. Diese kosten pro IPv4 jedoch auch 3,50€ pro IPv4 Adresse, sodass sich bei 8 Services ebenfalls etwa 30 pro Monat ergeben.

Die Lösung für das Problem besteht in einem reinen IPv6 Netzwerk, wobei es die von AWS die Möglichkeit gibt ein kostenfreies Egress Only Gateway anzuschließen. Somit können die ECS Instanzen nach außen selbständig kommunizieren um Abhägikeiten und zum Beispiel das ECR Image herutnerladen. Auch wenn AWS ein Dualstack Subnetz anbietet, sodass gleichzeitg IPv4 und IPv6 nutzen können war es für den Anwendungsfall nicht möglich, denn dann versuchen die ECS Maschienen das ECR Image über IPv4 zu beziehen, was aufgrudn einer Fehlen Netzwerkstreck über IPv4 mit fehlendem NAT Gateway oder fehlend Public IPv4 nicht möglich war. Die Einzige lösung ist ein reines IPv6 Subnetz, wodurch jedoch Hürden bei eingehenden Verbindungen entstadt.

Denn die Anfragen von außen müssen zu den ECS Instanzen herinkommen, am besten nicht über eine IPv6 Adresse sondern über eine IPv4 oder noch besser über eine DNS. Hierzu wird AWS API Gateway verwendet, wodruch eine Bereitstellung einer Öffetnlich Verfügbaren DNS enthesteht die keine passiven Kosten erzeugt. Problematisch ist jedoch das API Gateway als Ziel keine ECS Instanz im IPv6 Netzwerk haben kann sondern nur solche Ziele die eine IPv4 Adresse haben. Als Lösung wurden Lambda Funktionen, die als Proxy dienen entwickelt, welche in einem zweiten Subentzwerk, welches sowohl IPv4 als auch IPv6 fähig ist installiert. Somit konnten die Anfragen über das API Gateway an die Lambda Proxy hin zu den eigentlichen Zielen der ECS Services erriceht werden. Die Lambdas können im Gegensatz zu den ECS maschienne in einem Daulstack Subnetz liegen., weil sie kein ECR Image beziehen müssen und somit keine IPv4 Netzwerkstrekce brauchen außer die zum API Gateway, die verfügbar ist.

Dafür war es jedoch notwendig, dass die Lambda Proxies die Adressen der ECS Services kennen, die nicht stabil undrein IPv6 basiert sind. Daher wurde auch hier als Lösung ein AWS Service mit CloudMap verwendet. Dieser Service dient als interne DNS, wobei sich alle ECS Services vollautoamtisch nach dem Start bei CloudMap regirsterien, sodass die Lamdba Proxies anschließend über CloduMapp und einem Internen DNS namen die IPv6 Adresse des Ziel erhalten, sodass schlussendlich das weiterleiten des Requetss ermöglicht wird.

Durch die Entscheidungen des Lambda Proxies kann es zeitweise zu langsaen Antweortzeiten führen, weil die Lamdbas durch den kaltstart einige Sekunden benötigen um eine Anfrage weiter zu leiten. Als Kostenintesive Lösung können die Lambda Funktionen bereits instazieriert vorgehalten werden, worduch die Antweortzeiten deutlich besser geworden sind. Die Lamdbas werden jedoch nicht kosntant sondern nur zu Demo und Testzwecken vorgehalten. Als Alternative würde man nicht einen Lamdba Proy als API Gateway Ziel sondern einen echten Appliaktion Load Balancer installeiren, welcher eine IPv4 Adresse bereitstellen würde und nicht nur die Request zu einer ECS Maschinen weiter leitet sodnern auch den Verkehr über mehrere Insatnzen basierend auf Metriken verteilen kann. Die passiven Kosten eines Appliaktion Load Balncer belfauen sich jedoch auf etwa 16€ pro Monat pro Load Balancer, wodurch etwa 130€ bei acht Services entstehen würde, was mit dem Projekt nicht vereinabr war. Es ist jedoch zu erwarten das die Antwrotzeit deutlich besser wäre.

Ein zweite Lambda Proxy wurde zwischen dem Response Servce und AWS Bedrock installiert, weil Bedrock aktuell nicht IPv6 fähig ist. Durch die Nutzung des Proxies wurde das Problem jedoch gelöst.

Als letzen Service im Bereich des Netwzerks wird AWS CloudFront verwednt. Dieser Service elraubt es Global verteilt eine geringe Latenz der Services zu beiten, indem immer auf die nächstgelgenen Services zugririffen wird und eine Möglicheti des Caching an erster Stelle anbeitet. Zudem wurde durch CloudFront eine eigene Domain 'fh-wedel.dev' installiert, sodass die Sofwtare nicht hinter einer nicht stabilen DNS den API Gateways verfügbar ist, sondern über ein durchgehend feste DNS nach außen. Mittels AWS Route53 werden DNS einträge erstelllt, sodass die Anfragen für 'fh-wedel.dev' den Endpunkt des API Gateways auflösen lassen.

=== Datenbank Architekturen
Auch die Datenbanken sind auf Kosten effizienz optimiert, sodass eine echte Serverless Datenbank verwendet werden musste. Zusätzlich haben die Daten keine Notwendigkeit eines Relationalen Modells gebilted, sodass eine Key-Value Datenbank in form von AWS DynamoBB, die keine passiven Kosten hat, als passend gewählt wurde.

Es wurde dabei darauf geachtet, dass jeder Service eine eigene Datenbank erhält, sofern dieser Daten persitieren muss. Dadruch wird eine starke kopplung vermieden und die Unabögigeit einzelner Servcies bleibt bestehen.

Bei den Datenmodellen wurde strikt ein modernes Single Table Design angewadnt, wodurch sehr effizient alle Daten in einem Service zu einer Abgabe mit einer Queriy erfrgat werden konnte. Es sind keine Joins über mehrere Tabellen notwendig noch müssen mehrere Queirs an verschiedene Tabellen gesendet werden.

Auch die Datenhaltung der Services ist soweti beschränkt das jeder Service nur die Daten spiechert, welche in den Busines sKontext passend sind. Dadruch wird verhidnert das ein Datum in mehreren Tabellen überere Mhere Servies verteil liegt wodurch bei Ädnerungen mögliche Inkosittenzen entehsen könenn. Stattdessen müssen die Servcies ggf. die Daten bei anderen Services, welche die Data Owner über Rest sind erfragen. Die Datenhoheit wird dadurch bestmöglich gewahrt.

=== User Managment
Neben den Services zum Netzwerk, Compute und den Datenbanken wurde AWS Cognito und Aws Verfieid Permissions (AVP) verwednet. Cognito bietet einen AWS Managed User Management, sodass viele Aufagben wie das beretistellen einer Login-Seite, das Managend von Anmeldedaten und Session Tokens vollstädig durch AWS übernommen wird. Dies ist in der Modernen Software Entwicklung vom großen Vorteil um sich auf die Kernkompetenz eines Unternehmens zu fokusieren um Business Wert zu schaffen. Zusätzlich erlaubt Cognito das Managen von Gruppen, sodass eine Role Based Acess Controll (RBAC) möglich wird.

Um die API Gateway Endpunkte abzusichern wird AVP verwednet, welches über eine Lambda Funktion eine native Integration erlaubt. AVP definiert dabei die Policies, welche Zugriffe auf Endpunkte erlauben, sodass bestimme User Gruppen aus Cognito nur auf bestimmte API Gateway Endpunkte zugreifen dürfen. Die tatsächliche anwendung dieser Regekn wird durch eine Lamdba Funktion realsieirt, welhe direkt vom API Gateway für jeden Requets aufgrufen wird. Die Lambda verküpft anschließend die AVP Regeln mit den Cogntio Gruppen den der USer angehörig ist und dem Endpunkt über API Gatewy und entscheided ob der Zugriff zulässig ist oder nicht.

Die Lösung erzeugt keine PAssiven kosten und das Mangen der SUer sowie der AVP Policies ist sehr kostengünstig. Lediglich der Nachteil das die Requests über eine Lamdba, die wieder ein langsames Kaltstart Verhalten von einigen Sekunden haben kann ist zu nennen. Jeodch kann auch hier durch vorprovisionierte Instanzen die Antwortzeit reduzeirt werde, was sich beosnders bemerbar macht wenn die Proxy Lambda ebenfalls vorprovisioenirt ist, denn dann kann der Vorteil doppelt genutzt werden.

Weitere Sicherheitsmechanismen finden nur noch in der Appliaktio selber statt um Zum Beispiel basierend auf den zu lesenden/ändernden Daten zu entscheiden ob der Nutzer erlaubt ist oder nicht. Hierfür wird Spring Security verwendet, wobei auch heir die Usernamen und Rollen Mappings aus AWS Cognito die Vertraute Authetifizeirte Wahrheit darstellen.


== Configuration Service (Plugin Service)
// Luca

== Serversite Events im Communication und Notification Service
Eine Architturelle Besonderheit in dem Communicatin und dem Notifaction Service ist die Verwendung von Server Side Events. Diese erlauben es eine Unidirektionale Verbidnugn von Server zu Client zu etablieren, wodruch der Server Live Updates und Benachritguen schicken kann. Sie bieten Vorteile gegenüber Websocket Verbidngen die Bi-Direktional und in der regel komplexer sind. Auch gegenüber dem Ansatz des Clientseitigen Pollings bietet es den Vorteil, dass die Updates echt Live sind und nicht zeitvesetzt und keine ständige neuverbindugn stattfidnen muss.

Die verwendung der Technologie hat sich als sehr zuverlässig und vorteilhaft für die Anwednugen in Chats und Notifications gezgti. Es gibt jedoch eine starke Einschräöung aufgrund der verwendeten Infrastruktur, insbeosndere des API Gatewys. Denn dieses erlaubt eine maximale Verbidnungszeit von 29 Sekunden. Dies ist nicht tragbar für eine durchgehend haltende Verbindung von Server zum Client.

Daher utnerbricht der Server nach 25 Skunden die Verbindunge von sich aus. Aufgrund der Selbstheilenden Eigenscaftt von Serverside Events erkennt der Client sofort einen Verbinsungsabruch und verbindet sich neu mit dem Server, sodass die SSE Verbindung etabliert wird.

== Frontend
// Luca -- (Gideon)

== DevOps und Infrastructure as Code
Neben der Applikations und der Infrastrukturellen INfrastruktur gehört zur Modernen Sofwtare Architektur und dem Entwicklungszyklus DevOps Praktiken, die das durchgehdne Testen, Bauen und Deplyoen ermöglichen. Die Architektur der Pipline ist modular und ermölicht es leicht neue Services zu integrieren. In Abschnitt CI / CD Integration aus Kapitel Umsetzung und Workflow (Links!!) wird der Zyklus detailleirt beschrieben

Damit das Deployment in die AWS vollautomatiersert möglich ist, wird Infrastrucre as Code (IaC) benötigt, welches es erlaubt die Infrastruktur durch Code zu beschrieben, der in der Pipeline ausgeführt werden kann und anschließend die Infrastrukturressouen erstellt/updatet. Hierbei wurde das von AWS veröffentlichte Cloud Development Kit (CDK) verwendet. Die verwendete Programmiersprache ist Typescript.

Die IaC Kompontentne nutzen auf eben der Programmeirsprache eine entwicklete InfraLibrary, welche alle Standard Funktionalitäten, wie das in diesem Fall komplexe deplyoen eines ECS Service mit Lambda Proxy, API Gateway Eintrag und Integration in AVP durch wenige Zeilen Code standatiesiert hat. Es uwrde möglich dass alle Services auf den gelichen Infrastrukturellen Sturktuen basiert, was eine Konsitenz geboten hat und die Fehersucher sehr stark erlaeichtert hat. Auch Änderungen an allen Service auf der Infrasturturellen Ebene wurden serh einfach möglich.

Neben der InfraLibrary gibt es das InfraBaseline Projekt welche eine Infrastrukturelle Basislinie erstellt, welche das Netwerk, den AWS Cognito Userpool, die CloudMap konfiguration sowie die CloudFront einrichtung umfasst.

Im Projekt hat sich häufig ein sehr großer Vorteil des IaC gezeigt, um zum Beispiel Features direkt auszuprobieren und gleichezitg immer wieder zu ältern Versionen zurückrollen zu können, wobei die Infrasturkur und der Appliaktionscode immer zueinder passten. Insbeosndere hat sich die Verwendung als vorteilhaft gezeigt, als der erste AWS Account aufgrund eines ausgelaufenen Leases gesprerrt wurde. Durch IaC konnten alle Resosurce nahe zu ohne Anpassungen direkt in den neuen Account Deployed werden. Ohne IaC wäre eine manuelle stundenlange und fehleranfällige manuelle neusrstellung aller Ressourcen notwendig gewesen.
