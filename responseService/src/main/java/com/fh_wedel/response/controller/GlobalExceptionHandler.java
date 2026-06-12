package com.fh_wedel.response.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Maps service-layer exceptions to HTTP responses.
 *
 * <p>{@link IllegalArgumentException} is used by the service layer to signal
 * "not found" conditions (e.g. an unknown submission). It is mapped to
 * {@code 404 Not Found} rather than {@code 400}/{@code 500} so that callers
 * cannot distinguish a missing result from one they are not allowed to see.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(IllegalArgumentException ex) {
        log.info("Mapping IllegalArgumentException to 404: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", ex.getMessage()));
    }
}
