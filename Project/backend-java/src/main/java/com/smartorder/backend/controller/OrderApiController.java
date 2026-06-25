package com.smartorder.backend.controller;

import com.smartorder.backend.dto.OrderRequest;
import com.smartorder.backend.dto.OrderResponse;
import com.smartorder.backend.service.OrderService;
import java.util.List;
import com.smartorder.backend.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// [Task Verification] Phase 4: Core Backend - Order API
@Tag(name = "Order", description = "Order API")
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderApiController {

    private final OrderService orderService;

    @Operation(summary = "주문 생성")
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest request) {
        OrderResponse response = orderService.createOrder(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "단건 주문 조회")
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long orderId) {
        OrderResponse response = orderService.getOrder(orderId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "매장 주문 내역 조회")
    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<OrderResponse>> getStoreOrders(@PathVariable Long storeId) {
        List<OrderResponse> response = orderService.getStoreOrders(storeId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "주문 상태 변경")
    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable Long orderId, @RequestParam com.smartorder.backend.enums.OrderStatus status) {
        OrderResponse response = orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok(response);
    }
}
