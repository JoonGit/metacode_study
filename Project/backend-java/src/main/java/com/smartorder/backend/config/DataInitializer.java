package com.smartorder.backend.config;

import com.smartorder.backend.entity.Category;
import com.smartorder.backend.entity.Menu;
import com.smartorder.backend.entity.ServiceStore;
import com.smartorder.backend.enums.MenuStatus;
import com.smartorder.backend.enums.StoreStatus;
import com.smartorder.backend.repository.CategoryRepository;
import com.smartorder.backend.repository.MenuRepository;
import com.smartorder.backend.repository.ServiceStoreRepository;
import com.smartorder.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ServiceStoreRepository storeRepository;
    private final MenuRepository menuRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            com.smartorder.backend.entity.User admin = com.smartorder.backend.entity.User.builder()
                    .userId(1L)
                    .loginId("admin")
                    .passwordHash(passwordEncoder.encode("1234"))
                    .name("최고관리자")
                    .userType(com.smartorder.backend.enums.UserType.ADMIN)
                    .status(com.smartorder.backend.enums.UserStatus.ACTIVE)
                    .build();
            userRepository.save(admin);
            
            com.smartorder.backend.entity.User storeOwner = com.smartorder.backend.entity.User.builder()
                    .userId(2L)
                    .storeId(1L)
                    .loginId("store1")
                    .passwordHash(passwordEncoder.encode("1234"))
                    .name("스마트오더 강남본점 점주")
                    .userType(com.smartorder.backend.enums.UserType.OWNER)
                    .status(com.smartorder.backend.enums.UserStatus.ACTIVE)
                    .build();
            userRepository.save(storeOwner);
            log.info("Mock users (admin, storeOwner) initialized.");
        }

        if (storeRepository.count() == 0) {
            ServiceStore store = ServiceStore.builder()
                    .storeId(1L)
                    .businessNumber("123-45-67890")
                    .storeName("스마트오더 강남본점")
                    .ownerName("김점주")
                    .status(StoreStatus.ACTIVE)
                    .adminPin(passwordEncoder.encode("1234"))
                    .build();
            storeRepository.save(store);
            log.info("Mock store initialized.");
        }

        if (categoryRepository.count() == 0) {
            List<Category> categories = List.of(
                    Category.builder().storeId(1L).name("커피").build(),
                    Category.builder().storeId(1L).name("에이드").build(),
                    Category.builder().storeId(1L).name("디저트").build()
            );
            categoryRepository.saveAll(categories);
            log.info("Mock categories initialized.");
        }

        if (menuRepository.count() == 0) {
            List<Menu> menus = List.of(
                    Menu.builder().menuId(101L).storeId(1L).categoryId(2L).name("아메리카노").price(4500).status(MenuStatus.ON_SALE)
                            .description("진하고 고소한 아메리카노").metadata("{\"aiKeywords\": [\"아메리카노\", \"커피\", \"시원한\"]}")
                            .nutrition("{\"kcal\":10,\"protein\":1,\"fat\":0,\"carbs\":2}").build(),
                    Menu.builder().menuId(102L).storeId(1L).categoryId(2L).name("카페라떼").price(5000).status(MenuStatus.ON_SALE)
                            .description("부드러운 우유가 들어간 라떼").metadata("{\"aiKeywords\": [\"라떼\", \"부드러운\", \"커피\"]}")
                            .nutrition("{\"kcal\":150,\"protein\":6,\"fat\":7,\"carbs\":15}").build(),
                    Menu.builder().menuId(103L).storeId(1L).categoryId(2L).name("바닐라라떼").price(5500).status(MenuStatus.ON_SALE)
                            .description("달콤한 바닐라 시럽 추가").metadata("{\"aiKeywords\": [\"단거\", \"바닐라\"]}").build(),
                    Menu.builder().menuId(104L).storeId(1L).categoryId(3L).name("레몬에이드").price(6000).status(MenuStatus.ON_SALE)
                            .description("상큼한 레몬 에이드").metadata("{\"aiKeywords\": [\"상큼한\", \"에이드\"]}").build(),
                    Menu.builder().menuId(105L).storeId(1L).categoryId(3L).name("자몽에이드").price(6000).status(MenuStatus.ON_SALE)
                            .description("쌉싸름한 자몽 에이드").metadata("{\"aiKeywords\": [\"에이드\", \"자몽\"]}").build(),
                    Menu.builder().menuId(106L).storeId(1L).categoryId(3L).name("밀크티").price(5500).status(MenuStatus.SOLD_OUT)
                            .description("향긋한 홍차와 우유").metadata("{\"aiKeywords\": [\"밀크티\", \"홍차\"]}").build(),
                    Menu.builder().menuId(107L).storeId(1L).categoryId(4L).name("치즈케이크").price(6500).status(MenuStatus.ON_SALE)
                            .description("꾸덕한 뉴욕 치즈 케이크").metadata("{\"aiKeywords\": [\"디저트\", \"케이크\", \"치즈\"]}").build(),
                    Menu.builder().menuId(108L).storeId(1L).categoryId(4L).name("초코롤").price(6000).status(MenuStatus.ON_SALE)
                            .description("달콤한 초코 롤 케이크").metadata("{\"aiKeywords\": [\"디저트\", \"초코\"]}").build(),
                    Menu.builder().menuId(109L).storeId(1L).categoryId(4L).name("크로플").price(5500).status(MenuStatus.ON_SALE)
                            .description("바삭한 크로플").metadata("{\"aiKeywords\": [\"디저트\", \"크로플\"]}").build()
            );

            menuRepository.saveAll(menus);
            log.info("Mock menus initialized.");
        }
    }
}
