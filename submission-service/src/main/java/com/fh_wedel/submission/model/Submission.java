package com.fh_wedel.submission.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.MappedCollection;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;
import java.util.Set;

@Table("submissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Submission {
    @Id
    private UUID id;
    
    @Column("configuration_id")
    private UUID configurationId;
    
    private String title;
    
    @Column("abstract_text")
    private String abstractText;
    
    @Column("file_s3_key")
    private String fileS3Key;
    
    @Column("additional_files_s3_keys")
    private String additionalFilesS3Keys; // Stored as a JSON string
    
    @Column("submitted_at")
    private Instant submittedAt;
    
    private SubmissionStatus status;
    
    @Column("created_at")
    private Instant createdAt;
    
    @Column("updated_at")
    private Instant updatedAt;

    @MappedCollection(idColumn = "submission_id")
    private Set<SubmissionAuthor> authors;
}
