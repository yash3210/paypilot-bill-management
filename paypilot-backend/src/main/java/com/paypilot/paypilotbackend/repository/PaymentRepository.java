package com.paypilot.paypilotbackend.repository;

import com.paypilot.paypilotbackend.entity.Payment;
import com.paypilot.paypilotbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserOrderByPaidAtDesc(User user);
}
