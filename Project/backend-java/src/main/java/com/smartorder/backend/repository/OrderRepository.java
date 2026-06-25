package com.smartorder.backend.repository;

import com.smartorder.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// [Task Verification] Phase 2: JPA Entities
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
}
