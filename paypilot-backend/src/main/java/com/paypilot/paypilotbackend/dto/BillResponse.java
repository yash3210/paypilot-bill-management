package com.paypilot.paypilotbackend.dto;

import com.paypilot.paypilotbackend.entity.BillCategory;
import com.paypilot.paypilotbackend.entity.BillStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class BillResponse {
    private Long id;
    private String billerName;
    private BillCategory category;
    private BigDecimal amount;
    private LocalDate dueDate;
    private BillStatus status;
    private String notes;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
