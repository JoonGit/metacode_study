package com.smartorder.backend.dto;

import com.smartorder.backend.enums.StoreStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StoreResponse {
    private Long storeId;
    private String businessNumber;
    private String storeName;
    private String ownerName;
    private String address;
    private StoreStatus status;
    private String loginId;
    private String createdAt;
}
