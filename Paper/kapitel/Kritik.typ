= Kritik und Einordnung des Vibecoding
Unter dem Begriff des „Vibe Coding“ beschreibt Andrej Karpathy im Februar 2025 eine neue Entwicklungsphilosophie, bei der das manuelle Code schreiben nahezu vollständig durch die Interaktion mit agentischen, auf großen Sprachmodellen basierenden Werkzeugen wie Antigravity oder Claude Code ersetzt wird @ibm_vibecoding_2026.

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
- Wir haben mit über 80 % eine relativ hohe Testabdeckung. Das ist super, aber ich kann kaum etwas über die Implementierung und erst recht nicht den Tests sagen. Inwiefern die Anwendung tatsächlich getestet ist, weiß ich nicht.

== Herausforderungen
Die wirtschaftliche Nutzung des Vibe Codings wird oft mit einer drastischen Beschleunigung der Entwicklungszyklen begründet. Der finanzielle Aufwand für den Einsatz von Werkzeugen wie Claude Code hat sich von den ursprünglichen Lizenzgebühren einfacher Abonnements (20 US-Dollar pro Monat) hin zu erheblichen Token-Kosten entwickelt. Kosten für Teams die KI-Werkzeuge nutzen, liegen heute eher zwischen 200 und teils mehr als 2.000 US-Dollar pro Entwickler und Monat @kanitkar_developer_2026. In Einzelfällen gibt es bereits berichte von Mitarbeitern, die über 1,4 Millionen US-Dollar pro Monat verbrauchten @munis_meta_2026. Diese Investitionen führen durchaus zu einer höheren Anzahl an geschriebenen Zeilen Quellcode, doch sagt diese Metrik nichts über den tatsächlichen Nutzen aus. "Anybody who this that's a valid metric is too stupid to work at a tech company." - Linus Torvalds (über Zeilen von Code als KPI) @torvalds_linustechtips_2026.

Eine der umfangreichsten empirischen Untersuchungen zu diesem Phänomen ist die Langzeitstudie des Analyseunternehmens GitClear, die über einen Zeitraum von fünf Jahren die strukturellen Veränderungen von 211 Millionen Zeilen Quellcode aus Repositories führender Technologiekonzerne wie Google, Microsoft und Meta sowie globaler Großkonzerne auswertete. Die Ergebnisse zeigen eine Beschleunigung in qualitativer Degradierung moderner Codebasen @gitclear_ai_2025 @harding_gitclear_2025.

Der wohl folgenschwerste negative Effekt des Vibe Codings betrifft nicht die technische Beschaffenheit des Codes selbst, sondern die intellektuelle Kapazität des Entwicklerteams. Während technische Schulden ein im Code verankertes Phänomen beschreiben, das durch Refactoring behoben werden kann, entsteht durch den massiven Einsatz generativer Werkzeuge eine kognitive Verschuldung (Cognitive Debt). Diese beschreibt den fortschreitenden Verlust des Systemverständnisses, der sogenannten „Theorie des Systems“ @storey_cognitive_2026. Eine viermonatige Studie des MIT Media Lab, die im August 2025 veröffentlicht wurde, konnte unter einsatz von Elektroenzephalografie (EEG) verschiedenste negative Effekte des Einsatz von generativer KI nachweisen @kosmyna_brain_2025. So zeigten Nutzer, die intesiv auf LLM-Unterstützung zurückgriffen die schwächste neuronale Konnektivität und die geringste Gehirnaktivität. Als die KI-Unterstützung entzogen wurde und die Probanden Aufgaben wieder eigenständig lösen mussten, zeigten sie eine signifikant reduzierte Alpha- und Beta-Konnektivität. Dieser Zustand der neuronalen Unteraktivierung (Neural Under-Engagement) belegt, dass das Gehirn nach längerer KI-Nutzung massive Schwierigkeiten hat, sich wieder eigenständig und tiefgehend auf komplexe kognitive Prozesse einzustellen.

== Zukunfts-"Ausrichtung"
// Aublick über KI
