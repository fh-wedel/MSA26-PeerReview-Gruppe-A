package com.fh_wedel.submission.service;

import com.fh_wedel.submission.dto.*;
import com.fh_wedel.submission.model.*;
import com.fh_wedel.submission.repository.*;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SubmissionService {

    private final SubmissionConfigurationRepository configRepository;
    private final GradingCriteriaFormRepository gradingFormRepository;
    private final SubmissionRepository submissionRepository;
    private final SqsTemplate sqsTemplate;
    private final S3Presigner s3Presigner;

    @Value("${aws.sqs.response-queue-name:submission-response-queue}")
    private String responseQueueName;

    @Value("${aws.s3.bucket-name:peerreview-submissions-bucket}")
    private String s3BucketName;

    public SubmissionService(
            SubmissionConfigurationRepository configRepository,
            GradingCriteriaFormRepository gradingFormRepository,
            SubmissionRepository submissionRepository,
            SqsTemplate sqsTemplate,
            S3Presigner s3Presigner) {
        this.configRepository = configRepository;
        this.gradingFormRepository = gradingFormRepository;
        this.submissionRepository = submissionRepository;
        this.sqsTemplate = sqsTemplate;
        this.s3Presigner = s3Presigner;
    }

    public String getServiceStatus() {
        return "Submission Service is up and running!";
    }

    public String getCurrentTime() {
        return Instant.now().toString();
    }

    public String getCurrentTimeWithIdentity(String username, String groups) {
        String resolvedUsername = (username == null || username.isBlank()) ? "unknown" : username;
        String resolvedGroups = (groups == null || groups.isBlank()) ? "unknown" : groups;
        return String.format(
                "time=%s, username=%s, groups=%s",
                getCurrentTime(),
                resolvedUsername,
                resolvedGroups);
    }

    // 1. Create a Submission Configuration with grading form and criteria
    @Transactional
    public SubmissionConfiguration createConfiguration(SubmissionConfigurationCreateDto dto) {
        log.info("Creating submission configuration: {}", dto.getTitle());

        // Simple validation
        if (dto.getSubmissionDeadline().isBefore(dto.getSubmissionStart())) {
            throw new IllegalArgumentException("Deadline must be after start time");
        }
        if (dto.getReviewDeadline().isBefore(dto.getSubmissionDeadline())) {
            throw new IllegalArgumentException("Review deadline must be after submission deadline");
        }

        SubmissionConfiguration config = SubmissionConfiguration.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .createdByType(dto.getCreatedByType())
                .createdById(dto.getCreatedById())
                .submissionStart(dto.getSubmissionStart())
                .submissionDeadline(dto.getSubmissionDeadline())
                .reviewDeadline(dto.getReviewDeadline())
                .reviewProcess(dto.getReviewProcess())
                .matchingRule(dto.getMatchingRule())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        SubmissionConfiguration savedConfig = configRepository.save(config);

        if (dto.getGradingForm() != null) {
            GradingCriteriaFormDto formDto = dto.getGradingForm();
            
            Set<GradingCriterion> criteria = new HashSet<>();
            if (formDto.getCriteria() != null) {
                int sortOrder = 0;
                for (GradingCriterionDto critDto : formDto.getCriteria()) {
                    criteria.add(GradingCriterion.builder()
                            .title(critDto.getTitle())
                            .description(critDto.getDescription())
                            .criterionType(critDto.getType())
                            .maxPoints(critDto.getMaxPoints())
                            .weight(critDto.getWeight())
                            .sortOrder(sortOrder++)
                            .build());
                }
            }

            GradingCriteriaForm form = GradingCriteriaForm.builder()
                    .configurationId(savedConfig.getId())
                    .title(formDto.getTitle())
                    .description(formDto.getDescription())
                    .visibleToAuthors(formDto.isVisibleToAuthors())
                    .createdAt(Instant.now())
                    .criteria(criteria)
                    .build();

            gradingFormRepository.save(form);
        }

        return savedConfig;
    }

    // 2. Create a Submission Aggregate Root with co-authors list
    @Transactional
    public Submission createSubmission(SubmissionCreateDto dto, String callerUserId) {
        log.info("Creating submission under configuration {}: {}", dto.getConfigurationId(), dto.getTitle());

        // Check if configuration exists and is within valid time
        SubmissionConfiguration config = configRepository.findById(dto.getConfigurationId())
                .orElseThrow(() -> new NoSuchElementException("Submission configuration not found"));

        Instant now = Instant.now();
        if (now.isBefore(config.getSubmissionStart()) || now.isAfter(config.getSubmissionDeadline())) {
            throw new IllegalStateException("Submission period is closed or has not started yet");
        }

        // Aggregate co-authors
        Set<SubmissionAuthor> authors = new HashSet<>();
        authors.add(new SubmissionAuthor(callerUserId));
        if (dto.getCoAuthorIds() != null) {
            for (String authorId : dto.getCoAuthorIds()) {
                authors.add(new SubmissionAuthor(authorId));
            }
        }

        Submission submission = Submission.builder()
                .configurationId(dto.getConfigurationId())
                .title(dto.getTitle())
                .abstractText(dto.getAbstractText())
                .status(SubmissionStatus.DRAFT)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .authors(authors)
                .build();

        return submissionRepository.save(submission);
    }

    // 3. Generate S3 Presigned URL for direct secure browser upload
    public PresignedUrlResponseDto generatePresignedUrl(UUID submissionId, String authorId, PresignedUrlRequestDto dto) {
        log.info("Generating presigned S3 upload URL for submission {}", submissionId);

        // Verify authorship
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NoSuchElementException("Submission not found"));

        boolean isAuthor = submission.getAuthors().stream()
                .anyMatch(a -> a.getAuthorId().equals(authorId));
        if (!isAuthor) {
            throw new SecurityException("Caller is not a registered co-author of this submission");
        }

        if (submission.getStatus() != SubmissionStatus.DRAFT) {
            throw new IllegalStateException("Cannot upload assets. Submission is no longer in DRAFT status");
        }

        String uniqueId = UUID.randomUUID().toString();
        String s3Key = String.format("submissions/%s/%s-%s", submissionId, uniqueId, dto.getFileName());

        // Generate put request
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(s3BucketName)
                .key(s3Key)
                .contentType(dto.getContentType())
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .putObjectRequest(putRequest)
                .build();

        String uploadUrl = s3Presigner.presignPutObject(presignRequest).url().toString();

        return PresignedUrlResponseDto.builder()
                .s3Key(s3Key)
                .uploadUrl(uploadUrl)
                .build();
    }

    // 4. Update Submission draft (metadata, file keys)
    @Transactional
    public Submission updateSubmission(UUID submissionId, String authorId, String title, String abstractText, String fileS3Key, List<String> additionalS3Keys) {
        log.info("Updating submission draft: {}", submissionId);

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NoSuchElementException("Submission not found"));

        // Author validation
        boolean isAuthor = submission.getAuthors().stream()
                .anyMatch(a -> a.getAuthorId().equals(authorId));
        if (!isAuthor) {
            throw new SecurityException("Only co-authors can modify this submission");
        }

        if (submission.getStatus() != SubmissionStatus.DRAFT) {
            throw new IllegalStateException("Cannot update. Submission is not in DRAFT status");
        }

        submission.setTitle(title);
        submission.setAbstractText(abstractText);
        submission.setFileS3Key(fileS3Key);
        
        if (additionalS3Keys != null && !additionalS3Keys.isEmpty()) {
            submission.setAdditionalFilesS3Keys(String.join(",", additionalS3Keys));
        }

        submission.setUpdatedAt(Instant.now());
        return submissionRepository.save(submission);
    }

    // 5. Submit Work & Publish SQS Event
    @Transactional
    public Submission submitWork(UUID submissionId, String authorId) {
        log.info("Finalizing submission: {}", submissionId);

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NoSuchElementException("Submission not found"));

        // Validation
        boolean isAuthor = submission.getAuthors().stream()
                .anyMatch(a -> a.getAuthorId().equals(authorId));
        if (!isAuthor) {
            throw new SecurityException("Only co-authors can submit this work");
        }

        if (submission.getStatus() != SubmissionStatus.DRAFT) {
            throw new IllegalStateException("Submission is already finalized or under review");
        }

        if (submission.getFileS3Key() == null || submission.getFileS3Key().isBlank()) {
            throw new IllegalArgumentException("Cannot submit. Main PDF file is missing");
        }

        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission.setSubmittedAt(Instant.now());
        submission.setUpdatedAt(Instant.now());

        Submission savedSubmission = submissionRepository.save(submission);

        // Dispatch SQS Event asynchronously (conceptually we push to a queue to notify matching/notification services)
        publishEvent("SUBMISSION_SUBMITTED", savedSubmission);

        return savedSubmission;
    }

    // 6. Get Grading Criteria Form (enforce visibility to authors)
    public GradingCriteriaForm getGradingCriteria(UUID configId, String userId, boolean isAuthor) {
        log.info("Fetching grading criteria for configuration {}", configId);

        GradingCriteriaForm form = gradingFormRepository.findByConfigurationId(configId)
                .orElseThrow(() -> new NoSuchElementException("Grading form criteria not found for this configuration"));

        if (isAuthor && !form.isVisibleToAuthors()) {
            throw new SecurityException("Access denied. The evaluation rubric is configured to be invisible to authors");
        }

        return form;
    }

    private void publishEvent(String eventType, Submission submission) {
        try {
            // Build simple event json payload
            String authorsList = submission.getAuthors().stream()
                    .map(SubmissionAuthor::getAuthorId)
                    .collect(Collectors.joining("\",\"", "[\"", "\"]"));

            String messageBody = String.format(
                    "{\"eventId\":\"%s\",\"eventType\":\"%s\",\"timestamp\":\"%s\",\"data\":{\"submissionId\":\"%s\",\"configurationId\":\"%s\",\"title\":\"%s\",\"authors\":%s,\"fileS3Key\":\"%s\"}}",
                    UUID.randomUUID(),
                    eventType,
                    Instant.now(),
                    submission.getId(),
                    submission.getConfigurationId(),
                    submission.getTitle().replace("\"", "\\\""),
                    authorsList,
                    submission.getFileS3Key()
            );

            log.info("Publishing {} event to queue {}: {}", eventType, responseQueueName, messageBody);
            sqsTemplate.send(responseQueueName, messageBody);
        } catch (Exception e) {
            log.error("Failed to publish asynchronous SQS event for submission {}", submission.getId(), e);
        }
    }
}
