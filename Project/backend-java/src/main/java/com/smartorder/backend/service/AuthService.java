package com.smartorder.backend.service;

import com.smartorder.backend.dto.LoginRequest;
import com.smartorder.backend.dto.LoginResponse;
import com.smartorder.backend.entity.User;
import com.smartorder.backend.repository.UserRepository;
import com.smartorder.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByLoginId(request.getLoginId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid login ID or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid login ID or password");
        }

        String token = jwtUtil.generateToken(
                user.getLoginId(),
                user.getUserType().name(),
                user.getStoreId()
        );

        return LoginResponse.builder()
                .token(token)
                .userId(user.getUserId())
                .loginId(user.getLoginId())
                .name(user.getName())
                .userType(user.getUserType())
                .storeId(user.getStoreId())
                .build();
    }
}
