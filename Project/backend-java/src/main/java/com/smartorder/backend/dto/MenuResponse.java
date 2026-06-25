package com.smartorder.backend.dto;

import com.smartorder.backend.enums.MenuStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MenuResponse {
    private Long menuId;
    private Long categoryId;
    private String name;
    private Integer price;
    private Integer discountPrice;
    private MenuStatus status;
    private String description;
    private String metadata;
    private String nutrition;
}
