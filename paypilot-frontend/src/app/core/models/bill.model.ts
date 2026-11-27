export type BillCategory =
  | 'ELECTRICITY'
  | 'INTERNET'
  | 'WATER'
  | 'CREDIT_CARD'
  | 'INSURANCE'
  | 'MOBILE'
  | 'RENT'
  | 'OTHER';

export type BillStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface Bill {
  id: number;
  billerName: string;
  category: BillCategory;
  amount: number;
  dueDate: string;
  status: BillStatus;
  notes?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface CreateBillRequest {
  billerName: string;
  category: BillCategory;
  amount: number;
  dueDate: string;
  notes?: string;
}
