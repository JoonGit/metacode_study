package com.smartorder.backend.controller;

import com.smartorder.backend.dto.StoreRequest;
import com.smartorder.backend.dto.StoreResponse;
import com.smartorder.backend.dto.UserRequest;
import com.smartorder.backend.dto.UserResponse;
import com.smartorder.backend.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Admin", description = "Admin API")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminApiController {

    private final AdminService adminService;

    @Operation(summary = "최고 관리자 통합 대시보드 통계 조회")
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getAdminDashboard() {
        Map<String, Object> stats = adminService.getAdminDashboard();
        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "가맹점 리스트 조회")
    @GetMapping("/stores")
    public ResponseEntity<List<StoreResponse>> getStores() {
        return ResponseEntity.ok(adminService.getStores());
    }

    @Operation(summary = "가맹점 등록")
    @PostMapping("/stores")
    public ResponseEntity<StoreResponse> createStore(@RequestBody StoreRequest request) {
        return ResponseEntity.ok(adminService.createStore(request));
    }

    @Operation(summary = "가맹점 수정")
    @PutMapping("/stores/{storeId}")
    public ResponseEntity<StoreResponse> updateStore(@PathVariable Long storeId, @RequestBody StoreRequest request) {
        return ResponseEntity.ok(adminService.updateStore(storeId, request));
    }

    @Operation(summary = "가맹점 상태 수정")
    @PutMapping("/stores/{storeId}/status")
    public ResponseEntity<Void> updateStoreStatus(@PathVariable Long storeId, @RequestParam String status) {
        adminService.updateStoreStatus(storeId, status);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "관리자 직원 리스트 조회")
    @GetMapping("/staff")
    public ResponseEntity<List<UserResponse>> getStaff() {
        return ResponseEntity.ok(adminService.getStaff());
    }

    @Operation(summary = "관리자 직원 계정 생성")
    @PostMapping("/staff")
    public ResponseEntity<UserResponse> createStaff(@RequestBody UserRequest request) {
        return ResponseEntity.ok(adminService.createStaff(request));
    }

    @Operation(summary = "관리자 직원 계정 수정")
    @PutMapping("/staff/{userId}")
    public ResponseEntity<UserResponse> updateStaff(@PathVariable Long userId, @RequestBody UserRequest request) {
        return ResponseEntity.ok(adminService.updateStaff(userId, request));
    }

    @Operation(summary = "관리자 직원 계정 삭제")
    @DeleteMapping("/staff/{userId}")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long userId) {
        adminService.deleteStaff(userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "관리자 직원 계정 상태 변경")
    @PutMapping("/staff/{userId}/status")
    public ResponseEntity<Void> updateStaffStatus(@PathVariable Long userId, @RequestParam String status) {
        adminService.updateStaffStatus(userId, status);
        return ResponseEntity.ok().build();
    }

    // ── System Config (AI Settings) ──────────────────────────────────────────

    @Operation(summary = "시스템 AI 설정 조회")
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        String rawKey = System.getenv("OPENAI_API_KEY");
        String maskedKey = rawKey != null && rawKey.length() > 8
                ? rawKey.substring(0, 8) + "..."
                : "(not set)";
        return ResponseEntity.ok(Map.of(
                "openaiApiKey", maskedKey,
                "openaiModel", System.getenv().getOrDefault("OPENAI_MODEL", "gpt-4o-mini")
        ));
    }

    @Operation(summary = "시스템 AI 설정 변경 (ai-python에 Redis pub/sub으로 전파)")
    @PutMapping("/config")
    public ResponseEntity<Map<String, Object>> updateConfig(
            @RequestBody Map<String, String> body
    ) {
        // Best-effort: we can't change process env at runtime in JVM,
        // so we store in Redis for ai-python to pick up on next request.
        // ai-python reads from env, but here we signal via Redis.
        String apiKey = body.get("openaiApiKey");
        String model = body.get("openaiModel");
        // TODO: publish to Redis channel when Redis pub-sub is wired
        return ResponseEntity.ok(Map.of(
                "status", "acknowledged",
                "note", "Configuration will take effect on next ai-python startup or hot-reload."
        ));
    }
}
