import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { BillService } from '../../core/services/bill.service';
import { PaymentService } from '../../core/services/payment.service';
import { Bill, BillCategory, BillStatus } from '../../core/models/bill.model';
import { Payment, PaymentMethod } from '../../core/models/payment.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="layout">
      <header class="navbar">
        <div class="nav-brand">
          <span class="badge">PP</span>
          <span class="title">PayPilot</span>
        </div>
        <div class="nav-actions">
          <span class="user-pill">
            {{ authService.currentUser()?.fullName }} ({{ authService.currentUser()?.email }})
          </span>
          <button class="btn-logout" (click)="authService.logout()">Logout</button>
        </div>
      </header>

      <main class="container">
        <!-- Payment Receipt Toast -->
        @if (latestReceipt()) {
          <div class="receipt-banner">
            <div>
              <strong>Payment Successful!</strong>
              <span>
                Paid ₹{{ latestReceipt()!.amount | number:'1.2-2' }} to {{ latestReceipt()!.billerName }}
                via {{ formatLabel(latestReceipt()!.paymentMethod) }} • Ref:
                <code>{{ latestReceipt()!.transactionRef }}</code>
              </span>
            </div>
            <button class="close-toast" (click)="latestReceipt.set(null)">✕</button>
          </div>
        }

        <!-- KPI Summary Cards -->
        <section class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-label">Total Due / Pending</span>
            <h2 class="kpi-value due">₹{{ billService.totalPendingAmount() | number:'1.2-2' }}</h2>
            <span class="kpi-sub">{{ billService.pendingCount() }} active bill(s)</span>
          </div>

          <div class="kpi-card">
            <span class="kpi-label">Total Paid</span>
            <h2 class="kpi-value paid">₹{{ billService.totalPaidAmount() | number:'1.2-2' }}</h2>
            <span class="kpi-sub">{{ paymentService.payments().length }} completed transaction(s)</span>
          </div>

          <div class="kpi-card action-card">
            <div>
              <span class="kpi-label">Quick Action</span>
              <p class="kpi-sub" style="margin-top: 4px;">Add utility, card, or subscription bill</p>
            </div>
            <button class="btn-primary" (click)="toggleForm()">
              {{ showAddForm() ? 'Close Form' : '+ Add New Bill' }}
            </button>
          </div>
        </section>

        <!-- Add Bill Form -->
        @if (showAddForm()) {
          <section class="card form-card">
            <h3>Add New Bill</h3>
            @if (formError()) {
              <div class="alert-error">{{ formError() }}</div>
            }
            <form [formGroup]="billForm" (ngSubmit)="onCreateBill()" class="bill-form-grid">
              <div class="form-group">
                <label>Biller Name</label>
                <input type="text" formControlName="billerName" placeholder="e.g., Airtel Fiber, Tata Power" />
              </div>

              <div class="form-group">
                <label>Category</label>
                <select formControlName="category">
                  @for (cat of categories; track cat) {
                    <option [value]="cat">{{ formatLabel(cat) }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Amount (₹)</label>
                <input type="number" step="0.01" formControlName="amount" placeholder="1499.00" />
              </div>

              <div class="form-group">
                <label>Due Date</label>
                <input type="date" formControlName="dueDate" />
              </div>

              <div class="form-group full-width">
                <label>Notes (Optional)</label>
                <input type="text" formControlName="notes" placeholder="Consumer ID or auto-debit note" />
              </div>

              <div class="form-actions full-width">
                <button type="submit" class="btn-primary" [disabled]="billForm.invalid || submitting()">
                  {{ submitting() ? 'Saving...' : 'Save Bill' }}
                </button>
              </div>
            </form>
          </section>
        }

        <!-- Main View Switcher: Bills vs Payment History -->
        <div class="view-switcher">
          <button
            class="view-tab"
            [class.active]="activeSection() === 'BILLS'"
            (click)="activeSection.set('BILLS')">
            My Bills ({{ billService.bills().length }})
          </button>
          <button
            class="view-tab"
            [class.active]="activeSection() === 'HISTORY'"
            (click)="activeSection.set('HISTORY')">
            Payment History & Receipts ({{ paymentService.payments().length }})
          </button>
        </div>

        @if (activeSection() === 'BILLS') {
          <section class="card">
            <div class="table-header">
              <h3>Manage Bills</h3>
              <div class="filter-tabs">
                @for (tab of tabs; track tab) {
                  <button
                    class="tab-btn"
                    [class.active]="selectedFilter() === tab"
                    (click)="selectedFilter.set(tab)">
                    {{ tab }}
                  </button>
                }
              </div>
            </div>

            @if (billService.loading()) {
              <p class="empty-state">Loading your bills...</p>
            } @else if (filteredBills().length === 0) {
              <div class="empty-state">
                <p>No bills found under <strong>{{ selectedFilter() }}</strong>.</p>
                <button class="btn-outline" (click)="showAddForm.set(true)">+ Add a bill</button>
              </div>
            } @else {
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Biller</th>
                      <th>Category</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th style="text-align: right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (bill of filteredBills(); track bill.id) {
                      <tr>
                        <td>
                          <div class="biller-name">{{ bill.billerName }}</div>
                          @if (bill.notes) {
                            <div class="biller-notes">{{ bill.notes }}</div>
                          }
                        </td>
                        <td><span class="cat-chip">{{ formatLabel(bill.category) }}</span></td>
                        <td>{{ bill.dueDate }}</td>
                        <td class="amount-cell">₹{{ bill.amount | number:'1.2-2' }}</td>
                        <td>
                          <span class="status-badge" [ngClass]="bill.status.toLowerCase()">
                            {{ bill.status }}
                          </span>
                        </td>
                        <td class="actions-cell">
                          @if (bill.status !== 'PAID') {
                            <button class="btn-pay" (click)="openPaymentModal(bill)">Pay Now</button>
                          }
                          <button class="btn-del" (click)="onDelete(bill.id)">Delete</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        } @else {
          <!-- Payment History Section -->
          <section class="card">
            <div class="table-header">
              <h3>Transaction History & Receipts</h3>
            </div>

            @if (paymentService.payments().length === 0) {
              <div class="empty-state">
                <p>No payments processed yet. Click <strong>Pay Now</strong> on any pending bill to pay.</p>
              </div>
            } @else {
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Transaction Ref</th>
                      <th>Biller</th>
                      <th>Method</th>
                      <th>Date & Time</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (txn of paymentService.payments(); track txn.id) {
                      <tr>
                        <td><code class="txn-ref">{{ txn.transactionRef }}</code></td>
                        <td>
                          <div class="biller-name">{{ txn.billerName }}</div>
                          <div class="biller-notes">{{ formatLabel(txn.category) }}</div>
                        </td>
                        <td>
                          <div>{{ formatLabel(txn.paymentMethod) }}</div>
                          @if (txn.paymentDetail) {
                            <div class="biller-notes">{{ txn.paymentDetail }}</div>
                          }
                        </td>
                        <td>{{ txn.paidAt | date:'medium' }}</td>
                        <td class="amount-cell">₹{{ txn.amount | number:'1.2-2' }}</td>
                        <td><span class="status-badge paid">{{ txn.status }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        }
      </main>

      <!-- Payment Checkout Modal -->
      @if (selectedBillForPayment()) {
        <div class="modal-backdrop" (click)="closePaymentModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>PayPilot Secure Checkout</h3>
              <button class="close-modal" (click)="closePaymentModal()">✕</button>
            </div>

            <div class="checkout-summary">
              <div>
                <span class="summary-label">Paying to</span>
                <div class="summary-biller">{{ selectedBillForPayment()!.billerName }}</div>
                <span class="biller-notes">Due: {{ selectedBillForPayment()!.dueDate }}</span>
              </div>
              <div class="summary-amount">
                ₹{{ selectedBillForPayment()!.amount | number:'1.2-2' }}
              </div>
            </div>

            <form [formGroup]="paymentForm" (ngSubmit)="confirmPayment()">
              <div class="form-group">
                <label>Select Payment Method</label>
                <div class="method-grid">
                  @for (m of paymentMethods; track m.value) {
                    <button
                      type="button"
                      class="method-btn"
                      [class.selected]="paymentForm.value.paymentMethod === m.value"
                      (click)="selectMethod(m.value)">
                      {{ m.label }}
                    </button>
                  }
                </div>
              </div>

              <div class="form-group" style="margin-top: 1rem;">
                <label>{{ paymentDetailLabel() }}</label>
                <input
                  type="text"
                  formControlName="paymentDetail"
                  [placeholder]="paymentDetailPlaceholder()" />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-logout" (click)="closePaymentModal()">Cancel</button>
                <button type="submit" class="btn-pay-confirm" [disabled]="processingPayment()">
                  {{ processingPayment() ? 'Processing...' : 'Confirm & Pay ₹' + selectedBillForPayment()!.amount }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .navbar {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      padding: 0.9rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-weight: 700;
      font-size: 1.15rem;
    }
    .badge {
      background: var(--primary);
      color: #fff;
      padding: 0.3rem 0.55rem;
      border-radius: 8px;
      font-size: 0.85rem;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .user-pill {
      font-size: 0.875rem;
      color: var(--text-muted);
      background: var(--bg-page);
      padding: 0.4rem 0.85rem;
      border-radius: 999px;
      border: 1px solid var(--border);
    }
    .btn-logout {
      background: transparent;
      border: 1px solid var(--border);
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-logout:hover {
      background: var(--danger-bg);
      color: var(--danger);
      border-color: #fecaca;
    }
    .container {
      max-width: 1120px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .receipt-banner {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      padding: 0.9rem 1.25rem;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.92rem;
    }
    .receipt-banner strong { margin-right: 0.5rem; }
    .receipt-banner code {
      background: #d1fae5;
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      font-weight: 600;
    }
    .close-toast {
      background: transparent;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      color: #065f46;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.4rem 1.6rem;
    }
    .action-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
    }
    .kpi-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      font-weight: 600;
    }
    .kpi-value {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0.35rem 0;
    }
    .kpi-value.due { color: #b45309; }
    .kpi-value.paid { color: var(--success); }
    .kpi-sub { font-size: 0.85rem; color: var(--text-muted); }
    .view-switcher {
      display: flex;
      gap: 0.75rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.75rem;
    }
    .view-tab {
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 0.55rem 1.15rem;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-muted);
    }
    .view-tab.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.6rem;
    }
    .form-card h3 { margin-bottom: 1.1rem; }
    .bill-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
    }
    .full-width { grid-column: 1 / -1; }
    .form-group label {
      display: block;
      font-size: 0.82rem;
      font-weight: 500;
      margin-bottom: 0.35rem;
    }
    .form-group input, .form-group select {
      width: 100%;
      padding: 0.6rem 0.8rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.92rem;
      background: #fff;
    }
    .btn-primary {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 0.65rem 1.2rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline {
      margin-top: 0.75rem;
      background: #fff;
      border: 1px solid var(--primary);
      color: var(--primary);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .filter-tabs { display: flex; gap: 0.5rem; }
    .tab-btn {
      padding: 0.4rem 0.85rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--bg-page);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-muted);
    }
    .tab-btn.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left;
      font-size: 0.78rem;
      text-transform: uppercase;
      color: var(--text-muted);
      padding: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 0.9rem 0.75rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.92rem;
    }
    .biller-name { font-weight: 600; }
    .biller-notes { font-size: 0.8rem; color: var(--text-muted); }
    .txn-ref {
      background: var(--bg-page);
      padding: 0.25rem 0.55rem;
      border-radius: 6px;
      border: 1px solid var(--border);
      font-size: 0.82rem;
      font-weight: 600;
    }
    .cat-chip {
      background: #eff6ff;
      color: var(--primary);
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .amount-cell { font-weight: 600; }
    .status-badge {
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .status-badge.pending { background: #fef3c7; color: #b45309; }
    .status-badge.paid { background: #dcfce7; color: #15803d; }
    .status-badge.overdue { background: #fee2e2; color: #b91c1c; }
    .actions-cell {
      text-align: right;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .btn-pay {
      background: var(--success);
      color: #fff;
      border: none;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-del {
      background: transparent;
      color: var(--danger);
      border: 1px solid #fecaca;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .empty-state {
      text-align: center;
      padding: 2.5rem 1rem;
      color: var(--text-muted);
    }
    .alert-error {
      background: var(--danger-bg);
      color: var(--danger);
      padding: 0.7rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }
    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1000;
    }
    .modal-card {
      width: 100%;
      max-width: 460px;
      background: #fff;
      border-radius: 16px;
      padding: 1.75rem;
      box-shadow: 0 20px 35px rgba(15, 23, 42, 0.2);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .close-modal {
      background: transparent;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      color: var(--text-muted);
    }
    .checkout-summary {
      background: var(--bg-page);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .summary-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }
    .summary-biller { font-weight: 700; font-size: 1.05rem; }
    .summary-amount { font-size: 1.45rem; font-weight: 700; color: var(--primary); }
    .method-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem;
    }
    .method-btn {
      padding: 0.65rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: #fff;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }
    .method-btn.selected {
      border-color: var(--primary);
      background: #eff6ff;
      color: var(--primary);
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .btn-pay-confirm {
      background: var(--success);
      color: #fff;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.92rem;
      cursor: pointer;
    }
    .btn-pay-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly billService = inject(BillService);
  readonly paymentService = inject(PaymentService);
  private readonly fb = inject(FormBuilder);

  readonly showAddForm = signal(false);
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly selectedFilter = signal<'ALL' | BillStatus>('ALL');
  readonly activeSection = signal<'BILLS' | 'HISTORY'>('BILLS');

  readonly selectedBillForPayment = signal<Bill | null>(null);
  readonly processingPayment = signal(false);
  readonly latestReceipt = signal<Payment | null>(null);

  readonly tabs: ('ALL' | BillStatus)[] = ['ALL', 'PENDING', 'PAID', 'OVERDUE'];
  readonly categories: BillCategory[] = [
    'ELECTRICITY', 'INTERNET', 'WATER', 'CREDIT_CARD', 'INSURANCE', 'MOBILE', 'RENT', 'OTHER'
  ];

  readonly paymentMethods: { label: string; value: PaymentMethod }[] = [
    { label: 'UPI (GPay / PhonePe)', value: 'UPI' },
    { label: 'Debit Card', value: 'DEBIT_CARD' },
    { label: 'Credit Card', value: 'CREDIT_CARD' },
    { label: 'Net Banking', value: 'NET_BANKING' }
  ];

  readonly filteredBills = computed(() => {
    const filter = this.selectedFilter();
    const all = this.billService.bills();
    return filter === 'ALL' ? all : all.filter((b) => b.status === filter);
  });

  readonly billForm = this.fb.nonNullable.group({
    billerName: ['', [Validators.required]],
    category: ['ELECTRICITY' as BillCategory, [Validators.required]],
    amount: [0, [Validators.required, Validators.min(1)]],
    dueDate: ['', [Validators.required]],
    notes: ['']
  });

  readonly paymentForm = this.fb.nonNullable.group({
    paymentMethod: ['UPI' as PaymentMethod, [Validators.required]],
    paymentDetail: ['yash@okicici']
  });

  ngOnInit(): void {
    this.billService.loadBills();
    this.paymentService.loadPayments();
  }

  toggleForm(): void {
    this.showAddForm.update((v) => !v);
    this.formError.set(null);
  }

  formatLabel(val: string): string {
    return val.replace(/_/g, ' ');
  }

  onCreateBill(): void {
    if (this.billForm.invalid) return;
    this.submitting.set(true);
    this.formError.set(null);

    this.billService.createBill(this.billForm.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.billForm.reset({ billerName: '', category: 'ELECTRICITY', amount: 0, dueDate: '', notes: '' });
        this.showAddForm.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        this.formError.set(err?.error?.message || 'Could not save bill. Please check inputs.');
      }
    });
  }

  openPaymentModal(bill: Bill): void {
    this.selectedBillForPayment.set(bill);
    this.paymentForm.reset({ paymentMethod: 'UPI', paymentDetail: 'yash@okicici' });
  }

  closePaymentModal(): void {
    this.selectedBillForPayment.set(null);
  }

  selectMethod(method: PaymentMethod): void {
    const defaults: Record<PaymentMethod, string> = {
      UPI: 'yash@okicici',
      DEBIT_CARD: 'HDFC Debit •••• 4821',
      CREDIT_CARD: 'ICICI Amazon Pay •••• 9012',
      NET_BANKING: 'HDFC Bank NetBanking'
    };
    this.paymentForm.patchValue({ paymentMethod: method, paymentDetail: defaults[method] });
  }

  paymentDetailLabel(): string {
    const m = this.paymentForm.value.paymentMethod;
    if (m === 'UPI') return 'UPI ID';
    if (m === 'NET_BANKING') return 'Bank Name';
    return 'Card Details';
  }

  paymentDetailPlaceholder(): string {
    const m = this.paymentForm.value.paymentMethod;
    if (m === 'UPI') return 'yourname@upi';
    if (m === 'NET_BANKING') return 'e.g., HDFC Bank, SBI';
    return '•••• •••• •••• 1234';
  }

  confirmPayment(): void {
    const bill = this.selectedBillForPayment();
    if (!bill) return;

    this.processingPayment.set(true);
    const { paymentMethod, paymentDetail } = this.paymentForm.getRawValue();

    this.paymentService.payBill({ billId: bill.id, paymentMethod, paymentDetail }).subscribe({
      next: (receipt) => {
        this.processingPayment.set(false);
        this.latestReceipt.set(receipt);
        this.closePaymentModal();
        this.billService.loadBills();
      },
      error: () => {
        this.processingPayment.set(false);
      }
    });
  }

  onDelete(id: number): void {
    this.billService.deleteBill(id).subscribe();
  }
}
