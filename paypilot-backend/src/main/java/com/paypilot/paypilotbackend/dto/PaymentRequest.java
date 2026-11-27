package com.paypilot.paypilotbackend.dto;

import com.paypilot.paypilotbackend.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentRequest {
    @NotNull(message = "Bill ID is required")
    private Long billId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String paymentDetail;
}
