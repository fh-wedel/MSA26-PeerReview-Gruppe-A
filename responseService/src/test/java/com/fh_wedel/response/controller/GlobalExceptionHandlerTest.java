package com.fh_wedel.response.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    @Test
    void testHandleNotFound() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        ResponseEntity<Map<String, String>> response = handler.handleNotFound(new IllegalArgumentException("Not found exception"));
        
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Not found exception", response.getBody().get("error"));
    }
}
