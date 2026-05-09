# ==========================================
# Stage 1: Build the application
# ==========================================
FROM maven:3.9-eclipse-temurin-25 AS builder
WORKDIR /app

# The build context must be the root directory to include the parent pom.xml.
# Due to our root .dockerignore, this COPY will only include pom.xml files and src/ directories.
COPY . .

# Replace this ARG with your service's directory name when copying the template
ARG MODULE_DIR=templateEcsService

# Build only the specified module and its dependencies
RUN mvn clean package -pl ${MODULE_DIR} -am -DskipTests

# ==========================================
# Stage 2: Create the lightweight runtime image
# ==========================================
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

ARG MODULE_DIR=templateEcsService
# Copy the built jar from the module's target directory
COPY --from=builder /app/${MODULE_DIR}/target/*.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-Djava.net.preferIPv6Addresses=true", "-Djava.net.preferIPv4Stack=false", "-jar", "app.jar"]