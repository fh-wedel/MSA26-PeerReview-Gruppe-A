package com.fh_wedel.response.service;

import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.repository.ReviewResultRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class ResultService {

    private final ReviewResultRepository repository;
    private final DocumentStorageService documentStorageService;

    public ResultService(ReviewResultRepository repository, DocumentStorageService documentStorageService) {
        this.repository = repository;
        this.documentStorageService = documentStorageService;
    }

    public ReviewResult save(ReviewResult result) {
        log.info("Saving review result for submission: {}", result.getSubmissionId());
        return repository.save(result);
    }

    public List<ReviewResultDto> findByAuthor(String authorId) {
        return repository.findByAuthorId(authorId).stream()
                .map(ReviewResultDto::from)
                .toList();
    }

    public ReviewResultDto findBySubmission(String submissionId) {
        return repository.findBySubmissionId(submissionId)
                .map(ReviewResultDto::from)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No result found for submission: " + submissionId));
    }

    public String getDocumentDownloadUrl(String submissionId) {
        var result = repository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No result found for submission: " + submissionId));

        if (result.getDocumentS3Key() == null || result.getDocumentS3Key().isBlank()) {
            throw new IllegalArgumentException("No document attached to submission: " + submissionId);
        }

        return documentStorageService.generatePresignedDownloadUrl(result.getDocumentS3Key());
    }
}
