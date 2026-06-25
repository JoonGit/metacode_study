package com.smartorder.backend.dto;

import com.smartorder.backend.enums.OrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class OrderResponse {
    private Long orderId;
    private Long storeId;
    private Integer totalAmount;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;

    @Getter
    @Builder
    public static class OrderItemResponse {
        private Long orderItemId;
        private Long menuId;
        private Integer quantity;
        private Integer unitPrice;
        private String selectedOptions;
    }
}
