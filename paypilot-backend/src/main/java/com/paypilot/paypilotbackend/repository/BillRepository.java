package com.paypilot.paypilotbackend.repository;

import com.paypilot.paypilotbackend.entity.Bill;
import com.paypilot.paypilotbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByUserOrderByDueDateAsc(User user);
    Optional<Bill> findByIdAndUser(Long id, User user);
}
