# In-App-Benachrichtigungen für die Glocke — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Navbar-Glocke zeigt echte, user-adressierte In-App-Benachrichtigungen aus dem Notification Service (persistenter Lese-Status, Echtzeit via SSE), gespeist durch echte Trigger aus Matching-, Configuration- und Response-Service.

**Architecture:** Neuer `IN_APP`-Channel im bestehenden pluggable Channel-System des Notification Service persistiert eine `InAppNotification` (eigene Tabelle, Lese-Status) und pusht via SSE. REST-Endpoints (`/me`, `/me/stream`, `/{id}/read`, `/me/read-all`) liefern Inbox + Lese-Operationen, Identität aus `x-auth-principal-id`. Producer-Services senden `NotificationEvent`-JSON (`channels:["IN_APP"]`) an die bestehende `notification-request-queue`, die der vorhandene SQS-Listener verarbeitet.

**Tech Stack:** Java 21 / Spring Boot 4 (JPA/Postgres, SseEmitter), JUnit5 + Mockito + AssertJ, AWS CDK v2 (TypeScript), React + Vite + MUI, `@microsoft/fetch-event-source`.

**Spec:** [docs/superpowers/specs/2026-06-12-in-app-notifications-bell-design.md](../specs/2026-06-12-in-app-notifications-bell-design.md)

**Test-Kommando (Backend, pro Service):** `mvn -f <service>/pom.xml -Dtest=<TestClass> test`
Jede Service ist ein eigenständiges Maven-Projekt (kein Root-Parent-Pom). Das `web-ui` hat kein Test-Setup → Frontend-Tasks werden manuell via `npm run build` + Browser verifiziert.

---

## Phase 1 — Notification Service: In-App-Kern

### Task 1: `IN_APP` zum ChannelType-Enum

**Files:**
- Modify: `notificationService/src/main/java/com/fh_wedel/notification/model/ChannelType.java`

- [ ] **Step 1: Enum-Wert ergänzen**

```java
package com.fh_wedel.notification.model;

public enum ChannelType {
    DISCORD,
    EMAIL,
    SLACK,
    IN_APP
}
```

- [ ] **Step 2: Kompiliert?**

Run: `mvn -f notificationService/pom.xml -q -DskipTests compile`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add notificationService/src/main/java/com/fh_wedel/notification/model/ChannelType.java
git commit -m "feat(notification): add IN_APP channel type"
```

---

### Task 2: `InAppNotification`-Entity + Repository

**Files:**
- Create: `notificationService/src/main/java/com/fh_wedel/notification/model/InAppNotification.java`
- Create: `notificationService/src/main/java/com/fh_wedel/notification/repository/InAppNotificationRepository.java`
- Test: `notificationService/src/test/java/com/fh_wedel/notification/repository/InAppNotificationRepositoryTest.java`

- [ ] **Step 1: Entity erstellen**

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
@Table(name = "in_app_notification",
        indexes = @Index(name = "idx_in_app_user_sub", columnList = "userSub"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InAppNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String userSub;

    @Column(length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false)
    @Builder.Default
    private boolean read = false;

    @Column(nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
```

- [ ] **Step 2: Repository erstellen**

```java
package com.fh_wedel.notification.repository;

import com.fh_wedel.notification.model.InAppNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InAppNotificationRepository extends JpaRepository<InAppNotification, UUID> {
    List<InAppNotification> findByUserSubOrderByCreatedAtDesc(String userSub);
}
```

- [ ] **Step 3: Failing test schreiben** (orientiert an bestehendem `NotificationLogRepositoryTest`, `@DataJpaTest`)

```java
package com.fh_wedel.notification.repository;

import com.fh_wedel.notification.model.InAppNotification;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class InAppNotificationRepositoryTest {

    @Autowired
    private InAppNotificationRepository repository;

    @Test
    void findsByUserSubNewestFirst() {
        repository.save(InAppNotification.builder().userSub("u1").title("old").body("b")
                .createdAt(Instant.parse("2020-01-01T00:00:00Z")).build());
        repository.save(InAppNotification.builder().userSub("u1").title("new").body("b")
                .createdAt(Instant.parse("2021-01-01T00:00:00Z")).build());
        repository.save(InAppNotification.builder().userSub("other").title("x").body("b").build());

        List<InAppNotification> result = repository.findByUserSubOrderByCreatedAtDesc("u1");

        assertThat(result).extracting(InAppNotification::getTitle).containsExactly("new", "old");
    }
}
```

- [ ] **Step 4: Test laufen lassen**

Run: `mvn -f notificationService/pom.xml -Dtest=InAppNotificationRepositoryTest test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add notificationService/src/main/java/com/fh_wedel/notification/model/InAppNotification.java \
        notificationService/src/main/java/com/fh_wedel/notification/repository/InAppNotificationRepository.java \
        notificationService/src/test/java/com/fh_wedel/notification/repository/InAppNotificationRepositoryTest.java
git commit -m "feat(notification): add InAppNotification entity and repository"
```

---

### Task 3: `NotificationDto` (Frontend-Vertrag)

**Files:**
- Create: `notificationService/src/main/java/com/fh_wedel/notification/model/NotificationDto.java`

- [ ] **Step 1: DTO erstellen**

```java
package com.fh_wedel.notification.model;

import java.time.Instant;

public record NotificationDto(
        String id,
        String title,
        String message,
        boolean read,
        Instant date
) {
    public static NotificationDto from(InAppNotification n) {
        return new NotificationDto(
                n.getId().toString(),
                n.getTitle(),
                n.getBody(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
```

- [ ] **Step 2: Kompiliert?**

Run: `mvn -f notificationService/pom.xml -q -DskipTests compile`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add notificationService/src/main/java/com/fh_wedel/notification/model/NotificationDto.java
git commit -m "feat(notification): add NotificationDto"
```

---

### Task 4: `PrincipalNormalizer` (aus Communication übernehmen)

**Files:**
- Create: `notificationService/src/main/java/com/fh_wedel/notification/security/PrincipalNormalizer.java`
- Test: `notificationService/src/test/java/com/fh_wedel/notification/security/PrincipalNormalizerTest.java`

- [ ] **Step 1: Klasse erstellen**

```java
package com.fh_wedel.notification.security;

public class PrincipalNormalizer {

