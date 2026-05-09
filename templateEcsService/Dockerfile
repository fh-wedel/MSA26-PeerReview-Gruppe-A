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

# Build only the specified module and its dependencies when the root pom is present.
# Fallback to a single-module build when the build context is already the module folder.
RUN if [ -f pom.xml ] && [ -d ${MODULE_DIR} ] && [ -f ${MODULE_DIR}/pom.xml ]; then \
    mvn clean package -pl ${MODULE_DIR} -am -DskipTests; \
    else \
    mvn clean package -DskipTests; \
    fi

# Normalize the output location so the runtime stage can always copy the same path.
RUN mkdir -p /app/build && \
    if [ -d /app/${MODULE_DIR}/target ]; then \
    cp /app/${MODULE_DIR}/target/*.jar /app/build/app.jar; \
    else \
    cp /app/target/*.jar /app/build/app.jar; \
    fi

# ==========================================
# Stage 2: Create the lightweight runtime image
# ==========================================
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the built jar from the normalized build output
COPY --from=builder /app/build/app.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-Djava.net.preferIPv6Addresses=true", "-Djava.net.preferIPv4Stack=false", "-jar", "app.jar"]