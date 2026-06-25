package com.smartorder.backend.dto;

import com.smartorder.backend.enums.UserType;
import com.smartorder.backend.enums.UserStatus;
import lombok.Data;

@Data
public class UserRequest {
    private String name;
    private String loginId;
    private Long storeId;
    private String password;
    private UserType userType;
    private UserStatus status;
}
