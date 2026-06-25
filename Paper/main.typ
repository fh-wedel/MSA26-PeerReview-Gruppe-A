#import "template.typ": statutory-declaration, thesis

// Load the JSON data into a variable
#let metadata = json("metadata.json")
#show: thesis.with(..metadata)

// Roman numbering for front matter
#set page(numbering: "I")
#counter(page).update(1)

// Table of Contents
#outline(title: "Table of Content", indent: 1.5em)
#pagebreak()

// List of Figures
//#outline(title: "Abbildungsverzeichnis", target: figure.where(kind: image))
//#pagebreak()

// List of Tables
//#outline(title: "Tabellenverzeichnis", target: figure.where(kind: table))
//#pagebreak()

// List of Listings
//#outline(title: "Quelltextverzeichnis", target: figure.where(kind: "raw"))
//#pagebreak()

// Arabic numbering for main content
#set page(numbering: "1")
#counter(page).update(1)

// Include Chapters
// #include "kapitel/Abstract.typ"
#include "kapitel/Einleitung.typ"
#include "kapitel/Grundlagen.typ"
#include "kapitel/Hauptkapitel_1.typ"
#include "kapitel/Hauptkapitel_2.typ"
#include "kapitel/Zusammenfassung.typ"
#include "kapitel/Anhang.typ"

// Bibliography
#pagebreak()
#bibliography("sources.bib", style: "ieee", title: "Bibliography")


#statutory-declaration((
  (name: "Matthias Matthies"),
  (name: "Marcel Ossig"),
  (name: "Erika Musterfrau"),
  (name: "John Doe"),
))
