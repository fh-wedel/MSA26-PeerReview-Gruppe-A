# Typst Paper Makefile

.PHONY: default build watch clean

default: build

# Einmalige Kompilierung von Paper/main.typ zu Paper/main.pdf
build:
	typst compile main.typ main.pdf

# Watch-Modus: Überwacht alle Dateien und kompiliert bei Änderungen automatisch neu
watch:
	typst watch main.typ main.pdf

# Bereinigung der generierten PDF-Datei
clean:
	rm -f main.pdf