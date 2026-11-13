# TEAM MODULE 1: Experience Capture, Consensus Intelligence & Company Insights

## Teammate Assignment
- **Teammate Role:** Teammate 1 (Lead Backend / Full-Stack Engineer)
- **Assigned Git Branch:** `feat/module-1-experiences`
- **Base Branch & Commit:** `feat/full-stack-foundation` (`f505c60865003cb9d15222f07dbb6317aa502d08`)
- **Integration Target:** `feat/full-stack-foundation`

---

## 1. Scope & Capabilities Included
This module contains the primary content ingestion and consensus engine:
* **Experience Submission Wizard:** 10-step multi-round experience contribution wizard (`experience-form.jsx`).
* **Experience Browsing:** Filters, card grids, individual dossier breakdown (`/experiences`, `/experiences/[id]`).
* **Company Intelligence:** Company profiles, round breakdowns, recurring interview topics (`/companies`, `/companies/[id]`).
* **Interview Rounds & Normalized Questions:** Hierarchical round persistence, canonical question deduplication (`src/server/actions/rounds.ts`).
* **AI Extraction & Normalization:** LLM parsers for extracting topics, questions, and difficulties (`src/server/ai/*`, `src/server/normalization/*`).
* **Consensus Engine:** Statistical weighting of interview reports to establish consensus cutoffs (`src/server/consensus/*`).

---

## 2. Database Schema Ownership
You exclusively own:
* **`src/server/db/schema/module-1.ts`**

Contained Tables & Enums:
- `companies`
- `role_titles`
- `experiences`
- `interview_questions`
- `round_types`
- `interview_rounds`
- `topics`
- `round_topics`
- `experience_questions`
- `extraction_runs`
- `topic_aliases`
- `consensus_snapshots`
- `consensus_items`
- Enums: `experienceStatusEnum`, `verificationStatusEnum`, `extractionStatusEnum`

> **STRICT RULE:** Do NOT modify `src/server/db/schema.ts`, `src/server/db/schema/index.ts`, `src/server/db/schema/auth.ts`, or the other modules' schema files. All schema additions must be in `module-1.ts`.

---

## 3. Allowed Files to Modify
- `src/server/db/schema/module-1.ts`
- `src/app/experiences/**`
- `src/app/companies/**`
- `src/components/experiences/experience-form.jsx`
- `src/components/experiences/experiences-browser.jsx`
- `src/components/companies/companies-hero.jsx`
- `src/components/companies/company-consensus-banner.jsx`
- `src/components/companies/company-dossier-hero.jsx`
- `src/components/companies/interview-intelligence.jsx`
- `src/server/actions/experiences.ts`
- `src/server/actions/rounds.ts`
- `src/server/actions/extraction.ts`
- `src/server/actions/consensus.ts`
- `src/server/queries/experiences.ts`
- `src/server/queries/rounds.ts`
- `src/server/queries/companies.ts`
- `src/server/queries/interview-questions.ts`
- `src/server/queries/extraction.ts`
- `src/server/ai/**`
- `src/server/consensus/**`
- `src/server/normalization/**`
- Tests: `tests/experience-form.test.ts`, `tests/experiences.test.ts`, `tests/rounds.test.ts`, `tests/consensus.test.ts`, `tests/extraction.test.ts`

---

## 4. Files You Must NOT Modify (Owned by Others)
- `package.json`, `package-lock.json`
- `drizzle.config.ts`, `drizzle/**`
- `src/server/db/index.ts`, `src/server/db/schema.ts`, `src/server/db/schema/index.ts`, `src/server/db/schema/auth.ts`
- `src/server/auth.ts`, `src/server/auth-helpers.ts`, `src/lib/auth-client.ts`
- `src/components/ui/**`, `src/components/layout/**`, `src/components/marketing/**`
- Injected subcomponents on company pages: `active-drives-radar.jsx` (Mod 3), `drive-apply-button.jsx` (Mod 3), `generate-prep-plan-button.jsx` (Mod 2), `readiness-score-card.jsx` (Mod 2), `report-experience-dialog.jsx` (Mod 3).

---

## 5. Git Instructions (Create & Push Branch)

```bash
# 1. Checkout the agreed base branch
git checkout feat/full-stack-foundation
git pull origin feat/full-stack-foundation

# 2. Create your assigned feature branch
git checkout -b feat/module-1-experiences

# 3. Stage ONLY your assigned files
git add src/server/db/schema/module-1.ts
git add src/app/experiences src/app/companies
git add src/components/experiences/experience-form.jsx src/components/experiences/experiences-browser.jsx
git add src/components/companies/companies-hero.jsx src/components/companies/company-consensus-banner.jsx src/components/companies/company-dossier-hero.jsx src/components/companies/interview-intelligence.jsx
git add src/server/actions/experiences.ts src/server/actions/rounds.ts src/server/actions/extraction.ts src/server/actions/consensus.ts
git add src/server/queries/experiences.ts src/server/queries/rounds.ts src/server/queries/companies.ts src/server/queries/interview-questions.ts
git add tests/experience-form.test.ts tests/experiences.test.ts tests/rounds.test.ts tests/consensus.test.ts tests/extraction.test.ts

# 4. Commit and push
git commit -m "feat(module-1): implement experience capture and consensus intelligence"
git push -u origin feat/module-1-experiences
```

---

## 6. How to Run Validation Tests
```bash
# Type check (must have 0 errors)
npx tsc --noEmit

# Run unit tests
npx vitest run tests/experience-form.test.ts tests/experiences.test.ts tests/rounds.test.ts
```
