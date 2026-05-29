package com.fh_wedel.submission.repository;

import com.fh_wedel.submission.model.Submission;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends CrudRepository<Submission, UUID> {
    
    List<Submission> findByConfigurationId(UUID configurationId);

    @Query("SELECT s.* FROM submissions s JOIN submission_authors sa ON s.id = sa.submission_id WHERE sa.author_id = :authorId")
    List<Submission> findByAuthorId(@Param("authorId") String authorId);
}
