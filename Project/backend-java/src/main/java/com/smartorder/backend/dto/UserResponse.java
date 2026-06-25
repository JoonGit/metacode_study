package com.smartorder.backend.dto;

import com.smartorder.backend.enums.UserType;
import com.smartorder.backend.enums.UserStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
    private Long userId;
    private String name;
    private String loginId;
    private Long storeId;
    private UserType userType;
    private UserStatus status;
    private String createdAt;
}
