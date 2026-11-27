import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Payment, PaymentRequest } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/payments';

  private readonly paymentsSignal = signal<Payment[]>([]);
  readonly loading = signal<boolean>(false);
  readonly payments = this.paymentsSignal.asReadonly();

  loadPayments(): void {
    this.loading.set(true);
    this.http.get<Payment[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.paymentsSignal.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  payBill(payload: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.apiUrl, payload).pipe(
      tap((txn) => {
        this.paymentsSignal.update((list) => [txn, ...list]);
      })
    );
  }
}
