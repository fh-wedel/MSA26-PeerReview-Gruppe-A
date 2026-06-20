package com.fh_wedel.notification.security;

public class PrincipalNormalizer {

    /**
     * Strips Cedar entity type prefix and Cognito pool prefix from a raw principal ID.
     * Handles: bare sub, "pool|sub", and Cedar PeerReview::User::"pool|sub".
     */
    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        int firstQuote = raw.indexOf('"');
        int lastQuote = raw.lastIndexOf('"');
        String inner = (firstQuote >= 0 && lastQuote > firstQuote)
                ? raw.substring(firstQuote + 1, lastQuote)
                : raw;
        int pipeIndex = inner.lastIndexOf('|');
        if (pipeIndex >= 0 && pipeIndex < inner.length() - 1) {
            return inner.substring(pipeIndex + 1);
        }
        return inner;
    }
}
