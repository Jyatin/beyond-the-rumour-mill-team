# TEAM HANDOFF GUIDE: Beyond the Rumour Mill

Welcome team! The **Beyond the Rumour Mill** codebase has been organized into three decoupled product modules for parallel development. Follow this guide to initialize your branch, build your features, and push your changes with **zero merge conflicts**.

---

## 1. Golden Rules for Zero Merge Conflicts

1. **Spawn from the Base Commit:** Every teammate must create their feature branch from the exact base commit:  
   `f505c60865003cb9d15222f07dbb6317aa502d08` on branch `feat/full-stack-foundation`.
2. **Work Strictly in Your Assigned Files:** Check the ownership matrix before modifying any file. No two developers share ownership of any code file.
3. **Database Schema Isolation:**
   - Teammate 1 modifies ONLY `src/server/db/schema/module-1.ts`
   - Teammate 2 modifies ONLY `src/server/db/schema/module-2.ts`
   - Teammate 3 modifies ONLY `src/server/db/schema/module-3.ts`
   - **NEVER** edit `src/server/db/schema.ts`, `src/server/db/schema/index.ts`, or `src/server/db/schema/auth.ts`.
4. **Never Modify Central Platform Files:** Do **not** touch `package.json`, lockfiles, `drizzle.config.ts`, `src/server/auth.ts`, `src/server/db/index.ts`, or `src/app/layout.jsx`. Request new packages from the coordinator.
5. **Stage Only Owned Files:** When committing, add only your owned paths explicitly. Do not run `git add .` or `git add -A`.

---

## 2. Teammate 1: Module 1 (Experience Capture & Consensus Intelligence)

* **Assigned Branch:** `feat/module-1-experiences`
* **Packaged Source Folder:** `TEAM_MODULE_1/`
* **Schema File:** `src/server/db/schema/module-1.ts`
* **Key Features:** Experience wizard, experience browsing, company intelligence dossiers, interview round normalization, AI extraction runs, consensus calculations.

### Git Setup & Workflow
```bash
# 1. Update and checkout base
git checkout feat/full-stack-foundation
git pull origin feat/full-stack-foundation

# 2. Create your assigned feature branch
git checkout -b feat/module-1-experiences

# 3. Stage exclusively your assigned files
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

## 3. Teammate 2: Module 2 (Candidate Readiness, Q&A & Alumni Connect)

* **Assigned Branch:** `feat/module-2-qa-prep`
* **Packaged Source Folder:** `TEAM_MODULE_2/`
* **Schema File:** `src/server/db/schema/module-2.ts`
* **Key Features:** Candidate preparation hub, personalized checklists, readiness score algorithm, community Q&A thread, multi-dimensional claims, alumni mentor directory, mock interview reservations, candidate profile.

### Git Setup & Workflow
```bash
# 1. Update and checkout base
git checkout feat/full-stack-foundation
git pull origin feat/full-stack-foundation

# 2. Create your assigned feature branch
git checkout -b feat/module-2-qa-prep

# 3. Stage exclusively your assigned files
git add src/server/db/schema/module-2.ts
git add src/app/prepare src/app/questions src/app/alumni src/app/connect src/app/profile/page.jsx
git add src/components/prepare src/components/questions src/components/connect
git add src/components/profile/profile-settings-client.jsx src/components/profile/preparation-checklist.jsx src/components/profile/mentorship-client.jsx
git add src/components/companies/generate-prep-plan-button.jsx src/components/companies/readiness-score-card.jsx
git add src/server/actions/questions.ts src/server/actions/preparation.ts src/server/actions/prep-generator.ts src/server/actions/mentorship.ts src/server/actions/mock-interviews.ts src/server/actions/profile.ts
git add src/server/queries/questions.ts src/server/queries/preparation.ts src/server/queries/alumni.ts src/server/queries/mentorship.ts src/server/queries/profiles.ts
git add tests/qa-system.test.ts tests/mentorship.test.ts tests/readiness.test.ts tests/profiles.test.ts

# 4. Commit and push
git commit -m "feat(module-2): implement preparation roadmap, Q&A thread claims and alumni mentorship"
git push -u origin feat/module-2-qa-prep
```

---

## 4. Teammate 3: Module 3 (Placement, Verification & Governance)

* **Assigned Branch:** `feat/module-3-placement-ops`
* **Packaged Source Folder:** `TEAM_MODULE_3/`
* **Schema File:** `src/server/db/schema/module-3.ts`
* **Key Features:** TPO placement drives, role eligibility criteria, student applications queue, alumni offer verification, encrypted CV streaming, moderation review queue, audit logs, public transparency and policy pages.

### Git Setup & Workflow
```bash
# 1. Update and checkout base
git checkout feat/full-stack-foundation
git pull origin feat/full-stack-foundation

# 2. Create your assigned feature branch
git checkout -b feat/module-3-placement-ops

# 3. Stage exclusively your assigned files
git add src/server/db/schema/module-3.ts
git add src/app/admin src/app/about src/app/editorial src/app/guidelines src/app/security src/app/terms src/app/privacy src/app/stats
git add src/app/api/evidence src/app/api/cv
git add src/components/admin
git add src/components/profile/verification-client.jsx src/components/profile/cv-management-client.jsx
git add src/components/experiences/report-experience-dialog.jsx
git add src/components/companies/active-drives-radar.jsx src/components/companies/drive-apply-button.jsx
git add src/server/actions/placement.ts src/server/actions/verification.ts src/server/actions/moderation.ts src/server/actions/cv.ts src/server/actions/reports.ts src/server/actions/audit.ts
git add src/server/queries/placement.ts src/server/queries/verification.ts src/server/queries/moderation.ts src/server/queries/cv.ts
git add tests/placement-actions.test.ts tests/verification.test.ts tests/verification-evidence.test.ts tests/moderation.test.ts

# 4. Commit and push
git commit -m "feat(module-3): implement placement drives, verification workflows and administrative moderation"
git push -u origin feat/module-3-placement-ops
```

---

## 5. Pre-Push Verification Gate (Must Pass)

Before pushing your branch, execute the type check locally:
```bash
npx tsc --noEmit
```
This must exit with **0 errors**.