    /**
     * Strips Cedar entity type prefix and Cognito pool prefix from a raw principal ID.
     * Handles: bare sub, "pool|sub", and Cedar PeerReview::User::"pool|sub".
     */
    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        int firstQuote = raw.indexOf('"');
        int lastQuote = raw.lastIndexOf('"');
        String inner = (firstQuote >= 0 && lastQuote > firstQuote)
                ? raw.substring(firstQuote + 1, lastQuote)
                : raw;
        int pipeIndex = inner.lastIndexOf('|');
        if (pipeIndex >= 0 && pipeIndex < inner.length() - 1) {
            return inner.substring(pipeIndex + 1);
        }
        return inner;
    }
}
```

- [ ] **Step 2: Failing test schreiben**

```java
package com.fh_wedel.notification.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PrincipalNormalizerTest {

    @Test
    void extractsSubFromCedarEntity() {
        assertThat(PrincipalNormalizer.normalize("PeerReview::User::\"eu-central-1_abc|sub-123\""))
                .isEqualTo("sub-123");
    }

    @Test
    void extractsSubFromPoolPipeSub() {
        assertThat(PrincipalNormalizer.normalize("eu-central-1_abc|sub-123")).isEqualTo("sub-123");
    }

    @Test
    void returnsBareSubUnchanged() {
        assertThat(PrincipalNormalizer.normalize("sub-123")).isEqualTo("sub-123");
    }
}
```

- [ ] **Step 3: Test laufen lassen**

Run: `mvn -f notificationService/pom.xml -Dtest=PrincipalNormalizerTest test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add notificationService/src/main/java/com/fh_wedel/notification/security/PrincipalNormalizer.java \
        notificationService/src/test/java/com/fh_wedel/notification/security/PrincipalNormalizerTest.java
git commit -m "feat(notification): add PrincipalNormalizer for sub extraction"
```

---

### Task 5: `NotificationSseService` (SSE-Emitter-Verwaltung)

**Files:**
- Create: `notificationService/src/main/java/com/fh_wedel/notification/service/NotificationSseService.java`

- [ ] **Step 1: Service erstellen** (spiegelt ChatService-SSE-Pattern: 25s-Timeout, complete-nach-send, Auto-Detach)

```java
package com.fh_wedel.notification.service;

import com.fh_wedel.notification.model.NotificationDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class NotificationSseService {

    private final ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String userSub) {
        // Timeout < API Gateway 29s, damit idle Verbindungen sauber schließen.
        SseEmitter emitter = new SseEmitter(25000L);
        emitters.computeIfAbsent(userSub, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable onDetach = () -> {
            CopyOnWriteArrayList<SseEmitter> list = emitters.get(userSub);
            if (list != null) {
                list.remove(emitter);
                if (list.isEmpty()) {
                    emitters.remove(userSub);
                }
            }
        };
        emitter.onCompletion(onDetach);
        emitter.onTimeout(onDetach);
        emitter.onError(e -> onDetach.run());
        return emitter;
    }

    public void push(String userSub, NotificationDto dto) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.get(userSub);
        if (list == null || list.isEmpty()) {
            log.debug("No active SSE emitters for user '{}'", userSub);
            return;
        }
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(dto));
                // Sofort schließen, damit der Lambda-Proxy die Response auflöst (< 29s).
                emitter.complete();
            } catch (Exception e) {
                log.warn("Failed to push SSE notification to '{}': {}", userSub, e.getMessage());
                emitter.completeWithError(e);
            }
        }
    }
}
```

- [ ] **Step 2: Kompiliert?**

Run: `mvn -f notificationService/pom.xml -q -DskipTests compile`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add notificationService/src/main/java/com/fh_wedel/notification/service/NotificationSseService.java
git commit -m "feat(notification): add SSE service for live in-app pushes"
```

---

### Task 6: `InAppChannel` (persistiert + pusht)

**Files:**
- Create: `notificationService/src/main/java/com/fh_wedel/notification/channel/InAppChannel.java`
- Test: `notificationService/src/test/java/com/fh_wedel/notification/channel/InAppChannelTest.java`

- [ ] **Step 1: Channel erstellen**

```java
package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.model.ChannelType;
import com.fh_wedel.notification.model.InAppNotification;
import com.fh_wedel.notification.model.NotificationDto;
import com.fh_wedel.notification.repository.InAppNotificationRepository;
import com.fh_wedel.notification.service.NotificationSseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class InAppChannel implements NotificationChannel {

    private final InAppNotificationRepository repository;
    private final NotificationSseService sseService;

    public InAppChannel(InAppNotificationRepository repository, NotificationSseService sseService) {
        this.repository = repository;
        this.sseService = sseService;
    }

    @Override
    public ChannelType getChannelType() {
        return ChannelType.IN_APP;
    }

    @Override
    public void send(String recipient, String subject, String body) {
        InAppNotification saved = repository.save(InAppNotification.builder()
                .userSub(recipient)
                .title(subject)
                .body(body)
                .read(false)
                .build());
        log.info("Stored in-app notification {} for user {}", saved.getId(), recipient);
        sseService.push(recipient, NotificationDto.from(saved));
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
```

- [ ] **Step 2: Failing test schreiben** (Mockito-Stil wie `DiscordChannelTest`)

```java
package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.model.ChannelType;
import com.fh_wedel.notification.model.InAppNotification;
import com.fh_wedel.notification.repository.InAppNotificationRepository;
import com.fh_wedel.notification.service.NotificationSseService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InAppChannelTest {

    @Mock private InAppNotificationRepository repository;
    @Mock private NotificationSseService sseService;
    @InjectMocks private InAppChannel channel;

    @Test
    void returnsInAppChannelTypeAndIsEnabled() {
        assertThat(channel.getChannelType()).isEqualTo(ChannelType.IN_APP);
        assertThat(channel.isEnabled()).isTrue();
    }

    @Test
    void persistsNotificationAndPushesSse() {
        when(repository.save(any(InAppNotification.class))).thenAnswer(inv -> {
            InAppNotification n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        channel.send("sub-1", "Review Assigned", "You have been assigned");

        ArgumentCaptor<InAppNotification> captor = ArgumentCaptor.forClass(InAppNotification.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getUserSub()).isEqualTo("sub-1");
        assertThat(captor.getValue().getTitle()).isEqualTo("Review Assigned");
        assertThat(captor.getValue().isRead()).isFalse();

        verify(sseService).push(eq("sub-1"), any());
    }
}
```

- [ ] **Step 3: Test laufen lassen**

Run: `mvn -f notificationService/pom.xml -Dtest=InAppChannelTest test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add notificationService/src/main/java/com/fh_wedel/notification/channel/InAppChannel.java \
        notificationService/src/test/java/com/fh_wedel/notification/channel/InAppChannelTest.java
git commit -m "feat(notification): add InAppChannel persisting and pushing notifications"
```

