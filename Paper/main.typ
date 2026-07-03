#import "template.typ": statutory-declaration, thesis

// Load the JSON data into a variable
#let metadata = json("metadata.json")
#show: thesis.with(..metadata)
#set par(justify: true)

#import "@preview/glossarium:0.5.10": gls, glspl, make-glossary, print-glossary, register-glossary
#import "abkuerzungen.typ": acronyms
#show: make-glossary
#register-glossary(acronyms)

// Roman numbering for front matter
#set page(numbering: "I")
#counter(page).update(1)

// Table of Contents
#outline(title: "Inhaltsverzeichnis", indent: 1.5em)
#pagebreak()

// List of Abbreviations
#heading(level: 1, numbering: none)[Abkürzungsverzeichnis]
#print-glossary(acronyms, show-all: true)
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
#include "kapitel/Features.typ"
#include "kapitel/Architektur.typ"
#include "kapitel/Umsetzung.typ"
#include "kapitel/Kritik.typ"
#include "kapitel/Zusammenfassung.typ"
#include "kapitel/Anhang.typ"

// Bibliography
#pagebreak()
#bibliography("sources.bib", style: "ieee", title: "Literaturverzeichnis")


#statutory-declaration((
  (name: "Matthias Matthies"),
  (name: "Marcel Ossig"),
  (name: "Erika Musterfrau"),
  (name: "John Doe"),
))
