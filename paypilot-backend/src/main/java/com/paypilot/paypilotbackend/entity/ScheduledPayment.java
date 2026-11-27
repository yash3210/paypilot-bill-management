package com.paypilot.paypilotbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "scheduled_payments")
public class ScheduledPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String payeeName;
    private String payeeAddress;
    private String payeeBankDetails;
    private String paymentFrequency;
    private LocalDate scheduledDate;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    private String paymentMode;
    private String payerAccountNumber;
    private String status = "SCHEDULED"; // SCHEDULED, CANCELLED, EXECUTED

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPayeeName() { return payeeName; }
    public void setPayeeName(String payeeName) { this.payeeName = payeeName; }
    public String getPayeeAddress() { return payeeAddress; }
    public void setPayeeAddress(String payeeAddress) { this.payeeAddress = payeeAddress; }
    public String getPayeeBankDetails() { return payeeBankDetails; }
    public void setPayeeBankDetails(String payeeBankDetails) { this.payeeBankDetails = payeeBankDetails; }
    public String getPaymentFrequency() { return paymentFrequency; }
    public void setPaymentFrequency(String paymentFrequency) { this.paymentFrequency = paymentFrequency; }
    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public String getPayerAccountNumber() { return payerAccountNumber; }
    public void setPayerAccountNumber(String payerAccountNumber) { this.payerAccountNumber = payerAccountNumber; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Bill getBill() { return bill; }
    public void setBill(Bill bill) { this.bill = bill; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
