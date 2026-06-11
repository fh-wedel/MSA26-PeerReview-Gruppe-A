# ==========================================
# Stage 1: Build all modules
# ==========================================
FROM maven:3.9-eclipse-temurin-25 AS builder
WORKDIR /app

# Copy all POMs for dependency caching
COPY pom.xml .
COPY workflow-api/pom.xml workflow-api/
COPY workflow-plugin-double-blind/pom.xml workflow-plugin-double-blind/
COPY workflow-plugin-single-blind/pom.xml workflow-plugin-single-blind/
COPY workflow-plugin-open-review/pom.xml workflow-plugin-open-review/
COPY workflow-core/pom.xml workflow-core/

RUN mvn dependency:go-offline -B

# Copy all source code and build
COPY workflow-api/src workflow-api/src
COPY workflow-plugin-double-blind/src workflow-plugin-double-blind/src
COPY workflow-plugin-single-blind/src workflow-plugin-single-blind/src
COPY workflow-plugin-open-review/src workflow-plugin-open-review/src
COPY workflow-core/src workflow-core/src

RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Create the lightweight runtime image
# ==========================================
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

ENV HOME=/home/spring
RUN addgroup -S spring && adduser -S spring -G spring

# Copy core app JAR (Spring Boot fat JAR with ZIP/PropertiesLauncher layout)
COPY --from=builder /app/workflow-core/target/*.jar app.jar

# Copy plugin JARs to a separate directory for loader.path
RUN mkdir plugins
COPY --from=builder /app/workflow-plugin-double-blind/target/workflow-plugin-double-blind-*.jar plugins/
COPY --from=builder /app/workflow-plugin-single-blind/target/workflow-plugin-single-blind-*.jar plugins/
COPY --from=builder /app/workflow-plugin-open-review/target/workflow-plugin-open-review-*.jar plugins/

USER spring:spring

EXPOSE 8081
ENTRYPOINT ["java", "-Dloader.path=plugins/", "-Djava.net.preferIPv6Addresses=true", "-Djava.net.preferIPv4Stack=false", "-jar", "app.jar"]
