package com.fh_wedel.response.controller;

import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.service.ResultService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/response")
@Slf4j
public class ResultController {

    private final ResultService resultService;

    public ResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    @GetMapping("/results")
    public ResponseEntity<List<ReviewResultDto>> getResultsByAuthor(@RequestParam String authorId) {
        log.info("Fetching results for author: {}", authorId);
        return ResponseEntity.ok(resultService.findByAuthor(authorId));
    }

    @GetMapping("/results/{submissionId}")
    public ResponseEntity<ReviewResultDto> getResultBySubmission(@PathVariable String submissionId) {
        log.info("Fetching result for submission: {}", submissionId);
        return ResponseEntity.ok(resultService.findBySubmission(submissionId));
    }

    @GetMapping("/results/{submissionId}/document")
    public ResponseEntity<Map<String, String>> getDocumentUrl(@PathVariable String submissionId) {
        log.info("Generating document URL for submission: {}", submissionId);
        String url = resultService.getDocumentDownloadUrl(submissionId);
        return ResponseEntity.ok(Map.of("downloadUrl", url));
    }
}
