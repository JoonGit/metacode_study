package com.smartorder.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

// [Task Verification] Phase 2: JPA Entities - Revised StoreAiLog
@Entity
@Table(name = "store_ai_logs", indexes = {
        @Index(name = "idx_ai_logs_session", columnList = "session_id, turn_sequence")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreAiLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "turn_sequence", nullable = false)
    private Integer turnSequence;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "user_id")
    private Long userId;

    @Lob
    @Column(name = "user_prompt", nullable = false)
    private String userPrompt;

    @Lob
    @Column(name = "ai_response", nullable = false)
    private String aiResponse;

    @Column(name = "routing_node", length = 50, nullable = false)
    private String routingNode;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recommended_ids", columnDefinition = "JSON")
    private String recommendedIds;

    @Column(name = "linked_order_id")
    private Long linkedOrderId;

    @Lob
    @Column(name = "openai_metadata", columnDefinition = "CLOB")
    private String openaiMetadata;

    @Column(name = "latency_ms")
    private Double latencyMs;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
