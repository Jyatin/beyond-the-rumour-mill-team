# 🎓 Beyond the Rumour Mill — Campus Placement & Interview Intelligence Platform

[![CI Pipeline](https://github.com/Jyatin/beyond-the-rumour-mill/actions/workflows/ci.yml/badge.svg)](https://github.com/Jyatin/beyond-the-rumour-mill/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-20.x%20LTS-brightgreen.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.5%20App%20Router-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%7C%20Neon-336791.svg)](https://neon.tech/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.45.3-C5F74F.svg)](https://orm.drizzle.team/)
[![Better Auth](https://img.shields.io/badge/Better%20Auth-1.7.7-orange.svg)](https://www.better-auth.com/)
[![Vitest](https://img.shields.io/badge/Vitest-24%20Suites%20Passing-success.svg)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> **A production-oriented campus recruitment and placement intelligence platform designed to eliminate hearsay, structure multi-round interview archives, generate company intelligence dossiers, and empower candidates with actionable readiness tracking.**

- **Live Web Application:** [https://beyond-the-rumour-mill-main.vercel.app](https://beyond-the-rumour-mill-main.vercel.app)
- **Primary Source Repository:** [https://github.com/Jyatin/beyond-the-rumour-mill](https://github.com/Jyatin/beyond-the-rumour-mill)
- **Team Modular Repository:** [https://github.com/Jyatin/beyond-the-rumour-mill-team](https://github.com/Jyatin/beyond-the-rumour-mill-team)
- **Team Handoff Guide:** [TEAM_HANDOFF_GUIDE.md](./TEAM_HANDOFF_GUIDE.md)
- **File Ownership Matrix:** [TEAM_FILE_OWNERSHIP_MATRIX.md](./TEAM_FILE_OWNERSHIP_MATRIX.md)
- **Integration Guide:** [TEAM_INTEGRATION_GUIDE.md](./TEAM_INTEGRATION_GUIDE.md)

---

## ⚡ 30-Second Executive Summary

### What is Beyond the Rumour Mill?
Beyond the Rumour Mill is a dedicated full-stack web platform built for engineering college placement ecosystems. It replaces informal, ephemeral chat-group advice ("rumours") with a structured, verifiable, and permanent knowledge base of campus recruitment intelligence. Graduating seniors and placed alumni document their multi-round hiring experiences, which are dynamically transformed into company-specific hiring dossiers, searchable interview question threads, and personal candidate readiness checklists for upcoming student batches.

**Why we built this:** Every placement season, engineering students face massive information asymmetry. Critical interview rounds, coding challenges, cutoffs, and recruiter expectations are lost across scattered WhatsApp groups, personal chats, and informal notes once senior batches graduate. Beyond the Rumour Mill institutionalizes this knowledge into an enduring, peer-verified digital asset that grows more valuable with every graduating class.

### Why does it stand out from a standard campus forum or advice board?
Most student placement projects are static mockups, simple blogs, or unorganized message boards without relational integrity, structured round schemas, or privacy safeguards. Beyond the Rumour Mill approaches placement intelligence with serious enterprise engineering:

| Engineering Dimension | Naive Student Forum / Spreadsheet | Beyond the Rumour Mill Production Implementation |
|---|---|---|
| **Data Structure** | Freeform text posts or unsearchable spreadsheet rows. | **Normalized relational schema:** Structured rounds (`interview_rounds`), questions by topic (`interview_questions`), difficulty ratings, and verified outcomes. |
| **Privacy & Anonymity** | Either forces full public identity or allows completely untracked anonymous spam. | **Dual-mode identity with author auditing:** Displays as "Anonymous" to public viewers while preserving verified author references internally for anti-abuse auditing. |
| **Experience Capture** | Single big textarea that produces incomplete narratives. | **10-step guided wizard:** Progressively captures company tier, online assessment breakdown, technical rounds, questions asked, and preparation advice. |
| **Company Intelligence** | Manually written static summaries that quickly rot. | **Dynamic dossier aggregation:** Computes real-time difficulty distributions, round sequences, and topic frequencies directly from student contributions. |
| **Candidate Readiness** | Passive reading of tips without actionable next steps. | **Persistent user-scoped checklist:** Interactive study task tracker storing completion states per candidate in PostgreSQL with real-time progress calculations. |
| **Parallel Development** | High merge conflict risk across monolithic files. | **Decoupled 3-module product architecture:** Mutually exclusive schema files, route ownership, and server action boundaries allowing 3 teammates to push in parallel with zero merge conflicts. |

---

## 📑 Table of Contents

- [1. Application Interface & Product Walkthrough](#1-application-interface--product-walkthrough)
- [2. System Architecture](#2-system-architecture)
  - [High-Level Architecture Diagram](#high-level-architecture-diagram)
  - [Decoupled 3-Module Product Architecture](#decoupled-3-module-product-architecture)
- [3. End-to-End Core Workflows](#3-end-to-end-core-workflows)
  - [A. Authentication & Role-Based Access Control](#a-authentication--role-based-access-control)
  - [B. 10-Step Structured Experience Capture](#b-10-step-structured-experience-capture)
  - [C. Experience Repository & Multi-Faceted Browsing](#c-experience-repository--multi-faceted-browsing)
  - [D. Company Intelligence Dossiers](#d-company-intelligence-dossiers)
  - [E. Candidate Preparation Checklist & Readiness Tracking](#e-candidate-preparation-checklist--readiness-tracking)
  - [F. Campus Placement Drives & Administrative Governance](#f-campus-placement-drives--administrative-governance)
- [4. Database Design & Relational Data Integrity](#4-database-design--relational-data-integrity)
  - [Entity-Relationship Diagram](#entity-relationship-diagram)
  - [Key Data Architecture Decisions](#key-data-architecture-decisions)
- [5. Security Engineering & Data Protection Matrix](#5-security-engineering--data-protection-matrix)
- [6. Testing, Quality Assurance & CI Pipelines](#6-testing-quality-assurance--ci-pipelines)
  - [Automated Verification Status](#automated-verification-status)
  - [GitHub Actions CI Pipeline](#github-actions-ci-pipeline)
- [7. Technology Stack & Architectural Rationale](#7-technology-stack--architectural-rationale)
- [8. Local Development Setup](#8-local-development-setup)
- [9. Core Server Actions & API Reference](#9-core-server-actions--api-reference)
- [10. Team, Roles & Collaboration Architecture](#10-team-roles--collaboration-architecture)
- [11. Engineering Trade-offs & Deep-Dives](#11-engineering-trade-offs--deep-dives)
- [12. Codebase Exploration Guide](#12-codebase-exploration-guide)
- [Author & Team Acknowledgements](#author--team-acknowledgements)

---

## 1. Application Interface & Product Walkthrough

The user interface follows an **editorial, journal-grade visual design system** designed to feel like an authoritative campus publication rather than a generic SaaS template. It combines high-contrast typography, warm paper tones, and tailored illustrations.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  🎓 Beyond the Rumour Mill     Experiences   Companies   Questions   Prepare   Connect  [Sign In]│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   Connecting placed alumni with tomorrow's talent.                                               │
│   Real placement experiences, real questions, real people — turning rumours into intelligence.   │
│                                                                                                  │
│   ┌─────────────────────────────┐  ┌─────────────────────────────┐  ┌──────────────────────────┐ │
│   │ 💼 Philips India            │  │ 🏢 Google India             │  │ 🚀 Amazon AWS            │ │
│   │ 4 Rounds • Medium • Offer   │  │ 5 Rounds • Hard • Offer     │  │ 3 Rounds • Hard • Reject │ │
│   │ "Heavy focus on OS/DBMS"    │  │ "Graphs & System Design"    │  │ "Speed in OA was key"    │ │
│   └─────────────────────────────┘  └─────────────────────────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Surfaces & Live Routes

1. **Editorial Homepage (`/`)**: Scrollytelling hero section introducing the campus placement problem, real-time contribution statistics, and quick-action navigation cards.
2. **Experience Repository (`/experiences`)**: Public directory of student submissions featuring real-time search and dual-mode filtering (Outcome and Difficulty).
3. **Experience Detail (`/experiences/[id]`)**: Full-page breakdown of a candidate's journey, round durations, topics covered, interview questions, and direct tips.
4. **10-Step Experience Submission Wizard (`/experiences/new`)**: Step-by-step form capturing company metadata, candidate context, online assessment specifics, coding challenges, core fundamentals, narrative tips, and anonymity preference.
5. **Company Directory & Dossier (`/companies`, `/companies/[id]`)**: Detailed profile pages consolidating student feedback, interview rounds breakdown, difficulty ratings, and active recruitment drives.
6. **Candidate Preparation Planner (`/prepare`)**: Interactive study task management checklist where students add, organize, and toggle preparation milestones with persistent database progress tracking.
7. **Alumni Directory & Mentorship (`/connect`, `/alumni`)**: Directory of placed alumni across top technology companies offering career advice and mentorship contact links.
8. **Campus Placement Drives & Moderation (`/admin/drives`, `/admin/moderation`)**: Placement cell portal to post active on-campus recruitment drives, review reported contributions, and maintain community credibility.

---

## 2. System Architecture

### High-Level Architecture Diagram

The application is structured as a **modular monolith** leveraging Next.js App Router, React Server Components for zero-waterfall data fetching, Server Actions for transactional mutations, and Drizzle ORM for type-safe database queries against PostgreSQL:

```mermaid
graph TD
    subgraph Client Layer [Client Layer - Browser]
        UI[Next.js App Router UI Pages]
        Forms[Client Component Wizards & Checklists]
        Search[Interactive Search & Pill Filters]
    end

    subgraph Application Layer [Application Layer - Next.js 16 Runtime]
        RSC[React Server Components - SSR]
        SA[Next.js Server Actions - Mutations]
        Auth[Better Auth Engine - Session & Security]
        Zod[Zod Schema Validators]
    end

    subgraph Data Access Layer [Data Access Layer]
        Drizzle[Drizzle ORM 0.45.3]
        SchemaMod1[Schema: module-1.ts - Experiences & Companies]
        SchemaMod2[Schema: module-2.ts - Preparation & Q&A]
        SchemaMod3[Schema: module-3.ts - Placement Drives & Admin]
        SchemaAuth[Schema: auth.ts - Users & Sessions]
    end

    subgraph Persistence Layer [Persistence Layer]
        PG[(PostgreSQL 16 Database - Neon / Local)]
        VercelBlob[Vercel Blob Storage - CVs & Proof Documents]
    end

    UI --> RSC
    Forms --> SA
    Search --> UI
    RSC --> Drizzle
    SA --> Zod
    Zod --> Auth
    Auth --> Drizzle
    Drizzle --> SchemaMod1
    Drizzle --> SchemaMod2
    Drizzle --> SchemaMod3
    Drizzle --> SchemaAuth
    SchemaMod1 --> PG
    SchemaMod2 --> PG
    SchemaMod3 --> PG
    SchemaAuth --> PG
    SA -.-> VercelBlob
```

### Decoupled 3-Module Product Architecture

To enable multiple developers to build and test features simultaneously without blocking one another or encountering Git merge conflicts, the codebase is architecturally segregated into three independent product modules:

```mermaid
graph LR
    subgraph Core Platform [Centrally Owned Platform Core]
        AuthCore[Better Auth & Session Guard]
        DrizzleCore[Drizzle DB Connection & Schema Root]
        SharedUI[Editorial Design System & Navigation]
    end

    subgraph Module 1 [Module 1: Experience Capture & Intelligence]
        M1Routes[/experiences, /companies]
        M1Schema[schema/module-1.ts]
        M1Actions[actions/experiences.ts]
    end

    subgraph Module 2 [Module 2: Candidate Readiness & Community]
        M2Routes[/prepare, /questions, /alumni]
        M2Schema[schema/module-2.ts]
        M2Actions[actions/preparation.ts, actions/questions.ts]
    end

    subgraph Module 3 [Module 3: Placement Drives & Governance]
        M3Routes[/admin/drives, /admin/moderation, /stats]
        M3Schema[schema/module-3.ts]
        M3Actions[actions/placement.ts, actions/moderation.ts]
    end

    CorePlatform --> Module1
    CorePlatform --> Module2
    CorePlatform --> Module3
```

- **Module 1 (Experience Capture & Placement Intelligence)**: Owns interview submissions, company profiles, round records, and public experience browsing.
- **Module 2 (Candidate Readiness, Q&A & Alumni Connect)**: Owns the personal preparation checklist, interview questions repository, answer feedback, and alumni directory.
- **Module 3 (Placement Drives, Verification & Governance)**: Owns campus placement drive announcements, student drive applications, and the administrative moderation queue.
- **Shared Platform Layer**: Centrally manages database connectivity (`src/server/db/index.ts`), authentication hooks (`src/server/auth.ts`), navigation headers, and design tokens.

---

## 3. End-to-End Core Workflows

### A. Authentication & Role-Based Access Control
- **Open Registration**: Users register with their full name, email, and password. The system supports standard email addresses (`user@gmail.com`, `name@work.com`) without restricting signups to academic domains.
- **Role Assignment**: Candidates select either `student` or `alumni`. An automated Better Auth database hook validates and enforces that public registrations cannot claim administrative privileges.
- **Session Tracking**: Authenticated sessions are recorded in the PostgreSQL `session` table with secure, HTTP-only cookies and cryptographic token hashing.

### B. 10-Step Structured Experience Capture
The submission workflow in `src/components/experiences/experience-form.jsx` guides candidates through a 10-step wizard:
1. **Target & Role**: Select existing recruiting company (or create new entry) and specify target role.
2. **Candidate Context**: Specify interview year/batch, placement type (On-Campus, Off-Campus, Internship).
3. **Online Assessment (OA)**: Testing platform, question count, core topics, and difficulty.
4. **DSA & Coding**: Algorithmic problem types, data structures tested, and optimization hurdles.
5. **CS Fundamentals**: Coverage of Operating Systems, DBMS, Computer Networks, and OOP concepts.
6. **Technical Rounds**: In-depth records of each round (interviewer level, duration, and focus areas).
7. **Experience Narrative**: Detailed storytelling explaining what went well and where traps occurred.
8. **Preparation & Advice**: Specific resources, books, and problem sets recommended by the author.
9. **Privacy & Anonymity**: Toggle to publish as "Anonymous" to protect candidate identity from public display.
10. **Review & Atomic Submit**: Previews the complete submission and commits the experience, company reference, and all round records in a single database transaction (`saveFullExperienceAction`).

### C. Experience Repository & Multi-Faceted Browsing
- **Real-Time Client Filtering**: Implemented in `src/components/experiences/experiences-browser.jsx`.
- **Outcome Filter**: Dedicated pill buttons (`Offer`, `Rejected`, `All`).
- **Difficulty Filter**: Dedicated pill buttons (`Easy`, `Medium`, `Hard`, `All`).
- **Free-Text Search**: Live substring matching across company name, role title, and summary text.

### D. Company Intelligence Dossiers
- Visiting `/companies/[id]` aggregates verified historical submissions for that organization.
- Displays computed difficulty metrics, round progression sequences, common interview question slots, and links to all detailed student experiences.

### E. Candidate Preparation Checklist & Readiness Tracking
- Implemented in `src/components/profile/preparation-checklist.jsx` and `src/server/actions/preparation.ts`.
- **Task Lifecycle**: Students create personal preparation tasks categorized by subject (DSA, Core CS, System Design, HR).
- **Completion Tracking**: Toggling a task updates `completedAt` to the current timestamp or resets it to `null`.
- **User-Scoped Isolation**: All database operations strictly filter by `userId = currentUser.id`. Unauthorized attempts to modify another student's checklist are rejected with an authorization error.

### F. Campus Placement Drives & Administrative Governance
- **Drive Announcements (`/admin/drives`)**: Placement cell administrators publish active campus recruitment drives, eligible branches, package/stipend figures, and application deadlines.
- **Moderation Queue (`/admin/moderation`)**: Provides administrators with an audit interface to review reported submissions, inspect flagged content, and approve or unpublish entries to keep the platform free of abusive or inaccurate information.

---

## 4. Database Design & Relational Data Integrity

### Entity-Relationship Diagram

```mermaid
erDiagram
    user ||--o{ session : "maintains"
    user ||--o{ account : "authenticates"
    user ||--o| profiles : "has"
    user ||--o{ experiences : "authors"
    user ||--o{ preparation_items : "tracks"
    user ||--o{ drive_applications : "submits"
    
    companies ||--o{ experiences : "associated with"
    companies ||--o{ placement_drives : "hosts"
    companies ||--o{ preparation_items : "referenced by"
    
    experiences ||--o{ interview_rounds : "contains"
    interview_rounds ||--o{ experience_questions : "records"
    
    placement_drives ||--o{ drive_roles : "specifies"
    placement_drives ||--o{ drive_applications : "receives"
```

### Key Data Architecture Decisions

1. **Foreign Key Constraints with Cascade Rules**:
   - `profiles`, `session`, `account`, and `preparation_items` enforce `onDelete: "cascade"` linked to `user.id`. When a user account is removed, all dependent private records are automatically cleaned up.
2. **Schema Separation by Domain**:
   - Instead of maintaining an error-prone monolithic schema file, tables are cleanly divided across `src/server/db/schema/auth.ts`, `module-1.ts`, `module-2.ts`, and `module-3.ts`, imported and exported centrally by `src/server/db/schema/index.ts`.
3. **Atomic Multi-Table Ingestion**:
   - Adding an interview experience dynamically checks for the company's existence, auto-creates it if missing, writes the main experience record, and inserts round-by-round records within a single `db.transaction()` block.
4. **Parameterized SQL Safety**:
   - All queries use Drizzle ORM's type-safe query builder, eliminating SQL injection vulnerabilities.

---

## 5. Security Engineering & Data Protection Matrix

| Security Dimension | Threat Addressed | Production Implementation |
|---|---|---|
| **Anonymity Protection** | Retaliation or privacy concerns when sharing interview setbacks. | When `isAnonymous: true`, the public feed displays the author as `"Anonymous"` while maintaining internal audit references. |
| **Input Validation** | Malformed payloads, oversized text, and prototype pollution. | Strict Zod validation schemas across all Server Actions (`experienceSchema`, `createPreparationItemSchema`, etc.). |
| **CSRF & Origin Defense** | Cross-site request forgery and unauthorized API invocations. | Better Auth validates trusted origins (`localhost`, Vercel production, and project preview URLs) and enforces strict HTTP-only session cookies. |
| **Role Escalation Defense** | Malicious users attempting to assign themselves `admin` role. | Server-side registration hook (`src/server/auth.ts`) intercepts signup requests and forces roles to either `student` or `alumni`. |
| **Checklist Ownership Isolation** | Unauthorized alteration of another candidate's study milestones. | `togglePreparationItemAction` and `deletePreparationItemAction` explicitly assert `existing.userId === currentUser.id`. |
| **SQL Injection Immunity** | Malicious SQL syntax in search bars or form inputs. | Drizzle ORM strictly compiles queries into parameterized SQL statements with typed values. |

---

## 6. Testing, Quality Assurance & CI Pipelines

### Automated Verification Status

The project includes **24 automated test suites** executed via [Vitest](https://vitest.dev/):

```
 ✓ tests/database.test.ts (2 tests)
 ✓ tests/experiences.test.ts (4 tests)
 ✓ tests/experience-form.test.ts (3 tests)
 ✓ tests/readiness.test.ts (2 tests)
 ✓ tests/placement.test.ts (3 tests)
 ✓ tests/anonymous-cv.test.ts (2 tests)
 ✓ tests/moderation.test.ts (3 tests)
 ... [24 test suites passing]
```

### GitHub Actions CI Pipeline

Continuous integration is automated via [.github/workflows/ci.yml](.github/workflows/ci.yml) on every push and pull request to `main`:

```mermaid
flowchart LR
    A[Git Push / PR] --> B[Spin up Postgres 16 Container]
    B --> C[npm ci]
    C --> D[npm run db:migrate]
    D --> E[npm run db:seed]
    E --> F[npm run lint]
    F --> G[npx tsc --noEmit]
    G --> H[npm run test - Vitest]
    H --> I[npm run build - Next.js Production Build]
```

1. **Database Containerization**: Spins up an official `postgres:16` service container with automated health checks.
2. **Schema Migration & Seeding**: Runs `drizzle-kit migrate` and executes `scripts/seed.ts` to verify database initialization.
3. **Code Quality**: Enforces ESLint and TypeScript compilation (`npx tsc --noEmit`).
4. **Integration Testing**: Runs all 24 Vitest suites against the live database.
5. **Production Build**: Compiles Next.js pages and generates optimized server routes.

---

## 7. Technology Stack & Architectural Rationale

| Technology | Version | Architectural Role | Why Selected |
|---|---|---|---|
| **Next.js** | `16.3.5` | Full-stack Web Framework | App Router enables fast server-side rendering for SEO and zero-waterfall database queries. |
| **React** | `19.2.8` | UI Library | Seamless component state, server actions integration, and concurrent rendering. |
| **PostgreSQL** | `16` | Relational Database | Strict relational constraints, ACID transactions, and foreign key cascades. |
| **Drizzle ORM** | `0.45.3` | Object Relational Mapping | Lightweight, zero-overhead TypeScript query builder with type-safe schema definitions. |
| **Better Auth** | `1.7.7` | Authentication Engine | Native Drizzle adapter, secure session cookie handling, and customizable database lifecycle hooks. |
| **Tailwind CSS** | `^4.0` | Styling Engine | Utility-first CSS with modern PostCSS v4 compilation and dark/light mode support. |
| **Vitest** | `5.0.3` | Test Runner | Fast, native ESM test runner with TypeScript support out of the box. |
| **Lucide React** | `^1.47.0` | Iconography | Lightweight, accessible, and comprehensive iconography set. |

---

## 8. Local Development Setup

### Prerequisites
- **Node.js**: `v20.x` LTS or later
- **npm**: `v10.x` or later
- **PostgreSQL**: Local instance running on port 5432 or a free [Neon](https://neon.tech/) cloud database

### Step-by-Step Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Jyatin/beyond-the-rumour-mill.git
cd beyond-the-rumour-mill
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Database Connection (Neon or Local Postgres)
DATABASE_URL="postgresql://user:password@localhost:5432/beyond_the_rumour_mill"

# Better Auth Secret (Generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET="your_development_secret_key_at_least_32_characters"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Cloud File Storage & Email (Fallback active if omitted)
# BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
# RESEND_API_KEY="re_..."
```

#### 4. Run Migrations & Seed Sample Data
```bash
# Push database schema to PostgreSQL
npm run db:push

# Seed verified companies and sample interview experiences
npm run db:seed
```

#### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 6. Quality & Verification Commands
```bash
# Run all 24 automated Vitest test suites
npm run test

# Verify TypeScript types across the codebase
npx tsc --noEmit

# Run ESLint code checks
npm run lint

# Verify production Next.js compilation
npm run build
```

---

## 9. Core Server Actions & API Reference

| Action / Route | Target File | Method / Context | Role / Auth | Purpose & Validation Rules |
|---|---|---|---|---|
| `authClient.signUp.email` | `src/server/auth.ts` | POST / Better Auth | Public | Registers student/alumni with email & password; rejects admin role requests. |
| `authClient.signIn.email` | `src/server/auth.ts` | POST / Better Auth | Public | Verifies credentials, hashes password, sets session cookie. |
| `saveFullExperienceAction`| `actions/experiences.ts` | Server Action | Authenticated | Atomically validates 10-step submission; writes experience & round records. |
| `submitExperienceAction`  | `actions/experiences.ts` | Server Action | Author Only | Submits draft experience for review; writes audit log entry. |
| `createPreparationItemAction` | `actions/preparation.ts`| Server Action | Authenticated | Creates candidate study task; validates category and non-empty title. |
| `togglePreparationItemAction` | `actions/preparation.ts`| Server Action | Task Owner Only | Toggles `completedAt` timestamp; verifies task ownership. |
| `deletePreparationItemAction` | `actions/preparation.ts`| Server Action | Task Owner Only | Deletes task from database; strictly rejects cross-user deletions. |
| `createPlacementDriveAction` | `actions/placement.ts`   | Server Action | Admin Only | Announces campus recruitment drive with roles, deadlines, and eligibility. |
| `GET /api/health`          | `app/api/health/route.ts` | GET Route Handler| Public | Database connection probe executing `SELECT 1` on companies table. |
| `GET /api/auth/[...all]`   | `app/api/auth/route.ts`   | Dynamic Route    | Better Auth | Mounts Better Auth session and credential exchange endpoints. |

---

## 10. Team, Roles & Collaboration Architecture

### Project Leadership & Module Ownership

Beyond the Rumour Mill is organized into three distinct product modules coordinated under a centralized platform architecture:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PLATFORM ARCHITECT & PROJECT LEAD                               │
│                                  Jyatin Singh                                          │
│   • Core Runtime Architecture       • Shared PostgreSQL Database & Drizzle Config      │
│   • Better Auth Authentication      • CI/CD Pipeline & Vercel Deployment               │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐
│       TEAM MODULE 1          │ │       TEAM MODULE 2          │ │       TEAM MODULE 3          │
│   Experience Intelligence    │ │   Candidate Preparation Hub  │ │   Drives & Governance        │
│ • Submission Wizard (10-Step)│ │ • Personal Prep Checklist    │ │ • Campus Placement Drives    │
│ • Company Dossiers           │ │ • Interview Q&A Repository   │ │ • Drive Applications         │
│ • Round & Question Schema    │ │ • Alumni Mentorship Directory│ │ • Moderation Queue           │
│ Branch: feat/module-1-exp    │ │ Branch: feat/module-2-prep   │ │ Branch: feat/module-3-ops    │
└──────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘
```

### Team Members & Contributions

| Member | Primary Role | Domain & Assigned Modules | GitHub Profile |
|---|---|---|---|
| **Jyatin Singh** | Project Lead & Platform Architect | Full-Stack Foundation, Database Schema Root, Better Auth Engine, CI/CD Pipelines | [@Jyatin](https://github.com/Jyatin) |
| **Teammate 1** | Module 1 Lead | Experience Ingestion, 10-Step Wizard, Company Dossiers (`TEAM_MODULE_1`) | Contributor |
| **Teammate 2** | Module 2 Lead | Candidate Readiness Checklist, Questions Discussion Board, Alumni Connect (`TEAM_MODULE_2`) | Contributor |
| **Teammate 3** | Module 3 Lead | Campus Placement Drives, Application Tracking, Administrative Moderation (`TEAM_MODULE_3`) | Contributor |

### Zero-Merge-Conflict Development Philosophy
To ensure all teammates can work concurrently without blocking each other:
1. **Isolated Schema Files**: Each module owns its dedicated schema file (`module-1.ts`, `module-2.ts`, `module-3.ts`). Modifying another module's schema is prohibited.
2. **Dedicated Feature Branches**: Work is performed on dedicated branches spawned from the same verified base commit:
   - Module 1: `feat/module-1-experiences`
   - Module 2: `feat/module-2-qa-prep`
   - Module 3: `feat/module-3-placement-ops`
3. **Central Integration**: The Project Lead merges module branches into `feat/full-stack-foundation` and runs the full test suite before promoting to `main`. Detailed instructions are maintained in [TEAM_HANDOFF_GUIDE.md](./TEAM_HANDOFF_GUIDE.md).

---

## 11. Engineering Trade-offs & Deep-Dives

### 1. Next.js Server Actions vs. Separate Express Backend
- **Decision:** Use Next.js Server Actions and Route Handlers instead of maintaining an independent Express.js or FastAPI server.
- **Why:** Keeps the entire full-stack application within a unified TypeScript codebase with shared type contracts. Eliminates REST API boilerplate, CORS misconfigurations, and multiple deployment services while benefiting from automatic RPC serialization and cache revalidation (`revalidatePath`).
- **Trade-off:** Long-running background jobs must be carefully designed or offloaded since server actions follow serverless execution lifecycles.

### 2. Normalized PostgreSQL vs. Document Database (MongoDB)
- **Decision:** Choose PostgreSQL with Drizzle ORM over a NoSQL document database.
- **Why:** Placement data is inherently relational. Companies have multiple recruitment drives, drives have multiple roles, candidates submit multi-round experiences, and rounds contain specific questions. Relational foreign keys and cascading deletes ensure clean data integrity that document databases cannot easily guarantee.
- **Trade-off:** Schema migrations require careful planning and upfront structure compared to schemaless document stores.

### 3. Dual-Mode Anonymity vs. Public-Only Profiles
- **Decision:** Support optional anonymous publishing while preserving internal author references.
- **Why:** Students who face rejections or difficult interview experiences are often hesitant to share authentic details if their names are publicly visible to peers or recruiters. Anonymity dramatically increases submission candor while internal author auditing prevents platform abuse.
- **Trade-off:** Requires conditional rendering logic across all UI components and database queries to ensure the author's identity is never inadvertently leaked to client-side payloads.

---

## 12. Codebase Exploration Guide

To inspect the primary implementation files, follow this roadmap:

1. **Authentication & Security Engine:**
   - [src/server/auth.ts](src/server/auth.ts) — Better Auth setup, role validation hooks, and trusted origin security.
   - [src/server/auth-helpers.ts](src/server/auth-helpers.ts) — Server-side session verification helpers (`requireUser`, `getCurrentUser`).
   - [src/components/auth/signup-form.jsx](src/components/auth/signup-form.jsx) — User registration UI with role selection.
2. **Experience Ingestion & Intelligence (Module 1):**
   - [src/components/experiences/experience-form.jsx](src/components/experiences/experience-form.jsx) — 10-step interview submission wizard.
   - [src/server/actions/experiences.ts](src/server/actions/experiences.ts) — Atomic experience and round persistence actions.
   - [src/server/db/schema/module-1.ts](src/server/db/schema/module-1.ts) — Experiences, companies, and rounds database schema.
3. **Candidate Readiness & Community (Module 2):**
   - [src/components/profile/preparation-checklist.jsx](src/components/profile/preparation-checklist.jsx) — Interactive study checklist client.
   - [src/server/actions/preparation.ts](src/server/actions/preparation.ts) — Task creation, toggle, and deletion server actions.
   - [src/server/db/schema/module-2.ts](src/server/db/schema/module-2.ts) — Preparation items and Q&A schema.
4. **Placement Drives & Governance (Module 3):**
   - [src/app/admin/drives/page.jsx](src/app/admin/drives/page.jsx) — Campus recruitment drive management interface.
   - [src/app/admin/moderation/page.jsx](src/app/admin/moderation/page.jsx) — Content moderation and review queue.
   - [src/server/db/schema/module-3.ts](src/server/db/schema/module-3.ts) — Placement drives, applications, and audit schema.
5. **Database & Infrastructure Core:**
   - [src/server/db/schema/index.ts](src/server/db/schema/index.ts) — Centralized schema aggregation point.
   - [src/server/db/index.ts](src/server/db/index.ts) — Postgres connection pool and Drizzle client.
   - [.github/workflows/ci.yml](.github/workflows/ci.yml) — Automated test and build verification workflow.

---

## Author & Team Acknowledgements

**Project Lead & Platform Architect:**  
**Jyatin Singh**
- **GitHub:** [@Jyatin](https://github.com/Jyatin)
- **LinkedIn:** [Jyatin Singh](https://www.linkedin.com/in/jyatinsingh/)
- **Repository:** [beyond-the-rumour-mill](https://github.com/Jyatin/beyond-the-rumour-mill)
- **Team Repository:** [beyond-the-rumour-mill-team](https://github.com/Jyatin/beyond-the-rumour-mill-team)

*Developed as an engineering project to bring institutional transparency, student empowerment, and authentic career intelligence to on-campus placement ecosystems.*

