# Makefile mit Docker-Integration

.PHONY: default build clean

default: build

build:
	docker build -t typst-projekt .
	docker run --rm -v "$(pwd):/data" typst-projekt

clean:
	rm -f main.pdf