---

### Task 7: `InAppNotificationService` (Inbox-Queries + Lese-Operationen)

**Files:**
- Create: `notificationService/src/main/java/com/fh_wedel/notification/service/InAppNotificationService.java`
- Test: `notificationService/src/test/java/com/fh_wedel/notification/service/InAppNotificationServiceTest.java`

- [ ] **Step 1: Service erstellen**

```java
package com.fh_wedel.notification.service;

import com.fh_wedel.notification.model.InAppNotification;
import com.fh_wedel.notification.model.NotificationDto;
import com.fh_wedel.notification.repository.InAppNotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class InAppNotificationService {

    private final InAppNotificationRepository repository;

    public InAppNotificationService(InAppNotificationRepository repository) {
        this.repository = repository;
    }

    public List<NotificationDto> listForUser(String userSub) {
        return repository.findByUserSubOrderByCreatedAtDesc(userSub).stream()
                .map(NotificationDto::from)
                .toList();
    }

    @Transactional
    public boolean markRead(String userSub, UUID id) {
        return repository.findById(id)
                .filter(n -> n.getUserSub().equals(userSub))
                .map(n -> {
                    n.setRead(true);
                    repository.save(n);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public void markAllRead(String userSub) {
        List<InAppNotification> list = repository.findByUserSubOrderByCreatedAtDesc(userSub);
        list.forEach(n -> n.setRead(true));
        repository.saveAll(list);
    }
}
```

- [ ] **Step 2: Failing test schreiben**

```java
package com.fh_wedel.notification.service;

import com.fh_wedel.notification.model.InAppNotification;
import com.fh_wedel.notification.repository.InAppNotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InAppNotificationServiceTest {

    @Mock private InAppNotificationRepository repository;
    @InjectMocks private InAppNotificationService service;

    @Test
    void markReadOnlyWhenOwnerMatches() {
        UUID id = UUID.randomUUID();
        InAppNotification n = InAppNotification.builder().id(id).userSub("owner").title("t").body("b").build();
        when(repository.findById(id)).thenReturn(Optional.of(n));

        assertThat(service.markRead("owner", id)).isTrue();
        verify(repository).save(any(InAppNotification.class));
        assertThat(n.isRead()).isTrue();
    }

    @Test
    void markReadFailsForForeignUser() {
        UUID id = UUID.randomUUID();
        InAppNotification n = InAppNotification.builder().id(id).userSub("owner").title("t").body("b").build();
        when(repository.findById(id)).thenReturn(Optional.of(n));

        assertThat(service.markRead("intruder", id)).isFalse();
        verify(repository, never()).save(any());
    }

    @Test
    void markReadFailsWhenMissing() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());
        assertThat(service.markRead("owner", id)).isFalse();
    }
}
```

- [ ] **Step 3: Test laufen lassen**

Run: `mvn -f notificationService/pom.xml -Dtest=InAppNotificationServiceTest test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add notificationService/src/main/java/com/fh_wedel/notification/service/InAppNotificationService.java \
        notificationService/src/test/java/com/fh_wedel/notification/service/InAppNotificationServiceTest.java
git commit -m "feat(notification): add InAppNotificationService with ownership-checked reads"
```

---

### Task 8: `InboxController` (REST + SSE Endpoints)

**Files:**
- Create: `notificationService/src/main/java/com/fh_wedel/notification/controller/InboxController.java`
- Test: `notificationService/src/test/java/com/fh_wedel/notification/controller/InboxControllerTest.java`

- [ ] **Step 1: Controller erstellen**

```java
package com.fh_wedel.notification.controller;

import com.fh_wedel.notification.model.NotificationDto;
import com.fh_wedel.notification.security.PrincipalNormalizer;
import com.fh_wedel.notification.service.InAppNotificationService;
import com.fh_wedel.notification.service.NotificationSseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notification")
@Slf4j
public class InboxController {

    private final InAppNotificationService service;
    private final NotificationSseService sseService;

    public InboxController(InAppNotificationService service, NotificationSseService sseService) {
        this.service = service;
        this.sseService = sseService;
    }

    private String requireSub(String principalId) {
        if (principalId == null || principalId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing x-auth-principal-id header");
        }
        return PrincipalNormalizer.normalize(principalId);
    }

    @GetMapping("/me")
    public List<NotificationDto> myNotifications(
            @RequestHeader(value = "x-auth-principal-id", required = false) String principalId) {
        return service.listForUser(requireSub(principalId));
    }

    @GetMapping(value = "/me/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @RequestHeader(value = "x-auth-principal-id", required = false) String principalId) {
        return sseService.subscribe(requireSub(principalId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable UUID id,
            @RequestHeader(value = "x-auth-principal-id", required = false) String principalId) {
        boolean ok = service.markRead(requireSub(principalId), id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/me/read-all")
    public ResponseEntity<Void> markAllRead(
            @RequestHeader(value = "x-auth-principal-id", required = false) String principalId) {
        service.markAllRead(requireSub(principalId));
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 2: Failing test schreiben** (pure Mockito, kein `@WebMvcTest` — siehe AGENTS.md)

```java
package com.fh_wedel.notification.controller;

