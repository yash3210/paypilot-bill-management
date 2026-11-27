package com.paypilot.paypilotbackend.controller;

import com.paypilot.paypilotbackend.dto.BillRequest;
import com.paypilot.paypilotbackend.dto.BillResponse;
import com.paypilot.paypilotbackend.service.BillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;

    @GetMapping
    public ResponseEntity<List<BillResponse>> getMyBills() {
        return ResponseEntity.ok(billService.getMyBills());
    }

    @PostMapping
    public ResponseEntity<BillResponse> createBill(@Valid @RequestBody BillRequest request) {
        return ResponseEntity.ok(billService.createBill(request));
    }

    @PatchMapping("/{id}/pay")
    public ResponseEntity<BillResponse> markAsPaid(@PathVariable Long id) {
        return ResponseEntity.ok(billService.markAsPaid(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBill(@PathVariable Long id) {
        billService.deleteBill(id);
        return ResponseEntity.noContent().build();
    }
}
