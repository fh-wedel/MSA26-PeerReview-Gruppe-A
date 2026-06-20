= Foundations of Logical Time (Todo: Write + Translate + Rewrite) <kap:foundations>

This chapter will contain a throughout explaination of Lamport's concepts published in the orignal paper, "Time, Clocks, and the Ordering of Events in a Distributed System" @lamport_time_1978. It will be split into three main topics, the partial ordering "happenes-before", logical clocks and state machine replication.

== Partial Ordering: Happenes-before (Todo: Translate + Rewrite) <kap:happenes-before>
The "happenes-before" relation is a relation to order an event a and an event b

Die happenes-before Relation definiert unabhängig der physischen Zeit eine Ordnung für das eintreten von events a und b in einem System. Definiert wird die Relation wie folgt:

+ Sind a und b events im gleichen System, und a tritt vor b ein, dann gilt a #sym.arrow.r b.
+ Wenn a das senden einer Nachricht von einem Prozess und b das empfangen der Nachricht in einem anderen Prozess ist, dann gilt a #sym.arrow.r b.
+ Wenn a #sym.arrow.r b und b #sym.arrow.r c, dann gilt auch a #sym.arrow.r c. Zwei unterschiedliche Events a und b treten zeitgleich ein, gdw. a #sym.arrow.r.not b und b #sym.arrow.r.not b.
Außerdem wird angenommen, für jedes Event a gilt a #sym.arrow.r.not a. Die relation happenes-before ist also eine irreflexive partial ordering on the set of all events in the system @lamport_time_1978[p. 559].

Zur Veranschaulichung führt Lamport die in @fig:space-time-diagram und @fig:space-time-diagram-logical-time zu findenen folgenden Grafiken ein. Das "Space-time diagram" @lamport_time_1978[p. 559], zeigt wie die Events in Verschiedener Prozesse oder Systeme zusammenhängen. @fig:space-time-diagram zeigt drei Prozesse ($P, Q$ und $R$) und deren Events ($p_1,..,p_4, q_1,.., q_7$ und $r_1, ..., r_4$). Die vertikalen geraden Linien repräsentieren einen zeitlichen Verlauf eines Prozess und die "wavy lines" repräsentieren das versenden von Nachrichten unter den Prozessen. Hierzu gilt $p_i #sym.arrow.r p_(i+1), q_i #sym.arrow.r q_(i+1)$ und $r_i #sym.arrow.r r_(i+1)$. Der rechte Teil der Abbildung zeigt die selben Prozesse und Events in einer entzerten, aufgeteilen Ansicht. Die semantik der Events und Messages bleibt hierbei unverändert, es ist nun aber einfacher zu erkennen, für welche Events zwischen den einzelnen Prozessen ein "happenes-before" gilt. Lamport erwähnt außerdem, dass die happenes-before Relation auch so verstanden werden kann, dass gilt: a #sym.arrow.r b #sym.arrow.r.double a can causally affect b. Andernfalls gelten die Events als concurrent.

#grid(
  // Creates 2 auto-sized columns
  columns: 2,
  // Space between images
  gutter: 1em,
  // Images
  [
    #figure(image("../bilder/fig_1.png", width: 100%), caption: figure.caption([Space time diagram], position: top)) <fig:space-time-diagram>
  ],
  [
    #figure(image("../bilder/fig_2.png", width: 100%), caption: figure.caption([Space time diagram with logical time], position: top)) <fig:space-time-diagram-logical-time>
  ],
),


== Logical Clocks (Todo: Write + Translate + Rewrite) <kap:logical-clocks>
Aufbauend auf der happenes-before Relation führt Lamport die Logical Clocks ein. Für jeden Prozess $P_i$ wird eine Clock $C_i$ als eine Funktion definiert, welche jedem Event $a$ einer Zahl zuordnet: $C_i chevron.l a chevron.r$. Außerdem werden alle Clocks als eine Funktion $C$ definiert, welche jedem Event $b$ die Nummer $C chevron.l b chevron.r = C_j chevron.l b chevron.r$ zuordnet, wenn $b$ ein Event in Prozess $P_j$ ist. Wichtig ist, dass diese Zahlen $C_i chevron.l a chevron.r$ in keinem Zusammenhang mit der physischen Zeit stehen, es ist eher eine abstrakte oder logische Zeiteinheit. Diese Zeiteinheiten können beispielsweise die "dotted lines" in @fig:space-time-diagram sein. Um nun die Korrektheit eines Systems aus clocks zu definieren wird die Clock Condition eingeführt. Diese besagt, dass für jedes event $a,b$ gilt: wenn $a arrow.r b$ dann $C chevron.l a chevron.r < C chevron.l b chevron.r$. The converse condition is not true, as @fig:space-time-diagram shows $p_2$ and $p_3$ are both concurrent with $q_3$, which would in turn mean they happen at the same time, but $p_2 arrow.r p_3$ contradicts the concurrency of $p_2$ and $p_3$.

If the following conditions hold:
+ If $a$ and $b$ are events in process $P_i$ and $a$ comes before $b$, then $C_i chevron.l a chevron.r < C_i chevron.l b chevron.r$
+ If $a$ is the sending of a message by process $P_i$ and $b$ is the receipt of that message by process $P_j$, then $C_i chevron.l a chevron.r < C_j chevron.l a chevron.r$
the clock condition is satisfied @lamport_time_1978[p. 560].

== State Machine Replication & Consensus (Todo: Write + Translate + Rewrite <kap:state-machine-replication>