import com.fh_wedel.notification.model.NotificationDto;
import com.fh_wedel.notification.service.InAppNotificationService;
import com.fh_wedel.notification.service.NotificationSseService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InboxControllerTest {

    @Mock private InAppNotificationService service;
    @Mock private NotificationSseService sseService;
    @InjectMocks private InboxController controller;

    private static final String PRINCIPAL = "PeerReview::User::\"pool|sub-1\"";

    @Test
    void returnsNotificationsForCaller() {
        when(service.listForUser("sub-1"))
                .thenReturn(List.of(new NotificationDto("id", "t", "m", false, Instant.now())));

        List<NotificationDto> result = controller.myNotifications(PRINCIPAL);

        assertThat(result).hasSize(1);
    }

    @Test
    void rejectsMissingPrincipalHeader() {
        assertThatThrownBy(() -> controller.myNotifications(null))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void markReadReturns404WhenNotOwned() {
        UUID id = UUID.randomUUID();
        when(service.markRead("sub-1", id)).thenReturn(false);

        assertThat(controller.markRead(id, PRINCIPAL).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void markReadReturns204WhenOwned() {
        UUID id = UUID.randomUUID();
        when(service.markRead("sub-1", id)).thenReturn(true);

        assertThat(controller.markRead(id, PRINCIPAL).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }
}
```

- [ ] **Step 3: Test laufen lassen**

Run: `mvn -f notificationService/pom.xml -Dtest=InboxControllerTest test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add notificationService/src/main/java/com/fh_wedel/notification/controller/InboxController.java \
        notificationService/src/test/java/com/fh_wedel/notification/controller/InboxControllerTest.java
git commit -m "feat(notification): add inbox REST + SSE endpoints"
```

---

### Task 9: Endpoints in OpenAPI-Spec + Cedar-Policies registrieren

> **Warum:** Das API Gateway wird strikt aus `notification.json` gebaut (`enableGreedyProxy=false`). Pfade, die nicht in der Spec stehen, werden nicht geroutet (403). Zusätzlich macht der AVP/Cedar-Authorizer exact-match auf `actionId = "${method} ${event.resource}"` — jeder Pfad braucht passende Policies (siehe AGENTS.md).

**Files:**
- Modify: `notificationService/src/main/resources/openapi/notification.json`
- Modify: `notificationService/infra/verified-permissions/notification-policies.json`

- [ ] **Step 1: Vier Pfade in `notification.json` ergänzen** (unter `"paths"`, neben `/send`)

```json
    "/me": {
      "get": {
        "summary": "List the caller's in-app notifications",
        "responses": {
          "200": {
            "description": "List of notifications",
            "content": {
              "application/json": {
                "schema": { "type": "array", "items": { "type": "object" } }
              }
            }
          }
        }
      }
    },
    "/me/stream": {
      "get": {
        "summary": "SSE stream of new in-app notifications for the caller",
        "responses": { "200": { "description": "text/event-stream" } }
      }
    },
    "/me/read-all": {
      "post": {
        "summary": "Mark all of the caller's notifications as read",
        "responses": { "204": { "description": "Marked all read" } }
      }
    },
    "/{id}/read": {
      "patch": {
        "summary": "Mark a single notification as read",
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "204": { "description": "Marked read" },
          "404": { "description": "Not found or not owned" }
        }
      }
    }
```

> **Hinweis zur Reihenfolge:** `/me/read-all` als eigener Pfad vor `/{id}/read` eintragen — `read-all` darf nicht versehentlich als `{id}=me` interpretiert werden. Spring matched die statischen Segmente `/me/read-all` vor der Variable, daher ist die Trennung in `/me/...` und `/{id}/read` eindeutig.

- [ ] **Step 2: JSON-Validität prüfen**

Run: `python3 -m json.tool notificationService/src/main/resources/openapi/notification.json > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 3: Cedar-Policies in `notification-policies.json` ergänzen** (in das `"policies"`-Array, zusätzlich zu den beiden bestehenden Send-Policies). Pro Endpoint je eine Policy für die Gruppen `Admin`, `Author`, `Reviewer`, `ExaminationOfficer`:

```json
        { "id": "AdminInboxList",            "groupName": "Admin",              "actionId": "get /api/notification/me",            "description": "Allow Admin to list own in-app notifications" },
        { "id": "AuthorInboxList",           "groupName": "Author",             "actionId": "get /api/notification/me",            "description": "Allow Author to list own in-app notifications" },
        { "id": "ReviewerInboxList",         "groupName": "Reviewer",           "actionId": "get /api/notification/me",            "description": "Allow Reviewer to list own in-app notifications" },
        { "id": "ExaminerInboxList",         "groupName": "ExaminationOfficer", "actionId": "get /api/notification/me",            "description": "Allow ExaminationOfficer to list own in-app notifications" },

        { "id": "AdminInboxStream",          "groupName": "Admin",              "actionId": "get /api/notification/me/stream",     "description": "Allow Admin to stream in-app notifications" },
        { "id": "AuthorInboxStream",         "groupName": "Author",             "actionId": "get /api/notification/me/stream",     "description": "Allow Author to stream in-app notifications" },
        { "id": "ReviewerInboxStream",       "groupName": "Reviewer",           "actionId": "get /api/notification/me/stream",     "description": "Allow Reviewer to stream in-app notifications" },
        { "id": "ExaminerInboxStream",       "groupName": "ExaminationOfficer", "actionId": "get /api/notification/me/stream",     "description": "Allow ExaminationOfficer to stream in-app notifications" },

        { "id": "AdminInboxReadAll",         "groupName": "Admin",              "actionId": "post /api/notification/me/read-all",  "description": "Allow Admin to mark all read" },
        { "id": "AuthorInboxReadAll",        "groupName": "Author",             "actionId": "post /api/notification/me/read-all",  "description": "Allow Author to mark all read" },
        { "id": "ReviewerInboxReadAll",      "groupName": "Reviewer",           "actionId": "post /api/notification/me/read-all",  "description": "Allow Reviewer to mark all read" },
        { "id": "ExaminerInboxReadAll",      "groupName": "ExaminationOfficer", "actionId": "post /api/notification/me/read-all",  "description": "Allow ExaminationOfficer to mark all read" },

        { "id": "AdminInboxReadOne",         "groupName": "Admin",              "actionId": "patch /api/notification/{id}/read",   "description": "Allow Admin to mark one read" },
        { "id": "AuthorInboxReadOne",        "groupName": "Author",             "actionId": "patch /api/notification/{id}/read",   "description": "Allow Author to mark one read" },
        { "id": "ReviewerInboxReadOne",      "groupName": "Reviewer",           "actionId": "patch /api/notification/{id}/read",   "description": "Allow Reviewer to mark one read" },
        { "id": "ExaminerInboxReadOne",      "groupName": "ExaminationOfficer", "actionId": "patch /api/notification/{id}/read",   "description": "Allow ExaminationOfficer to mark one read" }
```

> Die exakten Gruppennamen (`ExaminationOfficer` etc.) gegen die bestehenden Einträge in `communicationService/infra/verified-permissions/communication-policies.json` abgleichen und bei Abweichung dort übernehmen.

- [ ] **Step 4: JSON-Validität prüfen**

Run: `python3 -m json.tool notificationService/infra/verified-permissions/notification-policies.json > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add notificationService/src/main/resources/openapi/notification.json \
        notificationService/infra/verified-permissions/notification-policies.json
git commit -m "feat(notification): register inbox endpoints in OpenAPI spec and Cedar policies"
```

---

## Phase 2 — Producer-Trigger

### Task 10: `NotificationEvent`-DTO im Matching Service + Property

**Files:**
- Create: `matchingService/src/main/java/com/fh_wedel/matching/model/events/NotificationEvent.java`
- Modify: `matchingService/src/main/resources/application.properties`

- [ ] **Step 1: Lokales Event-Record erstellen** (Feld `channels` als `List<String>` → der Empfänger mappt `"IN_APP"` auf seinen Enum)

```java
package com.fh_wedel.matching.model.events;

import java.util.List;
import java.util.Map;

public record NotificationEvent(
        String eventType,
        List<String> channels,
        String recipientUserId,
        String subject,
        String body,
        Map<String, String> metadata
) {}
```

- [ ] **Step 2: Property ergänzen** (in `application.properties` nach `aws.sqs.next.request.queue-name`)

```properties
aws.sqs.notification.queue-name=${SQS_NOTIFICATION_QUEUE:}
```

- [ ] **Step 3: Kompiliert?**

Run: `mvn -f matchingService/pom.xml -q -DskipTests compile`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add matchingService/src/main/java/com/fh_wedel/matching/model/events/NotificationEvent.java \
        matchingService/src/main/resources/application.properties
git commit -m "feat(matching): add NotificationEvent DTO and notification queue config"
```

---

### Task 11: Matching-Trigger #1 (Reviewer zugewiesen) + #2 (Matching fehlgeschlagen)

**Files:**
- Modify: `matchingService/src/main/java/com/fh_wedel/matching/service/MatchingService.java`
- Test: `matchingService/src/test/java/com/fh_wedel/matching/service/MatchingServiceTest.java` (vorhandene Testklasse erweitern)

- [ ] **Step 1: Konstruktor + Helper + Aufrufe ergänzen**

Imports ergänzen (oben bei den `java.util`-Imports):

```java
import java.util.Map;
import com.fh_wedel.matching.model.events.NotificationEvent;
```

Feld + Konstruktor-Parameter ergänzen (zum bestehenden Konstruktor):

```java
    private final String notificationQueueName;
```

Den Konstruktor um den Parameter erweitern:

```java
    public MatchingService(CognitoService cognitoService,
                           MatchRepository matchRepository,
                           SqsTemplate sqsTemplate,
                           ObjectMapper objectMapper,
                           @Value("${aws.sqs.next.request.queue-name}") String responseQueueName,
                           @Value("${aws.sqs.notification.queue-name}") String notificationQueueName) {
        this.cognitoService = cognitoService;
        this.matchRepository = matchRepository;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.responseQueueName = responseQueueName;
        this.notificationQueueName = notificationQueueName;
    }
```

Helper-Methode am Ende der Klasse ergänzen:

```java
    /**
     * Sends an IN_APP NotificationEvent to the notification request queue.
     * Skips silently when no notification queue is configured (e.g. local dev).
     */
    private void sendInAppNotification(String recipientSub, String subject, String body, String submissionId) {
        if (notificationQueueName == null || notificationQueueName.isBlank()) {
            log.warn("No notification queue configured. Skipping in-app notification for {}", recipientSub);
            return;
        }
        NotificationEvent event = new NotificationEvent(
                "MATCHING",
                List.of("IN_APP"),
                recipientSub,
                subject,
                body,
                Map.of("submissionId", submissionId));
        try {
            sqsTemplate.send(notificationQueueName, objectMapper.writeValueAsString(event));
            log.info("Sent in-app notification to '{}' for submission {}", recipientSub, submissionId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize in-app notification for {}", recipientSub, e);
        }
    }
```

Im FAILED-Branch direkt **vor** `return; // No SQS event on failure`:

```java
            sendInAppNotification(submitterId, "Matching Failed",
                    "Matching failed for your submission: " + reason, submissionId);
```

**Nach** `sendSuccessEvent(submissionId);` (Ende von `processMatchingRequest`):

```java
        for (MatchRecord match : matchRecords) {
            sendInAppNotification(match.getExaminerId(),
                    "Review Assigned",
                    "You have been assigned to review submission " + submissionId,
                    submissionId);
        }
```

- [ ] **Step 2: Failing test ergänzen** — den bestehenden Konstruktoraufruf in `MatchingServiceTest` um das zusätzliche Argument erweitern (z. B. `"notification-request-queue"`), dann zwei Tests hinzufügen:

```java
    @Test
    void sendsInAppNotificationsToAssignedReviewers() throws Exception {
        // Arrange: genügend Reviewer, sodass Matching erfolgreich ist.
        // (vorhandenes Test-Setup für Erfolgsfall wiederverwenden — listReviewers liefert
        //  mind. numberOfExaminers eligible Reviewer; saveMatchBatch ist gemockt.)
        // Act + Assert: pro Reviewer ein Send an die Notification-Queue mit "Review Assigned".
        // Verifiziere mit ArgumentCaptor auf sqsTemplate.send(eq("notification-request-queue"), captor)
        // und dass das JSON "Review Assigned" sowie "IN_APP" enthält.
    }

    @Test
    void sendsInAppNotificationOnMatchingFailure() throws Exception {
        // Arrange: zu wenige eligible Reviewer → FAILED-Branch.
        // Act + Assert: genau ein Send an die Notification-Queue mit "Matching Failed"
        // und recipientUserId == submitterId.
    }
```

> Konkrete Mock-Verifikation am bestehenden Erfolgs-/Fehlerfall-Setup der Testklasse ausrichten. Beispiel-Assertion:
> ```java
> ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
> verify(sqsTemplate, atLeastOnce()).send(eq("notification-request-queue"), body.capture());
> assertThat(body.getAllValues()).anyMatch(b -> b.contains("Review Assigned") && b.contains("IN_APP"));
> ```

- [ ] **Step 3: Tests laufen lassen**

Run: `mvn -f matchingService/pom.xml -Dtest=MatchingServiceTest test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add matchingService/src/main/java/com/fh_wedel/matching/service/MatchingService.java \
        matchingService/src/test/java/com/fh_wedel/matching/service/MatchingServiceTest.java
git commit -m "feat(matching): emit in-app notifications on reviewer assignment and matching failure"
```

---

### Task 12: Configuration-Trigger #3 (Submission angelegt)

**Files:**
- Create: `configuration-service/src/main/java/com/fh_wedel/configuration/model/NotificationEvent.java`
- Modify: `configuration-service/src/main/java/com/fh_wedel/configuration/service/ConfigurationService.java`
- Modify: `configuration-service/src/main/resources/application.properties`
- Test: `configuration-service/src/test/java/com/fh_wedel/configuration/service/ConfigurationServiceTest.java` (falls vorhanden erweitern, sonst neu)

- [ ] **Step 1: Event-DTO erstellen**

```java
package com.fh_wedel.configuration.model;

import java.util.List;
import java.util.Map;

public record NotificationEvent(
        String eventType,
        List<String> channels,
        String recipientUserId,
        String subject,
        String body,
        Map<String, String> metadata
) {}
```

- [ ] **Step 2: Property ergänzen**

```properties
aws.sqs.notification-queue-name=${SQS_NOTIFICATION_QUEUE:}
```

- [ ] **Step 3: Service erweitern** — Feld + Konstruktor-Parameter + Emit nach `repository.saveConfiguration`

Feld + Import:

```java
import java.util.Map;
import com.fh_wedel.configuration.model.NotificationEvent;
```

```java
    private final String notificationQueueName;
```

Konstruktor um Parameter erweitern:

```java
    public ConfigurationService(ConfigurationRepository repository,
                                SqsTemplate sqsTemplate,
                                ObjectMapper objectMapper,
                                @Value("${aws.sqs.matching-request-queue-name}") String matchingQueueName,
                                @Value("${aws.sqs.notification-queue-name}") String notificationQueueName) {
        this.repository = repository;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.matchingQueueName = matchingQueueName;
        this.notificationQueueName = notificationQueueName;
    }
```

In `createConfiguration`, direkt **nach** `repository.saveConfiguration(config, mappings);`:

```java
        // Notify the author that their submission was created.
        sendSubmissionCreatedNotification(submissionId, authorIds.get(0), title);
```

Helper am Ende der Klasse:

```java
    private void sendSubmissionCreatedNotification(String submissionId, String authorSub, String title) {
        if (notificationQueueName == null || notificationQueueName.isBlank()) {
            log.warn("No notification queue configured. Skipping submission-created notification for {}", submissionId);
            return;
        }
        NotificationEvent event = new NotificationEvent(
                "SUBMISSION_CREATED",
                List.of("IN_APP"),
                authorSub,
                "Submission Created",
                "Your submission '" + title + "' was submitted.",
                Map.of("submissionId", submissionId));
        try {
            sqsTemplate.send(notificationQueueName, objectMapper.writeValueAsString(event));
            log.info("Sent submission-created notification to '{}' for submission {}", authorSub, submissionId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize submission-created notification for {}", submissionId, e);
        }
    }
```

- [ ] **Step 4: Failing test schreiben/erweitern**

```java
    @Test
    void sendsSubmissionCreatedNotificationToAuthor() throws Exception {
        // service mit notificationQueueName="notification-request-queue" konstruieren.
        // createConfiguration(...) mit authorIds=List.of("author-sub") aufrufen.
        // Verify: sqsTemplate.send(eq("notification-request-queue"), body) mit
        //         body enthält "Submission Created", "IN_APP" und "author-sub".
    }
```

- [ ] **Step 5: Tests laufen lassen**

Run: `mvn -f configuration-service/pom.xml -Dtest=ConfigurationServiceTest test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add configuration-service/src/main/java/com/fh_wedel/configuration/model/NotificationEvent.java \
        configuration-service/src/main/java/com/fh_wedel/configuration/service/ConfigurationService.java \
        configuration-service/src/main/resources/application.properties \
        configuration-service/src/test/java/com/fh_wedel/configuration/service/ConfigurationServiceTest.java
git commit -m "feat(configuration): emit in-app notification when a submission is created"
```

---

### Task 13: Response-Trigger #4 (Review-Ergebnis verfügbar)

**Files:**
- Create: `responseService/src/main/java/com/fh_wedel/response/model/NotificationEvent.java`
- Modify: `responseService/src/main/java/com/fh_wedel/response/service/ResultService.java`
- Modify: `responseService/src/main/resources/application.properties`
- Test: `responseService/src/test/java/com/fh_wedel/response/service/ResultServiceTest.java`

- [ ] **Step 1: Event-DTO erstellen**

```java
package com.fh_wedel.response.model;

import java.util.List;
import java.util.Map;

public record NotificationEvent(
        String eventType,
        List<String> channels,
        String recipientUserId,
        String subject,
        String body,
        Map<String, String> metadata
) {}
```

- [ ] **Step 2: Property ergänzen**

```properties
aws.sqs.notification.queue-name=${SQS_NOTIFICATION_QUEUE:}
```

- [ ] **Step 3: `ResultService` erweitern** — `SqsTemplate` + `ObjectMapper` + Queue-Name injizieren, in `save` emittieren

Imports:

```java
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.response.model.NotificationEvent;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.Map;
```

Felder + Konstruktor:

```java
    private final ReviewResultRepository repository;
    private final DocumentStorageService documentStorageService;
    private final SqsTemplate sqsTemplate;
    private final ObjectMapper objectMapper;
    private final String notificationQueueName;

    public ResultService(ReviewResultRepository repository,
                         DocumentStorageService documentStorageService,
                         SqsTemplate sqsTemplate,
                         ObjectMapper objectMapper,
                         @Value("${aws.sqs.notification.queue-name}") String notificationQueueName) {
        this.repository = repository;
        this.documentStorageService = documentStorageService;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.notificationQueueName = notificationQueueName;
    }
```

`save`-Methode erweitern:

```java
    public ReviewResult save(ReviewResult result) {
        log.info("Saving review result for submission: {}", result.getSubmissionId());
        ReviewResult saved = repository.save(result);
        sendResultAvailableNotification(saved);
        return saved;
    }

    private void sendResultAvailableNotification(ReviewResult result) {
        if (notificationQueueName == null || notificationQueueName.isBlank()) {
            log.warn("No notification queue configured. Skipping result-available notification for {}",
                    result.getSubmissionId());
            return;
        }
        NotificationEvent event = new NotificationEvent(
                "REVIEW_RESULT_AVAILABLE",
                List.of("IN_APP"),
                result.getAuthorId(),
                "Review Result Available",
                "A review result is available for submission " + result.getSubmissionId() + ".",
                Map.of("submissionId", result.getSubmissionId()));
        try {
            sqsTemplate.send(notificationQueueName, objectMapper.writeValueAsString(event));
            log.info("Sent result-available notification to '{}' for submission {}",
                    result.getAuthorId(), result.getSubmissionId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize result-available notification for {}", result.getSubmissionId(), e);
        }
    }
```

- [ ] **Step 4: Failing test schreiben**

```java
package com.fh_wedel.response.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.repository.ReviewResultRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResultServiceTest {

    @Mock private ReviewResultRepository repository;
    @Mock private DocumentStorageService documentStorageService;
    @Mock private SqsTemplate sqsTemplate;

    @Test
    void emitsResultAvailableNotificationOnSave() {
        ResultService service = new ResultService(repository, documentStorageService,
                sqsTemplate, new ObjectMapper(), "notification-request-queue");

        ReviewResult result = ReviewResult.builder()
                .submissionId("sub-9").authorId("author-1").reviewerId("rev-1")
                .completedAt(Instant.now()).build();
        when(repository.save(any(ReviewResult.class))).thenReturn(result);

        service.save(result);

        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(sqsTemplate).send(eq("notification-request-queue"), body.capture());
        assertThat(body.getValue()).contains("Review Result Available").contains("IN_APP").contains("author-1");
    }
}
```

- [ ] **Step 5: Test laufen lassen**

Run: `mvn -f responseService/pom.xml -Dtest=ResultServiceTest test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add responseService/src/main/java/com/fh_wedel/response/model/NotificationEvent.java \
        responseService/src/main/java/com/fh_wedel/response/service/ResultService.java \
        responseService/src/main/resources/application.properties \
        responseService/src/test/java/com/fh_wedel/response/service/ResultServiceTest.java
git commit -m "feat(response): emit in-app notification when a review result is stored"
```

---

## Phase 3 — Infrastruktur (Producer dürfen in die Notification-Queue schreiben)

> **Muster** (bereits im Configuration-Stack für `matching-request-queue` vorhanden): Env-Var setzen +
> `taskRole.addToPrincipalPolicy` mit `sqs:SendMessage` auf die ARN der `notification-request-queue`
> (Konstanten aus `AWSConstants`). Kein Export im Notification-Stack nötig — die Queue existiert dort
> bereits unter festem Namen.

### Task 14: Matching-Stack — Write-Grant + Env

**Files:**
- Modify: `matchingService/infra/lib/service-stack.ts`

- [ ] **Step 1: Env-Var ergänzen** (im `environment`-Objekt der Container-Definition, neben `SQS_NEXT_REQUEST_QUEUE`)

```typescript
        'SQS_NOTIFICATION_QUEUE': 'notification-request-queue',
```

- [ ] **Step 2: Write-Grant ergänzen** (bei den übrigen `taskRole`-Policies; `iam`-Import oben sicherstellen: `import * as iam from 'aws-cdk-lib/aws-iam';`)

```typescript
        ecsService.taskDefinition.taskRole.addToPrincipalPolicy(
            new iam.PolicyStatement({
                actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl'],
                resources: [
                    `arn:aws:sqs:${AWSConstants.AWS_REGION}:${AWSConstants.AWS_ACCOUNT_ID}:notification-request-queue`,
                ],
            }),
        );
```

- [ ] **Step 3: Infra-Tests/Synth prüfen**

Run: `cd matchingService/infra && npm run test && cd -`
Expected: PASS (oder, falls keine Tests: `npx cdk synth -c serviceName=matching-service > /dev/null && echo OK`)

- [ ] **Step 4: Commit**

```bash
git add matchingService/infra/lib/service-stack.ts
git commit -m "feat(matching-infra): grant send to notification queue and inject env"
```

---

### Task 15: Configuration-Stack — Write-Grant + Env

**Files:**
- Modify: `configuration-service/infra/lib/service-stack.ts`

- [ ] **Step 1: Env-Var ergänzen** (im `environment`-Objekt, neben `SQS_MATCHING_REQUEST_QUEUE`)

```typescript
        'SQS_NOTIFICATION_QUEUE': 'notification-request-queue',
```

- [ ] **Step 2: Write-Grant ergänzen** (analog zur bestehenden `matching-request-queue`-Policy in derselben Datei, Zeilen ~156-161, zweite Resource-ARN hinzufügen ODER separate Statement)

```typescript
        taskDefinition.taskRole.addToPrincipalPolicy(
            new iam.PolicyStatement({
                actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl'],
                resources: [
                    `arn:aws:sqs:${AWSConstants.AWS_REGION}:${AWSConstants.AWS_ACCOUNT_ID}:notification-request-queue`,
                ],
            }),
        );
```

- [ ] **Step 3: Infra-Synth prüfen**

Run: `cd configuration-service/infra && (npm run test || npx cdk synth -c serviceName=configuration-service > /dev/null) && cd -`
Expected: PASS / OK

- [ ] **Step 4: Commit**

```bash
git add configuration-service/infra/lib/service-stack.ts
git commit -m "feat(configuration-infra): grant send to notification queue and inject env"
```

---

### Task 16: Response-Stack — Write-Grant + Env

**Files:**
- Modify: `responseService/infra/lib/service-stack.ts`

- [ ] **Step 1: Env-Var ergänzen** (im `environment`-Objekt, neben `SQS_REQUEST_QUEUE`)

```typescript
        'SQS_NOTIFICATION_QUEUE': 'notification-request-queue',
```

- [ ] **Step 2: Write-Grant ergänzen** (`iam`-Import oben sicherstellen)

```typescript
        ecsService.taskDefinition.taskRole.addToPrincipalPolicy(
            new iam.PolicyStatement({
                actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl'],
                resources: [
                    `arn:aws:sqs:${AWSConstants.AWS_REGION}:${AWSConstants.AWS_ACCOUNT_ID}:notification-request-queue`,
                ],
            }),
        );
```

- [ ] **Step 3: Infra-Synth prüfen**

Run: `cd responseService/infra && (npm run test || npx cdk synth -c serviceName=response-service > /dev/null) && cd -`
Expected: PASS / OK

- [ ] **Step 4: Commit**

```bash
git add responseService/infra/lib/service-stack.ts
git commit -m "feat(response-infra): grant send to notification queue and inject env"
```

---

## Phase 4 — Frontend (Glocke)

### Task 17: API-Client `notification.ts`

**Files:**
- Create: `web-ui/src/api/notification.ts`

- [ ] **Step 1: Client erstellen** (Header-/Error-Pattern wie `communication.ts`)

```typescript
import { fetchEventSource } from '@microsoft/fetch-event-source';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
}

const getHeaders = () => {
  const token = sessionStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const fetchNotifications = async (): Promise<Notification[]> => {
  const response = await fetch('/api/notification/me', { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
};

export const markNotificationRead = async (id: string): Promise<void> => {
  const response = await fetch(`/api/notification/${id}/read`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to mark notification read');
};

export const markAllNotificationsRead = async (): Promise<void> => {
  const response = await fetch('/api/notification/me/read-all', {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to mark all notifications read');
};

/**
 * Opens an SSE stream of new notifications. The backend completes the emitter
 * after each event (Lambda-proxy/API-Gateway 29s constraint), so fetchEventSource
 * reconnects automatically. Returns an AbortController to close the stream.
 */
export const streamNotifications = (
  onNotification: (n: Notification) => void,
): AbortController => {
  const token = sessionStorage.getItem('access_token');
  const abortController = new AbortController();

  fetchEventSource('/api/notification/me/stream', {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      Accept: 'text/event-stream',
    },
    signal: abortController.signal,
    async onmessage(ev) {
      if (ev.event === 'notification') {
        try {
          onNotification(JSON.parse(ev.data) as Notification);
        } catch (err) {
          console.error('Error parsing notification SSE', err);
        }
      }
    },
    onclose() {
      // Clean 200 close after each event → throw routes to onerror → library reconnects.
      throw new Error('SSE stream closed by server — reconnecting');
    },
    onerror() {
      // Return nothing — fetchEventSource retries on its own.
    },
  }).catch(() => {
    // Aborted or permanently failed — ignore.
  });

  return abortController;
};
```

- [ ] **Step 2: TypeScript-Build prüfen**

Run: `cd web-ui && npx tsc --noEmit && cd -`
Expected: keine Fehler

- [ ] **Step 3: Commit**

```bash
git add web-ui/src/api/notification.ts
git commit -m "feat(web-ui): add notification API client with SSE stream"
```

---

### Task 18: Navbar an echte Notifications anbinden + Stub entfernen

**Files:**
- Modify: `web-ui/src/components/Navbar.tsx`
- Delete: `web-ui/src/stubs/notifications.ts`

- [ ] **Step 1: Imports anpassen** — `mockNotifications`-Import entfernen, API-Client importieren

Ersetze:
```typescript
import { mockNotifications } from '../stubs/notifications';
```
durch:
```typescript
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  streamNotifications,
  type Notification,
} from '../api/notification';
```

- [ ] **Step 2: State + Laden + SSE umstellen**

Ersetze:
```typescript
  const [notifications, setNotifications] = useState(mockNotifications);
```
durch:
```typescript
  const [notifications, setNotifications] = useState<Notification[]>([]);
```

Nach dem bestehenden `useEffect` (userMap) einen neuen `useEffect` einfügen:
```typescript
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications()
      .then(setNotifications)
      .catch(err => console.error('Failed to load notifications', err));

    const controller = streamNotifications((n) => {
      setNotifications(prev =>
        prev.some(existing => existing.id === n.id) ? prev : [n, ...prev]
      );
    });

    return () => controller.abort();
  }, [isAuthenticated]);
```

- [ ] **Step 3: Handler auf Backend umstellen**

Ersetze:
```typescript
  const handleMarkAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    setAnchorElNotifications(null);
  };
```
durch:
```typescript
  const handleMarkAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    markAllNotificationsRead().catch(err => console.error('Failed to mark all read', err));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    setAnchorElNotifications(null);
    markNotificationRead(id).catch(err => console.error('Failed to mark read', err));
  };
```

- [ ] **Step 4: Stub löschen**

```bash
git rm web-ui/src/stubs/notifications.ts
```

- [ ] **Step 5: TypeScript-Build prüfen**

Run: `cd web-ui && npx tsc --noEmit && npm run build && cd -`
Expected: Build erfolgreich, keine Referenz mehr auf `mockNotifications`

- [ ] **Step 6: Commit**

```bash
git add web-ui/src/components/Navbar.tsx
git commit -m "feat(web-ui): wire navbar bell to real notification service via REST + SSE"
```

---

## Phase 5 — Integrations-Verifikation (manuell)

### Task 19: End-to-End-Verifikation

- [ ] **Step 1: Notification Service lokal starten** (ohne SQS/Secrets, Endpoints isoliert)

Run: `mvn -f notificationService/pom.xml spring-boot:run`
(Postgres via vorhandenes lokales Setup; `SQS_REQUEST_QUEUE` leer → Listener deaktiviert.)

- [ ] **Step 2: In-App-Send + Abruf testen** (REST-`/send` mit IN_APP simuliert einen Producer)

```bash
curl -s -X POST localhost:8080/api/notification/send \
  -H 'Content-Type: application/json' \
  -d '{"channels":["IN_APP"],"recipients":["sub-1"],"subject":"Review Assigned","body":"Test"}'

curl -s localhost:8080/api/notification/me -H 'x-auth-principal-id: pool|sub-1'
```
Expected: zweiter Call liefert die soeben erzeugte Notification (`read:false`).

- [ ] **Step 3: Mark-as-read prüfen**

```bash
# <id> aus Step 2 einsetzen
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH localhost:8080/api/notification/<id>/read -H 'x-auth-principal-id: pool|sub-1'
curl -s localhost:8080/api/notification/me -H 'x-auth-principal-id: pool|sub-1'
```
Expected: `204`, danach `read:true`.

- [ ] **Step 4: Volle Test-Suite je betroffenem Service**

Run:
```bash
mvn -f notificationService/pom.xml test
mvn -f matchingService/pom.xml test
mvn -f configuration-service/pom.xml test
mvn -f responseService/pom.xml test
```
Expected: alle GRÜN

- [ ] **Step 5: Glocke im Browser** (nach Deploy oder gegen Dev-Backend)

Glocke öffnen → echte Notifications statt Mock; „Mark all read" überlebt Reload; neue Notification erscheint live (SSE) ohne manuelles Neuladen.

- [ ] **Step 6: Abschluss-Commit (falls noch offene Änderungen)**

```bash
git add -A && git commit -m "chore(notification): finalize in-app notification bell integration"
```

---

## Deploy-Hinweise (nicht Teil der Tasks, für den Rollout)

- **Reihenfolge:** Notification-Stack zuerst (Queue existiert), dann Matching/Configuration/Response (Write-Grants referenzieren die Queue per ARN-Konstante — kein harter CFN-Dependency, aber die Queue sollte vorhanden sein, bevor Producer Events senden).
- **AVP-Policies:** Nach Deploy des `NotificationAuthStack` prüfen, dass die neuen Cedar-Policies im Policy Store gelandet sind (sonst 403 auf `/me`).
- **CloudFront:** `/api/notification/*` ist bereits geroutet (caching disabled) — keine Änderung nötig.
