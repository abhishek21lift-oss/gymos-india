# GymOS India — Complete Architecture & API Documentation

## 1. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    GYMOS INDIA SYSTEM                       │
├──────────────┬──────────────┬──────────────┬───────────────┤
│   MOBILE APP │  WEB PORTAL  │  WHATSAPP BOT│  ADMIN PANEL  │
│  (PWA/React) │  (Next.js)   │  (Meta API)  │  (Next.js)    │
└──────┬───────┴──────┬───────┴──────┬───────┴───────┬───────┘
       │              │              │               │
       └──────────────┴──────────────┴───────────────┘
                              │
                     ┌────────▼────────┐
                     │   API GATEWAY   │
                     │ (NestJS + NGINX) │
                     └────────┬────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
   ┌──────▼──────┐   ┌───────▼──────┐   ┌───────▼──────┐
   │  PostgreSQL  │   │    Redis     │   │  Bull Queue  │
   │  (Primary)  │   │  (Cache/OTP) │   │  (Jobs/CRON) │
   └─────────────┘   └──────────────┘   └──────────────┘
          │
   ┌──────▼──────────────────────────────┐
   │         EXTERNAL SERVICES           │
   │  WhatsApp API │ Razorpay │ MSG91    │
   │  AWS S3       │ Firebase │ Twilio   │
   └─────────────────────────────────────┘
```

---

## 2. MULTI-TENANT ARCHITECTURE

```
Organization (Gym Brand/Owner)
├── Branch 1 (Main)
│   ├── Users (Manager, Trainers, Receptionists)
│   ├── Members
│   ├── Attendance Records
│   └── Payments
├── Branch 2 (Satellite)
│   └── ...
└── Shared
    ├── Membership Plans
    ├── Notification Templates
    └── Settings
