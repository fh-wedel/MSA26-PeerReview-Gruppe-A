package com.fh_wedel.response.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.net.URL;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentStorageServiceTest {

    @Mock
    private S3Presigner s3Presigner;

    @Mock
    private S3Client s3Client;

    @Test
    void testGeneratePresignedDownloadUrl() throws Exception {
        DocumentStorageService service = new DocumentStorageService(s3Presigner, s3Client, "bucket", 15);
        
        PresignedGetObjectRequest presignedRequest = mock(PresignedGetObjectRequest.class);
        when(presignedRequest.url()).thenReturn(new URL("https://example.com/test-key"));
        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presignedRequest);

        String url = service.generatePresignedDownloadUrl("test-key");

        assertEquals("https://example.com/test-key", url);
    }

    @Test
    void testGetDocumentBytes() {
        DocumentStorageService service = new DocumentStorageService(s3Presigner, s3Client, "bucket", 15);

        @SuppressWarnings("unchecked")
        ResponseBytes<GetObjectResponse> responseBytes = mock(ResponseBytes.class);
        byte[] expectedBytes = new byte[]{1, 2, 3};
        when(responseBytes.asByteArray()).thenReturn(expectedBytes);
        when(s3Client.getObjectAsBytes(any(GetObjectRequest.class))).thenReturn(responseBytes);

        byte[] bytes = service.getDocumentBytes("test-key");

        assertArrayEquals(expectedBytes, bytes);
    }
}
