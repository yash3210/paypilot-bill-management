package com.paypilot.paypilotbackend.controller;

import com.paypilot.paypilotbackend.entity.*;
import com.paypilot.paypilotbackend.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BrdFeaturesController {

    private final BillRepository billRepository;
    private final UserRepository userRepository;
    private final ScheduledPaymentRepository scheduledPaymentRepository;
    private final ReminderSettingRepository reminderSettingRepository;
    private final PasswordEncoder passwordEncoder;

    public BrdFeaturesController(
            BillRepository billRepository,
            UserRepository userRepository,
            ScheduledPaymentRepository scheduledPaymentRepository,
            ReminderSettingRepository reminderSettingRepository,
            PasswordEncoder passwordEncoder) {
        this.billRepository = billRepository;
        this.userRepository = userRepository;
        this.scheduledPaymentRepository = scheduledPaymentRepository;
        this.reminderSettingRepository = reminderSettingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private User getCurrentUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // --- SCHEDULED PAYMENTS (User Story 3.1 & 3.2) ---
    @GetMapping("/schedules")
    public List<ScheduledPayment> getSchedules(Authentication auth) {
        return scheduledPaymentRepository.findByUserOrderByScheduledDateAsc(getCurrentUser(auth));
    }

    @PostMapping("/schedules")
    public ResponseEntity<?> createSchedule(@RequestBody Map<String, Object> req, Authentication auth) {
        User user = getCurrentUser(auth);
        Long billId = Long.valueOf(req.get("billId").toString());
        Bill bill = billRepository.findById(billId)
                .filter(b -> b.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        ScheduledPayment sp = new ScheduledPayment();
        sp.setUser(user);
        sp.setBill(bill);
        sp.setPayeeName(req.getOrDefault("payeeName", bill.getBillerName()).toString());
        sp.setPayeeAddress(req.getOrDefault("payeeAddress", "India").toString());
        sp.setPayeeBankDetails(req.getOrDefault("payeeBankDetails", "HDFC Bank • IFSC HDFC0001234").toString());
        sp.setPaymentFrequency(req.getOrDefault("paymentFrequency", bill.getPaymentFrequency()).toString());
        sp.setScheduledDate(LocalDate.parse(req.get("scheduledDate").toString()));
        sp.setAmount(new BigDecimal(req.getOrDefault("amount", bill.getAmountDue()).toString()));
        sp.setPaymentMode(req.getOrDefault("paymentMode", "Net Banking").toString());
        sp.setPayerAccountNumber(req.getOrDefault("payerAccountNumber", "XXXX-XXXX-4589").toString());
        sp.setStatus("SCHEDULED");

        return ResponseEntity.ok(scheduledPaymentRepository.save(sp));
    }

    @PutMapping("/schedules/{id}")
    public ResponseEntity<ScheduledPayment> modifySchedule(@PathVariable Long id, @RequestBody Map<String, String> req, Authentication auth) {
        User user = getCurrentUser(auth);
        return scheduledPaymentRepository.findById(id)
                .filter(s -> s.getUser().getId().equals(user.getId()))
                .map(s -> {
                    if (req.containsKey("scheduledDate")) s.setScheduledDate(LocalDate.parse(req.get("scheduledDate")));
                    if (req.containsKey("paymentMode")) s.setPaymentMode(req.get("paymentMode"));
                    s.setStatus("SCHEDULED");
                    return ResponseEntity.ok(scheduledPaymentRepository.save(s));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/schedules/{id}/cancel")
    public ResponseEntity<ScheduledPayment> cancelSchedule(@PathVariable Long id, Authentication auth) {
        User user = getCurrentUser(auth);
        return scheduledPaymentRepository.findById(id)
                .filter(s -> s.getUser().getId().equals(user.getId()))
                .map(s -> {
                    s.setStatus("CANCELLED");
                    return ResponseEntity.ok(scheduledPaymentRepository.save(s));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // --- REMINDER SETTINGS (User Story 2.3) ---
    @GetMapping("/reminders")
    public List<ReminderSetting> getReminders(Authentication auth) {
        return reminderSettingRepository.findByUser(getCurrentUser(auth));
    }

    @PostMapping("/reminders")
    public ResponseEntity<ReminderSetting> saveReminder(@RequestBody Map<String, Object> req, Authentication auth) {
        User user = getCurrentUser(auth);
        Long billId = Long.valueOf(req.get("billId").toString());
        Bill bill = billRepository.findById(billId)
                .filter(b -> b.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        ReminderSetting rs = reminderSettingRepository.findByBill(bill).orElse(new ReminderSetting());
        rs.setUser(user);
        rs.setBill(bill);
        rs.setReminderFrequency(req.getOrDefault("reminderFrequency", "Weekly").toString());
        rs.setReminderStartDate(LocalDate.parse(req.getOrDefault("reminderStartDate", LocalDate.now().toString()).toString()));
        rs.setCustomMessage(req.getOrDefault("customMessage", "Bill payment due soon for " + bill.getBillerName()).toString());
        rs.setNotificationPreference(req.getOrDefault("notificationPreference", "Email").toString());
        rs.setEnabled(Boolean.parseBoolean(req.getOrDefault("enabled", true).toString()));

        bill.setReminderFrequency(rs.getReminderFrequency());
        billRepository.save(bill);

        return ResponseEntity.ok(reminderSettingRepository.save(rs));
    }

    // --- USER PROFILE & PASSWORD RESET (Slide 15 & Slide 42) ---
    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(Authentication auth) {
        return ResponseEntity.ok(getCurrentUser(auth));
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestBody Map<String, String> req, Authentication auth) {
        User user = getCurrentUser(auth);
        if (req.containsKey("panDetails")) user.setPanDetails(req.get("panDetails"));
        if (req.containsKey("bankAccountNumber")) user.setBankAccountNumber(req.get("bankAccountNumber"));
        if (req.containsKey("ifscCode")) user.setIfscCode(req.get("ifscCode"));
        if (req.containsKey("bankingPartner")) user.setBankingPartner(req.get("bankingPartner"));
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PostMapping("/auth/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String newPassword = req.get("newPassword");
        return userRepository.findByEmail(email)
                .map(u -> {
                    u.setPassword(passwordEncoder.encode(newPassword));
                    userRepository.save(u);
                    return ResponseEntity.ok(Map.of("message", "Password reset successful"));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("message", "No user found with that email")));
    }
}
