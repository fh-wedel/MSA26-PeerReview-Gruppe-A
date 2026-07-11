package com.fh_wedel.response.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class S3ConfigTest {

    @Test
    void testS3Client() {
        S3Config config = new S3Config();
        ReflectionTestUtils.setField(config, "awsRegion", "eu-central-1");
        S3Client client = config.s3Client();
        assertNotNull(client);
    }

    @Test
    void testS3Presigner() {
        S3Config config = new S3Config();
        ReflectionTestUtils.setField(config, "awsRegion", "eu-central-1");
        S3Presigner presigner = config.s3Presigner();
        assertNotNull(presigner);
    }
}
