package com.fh_wedel.matching.service;

import com.fh_wedel.matching.model.MatchRecord;
import com.fh_wedel.matching.model.MatchStatus;
import com.fh_wedel.matching.model.SubmissionStatusRecord;
import com.fh_wedel.matching.model.events.MatchingRequestEvent;
import com.fh_wedel.matching.repository.MatchRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserType;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock
    private CognitoService cognitoService;

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private SqsTemplate sqsTemplate;

    @Captor
    private ArgumentCaptor<List<MatchRecord>> matchRecordsCaptor;

    @Captor
    private ArgumentCaptor<SubmissionStatusRecord> statusCaptor;

    private MatchingService matchingService;

    @BeforeEach
    void setUp() {
        matchingService = new MatchingService(cognitoService, matchRepository, sqsTemplate, "test-response-queue");
    }

    @Test
    @DisplayName("Should successfully match when enough reviewers are available")
    void processMatchingRequest_success() {
        // Given
        MatchingRequestEvent event = createEvent("sub-1", "submitter-1", 2);

        List<UserType> reviewers = List.of(
                createUser("reviewer-a"),
                createUser("reviewer-b"),
                createUser("reviewer-c")
        );
        when(cognitoService.listReviewers()).thenReturn(reviewers);

        // When
        matchingService.processMatchingRequest(event);

        // Then
        verify(matchRepository).saveMatchBatch(matchRecordsCaptor.capture(), statusCaptor.capture());
        assertThat(matchRecordsCaptor.getValue()).hasSize(2);
        assertThat(statusCaptor.getValue().getStatus()).isEqualTo(MatchStatus.MATCHED.name());
        assertThat(statusCaptor.getValue().getSubmissionId()).isEqualTo("sub-1");

        // Verify SQS success event was sent
        verify(sqsTemplate).send(eq("test-response-queue"), anyString());
    }

    @Test
    @DisplayName("Should fail when not enough reviewers are available")
    void processMatchingRequest_insufficientReviewers() {
        // Given
        MatchingRequestEvent event = createEvent("sub-2", "submitter-2", 5);

        List<UserType> reviewers = List.of(
                createUser("reviewer-a"),
                createUser("reviewer-b")
        );
        when(cognitoService.listReviewers()).thenReturn(reviewers);

        // When
        matchingService.processMatchingRequest(event);

        // Then: status should be FAILED, persisted via saveStatus (not saveMatchBatch)
        verify(matchRepository).saveStatus(statusCaptor.capture());
        verify(matchRepository, never()).saveMatchBatch(anyList(), any());
        assertThat(statusCaptor.getValue().getStatus()).isEqualTo(MatchStatus.FAILED.name());
        assertThat(statusCaptor.getValue().getReason()).contains("Not enough eligible reviewers");

        // No SQS event should be sent
        verify(sqsTemplate, never()).send(anyString(), anyString());
    }

    @Test
    @DisplayName("Should exclude the submitter from the reviewer pool")
    void processMatchingRequest_excludesSubmitter() {
        // Given: submitter is "submitter-user" who is also in the reviewer pool
        MatchingRequestEvent event = createEvent("sub-3", "submitter-user", 1);

        List<UserType> reviewers = List.of(
                createUser("submitter-user"), // should be excluded
                createUser("reviewer-x")
        );
        when(cognitoService.listReviewers()).thenReturn(reviewers);

        // When
        matchingService.processMatchingRequest(event);

        // Then: only reviewer-x should be selected
        verify(matchRepository).saveMatchBatch(matchRecordsCaptor.capture(), statusCaptor.capture());
        List<MatchRecord> records = matchRecordsCaptor.getValue();
        assertThat(records).hasSize(1);
        assertThat(records.getFirst().getExaminerId()).isEqualTo("reviewer-x");
    }

    @Test
    @DisplayName("Should fail when submitter is the only reviewer")
    void processMatchingRequest_onlySubmitterAvailable() {
        // Given
        MatchingRequestEvent event = createEvent("sub-4", "only-user", 1);

        List<UserType> reviewers = List.of(
                createUser("only-user")
        );
        when(cognitoService.listReviewers()).thenReturn(reviewers);

        // When
        matchingService.processMatchingRequest(event);

        // Then: FAILED because no eligible reviewers remain
        verify(matchRepository).saveStatus(statusCaptor.capture());
        verify(matchRepository, never()).saveMatchBatch(anyList(), any());
        assertThat(statusCaptor.getValue().getStatus()).isEqualTo(MatchStatus.FAILED.name());
    }

    @Test
    @DisplayName("Should select exactly the requested number of reviewers")
    void selectRandomReviewers_correctCount() {
        List<UserType> pool = List.of(
                createUser("a"), createUser("b"), createUser("c"),
                createUser("d"), createUser("e")
        );

        List<UserType> selected = matchingService.selectRandomReviewers(pool, 3);

        assertThat(selected).hasSize(3);
        // All selected must be from the pool
        selected.forEach(user -> assertThat(pool).contains(user));
    }

    // ========================
    // Helper methods
    // ========================

    private MatchingRequestEvent createEvent(String submissionId, String submitterId, int numberOfExaminers) {
        MatchingRequestEvent event = new MatchingRequestEvent();
        event.setSubmissionId(submissionId);
        event.setSubmitterId(submitterId);
        event.setNumberOfExaminers(numberOfExaminers);
        return event;
    }

    private UserType createUser(String sub) {
        return UserType.builder()
                .username(sub)
                .attributes(
                        AttributeType.builder().name("sub").value(sub).build(),
                        AttributeType.builder().name("email").value(sub + "@test.com").build()
                )
                .enabled(true)
                .build();
    }
}
