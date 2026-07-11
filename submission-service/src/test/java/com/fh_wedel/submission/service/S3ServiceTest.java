package com.fh_wedel.submission.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.MalformedURLException;
import java.net.URL;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class S3ServiceTest {

    @Mock
    private S3Presigner s3Presigner;

    private S3Service s3Service;

    @BeforeEach
    void setUp() {
        s3Service = new S3Service(s3Presigner, "test-bucket");
    }

    @Test
    void testGeneratePresignedPutUrl() throws MalformedURLException {
        PresignedPutObjectRequest presignedPutObjectRequest = org.mockito.Mockito.mock(PresignedPutObjectRequest.class);
        when(presignedPutObjectRequest.url()).thenReturn(new URL("https://test-bucket.s3.amazonaws.com/test-key"));
        when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(presignedPutObjectRequest);

        String url = s3Service.generatePresignedPutUrl("test-key", "application/pdf");
        assertEquals("https://test-bucket.s3.amazonaws.com/test-key", url);
    }

    @Test
    void testGeneratePresignedGetUrl() throws MalformedURLException {
        PresignedGetObjectRequest presignedGetObjectRequest = org.mockito.Mockito.mock(PresignedGetObjectRequest.class);
        when(presignedGetObjectRequest.url()).thenReturn(new URL("https://test-bucket.s3.amazonaws.com/test-key"));
        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presignedGetObjectRequest);

        String url = s3Service.generatePresignedGetUrl("test-key");
        assertEquals("https://test-bucket.s3.amazonaws.com/test-key", url);
    }
}
