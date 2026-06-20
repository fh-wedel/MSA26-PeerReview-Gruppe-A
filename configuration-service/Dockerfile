# ==========================================
# Stage 1: Build the application
# ==========================================
FROM maven:3.9-eclipse-temurin-25 AS builder
WORKDIR /app

# Docker builds are run from the repository root,
# so we copy the files using the module directory prefix.
COPY configuration-service/pom.xml configuration-service/
COPY configuration-service/configuration-api/pom.xml configuration-service/configuration-api/
COPY configuration-service/configuration-core/pom.xml configuration-service/configuration-core/
COPY configuration-service/configuration-template-bachelor-thesis/pom.xml configuration-service/configuration-template-bachelor-thesis/
COPY configuration-service/configuration-template-group-work/pom.xml configuration-service/configuration-template-group-work/
COPY configuration-service/configuration-template-individual-work/pom.xml configuration-service/configuration-template-individual-work/
COPY configuration-service/configuration-type-double-blind/pom.xml configuration-service/configuration-type-double-blind/
COPY configuration-service/configuration-type-open-review/pom.xml configuration-service/configuration-type-open-review/
COPY configuration-service/configuration-type-single-blind/pom.xml configuration-service/configuration-type-single-blind/

WORKDIR /app/configuration-service
RUN mvn dependency:go-offline -B

# Copy all source directories
COPY configuration-service/configuration-api/src ./configuration-api/src
COPY configuration-service/configuration-core/src ./configuration-core/src
COPY configuration-service/configuration-template-bachelor-thesis/src ./configuration-template-bachelor-thesis/src
COPY configuration-service/configuration-template-group-work/src ./configuration-template-group-work/src
COPY configuration-service/configuration-template-individual-work/src ./configuration-template-individual-work/src
COPY configuration-service/configuration-type-double-blind/src ./configuration-type-double-blind/src
COPY configuration-service/configuration-type-open-review/src ./configuration-type-open-review/src
COPY configuration-service/configuration-type-single-blind/src ./configuration-type-single-blind/src

RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Create the lightweight runtime image
# ==========================================
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

ENV HOME=/home/spring
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# The final executable jar is built in the configuration-core module
COPY --from=builder /app/configuration-service/configuration-core/target/configuration-service.jar configuration-service.jar

EXPOSE 8080
ENTRYPOINT ["java", "-Djava.net.preferIPv6Addresses=true", "-Djava.net.preferIPv4Stack=false", "-jar", "configuration-service.jar"]
