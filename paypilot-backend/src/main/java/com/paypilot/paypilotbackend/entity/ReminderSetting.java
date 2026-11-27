package com.paypilot.paypilotbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "reminder_settings")
public class ReminderSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String reminderFrequency; // Daily, Weekly, Bi-weekly, Monthly
    private LocalDate reminderStartDate;
    private String customMessage;
    private String notificationPreference; // Email, SMS, Both
    private boolean enabled = true;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReminderFrequency() { return reminderFrequency; }
    public void setReminderFrequency(String reminderFrequency) { this.reminderFrequency = reminderFrequency; }
    public LocalDate getReminderStartDate() { return reminderStartDate; }
    public void setReminderStartDate(LocalDate reminderStartDate) { this.reminderStartDate = reminderStartDate; }
    public String getCustomMessage() { return customMessage; }
    public void setCustomMessage(String customMessage) { this.customMessage = customMessage; }
    public String getNotificationPreference() { return notificationPreference; }
    public void setNotificationPreference(String notificationPreference) { this.notificationPreference = notificationPreference; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public Bill getBill() { return bill; }
    public void setBill(Bill bill) { this.bill = bill; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
