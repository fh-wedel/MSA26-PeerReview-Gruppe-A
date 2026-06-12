package com.fh_wedel.communication.security;

public class PrincipalNormalizer {

    /**
     * Strips Cedar entity type prefix and Cognito pool prefix from a raw principal ID.
     * Handles formats:
     *   - Bare sub UUID:             "abc-123"
     *   - Pool|sub:                  "eu-central-1_abc|abc-123"
     *   - Cedar entity string:       PeerReview::User::"eu-central-1_abc|abc-123"
     */
    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        // Strip Cedar quotes: PeerReview::User::"pool|sub" → pool|sub
        int firstQuote = raw.indexOf('"');
        int lastQuote = raw.lastIndexOf('"');
        String inner = (firstQuote >= 0 && lastQuote > firstQuote)
                ? raw.substring(firstQuote + 1, lastQuote)
                : raw;
        
        // Strip pool prefix: pool|sub → sub
        int pipeIndex = inner.lastIndexOf('|');
        if (pipeIndex >= 0 && pipeIndex < inner.length() - 1) {
            return inner.substring(pipeIndex + 1);
        }
        return inner;
    }
}
