package com.paypilot.paypilotbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "bills")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String billerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillCategory category;

    private LocalDate billDate;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(precision = 12, scale = 2)
    private BigDecimal amountDue;

    @Builder.Default
    private String reminderFrequency = "3 Days Before";

    private String notes;

    @Builder.Default
    private boolean recurring = false;

    @Builder.Default
    private String paymentFrequency = "MONTHLY";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BillStatus status = BillStatus.PENDING;

    private LocalDate snoozedUntil;
    private LocalDateTime paidAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @PrePersist
    public void prePersist() {
        if (this.amountDue == null) this.amountDue = this.amount;
        if (this.billDate == null) this.billDate = LocalDate.now();
        if (this.status == null) this.status = BillStatus.PENDING;
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }

    public BigDecimal getAmountDue() {
        return amountDue != null ? amountDue : amount;
    }

    @Transient
    public long getOverdueDays() {
        if (this.status == BillStatus.PAID || this.dueDate == null) return 0;
        LocalDate ref = (this.snoozedUntil != null && this.snoozedUntil.isAfter(this.dueDate)) ? this.snoozedUntil : this.dueDate;
        long diff = ChronoUnit.DAYS.between(ref, LocalDate.now());
        return Math.max(diff, 0);
    }
}
