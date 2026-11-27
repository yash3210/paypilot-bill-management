import { BillCategory } from './bill.model';

export type PaymentMethod = 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING';

export interface PaymentRequest {
  billId: number;
  paymentMethod: PaymentMethod;
  paymentDetail?: string;
}

export interface Payment {
  id: number;
  transactionRef: string;
  billerName: string;
  category: BillCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDetail?: string;
  status: string;
  paidAt: string;
}
