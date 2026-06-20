FROM ghcr.io/typst/typst:latest

USER root
# Schriften installieren und fontconfig nutzen
RUN apk add --no-cache ttf-liberation fontconfig

RUN fc-cache -f -v

USER typst
WORKDIR /data
COPY . .
CMD ["compile", "main.typ", "main.pdf"]