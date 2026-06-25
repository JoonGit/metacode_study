package com.smartorder.backend.entity;

import com.smartorder.backend.enums.UserStatus;
import com.smartorder.backend.enums.UserType;
import jakarta.persistence.*;
import lombok.*;

// [Task Verification] Phase 2: JPA Entities - Master Domain
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_login_id", columnList = "login_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "store_id")
    private Long storeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", length = 20, nullable = false)
    private UserType userType;

    @Column(name = "login_id", length = 100, nullable = false, unique = true)
    private String loginId;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Column(length = 50, nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private UserStatus status;
}
