import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BillService } from '../../core/services/bill.service';
import { AuthService } from '../../core/services/auth.service';
import { Bill, Payment, ScheduledPayment, ReminderSetting, UserProfile } from '../../core/models/bill.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <!-- TOP BRD NAVBAR (PayPilot Logo -> Home, Notifications Bell, Profile, Logout) -->
      <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-3.5">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <!-- Clicking PayPilot Logo navigates directly to Home Hub (BRD Note) -->
          <button (click)="activeHub.set('HOME')" class="flex items-center gap-3 text-left group">
            <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition">
              P
            </div>
            <div>
              <span class="text-xl font-extrabold tracking-tight text-indigo-700">PayPilot</span>
              <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">BFSI Bill & Payment Hub</span>
            </div>
          </button>

          <!-- Hub Quick Switcher -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button (click)="activeHub.set('HOME')"
              [class]="activeHub() === 'HOME' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition">Home Hub</button>
            <button (click)="activeHub.set('MANAGE')"
              [class]="activeHub() === 'MANAGE' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition">Manage Bills</button>
            <button (click)="activeHub.set('SCHEDULE')"
              [class]="activeHub() === 'SCHEDULE' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition">Schedule Payment</button>
            <button (click)="activeHub.set('TRACK')"
              [class]="activeHub() === 'TRACK' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition">Track Payments</button>
          </nav>

          <!-- Right Actions: Notifications & Profile -->
          <div class="flex items-center gap-3 relative">
            <!-- Notifications Bell -->
            <button (click)="showNotifications.set(!showNotifications()); showProfileModal.set(false)"
              class="relative p-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition">
              <span class="text-base">🔔</span>
              @if (alertBills().length > 0) {
                <span class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {{ alertBills().length }}
                </span>
              }
            </button>

            <!-- Notifications Dropdown -->
            @if (showNotifications()) {
              <div class="absolute right-20 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
                <div class="flex justify-between items-center pb-2 mb-2 border-b border-slate-100">
                  <span class="text-xs font-extrabold text-slate-800">Bill Alerts & Reminders</span>
                  <button (click)="showNotifications.set(false)" class="text-xs text-slate-400 hover:text-slate-700">✕</button>
                </div>
                @if (alertBills().length === 0) {
                  <p class="text-xs text-slate-500 py-4 text-center">All bills are up to date!</p>
                } @else {
                  <div class="space-y-2 max-h-64 overflow-y-auto">
                    @for (b of alertBills(); track b.id) {
                      <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                        <div>
                          <p class="text-xs font-bold text-slate-800">{{ b.billerName }}</p>
                          <p class="text-[11px] text-slate-500">Due: {{ b.dueDate }} • ₹{{ b.amountDue | number:'1.2-2' }}</p>
                        </div>
                        <span [class]="b.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'"
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {{ b.status }}
                        </span>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Profile Button -->
            <button (click)="openProfile()"
              class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-xs font-bold text-slate-700 hover:text-indigo-700 transition">
              <span>👤</span>
              <span class="hidden sm:inline">Profile</span>
            </button>

            <button (click)="logout()"
              class="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Toast Feedback Banner -->
      @if (toastMsg()) {
        <div class="max-w-7xl mx-auto px-6 pt-4">
          <div class="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-lg flex justify-between items-center">
            <span>✅ {{ toastMsg() }}</span>
            <button (click)="toastMsg.set('')" class="opacity-80 hover:opacity-100">✕</button>
          </div>
        </div>
      }

      <main class="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <!-- KPI SUMMARY STRIP -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p class="text-xs font-bold text-slate-400 uppercase">Total Upcoming Due</p>
            <p class="text-2xl font-black text-slate-900 mt-1">₹{{ totalDue() | number:'1.2-2' }}</p>
            <p class="text-[11px] text-indigo-600 font-semibold mt-1">{{ pendingCount() }} active bills</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p class="text-xs font-bold text-slate-400 uppercase">Overdue Alerts</p>
            <p class="text-2xl font-black text-rose-600 mt-1">{{ overdueCount() }}</p>
            <p class="text-[11px] text-slate-500 mt-1">Requires immediate action</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p class="text-xs font-bold text-slate-400 uppercase">Scheduled Payments</p>
            <p class="text-2xl font-black text-amber-600 mt-1">{{ activeSchedulesCount() }}</p>
            <p class="text-[11px] text-slate-500 mt-1">Auto-scheduled instructions</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p class="text-xs font-bold text-slate-400 uppercase">Total Paid Volume</p>
            <p class="text-2xl font-black text-emerald-600 mt-1">₹{{ totalPaid() | number:'1.2-2' }}</p>
            <p class="text-[11px] text-slate-500 mt-1">{{ payments().length }} verified receipts</p>
          </div>
        </div>

        <!-- ========================================================= -->
        <!-- VIEW 0: HOME HUB (Wireframe 2.1 - 3 Core Modules)         -->
        <!-- ========================================================= -->
        @if (activeHub() === 'HOME') {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <!-- Module 1: Schedule Payment -->
            <div (click)="activeHub.set('SCHEDULE')"
              class="cursor-pointer bg-white hover:border-indigo-500 border-2 border-slate-200/80 rounded-3xl p-7 shadow-sm hover:shadow-xl transition group">
              <div class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 text-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition">
                🗓️
              </div>
              <h2 class="text-lg font-extrabold text-slate-900">Schedule Payment</h2>
              <p class="text-xs text-slate-500 mt-2 leading-relaxed">
                Automate future bill payments with bank account auto-fill, recurring cycles, and one-click modify or cancel controls.
              </p>
              <span class="inline-block mt-5 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition">
                Open Scheduler →
              </span>
            </div>

            <!-- Module 2: Manage Bills -->
            <div (click)="activeHub.set('MANAGE')"
              class="cursor-pointer bg-white hover:border-indigo-500 border-2 border-slate-200/80 rounded-3xl p-7 shadow-sm hover:shadow-xl transition group">
              <div class="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 text-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition">
                🧾
              </div>
              <h2 class="text-lg font-extrabold text-slate-900">Manage Bills</h2>
              <p class="text-xs text-slate-500 mt-2 leading-relaxed">
                Add new bills, inspect Bills Overview, filter upcoming/overdue bills, snooze due dates, configure reminders, or make partial payments.
              </p>
              <span class="inline-block mt-5 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition">
                Manage Bills →
              </span>
            </div>

            <!-- Module 3: Track Payments -->
            <div (click)="activeHub.set('TRACK')"
              class="cursor-pointer bg-white hover:border-indigo-500 border-2 border-slate-200/80 rounded-3xl p-7 shadow-sm hover:shadow-xl transition group">
              <div class="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 text-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition">
                📊
              </div>
              <h2 class="text-lg font-extrabold text-slate-900">Track Payments</h2>
              <p class="text-xs text-slate-500 mt-2 leading-relaxed">
                Visualize color-coded Payment Progress bars (Pending, Partial, Paid), Payment Overview by date range, and full Payment History.
              </p>
              <span class="inline-block mt-5 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition">
                Track Payments →
              </span>
            </div>
          </div>
        }

        <!-- ========================================================= -->
        <!-- VIEW 1: MANAGE BILLS (User Stories 2.1, 2.2, 2.3)         -->
        <!-- ========================================================= -->
        @if (activeHub() === 'MANAGE') {
          <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 class="text-lg font-extrabold text-slate-900">Manage Bills</h2>
                <p class="text-xs text-slate-500">Wireframe 2.1 – 2.3: Overview, Add Bill, Snooze/Mark Paid & Reminder Settings</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button (click)="manageSubTab.set('OVERVIEW')"
                  [class]="manageSubTab() === 'OVERVIEW' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold transition">Bills Overview</button>
                <button (click)="manageSubTab.set('ADD')"
                  [class]="manageSubTab() === 'ADD' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold transition">+ Add New Bill</button>
                <button (click)="manageSubTab.set('SNOOZE')"
                  [class]="manageSubTab() === 'SNOOZE' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold transition">Snooze / Mark Paid</button>
                <button (click)="manageSubTab.set('REMINDERS')"
                  [class]="manageSubTab() === 'REMINDERS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold transition">Reminder Settings</button>
              </div>
            </div>

            <!-- SUBTAB: BILLS OVERVIEW & UPCOMING/OVERDUE -->
            @if (manageSubTab() === 'OVERVIEW' || manageSubTab() === 'SNOOZE') {
              <!-- Filters Bar (Category, Date Range, Status, Search, Sort by Overdue Days) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                <input type="text" [(ngModel)]="searchTerm" placeholder="Search bill name..."
                  class="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-indigo-500" />
                <select [(ngModel)]="filterCategory"
                  class="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-indigo-500">
                  <option value="ALL">All Categories</option>
                  @for (cat of categories; track cat) {
                    <option [value]="cat">{{ cat.replace('_', ' ') }}</option>
                  }
                </select>
                <select [(ngModel)]="filterStatus"
                  class="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-indigo-500">
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Upcoming / Pending</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="PAID">Paid</option>
                </select>
                <input type="date" [(ngModel)]="filterFromDate" title="From Due Date"
                  class="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none" />
                <input type="date" [(ngModel)]="filterToDate" title="To Due Date"
                  class="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none" />
                <button (click)="sortByOverdue.set(!sortByOverdue())"
                  [class]="sortByOverdue() ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'"
                  class="px-3 py-2 rounded-xl text-xs font-bold transition">
                  {{ sortByOverdue() ? 'Sorted: Overdue Days ↓' : 'Sort: Overdue Days' }}
                </button>
              </div>

              <!-- Bills Table -->
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400">
                      <th class="py-3 px-3">Bill Name</th>
                      <th class="py-3 px-3">Category</th>
                      <th class="py-3 px-3">Amount Due / Total</th>
                      <th class="py-3 px-3">Due Date</th>
                      <th class="py-3 px-3">Overdue By</th>
                      <th class="py-3 px-3">Status</th>
                      <th class="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 text-xs">
                    @for (bill of filteredBills(); track bill.id) {
                      <tr class="hover:bg-slate-50/80">
                        <td class="py-3.5 px-3 font-bold text-slate-900">
                          {{ bill.billerName }}
                          @if (bill.recurring) {
                            <span class="ml-1.5 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px]">Recurring</span>
                          }
                        </td>
                        <td class="py-3.5 px-3 text-slate-600">{{ bill.category.replace('_', ' ') }}</td>
                        <td class="py-3.5 px-3">
                          <span class="font-extrabold text-slate-900">₹{{ bill.amountDue | number:'1.2-2' }}</span>
                          <span class="text-slate-400"> / ₹{{ bill.amount | number:'1.2-2' }}</span>
                        </td>
                        <td class="py-3.5 px-3 text-slate-600">
                          {{ bill.dueDate }}
                          @if (bill.snoozedUntil) {
                            <span class="block text-[10px] text-amber-600 font-semibold">Snoozed till {{ bill.snoozedUntil }}</span>
                          }
                        </td>
                        <td class="py-3.5 px-3 font-bold" [class]="(bill.overdueDays || 0) > 0 ? 'text-rose-600' : 'text-slate-400'">
                          {{ (bill.overdueDays || 0) > 0 ? bill.overdueDays + ' days' : '0 days' }}
                        </td>
                        <td class="py-3.5 px-3">
                          <span [class]="statusBadge(bill.status)" class="px-2.5 py-1 rounded-full text-[10px] font-extrabold">
                            {{ bill.status.replace('_', ' ') }}
                          </span>
                        </td>
                        <td class="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                          @if (bill.status !== 'PAID') {
                            <button (click)="openPayModal(bill)"
                              class="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px]">
                              Pay Now
                            </button>
                            <button (click)="openSnoozeModal(bill)"
                              class="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px]">
                              Snooze
                            </button>
                            <button (click)="handleMarkPaid(bill.id)"
                              class="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                              Mark Paid
                            </button>
                          }
                          <button (click)="handleDeleteBill(bill.id)"
                            class="px-2 py-1.5 rounded-lg text-rose-500 hover:bg-rose-50 font-bold text-[11px]">
                            ✕
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="7" class="py-8 text-center text-slate-400 text-xs">No bills match the selected filters.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- SUBTAB: ADD NEW BILL (Wireframe 2.2) -->
            @if (manageSubTab() === 'ADD') {
              <form (ngSubmit)="submitNewBill()" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Bill Name *</label>
                  <input type="text" name="billerName" [(ngModel)]="newBill.billerName" required placeholder="e.g., House Rent / HDFC Loan"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Bill Category *</label>
                  <select name="category" [(ngModel)]="newBill.category"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500">
                    @for (cat of categories; track cat) {
                      <option [value]="cat">{{ cat.replace('_', ' ') }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Bill Date</label>
                  <input type="date" name="billDate" [(ngModel)]="newBill.billDate"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Due Date *</label>
                  <input type="date" name="dueDate" [(ngModel)]="newBill.dueDate" required
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
                  <input type="number" name="amount" [(ngModel)]="newBill.amount" required min="1" placeholder="15000"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Reminder Frequency</label>
                  <select name="reminderFrequency" [(ngModel)]="newBill.reminderFrequency"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500">
                    <option value="Daily">Daily</option>
                    <option value="3 Days Before">3 Days Before</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div class="flex items-center gap-3 pt-2">
                  <input type="checkbox" id="recToggle" name="recurring" [(ngModel)]="newBill.recurring" class="w-4 h-4 accent-indigo-600" />
                  <label for="recToggle" class="text-xs font-bold text-slate-700">Recurring Bill (Replicate for upcoming cycles)</label>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Notes (If any)</label>
                  <input type="text" name="notes" [(ngModel)]="newBill.notes" placeholder="Optional reference note"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div class="md:col-span-2 flex gap-3 pt-2">
                  <button type="submit" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow">
                    Save Bill
                  </button>
                  <button type="button" (click)="manageSubTab.set('OVERVIEW')" class="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                    Cancel
                  </button>
                </div>
              </form>
            }

            <!-- SUBTAB: REMINDER SETTINGS (Wireframe 2.3) -->
            @if (manageSubTab() === 'REMINDERS') {
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form (ngSubmit)="submitReminderSetting()" class="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h3 class="text-sm font-extrabold text-slate-800">Configure Bill Reminder</h3>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Select Bill *</label>
                    <select name="remBillId" [(ngModel)]="reminderForm.billId" required
                      class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs">
                      @for (b of bills(); track b.id) {
                        <option [value]="b.id">{{ b.billerName }} ({{ b.category }}) - Due {{ b.dueDate }}</option>
                      }
                    </select>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-bold text-slate-700 mb-1">Reminder Frequency</label>
                      <select name="remFreq" [(ngModel)]="reminderForm.reminderFrequency"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs">
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Bi-weekly">Bi-weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-slate-700 mb-1">Starting Date</label>
                      <input type="date" name="remDate" [(ngModel)]="reminderForm.reminderStartDate"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Notification Preference</label>
                    <select name="remPref" [(ngModel)]="reminderForm.notificationPreference"
                      class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs">
                      <option value="Email">Email</option>
                      <option value="SMS">SMS / Contact</option>
                      <option value="Both">Email & SMS</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Message Customization</label>
                    <input type="text" name="remMsg" [(ngModel)]="reminderForm.customMessage" placeholder="Bill payment due soon!"
                      class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs" />
                  </div>
                  <button type="submit" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                    Update Reminder Settings
                  </button>
                </form>

                <div class="space-y-3">
                  <h3 class="text-sm font-extrabold text-slate-800">Active Reminder Rules</h3>
                  @for (r of reminders(); track r.id) {
                    <div class="p-4 rounded-2xl border border-slate-200 bg-white flex justify-between items-center">
                      <div>
                        <p class="text-xs font-extrabold text-slate-900">{{ r.bill?.billerName }}</p>
                        <p class="text-[11px] text-slate-500 mt-0.5">{{ r.reminderFrequency }} via {{ r.notificationPreference }} • Starts {{ r.reminderStartDate }}</p>
                        <p class="text-[11px] text-indigo-600 mt-1">"{{ r.customMessage }}"</p>
                      </div>
                      <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">ACTIVE</span>
                    </div>
                  } @empty {
                    <p class="text-xs text-slate-400 py-6">No custom reminder rules configured yet.</p>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- ========================================================= -->
        <!-- VIEW 2: SCHEDULE PAYMENT (User Stories 3.1 & 3.2)         -->
        <!-- ========================================================= -->
        @if (activeHub() === 'SCHEDULE') {
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Left: Schedule Payment Form -->
            <form (ngSubmit)="submitSchedulePayment()" class="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div>
                <h2 class="text-base font-extrabold text-slate-900">Schedule New Bill Payment</h2>
                <p class="text-xs text-slate-500">Wireframe 3.1: Auto-fill Payee & Bank details</p>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Select Unpaid Bill *</label>
                <select name="schBillId" [(ngModel)]="scheduleForm.billId" (change)="onScheduleBillSelect()" required
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs">
                  <option [ngValue]="null">-- Choose a Bill --</option>
                  @for (b of unpaidBills(); track b.id) {
                    <option [ngValue]="b.id">{{ b.billerName }} (Due ₹{{ b.amountDue }} on {{ b.dueDate }})</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Payee Name</label>
                  <input type="text" name="payeeName" [(ngModel)]="scheduleForm.payeeName"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Payee Address</label>
                  <input type="text" name="payeeAddress" [(ngModel)]="scheduleForm.payeeAddress"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Payee Bank Details</label>
                <input type="text" name="payeeBankDetails" [(ngModel)]="scheduleForm.payeeBankDetails"
                  class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select name="paymentMode" [(ngModel)]="scheduleForm.paymentMode"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
                    <option value="Net Banking">Net Banking</option>
                    <option value="UPI">UPI AutoPay</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Payer Account No.</label>
                  <input type="text" name="payerAccountNumber" [(ngModel)]="scheduleForm.payerAccountNumber"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Schedule Date *</label>
                  <input type="date" name="scheduledDate" [(ngModel)]="scheduleForm.scheduledDate" required
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input type="number" name="schAmount" [(ngModel)]="scheduleForm.amount" required
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs" />
                </div>
              </div>

              <button type="submit" class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow">
                Confirm Schedule Payment
              </button>
            </form>

            <!-- Right: Scheduled Payments List with Modify / Cancel (Wireframe 3.2) -->
            <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <h2 class="text-base font-extrabold text-slate-900">Scheduled Payments (Cancel / Modify)</h2>
                <p class="text-xs text-slate-500">Wireframe 3.2: Manage upcoming scheduled payment dates</p>
              </div>

              <div class="space-y-3">
                @for (sp of schedules(); track sp.id) {
                  <div class="p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-extrabold text-slate-900">{{ sp.payeeName }}</span>
                        <span [class]="sp.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'"
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {{ sp.status }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-500 mt-1">
                        Amount: <strong class="text-slate-800">₹{{ sp.amount | number:'1.2-2' }}</strong> • Mode: {{ sp.paymentMode }} ({{ sp.payerAccountNumber }})
                      </p>
                      <p class="text-[11px] text-indigo-600 font-semibold mt-0.5">
                        Scheduled Date: {{ sp.scheduledDate }}
                      </p>
                    </div>

                    @if (sp.status === 'SCHEDULED') {
                      <div class="flex items-center gap-2">
                        <input type="date" #modDate [value]="sp.scheduledDate"
                          class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs" />
                        <button (click)="handleModifySchedule(sp.id, modDate.value)"
                          class="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold">
                          Modify
                        </button>
                        <button (click)="handleCancelSchedule(sp.id)"
                          class="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold">
                          Cancel
                        </button>
                      </div>
                    }
                  </div>
                } @empty {
                  <p class="text-xs text-slate-400 py-10 text-center">No scheduled payments found. Use the form on the left to schedule one.</p>
                }
              </div>
            </div>
          </div>
        }

        <!-- ========================================================= -->
        <!-- VIEW 3: TRACK PAYMENTS (User Story 4.1 - 3 BRD Tabs)      -->
        <!-- ========================================================= -->
        @if (activeHub() === 'TRACK') {
          <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 class="text-lg font-extrabold text-slate-900">Track Payments</h2>
                <p class="text-xs text-slate-500">Wireframe 4.1: Payment Progress, Payment Overview & Payment History</p>
              </div>
              <div class="flex gap-2">
                <button (click)="trackSubTab.set('PROGRESS')"
                  [class]="trackSubTab() === 'PROGRESS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'"
                  class="px-4 py-2 rounded-xl text-xs font-bold transition">Payment Progress</button>
                <button (click)="trackSubTab.set('OVERVIEW')"
                  [class]="trackSubTab() === 'OVERVIEW' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'"
                  class="px-4 py-2 rounded-xl text-xs font-bold transition">Payment Overview</button>
                <button (click)="trackSubTab.set('HISTORY')"
                  [class]="trackSubTab() === 'HISTORY' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'"
                  class="px-4 py-2 rounded-xl text-xs font-bold transition">Payment History</button>
              </div>
            </div>

            <!-- SUBTAB 1: PAYMENT PROGRESS (RED = Pending, BLUE = Partially Paid, GREEN = Paid Completely) -->
            @if (trackSubTab() === 'PROGRESS') {
              <div class="space-y-4">
                <div class="flex flex-wrap gap-4 text-[11px] font-bold">
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-rose-500"></span> Red: Payment Pending / Overdue</span>
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-600"></span> Blue: Paid Partially</span>
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500"></span> Green: Paid Completely</span>
                </div>

                <div class="space-y-3">
                  @for (b of bills(); track b.id) {
                    <div class="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50">
                      <div class="flex justify-between items-center text-xs mb-2">
                        <div>
                          <span class="font-extrabold text-slate-900">{{ b.billerName }}</span>
                          <span class="text-slate-400 ml-2">({{ b.category }}) • Due {{ b.dueDate }}</span>
                        </div>
                        <div class="font-bold">
                          Paid: ₹{{ (b.amount - b.amountDue) | number:'1.2-2' }} / ₹{{ b.amount | number:'1.2-2' }}
                        </div>
                      </div>
                      <!-- Color-coded BRD Progress Bar -->
                      <div class="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div class="h-full transition-all duration-500 rounded-full"
                          [style.width.%]="progressPercent(b)"
                          [class]="b.status === 'PAID' ? 'bg-emerald-500' : (b.status === 'PARTIALLY_PAID' ? 'bg-blue-600' : 'bg-rose-500')">
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- SUBTAB 2: PAYMENT OVERVIEW -->
            @if (trackSubTab() === 'OVERVIEW') {
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400">
                      <th class="py-3 px-3">Total Amount</th>
                      <th class="py-3 px-3">Bill Name</th>
                      <th class="py-3 px-3">Category</th>
                      <th class="py-3 px-3">Due Date</th>
                      <th class="py-3 px-3">Overdue By</th>
                      <th class="py-3 px-3">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (b of bills(); track b.id) {
                      <tr>
                        <td class="py-3 px-3 font-bold">₹{{ b.amount | number:'1.2-2' }}</td>
                        <td class="py-3 px-3 font-bold text-slate-900">{{ b.billerName }}</td>
                        <td class="py-3 px-3 text-slate-500">{{ b.category }}</td>
                        <td class="py-3 px-3">{{ b.dueDate }}</td>
                        <td class="py-3 px-3">{{ b.overdueDays || 0 }} days</td>
                        <td class="py-3 px-3">
                          <span [class]="statusBadge(b.status)" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            {{ b.status === 'PAID' ? 'Paid' : 'Due Soon / ' + b.status }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- SUBTAB 3: PAYMENT HISTORY -->
            @if (trackSubTab() === 'HISTORY') {
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400">
                      <th class="py-3 px-3">Transaction Ref</th>
                      <th class="py-3 px-3">Bill Name</th>
                      <th class="py-3 px-3">Amount Paid</th>
                      <th class="py-3 px-3">Paid On</th>
                      <th class="py-3 px-3">Payment Mode</th>
                      <th class="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (p of payments(); track p.id) {
                      <tr>
                        <td class="py-3 px-3 font-mono font-bold text-indigo-600">{{ p.transactionRef }}</td>
                        <td class="py-3 px-3 font-bold text-slate-900">{{ p.bill?.billerName || p.billerName || 'Bill Payment' }}</td>
                        <td class="py-3 px-3 font-extrabold text-emerald-700">₹{{ p.amount | number:'1.2-2' }}</td>
                        <td class="py-3 px-3 text-slate-600">{{ p.paidAt | date:'medium' }}</td>
                        <td class="py-3 px-3">{{ p.paymentMethod }}</td>
                        <td class="py-3 px-3">
                          <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">{{ p.status }}</span>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="py-8 text-center text-slate-400">No payment receipts recorded yet.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      </main>

      <!-- ========================================================= -->
      <!-- MODAL 1: PAY NOW (Supports Full & Partial Payments!)      -->
      <!-- ========================================================= -->
      @if (selectedPayBill()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div class="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 class="text-base font-extrabold text-slate-900">Pay Bill: {{ selectedPayBill()?.billerName }}</h3>
              <button (click)="selectedPayBill.set(null)" class="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div class="bg-indigo-50 p-3.5 rounded-2xl text-xs space-y-1">
              <p class="text-slate-600">Total Bill Amount: <strong>₹{{ selectedPayBill()?.amount | number:'1.2-2' }}</strong></p>
              <p class="text-indigo-800 font-bold">Remaining Amount Due: ₹{{ selectedPayBill()?.amountDue | number:'1.2-2' }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Amount to Pay (Enter less for Partial Payment)</label>
              <input type="number" [(ngModel)]="payAmountInput" [max]="selectedPayBill()!.amountDue" min="1"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Select Payment Method</label>
              <select [(ngModel)]="payMethodInput" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs">
                <option value="UPI">UPI</option>
                <option value="NET_BANKING">Net Banking (SBI / HDFC / ICICI / Axis)</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
              </select>
            </div>

            <div class="flex gap-2 pt-2">
              <button (click)="selectedPayBill.set(null)" class="w-1/3 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700">Cancel</button>
              <button (click)="submitPayment()" class="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow">
                Confirm & Pay ₹{{ payAmountInput | number:'1.2-2' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================= -->
      <!-- MODAL 2: SNOOZE BILL (User Story 2.3)                     -->
      <!-- ========================================================= -->
      @if (selectedSnoozeBill()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 class="text-base font-extrabold text-slate-900">Snooze Bill: {{ selectedSnoozeBill()?.billerName }}</h3>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Select Snooze Until Date</label>
              <input type="date" [(ngModel)]="snoozeDateInput" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
            </div>
            <div class="flex gap-2">
              <button (click)="selectedSnoozeBill.set(null)" class="w-1/2 py-2.5 rounded-xl bg-slate-100 text-xs font-bold">Cancel</button>
              <button (click)="submitSnooze()" class="w-1/2 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold">Snooze Bill</button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================= -->
      <!-- MODAL 3: USER PROFILE & BANKING DETAILS (Slide 42)        -->
      <!-- ========================================================= -->
      @if (showProfileModal()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div class="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 class="text-base font-extrabold text-slate-900">BFSI User Profile & Bank KYC</h3>
              <button (click)="showProfileModal.set(false)" class="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-600 mb-1">Email ID</label>
                <input type="text" [value]="profile().email" disabled class="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">PAN Details</label>
                <input type="text" [(ngModel)]="profile().panDetails" placeholder="ABCDE1234F" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 uppercase" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Bank Account Number</label>
                <input type="text" [(ngModel)]="profile().bankAccountNumber" placeholder="501002348912" class="w-full px-3.5 py-2 rounded-xl border border-slate-200" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input type="text" [(ngModel)]="profile().ifscCode" placeholder="HDFC0001234" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 uppercase" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Banking Partner</label>
                  <input type="text" [(ngModel)]="profile().bankingPartner" placeholder="HDFC Bank" class="w-full px-3.5 py-2 rounded-xl border border-slate-200" />
                </div>
              </div>
            </div>
            <div class="flex gap-2 pt-2">
              <button (click)="showProfileModal.set(false)" class="w-1/3 py-2.5 rounded-xl bg-slate-100 text-xs font-bold">Close</button>
              <button (click)="saveProfile()" class="w-2/3 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">Save KYC Details</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private billService = inject(BillService);
  private authService = inject(AuthService);
  private router = inject(Router);

  activeHub = signal<'HOME' | 'MANAGE' | 'SCHEDULE' | 'TRACK'>('HOME');
  manageSubTab = signal<'OVERVIEW' | 'ADD' | 'SNOOZE' | 'REMINDERS'>('OVERVIEW');
  trackSubTab = signal<'PROGRESS' | 'OVERVIEW' | 'HISTORY'>('PROGRESS');

  bills = signal<Bill[]>([]);
  payments = signal<Payment[]>([]);
  schedules = signal<ScheduledPayment[]>([]);
  reminders = signal<ReminderSetting[]>([]);
  profile = signal<UserProfile>({ id: 0, email: '' });

  showNotifications = signal(false);
  showProfileModal = signal(false);
  toastMsg = signal('');

  categories = [
    'HOUSE_RENT', 'DEBT_PAYMENTS', 'GROCERIES', 'INTERNET',
    'RETIREMENT_SAVINGS', 'CELLPHONE_CHARGES', 'ELECTRICITY', 'WATER', 'INSURANCE', 'OTHER'
  ];

  // Filters
  searchTerm = '';
  filterCategory = 'ALL';
  filterStatus = 'ALL';
  filterFromDate = '';
  filterToDate = '';
  sortByOverdue = signal(false);

  // Add Bill Form
  newBill: any = {
    billerName: '', category: 'HOUSE_RENT', billDate: '', dueDate: '',
    amount: null, reminderFrequency: '3 Days Before', recurring: false, notes: ''
  };

  // Reminder Form
  reminderForm: any = {
    billId: null, reminderFrequency: 'Weekly',
    reminderStartDate: new Date().toISOString().split('T')[0],
    notificationPreference: 'Email', customMessage: 'Bill payment due soon!'
  };

  // Schedule Payment Form
  scheduleForm: any = {
    billId: null, payeeName: '', payeeAddress: 'India',
    payeeBankDetails: 'HDFC Bank • IFSC HDFC0001234',
    paymentMode: 'Net Banking', payerAccountNumber: 'XXXX-XXXX-4589',
    scheduledDate: '', amount: 0
  };

  // Modals State
  selectedPayBill = signal<Bill | null>(null);
  payAmountInput = 0;
  payMethodInput = 'UPI';

  selectedSnoozeBill = signal<Bill | null>(null);
  snoozeDateInput = '';

  // Computed KPIs
  totalDue = computed(() =>
    this.bills().filter(b => b.status !== 'PAID').reduce((sum, b) => sum + Number(b.amountDue || 0), 0)
  );
  pendingCount = computed(() => this.bills().filter(b => b.status !== 'PAID').length);
  overdueCount = computed(() => this.bills().filter(b => b.status === 'OVERDUE').length);
  activeSchedulesCount = computed(() => this.schedules().filter(s => s.status === 'SCHEDULED').length);
  totalPaid = computed(() => this.payments().reduce((sum, p) => sum + Number(p.amount || 0), 0));
  alertBills = computed(() => this.bills().filter(b => b.status !== 'PAID'));
  unpaidBills = computed(() => this.bills().filter(b => b.status !== 'PAID'));

  filteredBills = computed(() => {
    let list = [...this.bills()];
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(b => b.billerName.toLowerCase().includes(q));
    }
    if (this.filterCategory !== 'ALL') {
      list = list.filter(b => b.category === this.filterCategory);
    }
    if (this.filterStatus !== 'ALL') {
      list = list.filter(b => b.status === this.filterStatus);
    }
    if (this.filterFromDate) {
      list = list.filter(b => b.dueDate >= this.filterFromDate);
    }
    if (this.filterToDate) {
      list = list.filter(b => b.dueDate <= this.filterToDate);
    }
    if (this.sortByOverdue()) {
      list.sort((a, b) => (b.overdueDays || 0) - (a.overdueDays || 0));
    }
    return list;
  });

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.billService.getBills().subscribe(data => {
      this.bills.set(data);
      if (data.length > 0 && !this.reminderForm.billId) {
        this.reminderForm.billId = data[0].id;
      }
    });
    this.billService.getPayments().subscribe(data => this.payments.set(data));
    this.billService.getSchedules().subscribe(data => this.schedules.set(data));
    this.billService.getReminders().subscribe(data => this.reminders.set(data));
  }

  notify(msg: string) {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(''), 4000);
  }

  statusBadge(status: string): string {
    if (status === 'PAID') return 'bg-emerald-100 text-emerald-700';
    if (status === 'PARTIALLY_PAID') return 'bg-blue-100 text-blue-700';
    if (status === 'OVERDUE') return 'bg-rose-100 text-rose-700';
    return 'bg-amber-100 text-amber-800';
  }

  progressPercent(b: Bill): number {
    if (b.status === 'PAID' || !b.amount) return 100;
    const paid = Number(b.amount) - Number(b.amountDue || 0);
    if (paid <= 0) return 18; // Minimum visible red bar for pending
    return Math.min(100, Math.round((paid / Number(b.amount)) * 100));
  }

  submitNewBill() {
    this.billService.createBill(this.newBill).subscribe(() => {
      this.notify('Bill successfully added!!');
      this.newBill = {
        billerName: '', category: 'HOUSE_RENT', billDate: '', dueDate: '',
        amount: null, reminderFrequency: '3 Days Before', recurring: false, notes: ''
      };
      this.manageSubTab.set('OVERVIEW');
      this.loadAllData();
    });
  }

  openPayModal(bill: Bill) {
    this.selectedPayBill.set(bill);
    this.payAmountInput = Number(bill.amountDue);
    this.payMethodInput = 'UPI';
  }

  submitPayment() {
    const bill = this.selectedPayBill();
    if (!bill) return;
    this.billService.payBill({
      billId: bill.id,
      amount: this.payAmountInput,
      paymentMethod: this.payMethodInput
    }).subscribe(receipt => {
      this.selectedPayBill.set(null);
      this.notify(`Payment of ₹${receipt.amount} successful! Ref: ${receipt.transactionRef}`);
      this.loadAllData();
    });
  }

  openSnoozeModal(bill: Bill) {
    this.selectedSnoozeBill.set(bill);
    this.snoozeDateInput = bill.dueDate;
  }

  submitSnooze() {
    const bill = this.selectedSnoozeBill();
    if (!bill || !this.snoozeDateInput) return;
    this.billService.snoozeBill(bill.id, this.snoozeDateInput).subscribe(() => {
      this.selectedSnoozeBill.set(null);
      this.notify(`${bill.billerName} bill successfully snoozed!!`);
      this.loadAllData();
    });
  }

  handleMarkPaid(id: number) {
    this.billService.markAsPaid(id).subscribe(() => {
      this.notify('Bill marked as Paid!!');
      this.loadAllData();
    });
  }

  handleDeleteBill(id: number) {
    this.billService.deleteBill(id).subscribe(() => {
      this.notify('Bill removed.');
      this.loadAllData();
    });
  }

  submitReminderSetting() {
    this.billService.saveReminder(this.reminderForm).subscribe(() => {
      this.notify('Reminder settings updated!!');
      this.loadAllData();
    });
  }

  onScheduleBillSelect() {
    const b = this.bills().find(x => x.id === Number(this.scheduleForm.billId));
    if (b) {
      this.scheduleForm.payeeName = b.billerName;
      this.scheduleForm.amount = b.amountDue;
      this.scheduleForm.scheduledDate = b.dueDate;
    }
  }

  submitSchedulePayment() {
    if (!this.scheduleForm.billId || !this.scheduleForm.scheduledDate) return;
    this.billService.createSchedule(this.scheduleForm).subscribe(() => {
      this.notify(`${this.scheduleForm.payeeName} Scheduled for payment!!`);
      this.loadAllData();
    });
  }

  handleModifySchedule(id: number, newDate: string) {
    this.billService.modifySchedule(id, { scheduledDate: newDate }).subscribe(() => {
      this.notify('Schedule Payment Date Changed!!');
      this.loadAllData();
    });
  }

  handleCancelSchedule(id: number) {
    this.billService.cancelSchedule(id).subscribe(() => {
      this.notify('Scheduled Payment Cancelled!!');
      this.loadAllData();
    });
  }

  openProfile() {
    this.showNotifications.set(false);
    this.billService.getProfile().subscribe(p => {
      this.profile.set(p);
      this.showProfileModal.set(true);
    });
  }

  saveProfile() {
    this.billService.updateProfile(this.profile()).subscribe(() => {
      this.showProfileModal.set(false);
      this.notify('BFSI Profile & Bank KYC saved!');
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
