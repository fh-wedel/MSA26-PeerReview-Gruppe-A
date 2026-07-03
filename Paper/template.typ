// Core Typst template for Bachelor Thesis

#let code-block(body, title: none, start: 1) = {
  let lines = body.text.split("\n")
  if lines.last() == "" { lines = lines.slice(0, -1) }

  let number-col = lines
    .enumerate()
    .map(((i, _)) => {
      let num = i + start
      text(fill: rgb("888888"), font: "Liberation Sans", size: 8.5pt)[#num]
    })
    .join("\n")

  let code-col = body

  let content-box = block(
    width: 100%,
    stroke: (y: 0.5pt + rgb("cccccc")),
    fill: rgb("fafafa"),
    inset: (x: 10pt, y: 8pt),
    grid(
      columns: (auto, 1fr),
      gutter: 12pt,
      align(right)[#number-col], align(left)[#code-col],
    ),
  )

  if title != none {
    block(width: 100%, above: 1em, below: 1em)[
      #block(
        fill: rgb("eeeeee"),
        stroke: 0.5pt + rgb("cccccc"),
        inset: (x: 10pt, y: 6pt),
        radius: (top: 3pt, bottom: 0pt),
        width: 100%,
        text(size: 9pt, weight: "bold", font: "Liberation Sans")[#title],
      )
      #v(-1em)
      #block(
        stroke: (left: 0.5pt + rgb("cccccc"), right: 0.5pt + rgb("cccccc"), bottom: 0.5pt + rgb("cccccc")),
        fill: rgb("fafafa"),
        inset: (x: 10pt, y: 8pt),
        radius: (top: 0pt, bottom: 3pt),
        width: 100%,
        grid(
          columns: (auto, 1fr),
          gutter: 12pt,
          align(right)[#number-col], align(left)[#code-col],
        ),
      )
    ]
  } else {
    block(width: 100%, above: 1em, below: 1em, content-box)
  }
}

#let lst(body, caption: none, title: none, start: 1) = {
  let content = code-block(body, title: title, start: start)
  if caption != none { figure(content, caption: caption, kind: "raw", supplement: [Quelltext]) } else { content }
}

#let thesis(
  title: "",
  subtitle: "",
  degree: "Modularbeit",
  authors: (),
  date: "",
  department: "Department of Computer Science",
  logo: "bilder/fhw.pdf",
  supervisor: (name: "", institution: "", street: "", zip: "", city: "", phone: "", email: ""),
  body,
) = {
  set document(title: title, author: authors.map(a => a.name).join(", "))

  set page(paper: "a4", margin: (left: 3cm, right: 2cm, top: 2.0cm, bottom: 2.0cm), header: none, footer: none)

  align(center)[
    #if logo != none { image(logo, width: 50%) }
    #v(1.5em)
    #text(size: 14pt, font: "Liberation Sans", weight: "bold")[#smallcaps(department)]
    #v(3em)
    #text(size: 14pt, weight: "medium", font: "Liberation Sans")[#degree]
    #v(1.5em)
    #text(size: 18pt, weight: "bold", font: "Liberation Sans")[#title]
    #if subtitle != "" {
      v(0.8em)
      text(size: 14pt, font: "Liberation Sans")[#subtitle]
    }
    #v(2.5em)
    #text(size: 10pt)[Abgabedatum:] \
    #v(0.5em)
    #text(size: 12pt, weight: "medium")[#date]
  ]

  align(bottom + left)[
    #text(size: 10pt)[Eingereicht von:] \
    #v(0.5em)
    #grid(
      columns: (1fr, 1fr),
      column-gutter: 1em,
      row-gutter: 1.5em,
      ..authors.map(a => [
        #text(size: 12pt, weight: "bold", font: "Liberation Sans")[#a.name] \
        #text(size: 9pt)[Matr.-Nr.: #a.id] \
        #text(size: 9pt)[#a.email]
      ])
    )
    #v(2em)
    #grid(
      columns: (1fr, 1fr),
      gutter: 1.5cm,
      align(left)[
        #text(size: 10pt)[Betreut von:] \
        #v(0.5em)
        #text(size: 12pt, weight: "bold", font: "Liberation Sans")[#supervisor.name] \
        #text(
          size: 10pt,
        )[#supervisor.institution \ #supervisor.street \ #supervisor.zip #supervisor.city \ Tel: #supervisor.phone \ #supervisor.email]
      ],
    )
  ]

  pagebreak()
  set text(font: "New Computer Modern", size: 12pt, lang: "de")
  set par(justify: true, leading: 0.8em, spacing: 1.5em, first-line-indent: 0pt)

  show heading: it => {
    set text(font: "Liberation Sans", weight: "bold")
    let size = if it.level == 1 { 22pt } else if it.level == 2 { 16pt } else { 12pt }
    block(width: 100%, above: 2em, below: 1em, it)
  }

  show heading.where(level: 1): it => {
    pagebreak(weak: true)
    it
  }
  set heading(numbering: (..args) => { if args.pos().len() <= 3 { numbering("1.1", ..args) } })

  set page(margin: (inside: 2.5cm, outside: 2.0cm, top: 2.5cm, bottom: 2.5cm))

  body
}

#let statutory-declaration(authors) = {
  pagebreak()
  heading(level: 1, numbering: none, outlined: true)[Eigenständigkeitserklärung]
  v(1em)
  [I hereby declare ... ja was declaren wir denn?]
  v(5cm)
  grid(
    columns: (1fr, 1fr),
    gutter: 2cm,
    row-gutter: 3em,
    ..authors.map(a => [
      #line(length: 80%, stroke: 0.5pt + rgb("555555"))
      #v(0.5em)
      #text(size: 10pt, font: "Liberation Sans")[#a.name]
    ]),
  )
}
