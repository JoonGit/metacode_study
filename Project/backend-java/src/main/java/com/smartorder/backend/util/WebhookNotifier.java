package com.smartorder.backend.util;

// [Task Verification] Phase 4: Core Backend - Internal & Webhook
public interface WebhookNotifier {
    void sendErrorAlert(Exception ex);
}
