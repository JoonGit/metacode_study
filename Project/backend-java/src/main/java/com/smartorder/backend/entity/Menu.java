package com.smartorder.backend.entity;

import com.smartorder.backend.enums.MenuStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

// [Task Verification] Phase 2: JPA Entities - Revised Menu Domain
@Entity
@Table(name = "store_menus", indexes = {
        @Index(name = "idx_store_menus_store", columnList = "store_id, status"),
        @Index(name = "idx_store_menus_updated", columnList = "updated_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Menu extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_id")
    private Long menuId;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "menu_name", length = 100, nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer price;

    @Column(name = "discount_price")
    private Integer discountPrice;

    @Column(name = "discount_start")
    private LocalDateTime discountStart;

    @Column(name = "discount_end")
    private LocalDateTime discountEnd;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private MenuStatus status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private String metadata;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private String nutrition;

    @Lob
    @Column(name = "description")
    private String description;

    @Column(columnDefinition = "VECTOR(1536)")
    private String embedding;
}
