package com.smartorder.backend.service;

import com.smartorder.backend.dto.MenuRequest;
import com.smartorder.backend.dto.MenuResponse;
import com.smartorder.backend.entity.Menu;
import com.smartorder.backend.repository.MenuRepository;
import com.smartorder.backend.enums.MenuStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

// [Task Verification] Phase 4: Core Backend - Service Layer + Embedding Trigger
@Service
@RequiredArgsConstructor
@Slf4j
public class MenuService {

    private final MenuRepository menuRepository;

    // WebClient to call ai-python for embedding (Fire-and-Forget)
    private final WebClient aiWebClient = WebClient.builder()
            .baseUrl("http://ai-python:8000")
            .build();

    @Transactional(readOnly = true)
    public Page<MenuResponse> getMenusByStore(Long storeId, Long categoryId, Pageable pageable) {
        Page<Menu> menus;
        if (categoryId != null && categoryId > 0) {
            menus = menuRepository.findByStoreIdAndCategoryId(storeId, categoryId, pageable);
        } else {
            menus = menuRepository.findByStoreId(storeId, pageable);
        }
        return menus.map(this::mapToDto);
    }

    @Transactional
    public MenuResponse createMenu(Long storeId, MenuRequest request) {
        Menu menu = Menu.builder()
                .menuId(System.currentTimeMillis())
                .storeId(storeId)
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .price(request.getPrice())
                .status(request.getStatus() != null ? request.getStatus() : MenuStatus.ON_SALE)
                .metadata(request.getMetadata())
                .nutrition(request.getNutrition())
                .description(request.getDescription())
                .build();
        Menu saved = menuRepository.save(menu);
        triggerEmbedUpsert(storeId, saved.getMenuId(), saved.getName(), saved.getDescription());
        return mapToDto(saved);
    }

    @Transactional
    public MenuResponse updateMenu(Long storeId, Long menuId, MenuRequest request) {
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new IllegalArgumentException("Menu not found"));

        if (request.getCategoryId() != null) menu.setCategoryId(request.getCategoryId());
        if (request.getName() != null) menu.setName(request.getName());
        if (request.getPrice() != null) menu.setPrice(request.getPrice());
        if (request.getStatus() != null) menu.setStatus(request.getStatus());
        if (request.getDescription() != null) menu.setDescription(request.getDescription());
        if (request.getMetadata() != null) menu.setMetadata(request.getMetadata());
        if (request.getNutrition() != null) menu.setNutrition(request.getNutrition());

        Menu updated = menuRepository.save(menu);
        triggerEmbedUpsert(storeId, updated.getMenuId(), updated.getName(), updated.getDescription());
        return mapToDto(updated);
    }

    @Transactional
    public void deleteMenu(Long storeId, Long menuId) {
        menuRepository.deleteById(menuId);
        triggerEmbedDelete(storeId, menuId);
    }

    /**
     * Fire-and-Forget: Asynchronously notify ai-python to upsert embedding for this menu.
     */
    @Async
    public void triggerEmbedUpsert(Long storeId, Long menuId, String menuName, String description) {
        try {
            aiWebClient.post()
                    .uri("/ai/internal/embed-menu")
                    .bodyValue(Map.of(
                            "store_id", storeId,
                            "menu_id", menuId,
                            "menu_name", menuName != null ? menuName : "",
                            "description", description != null ? description : ""
                    ))
                    .retrieve()
                    .toBodilessEntity()
                    .subscribe(
                            res -> log.info("Embed upsert queued for menu_id={}", menuId),
                            err -> log.warn("Failed to trigger embed upsert for menu_id={}: {}", menuId, err.getMessage())
                    );
        } catch (Exception e) {
            log.warn("triggerEmbedUpsert error for menu_id={}: {}", menuId, e.getMessage());
        }
    }

    /**
     * Fire-and-Forget: Asynchronously notify ai-python to delete embedding for this menu.
     */
    @Async
    public void triggerEmbedDelete(Long storeId, Long menuId) {
        try {
            aiWebClient.delete()
                    .uri("/ai/internal/embed-menu/{storeId}/{menuId}", storeId, menuId)
                    .retrieve()
                    .toBodilessEntity()
                    .subscribe(
                            res -> log.info("Embed delete queued for menu_id={}", menuId),
                            err -> log.warn("Failed to trigger embed delete for menu_id={}: {}", menuId, err.getMessage())
                    );
        } catch (Exception e) {
            log.warn("triggerEmbedDelete error for menu_id={}: {}", menuId, e.getMessage());
        }
    }

    private MenuResponse mapToDto(Menu menu) {
        return MenuResponse.builder()
                .menuId(menu.getMenuId())
                .categoryId(menu.getCategoryId())
                .name(menu.getName())
                .price(menu.getPrice())
                .discountPrice(menu.getDiscountPrice())
                .status(menu.getStatus())
                .description(menu.getDescription())
                .metadata(menu.getMetadata())
                .nutrition(menu.getNutrition())
                .build();
    }
}
