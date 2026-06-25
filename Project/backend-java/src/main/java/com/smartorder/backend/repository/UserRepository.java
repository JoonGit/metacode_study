package com.smartorder.backend.repository;

import com.smartorder.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import com.smartorder.backend.enums.UserType;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLoginId(String loginId);
    Optional<User> findByStoreIdAndUserType(Long storeId, UserType userType);
}
