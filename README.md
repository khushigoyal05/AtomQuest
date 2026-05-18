<div align="center">

<img src="https://img.shields.io/badge/AtomQuest-Hackathon%201.0-6366f1?style=for-the-badge&logoColor=white" alt="AtomQuest Hackathon 1.0" />

# Goal Setting & Tracking Portal

**A full-stack, enterprise-grade web portal for managing the complete lifecycle of employee goals — from creation and approval to quarterly check-ins and performance reporting.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Portal-6366f1?style=for-the-badge)](https://atomquest-theta-seven.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-khushigoyal05%2FAtomQuest-181717?style=for-the-badge&logo=github)](https://github.com/khushigoyal05/AtomQuest)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Credentials](#demo-credentials)
- [User Roles and Journeys](#user-roles-and-journeys)
- [Scoring Formulas](#scoring-formulas)
- [Check-in Schedule](#check-in-schedule)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Team](#team)

---

## Overview

Organizations relying on spreadsheets, email threads, and offline review cycles for goal management face persistent blind spots — managers cannot track team progress in real time, employees lack clarity on how their work connects to organizational priorities, and HR teams spend appraisal periods piecing together incomplete data.

This portal solves those problems by providing a structured, digital goal lifecycle: from goal creation and manager approval through quarterly achievement tracking, automated scoring, escalations, and governance reporting — all in a single role-aware interface.

Built for **AtomQuest Hackathon 1.0**, the solution implements every mandatory and bonus requirement from the problem statement, plus three additional features designed to further differentiate the submission.

---

## Features

### Phase 1 — Goal Creation and Approval

| Feature | Details |
|---|---|
| Goal Sheet | Thrust Area, Title, Description, Unit of Measurement, Target, Weightage |
| Validation Engine | Total weightage must equal 100% — minimum 10% per goal — maximum 8 goals per employee |
| Manager Approval Workflow | Inline target and weightage editing, Approve, or Return for Rework with a mandatory reason |
| Goal Lock | Goals become read-only upon approval; unlockable only by Admin with a logged audit entry |
| Shared Goals | Admin or Manager pushes a departmental KPI to multiple employees; recipients may adjust weightage only — title and target are read-only |

### Phase 2 — Achievement Tracking and Quarterly Check-ins

| Feature | Details |
|---|---|
| Quarterly Achievement Input | Employees log actual values per goal for Q1 through Q4 |
| Status Tracking | Not Started / On Track / Completed — selectable per goal per quarter |
| Manager Check-in Module | Planned vs. Actual view per team member with a structured comment field per quarter |
| Auto-computed Progress Scores | Formula-based scoring engine per Unit of Measurement type; scores clamped between 0% and 150% |
| Quarterly Window Enforcement | Actions are disabled outside the active check-in window; the UI displays when the next window opens |

### Reporting and Governance

| Feature | Details |
|---|---|
| Achievement Report | One-click Excel export of Planned vs. Actual data for all employees via SheetJS |
| Completion Dashboard | Real-time view of check-in completion rates by employee and manager |
| Audit Trail | Full timestamped log of all post-lock goal changes — entity, changed by, old value, new value |

### Bonus Features — All Implemented

| Feature | Details |
|---|---|
| Escalation Engine | Configurable SLA rules — auto-notifies Employee, then Manager, then HR when submission or approval deadlines are breached; cron-based, runs hourly |
| Analytics Module | Quarter-on-Quarter trend lines, Thrust Area distribution pie chart, department bar chart, manager check-in effectiveness table |
| Email Notifications | Nodemailer integration for submission, approval, rejection, and check-in reminder events; defaults to console-log mock when SMTP is not configured |

### Additional Features

| Feature | Details |
|---|---|
| AI Goal Suggestions | A "Suggest Goals" button on the goal creation form calls the OpenRouter API and returns three context-aware suggestions based on Thrust Area and role; one-click import into the form; falls back to curated mock suggestions when no API key is configured |
| Smart Progress Nudge | The escalation service flags goals scoring below 50% mid-quarter and generates in-app notifications for both the employee and their manager; affected goal cards display an "At Risk" badge |
| Threaded Goal Comments and Activity Feed | Each goal has a threaded comment section for employee-manager discussion; the employee dashboard shows a live activity feed of the last ten events across the team |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS with custom design tokens, glassmorphism surfaces, dark and light mode |
| Animations | Framer Motion — page transitions and micro-interactions |
| Charts | Recharts |
| HTTP Client | Axios with JWT request interceptors and automatic refresh-token handling |
| Routing | React Router DOM v6 |
| Toasts | Sonner |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | SQLite via `dev.db` — zero setup for local development and judging |
| Auth | JWT access and refresh tokens, bcryptjs password hashing |
| Scheduled Jobs | node-cron — escalation engine runs hourly |
| Export | SheetJS (xlsx) |
| Email | Nodemailer — console-log mock by default, SMTP-configurable |
| AI Suggestions | OpenRouter API with curated mock fallback |
| Containerization | Docker, Docker Compose |

---

## Architecture

```
+----------------------------------------------------------+
|                  CLIENT  (React 18 + Vite)               |
|  Employee Dashboard  |  Manager Dashboard  |  Admin Panel |
|       Analytics      |  Notifications Bell |  Activity Feed|
+----------------------------+-----------------------------+
                             |  REST API  (port 4000)
+----------------------------v-----------------------------+
|              API SERVER  (Node.js + Express)             |
|  Auth  Goals  Achievements  Check-ins  Comments          |
|  Escalations  Analytics  Admin  Export  AI Suggestions   |
+-------+--------------------+-------------------+---------+
        |                    |                   |
+-------v------+   +---------v------+   +--------v--------+
|    SQLite    |   |  OpenRouter    |   |  Nodemailer /   |
|   (Prisma)   |   |  (AI Suggest)  |   |  SMTP           |
+--------------+   +----------------+   +-----------------+
```

Full Mermaid diagram available in [`architecture/system-architecture.md`](./architecture/system-architecture.md).

---

## Project Structure

```
portal/
├── frontend/
│   ├── src/
│   │   ├── App.tsx                      # Router with role-based protected routes
│   │   ├── main.tsx
│   │   ├── index.css                    # Design system — Tailwind base + custom classes
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx          # JWT auth state, login, logout
│   │   │   └── ThemeContext.tsx         # Dark/light mode, persisted to localStorage
│   │   ├── lib/
│   │   │   ├── api.ts                   # Axios instance with JWT interceptors
│   │   │   ├── utils.ts                 # formatDate, getStatusColor, THRUST_AREAS, UOM_OPTIONS
│   │   │   └── shortcuts.ts            # Keyboard shortcuts (Cmd+K, Escape)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.tsx           # Shell: Sidebar + TopBar + Outlet
│   │   │   │   ├── Sidebar.tsx          # Collapsible, role-aware navigation
│   │   │   │   └── TopBar.tsx           # Search, notifications, theme toggle, role switcher
│   │   │   └── ui/
│   │   │       ├── Modal.tsx            # Animated modal with backdrop blur
│   │   │       ├── ProgressBar.tsx      # Animated horizontal progress bar
│   │   │       ├── CircularProgress.tsx # Animated SVG circular progress ring
│   │   │       └── DataTable.tsx        # Sortable and searchable table component
│   │   └── pages/
│   │       ├── Login.tsx                # Split-panel login with quick demo login cards
│   │       ├── NotFound.tsx
│   │       ├── Analytics.tsx            # QoQ trend, pie charts, department bar, manager table
│   │       ├── employee/
│   │       │   ├── Dashboard.tsx        # Stats cards, goal progress rings, activity feed
│   │       │   ├── Goals.tsx            # Goal CRUD, AI suggestions, comments, weightage check
│   │       │   └── CheckIn.tsx          # Quarterly achievement logging with score display
│   │       ├── manager/
│   │       │   ├── Dashboard.tsx        # Team overview and submission status cards
│   │       │   ├── TeamGoals.tsx        # Approve / Return / Edit per employee
│   │       │   └── CheckIns.tsx         # Structured check-in comments per goal and quarter
│   │       └── admin/
│   │           ├── Dashboard.tsx        # Org-wide stats, pie chart, export button
│   │           ├── CycleConfig.tsx      # Create and edit phase windows
│   │           ├── OrgHierarchy.tsx     # Reporting tree and manager assignment table
│   │           ├── AuditLog.tsx         # Full audit trail
│   │           ├── Escalations.tsx      # Pending and resolved escalations management
│   │           └── SharedGoals.tsx      # Push shared goals to multiple employees
│   ├── .env                             # VITE_API_URL=http://localhost:4000/api
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/
│   ├── src/
│   │   ├── index.ts                     # Express app entry, all routes mounted
│   │   ├── middleware/
│   │   │   ├── auth.ts                  # JWT verify middleware and role guard
│   │   │   └── errorHandler.ts          # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.ts                  # POST /login, /refresh
│   │   │   ├── goals.ts                 # CRUD, /submit, /approve, /return, /manager/team
│   │   │   ├── achievements.ts          # Quarterly progress — POST and GET
│   │   │   ├── checkins.ts              # Manager check-in comments — POST and GET
│   │   │   ├── comments.ts              # Threaded goal comments
│   │   │   ├── notifications.ts         # GET and PUT /read-all
│   │   │   ├── analytics.ts             # /overview, /department, /thrust-areas,
│   │   │   │                            #   /uom, /manager-effectiveness, /employee/:id
│   │   │   ├── admin.ts                 # /cycles, /users, /audit, /escalations,
│   │   │   │                            #   /completion-rates, /shared-goals
│   │   │   ├── export.ts                # GET /achievements → .xlsx download
│   │   │   └── ai.ts                    # POST /suggest-goals
│   │   └── services/
│   │       ├── scoring.ts               # Formula engine per UoM type
│   │       ├── escalation.ts            # Cron job — SLA breach detection, runs hourly
│   │       ├── email.ts                 # Nodemailer wrapper with console-log fallback
│   │       └── audit.ts                 # createAuditEntry() helper
│   ├── prisma/
│   │   ├── schema.prisma                # 10-model SQLite schema
│   │   ├── seed.ts                      # Seeds users, goals, achievements, check-ins
│   │   └── dev.db                       # SQLite database file (gitignored)
│   ├── .env
│   ├── .env.example
│   ├── tsconfig.json
│   └── Dockerfile
│
├── architecture/
│   └── system-architecture.md
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

No database installation is required. The project uses SQLite for local development — the database file is created automatically during the seed step.

### 1. Clone the Repository

```bash
git clone https://github.com/khushigoyal05/AtomQuest.git
cd AtomQuest/portal
```

### 2. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure Environment

```bash
# Backend — defaults work out of the box for local development
cd backend
cp .env.example .env

# Frontend
cd ../frontend
cp .env.example .env
```

### 4. Set Up the Database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Start the Application

Open two terminals:

```bash
# Terminal 1 — Backend (port 4000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Visit `http://localhost:5173`

---

### Docker Setup

```bash
# From the portal/ root directory
docker-compose up --build
```

Starts both services together. SQLite is embedded — no separate database container is needed for development.

---

## Demo Credentials

Pre-seeded accounts are available on the login page via the Quick Login panel. A "Switch Role" button in the top bar allows instant switching between roles during a demo without logging out.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@atomquest.com` | `admin123` |
| Manager | `manager1@atomquest.com` | `manager123` |
| Employee | `employee1@atomquest.com` | `emp123` |

The seed data includes 6 users (1 Admin, 2 Managers, 3 Employees across Engineering and Product), approximately 20 goals at various stages of approval, Q1 achievements with computed scores, manager check-in comments, escalation records, audit log entries, and in-app notifications.

---

## User Roles and Journeys

### Employee

1. Log in and view the active cycle phase banner on the dashboard
2. Open the Goals page and create goals — select Thrust Area, Unit of Measurement, Target, and Weightage
3. The system enforces validation: total weightage = 100%, minimum 10% per goal, maximum 8 goals
4. Use the "Suggest Goals" button to receive AI-generated goal recommendations and import with one click
5. Submit the goal sheet for manager review
6. After approval, goals are locked and progress rings display computed scores
7. During an active check-in window, log actual achievement and update status per goal
8. Add or read comments on individual goals and view the team activity feed on the dashboard

### Manager

1. Log in and view the team dashboard showing each member's submission status and overall progress
2. Open a team member's goal sheet to review submitted goals
3. Edit targets or weightages inline, then approve — or return the sheet with a written reason for rework
4. Approved goals are locked for the employee
5. During an active check-in window, view Planned vs. Actual for each direct report
6. Add a structured check-in comment per goal per quarter
7. Monitor escalation alerts for overdue submissions or approvals

### Admin

1. Log in and view the org-wide completion dashboard with department-level breakdown
2. Create or modify goal-setting and check-in cycle windows via the Cycle Config page
3. Update the org hierarchy by reassigning employees to different managers
4. Push a Shared Goal to multiple employees simultaneously
5. Unlock a specific goal post-approval when an exception is required; the action is written to the audit trail
6. Review the full audit log of all post-lock changes
7. Monitor and resolve pending escalations
8. Export the full Planned vs. Actual achievement report as an Excel file

---

## Scoring Formulas

Progress scores are computed by the backend scoring engine (`services/scoring.ts`) and displayed as animated circular indicators on each goal card. All scores are clamped between 0% and 150%.

| Unit of Measurement | Description | Formula |
|---|---|---|
| Numeric / % — Min | Higher is better (e.g. Sales Revenue) | `Actual Achievement / Target` |
| Numeric / % — Max | Lower is better (e.g. TAT, Cost) | `Target / Actual Achievement` |
| Timeline | Date-based completion | Percentage entered by employee relative to deadline |
| Zero-based | Zero equals success (e.g. Safety incidents) | `If actual = 0 then 100%, otherwise 0%` |

---

## Check-in Schedule

| Phase | Window Opens | Action |
|---|---|---|
| Goal Setting | 1 May | Goal creation, submission, and approval |
| Q1 Check-in | July | Progress update — Planned vs. Actual |
| Q2 Check-in | October | Progress update — Planned vs. Actual |
| Q3 Check-in | January | Progress update — Planned vs. Actual |
| Q4 / Annual | March – April | Final achievement capture |

The active phase is shown prominently on every dashboard. Inputs for inactive phases are disabled with a message indicating when the next window opens. Phase windows are configurable by the Admin through the Cycle Config page.

---

## Environment Variables

### backend/.env

```env
# Database
DATABASE_URL="file:./dev.db"

# Auth
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Server
PORT=4000
NODE_ENV=development

# AI Suggestions — leave empty to use the built-in mock fallback
OPENROUTER_API_KEY=

# Email — leave empty to use the console-log mock
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### frontend/.env

```env
VITE_API_URL=http://localhost:4000/api
```

---

## Deployment

### Backend — Render

1. Push the repository to GitHub
2. Create a new Render project and connect the repository
3. Set the root directory to `portal/backend`
4. Add the required environment variables in the Render dashboard
5. Render auto-deploys on every push to main

### Frontend — Vercel

```bash
cd frontend
vercel deploy --prod
```

Set `VITE_API_URL` to the deployed Render backend URL in the Vercel project environment settings.

### Full Stack — Docker Compose

The included `docker-compose.yml` supports a production setup with PostgreSQL. Update `DATABASE_URL` accordingly and run:

```bash
docker-compose up --build -d
```

---


<div align="center">

Built for **AtomQuest Hackathon 1.0**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Portal-6366f1?style=for-the-badge)](https://atomquest-theta-seven.vercel.app)

</div>
