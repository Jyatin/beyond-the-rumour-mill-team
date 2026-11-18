# Beyond the Rumour Mill

### Campus Placement & Interview Intelligence Platform


> Turning scattered placement experiences into structured, searchable, and actionable career intelligence.

**Live application:** [beyond-the-rumour-mill-main.vercel.app](https://beyond-the-rumour-mill-main-mws322y1b-jyatin1.vercel.app)  

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

## 4. System Architecture & Design

Beyond the Rumour Mill uses a **modular monolith** built on the Next.js App Router. The web application, server-side actions, queries, and domain modules live in one deployable codebase, but are organised around clear product boundaries. This keeps local development and deployment simple while allowing the team to build and integrate features independently.

### High-level system design

The diagram shows how a request moves through the application, where validation and authentication happen, and how the platform accesses persistent data and supporting services.

```mermaid
flowchart TB
    USER["Students & Alumni"] --> BROWSER["Browser · Next.js UI"]
    BROWSER --> APP["Next.js App Router"]
    APP --> RSC["React Server Components"]
    APP --> ENTRY["Server Actions & Route Handlers"]
    ENTRY --> AUTH["Better Auth · Sessions & Identity"]
    ENTRY --> VALIDATE["Zod · Input Validation"]
    RSC --> QUERIES["Server-side Queries"]
    AUTH --> DOMAIN["Domain & Feature Logic"]
    VALIDATE --> DOMAIN
    QUERIES --> DOMAIN
    DOMAIN --> MODULES["Experiences · Companies · Readiness · Alumni · Drives"]
    MODULES --> DATA["Drizzle ORM"]
    DATA --> DB[("PostgreSQL 16")]
    DOMAIN --> AI["AI · Normalization · Consensus"]
    DOMAIN --> FILES["Storage Service"]
    FILES --> BLOB["Vercel Blob"]
    CI["GitHub Actions · Tests · Lint · Typecheck · Build"] -. "quality gates" .-> APP
```

### How the system works

1. **Presentation:** Students and alumni interact with the Next.js interface. React Server Components render data-driven pages, while client components handle interactive UI.
2. **Request handling:** The App Router directs reads to server-side queries and writes to Server Actions or Route Handlers.
3. **Identity and validation:** Better Auth supplies session context. Zod validates incoming data before application operations proceed; server-side authorization checks protect user-scoped actions.
4. **Domain processing:** Feature logic handles interview experiences, company information, candidate readiness, alumni connections, placement drives, and moderation. Supporting AI, normalization, and consensus modules process relevant information.
5. **Persistence and files:** Drizzle ORM provides typed access to PostgreSQL, the primary store for relational application data. The storage layer integrates with Vercel Blob for file and evidence assets.
6. **Quality gates:** GitHub Actions runs database setup and automated checks so changes can be validated before integration.

### Team module boundaries

| Module | Main responsibility |
| --- | --- |
| **Module 1 — Experience Intelligence** | Interview submissions, company profiles, interview rounds, and experience discovery |
| **Module 2 — Candidate Readiness & Community** | Preparation workflows, interview questions, and alumni connections |
| **Module 3 — Drives & Governance** | Placement drives, applications, and moderation |
| **Shared Platform Core** | Authentication, database access, shared contracts and UI, storage, CI, and deployment |

### Key design decisions

- **Modular monolith over microservices:** Product modules share one application and deployment, avoiding premature network and operational complexity.
- **Clear server boundaries:** Database access, secrets, validation, and business rules stay on the server rather than being exposed to the browser.
- **PostgreSQL as the source of truth:** Relational records and constraints support consistency across users, companies, experiences, rounds, and preparation data.
- **Feature ownership:** Module-specific schema and component areas, shared contracts, and documented handoffs let contributors work in parallel with fewer integration conflicts.

> **Scope note:** This is a high-level view of the current codebase and its intended request boundaries. It is not a deployment-topology diagram, and it does not imply that every listed product workflow or integration is fully production-ready.

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

## 7. Codebase Structure

The repository uses a feature-oriented structure. The Next.js App Router defines the application pages and API endpoints, reusable interface elements live in dedicated component folders, and server-side business logic is separated from the UI.

```text
.
├── contracts/                 # Shared types and contracts across modules
│   ├── auth-helpers.ts
│   ├── auth-schema.ts
│   └── notifications.ts
├── screenshots/               # README and product preview images
├── src/
│   ├── app/                    # Next.js routes, layouts, and API endpoints
│   │   ├── admin/              # Drive administration and moderation
│   │   ├── alumni/             # Alumni discovery
│   │   ├── api/                # Route handlers (CV and evidence APIs)
│   │   ├── companies/          # Company directory and company detail pages
│   │   ├── experiences/        # Browse, submit, edit, and view experiences
│   │   ├── prepare/            # Candidate preparation workspace
│   │   ├── profile/            # User profile
│   │   ├── questions/          # Interview question repository
│   │   └── ...                 # About, stats, guidelines, privacy, and other pages
│   ├── components/             # Reusable UI grouped by product feature
│   │   ├── admin/
│   │   ├── companies/
│   │   ├── connect/
│   │   ├── experiences/
│   │   ├── prepare/
│   │   ├── profile/
│   │   └── questions/
│   └── server/                 # Server-only application and domain logic
│       ├── actions/            # Mutations and server actions
│       ├── ai/                 # AI extraction, evaluation, and provider logic
│       ├── consensus/          # Aggregation and consensus calculations
│       ├── db/schema/          # Database schema split by team module
│       ├── normalization/      # Normalize submitted experiences and questions
│       ├── qa/                 # Quality, moderation, and question-answer logic
│       ├── queries/            # Database read operations
│       ├── readiness/          # Candidate readiness calculations
│       ├── reputation/         # Trust and reputation signals
│       ├── storage/            # File and evidence storage
│       └── validators/         # Server-side input validation
├── tests/                      # Unit and integration tests
├── .env.example                # Environment variable template
├── TEAM_HANDOFF_GUIDE.md       # Team onboarding and handoff documentation
└── README.md
```

**How to navigate the code:**
- Start in `src/app/` to find a page or API route.
- Check `src/components/` for the UI associated with a feature.
- Use `src/server/actions/` for write operations and `src/server/queries/` for data retrieval.
- Review `src/server/db/schema/` for the PostgreSQL data model; module-specific schema files keep team ownership separated.
- Look in `src/server/ai/`, `consensus/`, and `normalization/` for the intelligence and data-processing pipeline.
- Run or extend tests in `tests/` when changing application behavior.

## 8. Run Locally

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- PostgreSQL 16

### Installation

Clone the team repository and install dependencies:

```bash
gh repo clone Jyatin/beyond-the-rumour-mill-team
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

Open `http://localhost:3000` in your browser.

### Verification Commands

```bash
npm run test
npm run lint
npx tsc --noEmit
npm run build
```

The GitHub Actions workflow automates database initialization, linting, type checking, tests, and the Next.js production build.

## 9. Project Status & Next Steps

The project has an established full-stack foundation, including authentication, PostgreSQL persistence, modular schema boundaries, core placement workflows, and automated quality checks.

Current development is centered on completing and integrating the product modules. Further milestones include expanding the experience archive, strengthening alumni and mentorship workflows, and continuing to improve placement-drive and moderation capabilities.

## 10. Team & Collaboration

**Project Lead & Platform Architect:** Jyatin Singh

The team works across three independently owned modules, coordinated through shared platform conventions and integration reviews. Contributor responsibilities, file boundaries, and handoff steps are documented in the resources below.

- `TEAM_HANDOFF_GUIDE.md` — contributor onboarding, responsibilities, and handoff process
- `contracts/` — shared TypeScript contracts for authentication helpers, auth schema, and notifications

---

*Built to make campus placement knowledge more transparent, useful, and accessible to every student.*
