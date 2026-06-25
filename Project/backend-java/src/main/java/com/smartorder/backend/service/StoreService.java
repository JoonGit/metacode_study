package com.smartorder.backend.service;

import com.smartorder.backend.entity.ServiceStore;
import com.smartorder.backend.entity.Order;
import com.smartorder.backend.repository.ServiceStoreRepository;
import com.smartorder.backend.repository.OrderRepository;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.smartorder.backend.repository.UserRepository;
import com.smartorder.backend.entity.User;
import com.smartorder.backend.dto.UserRequest;
import com.smartorder.backend.dto.UserResponse;
import com.smartorder.backend.enums.UserType;
import com.smartorder.backend.enums.UserStatus;
import java.util.stream.Collectors;

// [Task Verification] Phase 4: Core Backend - StoreService
@Service
@RequiredArgsConstructor
public class StoreService {

    private final ServiceStoreRepository storeRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final com.smartorder.backend.util.SnowflakeIdGenerator snowflakeIdGenerator;

    @Transactional(readOnly = true)
    public ServiceStore getStore(Long storeId) {
        return storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found"));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStoreDashboard(Long storeId) {
        List<Order> allOrders = orderRepository.findAll(); // mock implementation
        long todayOrders = allOrders.stream().filter(o -> o.getStoreId().equals(storeId)).count();
        long todaySales = allOrders.stream().filter(o -> o.getStoreId().equals(storeId)).mapToLong(Order::getTotalAmount).sum();
        long aiRatio = 35; // mock value
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("todayOrders", todayOrders);
        stats.put("todaySales", todaySales);
        stats.put("aiRecommendationRatio", aiRatio);
        return stats;
    }

    @Transactional(readOnly = true)
    public boolean verifyPin(Long storeId, String rawPin) {
        ServiceStore store = getStore(storeId);
        if (store.getAdminPin() == null) {
            // No PIN set means false for security
            return false;
        }
        return passwordEncoder.matches(rawPin, store.getAdminPin());
    }

    @Transactional
    public void updatePin(Long storeId, String rawPin) {
        ServiceStore store = getStore(storeId);
        store.setAdminPin(passwordEncoder.encode(rawPin));
        storeRepository.save(store);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getStaffByStore(Long storeId) {
        return userRepository.findAll().stream()
                .filter(u -> storeId.equals(u.getStoreId()) && u.getUserType() == UserType.STAFF)
                .map(user -> UserResponse.builder()
                        .userId(user.getUserId())
                        .name(user.getName())
                        .loginId(user.getLoginId())
                        .storeId(user.getStoreId())
                        .userType(user.getUserType())
                        .status(user.getStatus())
                        .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : "2023-01-01")
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse createStoreStaff(Long storeId, UserRequest request) {
        User user = User.builder()
                .userId(snowflakeIdGenerator.nextId())
                .name(request.getName() != null ? request.getName() : request.getLoginId())
                .loginId(request.getLoginId())
                .storeId(storeId)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .userType(UserType.STAFF) // 무조건 STAFF로 강제
                .status(UserStatus.ACTIVE)
                .build();
        User saved = userRepository.save(user);
        
        return UserResponse.builder()
                .userId(saved.getUserId())
                .name(saved.getName())
                .loginId(saved.getLoginId())
                .storeId(saved.getStoreId())
                .userType(saved.getUserType())
                .status(saved.getStatus())
                .createdAt(saved.getCreatedAt() != null ? saved.getCreatedAt().toString() : "2023-01-01")
                .build();
    }
}
