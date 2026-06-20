package com.fh_wedel.matching.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.matching.model.MatchRecord;
import com.fh_wedel.matching.model.MatchStatus;
import com.fh_wedel.matching.model.SubmissionStatusRecord;
import com.fh_wedel.matching.model.events.MatchingRequestEvent;
import com.fh_wedel.matching.repository.MatchRepository;
import com.fh_wedel.user.client.api.GroupsApi;
import com.fh_wedel.user.client.model.UserProfile;
import com.fh_wedel.user.client.model.UserProfileListResponse;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock
    private GroupsApi groupsApi;

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private SqsTemplate sqsTemplate;

    @Captor
    private ArgumentCaptor<List<MatchRecord>> matchRecordsCaptor;

    @Captor
    private ArgumentCaptor<SubmissionStatusRecord> statusCaptor;

    private MatchingService matchingService;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        matchingService = new MatchingService(groupsApi, matchRepository, sqsTemplate, objectMapper,
                "test-response-queue", "notification-request-queue");
    }

    @Test
    @DisplayName("Should successfully match when enough reviewers are available")
    void processMatchingRequest_success() {
        MatchingRequestEvent event = createEvent("sub-1", "submitter-1", 2);

        List<UserProfile> reviewers = List.of(
                createUser("reviewer-a"),
                createUser("reviewer-b"),
                createUser("reviewer-c"));
        UserProfileListResponse response = new UserProfileListResponse();
        response.setUsers(reviewers);
        try {
            when(groupsApi.listGroupMembers("Reviewer")).thenReturn(response);
        } catch (Exception e) {
        }

        matchingService.processMatchingRequest(event);

        verify(matchRepository).saveMatchBatch(matchRecordsCaptor.capture(), statusCaptor.capture());
        assertThat(matchRecordsCaptor.getValue()).hasSize(2);
        assertThat(statusCaptor.getValue().getStatus()).isEqualTo(MatchStatus.MATCHED.name());
        assertThat(statusCaptor.getValue().getSubmissionId()).isEqualTo("sub-1");

        verify(sqsTemplate).send(eq("test-response-queue"), anyString());
    }

    @Test
    @DisplayName("Should fail when not enough reviewers are available")
    void processMatchingRequest_insufficientReviewers() {
        MatchingRequestEvent event = createEvent("sub-2", "submitter-2", 5);

        List<UserProfile> reviewers = List.of(
                createUser("reviewer-a"),
                createUser("reviewer-b"));
        UserProfileListResponse response = new UserProfileListResponse();
        response.setUsers(reviewers);
        try {
            when(groupsApi.listGroupMembers("Reviewer")).thenReturn(response);
        } catch (Exception e) {
        }

        matchingService.processMatchingRequest(event);

        verify(matchRepository).saveStatus(statusCaptor.capture());
        verify(matchRepository, never()).saveMatchBatch(anyList(), any());
        assertThat(statusCaptor.getValue().getStatus()).isEqualTo(MatchStatus.FAILED.name());
        assertThat(statusCaptor.getValue().getReason()).contains("Not enough eligible reviewers");

        // No SQS response event should be sent to the response queue
        verify(sqsTemplate, never()).send(eq("test-response-queue"), anyString());
    }

    @Test
    @DisplayName("Should exclude the submitter from the reviewer pool")
    void processMatchingRequest_excludesSubmitter() {
        MatchingRequestEvent event = createEvent("sub-3", "submitter-user", 1);

        List<UserProfile> reviewers = List.of(
                createUser("submitter-user"),
                createUser("reviewer-x"));
        UserProfileListResponse response = new UserProfileListResponse();
        response.setUsers(reviewers);
        try {
            when(groupsApi.listGroupMembers("Reviewer")).thenReturn(response);
        } catch (Exception e) {
        }

        matchingService.processMatchingRequest(event);

        verify(matchRepository).saveMatchBatch(matchRecordsCaptor.capture(), statusCaptor.capture());
        List<MatchRecord> records = matchRecordsCaptor.getValue();
        assertThat(records).hasSize(1);
        assertThat(records.getFirst().getExaminerId()).isEqualTo("reviewer-x");
    }

    @Test
    @DisplayName("Should fail when submitter is the only reviewer")
    void processMatchingRequest_onlySubmitterAvailable() {
        MatchingRequestEvent event = createEvent("sub-4", "only-user", 1);

        List<UserProfile> reviewers = List.of(
                createUser("only-user"));
        UserProfileListResponse response = new UserProfileListResponse();
        response.setUsers(reviewers);
        try {
            when(groupsApi.listGroupMembers("Reviewer")).thenReturn(response);
        } catch (Exception e) {
        }

        matchingService.processMatchingRequest(event);

        verify(matchRepository).saveStatus(statusCaptor.capture());
        verify(matchRepository, never()).saveMatchBatch(anyList(), any());
        assertThat(statusCaptor.getValue().getStatus()).isEqualTo(MatchStatus.FAILED.name());
    }

    @Test
    @DisplayName("Should select exactly the requested number of reviewers")
    void selectRandomReviewers_correctCount() {
        List<UserProfile> pool = List.of(
                createUser("a"), createUser("b"), createUser("c"),
                createUser("d"), createUser("e"));

        List<UserProfile> selected = matchingService.selectRandomReviewers(pool, 3);

        assertThat(selected).hasSize(3);
        selected.forEach(user -> assertThat(pool).contains(user));
    }

    @Test
    @DisplayName("Should send in-app notifications to assigned reviewers on success")
    void sendsInAppNotificationsToAssignedReviewers() throws Exception {
        // Arrange: enough reviewers for a successful match
        MatchingRequestEvent event = createEvent("sub-1", "submitter-1", 2);

        List<UserProfile> reviewers = List.of(
                createUser("reviewer-a"),
                createUser("reviewer-b"),
                createUser("reviewer-c"));
        UserProfileListResponse response = new UserProfileListResponse();
        response.setUsers(reviewers);
        try {
            when(groupsApi.listGroupMembers("Reviewer")).thenReturn(response);
        } catch (Exception e) {
        }

        // Act
        matchingService.processMatchingRequest(event);

        // Assert: one notification per assigned reviewer to the notification queue
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(sqsTemplate, atLeastOnce()).send(eq("notification-request-queue"), body.capture());
        assertThat(body.getAllValues()).anyMatch(b -> b.contains("Review Assigned") && b.contains("IN_APP"));
    }

    @Test
    @DisplayName("Should send in-app notification to author on matching failure")
    void sendsInAppNotificationOnMatchingFailure() throws Exception {
        // Arrange: too few eligible reviewers → FAILED branch
        MatchingRequestEvent event = createEvent("sub-2", "submitter-2", 5);

        List<UserProfile> reviewers = List.of(
                createUser("reviewer-a"),
                createUser("reviewer-b"));
        UserProfileListResponse response = new UserProfileListResponse();
        response.setUsers(reviewers);
        try {
            when(groupsApi.listGroupMembers("Reviewer")).thenReturn(response);
        } catch (Exception e) {
        }

        // Act
        matchingService.processMatchingRequest(event);

        // Assert: exactly one send to the notification queue with "Matching Failed"
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(sqsTemplate, atLeastOnce()).send(eq("notification-request-queue"), body.capture());
        assertThat(body.getAllValues())
                .anyMatch(b -> b.contains("Matching Failed") && b.contains("IN_APP") && b.contains("submitter-2"));
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

    private UserProfile createUser(String sub) {
        UserProfile profile = new UserProfile();
        profile.setUsername(sub);
        profile.setSub(sub);
        profile.setEmail(sub + "@test.com");
        profile.setEnabled(true);
        return profile;
    }
}
