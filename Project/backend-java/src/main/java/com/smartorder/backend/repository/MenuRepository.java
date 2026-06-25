package com.smartorder.backend.repository;

import com.smartorder.backend.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// [Task Verification] Phase 2: JPA Entities
@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {
    org.springframework.data.domain.Page<Menu> findByStoreId(Long storeId, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<Menu> findByStoreIdAndCategoryId(Long storeId, Long categoryId, org.springframework.data.domain.Pageable pageable);
    List<Menu> findByCategoryId(Long categoryId);
}
