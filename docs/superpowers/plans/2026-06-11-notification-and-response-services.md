# Notification & Response Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build two Spring Boot microservices — a Notification Service (multi-channel dispatch) and a Response Service (stores/exposes review results) — following the existing templateEcsService patterns.

**Architecture:** Both services use the Strategy Pattern (Notification) and SQS-Consumer-to-REST-Provider (Response) approaches. They follow the established project conventions: Spring Boot 4.0.6, Java 25, ECS Fargate on IPv6 private subnets, CDK v2 infrastructure, SQS for async messaging, and PostgreSQL (RDS) for persistence.

**Tech Stack:** Java 25, Spring Boot 4.0.6, Spring Data JPA, Spring Cloud AWS SQS, PostgreSQL, AWS S3, AWS Secrets Manager, AWS CDK v2 (TypeScript), Docker multi-stage builds.

---

## Task 1: Scaffold Notification Service from Template

**Files:**
- Create: `notificationService/pom.xml`
- Create: `notificationService/Dockerfile`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/NotificationApplication.java`
- Create: `notificationService/src/main/resources/application.properties`

- [ ] **Step 1: Create pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.6</version>
    </parent>
    <groupId>com.fh-wedel</groupId>
    <artifactId>notification</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <name>Notification Microservice of the PeerReview system</name>

    <properties>
        <java.version>25</java.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>io.awspring.cloud</groupId>
                <artifactId>spring-cloud-aws-dependencies</artifactId>
                <version>4.0.2</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
        </dependency>
        <dependency>
            <groupId>io.awspring.cloud</groupId>
            <artifactId>spring-cloud-aws-starter-sqs</artifactId>
        </dependency>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>secretsmanager</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
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

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-Djava.net.preferIPv6Addresses=true", "-Djava.net.preferIPv4Stack=false", "-jar", "app.jar"]
```

- [ ] **Step 3: Create NotificationApplication.java**

```java
package com.fh_wedel.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NotificationApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationApplication.class, args);
    }
}
```

- [ ] **Step 4: Create application.properties**

```properties
spring.application.name=notification
spring.main.banner-mode=off
management.endpoint.health.probes.enabled=true
server.port=${SERVER_PORT:8080}

# AWS SQS Configuration
spring.cloud.aws.sqs.dualstack-enabled=true
aws.sqs.request.queue-name=${SQS_REQUEST_QUEUE:}
spring.cloud.aws.region.static=${AWS_REGION:eu-north-1}

# Database Configuration
spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:notification}
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:postgres}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Secrets Manager
aws.secrets.name=${SECRETS_NAME:msa26/notification/credentials}
```

- [ ] **Step 5: Verify build compiles**

Run: `cd notificationService && mvn clean compile`
Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add notificationService/pom.xml notificationService/Dockerfile notificationService/src/
git commit -m "feat(notification): scaffold notification service from template"
```

---

## Task 2: Notification Service — Domain Model & Repository

**Files:**
- Create: `notificationService/src/main/java/com/fh_wedel/notification/model/NotificationLog.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/model/ChannelType.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/model/NotificationStatus.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/repository/NotificationLogRepository.java`
- Test: `notificationService/src/test/java/com/fh_wedel/notification/repository/NotificationLogRepositoryTest.java`

- [ ] **Step 1: Create ChannelType enum**

```java
package com.fh_wedel.notification.model;

public enum ChannelType {
    DISCORD,
    EMAIL,
    SLACK
}
```

- [ ] **Step 2: Create NotificationStatus enum**

```java
package com.fh_wedel.notification.model;

public enum NotificationStatus {
    PENDING,
    SENT,
    FAILED
}
```

- [ ] **Step 3: Create NotificationLog entity**

```java
package com.fh_wedel.notification.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChannelType channel;

    @Column(nullable = false)
    private String recipient;

    @Column(length = 500)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private NotificationStatus status = NotificationStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column(nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant sentAt;
}
```

- [ ] **Step 4: Create NotificationLogRepository**

```java
package com.fh_wedel.notification.repository;

import com.fh_wedel.notification.model.NotificationLog;
import com.fh_wedel.notification.model.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, UUID> {
    List<NotificationLog> findByStatus(NotificationStatus status);
}
```

- [ ] **Step 5: Write repository test**

```java
package com.fh_wedel.notification.repository;

import com.fh_wedel.notification.model.ChannelType;
import com.fh_wedel.notification.model.NotificationLog;
import com.fh_wedel.notification.model.NotificationStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class NotificationLogRepositoryTest {

    @Autowired
    private NotificationLogRepository repository;

    @Test
    void shouldSaveAndFindByStatus() {
        var log = NotificationLog.builder()
                .channel(ChannelType.DISCORD)
                .recipient("user@example.com")
                .subject("Test")
                .body("Hello")
                .status(NotificationStatus.SENT)
                .build();

        repository.save(log);

        List<NotificationLog> sent = repository.findByStatus(NotificationStatus.SENT);
        assertThat(sent).hasSize(1);
        assertThat(sent.getFirst().getRecipient()).isEqualTo("user@example.com");
    }
}
```

Add test application.properties at `notificationService/src/test/resources/application.properties`:

```properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=create-drop
spring.cloud.aws.sqs.enabled=false
aws.sqs.request.queue-name=
```

- [ ] **Step 6: Run test**

Run: `cd notificationService && mvn test -Dtest=NotificationLogRepositoryTest`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add notificationService/src/
git commit -m "feat(notification): add domain model and repository with test"
```

---

## Task 3: Notification Service — Channel Interface & Implementations

**Files:**
- Create: `notificationService/src/main/java/com/fh_wedel/notification/channel/NotificationChannel.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/channel/DiscordChannel.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/channel/EmailChannel.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/channel/SlackChannel.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/config/SecretsConfig.java`
- Test: `notificationService/src/test/java/com/fh_wedel/notification/channel/DiscordChannelTest.java`

- [ ] **Step 1: Create NotificationChannel interface**

```java
package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.model.ChannelType;

public interface NotificationChannel {

    ChannelType getChannelType();

    void send(String recipient, String subject, String body);

    boolean isEnabled();
}
```

- [ ] **Step 2: Create SecretsConfig**

```java
package com.fh_wedel.notification.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;

import java.util.HashMap;
import java.util.Map;

@Configuration
@Slf4j
@Getter
public class SecretsConfig {

    @Value("${aws.secrets.name:}")
    private String secretName;

    private Map<String, String> secrets = new HashMap<>();

    @PostConstruct
    public void loadSecrets() {
        if (secretName == null || secretName.isBlank()) {
            log.warn("No secrets name configured, channels will be disabled");
            return;
        }
        try {
            var client = SecretsManagerClient.create();
            var response = client.getSecretValue(
                    GetSecretValueRequest.builder().secretId(secretName).build());
            secrets = new ObjectMapper().readValue(
                    response.secretString(), new TypeReference<>() {});
            log.info("Loaded {} secret keys", secrets.size());
        } catch (Exception e) {
            log.error("Failed to load secrets from {}: {}", secretName, e.getMessage());
        }
    }

    public String get(String key) {
        return secrets.getOrDefault(key, "");
    }
}
```

- [ ] **Step 3: Create DiscordChannel**

```java
package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.config.SecretsConfig;
import com.fh_wedel.notification.model.ChannelType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@Slf4j
public class DiscordChannel implements NotificationChannel {

    private final SecretsConfig secretsConfig;
    private final RestClient restClient;

    public DiscordChannel(SecretsConfig secretsConfig) {
        this.secretsConfig = secretsConfig;
        this.restClient = RestClient.create();
    }

    @Override
    public ChannelType getChannelType() {
        return ChannelType.DISCORD;
    }

    @Override
    public void send(String recipient, String subject, String body) {
        String webhookUrl = secretsConfig.get("discord.webhook.url");
        String content = "**" + subject + "**\n" + body;

        restClient.post()
                .uri(webhookUrl)
                .body(Map.of("content", content))
                .retrieve()
                .toBodilessEntity();

        log.info("Discord notification sent: {}", subject);
    }

    @Override
    public boolean isEnabled() {
        return !secretsConfig.get("discord.webhook.url").isBlank();
    }
}
```

- [ ] **Step 4: Create EmailChannel**

