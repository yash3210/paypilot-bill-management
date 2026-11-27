package com.paypilot.paypilotbackend.controller;

import com.paypilot.paypilotbackend.entity.*;
import com.paypilot.paypilotbackend.repository.BillRepository;
import com.paypilot.paypilotbackend.repository.PaymentRepository;
import com.paypilot.paypilotbackend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final BillRepository billRepository;
    private final UserRepository userRepository;

    public PaymentController(PaymentRepository paymentRepository, BillRepository billRepository, UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.billRepository = billRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public List<Payment> getUserPayments(Authentication auth) {
        return paymentRepository.findByUserOrderByPaidAtDesc(getCurrentUser(auth));
    }

    @PostMapping
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> req, Authentication auth) {
        User user = getCurrentUser(auth);
        Long billId = Long.valueOf(req.get("billId").toString());
        String methodStr = req.getOrDefault("paymentMethod", "UPI").toString().toUpperCase().replace(" ", "_");
        PaymentMethod method;
        try {
            method = PaymentMethod.valueOf(methodStr);
        } catch (Exception e) {
            method = PaymentMethod.UPI;
        }
        String accountRef = req.getOrDefault("payerAccountNumber", "UPI / Linked Account").toString();

        Bill bill = billRepository.findById(billId)
                .filter(b -> b.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (bill.getStatus() == BillStatus.PAID) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bill is already paid"));
        }

        BigDecimal currentDue = bill.getAmountDue();
        BigDecimal payAmount = req.containsKey("amount") && req.get("amount") != null
                ? new BigDecimal(req.get("amount").toString())
                : currentDue;

        if (payAmount.compareTo(BigDecimal.ZERO) <= 0 || payAmount.compareTo(currentDue) > 0) {
            payAmount = currentDue;
        }

        BigDecimal remaining = currentDue.subtract(payAmount);
        bill.setAmountDue(remaining);
        if (remaining.compareTo(BigDecimal.ZERO) == 0) {
            bill.setStatus(BillStatus.PAID);
            bill.setPaidAt(LocalDateTime.now());
        } else {
            bill.setStatus(BillStatus.PARTIALLY_PAID);
        }
        billRepository.save(bill);

        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String randPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setBill(bill);
        payment.setBillerName(bill.getBillerName());
        payment.setCategory(bill.getCategory());
        payment.setAmount(payAmount);
        payment.setPaymentMethod(method);
        payment.setPayerAccountNumber(accountRef);
        payment.setTransactionRef("TXN-" + datePart + "-" + randPart);
        payment.setStatus("SUCCESS");
        payment.setPaidAt(LocalDateTime.now());

        return ResponseEntity.ok(paymentRepository.save(payment));
    }
}
