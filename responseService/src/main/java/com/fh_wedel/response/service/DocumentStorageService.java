package com.fh_wedel.response.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.time.Duration;

@Service
@Slf4j
public class DocumentStorageService {

    private final S3Presigner s3Presigner;
    private final S3Client s3Client;
    private final String bucketName;
    private final int expirationMinutes;

    public DocumentStorageService(
            S3Presigner s3Presigner,
            S3Client s3Client,
            @Value("${aws.s3.bucket-name}") String bucketName,
            @Value("${aws.s3.presigned-url-expiration-minutes:15}") int expirationMinutes) {
        this.s3Presigner = s3Presigner;
        this.s3Client = s3Client;
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

    public byte[] getDocumentBytes(String s3Key) {
        var getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();
        ResponseBytes<GetObjectResponse> response = s3Client.getObjectAsBytes(getObjectRequest);
        return response.asByteArray();
    }
}
