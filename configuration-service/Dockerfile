# ==========================================
# Stage 1: Build the application
# ==========================================
# syntax=docker/dockerfile:1.4
FROM maven:3.9-eclipse-temurin-25 AS builder
WORKDIR /app

# Docker builds are run from the repository root.
# Enable Docker BuildKit Maven caching and build from the aggregator POM.
COPY . .
RUN --mount=type=cache,target=/root/.m2 \
    mvn clean package -pl configuration-service/configuration-core,configuration-service/configuration-template-bachelor-thesis,configuration-service/configuration-template-group-work,configuration-service/configuration-template-individual-work,configuration-service/configuration-template-master-thesis,configuration-service/configuration-template-seminar,configuration-service/configuration-type-double-blind,configuration-service/configuration-type-open-review,configuration-service/configuration-type-single-blind -am -DskipTests

# ==========================================
# Stage 2: Create the lightweight runtime image
# ==========================================
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

ENV HOME=/home/spring
RUN addgroup -S spring && adduser -S spring -G spring

# Create the plugins directory
RUN mkdir -p /app/plugins

# The core executable jar (no plugin modules baked in)
COPY --from=builder /app/configuration-service/configuration-core/target/configuration-service.jar configuration-service.jar

# Copy each plugin JAR into /app/plugins/ as separate, externally-loaded JARs.
# These are discovered at runtime via ServiceLoader + URLClassLoader.
COPY --from=builder /app/configuration-service/configuration-type-open-review/target/configuration-type-open-review-*.jar /app/plugins/
COPY --from=builder /app/configuration-service/configuration-type-single-blind/target/configuration-type-single-blind-*.jar /app/plugins/
COPY --from=builder /app/configuration-service/configuration-type-double-blind/target/configuration-type-double-blind-*.jar /app/plugins/
COPY --from=builder /app/configuration-service/configuration-template-individual-work/target/configuration-template-individual-work-*.jar /app/plugins/
COPY --from=builder /app/configuration-service/configuration-template-group-work/target/configuration-template-group-work-*.jar /app/plugins/
COPY --from=builder /app/configuration-service/configuration-template-bachelor-thesis/target/configuration-template-bachelor-thesis-*.jar /app/plugins/
COPY --from=builder /app/configuration-service/configuration-template-master-thesis/target/configuration-template-master-thesis-*.jar /app/plugins/
COPY --from=builder /app/configuration-service/configuration-template-seminar/target/configuration-template-seminar-*.jar /app/plugins/

# Ensure spring user owns the plugins directory
RUN chown -R spring:spring /app/plugins

USER spring:spring

EXPOSE 8080
ENTRYPOINT ["java", "-Djava.net.preferIPv6Addresses=true", "-Djava.net.preferIPv4Stack=false", "-jar", "configuration-service.jar"]
