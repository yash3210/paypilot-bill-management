package com.paypilot.paypilotbackend.dto;

import com.paypilot.paypilotbackend.entity.BillCategory;
import com.paypilot.paypilotbackend.entity.BillStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BillRequest {
    @NotBlank(message = "Biller name is required")
    private String billerName;

    @NotNull(message = "Category is required")
    private BillCategory category;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    private BillStatus status;
    private String notes;
}
