package com.paypilot.paypilotbackend.dto;

import com.paypilot.paypilotbackend.entity.BillCategory;
import com.paypilot.paypilotbackend.entity.PaymentMethod;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {
    private Long id;
    private String transactionRef;
    private String billerName;
    private BillCategory category;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String paymentDetail;
    private String status;
    private LocalDateTime paidAt;
}
