package com.smartorder.backend.exception;

// [Task Verification] Phase 4: Core Backend - Menu & Order API
public class SoldOutException extends RuntimeException {
    public SoldOutException(String message) {
        super(message);
    }
}
