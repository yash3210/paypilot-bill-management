package com.paypilot.paypilotbackend.repository;

import com.paypilot.paypilotbackend.entity.ReminderSetting;
import com.paypilot.paypilotbackend.entity.User;
import com.paypilot.paypilotbackend.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReminderSettingRepository extends JpaRepository<ReminderSetting, Long> {
    List<ReminderSetting> findByUser(User user);
    Optional<ReminderSetting> findByBill(Bill bill);
}
