package com.fh_wedel.submission.repository;

import com.fh_wedel.submission.model.GradingCriteriaForm;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GradingCriteriaFormRepository extends CrudRepository<GradingCriteriaForm, UUID> {
    Optional<GradingCriteriaForm> findByConfigurationId(UUID configurationId);
}
