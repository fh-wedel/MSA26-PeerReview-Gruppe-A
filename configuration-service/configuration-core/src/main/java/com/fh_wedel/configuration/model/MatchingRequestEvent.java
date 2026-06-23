package com.fh_wedel.configuration.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

package com.fh_wedel.configuration.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchingRequestEvent {
    private String submissionId;
    private List<String> submitterIds;
    private int numberOfExaminers;
    private String topicTag;

    public MatchingRequestEvent(String submissionId, List<String> submitterIds, int numberOfExaminers, String topicTag) {
        this.submissionId = submissionId;
        this.submitterIds = submitterIds;
        this.numberOfExaminers = numberOfExaminers;
        this.topicTag = topicTag;
    }
}