```java
package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.config.SecretsConfig;
import com.fh_wedel.notification.model.ChannelType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EmailChannel implements NotificationChannel {

    private final JavaMailSender mailSender;
    private final SecretsConfig secretsConfig;

    public EmailChannel(JavaMailSender mailSender, SecretsConfig secretsConfig) {
        this.mailSender = mailSender;
        this.secretsConfig = secretsConfig;
    }

    @Override
    public ChannelType getChannelType() {
        return ChannelType.EMAIL;
    }

    @Override
    public void send(String recipient, String subject, String body) {
        var message = new SimpleMailMessage();
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom(secretsConfig.get("email.from.address"));

        mailSender.send(message);
        log.info("Email sent to {}: {}", recipient, subject);
    }

    @Override
    public boolean isEnabled() {
        return !secretsConfig.get("email.smtp.host").isBlank();
    }
}
```

- [ ] **Step 5: Create SlackChannel**

```java
package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.config.SecretsConfig;
import com.fh_wedel.notification.model.ChannelType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@Slf4j
public class SlackChannel implements NotificationChannel {

    private final SecretsConfig secretsConfig;
    private final RestClient restClient;

    public SlackChannel(SecretsConfig secretsConfig) {
        this.secretsConfig = secretsConfig;
        this.restClient = RestClient.create();
    }

    @Override
    public ChannelType getChannelType() {
        return ChannelType.SLACK;
    }

    @Override
    public void send(String recipient, String subject, String body) {
        String webhookUrl = secretsConfig.get("slack.webhook.url");
        String text = "*" + subject + "*\n" + body;

        restClient.post()
                .uri(webhookUrl)
                .body(Map.of("text", text))
                .retrieve()
                .toBodilessEntity();

        log.info("Slack notification sent: {}", subject);
    }

    @Override
    public boolean isEnabled() {
        return !secretsConfig.get("slack.webhook.url").isBlank();
    }
}
```

- [ ] **Step 6: Write DiscordChannel unit test**

```java
package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.config.SecretsConfig;
import com.fh_wedel.notification.model.ChannelType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscordChannelTest {

    @Mock
    private SecretsConfig secretsConfig;

    @InjectMocks
    private DiscordChannel discordChannel;

    @Test
    void shouldReturnDiscordChannelType() {
        assertThat(discordChannel.getChannelType()).isEqualTo(ChannelType.DISCORD);
    }

    @Test
    void shouldBeDisabledWhenNoWebhookUrl() {
        when(secretsConfig.get("discord.webhook.url")).thenReturn("");
        assertThat(discordChannel.isEnabled()).isFalse();
    }

    @Test
    void shouldBeEnabledWhenWebhookUrlPresent() {
        when(secretsConfig.get("discord.webhook.url")).thenReturn("https://discord.com/api/webhooks/123/abc");
        assertThat(discordChannel.isEnabled()).isTrue();
    }
}
```

- [ ] **Step 7: Run tests**

Run: `cd notificationService && mvn test`
Expected: All tests PASS

- [ ] **Step 8: Commit**

```bash
git add notificationService/src/
git commit -m "feat(notification): add channel interface with Discord, Email, Slack implementations"
```

---

## Task 4: Notification Service — Dispatcher & REST Controller

**Files:**
- Create: `notificationService/src/main/java/com/fh_wedel/notification/service/NotificationDispatcher.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/model/NotificationRequest.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/model/NotificationResponse.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/controller/NotificationController.java`
- Test: `notificationService/src/test/java/com/fh_wedel/notification/service/NotificationDispatcherTest.java`
- Test: `notificationService/src/test/java/com/fh_wedel/notification/controller/NotificationControllerTest.java`

- [ ] **Step 1: Create NotificationRequest DTO**

```java
package com.fh_wedel.notification.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record NotificationRequest(
        @NotEmpty List<ChannelType> channels,
        @NotEmpty List<String> recipients,
        @NotBlank String subject,
        @NotBlank String body
) {}
```

- [ ] **Step 2: Create NotificationResponse DTO**

```java
package com.fh_wedel.notification.model;

import java.util.List;
import java.util.UUID;

public record NotificationResponse(
        List<UUID> notificationIds,
        String status
) {}
```

- [ ] **Step 3: Create NotificationDispatcher**

```java
package com.fh_wedel.notification.service;

import com.fh_wedel.notification.channel.NotificationChannel;
import com.fh_wedel.notification.model.*;
import com.fh_wedel.notification.repository.NotificationLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
public class NotificationDispatcher {

    private final Map<ChannelType, NotificationChannel> channelMap;
    private final NotificationLogRepository logRepository;

    public NotificationDispatcher(List<NotificationChannel> channels, NotificationLogRepository logRepository) {
        this.channelMap = channels.stream()
                .collect(Collectors.toMap(NotificationChannel::getChannelType, Function.identity()));
        this.logRepository = logRepository;
    }

    public List<UUID> dispatch(NotificationRequest request) {
        List<UUID> ids = new ArrayList<>();

        for (ChannelType channelType : request.channels()) {
            NotificationChannel channel = channelMap.get(channelType);
            if (channel == null || !channel.isEnabled()) {
                log.warn("Channel {} is not available or disabled", channelType);
                continue;
            }

            for (String recipient : request.recipients()) {
                var logEntry = NotificationLog.builder()
                        .channel(channelType)
                        .recipient(recipient)
                        .subject(request.subject())
                        .body(request.body())
                        .status(NotificationStatus.PENDING)
                        .build();

                try {
                    channel.send(recipient, request.subject(), request.body());
                    logEntry.setStatus(NotificationStatus.SENT);
                    logEntry.setSentAt(Instant.now());
                } catch (Exception e) {
                    log.error("Failed to send {} notification to {}: {}", channelType, recipient, e.getMessage());
                    logEntry.setStatus(NotificationStatus.FAILED);
                    logEntry.setErrorMessage(e.getMessage());
                }

                logRepository.save(logEntry);
                ids.add(logEntry.getId());
            }
        }

        return ids;
    }
}
```

- [ ] **Step 4: Create NotificationController**

```java
package com.fh_wedel.notification.controller;

import com.fh_wedel.notification.model.NotificationRequest;
import com.fh_wedel.notification.model.NotificationResponse;
import com.fh_wedel.notification.service.NotificationDispatcher;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/notification")
@Slf4j
public class NotificationController {

    private final NotificationDispatcher dispatcher;

    public NotificationController(NotificationDispatcher dispatcher) {
        this.dispatcher = dispatcher;
    }

    @PostMapping("/send")
    public ResponseEntity<NotificationResponse> sendNotification(@Valid @RequestBody NotificationRequest request) {
        log.info("Received notification request for channels: {}", request.channels());
        List<UUID> ids = dispatcher.dispatch(request);
        return ResponseEntity.ok(new NotificationResponse(ids, "DISPATCHED"));
    }
}
```

- [ ] **Step 5: Write NotificationDispatcher test**

```java
package com.fh_wedel.notification.service;

import com.fh_wedel.notification.channel.NotificationChannel;
import com.fh_wedel.notification.model.*;
import com.fh_wedel.notification.repository.NotificationLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationDispatcherTest {

    @Mock
    private NotificationChannel discordChannel;

    @Mock
    private NotificationLogRepository logRepository;

    private NotificationDispatcher dispatcher;

    @BeforeEach
    void setUp() {
        when(discordChannel.getChannelType()).thenReturn(ChannelType.DISCORD);
        when(discordChannel.isEnabled()).thenReturn(true);
        when(logRepository.save(any())).thenAnswer(invocation -> {
            NotificationLog log = invocation.getArgument(0);
            log.setId(UUID.randomUUID());
            return log;
        });
        dispatcher = new NotificationDispatcher(List.of(discordChannel), logRepository);
    }

    @Test
    void shouldDispatchToEnabledChannel() {
        var request = new NotificationRequest(
                List.of(ChannelType.DISCORD),
                List.of("user@test.com"),
                "Test Subject",
                "Test Body"
        );

        List<UUID> ids = dispatcher.dispatch(request);

        assertThat(ids).hasSize(1);
        verify(discordChannel).send("user@test.com", "Test Subject", "Test Body");

        ArgumentCaptor<NotificationLog> captor = ArgumentCaptor.forClass(NotificationLog.class);
        verify(logRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(NotificationStatus.SENT);
    }

    @Test
    void shouldLogFailureWhenChannelThrows() {
        when(discordChannel.isEnabled()).thenReturn(true);
        doThrow(new RuntimeException("Webhook failed")).when(discordChannel)
                .send(any(), any(), any());

        var request = new NotificationRequest(
                List.of(ChannelType.DISCORD),
                List.of("user@test.com"),
                "Subject",
                "Body"
        );

        List<UUID> ids = dispatcher.dispatch(request);

        assertThat(ids).hasSize(1);
        ArgumentCaptor<NotificationLog> captor = ArgumentCaptor.forClass(NotificationLog.class);
        verify(logRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(NotificationStatus.FAILED);
        assertThat(captor.getValue().getErrorMessage()).isEqualTo("Webhook failed");
    }
}
```

