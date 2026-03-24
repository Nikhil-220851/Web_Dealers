# Web_Dealers

# 🏦 Loan Management System (LMS)

> A Full-Stack FinTech Web Application

---

## 📌 Project Overview

The **Loan Management System (LMS)** is a web-based FinTech application that manages the complete lifecycle of a loan:

Application → EMI Calculation → Approval → Repayment → Overdue → Defaulter → Reports

This system replaces manual loan tracking (Excel sheets & paperwork) with a secure, structured, and automated digital platform.

It simulates a mini digital banking loan portal.

---

## 🚨 Problem Statement

Many small financial institutions and NBFCs manage loans manually. This causes:

- EMI miscalculations
- No structured approval workflow
- Poor repayment tracking
- Delayed defaulter identification
- No proper revenue reporting
- Data security risks

This project solves all the above issues using automation and structured workflows.

---

## 🎯 Key Features

### 🌐 Public Area
- Landing Page
- About Section
- Features Section
- Apply Loan button
- Login / Register
- Contact Section

---

### 👤 Borrower Features
- Register & Login (JWT Authentication)
- Apply for Loan
- View Loan Status (Pending / Approved / Rejected)
- View EMI Schedule
- Make Payment
- View Payment History
- View Remaining Balance

---

### 🔑 Admin Features
- Admin Dashboard (Users, Loans, Revenue Stats)
- Approve / Reject Loan Applications
- Monitor Active Loans
- Overdue Detection
- Generate Defaulter Report
- Generate Revenue Report

---

### ⚙️ Core Business Logic

#### EMI Formula:

EMI = [P × r × (1+r)^n] / [(1+r)^n – 1]


Where:
- P = Principal
- r = Monthly Interest Rate
- n = Number of Months

#### Overdue Logic:
If Current Date > Due Date AND Payment Not Recorded → Overdue

#### Defaulter Logic:
If Overdue > 30 Days → Defaulter

---

## 🛠 Tech Stack

### 🎨 Frontend
- HTML5
- CSS3
- JavaScript
- React.js
- Tailwind CSS

### ⚙️ Backend
- PHP 8+
- REST APIs
- JWT Authentication
- bcrypt (Password Hashing)

### 🗄 Database
- MySQL
- PDO / MySQLi

### 🔧 Tools
- Git
- GitHub
- Postman
- XAMPP / Laragon

---

## 📁 Folder Structure


loan-management-system/
│
├── frontend/ # React Application
│
├── backend/ # PHP REST APIs
│ ├── api/
│ └── config/
│
├── docs/ # Documentation
│
├── README.md
└── .gitignore


---

## 🔄 System Workflow

1. User registers and logs in
2. User submits loan application
3. System calculates EMI automatically
4. Loan stored as Pending
5. Admin reviews application
6. Admin approves/rejects
7. If approved → EMI schedule generated
8. User makes payments
9. System updates balance
10. Missed payment → Overdue
11. Overdue > 30 days → Defaulter
12. Admin generates reports anytime

---

## 👥 Team Roles

### 👑 Project Lead
- GitHub management
- Architecture design
- Authentication implementation
- Integration of frontend & backend
- Deployment

### 🎨 Frontend Developer
- UI development
- Loan & dashboard pages
- API integration
- Responsive design

### ⚙️ Backend Developer (PHP)
- REST API development
- EMI logic implementation
- Loan approval workflow
- Payment & defaulter logic
- JWT handling

### 🗄 Database Engineer
- MySQL schema design
- Foreign key relationships
- Query optimization
- Report queries

### 🧪 Testing & Reports Engineer
- API testing (Postman)
- Bug tracking
- Revenue & defaulter reports
- Deployment support
- Final documentation

---

## 🌿 GitHub Workflow Strategy

### Branching Model

- `main` → Production-ready code
- `develop` → Integration branch
- `feature/*` → Individual feature branches

Example:
- feature/authentication
- feature/loan-module
- feature/payment-module
- feature/admin-dashboard

### Rules

- ❌ No direct push to `main`
- ✅ Use feature branches
- ✅ Use Pull Requests
- ❌ Never commit `.env`, `node_modules`, or vendor files

---

## 🚀 15-Day Sprint Plan

### Phase 1 (Days 1–3)
- Setup repo
- Setup database
- Authentication APIs
- Landing page UI

### Phase 2 (Days 4–9)
- Loan module
- EMI logic
- Admin approval
- Payment module
- Overdue & Defaulter detection
- Reports module

### Phase 3 (Days 10–13)
- Integration testing
- UI polish
- Validation & security improvements

### Phase 4 (Days 14–15)
- Deployment
- Documentation
- Final demo

---

## 📈 Future Enhancements

- Email notifications
- Payment gateway integration
- Analytics dashboard
- AI-based loan eligibility scoring
- Credit scoring system

---

## 🎯 Final Vision

This project demonstrates:

- Full-stack development skills
- Real-world FinTech business logic
- Secure authentication implementation
- Structured Git workflow
- Production-ready system architecture