package com.paypilot.paypilotbackend.repository;

import com.paypilot.paypilotbackend.entity.ScheduledPayment;
import com.paypilot.paypilotbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScheduledPaymentRepository extends JpaRepository<ScheduledPayment, Long> {
    List<ScheduledPayment> findByUserOrderByScheduledDateAsc(User user);
}
