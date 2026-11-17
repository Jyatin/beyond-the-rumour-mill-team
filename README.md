# 🎓 Beyond the Rumour Mill

> **A campus placement and interview intelligence platform designed to replace unverified hearsay with structured, authentic hiring insights from placed alumni and graduating seniors.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel_Deployment-success?style=for-the-badge&logo=vercel)](https://beyond-the-rumour-mill-main.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%7C%20Neon-336791?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.3-C5F74F?style=for-the-badge)](https://orm.drizzle.team/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.7.7-orange?style=for-the-badge)](https://www.better-auth.com/)
[![Vitest](https://img.shields.io/badge/Tests-24_Suites_Passing-brightgreen?style=for-the-badge&logo=vitest)](https://vitest.dev/)

---

🌐 **Live Project:** [https://beyond-the-rumour-mill-main.vercel.app](https://beyond-the-rumour-mill-main.vercel.app)

---

## 📸 Platform Interface

![Beyond the Rumour Mill Live Platform](screenshots/platform-preview.png)

---

## ⚡ The Problem

During campus recruitment, engineering students face severe information asymmetry. Critical interview rounds, coding questions, cutoff criteria, and recruiter expectations are scattered across unorganized WhatsApp chats, personal messages, and word of mouth. Once senior batches graduate, this knowledge is lost.

**Beyond the Rumour Mill** solves this by centralizing placement experiences into an institutional, searchable knowledge base that gets richer with every graduating class.

---

## ✨ Core Features

| Feature | Route | Description |
|---|---|---|
| **Experience Capture** | `/experiences/new` | 10-step wizard recording interview rounds, question breakdowns, difficulty, and outcomes (with optional anonymity). |
| **Experience Repository** | `/experiences` | Searchable feed of student interview journeys with real-time filters for company, role, outcome, and difficulty. |
| **Company Dossiers** | `/companies/[id]` | Aggregated company hiring profiles showing round structures, difficulty ratings, and past questions. |
| **Candidate Readiness** | `/prepare` | User-scoped preparation checklist with persistent progress calculation and study milestones. |
| **Alumni Mentorship** | `/connect` | Directory of placed alumni offering guidance and mentorship to current students. |
| **Placement Drives** | `/admin/drives` | Placement cell administrative portal to announce campus drives and review student applications. |

---

## 🏗️ Architecture

```mermaid
graph TD
    Client[Next.js App Router Client] --> Server[Next.js 16 Server Actions & RSC]
    Server --> Auth[Better Auth Session Guard]
    Server --> Zod[Zod Schema Validation]
    Zod --> Drizzle[Drizzle ORM 0.45.3]
    Drizzle --> DB[(PostgreSQL 16 - Neon / Local)]
```

The application is structured into three decoupled product modules for parallel team development:
- **Module 1**: Experience Capture & Placement Intelligence (`schema/module-1.ts`)
- **Module 2**: Candidate Preparation, Q&A & Alumni Connect (`schema/module-2.ts`)
- **Module 3**: Placement Drives, Governance & Moderation (`schema/module-3.ts`)

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React
- **Backend:** Next.js Server Actions, Route Handlers, Node.js
- **Database & ORM:** PostgreSQL 16 (Neon), Drizzle ORM
- **Authentication:** Better Auth (email/password with secure session cookies)
- **Testing & CI:** Vitest (24 test suites), GitHub Actions (`postgres:16` container)

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/Jyatin/beyond-the-rumour-mill-team.git
cd beyond-the-rumour-mill-team
npm install
```

### 2. Configure Environment (`.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/beyond_the_rumour_mill"
BETTER_AUTH_SECRET="your_development_secret_key_at_least_32_chars"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Migrate, Seed & Run
```bash
npm run db:push
npm run db:seed
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Run Tests
```bash
npm run test
```

---

## 👥 Team & Module Allocation

| Role | Name | Domain Ownership |
|---|---|---|
| **Project Lead & Platform Architect** | **Jyatin Singh** ([@Jyatin](https://github.com/Jyatin)) | Platform Core, Better Auth, Database Root, CI/CD |
| **Module 1 Lead** | Teammate 1 | Experience Ingestion & Company Dossiers |
| **Module 2 Lead** | Teammate 2 | Candidate Readiness Hub, Q&A & Alumni Connect |
| **Module 3 Lead** | Teammate 3 | Placement Drives, Moderation & Governance |

---

**Beyond the Rumour Mill** — Less hearsay, more first-hand experience, better-informed candidates.
