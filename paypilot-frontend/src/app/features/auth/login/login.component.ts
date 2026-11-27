import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BillService } from '../../../core/services/bill.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
        <!-- Brand Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-lg shadow-indigo-500/30 mb-3">
            P
          </div>
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">PayPilot BFSI</h1>
          <p class="text-xs text-slate-500 mt-1">Secure Bill Management & Payment Gateway</p>
        </div>

        <!-- Alerts -->
        @if (errorMsg()) {
          <div class="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span> <span>{{ errorMsg() }}</span>
          </div>
        }
        @if (successMsg()) {
          <div class="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <span>✅</span> <span>{{ successMsg() }}</span>
          </div>
        }

        <!-- STEP 1: USER ID & PASSWORD LOGIN -->
        @if (step() === 'LOGIN') {
          <form (ngSubmit)="submitCredentials()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">User ID / Email</label>
              <input type="email" name="email" [(ngModel)]="email" required placeholder="you@paypilot.com"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="block text-xs font-bold text-slate-700">Password</label>
                <button type="button" (click)="step.set('FORGOT'); errorMsg.set(''); successMsg.set('')" class="text-xs font-semibold text-indigo-600 hover:underline">
                  Forgot Password?
                </button>
              </div>
              <input type="password" name="password" [(ngModel)]="password" required placeholder="••••••••"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
            </div>

            <button type="submit" [disabled]="loading()"
              class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition">
              {{ loading() ? 'Authenticating...' : 'Login' }}
            </button>

            <p class="text-center text-xs text-slate-500 pt-2">
              New to PayPilot? <a routerLink="/register" class="font-bold text-indigo-600 hover:underline">Create Account</a>
            </p>
          </form>
        }

        <!-- STEP 2: SCREEN VERIFICATION (CAPTCHA) AFTER CREDENTIALS -->
        @if (step() === 'CAPTCHA') {
          <div class="space-y-4">
            <div class="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 text-center">
              <p class="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Step 2: Screen Verification</p>
              <div class="flex items-center justify-center gap-3">
                <div class="px-5 py-2.5 bg-slate-900 text-amber-300 font-mono text-xl font-black tracking-[0.35em] rounded-xl select-none line-through decoration-indigo-400">
                  {{ captchaCode() }}
                </div>
                <button type="button" (click)="generateCaptcha()" class="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold" title="Refresh Captcha">
                  ↻
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Enter Security Code</label>
              <input type="text" [(ngModel)]="captchaInput" (keyup.enter)="verifyCaptcha()" placeholder="Type the characters shown above"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm font-mono uppercase tracking-widest" />
            </div>

            <button type="button" (click)="verifyCaptcha()"
              class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition">
              Verify Screen Security
            </button>
          </div>
        }

        <!-- STEP 3: OTP VERIFICATION -->
        @if (step() === 'OTP') {
          <div class="space-y-4">
            <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <p class="text-xs font-bold text-emerald-800">Step 3: 2FA One-Time Password</p>
              <p class="text-[11px] text-emerald-700 mt-1">Demo BFSI Verification OTP: <span class="font-mono font-black text-sm bg-white px-2 py-0.5 rounded border border-emerald-300">{{ generatedOtp() }}</span></p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit OTP</label>
              <input type="text" maxlength="6" [(ngModel)]="otpInput" (keyup.enter)="verifyOtp()" placeholder="••••••"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-center text-lg font-mono font-bold tracking-[0.4em]" />
            </div>

            <button type="button" (click)="verifyOtp()"
              class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition">
              Verify OTP & Enter PayPilot
            </button>
          </div>
        }

        <!-- FORGOT / CHANGE PASSWORD FLOW -->
        @if (step() === 'FORGOT') {
          <div class="space-y-4">
            <p class="text-xs font-bold text-slate-700">Reset Account Password</p>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Registered Email</label>
              <input type="email" [(ngModel)]="resetEmail" placeholder="you@paypilot.com"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">New Password</label>
              <input type="password" [(ngModel)]="newPassword" placeholder="Minimum 6 characters"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div class="flex gap-2">
              <button type="button" (click)="step.set('LOGIN'); errorMsg.set('')" class="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                Back
              </button>
              <button type="button" (click)="handleResetPassword()" class="w-2/3 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                Update Password
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private billService = inject(BillService);
  private router = inject(Router);

  step = signal<'LOGIN' | 'CAPTCHA' | 'OTP' | 'FORGOT'>('LOGIN');
  captchaCode = signal('');
  captchaInput = '';

  email = '';
  password = '';
  loading = signal(false);

  generatedOtp = signal('');
  otpInput = '';
  private pendingToken = '';

  resetEmail = '';
  newPassword = '';

  errorMsg = signal('');
  successMsg = signal('');

  ngOnInit() {
    this.generateCaptcha();
  }

  generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    this.captchaCode.set(res);
    this.captchaInput = '';
  }

  submitCredentials() {
    this.errorMsg.set('');
    this.loading.set(true);
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.pendingToken = res.token;
        localStorage.removeItem('token');
        this.generateCaptcha();
        this.step.set('CAPTCHA');
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('Invalid User ID or Password!!');
      }
    });
  }

  verifyCaptcha() {
    if (this.captchaInput.trim().toUpperCase() === this.captchaCode()) {
      this.errorMsg.set('');
      this.successMsg.set('Screen Verification Successful !!');
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      this.generatedOtp.set(otp);
      this.otpInput = otp;
      setTimeout(() => {
        this.successMsg.set('');
        this.step.set('OTP');
      }, 600);
    } else {
      this.successMsg.set('');
      this.errorMsg.set('Screen Verification Unsuccessful!! Try Again');
      this.generateCaptcha();
    }
  }

  verifyOtp() {
    if (this.otpInput.trim() === this.generatedOtp()) {
      localStorage.setItem('token', this.pendingToken);
      this.errorMsg.set('');
      this.successMsg.set('OTP Verified!! Redirecting to PayPilot...');
      setTimeout(() => this.router.navigate(['/dashboard']), 500);
    } else {
      this.errorMsg.set('Invalid OTP! Please enter the 6-digit code shown above.');
    }
  }

  handleResetPassword() {
    if (!this.resetEmail || !this.newPassword) {
      this.errorMsg.set('Please enter both email and new password.');
      return;
    }
    this.billService.resetPassword(this.resetEmail, this.newPassword).subscribe({
      next: () => {
        this.errorMsg.set('');
        this.successMsg.set('Password updated! Please log in with your new password.');
        this.step.set('LOGIN');
      },
      error: (err) => this.errorMsg.set(err?.error?.message || 'Could not reset password.')
    });
  }
}