- [ ] **Step 6: Write NotificationController test**

```java
package com.fh_wedel.notification.controller;

import com.fh_wedel.notification.model.ChannelType;
import com.fh_wedel.notification.model.NotificationRequest;
import com.fh_wedel.notification.service.NotificationDispatcher;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationDispatcher dispatcher;

    @InjectMocks
    private NotificationController controller;

    @Test
    void shouldReturnDispatchedResponse() {
        var id = UUID.randomUUID();
        when(dispatcher.dispatch(any())).thenReturn(List.of(id));

        var request = new NotificationRequest(
                List.of(ChannelType.DISCORD),
                List.of("user@test.com"),
                "Subject",
                "Body"
        );

        var response = controller.sendNotification(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().notificationIds()).containsExactly(id);
        assertThat(response.getBody().status()).isEqualTo("DISPATCHED");
    }
}
```

- [ ] **Step 7: Run all tests**

Run: `cd notificationService && mvn test`
Expected: All tests PASS

- [ ] **Step 8: Commit**

```bash
git add notificationService/src/
git commit -m "feat(notification): add dispatcher service and REST controller with tests"
```

---

## Task 5: Notification Service — SQS Listener

**Files:**
- Create: `notificationService/src/main/java/com/fh_wedel/notification/model/NotificationEvent.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/controller/SqsNotificationListener.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/config/JacksonConfig.java`
- Test: `notificationService/src/test/java/com/fh_wedel/notification/controller/SqsNotificationListenerTest.java`

- [ ] **Step 1: Create NotificationEvent (SQS payload)**

```java
package com.fh_wedel.notification.model;

import java.util.List;
import java.util.Map;

public record NotificationEvent(
        String eventType,
        List<ChannelType> channels,
        String recipientUserId,
        String subject,
        String body,
        Map<String, String> metadata
) {}
```

- [ ] **Step 2: Create JacksonConfig**

```java
package com.fh_wedel.notification.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}
```

- [ ] **Step 3: Create SqsNotificationListener**

```java
package com.fh_wedel.notification.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.notification.model.NotificationEvent;
import com.fh_wedel.notification.model.NotificationRequest;
import com.fh_wedel.notification.service.NotificationDispatcher;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConditionalOnExpression("!'${aws.sqs.request.queue-name}'.isBlank()")
@Slf4j
public class SqsNotificationListener {

    private final NotificationDispatcher dispatcher;
    private final ObjectMapper objectMapper;

    public SqsNotificationListener(NotificationDispatcher dispatcher, ObjectMapper objectMapper) {
        this.dispatcher = dispatcher;
        this.objectMapper = objectMapper;
    }

    @SqsListener("${aws.sqs.request.queue-name}")
    public void receiveMessage(String message) {
        log.info("Received notification event from SQS");
        try {
            NotificationEvent event = objectMapper.readValue(message, NotificationEvent.class);
            var request = new NotificationRequest(
                    event.channels(),
                    List.of(event.recipientUserId()),
                    event.subject(),
                    event.body()
            );
            dispatcher.dispatch(request);
        } catch (Exception e) {
            log.error("Failed to process notification event: {}", e.getMessage(), e);
        }
    }
}
```

- [ ] **Step 4: Write SqsNotificationListener test**

```java
package com.fh_wedel.notification.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.notification.model.ChannelType;
import com.fh_wedel.notification.model.NotificationRequest;
import com.fh_wedel.notification.service.NotificationDispatcher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SqsNotificationListenerTest {

    @Mock
    private NotificationDispatcher dispatcher;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SqsNotificationListener listener;

    @Test
    void shouldParseEventAndDispatch() {
        when(dispatcher.dispatch(any())).thenReturn(List.of(UUID.randomUUID()));

        String json = """
                {
                    "eventType": "REVIEW_COMPLETED",
                    "channels": ["DISCORD", "EMAIL"],
                    "recipientUserId": "author-123",
                    "subject": "Review Complete",
                    "body": "Your submission has been reviewed.",
                    "metadata": {"submissionId": "sub-456"}
                }
                """;

        listener.receiveMessage(json);

        ArgumentCaptor<NotificationRequest> captor = ArgumentCaptor.forClass(NotificationRequest.class);
        verify(dispatcher).dispatch(captor.capture());

        NotificationRequest request = captor.getValue();
        assertThat(request.channels()).containsExactly(ChannelType.DISCORD, ChannelType.EMAIL);
        assertThat(request.recipients()).containsExactly("author-123");
        assertThat(request.subject()).isEqualTo("Review Complete");
    }
}
```

- [ ] **Step 5: Run all tests**

Run: `cd notificationService && mvn test`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add notificationService/src/
git commit -m "feat(notification): add SQS listener for automated notifications"
```

---

## Task 6: Scaffold Response Service from Template

**Files:**
- Create: `responseService/pom.xml`
- Create: `responseService/Dockerfile`
- Create: `responseService/src/main/java/com/fh_wedel/response/ResponseApplication.java`
- Create: `responseService/src/main/resources/application.properties`

- [ ] **Step 1: Create pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.6</version>
    </parent>
    <groupId>com.fh-wedel</groupId>
    <artifactId>response</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <name>Response Microservice of the PeerReview system</name>

    <properties>
        <java.version>25</java.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>io.awspring.cloud</groupId>
                <artifactId>spring-cloud-aws-dependencies</artifactId>
                <version>4.0.2</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>io.awspring.cloud</groupId>
            <artifactId>spring-cloud-aws-starter-sqs</artifactId>
        </dependency>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>s3</artifactId>
        </dependency>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>s3-transfer-manager</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
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

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-Djava.net.preferIPv6Addresses=true", "-Djava.net.preferIPv4Stack=false", "-jar", "app.jar"]
```

- [ ] **Step 3: Create ResponseApplication.java**

```java
package com.fh_wedel.response;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ResponseApplication {

    public static void main(String[] args) {
        SpringApplication.run(ResponseApplication.class, args);
    }
}
```

- [ ] **Step 4: Create application.properties**

```properties
spring.application.name=response
spring.main.banner-mode=off
management.endpoint.health.probes.enabled=true
server.port=${SERVER_PORT:8080}

# AWS SQS Configuration
spring.cloud.aws.sqs.dualstack-enabled=true
aws.sqs.request.queue-name=${SQS_REQUEST_QUEUE:}
spring.cloud.aws.region.static=${AWS_REGION:eu-north-1}

# Database Configuration
spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:response}
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:postgres}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# S3 Configuration
aws.s3.bucket-name=${S3_BUCKET_NAME:msa26-peer-review-response-documents}
aws.s3.presigned-url-expiration-minutes=15
```

- [ ] **Step 5: Verify build compiles**

Run: `cd responseService && mvn clean compile`
Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add responseService/pom.xml responseService/Dockerfile responseService/src/
git commit -m "feat(response): scaffold response service from template"
```

---

## Task 7: Response Service — Domain Model & Repository

**Files:**
- Create: `responseService/src/main/java/com/fh_wedel/response/model/ReviewResult.java`
- Create: `responseService/src/main/java/com/fh_wedel/response/model/ReviewResultDto.java`
- Create: `responseService/src/main/java/com/fh_wedel/response/repository/ReviewResultRepository.java`
- Test: `responseService/src/test/java/com/fh_wedel/response/repository/ReviewResultRepositoryTest.java`

- [ ] **Step 1: Create ReviewResult entity**

```java
package com.fh_wedel.response.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "review_result")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "submission_id", nullable = false, length = 100)
    private String submissionId;

    @Column(name = "reviewer_id", nullable = false, length = 100)
    private String reviewerId;

    @Column(name = "author_id", nullable = false, length = 100)
    private String authorId;

    @Column(name = "final_grade", length = 10)
    private String finalGrade;

    @Column(name = "review_comments", columnDefinition = "TEXT")
    private String reviewComments;

    @Column(name = "document_s3_key", length = 500)
    private String documentS3Key;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
```

- [ ] **Step 2: Create ReviewResultDto**

```java
package com.fh_wedel.response.model;

import java.time.Instant;
import java.util.UUID;

