package com.smartorder.backend.controller;

import com.smartorder.backend.dto.MenuResponse;
import com.smartorder.backend.service.AiLogService;
import com.smartorder.backend.service.MenuService;
import com.smartorder.backend.service.DataMigrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

// [Task Verification] Phase 4: Core Backend - Internal API
@Tag(name = "Internal", description = "Internal API for AI Pipeline")
@RestController
@RequestMapping("/api/internal")
@RequiredArgsConstructor
@Slf4j
public class InternalApiController {

    private final MenuService menuService;
    private final AiLogService aiLogService;
    private final DataMigrationService dataMigrationService;

    @Operation(summary = "매장별 전체 메뉴 조회 (캐시 동기화용)")
    @GetMapping("/menus")
    public ResponseEntity<List<MenuResponse>> getMenusForInternal(@RequestParam Long storeId) {
        List<MenuResponse> menus = menuService.getMenusByStore(storeId, null, Pageable.unpaged()).getContent();
        return ResponseEntity.ok(menus);
    }

    @Operation(summary = "AI 대화 로그 적재 (OpenAI 메타데이터 포함)")
    @PostMapping("/ai-logs")
    public ResponseEntity<String> saveAiLog(@RequestBody Map<String, Object> payload) {
        try {
            Long storeId = Long.valueOf(payload.get("store_id").toString());

            // session_id can be a UUID string — hash it to Long for DB compatibility
            String sessionIdStr = payload.get("session_id") != null ? payload.get("session_id").toString() : "0";
            Long sessionId;
            try {
                sessionId = Long.valueOf(sessionIdStr);
            } catch (NumberFormatException e) {
                sessionId = (long) sessionIdStr.hashCode();
            }

            Integer turnSequence = payload.get("turnSequence") instanceof Integer
                    ? (Integer) payload.get("turnSequence") : 1;
            String userPrompt = payload.get("user_prompt") != null ? payload.get("user_prompt").toString() : "";
            String aiResponse = payload.get("ai_response") != null ? payload.get("ai_response").toString() : "";
            String routingNode = payload.get("routing_node") != null ? payload.get("routing_node").toString() : "unknown";

            // OpenAI metadata (serialized JSON string)
            String openaiMetadata = payload.get("openai_metadata") != null
                    ? payload.get("openai_metadata").toString() : null;

            Double latencyMs = payload.get("latency_ms") instanceof Number
                    ? ((Number) payload.get("latency_ms")).doubleValue() : null;

            aiLogService.saveLog(storeId, sessionId, turnSequence, userPrompt, aiResponse, routingNode, openaiMetadata, latencyMs);
            return ResponseEntity.ok("success");
        } catch (Exception e) {
            log.error("Failed to save AI log: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Failed: " + e.getMessage());
        }
    }

    @Operation(summary = "CSV 파일 업로드 및 데이터 마이그레이션")
    @PostMapping("/migrate-csv")
    public ResponseEntity<String> migrateCsv(@RequestParam("file") MultipartFile file) {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            dataMigrationService.migrateCsvData(reader);
            return ResponseEntity.ok("Migration completed successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Migration failed: " + e.getMessage());
        }
    }
}
