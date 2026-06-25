package com.smartorder.backend.dto;

import com.smartorder.backend.enums.MenuStatus;
import lombok.Data;

@Data
public class MenuRequest {
    private Long categoryId;
    private String name;
    private Integer price;
    private String description;
    private MenuStatus status;
    private String metadata; // JSON for AI Keywords
    private String nutrition; // JSON for Nutritional Info (kcal, protein, fat, carbs)
}
