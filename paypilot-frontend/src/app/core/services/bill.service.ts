import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Bill, CreateBillRequest } from '../models/bill.model';

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/bills';

  private readonly billsSignal = signal<Bill[]>([]);
  readonly loading = signal<boolean>(false);

  readonly bills = this.billsSignal.asReadonly();

  readonly totalPendingAmount = computed(() =>
    this.billsSignal()
      .filter((b) => b.status === 'PENDING' || b.status === 'OVERDUE')
      .reduce((sum, b) => sum + Number(b.amount), 0)
  );

  readonly totalPaidAmount = computed(() =>
    this.billsSignal()
      .filter((b) => b.status === 'PAID')
      .reduce((sum, b) => sum + Number(b.amount), 0)
  );

  readonly pendingCount = computed(() =>
    this.billsSignal().filter((b) => b.status === 'PENDING' || b.status === 'OVERDUE').length
  );

  loadBills(): void {
    this.loading.set(true);
    this.http.get<Bill[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.billsSignal.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  createBill(payload: CreateBillRequest): Observable<Bill> {
    return this.http.post<Bill>(this.apiUrl, payload).pipe(
      tap((created) => {
        this.billsSignal.update((list) =>
          [...list, created].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        );
      })
    );
  }

  markAsPaid(id: number): Observable<Bill> {
    return this.http.patch<Bill>(`${this.apiUrl}/${id}/pay`, {}).pipe(
      tap((updated) => {
        this.billsSignal.update((list) =>
          list.map((b) => (b.id === id ? updated : b))
        );
      })
    );
  }

  deleteBill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.billsSignal.update((list) => list.filter((b) => b.id !== id));
      })
    );
  }
}