public record ReviewResultDto(
        UUID id,
        String submissionId,
        String reviewerId,
        String authorId,
        String finalGrade,
        String reviewComments,
        boolean hasDocument,
        Instant completedAt,
        Instant createdAt
) {
    public static ReviewResultDto from(ReviewResult entity) {
        return new ReviewResultDto(
                entity.getId(),
                entity.getSubmissionId(),
                entity.getReviewerId(),
                entity.getAuthorId(),
                entity.getFinalGrade(),
                entity.getReviewComments(),
                entity.getDocumentS3Key() != null && !entity.getDocumentS3Key().isBlank(),
                entity.getCompletedAt(),
                entity.getCreatedAt()
        );
    }
}
```

- [ ] **Step 3: Create ReviewResultRepository**

```java
package com.fh_wedel.response.repository;

import com.fh_wedel.response.model.ReviewResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewResultRepository extends JpaRepository<ReviewResult, UUID> {
    List<ReviewResult> findByAuthorId(String authorId);
    Optional<ReviewResult> findBySubmissionId(String submissionId);
}
```

- [ ] **Step 4: Write repository test**

Create `responseService/src/test/resources/application.properties`:
```properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=create-drop
spring.cloud.aws.sqs.enabled=false
aws.sqs.request.queue-name=
aws.s3.bucket-name=test-bucket
```

```java
package com.fh_wedel.response.repository;

import com.fh_wedel.response.model.ReviewResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ReviewResultRepositoryTest {

    @Autowired
    private ReviewResultRepository repository;

    @Test
    void shouldFindByAuthorId() {
        var result = ReviewResult.builder()
                .submissionId("sub-1")
                .reviewerId("rev-1")
                .authorId("author-1")
                .finalGrade("1.3")
                .reviewComments("Good work")
                .completedAt(Instant.now())
                .build();

        repository.save(result);

        List<ReviewResult> found = repository.findByAuthorId("author-1");
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getSubmissionId()).isEqualTo("sub-1");
    }

    @Test
    void shouldFindBySubmissionId() {
        var result = ReviewResult.builder()
                .submissionId("sub-2")
                .reviewerId("rev-2")
                .authorId("author-2")
                .finalGrade("2.0")
                .completedAt(Instant.now())
                .build();

        repository.save(result);

        var found = repository.findBySubmissionId("sub-2");
        assertThat(found).isPresent();
        assertThat(found.get().getAuthorId()).isEqualTo("author-2");
    }
}
```

- [ ] **Step 5: Run tests**

Run: `cd responseService && mvn test`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add responseService/src/
git commit -m "feat(response): add domain model and repository with tests"
```

---

## Task 8: Response Service — S3 Document Service & Result Service

**Files:**
- Create: `responseService/src/main/java/com/fh_wedel/response/config/S3Config.java`
- Create: `responseService/src/main/java/com/fh_wedel/response/service/DocumentStorageService.java`
- Create: `responseService/src/main/java/com/fh_wedel/response/service/ResultService.java`
- Test: `responseService/src/test/java/com/fh_wedel/response/service/ResultServiceTest.java`

- [ ] **Step 1: Create S3Config**

```java
package com.fh_wedel.response.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class S3Config {

    @Bean
    public S3Client s3Client() {
        return S3Client.create();
    }

    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.create();
    }
}
```

- [ ] **Step 2: Create DocumentStorageService**

```java
package com.fh_wedel.response.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.time.Duration;

@Service
@Slf4j
public class DocumentStorageService {

    private final S3Presigner s3Presigner;
    private final String bucketName;
    private final int expirationMinutes;

    public DocumentStorageService(
            S3Presigner s3Presigner,
            @Value("${aws.s3.bucket-name}") String bucketName,
            @Value("${aws.s3.presigned-url-expiration-minutes:15}") int expirationMinutes) {
        this.s3Presigner = s3Presigner;
        this.bucketName = bucketName;
        this.expirationMinutes = expirationMinutes;
    }

    public String generatePresignedDownloadUrl(String s3Key) {
        var getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        var presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expirationMinutes))
                .getObjectRequest(getObjectRequest)
                .build();

        var presignedUrl = s3Presigner.presignGetObject(presignRequest);
        log.info("Generated presigned URL for key: {}", s3Key);
        return presignedUrl.url().toString();
    }
}
```

- [ ] **Step 3: Create ResultService**

```java
package com.fh_wedel.response.service;

import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.repository.ReviewResultRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class ResultService {

    private final ReviewResultRepository repository;
    private final DocumentStorageService documentStorageService;

    public ResultService(ReviewResultRepository repository, DocumentStorageService documentStorageService) {
        this.repository = repository;
        this.documentStorageService = documentStorageService;
    }

    public ReviewResult save(ReviewResult result) {
        log.info("Saving review result for submission: {}", result.getSubmissionId());
        return repository.save(result);
    }

    public List<ReviewResultDto> findByAuthor(String authorId) {
        return repository.findByAuthorId(authorId).stream()
                .map(ReviewResultDto::from)
                .toList();
    }

    public ReviewResultDto findBySubmission(String submissionId) {
        return repository.findBySubmissionId(submissionId)
                .map(ReviewResultDto::from)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No result found for submission: " + submissionId));
    }

    public String getDocumentDownloadUrl(String submissionId) {
        var result = repository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No result found for submission: " + submissionId));

        if (result.getDocumentS3Key() == null || result.getDocumentS3Key().isBlank()) {
            throw new IllegalArgumentException("No document attached to submission: " + submissionId);
        }

        return documentStorageService.generatePresignedDownloadUrl(result.getDocumentS3Key());
    }
}
```

- [ ] **Step 4: Write ResultService test**

```java
package com.fh_wedel.response.service;

import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.repository.ReviewResultRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResultServiceTest {

    @Mock
    private ReviewResultRepository repository;

    @Mock
    private DocumentStorageService documentStorageService;

    @InjectMocks
    private ResultService resultService;

    @Test
    void shouldFindResultsByAuthor() {
        var result = ReviewResult.builder()
                .id(UUID.randomUUID())
                .submissionId("sub-1")
                .reviewerId("rev-1")
                .authorId("author-1")
                .finalGrade("1.7")
                .completedAt(Instant.now())
                .createdAt(Instant.now())
                .build();

        when(repository.findByAuthorId("author-1")).thenReturn(List.of(result));

        List<ReviewResultDto> results = resultService.findByAuthor("author-1");

        assertThat(results).hasSize(1);
        assertThat(results.getFirst().finalGrade()).isEqualTo("1.7");
    }

    @Test
    void shouldThrowWhenSubmissionNotFound() {
        when(repository.findBySubmissionId("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> resultService.findBySubmission("nonexistent"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No result found");
    }

    @Test
    void shouldGenerateDownloadUrl() {
        var result = ReviewResult.builder()
                .id(UUID.randomUUID())
                .submissionId("sub-1")
                .documentS3Key("reviews/sub-1/final.pdf")
                .completedAt(Instant.now())
                .createdAt(Instant.now())
                .build();

        when(repository.findBySubmissionId("sub-1")).thenReturn(Optional.of(result));
        when(documentStorageService.generatePresignedDownloadUrl("reviews/sub-1/final.pdf"))
                .thenReturn("https://s3.presigned.url/...");

        String url = resultService.getDocumentDownloadUrl("sub-1");

        assertThat(url).isEqualTo("https://s3.presigned.url/...");
    }
}
```

- [ ] **Step 5: Run tests**

Run: `cd responseService && mvn test`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add responseService/src/
git commit -m "feat(response): add S3 document service and result service with tests"
```

---

## Task 9: Response Service — REST Controller & SQS Listener

**Files:**
- Create: `responseService/src/main/java/com/fh_wedel/response/controller/ResultController.java`
- Create: `responseService/src/main/java/com/fh_wedel/response/model/ReviewCompletedEvent.java`
- Create: `responseService/src/main/java/com/fh_wedel/response/controller/SqsResultListener.java`
- Create: `responseService/src/main/java/com/fh_wedel/response/config/JacksonConfig.java`
- Test: `responseService/src/test/java/com/fh_wedel/response/controller/ResultControllerTest.java`
- Test: `responseService/src/test/java/com/fh_wedel/response/controller/SqsResultListenerTest.java`

- [ ] **Step 1: Create ReviewCompletedEvent**

```java
package com.fh_wedel.response.model;

import java.time.Instant;

