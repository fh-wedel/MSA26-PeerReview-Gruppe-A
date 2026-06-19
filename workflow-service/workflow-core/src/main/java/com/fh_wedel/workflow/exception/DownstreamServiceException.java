package com.fh_wedel.workflow.exception;

public class DownstreamServiceException extends RuntimeException {
    public DownstreamServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
