package com.smartorder.backend.exception;

// [Task Verification] Phase 4: Core Backend - Menu & Order API
public class InvalidPriceException extends RuntimeException {
    public InvalidPriceException(String message) {
        super(message);
    }
}