public record ReviewCompletedEvent(
        String submissionId,
        String reviewerId,
        String authorId,
        String finalGrade,
        String reviewComments,
        String documentS3Key,
        Instant completedAt
) {}
```

- [ ] **Step 2: Create JacksonConfig**

```java
package com.fh_wedel.response.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}
```

- [ ] **Step 3: Create ResultController**

```java
package com.fh_wedel.response.controller;

import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.service.ResultService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/response")
@Slf4j
public class ResultController {

    private final ResultService resultService;

    public ResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    @GetMapping("/results")
    public ResponseEntity<List<ReviewResultDto>> getResultsByAuthor(@RequestParam String authorId) {
        log.info("Fetching results for author: {}", authorId);
        return ResponseEntity.ok(resultService.findByAuthor(authorId));
    }

    @GetMapping("/results/{submissionId}")
    public ResponseEntity<ReviewResultDto> getResultBySubmission(@PathVariable String submissionId) {
        log.info("Fetching result for submission: {}", submissionId);
        return ResponseEntity.ok(resultService.findBySubmission(submissionId));
    }

    @GetMapping("/results/{submissionId}/document")
    public ResponseEntity<Map<String, String>> getDocumentUrl(@PathVariable String submissionId) {
        log.info("Generating document URL for submission: {}", submissionId);
        String url = resultService.getDocumentDownloadUrl(submissionId);
        return ResponseEntity.ok(Map.of("downloadUrl", url));
    }
}
```

- [ ] **Step 4: Create SqsResultListener**

```java
package com.fh_wedel.response.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.response.model.ReviewCompletedEvent;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.service.ResultService;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("!'${aws.sqs.request.queue-name}'.isBlank()")
@Slf4j
public class SqsResultListener {

    private final ResultService resultService;
    private final ObjectMapper objectMapper;

    public SqsResultListener(ResultService resultService, ObjectMapper objectMapper) {
        this.resultService = resultService;
        this.objectMapper = objectMapper;
    }

    @SqsListener("${aws.sqs.request.queue-name}")
    public void receiveMessage(String message) {
        log.info("Received review completed event from SQS");
        try {
            ReviewCompletedEvent event = objectMapper.readValue(message, ReviewCompletedEvent.class);

            var result = ReviewResult.builder()
                    .submissionId(event.submissionId())
                    .reviewerId(event.reviewerId())
                    .authorId(event.authorId())
                    .finalGrade(event.finalGrade())
                    .reviewComments(event.reviewComments())
                    .documentS3Key(event.documentS3Key())
                    .completedAt(event.completedAt())
                    .build();

            resultService.save(result);
            log.info("Stored review result for submission: {}", event.submissionId());
        } catch (Exception e) {
            log.error("Failed to process review completed event: {}", e.getMessage(), e);
        }
    }
}
```

- [ ] **Step 5: Write ResultController test**

```java
package com.fh_wedel.response.controller;

