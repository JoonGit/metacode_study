package com.smartorder.backend.controller;

import com.smartorder.backend.dto.MenuRequest;
import com.smartorder.backend.dto.MenuResponse;
import com.smartorder.backend.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// [Task Verification] Phase 4: Core Backend - Menu API
@Tag(name = "Menu", description = "Menu API")
@RestController
@RequestMapping("/api/stores/{storeId}/menus")
@RequiredArgsConstructor
public class MenuApiController {

    private final MenuService menuService;

    @Operation(summary = "매장별 메뉴 다건 조회 (Paging)")
    @GetMapping
    public ResponseEntity<Page<MenuResponse>> getMenus(
            @PathVariable Long storeId,
            @RequestParam(required = false) Long categoryId,
            Pageable pageable) {
        Page<MenuResponse> menus = menuService.getMenusByStore(storeId, categoryId, pageable);
        return ResponseEntity.ok(menus);
    }

    @Operation(summary = "메뉴 등록")
    @PostMapping
    public ResponseEntity<MenuResponse> createMenu(
            @PathVariable Long storeId,
            @RequestBody MenuRequest request) {
        MenuResponse menu = menuService.createMenu(storeId, request);
        return ResponseEntity.ok(menu);
    }

    @Operation(summary = "메뉴 수정")
    @PutMapping("/{menuId}")
    public ResponseEntity<MenuResponse> updateMenu(
            @PathVariable Long storeId,
            @PathVariable Long menuId,
            @RequestBody MenuRequest request) {
        MenuResponse menu = menuService.updateMenu(storeId, menuId, request);
        return ResponseEntity.ok(menu);
    }

    @Operation(summary = "메뉴 삭제")
    @DeleteMapping("/{menuId}")
    public ResponseEntity<Void> deleteMenu(
            @PathVariable Long storeId,
            @PathVariable Long menuId) {
        menuService.deleteMenu(storeId, menuId);
        return ResponseEntity.noContent().build();
    }
}
