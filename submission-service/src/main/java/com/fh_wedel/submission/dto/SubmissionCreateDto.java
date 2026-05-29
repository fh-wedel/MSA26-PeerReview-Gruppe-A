package com.fh_wedel.submission.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionCreateDto {
    private UUID configurationId;
    private String title;
    private String abstractText;
    private List<String> coAuthorIds;
}