import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.service.ResultService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResultControllerTest {

    @Mock
    private ResultService resultService;

    @InjectMocks
    private ResultController controller;

    @Test
    void shouldReturnResultsByAuthor() {
        var dto = new ReviewResultDto(
                UUID.randomUUID(), "sub-1", "rev-1", "author-1",
                "1.7", "Good", true, Instant.now(), Instant.now());

        when(resultService.findByAuthor("author-1")).thenReturn(List.of(dto));

        var response = controller.getResultsByAuthor("author-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().getFirst().finalGrade()).isEqualTo("1.7");
    }

    @Test
    void shouldReturnDocumentUrl() {
        when(resultService.getDocumentDownloadUrl("sub-1"))
                .thenReturn("https://s3.presigned.url");

        var response = controller.getDocumentUrl("sub-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("downloadUrl", "https://s3.presigned.url");
    }
}
```

- [ ] **Step 6: Write SqsResultListener test**

```java
package com.fh_wedel.response.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.service.ResultService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SqsResultListenerTest {

    @Mock
    private ResultService resultService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @InjectMocks
    private SqsResultListener listener;

    @Test
    void shouldParseEventAndSaveResult() {
        when(resultService.save(any())).thenAnswer(i -> i.getArgument(0));

        String json = """
                {
                    "submissionId": "sub-123",
                    "reviewerId": "rev-456",
                    "authorId": "auth-789",
                    "finalGrade": "1.7",
                    "reviewComments": "Good work",
                    "documentS3Key": "reviews/sub-123/final.pdf",
                    "completedAt": "2026-06-11T14:30:00Z"
                }
                """;

        listener.receiveMessage(json);

        ArgumentCaptor<ReviewResult> captor = ArgumentCaptor.forClass(ReviewResult.class);
        verify(resultService).save(captor.capture());

        ReviewResult saved = captor.getValue();
        assertThat(saved.getSubmissionId()).isEqualTo("sub-123");
        assertThat(saved.getReviewerId()).isEqualTo("rev-456");
        assertThat(saved.getAuthorId()).isEqualTo("auth-789");
        assertThat(saved.getFinalGrade()).isEqualTo("1.7");
        assertThat(saved.getDocumentS3Key()).isEqualTo("reviews/sub-123/final.pdf");
    }
}
```

- [ ] **Step 7: Run all tests**

Run: `cd responseService && mvn test`
Expected: All tests PASS

- [ ] **Step 8: Commit**

```bash
git add responseService/src/
git commit -m "feat(response): add REST controller and SQS listener with tests"
```

---

## Task 10: CDK Infrastructure — Notification Service

**Files:**
- Create: `notificationService/infra/bin/infra.ts`
- Create: `notificationService/infra/lib/service-stack.ts`
- Create: `notificationService/infra/package.json`
- Create: `notificationService/infra/tsconfig.json`
- Create: `notificationService/infra/cdk.json`
- Create: `notificationService/infra/jest.config.js`
- Create: `notificationService/infra/verified-permissions/notification-policies.json`
- Create: `notificationService/src/main/resources/openapi/notification.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "notification-infra",
  "version": "0.1.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "pretest": "npm ci --prefix ../../infraLibrary",
    "test": "jest",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/jest": "^30",
    "@types/node": "^24.10.1",
    "aws-cdk": "2.1120.0",
    "esbuild": "^0.28.0",
    "jest": "^30",
    "ts-jest": "^29",
    "ts-node": "^10.9.2",
    "typescript": "~5.9.3"
  },
  "dependencies": {
    "@cdklabs/cdk-verified-permissions": "^0.3.3",
    "aws-cdk-lib": "2.253.1",
    "constructs": "^10.5.0",
    "pino": "^10.3.1"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "outDir": "./build",
    "rootDir": ".",
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["node_modules", "build"]
}
```

- [ ] **Step 3: Create cdk.json**

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/infra.ts"
}
```

- [ ] **Step 4: Create jest.config.js**

```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
```

- [ ] **Step 5: Create OpenAPI spec**

File: `notificationService/src/main/resources/openapi/notification.json`

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Notification API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "/api/notification",
      "description": "Basepath for the Notification API"
    }
  ],
  "paths": {
    "/send": {
      "post": {
        "summary": "Send a notification via one or more channels",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["channels", "recipients", "subject", "body"],
                "properties": {
                  "channels": {
                    "type": "array",
                    "items": { "type": "string", "enum": ["DISCORD", "EMAIL", "SLACK"] }
                  },
                  "recipients": {
                    "type": "array",
                    "items": { "type": "string" }
                  },
                  "subject": { "type": "string" },
                  "body": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Notifications dispatched",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "notificationIds": { "type": "array", "items": { "type": "string" } },
                    "status": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

- [ ] **Step 6: Create verified-permissions policies**

File: `notificationService/infra/verified-permissions/notification-policies.json`

```json
{
    "namespace": "PeerReview",
    "resourceId": "PeerReview",
    "entityTypeNames": {
        "user": "User",
        "group": "UserGroup",
        "application": "Application",
        "action": "Action"
    },
    "policies": [
        {
            "id": "AdminNotificationSend",
            "groupName": "Admin",
            "actionId": "post /api/notification/send",
            "description": "Allow Admin to send notifications"
        },
        {
            "id": "AuthorNotificationSend",
            "groupName": "Author",
            "actionId": "post /api/notification/send",
            "description": "Allow Author to send notifications"
        }
    ]
}
```

- [ ] **Step 7: Create service-stack.ts (extends template with RDS + Secrets Manager)**

```typescript
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { ImportedRessources } from '../../../infraLibrary/lib/importedRessources';
import { EcsInfra } from '../../../infraLibrary/lib/ecs';
import { SqsInfra } from '../../../infraLibrary/lib/sqs';
import { LogsInfra } from '../../../infraLibrary/lib/logs';
import { AWSConstants } from '../../../infrabaseline/lib/constants';

export interface NotificationServiceStackProps extends cdk.StackProps {
  serviceName: string;
  imageVersion: string;
  containerPort: number;
  memory: number;
  cpu: number;
  minTaskCount: number;
  maxTaskCount: number;
  requestQueueName: string;
  secretsName: string;
}

export class NotificationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NotificationServiceStackProps) {
    super(scope, id, props);

    const vpc = ImportedRessources.getVpcByAttributes(this);
    const ecsCluster = ImportedRessources.getECSClusterByAttributes(this, vpc);
    const subnet = EcsInfra.getIpV6Subnet(this);

    const logGroup = LogsInfra.createLogGroup(this, {
      logGroupName: `/ecs/${props.serviceName}`,
    });

    // RDS PostgreSQL
    const dbCredentials = rds.Credentials.fromGeneratedSecret('notification_admin', {
      secretName: `${props.serviceName}/db-credentials`,
    });

    const dbInstance = new rds.DatabaseInstance(this, 'NotificationDb', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnets: [subnet] },
      databaseName: 'notification',
      credentials: dbCredentials,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // Import existing notification secrets
    const notificationSecrets = secretsmanager.Secret.fromSecretNameV2(
      this, 'NotificationSecrets', props.secretsName
    );

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: props.memory,
      cpu: props.cpu,
    });

    const imageName = EcsInfra.getDefaultImageNameIpv6(props.serviceName, props.imageVersion);
    const containerPort = props.containerPort;

    taskDefinition.addContainer('AppContainer', {
      containerName: props.serviceName,
      image: ecs.ContainerImage.fromRegistry(imageName),
      logging: LogsInfra.createEcsLogDriver(logGroup, props.serviceName),
      portMappings: [{ containerPort, protocol: ecs.Protocol.TCP }],
      environment: {
        'SQS_REQUEST_QUEUE': props.requestQueueName,
        'SERVER_PORT': containerPort.toString(),
        'AWS_REGION': AWSConstants.AWS_REGION,
        'SECRETS_NAME': props.secretsName,
        'DB_HOST': dbInstance.dbInstanceEndpointAddress,
        'DB_PORT': dbInstance.dbInstanceEndpointPort,
        'DB_NAME': 'notification',
      },
      secrets: {
        'DB_USERNAME': ecs.Secret.fromSecretsManager(dbCredentials.secret!, 'username'),
        'DB_PASSWORD': ecs.Secret.fromSecretsManager(dbCredentials.secret!, 'password'),
      },
      healthCheck: EcsInfra.springBootHealthCheckCommand(containerPort, cdk.Duration.seconds(90)),
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSg', {
      vpc,
      allowAllOutbound: true,
    });

    ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(443), 'Outbound HTTPS IPv6');
    ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(80), 'Outbound HTTP IPv6');
    ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.allTcp(), 'Outbound all TCP IPv6 (ECS-to-ECS)');

    const lambdaSgId = cdk.Fn.importValue(`${props.serviceName}:ProxyLambdaSecurityGroupId`);
    const lambdaSg = ec2.SecurityGroup.fromSecurityGroupId(this, 'LambdaSg', lambdaSgId);
    ecsSecurityGroup.addIngressRule(lambdaSg, ec2.Port.tcp(containerPort), 'Allow incoming from API Gateway Lambda');

    // Allow ECS to connect to RDS
    dbInstance.connections.allowFrom(ecsSecurityGroup, ec2.Port.tcp(5432), 'ECS to RDS');

    const cloudMapNamespace = ImportedRessources.getCloudMapNamespace(this);
    const sdService = EcsInfra.createServiceDiscoveryAAAARecord(this, props.serviceName, cloudMapNamespace);

    const ecsService = new ecs.FargateService(this, 'FargateService', {
      serviceName: props.serviceName + '-service',
      cluster: ecsCluster,
      taskDefinition,
      assignPublicIp: false,
      desiredCount: props.minTaskCount,
      vpcSubnets: { subnets: [subnet] },
      circuitBreaker: { rollback: true },
      securityGroups: [ecsSecurityGroup],
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
    });

    const cfnService = ecsService.node.defaultChild as ecs.CfnService;
    cfnService.serviceRegistries = [{ registryArn: sdService.attrArn }];

    EcsInfra.grantDefaultTaskRolePermissions(taskDefinition);

    // SQS Queue
    const requestQueues = SqsInfra.createQueue(this, {
      queueName: props.requestQueueName,
      enableDeadLetterQueue: true,
    });
    SqsInfra.grantReadPermissions(requestQueues, ecsService.taskDefinition.taskRole);

    // Grant Secrets Manager read access
    notificationSecrets.grantRead(ecsService.taskDefinition.taskRole);
  }
}
```

- [ ] **Step 8: Create infra/bin/infra.ts**

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { NotificationServiceStack } from '../lib/service-stack';
import { AWSConstants } from '../../../infrabaseline/lib/constants';
import { ApiStack } from '../../../infraLibrary/lib/stacks/api/api';
import { AuthStack } from '../../../infraLibrary/lib/stacks/verified-permissions/auth-stack';
import path from 'path';

const app = new cdk.App();

const env = {
  account: AWSConstants.AWS_ACCOUNT_ID,
  region: AWSConstants.AWS_REGION,
};

const imageContext = app.node.tryGetContext('imageTag');
const imageTag = imageContext || 'latest';

const serviceNameContext = app.node.tryGetContext('serviceName');
if (!serviceNameContext) {
  throw new Error('Service name context is required. Please provide it using -c serviceName=your-service-name');
}

const containerPort = 8081;

const policyFilePath = path.resolve(__dirname, '..', 'verified-permissions', 'notification-policies.json');
const authStack = new AuthStack(app, 'NotificationAuthStack', {
  env,
  policyFilePath,
  serviceName: serviceNameContext,
});

const apiStack = new ApiStack(app, 'NotificationApiStack', {
  env,
  apiName: 'NotificationServiceAPI',
  description: 'API Gateway for Notification service',
  targetServiceName: serviceNameContext,
  targetPort: containerPort,
  openApiSpecPath: '../src/main/resources/openapi/notification.json',
  authorizerConfig: {
    policyStoreId: authStack.policyStore.policyStore.policyStoreId,
    namespace: authStack.policyConfig.namespace,
    tokenType: 'accessToken',
  },
});

apiStack.addDependency(authStack);

const serviceStack = new NotificationServiceStack(app, 'NotificationServiceStack', {
  env,
  serviceName: serviceNameContext,
  imageVersion: imageTag,
  description: 'Notification service for multi-channel message dispatch',
  containerPort,
  requestQueueName: 'notification-request-queue',
  secretsName: 'msa26/notification/credentials',
  minTaskCount: 1,
  maxTaskCount: 1,
  memory: 512,
  cpu: 256,
});

serviceStack.addDependency(apiStack);
```

- [ ] **Step 9: Install infra dependencies and verify**

Run: `cd notificationService/infra && npm install`
Expected: Successful installation

- [ ] **Step 10: Commit**

```bash
git add notificationService/infra/ notificationService/src/main/resources/openapi/
git commit -m "feat(notification): add CDK infrastructure with RDS, SQS, and Secrets Manager"
```

---

## Task 11: CDK Infrastructure — Response Service

**Files:**
- Create: `responseService/infra/bin/infra.ts`
- Create: `responseService/infra/lib/service-stack.ts`
- Create: `responseService/infra/package.json`
- Create: `responseService/infra/tsconfig.json`
- Create: `responseService/infra/cdk.json`
- Create: `responseService/infra/jest.config.js`
- Create: `responseService/infra/verified-permissions/response-policies.json`
- Create: `responseService/src/main/resources/openapi/response.json`

- [ ] **Step 1: Create package.json**

Same as notification service (copy from Task 10 Step 1), change name to `"response-infra"`.

```json
{
  "name": "response-infra",
  "version": "0.1.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "pretest": "npm ci --prefix ../../infraLibrary",
    "test": "jest",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/jest": "^30",
    "@types/node": "^24.10.1",
    "aws-cdk": "2.1120.0",
    "esbuild": "^0.28.0",
    "jest": "^30",
    "ts-jest": "^29",
    "ts-node": "^10.9.2",
    "typescript": "~5.9.3"
  },
  "dependencies": {
    "@cdklabs/cdk-verified-permissions": "^0.3.3",
    "aws-cdk-lib": "2.253.1",
    "constructs": "^10.5.0",
    "pino": "^10.3.1"
  }
}
```

- [ ] **Step 2: Create tsconfig.json, cdk.json, jest.config.js**

Same content as Task 10 Steps 2-4.

- [ ] **Step 3: Create OpenAPI spec**

File: `responseService/src/main/resources/openapi/response.json`

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Response API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "/api/response",
      "description": "Basepath for the Response API"
    }
  ],
  "paths": {
    "/results": {
      "get": {
        "summary": "Get all review results for an author",
        "parameters": [
          {
            "name": "authorId",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "List of review results",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "$ref": "#/components/schemas/ReviewResult" }
                }
              }
            }
          }
        }
      }
    },
    "/results/{submissionId}": {
      "get": {
        "summary": "Get result for a specific submission",
        "parameters": [
          {
            "name": "submissionId",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Review result",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ReviewResult" }
              }
            }
          }
        }
      }
    },
    "/results/{submissionId}/document": {
      "get": {
        "summary": "Get pre-signed download URL for the review document",
        "parameters": [
          {
            "name": "submissionId",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Download URL",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "downloadUrl": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "ReviewResult": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "submissionId": { "type": "string" },
          "reviewerId": { "type": "string" },
          "authorId": { "type": "string" },
          "finalGrade": { "type": "string" },
          "reviewComments": { "type": "string" },
          "hasDocument": { "type": "boolean" },
          "completedAt": { "type": "string", "format": "date-time" },
          "createdAt": { "type": "string", "format": "date-time" }
        }
      }
    }
  }
}
```

- [ ] **Step 4: Create verified-permissions policies**

File: `responseService/infra/verified-permissions/response-policies.json`

```json
{
    "namespace": "PeerReview",
    "resourceId": "PeerReview",
    "entityTypeNames": {
        "user": "User",
        "group": "UserGroup",
        "application": "Application",
        "action": "Action"
    },
    "policies": [
        {
            "id": "AuthorGetResults",
            "groupName": "Author",
            "actionId": "get /api/response/results",
            "description": "Allow Author to view their review results"
        },
        {
            "id": "AuthorGetResultBySubmission",
            "groupName": "Author",
            "actionId": "get /api/response/results/{submissionId}",
            "description": "Allow Author to view a specific result"
        },
        {
            "id": "AuthorGetDocument",
            "groupName": "Author",
            "actionId": "get /api/response/results/{submissionId}/document",
            "description": "Allow Author to download review document"
        },
        {
            "id": "AdminGetResults",
            "groupName": "Admin",
            "actionId": "get /api/response/results",
            "description": "Allow Admin to view all results"
        },
        {
            "id": "AdminGetResultBySubmission",
            "groupName": "Admin",
            "actionId": "get /api/response/results/{submissionId}",
            "description": "Allow Admin to view a specific result"
        },
        {
            "id": "AdminGetDocument",
            "groupName": "Admin",
            "actionId": "get /api/response/results/{submissionId}/document",
            "description": "Allow Admin to download review document"
        }
    ]
}
```

- [ ] **Step 5: Create service-stack.ts (with RDS + S3)**

```typescript
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { ImportedRessources } from '../../../infraLibrary/lib/importedRessources';
import { EcsInfra } from '../../../infraLibrary/lib/ecs';
import { SqsInfra } from '../../../infraLibrary/lib/sqs';
import { LogsInfra } from '../../../infraLibrary/lib/logs';
import { AWSConstants } from '../../../infrabaseline/lib/constants';

export interface ResponseServiceStackProps extends cdk.StackProps {
  serviceName: string;
  imageVersion: string;
  containerPort: number;
  memory: number;
  cpu: number;
  minTaskCount: number;
  maxTaskCount: number;
  requestQueueName: string;
  s3BucketName: string;
}

export class ResponseServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ResponseServiceStackProps) {
    super(scope, id, props);

    const vpc = ImportedRessources.getVpcByAttributes(this);
    const ecsCluster = ImportedRessources.getECSClusterByAttributes(this, vpc);
    const subnet = EcsInfra.getIpV6Subnet(this);

    const logGroup = LogsInfra.createLogGroup(this, {
      logGroupName: `/ecs/${props.serviceName}`,
    });

    // RDS PostgreSQL
    const dbCredentials = rds.Credentials.fromGeneratedSecret('response_admin', {
      secretName: `${props.serviceName}/db-credentials`,
    });

    const dbInstance = new rds.DatabaseInstance(this, 'ResponseDb', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnets: [subnet] },
      databaseName: 'response',
      credentials: dbCredentials,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // S3 Bucket for review documents
    const documentBucket = new s3.Bucket(this, 'ResponseDocumentsBucket', {
      bucketName: props.s3BucketName,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: props.memory,
      cpu: props.cpu,
    });

    const imageName = EcsInfra.getDefaultImageNameIpv6(props.serviceName, props.imageVersion);
    const containerPort = props.containerPort;

    taskDefinition.addContainer('AppContainer', {
      containerName: props.serviceName,
      image: ecs.ContainerImage.fromRegistry(imageName),
      logging: LogsInfra.createEcsLogDriver(logGroup, props.serviceName),
      portMappings: [{ containerPort, protocol: ecs.Protocol.TCP }],
      environment: {
        'SQS_REQUEST_QUEUE': props.requestQueueName,
        'SERVER_PORT': containerPort.toString(),
        'AWS_REGION': AWSConstants.AWS_REGION,
        'S3_BUCKET_NAME': props.s3BucketName,
        'DB_HOST': dbInstance.dbInstanceEndpointAddress,
        'DB_PORT': dbInstance.dbInstanceEndpointPort,
        'DB_NAME': 'response',
      },
      secrets: {
        'DB_USERNAME': ecs.Secret.fromSecretsManager(dbCredentials.secret!, 'username'),
        'DB_PASSWORD': ecs.Secret.fromSecretsManager(dbCredentials.secret!, 'password'),
      },
      healthCheck: EcsInfra.springBootHealthCheckCommand(containerPort, cdk.Duration.seconds(90)),
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSg', {
      vpc,
      allowAllOutbound: true,
    });

    ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(443), 'Outbound HTTPS IPv6');
    ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(80), 'Outbound HTTP IPv6');
    ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv6(), ec2.Port.allTcp(), 'Outbound all TCP IPv6 (ECS-to-ECS)');

    const lambdaSgId = cdk.Fn.importValue(`${props.serviceName}:ProxyLambdaSecurityGroupId`);
    const lambdaSg = ec2.SecurityGroup.fromSecurityGroupId(this, 'LambdaSg', lambdaSgId);
    ecsSecurityGroup.addIngressRule(lambdaSg, ec2.Port.tcp(containerPort), 'Allow incoming from API Gateway Lambda');

    // Allow ECS to connect to RDS
    dbInstance.connections.allowFrom(ecsSecurityGroup, ec2.Port.tcp(5432), 'ECS to RDS');

    const cloudMapNamespace = ImportedRessources.getCloudMapNamespace(this);
    const sdService = EcsInfra.createServiceDiscoveryAAAARecord(this, props.serviceName, cloudMapNamespace);

    const ecsService = new ecs.FargateService(this, 'FargateService', {
      serviceName: props.serviceName + '-service',
      cluster: ecsCluster,
      taskDefinition,
      assignPublicIp: false,
      desiredCount: props.minTaskCount,
      vpcSubnets: { subnets: [subnet] },
      circuitBreaker: { rollback: true },
      securityGroups: [ecsSecurityGroup],
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
    });

    const cfnService = ecsService.node.defaultChild as ecs.CfnService;
    cfnService.serviceRegistries = [{ registryArn: sdService.attrArn }];

    EcsInfra.grantDefaultTaskRolePermissions(taskDefinition);

    // SQS Queue
    const requestQueues = SqsInfra.createQueue(this, {
      queueName: props.requestQueueName,
      enableDeadLetterQueue: true,
    });
    SqsInfra.grantReadPermissions(requestQueues, ecsService.taskDefinition.taskRole);

    // Grant S3 read access
    documentBucket.grantRead(ecsService.taskDefinition.taskRole);
  }
}
```

- [ ] **Step 6: Create infra/bin/infra.ts**

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ResponseServiceStack } from '../lib/service-stack';
import { AWSConstants } from '../../../infrabaseline/lib/constants';
import { ApiStack } from '../../../infraLibrary/lib/stacks/api/api';
import { AuthStack } from '../../../infraLibrary/lib/stacks/verified-permissions/auth-stack';
import path from 'path';

const app = new cdk.App();

const env = {
  account: AWSConstants.AWS_ACCOUNT_ID,
  region: AWSConstants.AWS_REGION,
};

const imageContext = app.node.tryGetContext('imageTag');
const imageTag = imageContext || 'latest';

const serviceNameContext = app.node.tryGetContext('serviceName');
if (!serviceNameContext) {
  throw new Error('Service name context is required. Please provide it using -c serviceName=your-service-name');
}

const containerPort = 8081;

const policyFilePath = path.resolve(__dirname, '..', 'verified-permissions', 'response-policies.json');
const authStack = new AuthStack(app, 'ResponseAuthStack', {
  env,
  policyFilePath,
  serviceName: serviceNameContext,
});

const apiStack = new ApiStack(app, 'ResponseApiStack', {
  env,
  apiName: 'ResponseServiceAPI',
  description: 'API Gateway for Response service',
  targetServiceName: serviceNameContext,
  targetPort: containerPort,
  openApiSpecPath: '../src/main/resources/openapi/response.json',
  authorizerConfig: {
    policyStoreId: authStack.policyStore.policyStore.policyStoreId,
    namespace: authStack.policyConfig.namespace,
    tokenType: 'accessToken',
  },
});

apiStack.addDependency(authStack);

const serviceStack = new ResponseServiceStack(app, 'ResponseServiceStack', {
  env,
  serviceName: serviceNameContext,
  imageVersion: imageTag,
  description: 'Response service for storing and exposing review results',
  containerPort,
  requestQueueName: 'response-request-queue',
  s3BucketName: 'msa26-peer-review-response-documents',
  minTaskCount: 1,
  maxTaskCount: 1,
  memory: 512,
  cpu: 256,
});

serviceStack.addDependency(apiStack);
```

- [ ] **Step 7: Install infra dependencies and verify**

Run: `cd responseService/infra && npm install`
Expected: Successful installation

- [ ] **Step 8: Commit**

```bash
git add responseService/infra/ responseService/src/main/resources/openapi/
git commit -m "feat(response): add CDK infrastructure with RDS, S3, and SQS"
```

---

## Task 12: CI/CD & CloudFront Integration

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `cloudfront/bin/cloudfront.ts`

- [ ] **Step 1: Add path filters to ci.yml**

Add after the `matching_service_any` filter block:

```yaml
      notification_service_code: ${{ steps.filter.outputs.notification_service_code }}
      notification_service_infra: ${{ steps.filter.outputs.notification_service_infra }}
      notification_service_any: ${{ steps.filter.outputs.notification_service_any }}
      response_service_code: ${{ steps.filter.outputs.response_service_code }}
      response_service_infra: ${{ steps.filter.outputs.response_service_infra }}
      response_service_any: ${{ steps.filter.outputs.response_service_any }}
```

Add filter definitions:

```yaml
            notification_service_code:
              - 'notificationService/src/**'
              - 'notificationService/pom.xml'
              - 'notificationService/Dockerfile'
            notification_service_infra:
              - 'notificationService/infra/**'
            notification_service_any:
              - 'notificationService/**'
              - 'infraLibrary/**'
            response_service_code:
              - 'responseService/src/**'
              - 'responseService/pom.xml'
              - 'responseService/Dockerfile'
            response_service_infra:
              - 'responseService/infra/**'
            response_service_any:
              - 'responseService/**'
              - 'infraLibrary/**'
```

- [ ] **Step 2: Add workflow jobs for both services**

Add after the `matching-service` job:

```yaml
  notification-service:
    needs: [changes, infra-library-tests]
    if: |
      always() && 
      (needs.changes.outputs.notification_service_any == 'true' || github.event_name == 'workflow_dispatch') && 
      (needs['infra-library-tests'].result == 'success' || needs['infra-library-tests'].result == 'skipped')
    uses: ./.github/workflows/reusable-service.yml
    with:
      service_name: notification
      service_path: notificationService
      infra_path: notificationService/infra
      docker_context: notificationService
      ecr_repository: fh-wedel/notification
      run_maven: ${{ needs.changes.outputs.notification_service_code == 'true' || github.event_name == 'workflow_dispatch' }}
      run_infra: ${{ needs.changes.outputs.notification_service_infra == 'true' || needs.changes.outputs.infra_library == 'true' || github.event_name == 'workflow_dispatch' }}
      run_docker: ${{ needs.changes.outputs.notification_service_code == 'true' || github.event_name == 'workflow_dispatch' || github.ref == 'refs/heads/main' }}
      allow_deploy: ${{ github.ref == 'refs/heads/main' || github.event_name == 'workflow_dispatch' }}
      deploy_environment: "fh-wedel-prod"
    secrets: inherit

  response-service:
    needs: [changes, infra-library-tests]
    if: |
      always() && 
      (needs.changes.outputs.response_service_any == 'true' || github.event_name == 'workflow_dispatch') && 
      (needs['infra-library-tests'].result == 'success' || needs['infra-library-tests'].result == 'skipped')
    uses: ./.github/workflows/reusable-service.yml
    with:
      service_name: response
      service_path: responseService
      infra_path: responseService/infra
      docker_context: responseService
      ecr_repository: fh-wedel/response
      run_maven: ${{ needs.changes.outputs.response_service_code == 'true' || github.event_name == 'workflow_dispatch' }}
      run_infra: ${{ needs.changes.outputs.response_service_infra == 'true' || needs.changes.outputs.infra_library == 'true' || github.event_name == 'workflow_dispatch' }}
      run_docker: ${{ needs.changes.outputs.response_service_code == 'true' || github.event_name == 'workflow_dispatch' || github.ref == 'refs/heads/main' }}
      allow_deploy: ${{ github.ref == 'refs/heads/main' || github.event_name == 'workflow_dispatch' }}
      deploy_environment: "fh-wedel-prod"
    secrets: inherit
```

- [ ] **Step 3: Update cloudfront-deploy needs**

Update the `needs` array in the `cloudfront-deploy` job:

```yaml
    needs: [changes, web-ui, template-service, workflow-service, matching-service, notification-service, response-service]
```

Add conditions:

```yaml
      (needs['notification-service'].result == 'success' || needs['notification-service'].result == 'skipped') &&
      (needs['response-service'].result == 'success' || needs['response-service'].result == 'skipped')
```

- [ ] **Step 4: Update cloudfront/bin/cloudfront.ts**

Uncomment/add the service entries:

```typescript
    apiServices: [
        { apiName: 'TemplateServiceAPI', pathPattern: '/api/template/*', enableCaching: true },
        { apiName: 'WorkflowServiceAPI', pathPattern: '/api/workflow/*', enableCaching: true },
        { apiName: 'MatchingServiceAPI', pathPattern: '/api/matching/*', enableCaching: false },
        { apiName: 'NotificationServiceAPI', pathPattern: '/api/notification/*', enableCaching: false },
        { apiName: 'ResponseServiceAPI', pathPattern: '/api/response/*', enableCaching: false },
    ],
```

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml cloudfront/bin/cloudfront.ts
git commit -m "feat: integrate notification and response services into CI/CD and CloudFront"
```

---

## Task 13: ECR Repositories in Baseline

**Files:**
- Modify: `infrabaseline/` (ECR repository stack to add `fh-wedel/notification` and `fh-wedel/response`)

- [ ] **Step 1: Check existing ECR stack for pattern**

Read `infrabaseline/lib/ecr-repository-stack.ts` (or equivalent) and add two new repositories following the existing pattern.

- [ ] **Step 2: Add ECR repositories**

Add `fh-wedel/notification` and `fh-wedel/response` to the ECR repository definitions, following the exact same pattern as `fh-wedel/matching` and `fh-wedel/template`.

- [ ] **Step 3: Commit**

```bash
git add infrabaseline/
git commit -m "feat(baseline): add ECR repositories for notification and response services"
```

---

## Task 14: Final Verification

- [ ] **Step 1: Run all Notification Service tests**

Run: `cd notificationService && mvn clean verify`
Expected: BUILD SUCCESS, all tests pass

- [ ] **Step 2: Run all Response Service tests**

Run: `cd responseService && mvn clean verify`
Expected: BUILD SUCCESS, all tests pass

- [ ] **Step 3: Verify Docker builds**

Run: `docker build -t notification-test notificationService/`
Run: `docker build -t response-test responseService/`
Expected: Both images built successfully

- [ ] **Step 4: Final commit (if any remaining changes)**

```bash
git status
# If clean, done. Otherwise commit remaining changes.
```
