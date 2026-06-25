package com.smartorder.backend.dto;

import com.smartorder.backend.entity.Category;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CategoryResponse {
    private Long categoryId;
    private Long storeId;
    private String name;

    public static CategoryResponse from(Category category) {
        return CategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .storeId(category.getStoreId())
                .name(category.getName())
                .build();
    }
}
