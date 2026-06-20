package com.fh_wedel.response.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;

@DynamoDbBean
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewAnswer {
    private String questionId;
    private String answer;
}
