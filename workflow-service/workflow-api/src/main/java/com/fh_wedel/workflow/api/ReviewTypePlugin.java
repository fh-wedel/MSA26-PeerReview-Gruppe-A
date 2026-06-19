package com.fh_wedel.workflow.api;

/**
 * Service Provider Interface (SPI) for review type plugins.
 */
public interface ReviewTypePlugin {

    // ── Metadata ──────────────────────────────────────────────────────

    String getName();

    String getDescription();

    String getTitle();

    // ── Anonymity & communication rules ───────────────────────────────

    boolean isAuthorAnonymous();

    boolean isReviewerAnonymous();

    boolean isAuthorReviewerChatAllowed();

}
