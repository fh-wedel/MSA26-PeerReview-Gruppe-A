package com.fh_wedel.submission.service;

import com.fh_wedel.submission.repository.GradingCriteriaFormRepository;
import com.fh_wedel.submission.repository.SubmissionConfigurationRepository;
import com.fh_wedel.submission.repository.SubmissionRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock
    private SubmissionConfigurationRepository configRepository;

    @Mock
    private GradingCriteriaFormRepository gradingFormRepository;

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private SqsTemplate sqsTemplate;

    @Mock
    private S3Presigner s3Presigner;

    private SubmissionService submissionService;

    @Test
    void getServiceStatus_ReturnsExpectedStatus() {
        submissionService = new SubmissionService(
                configRepository,
                gradingFormRepository,
                submissionRepository,
                sqsTemplate,
                s3Presigner
        );
        String status = submissionService.getServiceStatus();
        assertEquals("Submission Service is up and running!", status);
    }
}
