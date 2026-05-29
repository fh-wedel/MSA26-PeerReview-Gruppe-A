package com.fh_wedel.submission.repository;

import com.fh_wedel.submission.model.SubmissionConfiguration;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SubmissionConfigurationRepository extends CrudRepository<SubmissionConfiguration, UUID> {
}
