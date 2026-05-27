# 🏋️ GymOS India — Hindi-First WhatsApp-First Gym Operating System

> "Ek system jo poora gym chalaye — sirf phone se."

---

## 🎯 Product Vision

GymOS India is a **Hindi-first, WhatsApp-first Gym Operating System** built specifically for:
- Indian gym owners (Tier 2 / Tier 3 cities)
- Non-technical owner-operated gyms
- Gyms currently using diary/register/Excel

**Mission:** Remove daily operational headaches for gym owners.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, TailwindCSS, Shadcn UI |
| Backend | Node.js, NestJS, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Realtime | Socket.io (WebSockets) |
| Auth | JWT + OTP (SMS/WhatsApp) |
| Payments | Razorpay (UPI, Card, Netbanking) |
| WhatsApp | WhatsApp Business API (Meta) |
| SMS | Twilio / MSG91 |
| Storage | AWS S3 / Cloudflare R2 |
| Cloud | AWS / Supabase |
| DevOps | Docker, Docker Compose, GitHub Actions |

---

## 📁 Project Structure

```
gymos-india/
├── frontend/          # Next.js 14 App
├── backend/           # NestJS API
├── docs/              # Architecture docs, schemas, flows
├── scripts/           # DB seed, deploy scripts
└── docker/            # Docker configs
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (recommended)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/gymos-india.git
cd gymos-india

# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### 2. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Database Setup

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 4. Run with Docker

```bash
docker-compose up -d
```

### 5. Run Locally

```bash
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Frontend: http://localhost:3000
Backend API: http://localhost:3001
API Docs: http://localhost:3001/api/docs

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Owner** | Full access — all branches, all data, billing |
| **Manager** | Branch-level full access |
| **Trainer** | Assigned members, own attendance, PT tracking |
| **Receptionist** | Check-in, renewals, payments |
| **Member** | Own profile, attendance, payments |

---

## 📱 Core Features

1. **Member Management** — Fast member add, QR ID, goal tracking
2. **Renewal Automation** — 7/3/0/-3/-7 day WhatsApp reminders
3. **WhatsApp Integration** — Automated messages, broadcasts, AI replies
4. **Payment Management** — UPI, cash, receipts, GST invoices
5. **Attendance System** — QR check-in, streaks, absence alerts
6. **Trainer Management** — Assignments, commissions, accountability
7. **Owner Dashboard** — Daily revenue, renewals, pending payments
8. **Multi-Branch** — Centralized control across branches

---

## 💰 Pricing (SaaS)

| Plan | Price | Gyms |
|------|-------|------|
| **Starter** | ₹999/month | 1 branch, 200 members |
| **Growth** | ₹2,499/month | 1 branch, unlimited members |
| **Pro** | ₹4,999/month | 3 branches, all features |
| **Enterprise** | Custom | 10+ branches, white-label |

---

## 📞 Support

WhatsApp Support: +91-XXXXX-XXXXX
Email: support@gymos.in
