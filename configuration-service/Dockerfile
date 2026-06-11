# ==========================================
# Stage 1: Build the application
# ==========================================
FROM maven:3.9-eclipse-temurin-25 AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Create the lightweight runtime image
# ==========================================
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

ENV HOME=/home/spring
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Here you save the file as 'configuration-service.jar'
COPY --from=builder /app/target/configuration-service.jar configuration-service.jar

EXPOSE 8080
# Match the jar name here in the entrypoint execution
ENTRYPOINT ["java", "-Djava.net.preferIPv6Addresses=true", "-Djava.net.preferIPv4Stack=false", "-jar", "configuration-service.jar"]
