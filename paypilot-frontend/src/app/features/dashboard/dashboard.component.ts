import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
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
        <div class="welcome-card">
          <h2>Welcome back, {{ authService.currentUser()?.fullName }}!</h2>
          <p>JWT Authentication is active. Ready to connect the Bills Management module.</p>
        </div>
      </main>
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
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .welcome-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 2rem;
    }
    .welcome-card h2 {
      font-size: 1.35rem;
      margin-bottom: 0.4rem;
    }
    .welcome-card p {
      color: var(--text-muted);
      font-size: 0.95rem;
    }
  `]
})
export class DashboardComponent {
  readonly authService = inject(AuthService);
}
