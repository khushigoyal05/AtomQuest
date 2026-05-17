# ⚛️ AtomQuest — Goal Setting & Tracking Portal

> **Hackathon-grade, production-ready** enterprise performance management system with AI-powered goal suggestions, real-time analytics, escalation engine, and multi-role dashboards.

![AtomQuest](https://img.shields.io/badge/AtomQuest-v1.0-6366f1?style=for-the-badge&logo=atom)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square)

---

## 🚀 Quick Start (One Command)

```bash
# 1. Clone and navigate
cd portal

# 2. Copy environment file
cp .env.example .env

# 3. Start everything (PostgreSQL + Backend + Frontend)
docker-compose up
```

Open **http://localhost:5173** in your browser.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (or Docker)
- npm / npx

### Step 1: Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Push schema & seed database
npx prisma db push
npx prisma db seed

# Start dev server
npm run dev
# → API running at http://localhost:4000
```

### Step 2: Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:4000/api" > .env

# Start dev server
npm run dev
# → App running at http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin / HR** | admin@atomquest.com | admin123 | Full system access |
| **Manager L1** | manager1@atomquest.com | manager123 | Team dashboard, approvals |
| **Manager L2** | manager2@atomquest.com | manager123 | Product team dashboard |
| **Employee 1** | employee1@atomquest.com | emp123 | Approved goals, Q1 progress |
| **Employee 2** | employee2@atomquest.com | emp123 | Goals pending approval |
| **Employee 3** | employee3@atomquest.com | emp123 | Goals returned for rework |

> 💡 Use the **"⚡ Switch Role"** button in the top bar to switch between roles instantly without logging out.

---

## ✨ Features

### 👤 Employee
- ✅ Create up to 8 goals with Thrust Area, UoM, Target, Weightage
- ✅ Real-time weightage validation (must total 100%, min 10% per goal)
- ✅ **AI Goal Suggestions** powered by OpenRouter (✨ button on goal form)
- ✅ Submit goals for manager approval
- ✅ View locked goals (read-only after approval)
- ✅ Quarterly achievement check-in (Q1–Q4)
- ✅ **⚠️ At-Risk badge** when score drops below 50%
- ✅ Threaded comments on each goal card
- ✅ Animated circular progress indicators

### 👔 Manager (L1)
- ✅ Team dashboard with submission status chips
- ✅ Approve or Return goals with mandatory reason
- ✅ **Inline editing** of target/weightage during review
- ✅ Quarterly check-in comments per goal per employee
- ✅ Team progress overview with score bars

### 🔑 Admin / HR
- ✅ Configure goal-setting cycles (open/close dates)
- ✅ Manage org hierarchy (employee→manager mapping)
- ✅ Completion rates dashboard with pie chart
- ✅ Unlock goals after lock date (with audit reason)
- ✅ **Full audit trail**: who changed what, when
- ✅ Push Shared Goals to multiple employees
- ✅ **Excel/CSV export** of Planned vs Actual achievements
- ✅ Escalation log with Pending/Resolved management

### 📊 Analytics (All Roles)
- ✅ QoQ score trend line chart
- ✅ Department performance heatmap (bar chart)
- ✅ Goal distribution pie charts (Thrust Area, UoM)
- ✅ Manager effectiveness table with check-in rates
- ✅ PNG export (right-click any chart)

### 🤖 Bonus Features
- ✅ **AI Goal Suggestions** — OpenRouter API with smart mock fallback
- ✅ **Smart Progress Nudge** — auto-email + notification when score < 50%
- ✅ **Escalation Engine** — cron job checks submission/approval deadlines hourly
- ✅ **Goal Comments** — threaded comments with timestamps
- ✅ **Email Notifications** — console-mock mode (zero SMTP setup needed for demo)

---

## 🏗️ Architecture

```
portal/
├── frontend/                  # React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── contexts/          # Auth, Theme
│   │   ├── components/        # UI primitives, Layout
│   │   ├── pages/             # Employee, Manager, Admin, Analytics
│   │   └── lib/               # API client, utils, shortcuts
│   └── Dockerfile
│
├── backend/                   # Node.js + Express + Prisma
│   ├── src/
│   │   ├── routes/            # All REST API routes
│   │   ├── services/          # Scoring, Email, Escalation, AI, Audit
│   │   └── middleware/        # Auth, Error handling
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (10 tables)
│   │   └── seed.ts            # Demo data
│   └── Dockerfile
│
├── architecture/              # System architecture diagrams (Mermaid)
├── docker-compose.yml         # One-command setup
├── .env.example               # All required env vars
└── README.md
```

See [`architecture/system-architecture.md`](./architecture/system-architecture.md) for detailed Mermaid diagrams.

---

## 🧮 Scoring Formulas

| UoM Type | Formula | Example |
|----------|---------|---------|
| **Numeric Higher** | `Actual ÷ Target × 100` | Target: 95%, Actual: 78% → Score: 82.1% |
| **Numeric Lower** | `Target ÷ Actual × 100` | Target: 200ms, Actual: 180ms → Score: 111% |
| **Timeline** | `% completion entered` | 40% done → Score: 40% |
| **Zero-Based** | `Actual=0 → 100%, else 0%` | 0 bugs → 100% |

Scores are clamped to 0–150%. Weighted average = Overall Score.

---

## 📅 Phase Schedule

| Phase | Window | Actions |
|-------|--------|---------|
| Goal Setting | May 1 – Jun 30 | Create, Submit, Approve |
| Q1 Check-in | July 1–31 | **← ACTIVE** Progress update |
| Q2 Check-in | Oct 1–31 | Progress update |
| Q3 Check-in | Jan 1–31 | Progress update |
| Annual Review | Mar 1 – Apr 30 | Final achievement |

---

## 🔧 Environment Variables

See [`.env.example`](./.env.example) for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret (change in production!) |
| `OPENROUTER_API_KEY` | Optional — leave empty for mock AI suggestions |
| `SMTP_*` | Optional — leave empty for console-log email mock |

---

## 🐳 Docker

```bash
# Build and start all services
docker-compose up --build

# Stop
docker-compose down

# Reset database
docker-compose down -v && docker-compose up
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Focus search bar |
| `Cmd/Ctrl + P` | Print current page |
| `Escape` | Close modals |
| `Cmd/Ctrl + Shift + ←` | Navigate back |

---

## 📧 Email Notifications

In **demo/development mode** (no SMTP configured), all emails are printed to the backend console in a formatted box. This means you can see every email notification in real-time without any mail server.

To enable real email sending, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` in your `.env`.

---

Built with ❤️ for the AtomQuest Hackathon 2026
