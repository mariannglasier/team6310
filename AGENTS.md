# AGENTS.md — CAC Poverty Exercise

## 1. Role and source of truth

You are assisting the team building the CAC Poverty Exercise. **Project documentation describes what to build; this file describes how to work.** Preserve approved requirements, do not invent missing decisions, and do not confuse prototype screens or proposed designs with implemented functionality.

Read only the specifications relevant to the task, and follow their distinctions between **specified**, **proposed**, **unconfirmed**, and **implemented**:

| Source | Consult when |
| --- | --- |
| `docs/architecture.md` | Changing system components, responsibilities, technology, or integrations |
| `docs/data-model.md` | Changing data entities, schema, migrations, financial state, or content versions |
| `docs/api.md` | Changing external data ingestion, source references, statistics, or interfaces |
| `docs/design/ui-spec.md` | Building screens, interactions, responsive layouts, or accessible controls |
| `docs/design/user-flows.md` | Changing setup, simulation, replay, group, or staff journeys |
| `docs/security.md` (if present) | Authentication, authorization, privacy, secrets, and protected operations |
| `README.md`, `frontend/package.json`, and relevant code | Setup, actual scripts, current implementation, and conventions |
| Approved Iteration Plan and client decisions | Sprint priority and acceptance criteria; locate with the team if not in the repository |

The UI spec links to the mid-fidelity Figma prototype. Its sample households, amounts, charts, and credentials are **illustrative**, not approved production data. If specifications disagree, report the conflict and request team clarification before significant work.

## 2. Current repository and scope

- Root contains `docs/`, `frontend/`, `.github/workflows/`, `AGENTS.md`, and `README.md` in the supplied repository screenshot.
- The supplied frontend is a React 19 + TypeScript + Vite 8 scaffold; `frontend/src/App.tsx` is still a starter counter, not the CAC application.
- `@supabase/supabase-js` is installed, but this does **not** establish that Supabase integration, database migrations, or authentication have been implemented.
- **Sprint 1:** individual simulation from landing/setup through scenario choices, inline recap, and ending summary.
- **Later scope:** facilitated group play, staff content administration, and their unfinished workflows. Do not build later-sprint features merely because they appear in the prototype.

## 3. Architectural and security guardrails

- Use the existing React/TypeScript/Vite frontend and the team's Supabase/PostgreSQL architecture. Do not introduce a second backend or replace the stack without approval.
- Keep UI rendering and temporary selection state separate from authoritative financial calculations, persisted responses, and protected content operations.
- Use approved stored personas, scenarios, choices, and economic values; do not hardcode prototype amounts as production data or invent simulation rules.
- Selecting a choice must not commit a financial change. A submitted choice must not be applied twice; show a success recap only after a confirmed commit.
- CAC support availability is distinct from actual assistance received. Missing statistics must not block play or trigger fabricated values.
- Keep external source metadata (source, units, geography, period, and retrieval/import information). Never use AI-generated narrative as authoritative economic data or auto-publish unreviewed scenarios.
- General players do not require sign-in. Authenticate and **authorize** staff separately. Do not expose service-role keys, external API secrets, or protected operations to untrusted browser code.
- Do not change database entities, versioning, migrations, RLS, group timing rules, or simulation calculations where the specifications explicitly mark the design unresolved. Request approval first.

## 4. Work process and planning-only mode

For nontrivial tasks:

1. Read the task, acceptance criteria, relevant docs, and affected code.
2. Inspect existing dependencies, tests, and patterns; distinguish existing functionality from intended behavior.
3. Propose a scoped plan with affected files, implementation steps, risks, unresolved questions, and verification steps.
4. Implement **only when authorized**. Prefer small reviewable changes and avoid unrelated refactors.
5. Run relevant checks, inspect results, and test important success/failure cases.
6. Update affected documentation and report changes, test results, and limitations.

**When asked for a plan, including the first Development Readiness implementation task: stop after proposing the plan. Do not edit code, install dependencies, change schemas, or create configuration until the team explicitly approves implementation.**

## 5. Run and verify the frontend

The following scripts are confirmed in `frontend/package.json`. Run commands from the `frontend/` directory:

```bash
npm ci
npm run dev
npm run test
npm run lint
npm run format:check
npm run typecheck
npm run build
```

- `npm run test`: Vitest (with React Testing Library available).
- `npm run lint`: ESLint.
- `npm run format:check`: Prettier verification; use `npm run format` only when formatting changes are authorized.
- `npm run typecheck`: TypeScript project build/check.
- `npm run build`: TypeScript check followed by Vite production build.
- The supplied `App.test.tsx` tests the starter counter only. It does **not** verify CAC simulation behavior.
- `.github/workflows/` exists, but the CI YAML was not supplied. Inspect the actual workflow before claiming what CI runs.

For application changes, test relevant flows against `docs/design/user-flows.md`: valid/invalid setup selection; support on/off; choice selection versus submission; duplicate and failed submission; correct balance/expense results; inline recap; missing comparison; ending/replay; keyboard and mobile interactions. For later features, test group timing/realtime and staff authorization when implemented. Never claim a test or deployment passed unless you actually observed it.

## 6. Unclear or conflicting requirements

Before implementation, consult the relevant document's open-issues section. In particular, `docs/data-model.md` flags group-session and versioning inconsistencies, and `docs/design/user-flows.md` leaves simulation rules, Review behavior, group timing, and administration details open. `docs/api.md` specifies source strategies but not every economic transformation, update approval, or cache rule.

If a decision is missing: (1) describe the ambiguity, (2) explain its effect on the requested task, (3) propose options only as options, and (4) request a team decision. Do not silently resolve major architectural, financial, privacy, or user-experience questions. Record approved decisions in the appropriate spec before implementation.

## 7. Completion report

After authorized implementation, report: what changed, files affected, important choices, commands/tests actually run and their outcomes, and remaining issues. Keep architecture, data-model, API, security, and UI/flow documentation consistent with any approved changes. Do not claim a feature is complete solely because the scaffold builds.
