package com.fh_wedel.communication.model.db;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class ChatMetaItem {

    private String pk; // CHAT#{chatId}
    private String sk; // META
    
    private String participantA;    // GENERAL chats only (lower UUID)
    private String participantB;    // GENERAL chats only (upper UUID)
    private List<String> participants; // SUBMISSION group chats: all participant IDs
    private String submissionId; // "GENERAL" or UUID
    private String chatType;     // "GENERAL" or "SUBMISSION"
    private String createdAt;    // ISO-8601
    private String lastMessageAt;// ISO-8601

    @DynamoDbPartitionKey
    public String getPk() {
        return pk;
    }

    @DynamoDbSortKey
    public String getSk() {
        return sk;
    }
}
