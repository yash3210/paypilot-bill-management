package com.paypilot.paypilotbackend.controller;

import com.paypilot.paypilotbackend.entity.*;
import com.paypilot.paypilotbackend.repository.BillRepository;
import com.paypilot.paypilotbackend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    private final BillRepository billRepository;
    private final UserRepository userRepository;

    public BillController(BillRepository billRepository, UserRepository userRepository) {
        this.billRepository = billRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public List<Bill> getAllBills(Authentication auth) {
        User user = getCurrentUser(auth);
        List<Bill> bills = billRepository.findByUserOrderByDueDateAsc(user);
        LocalDate today = LocalDate.now();
        for (Bill b : bills) {
            if ((b.getStatus() == BillStatus.PENDING || b.getStatus() == BillStatus.PARTIALLY_PAID)
                    && b.getDueDate() != null && b.getDueDate().isBefore(today)) {
                if (b.getSnoozedUntil() == null || b.getSnoozedUntil().isBefore(today)) {
                    b.setStatus(BillStatus.OVERDUE);
                    billRepository.save(b);
                }
            }
        }
        return bills;
    }

    @PostMapping
    public Bill createBill(@RequestBody Map<String, Object> req, Authentication auth) {
        User user = getCurrentUser(auth);
        Bill bill = new Bill();
        bill.setUser(user);
        bill.setBillerName(req.get("billerName").toString());
        String catStr = req.getOrDefault("category", "OTHER").toString().toUpperCase().replace(" ", "_");
        try {
            bill.setCategory(BillCategory.valueOf(catStr));
        } catch (Exception e) {
            bill.setCategory(BillCategory.OTHER);
        }
        if (req.get("billDate") != null && !req.get("billDate").toString().isBlank()) {
            bill.setBillDate(LocalDate.parse(req.get("billDate").toString()));
        } else {
            bill.setBillDate(LocalDate.now());
        }
        bill.setDueDate(LocalDate.parse(req.get("dueDate").toString()));
        BigDecimal amt = new BigDecimal(req.get("amount").toString());
        bill.setAmount(amt);
        bill.setAmountDue(amt);
        bill.setReminderFrequency(req.getOrDefault("reminderFrequency", "3 Days Before").toString());
        bill.setRecurring(Boolean.parseBoolean(req.getOrDefault("recurring", false).toString()));
        bill.setPaymentFrequency(req.getOrDefault("paymentFrequency", "MONTHLY").toString());
        bill.setNotes(req.getOrDefault("notes", "").toString());
        bill.setStatus(BillStatus.PENDING);
        return billRepository.save(bill);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Bill> updateBill(@PathVariable Long id, @RequestBody Map<String, Object> req, Authentication auth) {
        User user = getCurrentUser(auth);
        return billRepository.findById(id)
                .filter(b -> b.getUser().getId().equals(user.getId()))
                .map(b -> {
                    if (req.containsKey("billerName")) b.setBillerName(req.get("billerName").toString());
                    if (req.containsKey("category")) {
                        String catStr = req.get("category").toString().toUpperCase().replace(" ", "_");
                        try { b.setCategory(BillCategory.valueOf(catStr)); } catch (Exception ignored) {}
                    }
                    if (req.containsKey("dueDate")) b.setDueDate(LocalDate.parse(req.get("dueDate").toString()));
                    if (req.containsKey("amount")) {
                        BigDecimal newAmt = new BigDecimal(req.get("amount").toString());
                        b.setAmount(newAmt);
                        if (b.getStatus() == BillStatus.PENDING) b.setAmountDue(newAmt);
                    }
                    if (req.containsKey("reminderFrequency")) b.setReminderFrequency(req.get("reminderFrequency").toString());
                    if (req.containsKey("recurring")) b.setRecurring(Boolean.parseBoolean(req.get("recurring").toString()));
                    if (req.containsKey("paymentFrequency")) b.setPaymentFrequency(req.get("paymentFrequency").toString());
                    if (req.containsKey("notes")) b.setNotes(req.get("notes").toString());
                    return ResponseEntity.ok(billRepository.save(b));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/snooze")
    public ResponseEntity<Bill> snoozeBill(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        User user = getCurrentUser(auth);
        return billRepository.findById(id)
                .filter(b -> b.getUser().getId().equals(user.getId()))
                .map(b -> {
                    LocalDate snoozeDate = LocalDate.parse(body.get("snoozedUntil"));
                    b.setSnoozedUntil(snoozeDate);
                    if (b.getStatus() == BillStatus.OVERDUE && !snoozeDate.isBefore(LocalDate.now())) {
                        b.setStatus(BillStatus.PENDING);
                    }
                    return ResponseEntity.ok(billRepository.save(b));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/mark-paid")
    public ResponseEntity<Bill> markAsPaid(@PathVariable Long id, Authentication auth) {
        User user = getCurrentUser(auth);
        return billRepository.findById(id)
                .filter(b -> b.getUser().getId().equals(user.getId()))
                .map(b -> {
                    b.setAmountDue(BigDecimal.ZERO);
                    b.setStatus(BillStatus.PAID);
                    b.setPaidAt(LocalDateTime.now());
                    return ResponseEntity.ok(billRepository.save(b));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBill(@PathVariable Long id, Authentication auth) {
        User user = getCurrentUser(auth);
        return billRepository.findById(id)
                .filter(b -> b.getUser().getId().equals(user.getId()))
                .map(b -> {
                    billRepository.delete(b);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
