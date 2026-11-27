package com.paypilot.paypilotbackend.service;

import com.paypilot.paypilotbackend.dto.PaymentRequest;
import com.paypilot.paypilotbackend.dto.PaymentResponse;
import com.paypilot.paypilotbackend.entity.Bill;
import com.paypilot.paypilotbackend.entity.BillStatus;
import com.paypilot.paypilotbackend.entity.Payment;
import com.paypilot.paypilotbackend.entity.User;
import com.paypilot.paypilotbackend.repository.BillRepository;
import com.paypilot.paypilotbackend.repository.PaymentRepository;
import com.paypilot.paypilotbackend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BillRepository billRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        User user = getCurrentUser();
        Bill bill = billRepository.findByIdAndUser(request.getBillId(), user)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (bill.getStatus() == BillStatus.PAID) {
            throw new RuntimeException("Bill is already paid");
        }

        LocalDateTime now = LocalDateTime.now();
        bill.setStatus(BillStatus.PAID);
        bill.setPaidAt(now);
        billRepository.save(bill);

        String txnRef = "TXN-" + now.format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        Payment payment = Payment.builder()
                .transactionRef(txnRef)
                .billerName(bill.getBillerName())
                .category(bill.getCategory())
                .amount(bill.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .paymentDetail(request.getPaymentDetail())
                .status("SUCCESS")
                .user(user)
                .build();

        return toResponse(paymentRepository.save(payment));
    }

    public List<PaymentResponse> getMyPayments() {
        User user = getCurrentUser();
        return paymentRepository.findByUserOrderByPaidAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private PaymentResponse toResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .transactionRef(p.getTransactionRef())
                .billerName(p.getBillerName())
                .category(p.getCategory())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .paymentDetail(p.getPaymentDetail())
                .status(p.getStatus())
                .paidAt(p.getPaidAt())
                .build();
    }
}
