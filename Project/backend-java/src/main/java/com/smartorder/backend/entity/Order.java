package com.smartorder.backend.entity;

import com.smartorder.backend.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

// [Task Verification] Phase 2: JPA Entities - Revised Order Domain
@Entity
@Table(name = "store_orders", indexes = {
        @Index(name = "idx_orders_store", columnList = "store_id, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
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
}
