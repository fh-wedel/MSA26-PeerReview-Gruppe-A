# Offizielles Typst-Image nutzen
FROM typst/typst:latest

# Arbeitsverzeichnis im Container festlegen
WORKDIR /data

# Kopiere die Quelldateien in den Container
COPY . .

# Standardbefehl: Kompiliert das Dokument beim Starten des Containers
CMD ["compile", "main.typ", "main.pdf"]