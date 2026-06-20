#import "template.typ": statutory-declaration, thesis

#show: thesis.with(
  title: "MSA26-PeerReview-Gruppe-A",
  degree: "Moderne Softwarearchitektur",
  authors: (
    (name: "Matthias Matthies", id: "106971", email: "stud106971@fh-wedel.de"),
    (name: "Max Mustermann", id: "123456", email: "stud123456@fh-wedel.de"),
    (name: "Erika Musterfrau", id: "654321", email: "stud654321@fh-wedel.de"),
    (name: "John Doe", id: "987654", email: "stud987654@fh-wedel.de"),
  ),
  date: "17.07.2026",
  supervisor: (
    name: "Prof. Dr. Ulrich Hoffmann",
    institution: "Fachhochschule Wedel",
    street: "Feldstraße 143",
    zip: "22880",
    city: "Wedel",
    phone: "04103 - 8048 - 41",
    email: "urlic.hoffmann@fh-wedel.de",
  ),
)

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
  (name: "Max Mustermann"),
  (name: "Erika Musterfrau"),
  (name: "John Doe"),
))