```

**Tenant Isolation:** Every DB query is scoped by `organizationId` and `branchId`. No cross-tenant data access is possible.

---

## 3. ROLE PERMISSION MATRIX

| Feature                  | Owner | Manager | Trainer | Receptionist |
|--------------------------|-------|---------|---------|--------------|
| View Dashboard           | ✅    | ✅      | ❌      | ❌           |
| Add Member               | ✅    | ✅      | ✅      | ✅           |
| Edit Member              | ✅    | ✅      | ❌      | ✅           |
| Delete Member            | ✅    | ✅      | ❌      | ❌           |
| View All Members         | ✅    | ✅      | Own     | ✅           |
| Mark Attendance          | ✅    | ✅      | ✅      | ✅           |
| Collect Payment          | ✅    | ✅      | ❌      | ✅           |
| View Revenue             | ✅    | ✅      | ❌      | ❌           |
| Send WhatsApp            | ✅    | ✅      | ❌      | ❌           |
| Manage Trainers          | ✅    | ✅      | ❌      | ❌           |
| Manage Plans             | ✅    | ❌      | ❌      | ❌           |
| Multi-Branch Access      | ✅    | Own     | Own     | Own          |
| Settings                 | ✅    | ❌      | ❌      | ❌           |
| Audit Logs               | ✅    | ❌      | ❌      | ❌           |

---

## 4. COMPLETE API REFERENCE

### Authentication
```
POST /api/v1/auth/send-otp          Send OTP to phone
POST /api/v1/auth/verify-otp        Verify OTP, get tokens
POST /api/v1/auth/login             Password login
POST /api/v1/auth/refresh           Refresh access token
GET  /api/v1/auth/me                Get current user profile
```

### Members
```
GET    /api/v1/members              List members (paginated, filterable)
POST   /api/v1/members              Create member
GET    /api/v1/members/search       Search by phone
GET    /api/v1/members/:id          Get member detail
PUT    /api/v1/members/:id          Update member
DELETE /api/v1/members/:id          Deactivate member
GET    /api/v1/members/:id/stats    Member statistics
POST   /api/v1/members/:id/membership  Assign membership plan
POST   /api/v1/members/:id/qr/regenerate  Regenerate QR code
```

### Attendance
```
POST /api/v1/attendance/qr               QR check-in
POST /api/v1/attendance/manual           Manual check-in
POST /api/v1/attendance/:id/checkout     Check-out
GET  /api/v1/attendance/today            Today's attendance
GET  /api/v1/attendance/member/:id       Member history
GET  /api/v1/attendance/stats            Branch stats
POST /api/v1/attendance/trainer/checkin  Trainer check-in
POST /api/v1/attendance/trainer/checkout Trainer check-out
```

### Payments
```
POST /api/v1/payments/order          Create Razorpay order
POST /api/v1/payments/verify         Verify Razorpay payment
POST /api/v1/payments/cash           Record cash payment
POST /api/v1/payments/upi            Record UPI payment
GET  /api/v1/payments                Payment history
GET  /api/v1/payments/daily          Daily revenue summary
GET  /api/v1/payments/monthly        Monthly revenue
GET  /api/v1/payments/:id/receipt    Download PDF receipt
```

### Dashboard
```
GET /api/v1/dashboard/owner          Owner overview
GET /api/v1/dashboard/branch         Branch overview
GET /api/v1/dashboard/revenue-chart  Revenue chart data
GET /api/v1/dashboard/member-growth  Member growth chart
```

### Renewals
```
GET  /api/v1/renewals/expiring        Expiring memberships
GET  /api/v1/renewals/expired         Expired memberships
POST /api/v1/renewals/reminder/:id    Manual WhatsApp reminder
```

### Trainers
```
GET /api/v1/trainers                  All trainers
GET /api/v1/trainers/:id              Trainer detail
GET /api/v1/trainers/:id/stats        Performance stats
PUT /api/v1/trainers/:id              Update trainer
```

### WhatsApp
```
POST /api/v1/whatsapp/broadcast       Bulk broadcast
POST /api/v1/whatsapp/send            Send to single member
POST /api/v1/whatsapp/webhook         Meta webhook receiver
```

### Plans
```
GET    /api/v1/plans                  All membership plans
POST   /api/v1/plans                  Create plan
PUT    /api/v1/plans/:id              Update plan
DELETE /api/v1/plans/:id              Delete plan
```

---

## 5. WHATSAPP AUTOMATION FLOWS

### Renewal Flow (Auto - runs daily 10 AM)
```
Day -7  → "7 din baaki!" reminder
Day -3  → "Sirf 3 din!" urgent reminder
Day  0  → "Aaj last day!" final reminder
Day +3  → "Miss kar rahe hain!" follow-up
Day +7  → "Wapas aao!" win-back message
```

### Engagement Flow
```
Birthday    → Birthday wish + 1 free PT session offer
5 Days Absent → "Gym miss kar rahe ho?" nudge
New Member  → Welcome + member ID + QR code
Payment Done → Receipt + thank you message
PT Reminder → Session reminder 2 hrs before
```

---

## 6. CRON JOBS SCHEDULE

| Job | Schedule | Purpose |
|-----|----------|---------|
| Renewal Reminders | Daily 10:00 AM | Send WhatsApp renewal reminders |
| Birthday Wishes | Daily 8:00 AM | Send birthday wishes |
| Auto-expire Memberships | Daily 12:00 AM | Mark expired memberships |
| Absent Detection | Daily 9:00 PM | Detect and alert absent members |

---

## 7. SAAS PRICING MODEL

### Starter — ₹999/month
- 1 branch
- Up to 200 members
- Basic WhatsApp (manual)
- QR attendance
- Payment tracking

### Growth — ₹2,499/month ⭐ Most Popular
- 1 branch
- Unlimited members
- WhatsApp automation
- All renewal flows
- PDF receipts
- Advanced reports

### Pro — ₹4,999/month
- Up to 3 branches
- Everything in Growth
- Multi-branch dashboard
- Trainer commissions
- API access

### Enterprise — Custom
- Unlimited branches
- White-label option
- Dedicated support
- Custom integrations
- SLA guarantee

**Annual discount: 20% off**
**Free trial: 14 days**

---

## 8. GO-TO-MARKET STRATEGY

### Phase 1: Mumbai, Delhi, Bangalore
- Direct sales via WhatsApp to gym owners
- Referral program: existing clients get 1 month free per referral
- YouTube demos in Hindi showing the product
- Instagram Reels targeting #GymOwner community

### Phase 2: Tier 2 Cities
- Regional reseller partnerships
- Franchise gym chains
- Gym equipment supplier tie-ups
- Local fitness events sponsorship

### Onboarding Strategy
- Free setup call (30 min Hindi/English)
- WhatsApp-based onboarding guide
- Video tutorials in Hindi
- 7-day live support on WhatsApp

### Viral Mechanics
- Member referral rewards
- "Powered by GymOS" badge on receipts
- Social share challenges
- Leaderboard across gyms (opt-in)

---

## 9. SECURITY ARCHITECTURE

- JWT access tokens (1 day expiry)
- Refresh tokens (30 day, rotated on use)
- OTP via SMS (10 min expiry, rate limited)
- Rate limiting per IP and per user
- All passwords bcrypt hashed (rounds: 10)
- SQL injection prevention via Prisma ORM
- Input validation via class-validator
- HTTPS enforced in production
- CORS restricted to known origins
- Audit logs for all write operations
- Soft deletes only (no hard deletes)
- Tenant isolation at query level

---

## 10. DEPLOYMENT ARCHITECTURE

```
Internet
   │
   ▼
Cloudflare (DDoS, CDN, SSL)
   │
   ▼
AWS Load Balancer
   │
   ├── EC2 (Frontend - Next.js) x2
   └── EC2 (Backend - NestJS)  x2
           │
           ├── RDS PostgreSQL (Multi-AZ)
           ├── ElastiCache Redis
           └── S3 (File Storage)
```

### Recommended AWS Setup (Production)
- Frontend: EC2 t3.small or Vercel
- Backend: EC2 t3.medium (2 vCPU, 4GB RAM)
- Database: RDS db.t3.medium (PostgreSQL 15)
- Cache: ElastiCache cache.t3.micro (Redis 7)
- Storage: S3 Standard
- CDN: CloudFront

### Estimated Monthly Cost (100 gyms, 20K members)
- EC2 (2x backend): ~₹4,000
- RDS: ~₹3,500
- Redis: ~₹1,500
- S3 + CloudFront: ~₹500
- **Total: ~₹9,500/month** (vs ₹2,49,000 in revenue at 100 gyms)

---

## 11. AI ROADMAP (Phase 2)

### Q1 2025
- AI WhatsApp chatbot (member self-service)
- Smart renewal prediction (churn score)

### Q2 2025
- Voice input in Hindi for attendance
- AI workout generator (goal-based)

### Q3 2025
- Diet plan AI assistant
- Predictive revenue forecasting

### Q4 2025
- Trainer performance AI recommendations
- Member sentiment analysis from check-in patterns
