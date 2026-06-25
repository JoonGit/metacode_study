package com.smartorder.backend.service;

import com.smartorder.backend.entity.StoreAiLog;
import com.smartorder.backend.repository.AiLogRepository;
import com.smartorder.backend.util.SnowflakeIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// [Task Verification] Phase 4: Core Backend - AiLogService
@Service
@RequiredArgsConstructor
public class AiLogService {

    private final AiLogRepository aiLogRepository;
    private final SnowflakeIdGenerator snowflakeIdGenerator;

    @Transactional
    public StoreAiLog saveLog(Long storeId, Long sessionId, Integer turnSequence, String userPrompt, String aiResponse, String routingNode, String openaiMetadata, Double latencyMs) {
        StoreAiLog log = StoreAiLog.builder()
                .logId(snowflakeIdGenerator.nextId())
                .storeId(storeId)
                .sessionId(sessionId)
                .turnSequence(turnSequence)
                .userPrompt(userPrompt)
                .aiResponse(aiResponse)
                .routingNode(routingNode)
                .openaiMetadata(openaiMetadata)
                .latencyMs(latencyMs)
                .createdAt(LocalDateTime.now())
                .build();
        return aiLogRepository.save(log);
    }

    @Transactional
    public StoreAiLog saveLog(Long storeId, Long sessionId, Integer turnSequence, String userPrompt, String aiResponse, String routingNode) {
        return saveLog(storeId, sessionId, turnSequence, userPrompt, aiResponse, routingNode, null, null);
    }

    @Transactional(readOnly = true)
    public List<StoreAiLog> getLogsByStore(Long storeId) {
        return aiLogRepository.findByStoreIdOrderByCreatedAtDesc(storeId);
    }
}
