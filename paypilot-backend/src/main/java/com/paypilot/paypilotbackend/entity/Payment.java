package com.paypilot.paypilotbackend.entity;

import com.paypilot.paypilotbackend.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String transactionRef;

    @Column(nullable = false)
    private String billerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillCategory category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    private String paymentDetail;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime paidAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @PrePersist
    protected void onCreate() {
        this.paidAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "SUCCESS";
        }
    }
}
