package com.fh_wedel.matching.repository;

import com.fh_wedel.matching.model.MatchRecord;
import com.fh_wedel.matching.model.MatchStatus;
import com.fh_wedel.matching.model.SubmissionStatusRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.BatchWriteItemEnhancedRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchRepositoryTest {

    @Mock
    private DynamoDbEnhancedClient enhancedClient;

    @Mock
    private DynamoDbTable<MatchRecord> matchTable;

    @Mock
    private DynamoDbTable<SubmissionStatusRecord> statusTable;

    @Mock
    private DynamoDbIndex<MatchRecord> examinerIndex;

    private MatchRepository matchRepository;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        lenient().when(enhancedClient.table(anyString(), any(TableSchema.class)))
                .thenReturn((DynamoDbTable) matchTable)
                .thenReturn((DynamoDbTable) statusTable);
        
        lenient().when(matchTable.tableSchema()).thenReturn(TableSchema.fromBean(MatchRecord.class));
        lenient().when(statusTable.tableSchema()).thenReturn(TableSchema.fromBean(SubmissionStatusRecord.class));
        
        lenient().when(matchTable.index("ExaminerIndex")).thenReturn(examinerIndex);

        matchRepository = new MatchRepository(enhancedClient, "test-table");
    }

    @Test
    @DisplayName("Should save status record for failed matches")
    void saveStatus_persistsRecord() {
        // Given
        SubmissionStatusRecord status = new SubmissionStatusRecord(
                "sub-1", java.util.List.of("submitter-1"), MatchStatus.FAILED, 3, "Not enough reviewers");

        // When
        matchRepository.saveStatus(status);

        // Then
        verify(statusTable).putItem(status);
    }

    @Test
    @DisplayName("Should batch write match records and status together")
    void saveMatchBatch_persistsAllRecords() {
        // Given
        var matches = java.util.List.of(
                new MatchRecord("sub-1", "examiner-a"),
                new MatchRecord("sub-1", "examiner-b")
        );
        var status = new SubmissionStatusRecord(
                "sub-1", java.util.List.of("submitter-1"), MatchStatus.MATCHED, 2, null);

        // When
        matchRepository.saveMatchBatch(matches, status);

        // Then
        ArgumentCaptor<BatchWriteItemEnhancedRequest> captor =
                ArgumentCaptor.forClass(BatchWriteItemEnhancedRequest.class);
        verify(enhancedClient).batchWriteItem(captor.capture());
        assertThat(captor.getValue()).isNotNull();
    }

    @Test
    @DisplayName("MatchRecord should construct with correct PK/SK format")
    void matchRecord_correctKeyFormat() {
        MatchRecord record = new MatchRecord("submission-123", "examiner-456");

        assertThat(record.getPk()).isEqualTo("SUBMISSION#submission-123");
        assertThat(record.getSk()).isEqualTo("MATCH#examiner-456");
        assertThat(record.getSubmissionId()).isEqualTo("submission-123");
        assertThat(record.getExaminerId()).isEqualTo("examiner-456");
        assertThat(record.getTimestamp()).isNotNull();
    }

    @Test
    @DisplayName("SubmissionStatusRecord should construct with correct PK/SK format")
    void submissionStatusRecord_correctKeyFormat() {
        SubmissionStatusRecord record = new SubmissionStatusRecord(
                "submission-789", java.util.List.of("submitter-1"), MatchStatus.MATCHED, 2, null);

        assertThat(record.getPk()).isEqualTo("SUBMISSION#submission-789");
        assertThat(record.getSk()).isEqualTo("STATUS");
        assertThat(record.getStatus()).isEqualTo("MATCHED");
        assertThat(record.getReason()).isNull();
    }
}
