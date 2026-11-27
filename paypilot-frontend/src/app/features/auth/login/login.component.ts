import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="brand">
          <div class="logo-badge">PP</div>
          <h1>PayPilot</h1>
          <p>Sign in to manage your bills & recurring payments</p>
        </div>

        @if (errorMessage()) {
          <div class="alert-error">{{ errorMessage() }}</div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input id="email" type="email" formControlName="email" placeholder="yash@paypilot.com" />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" placeholder="••••••••" />
          </div>

          <button type="submit" class="btn-primary" [disabled]="loginForm.invalid || loading()">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p class="switch-link">
          Don't have an account? <a routerLink="/register">Create account</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2.25rem;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.06);
    }
    .brand {
      text-align: center;
      margin-bottom: 1.75rem;
    }
    .logo-badge {
      width: 48px;
      height: 48px;
      margin: 0 auto 0.75rem;
      background: var(--primary);
      color: #fff;
      font-weight: 700;
      font-size: 1.1rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .brand p {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    .alert-error {
      background: var(--danger-bg);
      color: var(--danger);
      border: 1px solid #fecaca;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 1.25rem;
    }
    .form-group {
      margin-bottom: 1.15rem;
    }
    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.4rem;
      color: var(--text-main);
    }
    input {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.95rem;
      transition: border-color 0.15s;
    }
    input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.12);
    }
    .btn-primary {
      width: 100%;
      padding: 0.75rem;
      margin-top: 0.5rem;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
    }
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .switch-link {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .switch-link a {
      color: var(--primary);
      font-weight: 600;
      text-decoration: none;
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Invalid email or password.');
      }
    });
  }
}
