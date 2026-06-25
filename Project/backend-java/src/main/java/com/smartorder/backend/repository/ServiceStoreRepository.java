package com.smartorder.backend.repository;

import com.smartorder.backend.entity.ServiceStore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServiceStoreRepository extends JpaRepository<ServiceStore, Long> {
    Optional<ServiceStore> findByStoreName(String storeName);
}
