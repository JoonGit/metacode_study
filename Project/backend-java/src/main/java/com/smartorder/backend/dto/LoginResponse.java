package com.smartorder.backend.dto;

import com.smartorder.backend.enums.UserType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String token;
    private Long userId;
    private String loginId;
    private String name;
    private UserType userType;
    private Long storeId;
}
