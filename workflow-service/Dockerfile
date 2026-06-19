# ==========================================
# Stage 1: Build all modules
# ==========================================
FROM maven:3.9-eclipse-temurin-25 AS builder
WORKDIR /app

# Copy all POMs for dependency caching
COPY pom.xml .
COPY workflow-api/pom.xml workflow-api/
COPY workflow-type-individual-work/pom.xml workflow-type-individual-work/
COPY workflow-template-individual-work/pom.xml workflow-template-individual-work/
COPY workflow-type-bachelor-thesis/pom.xml workflow-type-bachelor-thesis/
COPY workflow-template-bachelor-thesis/pom.xml workflow-template-bachelor-thesis/
COPY workflow-type-group-work/pom.xml workflow-type-group-work/
COPY workflow-template-group-work/pom.xml workflow-template-group-work/
COPY workflow-core/pom.xml workflow-core/

RUN mvn dependency:go-offline -B

# Copy all source code and build
COPY workflow-api/src workflow-api/src
COPY workflow-type-individual-work/src workflow-type-individual-work/src
COPY workflow-template-individual-work/src workflow-template-individual-work/src
COPY workflow-type-bachelor-thesis/src workflow-type-bachelor-thesis/src
COPY workflow-template-bachelor-thesis/src workflow-template-bachelor-thesis/src
COPY workflow-type-group-work/src workflow-type-group-work/src
COPY workflow-template-group-work/src workflow-template-group-work/src
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
COPY --from=builder /app/workflow-type-individual-work/target/workflow-type-individual-work-*.jar plugins/
COPY --from=builder /app/workflow-template-individual-work/target/workflow-template-individual-work-*.jar plugins/
COPY --from=builder /app/workflow-type-bachelor-thesis/target/workflow-type-bachelor-thesis-*.jar plugins/
COPY --from=builder /app/workflow-template-bachelor-thesis/target/workflow-template-bachelor-thesis-*.jar plugins/
COPY --from=builder /app/workflow-type-group-work/target/workflow-type-group-work-*.jar plugins/
COPY --from=builder /app/workflow-template-group-work/target/workflow-template-group-work-*.jar plugins/

USER spring:spring

EXPOSE 8081
ENTRYPOINT ["java", "-Dloader.path=plugins/", "-Djava.net.preferIPv6Addresses=true", "-Djava.net.preferIPv4Stack=false", "-jar", "app.jar"]
