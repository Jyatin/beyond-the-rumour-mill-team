# Beyond the Rumour Mill

### Campus Placement & Interview Intelligence Platform

[![CI Pipeline](https://github.com/Jyatin/beyond-the-rumour-mill/actions/workflows/ci.yml/badge.svg)](https://github.com/Jyatin/beyond-the-rumour-mill/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-brightgreen?logo=node.js)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> Turning scattered placement experiences into structured, searchable, and actionable career intelligence.

**Live application:** [beyond-the-rumour-mill-main.vercel.app](https://beyond-the-rumour-mill-main.vercel.app)  
**Main repository:** [beyond-the-rumour-mill](https://github.com/Jyatin/beyond-the-rumour-mill)  
**Team repository:** [beyond-the-rumour-mill-team](https://github.com/Jyatin/beyond-the-rumour-mill-team)

---

## 1. What is Beyond the Rumour Mill?

Placement preparation often depends on fragmented information: forwarded messages, informal conversations, outdated notes, and second-hand accounts of interview rounds. Important details about assessments, technical interviews, eligibility, and preparation strategies are easily lost between graduating batches.

**Beyond the Rumour Mill** is a full-stack campus placement intelligence platform designed to make that knowledge structured and reusable. Students can explore company-specific hiring experiences, understand interview-round patterns, practice with shared questions, track their preparation, and connect with seniors who have already navigated the process.

The goal is simple: replace uncertain campus hearsay with useful experiences, organized data, and peer-driven guidance.

## 2. Application Preview

<table>
  <tr>
    <td align="center" width="50%">
      <img src="screenshots/editorial-hero.png" alt="Editorial homepage and platform overview" width="100%" />
      <sub><b>Editorial Homepage</b><br/>An introduction to the platform, placement context, and key navigation.</sub>
    </td>
    <td align="center" width="50%">
      <img src="screenshots/company-dossier.jpg" alt="Company dossier and interview round details" width="100%" />
      <sub><b>Company Intelligence</b><br/>Company-specific interview rounds, difficulty trends, and reported questions.</sub>
    </td>
  </tr>
</table>

## 3. Core Features

- **Structured interview experiences:** A guided submission flow captures company, role, hiring type, assessment details, technical rounds, questions, outcomes, and preparation advice.
- **Company intelligence dossiers:** Consolidated experiences help candidates explore hiring patterns, round sequences, frequently reported topics, and difficulty trends.
- **Interview question repository:** Browse questions and discussion topics contributed through candidate experiences.
- **Personal preparation hub:** Create and track study tasks across areas such as DSA, core computer science, system design, and HR preparation.
- **Alumni connection:** Discover seniors by company and area of expertise, with flows for mentorship and focused career guidance.
- **Placement drive management:** Publish campus opportunities, eligibility details, deadlines, and application information.
- **Moderation and privacy:** Support review workflows and optional anonymous publishing while retaining internal author references for accountability.

## 4. System Architecture

The project follows a **modular monolith** approach using the Next.js App Router. Server Components support data-driven rendering, Server Actions handle application mutations, Better Auth manages authentication and sessions, and Drizzle ORM provides typed database access to PostgreSQL.

```mermaid
flowchart TD
    A[Next.js App Router] --> B[React Server Components]
    A --> C[Server Actions and Route Handlers]
    C --> D[Zod Validation]
    C --> E[Better Auth]
    B --> F[Drizzle ORM]
    D --> F
    E --> F
    F --> G[(PostgreSQL)]
    C -.-> H[Vercel Blob Storage]
```

### Modular Team Architecture

The codebase is divided into three product modules with clear ownership boundaries. This allows contributors to work in parallel while keeping shared infrastructure consistent.

| Module | Scope |
|---|---|
| **Module 1 — Experience Intelligence** | Interview submissions, company profiles, round records, and experience browsing |
| **Module 2 — Candidate Readiness & Community** | Preparation checklist, interview Q&A, and alumni connections |
| **Module 3 — Drives & Governance** | Placement drive announcements, applications, and moderation workflows |
| **Shared Platform Core** | Database connection, authentication, shared UI, CI/CD, and deployment |

Dedicated schema files, feature branches, and documented integration boundaries help reduce merge conflicts and make ownership clear.

## 5. Data, Security & Quality

The relational data model connects users, companies, interview experiences, rounds, questions, preparation tasks, and placement drives. PostgreSQL constraints and transactional writes help preserve consistency across related records.

Key engineering considerations include:

- **Authentication and roles:** Better Auth manages registration and sessions, with server-side role enforcement.
- **Input validation:** Zod schemas validate data before it reaches server-side operations.
- **Authorization:** User-scoped operations check record ownership before allowing updates or deletions.
- **Anonymous contributions:** Public presentation can hide contributor identity while retaining internal references for moderation.
- **Relational integrity:** Foreign keys, cascade rules, and database transactions protect related records.
- **Automated verification:** Vitest suites cover core application and data workflows; CI also runs linting, TypeScript checks, database setup, and a production build.

The project currently reports **24 passing Vitest test suites**.

## 6. Technology Stack

| Layer | Technologies |
|---|---|
| Application | Next.js 16, React 19, TypeScript |
| Styling & components | Tailwind CSS v4, Radix UI, Lucide React |
| Database & ORM | PostgreSQL 16, Drizzle ORM |
| Authentication | Better Auth |
| Validation | Zod |
| Testing | Vitest |
| Deployment & automation | Vercel, GitHub Actions |

## 7. Run Locally

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- PostgreSQL 16, locally or through a hosted provider such as [Neon](https://neon.tech/)

### Installation

Clone the team repository and install dependencies:

```bash
git clone https://github.com/Jyatin/beyond-the-rumour-mill-team.git
cd beyond-the-rumour-mill-team
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/beyond_the_rumour_mill"
BETTER_AUTH_SECRET="your_secret_at_least_32_characters"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Push the schema, seed sample data, and start the development server:

```bash
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verification Commands

```bash
npm run test
npm run lint
npx tsc --noEmit
npm run build
```

The GitHub Actions workflow automates database initialization, linting, type checking, tests, and the Next.js production build.

## 8. Project Status & Next Steps

The project has an established full-stack foundation, including authentication, PostgreSQL persistence, modular schema boundaries, core placement workflows, and automated quality checks.

Current development is centered on completing and integrating the product modules. Further milestones include expanding the experience archive, strengthening alumni and mentorship workflows, and continuing to improve placement-drive and moderation capabilities.

## 9. Team & Collaboration

**Project Lead & Platform Architect:** [Jyatin Singh](https://github.com/Jyatin)

The team works across three independently owned modules, coordinated through shared platform conventions and integration reviews. Contributor responsibilities, file boundaries, and handoff steps are documented in the resources below.

- [Team Handoff Guide](./TEAM_HANDOFF_GUIDE.md)
- [File Ownership Matrix](./TEAM_FILE_OWNERSHIP_MATRIX.md)
- [Integration Guide](./TEAM_INTEGRATION_GUIDE.md)
- [Main source repository](https://github.com/Jyatin/beyond-the-rumour-mill)
- [Team repository](https://github.com/Jyatin/beyond-the-rumour-mill-team)
- [Project Lead on LinkedIn](https://www.linkedin.com/in/jyatinsingh/)

---

*Built to make campus placement knowledge more transparent, useful, and accessible to every student.*
