package com.fh_wedel.submission.repository;

import com.fh_wedel.submission.model.AuthorMapping;
import com.fh_wedel.submission.model.DocumentRecord;
import com.fh_wedel.submission.model.Submission;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.Page;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;

import java.util.Collections;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubmissionRepositoryTest {

    @Mock
    private DynamoDbEnhancedClient enhancedClient;

    @Mock
    private DynamoDbTable<Submission> submissionTable;

    @Mock
    private DynamoDbTable<DocumentRecord> documentTable;

    @Mock
    private DynamoDbTable<AuthorMapping> authorMappingTable;

    @Mock
    private DynamoDbIndex<AuthorMapping> authorIndex;

    private SubmissionRepository repository;

    @BeforeEach
    void setUp() {
        when(enhancedClient.table(eq("TestTable"), any(TableSchema.class)))
                .thenAnswer(invocation -> {
                    TableSchema<?> schema = invocation.getArgument(1);
                    if (schema.itemType().rawClass().equals(Submission.class)) return submissionTable;
                    if (schema.itemType().rawClass().equals(DocumentRecord.class)) return documentTable;
                    if (schema.itemType().rawClass().equals(AuthorMapping.class)) return authorMappingTable;
                    return null;
                });

        when(authorMappingTable.index("AuthorIndex")).thenReturn(authorIndex);

        repository = new SubmissionRepository(enhancedClient, "TestTable");
    }

    @Test
    void testSaveSubmission_NoAuthors() {
        Submission sub = new Submission();
        sub.setSubmissionId("sub-1");

        repository.saveSubmission(sub);

        verify(submissionTable).putItem(sub);
        verify(authorMappingTable, never()).putItem(any(AuthorMapping.class));
    }

    @Test
    void testSaveSubmission_WithAuthors() {
        Submission sub = new Submission();
        sub.setSubmissionId("sub-1");
        sub.setAuthorIds(List.of("author-1", "author-2"));
        sub.setCreatedAt(java.time.Instant.parse("2023-01-01T00:00:00Z"));

        repository.saveSubmission(sub);

        verify(submissionTable).putItem(sub);
        ArgumentCaptor<AuthorMapping> captor = ArgumentCaptor.forClass(AuthorMapping.class);
        verify(authorMappingTable, times(2)).putItem(captor.capture());

        List<AuthorMapping> savedMappings = captor.getAllValues();
        assertEquals("sub-1", savedMappings.get(0).getSubmissionId());
        assertEquals("author-1", savedMappings.get(0).getAuthorId());
        assertEquals("sub-1", savedMappings.get(1).getSubmissionId());
        assertEquals("author-2", savedMappings.get(1).getAuthorId());
    }

    @Test
    void testFindSubmissionById_Found() {
        Submission mockSub = new Submission();
        mockSub.setSubmissionId("sub-1");
        
        when(submissionTable.getItem(any(Key.class))).thenReturn(mockSub);

        Submission result = repository.findSubmissionById("sub-1");

        assertNotNull(result);
        assertEquals("sub-1", result.getSubmissionId());
    }

    @Test
    void testFindSubmissionById_NotFound() {
        when(submissionTable.getItem(any(Key.class))).thenReturn(null);

        Submission result = repository.findSubmissionById("sub-1");

        assertNull(result);
    }

    @Test
    void testFindSubmissionsByAuthor() {
        AuthorMapping mapping = new AuthorMapping();
        mapping.setSubmissionId("sub-1");
        
        Page<AuthorMapping> page = Page.create(Collections.singletonList(mapping));
        PageIterable<AuthorMapping> pageIterable = mock(PageIterable.class);
        when(pageIterable.stream()).thenReturn(Stream.of(page));
        
        // Mock query taking Consumer
        when(authorIndex.query(any(java.util.function.Consumer.class)))
                .thenAnswer(invocation -> {
                    // We don't need to actually test the lambda construction here,
                    // just return the mock iterable
                    return pageIterable;
                });

        Submission mockSub = new Submission();
        mockSub.setSubmissionId("sub-1");
        when(submissionTable.getItem(any(Key.class))).thenReturn(mockSub);

        List<Submission> results = repository.findSubmissionsByAuthor("author-1");

        assertEquals(1, results.size());
        assertEquals("sub-1", results.get(0).getSubmissionId());
    }

    @Test
    void testSaveDocument() {
        DocumentRecord doc = new DocumentRecord();
        doc.setDocumentId("doc-1");
        doc.setSubmissionId("sub-1");

        repository.saveDocument(doc);

        verify(documentTable).putItem(doc);
    }

    @Test
    void testFindDocuments() {
        DocumentRecord doc = new DocumentRecord();
        doc.setDocumentId("doc-1");
        
        Page<DocumentRecord> page = Page.create(Collections.singletonList(doc));
        PageIterable<DocumentRecord> pageIterable = mock(PageIterable.class);
        when(pageIterable.stream()).thenReturn(Stream.of(page));

        // Mock query taking Consumer
        when(documentTable.query(any(java.util.function.Consumer.class)))
                .thenAnswer(invocation -> {
                    return pageIterable;
                });

        List<DocumentRecord> results = repository.findDocuments("sub-1");

        assertEquals(1, results.size());
        assertEquals("doc-1", results.get(0).getDocumentId());
    }

    @Test
    void testFindDocument() {
        DocumentRecord mockDoc = new DocumentRecord();
        mockDoc.setDocumentId("doc-1");
        
        when(documentTable.getItem(any(Key.class))).thenReturn(mockDoc);

        DocumentRecord result = repository.findDocument("sub-1", "doc-1");

        assertNotNull(result);
        assertEquals("doc-1", result.getDocumentId());
    }
}
