package com.smartorder.backend.service;

import com.smartorder.backend.dto.OrderRequest;
import com.smartorder.backend.dto.OrderResponse;
import com.smartorder.backend.entity.Menu;
import com.smartorder.backend.entity.Order;
import com.smartorder.backend.entity.OrderItem;
import com.smartorder.backend.enums.MenuStatus;
import com.smartorder.backend.enums.OrderStatus;
import com.smartorder.backend.exception.InvalidPriceException;
import com.smartorder.backend.exception.SoldOutException;
import com.smartorder.backend.repository.MenuRepository;
import com.smartorder.backend.repository.OrderItemRepository;
import com.smartorder.backend.repository.OrderRepository;
import com.smartorder.backend.util.SnowflakeIdGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

// [Task Verification] Phase 4: Core Backend - OrderService
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuRepository menuRepository;
    private final SnowflakeIdGenerator snowflakeIdGenerator;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        int calculatedTotal = 0;

        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Menu menu = menuRepository.findById(itemReq.getMenuId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu not found: " + itemReq.getMenuId()));

            if (menu.getStatus() == MenuStatus.SOLD_OUT) {
                throw new SoldOutException("메뉴가 품절되었습니다: " + menu.getName());
            }

            int expectedPrice = menu.getDiscountPrice() != null ? menu.getDiscountPrice() : menu.getPrice();
            if (expectedPrice != itemReq.getUnitPrice()) {
                throw new InvalidPriceException("요청한 단가(" + itemReq.getUnitPrice() + ")가 현재 메뉴 가격(" + expectedPrice + ")과 일치하지 않습니다. 메뉴: " + menu.getName());
            }

            calculatedTotal += (expectedPrice * itemReq.getQuantity());
        }

        long orderId = snowflakeIdGenerator.nextId();

        Order order = Order.builder()
                .orderId(orderId)
                .storeId(request.getStoreId())
                .userId(request.getUserId())
                .totalAmount(calculatedTotal)
                .status(OrderStatus.PENDING)
                .build();

        orderRepository.save(order);

        List<OrderItem> orderItems = request.getItems().stream().map(req -> OrderItem.builder()
                .orderItemId(snowflakeIdGenerator.nextId())
                .orderId(orderId)
                .menuId(req.getMenuId())
                .quantity(req.getQuantity())
                .unitPrice(req.getUnitPrice())
                .selectedOptions(req.getSelectedOptions())
                .build()).collect(Collectors.toList());

        orderItemRepository.saveAll(orderItems);

        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .storeId(order.getStoreId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .items(orderItems.stream().map(item -> OrderResponse.OrderItemResponse.builder()
                        .orderItemId(item.getOrderItemId())
                        .menuId(item.getMenuId())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .selectedOptions(item.getSelectedOptions())
                        .build()).collect(Collectors.toList()))
                .build();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        
        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .storeId(order.getStoreId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .items(items.stream().map(item -> OrderResponse.OrderItemResponse.builder()
                        .orderItemId(item.getOrderItemId())
                        .menuId(item.getMenuId())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .selectedOptions(item.getSelectedOptions())
                        .build()).collect(Collectors.toList()))
                .build();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getStoreOrders(Long storeId) {
        List<Order> orders = orderRepository.findAll(); // Simplified for mock, ideally should filter by storeId with custom query
        return orders.stream()
                .filter(o -> o.getStoreId().equals(storeId))
                .map(order -> OrderResponse.builder()
                    .orderId(order.getOrderId())
                    .storeId(order.getStoreId())
                    .totalAmount(order.getTotalAmount())
                    .status(order.getStatus())
                    .createdAt(order.getCreatedAt())
                    .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        order.setStatus(status);
        orderRepository.save(order);
        
        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .storeId(order.getStoreId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
