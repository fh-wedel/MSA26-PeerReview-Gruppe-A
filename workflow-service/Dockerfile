# ==========================================
# Stage 1: Build all modules
# ==========================================
FROM maven:3.9-eclipse-temurin-25 AS builder
WORKDIR /app

# Copy all POMs for dependency caching
COPY pom.xml .
COPY workflow-api/pom.xml workflow-api/
COPY workflow-plugin-individual-work/pom.xml workflow-plugin-individual-work/
COPY workflow-plugin-bachelor-thesis/pom.xml workflow-plugin-bachelor-thesis/
COPY workflow-plugin-group-work/pom.xml workflow-plugin-group-work/
COPY workflow-core/pom.xml workflow-core/

RUN mvn dependency:go-offline -B

# Copy all source code and build
COPY workflow-api/src workflow-api/src
COPY workflow-plugin-individual-work/src workflow-plugin-individual-work/src
COPY workflow-plugin-bachelor-thesis/src workflow-plugin-bachelor-thesis/src
COPY workflow-plugin-group-work/src workflow-plugin-group-work/src
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
COPY --from=builder /app/workflow-plugin-individual-work/target/workflow-plugin-individual-work-*.jar plugins/
COPY --from=builder /app/workflow-plugin-bachelor-thesis/target/workflow-plugin-bachelor-thesis-*.jar plugins/
COPY --from=builder /app/workflow-plugin-group-work/target/workflow-plugin-group-work-*.jar plugins/

USER spring:spring

EXPOSE 8081
ENTRYPOINT ["java", "-Dloader.path=plugins/", "-Djava.net.preferIPv6Addresses=true", "-Djava.net.preferIPv4Stack=false", "-jar", "app.jar"]
