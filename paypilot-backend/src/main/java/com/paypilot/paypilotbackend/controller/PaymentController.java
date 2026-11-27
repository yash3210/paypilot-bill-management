package com.paypilot.paypilotbackend.controller;

import com.paypilot.paypilotbackend.dto.PaymentRequest;
import com.paypilot.paypilotbackend.dto.PaymentResponse;
import com.paypilot.paypilotbackend.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> payBill(@Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.processPayment(request));
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getPaymentHistory() {
        return ResponseEntity.ok(paymentService.getMyPayments());
    }
}
