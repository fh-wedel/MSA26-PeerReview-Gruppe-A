package com.fh_wedel.response.controller;

import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.service.ResultService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResultControllerTest {

    @Mock
    private ResultService resultService;

    @InjectMocks
    private ResultController controller;

    @Test
    void shouldReturnResultsByAuthor() {
        var dto = new ReviewResultDto(
                UUID.randomUUID(), "sub-1", "rev-1", "author-1",
                "1.7", "Good", true, Instant.now(), Instant.now());

        when(resultService.findByAuthor("author-1")).thenReturn(List.of(dto));

        var response = controller.getResultsByAuthor("author-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().getFirst().finalGrade()).isEqualTo("1.7");
    }

    @Test
    void shouldReturnDocumentUrl() {
        when(resultService.getDocumentDownloadUrl("sub-1"))
                .thenReturn("https://s3.presigned.url");

        var response = controller.getDocumentUrl("sub-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("downloadUrl", "https://s3.presigned.url");
    }
}
