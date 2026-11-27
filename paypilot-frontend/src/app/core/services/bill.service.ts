import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bill, Payment, ScheduledPayment, ReminderSetting, UserProfile } from '../models/bill.model';

@Injectable({ providedIn: 'root' })
export class BillService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  // Bills
  getBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.apiUrl}/bills`);
  }
  createBill(payload: Partial<Bill>): Observable<Bill> {
    return this.http.post<Bill>(`${this.apiUrl}/bills`, payload);
  }
  updateBill(id: number, payload: Partial<Bill>): Observable<Bill> {
    return this.http.put<Bill>(`${this.apiUrl}/bills/${id}`, payload);
  }
  snoozeBill(id: number, snoozedUntil: string): Observable<Bill> {
    return this.http.patch<Bill>(`${this.apiUrl}/bills/${id}/snooze`, { snoozedUntil });
  }
  markAsPaid(id: number): Observable<Bill> {
    return this.http.patch<Bill>(`${this.apiUrl}/bills/${id}/mark-paid`, {});
  }
  deleteBill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bills/${id}`);
  }

  // Payments (Full & Partial)
  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/payments`);
  }
  payBill(payload: { billId: number; amount: number; paymentMethod: string; payerAccountNumber?: string }): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/payments`, payload);
  }

  // Scheduled Payments
  getSchedules(): Observable<ScheduledPayment[]> {
    return this.http.get<ScheduledPayment[]>(`${this.apiUrl}/schedules`);
  }
  createSchedule(payload: any): Observable<ScheduledPayment> {
    return this.http.post<ScheduledPayment>(`${this.apiUrl}/schedules`, payload);
  }
  modifySchedule(id: number, payload: { scheduledDate: string; paymentMode?: string }): Observable<ScheduledPayment> {
    return this.http.put<ScheduledPayment>(`${this.apiUrl}/schedules/${id}`, payload);
  }
  cancelSchedule(id: number): Observable<ScheduledPayment> {
    return this.http.patch<ScheduledPayment>(`${this.apiUrl}/schedules/${id}/cancel`, {});
  }

  // Reminder Settings
  getReminders(): Observable<ReminderSetting[]> {
    return this.http.get<ReminderSetting[]>(`${this.apiUrl}/reminders`);
  }
  saveReminder(payload: any): Observable<ReminderSetting> {
    return this.http.post<ReminderSetting>(`${this.apiUrl}/reminders`, payload);
  }

  // Profile & Password Reset
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }
  updateProfile(payload: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, payload);
  }
  resetPassword(email: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { email, newPassword });
  }
}
