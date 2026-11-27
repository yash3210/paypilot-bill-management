package com.paypilot.paypilotbackend.service;

import com.paypilot.paypilotbackend.dto.BillRequest;
import com.paypilot.paypilotbackend.dto.BillResponse;
import com.paypilot.paypilotbackend.entity.Bill;
import com.paypilot.paypilotbackend.entity.BillStatus;
import com.paypilot.paypilotbackend.entity.User;
import com.paypilot.paypilotbackend.repository.BillRepository;
import com.paypilot.paypilotbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository billRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    public List<BillResponse> getMyBills() {
        User user = getCurrentUser();
        return billRepository.findByUserOrderByDueDateAsc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BillResponse createBill(BillRequest request) {
        User user = getCurrentUser();
        BillStatus initialStatus = request.getStatus() != null
                ? request.getStatus()
                : (request.getDueDate().isBefore(LocalDate.now()) ? BillStatus.OVERDUE : BillStatus.PENDING);

        Bill bill = Bill.builder()
                .billerName(request.getBillerName())
                .category(request.getCategory())
                .amount(request.getAmount())
                .dueDate(request.getDueDate())
                .status(initialStatus)
                .notes(request.getNotes())
                .paidAt(initialStatus == BillStatus.PAID ? LocalDateTime.now() : null)
                .user(user)
                .build();

        return toResponse(billRepository.save(bill));
    }

    public BillResponse markAsPaid(Long id) {
        User user = getCurrentUser();
        Bill bill = billRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        bill.setStatus(BillStatus.PAID);
        bill.setPaidAt(LocalDateTime.now());
        return toResponse(billRepository.save(bill));
    }

    public void deleteBill(Long id) {
        User user = getCurrentUser();
        Bill bill = billRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        billRepository.delete(bill);
    }

    private BillResponse toResponse(Bill bill) {
        BillStatus effectiveStatus = bill.getStatus();
        if (effectiveStatus == BillStatus.PENDING && bill.getDueDate().isBefore(LocalDate.now())) {
            effectiveStatus = BillStatus.OVERDUE;
        }
        return BillResponse.builder()
                .id(bill.getId())
                .billerName(bill.getBillerName())
                .category(bill.getCategory())
                .amount(bill.getAmount())
                .dueDate(bill.getDueDate())
                .status(effectiveStatus)
                .notes(bill.getNotes())
                .paidAt(bill.getPaidAt())
                .createdAt(bill.getCreatedAt())
                .build();
    }
}
