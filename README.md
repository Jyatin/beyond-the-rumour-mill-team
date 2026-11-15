# Beyond the Rumour Mill

**Live website:** https://beyond-the-rumour-mill-main-mws322y1b-jyatin1.vercel.app

## Module 2: Candidate Readiness, Q&A & Alumni Connect

### Teammate assignment
- **Role:** Teammate 2 (Lead Frontend / Product Full-Stack Engineer)
- **Assigned branch:** `feat/module-2-qa-prep`
- **Base branch and commit:** `feat/full-stack-foundation` (`f505c60865003cb9d15222f07dbb6317aa502d08`)
- **Integration target:** `feat/full-stack-foundation`

### Scope and capabilities
- **Preparation hub and roadmap:** Personalized checklist items, readiness tracking, and offer negotiation guide (`/prepare`).
- **Readiness score calculator:** Quantitative readiness computation against target company cutoffs (`src/server/readiness/*`).
- **Community Q&A:** Thread discussions, answer composer, and multi-dimensional claims (`/questions`, `/questions/[id]`).
- **Alumni directory and mentorship:** Alumni discovery, 1-on-1 coffee chats, and mock interview slot reservations (`/alumni`, `/connect`).
- **Candidate profile dashboard:** Profile attributes, target role settings, and mentoring availability (`/profile`).

### Database schema ownership
Module 2 schema additions belong in `src/server/db/schema/module-2.ts`.

Tables: `alumni_profiles`, `alumni_cvs`, `preparation_items`, `mentorship_requests`, `mock_slots`, `mock_bookings`, `questions`, `question_asks`, `question_topics`, `answers`, `answer_claims`, `answer_feedback`, and `question_invitations`.

Enums: `questionIntentEnum`, `questionStatusEnum`, `qaModerationStateEnum`, `answerBasisEnum`, `answerDisplayModeEnum`, `answerSourceEnum`, `claimDimensionEnum`, `invitationStatusEnum`, `mentorshipRequestStatusEnum`, `mockSlotStatusEnum`, and `mockBookingStatusEnum`.

Do not modify shared schema files (`schema.ts`, `schema/index.ts`, `schema/auth.ts`) or other modules' schema files for Module 2 additions.

### Files and areas owned by Module 2
- `src/app/prepare/**`, `src/app/questions/**`, `src/app/alumni/**`, `src/app/connect/**`, `src/app/profile/page.jsx`
- `src/components/prepare/**`, `src/components/questions/**`, `src/components/connect/**`
- `src/components/profile/profile-settings-client.jsx`, `preparation-checklist.jsx`, `mentorship-client.jsx`, `give-to-get-banner.jsx`
- `src/components/companies/generate-prep-plan-button.jsx`, `readiness-score-card.jsx`
- Module 2 server actions, queries, QA and readiness logic under `src/server/actions/`, `src/server/queries/`, `src/server/qa/`, and `src/server/readiness/`
- Tests: `tests/qa-system.test.ts`, `tests/mentorship.test.ts`, `tests/readiness.test.ts`, `tests/profiles.test.ts`, and `tests/qa-smoke-test.test.ts`

### Validation
```bash
npx tsc --noEmit
npx vitest run tests/qa-system.test.ts tests/mentorship.test.ts tests/readiness.test.ts
```
