package com.smartorder.backend.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderRequest {
    private Long storeId;
    private Long userId;
    private List<OrderItemRequest> items;

    @Getter
    @Setter
    public static class OrderItemRequest {
        private Long menuId;
        private Integer quantity;
        private Integer unitPrice;
        private String selectedOptions;
    }
}
