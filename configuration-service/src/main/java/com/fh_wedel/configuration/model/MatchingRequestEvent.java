package com.fh_wedel.configuration.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchingRequestEvent {
    private String submissionId;
    private String submitterId;
    private int numberOfExaminers;
}
