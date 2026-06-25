package com.smartorder.backend.service;

import com.smartorder.backend.dto.StoreRequest;
import com.smartorder.backend.dto.StoreResponse;
import com.smartorder.backend.dto.UserRequest;
import com.smartorder.backend.dto.UserResponse;
import com.smartorder.backend.entity.Order;
import com.smartorder.backend.entity.ServiceStore;
import com.smartorder.backend.entity.User;
import com.smartorder.backend.enums.StoreStatus;
import com.smartorder.backend.enums.UserStatus;
import com.smartorder.backend.repository.OrderRepository;
import com.smartorder.backend.repository.ServiceStoreRepository;
import com.smartorder.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final ServiceStoreRepository storeRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.smartorder.backend.util.SnowflakeIdGenerator snowflakeIdGenerator;

    @Transactional(readOnly = true)
    public Map<String, Object> getAdminDashboard() {
        long totalStores = storeRepository.count();
        List<Order> allOrders = orderRepository.findAll();
        long totalSales = allOrders.stream().mapToLong(Order::getTotalAmount).sum();
        long totalAiTokens = 150000; // Mock value
        long totalAiCalls = 450; // Mock value
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStores", totalStores);
        stats.put("totalSales", totalSales);
        stats.put("totalAiTokens", totalAiTokens);
        stats.put("totalAiCalls", totalAiCalls);
        
        return stats;
    }

    @Transactional(readOnly = true)
    public List<StoreResponse> getStores() {
        return storeRepository.findAll().stream().map(store -> {
            String loginId = "";
            java.util.Optional<User> owner = userRepository.findByStoreIdAndUserType(store.getStoreId(), com.smartorder.backend.enums.UserType.OWNER);
            if (owner.isPresent()) {
                loginId = owner.get().getLoginId();
            }
            return StoreResponse.builder()
                .storeId(store.getStoreId())
                .businessNumber(store.getBusinessNumber())
                .storeName(store.getStoreName())
                .ownerName(store.getOwnerName())
                .address("-") // mock address
                .status(store.getStatus())
                .loginId(loginId)
                .createdAt(store.getCreatedAt() != null ? store.getCreatedAt().toString() : "2023-01-01")
                .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public StoreResponse createStore(StoreRequest request) {
        ServiceStore store = ServiceStore.builder()
                .storeId(snowflakeIdGenerator.nextId())
                .businessNumber(request.getBusinessNumber())
                .storeName(request.getStoreName())
                .ownerName(request.getOwnerName())
                .status(request.getStatus() != null ? request.getStatus() : StoreStatus.PENDING)
                .build();
        ServiceStore saved = storeRepository.save(store);

        // 점주 계정 자동 생성
        String loginId = request.getLoginId();
        if (loginId == null || loginId.isEmpty()) {
            loginId = "store_" + saved.getStoreId();
        }
        String pwd = request.getLoginPw();
        if (pwd == null || pwd.isEmpty()) {
            pwd = "1234";
        }
        User owner = new User();
        owner.setLoginId(loginId);
        owner.setName(request.getOwnerName() + " 점주");
        owner.setPasswordHash(passwordEncoder.encode(pwd));
        owner.setUserType(com.smartorder.backend.enums.UserType.OWNER);
        owner.setStoreId(saved.getStoreId());
        owner.setStatus(UserStatus.ACTIVE);
        userRepository.save(owner);

        return StoreResponse.builder()
                .storeId(saved.getStoreId())
                .businessNumber(saved.getBusinessNumber())
                .storeName(saved.getStoreName())
                .ownerName(saved.getOwnerName())
                .address("-")
                .status(saved.getStatus())
                .loginId(loginId)
                .createdAt(saved.getCreatedAt() != null ? saved.getCreatedAt().toString() : "2023-01-01")
                .build();
    }

    @Transactional
    public StoreResponse updateStore(Long storeId, StoreRequest request) {
        ServiceStore store = storeRepository.findById(storeId).orElseThrow(() -> new IllegalArgumentException("Store not found"));
        store.setBusinessNumber(request.getBusinessNumber());
        store.setStoreName(request.getStoreName());
        store.setOwnerName(request.getOwnerName());
        store.setStatus(request.getStatus());

        // 점주 계정 업데이트
        java.util.Optional<User> ownerOpt = userRepository.findByStoreIdAndUserType(storeId, com.smartorder.backend.enums.UserType.OWNER);
        String finalLoginId = request.getLoginId();
        if (ownerOpt.isPresent()) {
            User owner = ownerOpt.get();
            if (request.getLoginId() != null && !request.getLoginId().isEmpty()) {
                owner.setLoginId(request.getLoginId());
            } else {
                finalLoginId = owner.getLoginId();
            }
            if (request.getLoginPw() != null && !request.getLoginPw().isEmpty()) {
                owner.setPasswordHash(passwordEncoder.encode(request.getLoginPw()));
            }
            userRepository.save(owner);
        }

        return StoreResponse.builder()
                .storeId(store.getStoreId())
                .businessNumber(store.getBusinessNumber())
                .storeName(store.getStoreName())
                .ownerName(store.getOwnerName())
                .address("-")
                .status(store.getStatus())
                .loginId(finalLoginId)
                .createdAt(store.getCreatedAt() != null ? store.getCreatedAt().toString() : "2023-01-01")
                .build();
    }

    @Transactional
    public void updateStoreStatus(Long storeId, String statusStr) {
        ServiceStore store = storeRepository.findById(storeId).orElseThrow(() -> new IllegalArgumentException("Store not found"));
        store.setStatus(StoreStatus.valueOf(statusStr.toUpperCase()));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getStaff() {
        return userRepository.findAll().stream().map(user -> UserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .loginId(user.getLoginId())
                .storeId(user.getStoreId())
                .userType(user.getUserType())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : "2023-01-01")
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public UserResponse createStaff(UserRequest request) {
        if (userRepository.findByLoginId(request.getLoginId()).isPresent()) {
            throw new IllegalArgumentException("이미 사용중인 로그인 아이디입니다.");
        }

        User user = new User();
        user.setLoginId(request.getLoginId());
        user.setName(request.getName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        // Admin 페이지에서는 시스템 관리자만 생성 가능하도록 컨트롤러가 넘겨주지만 안전하게 재지정
        user.setUserType(com.smartorder.backend.enums.UserType.ADMIN);
        user.setStatus(request.getStatus() != null ? request.getStatus() : UserStatus.ACTIVE);

        userRepository.save(user);
        return UserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .loginId(user.getLoginId())
                .storeId(user.getStoreId())
                .userType(user.getUserType())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : "2023-01-01")
                .build();
    }

    @Transactional
    public UserResponse updateStaff(Long userId, UserRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setName(request.getName());
        user.setLoginId(request.getLoginId());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        // Admin 권한 강제
        user.setUserType(com.smartorder.backend.enums.UserType.ADMIN);
        user.setStatus(request.getStatus());
        return UserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .loginId(user.getLoginId())
                .storeId(user.getStoreId())
                .userType(user.getUserType())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : "2023-01-01")
                .build();
    }

    @Transactional
    public void deleteStaff(Long userId) {
        userRepository.deleteById(userId);
    }

    @Transactional
    public void updateStaffStatus(Long userId, String statusStr) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(UserStatus.valueOf(statusStr.toUpperCase()));
    }
}
