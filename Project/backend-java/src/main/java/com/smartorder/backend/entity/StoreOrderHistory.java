package com.smartorder.backend.entity;

import com.smartorder.backend.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// [Task Verification] Phase 2: JPA Entities - History Domain
@Entity
@Table(name = "store_orders_history", indexes = {
        @Index(name = "idx_orders_history_order", columnList = "order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreOrderHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long historyId;

    @Column(name = "action_type", length = 10, nullable = false)
    private String actionType; // INSERT, UPDATE, DELETE

    @Column(name = "action_time", nullable = false)
    private LocalDateTime actionTime;

    @Column(name = "action_by", length = 50)
    private String actionBy;

    // --- 원본 데이터 스냅샷 ---
    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "total_amount", nullable = false)
    private Integer totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private OrderStatus status;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
