package com.smartorder.backend.controller;

import com.smartorder.backend.dto.PinRequest;
import com.smartorder.backend.entity.ServiceStore;
import com.smartorder.backend.entity.StoreAiLog;
import com.smartorder.backend.service.StoreService;
import com.smartorder.backend.service.AiLogService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// [Task Verification] Phase 4: Core Backend - Store API
@Tag(name = "Store", description = "Store API")
@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreApiController {

    private final StoreService storeService;
    private final AiLogService aiLogService;

    @Operation(summary = "매장 정보 조회")
    @GetMapping("/{storeId}")
    public ResponseEntity<ServiceStore> getStore(@PathVariable Long storeId) {
        ServiceStore store = storeService.getStore(storeId);
        return ResponseEntity.ok(store);
    }

    @Operation(summary = "매장 대시보드 통계 조회")
    @GetMapping("/{storeId}/dashboard")
    public ResponseEntity<Map<String, Object>> getStoreDashboard(@PathVariable Long storeId) {
        Map<String, Object> stats = storeService.getStoreDashboard(storeId);
        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "매장 AI 채팅 분석 로그 조회")
    @GetMapping("/{storeId}/ai-logs")
    public ResponseEntity<List<StoreAiLog>> getStoreAiLogs(@PathVariable Long storeId) {
        List<StoreAiLog> logs = aiLogService.getLogsByStore(storeId);
        return ResponseEntity.ok(logs);
    }

    @Operation(summary = "매장 관리자 PIN 검증")
    @PostMapping("/{storeId}/verify-pin")
    public ResponseEntity<Boolean> verifyPin(@PathVariable Long storeId, @Valid @RequestBody PinRequest request) {
        boolean isValid = storeService.verifyPin(storeId, request.getPin());
        return ResponseEntity.ok(isValid);
    }

    @Operation(summary = "매장 관리자 PIN 변경")
    @PutMapping("/{storeId}/pin")
    public ResponseEntity<Void> updatePin(@PathVariable Long storeId, @Valid @RequestBody PinRequest request) {
        storeService.updatePin(storeId, request.getPin());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "매장 직원 목록 조회")
    @GetMapping("/{storeId}/staff")
    public ResponseEntity<List<com.smartorder.backend.dto.UserResponse>> getStoreStaff(@PathVariable Long storeId) {
        return ResponseEntity.ok(storeService.getStaffByStore(storeId));
    }

    @Operation(summary = "매장 직원 생성")
    @PostMapping("/{storeId}/staff")
    public ResponseEntity<com.smartorder.backend.dto.UserResponse> createStoreStaff(@PathVariable Long storeId, @RequestBody com.smartorder.backend.dto.UserRequest request) {
        return ResponseEntity.ok(storeService.createStoreStaff(storeId, request));
    }
}
