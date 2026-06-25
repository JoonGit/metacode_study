package com.smartorder.backend.repository;

import com.smartorder.backend.entity.StoreAiLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// [Task Verification] Phase 4: Core Backend - Internal & Webhook
@Repository
public interface AiLogRepository extends JpaRepository<StoreAiLog, Long> {
    List<StoreAiLog> findByStoreIdOrderByCreatedAtDesc(Long storeId);
}
