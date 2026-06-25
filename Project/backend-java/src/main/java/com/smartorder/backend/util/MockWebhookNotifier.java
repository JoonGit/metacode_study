package com.smartorder.backend.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

// [Task Verification] Phase 4: Core Backend - Internal & Webhook
@Slf4j
@Component
public class MockWebhookNotifier implements WebhookNotifier {

    private final RestTemplate restTemplate;
    private final String mockWebhookUrl = "https://mock.webhook.local/alert"; // Mock URL

    public MockWebhookNotifier() {
        this.restTemplate = new RestTemplate();
    }

    @Async
    @Override
    public void sendErrorAlert(Exception ex) {
        try {
            log.info("Sending error alert to webhook for exception: {}", ex.getMessage());
            Map<String, String> payload = new HashMap<>();
            payload.put("text", "Critical Error Occurred: " + ex.getMessage());
            // Mock POST request (Commented out actual execution to prevent connection errors)
            // restTemplate.postForEntity(mockWebhookUrl, payload, String.class);
            log.info("Mock webhook request payload: {}", payload);
        } catch (Exception e) {
            log.error("Failed to send webhook alert", e);
        }
    }
}
