package com.smartorder.backend.dto;

import com.smartorder.backend.enums.StoreStatus;
import lombok.Data;

@Data
public class StoreRequest {
    private String businessNumber;
    private String storeName;
    private String ownerName;
    private StoreStatus status;
    private String loginId;
    private String loginPw;
}
