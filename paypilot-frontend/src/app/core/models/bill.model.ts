export interface Bill {
  id: number;
  billerName: string;
  category: string;
  billDate?: string;
  dueDate: string;
  amount: number;
  amountDue: number;
  reminderFrequency?: string;
  notes?: string;
  recurring: boolean;
  paymentFrequency?: string;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  snoozedUntil?: string;
  overdueDays?: number;
  paidAt?: string;
}

export interface Payment {
  id: number;
  bill?: Bill;
  billerName?: string;
  category?: string;
  amount: number;
  paymentMethod: string;
  payerAccountNumber?: string;
  transactionRef: string;
  status: string;
  paidAt: string;
}

export interface ScheduledPayment {
  id: number;
  payeeName: string;
  payeeAddress: string;
  payeeBankDetails: string;
  paymentFrequency: string;
  scheduledDate: string;
  amount: number;
  paymentMode: string;
  payerAccountNumber: string;
  status: 'SCHEDULED' | 'CANCELLED' | 'EXECUTED';
  bill: Bill;
}

export interface ReminderSetting {
  id: number;
  reminderFrequency: string;
  reminderStartDate: string;
  customMessage: string;
  notificationPreference: string;
  enabled: boolean;
  bill: Bill;
}

export interface UserProfile {
  id: number;
  fullName?: string;
  email: string;
  panDetails?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  bankingPartner?: string;
}
