package com.fh_wedel.user.controller;

import com.fh_wedel.user.model.api.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import software.amazon.awssdk.services.cognitoidentityprovider.model.InvalidParameterException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException;

import java.time.OffsetDateTime;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
        log.warn("User not found: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse();
        error.setCode("NOT_FOUND");
        error.setMessage("User not found");
        error.setTimestamp(OffsetDateTime.now());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(InvalidParameterException.class)
    public ResponseEntity<ErrorResponse> handleInvalidParameter(InvalidParameterException ex) {
        log.warn("Invalid parameter: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse();
        error.setCode("BAD_REQUEST");
        error.setMessage(ex.getMessage());
        error.setTimestamp(OffsetDateTime.now());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("Internal server error", ex);
        ErrorResponse error = new ErrorResponse();
        error.setCode("INTERNAL_SERVER_ERROR");
        error.setMessage("An unexpected error occurred");
        error.setTimestamp(OffsetDateTime.now());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
