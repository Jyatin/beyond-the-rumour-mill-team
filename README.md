# TEAM MODULE 2: Candidate Readiness, Q&A & Alumni Connect

## Teammate Assignment
- **Teammate Role:** Teammate 2 (Lead Frontend / Product Full-Stack Engineer)
- **Assigned Git Branch:** `feat/module-2-qa-prep`
- **Base Branch & Commit:** `feat/full-stack-foundation` (`f505c60865003cb9d15222f07dbb6317aa502d08`)
- **Integration Target:** `feat/full-stack-foundation`

---

## 1. Scope & Capabilities Included
This module contains student preparation, targeted community Q&A, and alumni mentorship:
* **Preparation Hub & Roadmap:** Personalized checklist items, readiness tracking, offer negotiation guide (`/prepare`).
* **Readiness Score Calculator:** Quantitative readiness computation against target company cutoffs (`src/server/readiness/*`).
* **Community Q&A System:** Thread discussions, answer composer, and multi-dimensional claims (`/questions`, `/questions/[id]`).
* **Alumni Directory & Mentorship:** Verified alumni discoverability, 1-on-1 coffee chats, mock interview slot reservations (`/alumni`, `/connect`).
* **Candidate Profile Dashboard:** User profile attributes, target role settings, mentoring availability (`/profile`).

---

## 2. Database Schema Ownership
You exclusively own:
* **`src/server/db/schema/module-2.ts`**

Contained Tables & Enums:
- `alumni_profiles`
- `alumni_cvs`
- `preparation_items`
- `mentorship_requests`
- `mock_slots`
- `mock_bookings`
- `questions`
- `question_asks`
- `question_topics`
- `answers`
- `answer_claims`
- `answer_feedback`
- `question_invitations`
- Enums: `questionIntentEnum`, `questionStatusEnum`, `qaModerationStateEnum`, `answerBasisEnum`, `answerDisplayModeEnum`, `answerSourceEnum`, `claimDimensionEnum`, `invitationStatusEnum`, `mentorshipRequestStatusEnum`, `mockSlotStatusEnum`, `mockBookingStatusEnum`

> **STRICT RULE:** Do NOT modify `src/server/db/schema.ts`, `src/server/db/schema/index.ts`, `src/server/db/schema/auth.ts`, or the other modules' schema files. All schema additions must be in `module-2.ts`.

---

## 3. Allowed Files to Modify
- `src/server/db/schema/module-2.ts`
- `src/app/prepare/**`
- `src/app/questions/**`
- `src/app/alumni/**`
- `src/app/connect/**`
- `src/app/profile/page.jsx`
- `src/components/prepare/**`
- `src/components/questions/**`
- `src/components/connect/**`
- `src/components/profile/profile-settings-client.jsx`
- `src/components/profile/preparation-checklist.jsx`
- `src/components/profile/mentorship-client.jsx`
- `src/components/profile/give-to-get-banner.jsx`
- `src/components/companies/generate-prep-plan-button.jsx`
- `src/components/companies/readiness-score-card.jsx`
- `src/server/actions/questions.ts`
- `src/server/actions/preparation.ts`
- `src/server/actions/prep-generator.ts`
- `src/server/actions/mentorship.ts`
- `src/server/actions/mock-interviews.ts`
- `src/server/actions/profile.ts`
- `src/server/queries/questions.ts`
- `src/server/queries/preparation.ts`
- `src/server/queries/alumni.ts`
- `src/server/queries/mentorship.ts`
- `src/server/queries/profiles.ts`
- `src/server/qa/**`
- `src/server/readiness/**`
- Tests: `tests/qa-system.test.ts`, `tests/mentorship.test.ts`, `tests/readiness.test.ts`, `tests/profiles.test.ts`, `tests/qa-smoke-test.test.ts`

---

## 4. Files You Must NOT Modify (Owned by Others)
- `package.json`, `package-lock.json`
- `drizzle.config.ts`, `drizzle/**`
- `src/server/db/index.ts`, `src/server/db/schema.ts`, `src/server/db/schema/index.ts`, `src/server/db/schema/auth.ts`
- `src/server/auth.ts`, `src/server/auth-helpers.ts`, `src/lib/auth-client.ts`
- `src/components/ui/**`, `src/components/layout/**`, `src/components/marketing/**`
- Mounted subcomponents on profile: `verification-client.jsx` (Mod 3), `cv-management-client.jsx` (Mod 3).

---

## 5. Git Instructions (Create & Push Branch)

```bash
# 1. Checkout the agreed base branch
git checkout feat/full-stack-foundation
git pull origin feat/full-stack-foundation

# 2. Create your assigned feature branch
git checkout -b feat/module-2-qa-prep

# 3. Stage ONLY your assigned files
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

## 6. How to Run Validation Tests
```bash
# Type check (must have 0 errors)
npx tsc --noEmit

# Run unit tests
npx vitest run tests/qa-system.test.ts tests/mentorship.test.ts tests/readiness.test.ts
```
