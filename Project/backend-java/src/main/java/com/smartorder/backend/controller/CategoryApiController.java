package com.smartorder.backend.controller;

import com.smartorder.backend.dto.CategoryResponse;
import com.smartorder.backend.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Category", description = "Category API")
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryApiController {

    private final CategoryService categoryService;

    @Operation(summary = "매장별 카테고리 목록 조회")
    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<CategoryResponse>> getCategories(@PathVariable Long storeId) {
        List<CategoryResponse> categories = categoryService.getCategoriesByStore(storeId);
        return ResponseEntity.ok(categories);
    }

    @Operation(summary = "매장 카테고리 생성")
    @PostMapping("/store/{storeId}")
    public ResponseEntity<CategoryResponse> createCategory(
            @PathVariable Long storeId,
            @RequestBody com.smartorder.backend.dto.CategoryRequest request) {
        return ResponseEntity.ok(categoryService.createCategory(storeId, request));
    }

    @Operation(summary = "카테고리 수정")
    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long categoryId,
            @RequestBody com.smartorder.backend.dto.CategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(categoryId, request));
    }

    @Operation(summary = "카테고리 삭제")
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long categoryId) {
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
}
