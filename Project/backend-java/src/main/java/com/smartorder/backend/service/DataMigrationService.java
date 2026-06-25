package com.smartorder.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartorder.backend.entity.*;
import com.smartorder.backend.enums.MenuStatus;
import com.smartorder.backend.enums.StoreStatus;
import com.smartorder.backend.enums.UserStatus;
import com.smartorder.backend.enums.UserType;
import com.smartorder.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import com.smartorder.backend.util.SnowflakeIdGenerator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.Reader;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataMigrationService {

    private final ServiceStoreRepository storeRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final MenuRepository menuRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final SnowflakeIdGenerator idGenerator;

    // 브랜드명 영문 매핑
    private static final Map<String, String> BRAND_MAP = new HashMap<>();
    static {
        BRAND_MAP.put("할리스", "hollys");
        BRAND_MAP.put("피자알볼로", "alvolo");
        BRAND_MAP.put("굽네치킨", "goobne");
        BRAND_MAP.put("교촌치킨", "kyochon");
        BRAND_MAP.put("푸라닭", "puradak");
        BRAND_MAP.put("비비큐", "bbq");
        BRAND_MAP.put("맘스터치", "momstouch");
        BRAND_MAP.put("써브웨이", "subway");
        BRAND_MAP.put("아웃백스테이크하우스", "outback");
        BRAND_MAP.put("파리바게뜨", "parisbaguette");
        BRAND_MAP.put("뚜레쥬르", "touslesjours");
        BRAND_MAP.put("이디야", "ediya");
        BRAND_MAP.put("메가엠지씨커피", "mega");
        BRAND_MAP.put("컴포즈커피", "compose");
        BRAND_MAP.put("빽다방", "paiks");
        BRAND_MAP.put("KFC", "kfc");
        BRAND_MAP.put("버거킹", "burgerking");
        BRAND_MAP.put("롯데리아", "lotteria");
        BRAND_MAP.put("맥도날드", "mcdonalds");
        BRAND_MAP.put("명랑시대쌀핫도그", "myungrang");
        BRAND_MAP.put("동대문엽기떡볶이", "yupdduk");
        BRAND_MAP.put("죠스떡볶이", "jaws");
        BRAND_MAP.put("신전떡볶이", "sinjeon");
    }

    private String getEnglishBrandName(String koreanName) {
        if (koreanName == null) return "unknown";
        String mapped = BRAND_MAP.get(koreanName.trim());
        if (mapped != null) return mapped;
        return "brand_" + koreanName.hashCode() % 10000;
    }

    @Transactional
    public void migrateCsvData(Reader reader) {
        log.info("Starting CSV data migration...");
        try {
            CSVFormat format = CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .build();

            try (CSVParser parser = new CSVParser(reader, format)) {
                for (CSVRecord record : parser) {
                    // 1. 업체명 파싱
                    String brandName = record.get("업체명").trim();
                    String englishBrandId = getEnglishBrandName(brandName);

                    // 2. 가맹점 생성 (캐싱을 위해 DB 조회)
                    ServiceStore store = getOrCreateStore(brandName, englishBrandId);

                    // 3. 점주 계정 생성
                    getOrCreateOwner(store, englishBrandId);

                    // 4. 식품명 파싱 (카테고리_메뉴명)
                    String fullName = record.get("식품명").trim();
                    String categoryName = "기타";
                    String menuName = fullName;

                    if (fullName.contains("_")) {
                        String[] parts = fullName.split("_", 2);
                        categoryName = parts[0].trim();
                        menuName = parts[1].trim();
                    }

                    // 5. 카테고리 생성
                    Category category = getOrCreateCategory(store, categoryName);

                    // 6. 메뉴 및 영양정보 JSON 생성
                    createMenuIfNotExist(store, category, menuName, record);
                }
            }
            log.info("CSV data migration completed.");
        } catch (Exception e) {
            log.error("Error during CSV migration", e);
            throw new RuntimeException(e);
        }
    }

    private ServiceStore getOrCreateStore(String brandName, String englishBrandId) {
        return storeRepository.findByStoreName(brandName)
                .orElseGet(() -> {
                    ServiceStore newStore = ServiceStore.builder()
                            .storeId(idGenerator.nextId())
                            .storeName(brandName)
                            .businessNumber((englishBrandId.length() > 6 ? englishBrandId.substring(0, 6) : englishBrandId) + "_" + (System.currentTimeMillis() % 10000000000L))
                            .ownerName("점주 " + brandName)
                            .status(StoreStatus.ACTIVE)
                            .build();
                    return storeRepository.save(newStore);
                });
    }

    private void getOrCreateOwner(ServiceStore store, String englishBrandId) {
        Optional<User> existingOwner = userRepository.findByStoreIdAndUserType(store.getStoreId(), UserType.OWNER);
        if (existingOwner.isEmpty()) {
            User owner = User.builder()
                    .userId(idGenerator.nextId())
                    .storeId(store.getStoreId())
                    .loginId(englishBrandId)
                    .passwordHash(passwordEncoder.encode("1234"))
                    .name(store.getStoreName() + " 점주")
                    .userType(UserType.OWNER)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(owner);
        }
    }

    private Category getOrCreateCategory(ServiceStore store, String categoryName) {
        return categoryRepository.findByStoreId(store.getStoreId())
                .stream()
                .filter(c -> c.getName().equals(categoryName))
                .findFirst()
                .orElseGet(() -> {
                    Category c = Category.builder()
                            .storeId(store.getStoreId())
                            .name(categoryName)
                            .build();
                    return categoryRepository.save(c);
                });
    }

    private void createMenuIfNotExist(ServiceStore store, Category category, String menuName, CSVRecord record) throws Exception {
        boolean exists = menuRepository.findByCategoryId(category.getCategoryId())
                .stream()
                .anyMatch(m -> m.getName().equals(menuName));

        if (exists) return;

        Menu menu = Menu.builder()
                .menuId(idGenerator.nextId())
                .storeId(store.getStoreId())
                .categoryId(category.getCategoryId())
                .name(menuName)
                .price(1004) // 가격 1004원으로 통일 (요청사항 반영)
                .description(record.get("업체명") + " " + menuName)
                .status(MenuStatus.ON_SALE)
                .build();

        // Nutrition JSON 구성
        ObjectNode nutrition = objectMapper.createObjectNode();
        
        putIfValid(nutrition, "kcal", record.get("에너지(kcal)"));
        putIfValid(nutrition, "protein", record.get("단백질(g)"));
        putIfValid(nutrition, "fat", record.get("지방(g)"));
        putIfValid(nutrition, "carbs", record.get("탄수화물(g)"));
        
        putIfValid(nutrition, "에너지밀도_kcal_g", record.get("에너지밀도(kcal/g)"));
        putIfValid(nutrition, "탄수화물_에너지비율_pct", record.get("탄수화물_에너지비율(%)"));
        putIfValid(nutrition, "단백질_에너지비율_pct", record.get("단백질_에너지비율(%)"));
        putIfValid(nutrition, "지방_에너지비율_pct", record.get("지방_에너지비율(%)"));
        putIfValid(nutrition, "단백질_INQ", record.get("단백질_INQ"));

        menu.setNutrition(nutrition.toString());

        // Metadata JSON (기본 이미지)
        ObjectNode metadata = objectMapper.createObjectNode();
        metadata.put("imageUrl", "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2'/%3E%3Cpath d='M7 2v20'/%3E%3Cpath d='M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'/%3E%3C/svg%3E");
        menu.setMetadata(metadata.toString());

        menuRepository.save(menu);
    }

    private void putIfValid(ObjectNode node, String key, String valueStr) {
        try {
            double val = Double.parseDouble(valueStr.trim());
            // -1은 없는 값이므로 JSON에 넣지 않음.
            if (val != -1.0) {
                node.put(key, val);
            }
        } catch (NumberFormatException e) {
            // 변환 불가 시 그냥 패스
        }
    }
}
