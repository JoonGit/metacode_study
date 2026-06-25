package com.smartorder.backend.entity;

import com.smartorder.backend.enums.StoreStatus;
import jakarta.persistence.*;
import lombok.*;

// [Task Verification] Phase 2: JPA Entities - Master Domain
@Entity
@Table(name = "service_stores", indexes = {
        @Index(name = "idx_service_stores_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceStore extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_id")
    private Long storeId;

    @Column(name = "business_number", length = 20, nullable = false, unique = true)
    private String businessNumber;

    @Column(name = "store_name", length = 100, nullable = false)
    private String storeName;

    @Column(name = "owner_name", length = 50, nullable = false)
    private String ownerName;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private StoreStatus status;

    @Column(name = "admin_pin", length = 60)
    private String adminPin;
}
