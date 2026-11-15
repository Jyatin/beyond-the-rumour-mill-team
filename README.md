# Beyond the Rumour Mill

> **A campus placement intelligence platform built around verified interview experiences, evidence-backed hiring insights, candidate preparation, and alumni knowledge-sharing.**

[![Repository](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/Jyatin/beyond-the-rumour-mill-team)
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Server%20Logic-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql)](https://www.postgresql.org/)

**Live preview:** [Beyond the Rumour Mill](https://beyond-the-rumour-mill-main-mws322y1b-jyatin1.vercel.app)

---

## The problem

Campus placement information is often fragmented across messaging groups, spreadsheets, anonymous posts, and word of mouth. Candidates struggle to distinguish current, first-hand interview information from outdated or unverified claims.

**Beyond the Rumour Mill** aims to turn that scattered information into a structured, searchable, and accountable knowledge base. It connects candidate experiences, company-level hiring patterns, preparation tools, alumni guidance, and placement operations in one platform.

## What the platform offers

### 1. Interview experience repository

- Submit detailed placement and internship experiences.
- Organize reports by company, role, year, outcome, and difficulty.
- Browse interview rounds, topics, and reported questions.
- Support anonymous submissions.
- Use AI-assisted extraction to structure useful details from candidate narratives.
- Normalize recurring questions and topics for company-level insights.

### 2. Company and hiring intelligence

- Explore company profiles and role information.
- Review aggregated interview topics and candidate-reported patterns.
- Inspect interview round breakdowns and company dossiers.
- Discover campus placement drives, role details, and eligibility criteria.

### 3. Candidate preparation

- Follow a structured preparation roadmap.
- Track preparation checklist items.
- Review company-oriented preparation guidance.
- Use readiness scoring to understand preparation progress.
- Access mock interview and offer-negotiation resources.

### 4. Community Q&A and alumni mentorship

- Ask company- and role-specific placement questions.
- Browse question threads and structured answers.
- Distinguish first-hand interview accounts from general advice.
- Discover alumni and request mentorship.
- Support mock-interview slot discovery and booking.

### 5. Placement administration and trust workflows

- Create and manage campus placement drives.
- Define roles and eligibility requirements.
- Review candidate applications.
- Process verification evidence and moderation workflows.
- Maintain audit-oriented administrative operations.
- Publish platform guidelines, privacy, security, and transparency information.

## Product areas

| Area | Main routes | Purpose |
|---|---|---|
| Interview experiences | `/experiences` | Browse, submit, and review candidate reports |
| Company intelligence | `/companies` | Explore employers, hiring patterns, and dossiers |
| Preparation hub | `/prepare` | Roadmaps, checklists, and readiness support |
| Community Q&A | `/questions` | Ask and answer placement questions |
| Alumni directory | `/alumni` | Discover alumni and potential mentors |
| Mentorship | `/connect` | Explore mentorship and mock-interview connections |
| Candidate profile | `/profile` | Manage candidate information and preparation |
| Placement operations | `/admin/drives` | Manage campus drives and applications |
| Moderation | `/admin/moderation` | Review reported content and moderation cases |
| Platform metrics | `/stats` | View platform-level placement intelligence metrics |
| Policies and guidance | `/about`, `/guidelines`, `/privacy`, `/security`, `/terms` | Understand the platform and its policies |

## Architecture and modules

The codebase is organized into three product modules so contributors can work in parallel with clear ownership boundaries.

| Module | Focus | Key capabilities |
|---|---|---|
| **Module 1 — Experience Capture & Consensus Intelligence** | Candidate interview data | Experience submission, round normalization, AI extraction, topic aggregation, company intelligence |
| **Module 2 — Candidate Readiness, Q&A & Alumni Connect** | Preparation and community | Preparation plans, readiness scoring, Q&A threads, alumni discovery, mentorship, mock interviews |
| **Module 3 — Placement, Verification & Governance** | Placement operations and trust | Placement drives, applications, evidence verification, CV workflows, moderation, audit logs, policy pages |

### Repository structure

```text
.
├── contracts/                  # Shared contract helpers and notification utilities
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   ├── components/             # Feature and UI components
│   └── server/
│       ├── actions/            # Server-side mutations and workflows
│       ├── ai/                 # AI provider, extraction, prompts and validation
│       ├── consensus/          # Company-level aggregation and statistics
│       ├── db/schema/          # Module-specific Drizzle schemas
│       ├── normalization/      # Interview and question normalization
│       ├── qa/                 # Q&A claims, moderation and ranking
│       ├── queries/             # Server-side data access
│       ├── readiness/          # Candidate readiness calculations
│       ├── reputation/         # Reputation signals
│       ├── storage/             # File storage abstraction
│       └── validators/          # Input validation
├── tests/                      # Feature and integration-oriented tests
├── .env.example                # Environment variable template
└── TEAM_HANDOFF_GUIDE.md       # Contributor ownership and branch workflow
```

## Technology

The current application code uses:

- **Web framework:** Next.js App Router
- **UI:** React, JSX, and reusable component modules
- **Language:** JavaScript and TypeScript
- **Database layer:** Drizzle ORM with PostgreSQL schemas
- **Authentication:** Better Auth integration
- **AI:** Provider abstraction for structured extraction and interview-content processing
- **Testing:** Vitest-based unit and workflow tests

## Environment configuration

Start by reviewing [`.env.example`](.env.example). It documents the current environment variables and uses placeholders only.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Authentication signing secret |
| `BETTER_AUTH_URL` | Authentication application URL |
| `NEXT_PUBLIC_APP_URL` | Public application URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `AI_API_KEY` | AI provider API key, when using the standard provider |
| `AI_MODEL` | Optional model override |
| `RESEND_API_KEY` | Optional email delivery configuration |
| `EMAIL_FROM` | Sender address for outgoing email |

Never commit real credentials, production database URLs, private CVs, or verification documents.

## Development and setup

This repository is organized as a feature-integration workspace. The shared application bootstrap and package configuration are maintained with the platform foundation; they are not included in this repository snapshot.

To run the complete application:

1. Use the project’s designated full application workspace and its shared package manifest.
2. Configure the required environment variables using `.env.example` as a reference.
3. Connect a PostgreSQL database and apply the project’s Drizzle schema/migrations.
4. Start the application using the scripts defined by that workspace.
5. Run the relevant tests and type checks before submitting changes.

The team handoff guide documents the expected base commit, module ownership, and branch workflow. Do not invent or add a separate package manifest in this feature repository without coordinating with the platform owner.

## Quality checks

Run these from the configured full application workspace:

```bash
npx tsc --noEmit
npx vitest run
```

For focused checks, run the relevant test files under `tests/`, such as:

- `tests/experiences.test.ts`
- `tests/consensus.test.ts`
- `tests/qa-system.test.ts`
- `tests/mentorship.test.ts`
- `tests/readiness.test.ts`
- `tests/verification.test.ts`
- `tests/placement.test.ts`

A successful merge does not, by itself, mean that every test or production workflow has been executed. Validate the integrated application before deployment.

## Contributing

Contributions are welcome. Before changing code:

1. Read [`TEAM_HANDOFF_GUIDE.md`](TEAM_HANDOFF_GUIDE.md).
2. Confirm your assigned module and file ownership.
3. Branch from the agreed integration base and keep changes within your module.
4. Avoid modifying shared schema, authentication, database bootstrap, layout, package, and lock files without coordinator approval.
5. Add or update tests for the behavior you change.
6. Run the relevant type checks and tests.
7. Open a pull request with a clear summary, testing notes, and any migration or environment impact.

### Database ownership

Module-specific schema changes belong in their respective files:

- Module 1: `src/server/db/schema/module-1.ts`
- Module 2: `src/server/db/schema/module-2.ts`
- Module 3: `src/server/db/schema/module-3.ts`

Follow the handoff guide before touching shared schema definitions.

## Trust, privacy, and responsible use

- Interview reports are candidate-reported information; verification status and source context should remain visible.
- AI-assisted extraction is intended to structure submitted information, not independently certify that a claim is true.
- Do not publish another person's private information or confidential interview material.
- Keep uploaded CVs and verification evidence access-controlled.
- Report inaccurate, outdated, or inappropriate content through the platform's moderation process.

## Project status

The repository contains the three feature areas, server-side workflows, database schema modules, and corresponding tests. Integration, environment configuration, test execution, and deployment should be verified in the full application workspace before treating a release as production-ready.

---

**Beyond the Rumour Mill** — less hearsay, more first-hand experience, better-informed candidates.
