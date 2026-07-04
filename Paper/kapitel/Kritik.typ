= Kritik und Einordnung des Vibecoding

// ("Agentic Engineering") -- Inklusive Wissenschaflticher Teil (Matthias -- Alle anderne Stichpunkte erstellen lassne)





== Was lief gut
Marcel Notitzen:
- Mono Repo dadurch gutes Kontext Wissen zumidest Möglich (Ob es auch immer geklappt hat sei dahin gestellt und war auch teuerer dadruch)
- Sehr schnelles Entwickeln -- Aber siehe nachteil -- Sehr sehr sehr frustriernd
- ich glaube das Forntend ging gut
- An sich für normale Fragen sehr sher hlfreic und auch wenn man das xte mal das gleich macht. Aber das machen dann ja keine Agenten. Im Hinblick auf agenten eher negativ: Man hat kein plan was da raus kommt, wie das geht und man hat UNFASSBAR hohe Abhägigkeit/Vendor Lock in - Wenn die Preise stiegen dann hat man verloren

Matthias:
- Alle uns bekannten Fehler konnten mehr oder weniger von KI behoben werden.
- Auch ohne jedliche AWS / Spring Erfahrung konnte ich features shippen x)
- Meine Einordnung: Für PoC oder so vllt. möglich. Aber dann darf es auch keine komplexe Software sein, die umgesetzt werden muss.

== Was lief eher schlecht
Marcel Notitzen:
- Sehr frustierend: Keiner weiß wie die Appliaktion geht, man promopted ein fehler in die ki, wartet und hofft einfach nur das es passt. man hat überhaupt keine ahnugn ob ein fix funktionieriert oder auch nicht
- Der Agent macht zum teil sehr sehr viel nur halb. Mal verhisst er die Test anzupassne, mal lässt sich das projekt gar nicht compilieren, wei das Imports fehlen etc. Selbst beim Propmt: Fixe comiler fehler und tests, hat er zwar änderungen geacmht aber es hat nicht funktioniert neue/andere fehler
- GitHub Reviwer: einmal hat er vorschläge gemacht, die wir angewadnt haben und dann hat alles nicth mehr funktioneirt --> Schlechtes review wenn der funktionaliät danach nicht mehr geht

Matthias:
- Gehirn schaltet komplett ab und man wartet nur dass die KI "macht".
- Da man nur auf die Ergebnisse des Agenten wartet, absolut langweilig.
- Viele Dinge, die nicht komplex ausspezifiziert wurden, oder der Agent nicht im kontext hatte, obwohl diese durch andere microservices gesetzt waren, wurden falsch implementiert / angenommen.
- Kleine Fehler, die dazu führen dass die Software nicht funktioniert. Nur weiß ich als Anwender nun nicht mehr warum, woran es scheitert.
- Kosten sind astronomisch. Die Tokenkosten für ein einzigen "run" eines Agenten für einen Microservice haben das initiale Budget von ca. 50€ zu mehr als 50% eingenommen.
- Gelernt habe ich jetzt nicht wirklich etwas.

Luca:
- Die Landschaft an KI-Tools zur Entwicklung ist hochgradig verwirrend und trägt zur Frustration bei. Es gibt unzählige Agentensysteme, welche den gleichen Zweck erfüllen: Claude Code, Codex, Antigravity, GitHub Copilot, Cursor, OpenCode ... alle jeweils als CLI- und Dekstop-Variante. Jedes Tool ist etwas anders zu bedienen und zu konfigurieren. Alle paar Wochen gibt es etwas neues. Oftmals gibt es dazu noch Abonnements, die zur aktiven Verwendung der Tools abzuschließen sind.

== Herrausforderungen

== Zukunfts-"Ausrichtung"
// Aublick über KI
