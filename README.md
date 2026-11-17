# Beyond the Rumour Mill

### Campus Placement & Interview Intelligence Platform

[![CI](https://github.com/Jyatin/beyond-the-rumour-mill/actions/workflows/ci.yml/badge.svg)](https://github.com/Jyatin/beyond-the-rumour-mill/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> Turning scattered placement experiences into structured, searchable, and actionable career intelligence.

**Live app:** [beyond-the-rumour-mill-main.vercel.app](https://beyond-the-rumour-mill-main.vercel.app)  
**Main repository:** [beyond-the-rumour-mill](https://github.com/Jyatin/beyond-the-rumour-mill) · **Team repository:** [beyond-the-rumour-mill-team](https://github.com/Jyatin/beyond-the-rumour-mill-team)

---

## Overview

Beyond the Rumour Mill helps students make better placement decisions using verified interview experiences shared by seniors and alumni. It organizes company-specific hiring rounds, interview questions, preparation resources, and candidate outcomes instead of relying on scattered WhatsApp messages and campus hearsay.

The platform is built as a full-stack application with a modular architecture that supports parallel team development.

## Application Preview

<table>
  <tr>
    <td align="center" width="50%">
      <img src="screenshots/editorial-hero.png" alt="Editorial homepage and placement overview" width="100%" />
      <sub><b>Editorial Homepage</b><br/>Platform introduction, placement context, and navigation.</sub>
    </td>
    <td align="center" width="50%">
      <img src="screenshots/company-dossier.jpg" alt="Company dossier and interview round details" width="100%" />
      <sub><b>Company Dossiers</b><br/>Interview rounds, difficulty ratings, and reported questions.</sub>
    </td>
  </tr>
</table>

## Core Features

- **Interview experience archive:** Structured, multi-round submissions with questions, topics, outcomes, and preparation advice.
- **Company intelligence:** Aggregated hiring patterns, round sequences, difficulty trends, and candidate experiences.
- **Candidate preparation:** Personal checklists and progress tracking for placement readiness.
- **Alumni connect:** Discover experienced seniors and request focused mentorship.
- **Placement operations:** Drive announcements, applications, and moderation workflows.
- **Privacy and access control:** Role-aware access, optional anonymous publishing, and server-side validation.

## Architecture

The application uses a modular monolith built with the Next.js App Router. React Server Components handle data-driven pages, Server Actions manage mutations, Better Auth handles sessions, and Drizzle ORM provides typed access to PostgreSQL.

```mermaid
flowchart TD
    A[Next.js App Router] --> B[Server Components & UI]
    A --> C[Server Actions]
    C --> D[Validation & Better Auth]
    B --> E[Drizzle ORM]
    D --> E
    E --> F[(PostgreSQL)]
    C --> G[Vercel Blob Storage]
```

### Team Modules

| Module | Ownership |
|---|---|
| **Module 1 — Experience Intelligence** | Interview submissions, company dossiers, rounds, and questions |
| **Module 2 — Candidate Readiness** | Preparation checklist, Q&A, and alumni connections |
| **Module 3 — Drives & Governance** | Placement drives, applications, and moderation |
| **Platform Core** | Shared architecture, authentication, database, CI/CD, and deployment |

Each module has dedicated schema and feature boundaries to reduce cross-team conflicts. Integration is coordinated through the shared development branch and documented handoff process.

## Technology Stack

| Area | Tools |
|---|---|
| Frontend & runtime | Next.js 16, React 19, TypeScript |
| Styling & UI | Tailwind CSS v4, Radix UI, Lucide |
| Database | PostgreSQL 16, Drizzle ORM |
| Authentication | Better Auth |
| Validation | Zod |
| Testing | Vitest |
| Deployment & CI | Vercel, GitHub Actions |

## Local Development

**Requirements:** Node.js 20+, npm 10+, and PostgreSQL 16 (local or [Neon](https://neon.tech/)).

1. Clone and install:

   ```bash
   git clone https://github.com/Jyatin/beyond-the-rumour-mill-team.git
   cd beyond-the-rumour-mill-team
   npm install
   ```

2. Create a `.env` file:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/beyond_the_rumour_mill"
   BETTER_AUTH_SECRET="your_secret_at_least_32_characters"
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. Prepare the database and start the app:

   ```bash
   npm run db:push
   npm run db:seed
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000).

### Quality Checks

```bash
npm run test
npm run lint
npx tsc --noEmit
npm run build
```

The project currently reports 24 passing Vitest test suites. The GitHub Actions pipeline runs database setup, linting, type checks, tests, and a production build.

## Project Status

The full-stack foundation includes authentication, PostgreSQL persistence, modular schema boundaries, core placement workflows, and automated CI checks. Further work is focused on completing and integrating the three product modules.

## Project Resources

- [Team Handoff Guide](./TEAM_HANDOFF_GUIDE.md)
- [File Ownership Matrix](./TEAM_FILE_OWNERSHIP_MATRIX.md)
- [Integration Guide](./TEAM_INTEGRATION_GUIDE.md)
- [Main source repository](https://github.com/Jyatin/beyond-the-rumour-mill)

## Team

**Project Lead & Platform Architect:** [Jyatin Singh](https://github.com/Jyatin) · [LinkedIn](https://www.linkedin.com/in/jyatinsingh/)

Built to make campus placement knowledge more transparent, useful, and accessible to every student.
