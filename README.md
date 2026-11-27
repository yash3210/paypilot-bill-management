# PayPilot — BFSI Bill Management & Payment Platform

Full-stack fintech bill management web application built with **Spring Boot 4.2 (Java 17/21, Spring Security 7, PostgreSQL)** and **Angular 18+ (Standalone Components, Signals, Reactive Forms)**.

## Core Features
- **JWT Authentication & Security**: User registration, login, BCrypt password hashing, stateless JWT token validation, and Angular HTTP Auth Interceptor + Route Guards.
- **Bills Management (`/api/bills`)**: Create, view, filter (`ALL`, `PENDING`, `PAID`, `OVERDUE`), and delete recurring utility, card, and subscription bills per authenticated user.
- **Payment Gateway Simulator & Receipts (`/api/payments`)**: Interactive checkout modal supporting UPI, Debit Card, Credit Card, and Net Banking with auto-generated transaction reference IDs (`TXN-YYYYMMDD-XXXXXX`) and persistent payment history.
- **Real-Time KPI Dashboard**: Live reactive calculation of total pending dues, total paid amount, and transaction counts using Angular Signals.

## Running Locally

### 1. Backend (Spring Boot on port 8080)
    cd paypilot-backend
    ./mvnw spring-boot:run

### 2. Frontend (Angular on port 4200)
    cd paypilot-frontend
    npm install
    npm start
