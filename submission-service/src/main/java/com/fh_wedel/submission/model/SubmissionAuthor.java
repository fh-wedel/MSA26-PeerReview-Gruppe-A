package com.fh_wedel.submission.model;

import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Table("submission_authors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionAuthor {
    @Column("author_id")
    private String authorId;
}
