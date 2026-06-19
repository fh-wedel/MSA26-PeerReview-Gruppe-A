package com.fh_wedel.workflow.exception;

public class ReviewAlreadySubmittedException extends RuntimeException {
    public ReviewAlreadySubmittedException(String message) {
        super(message);
    }
}
