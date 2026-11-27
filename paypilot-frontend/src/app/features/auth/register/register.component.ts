import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="brand">
          <div class="logo-badge">PP</div>
          <h1>Create PayPilot Account</h1>
          <p>Start tracking and paying your bills on time</p>
        </div>

        @if (errorMessage()) {
          <div class="alert-error">{{ errorMessage() }}</div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input id="fullName" type="text" formControlName="fullName" placeholder="Yash Sharma" />
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input id="email" type="email" formControlName="email" placeholder="yash@paypilot.com" />
          </div>

          <div class="form-group">
            <label for="phoneNumber">Phone Number (Optional)</label>
            <input id="phoneNumber" type="tel" formControlName="phoneNumber" placeholder="9876543210" />
          </div>

          <div class="form-group">
            <label for="password">Password (min 6 chars)</label>
            <input id="password" type="password" formControlName="password" placeholder="••••••••" />
          </div>

          <button type="submit" class="btn-primary" [disabled]="registerForm.invalid || loading()">
            {{ loading() ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <p class="switch-link">
          Already have an account? <a routerLink="/login">Sign in</a>
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
      margin-bottom: 1.5rem;
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
      font-size: 1.4rem;
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
      margin-bottom: 1rem;
    }
    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.35rem;
      color: var(--text-main);
    }
    input {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.95rem;
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
      margin-top: 1.25rem;
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
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly registerForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.registerForm.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Registration failed. Email may already exist.');
      }
    });
  }
}
