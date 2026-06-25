package com.smartorder.backend.entity;

import jakarta.persistence.*;
import lombok.*;

// [Task Verification] Phase 2: JPA Entities - Category
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Category extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long categoryId;

    @Column(nullable = false)
    private Long storeId;

    @Column(nullable = false, length = 100)
    private String name;
}
