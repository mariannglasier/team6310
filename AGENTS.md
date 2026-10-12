# AGENTS.md — CAC Poverty Exercise

## 1. Role and project authority

Assist Georgia Tech Team 6310 in developing the CAC Poverty Exercise for the Community Assistance Center in Sandy Springs, Georgia. Project specifications define what to build; this file defines how to work.

Use repository requirements and approved team decisions. Distinguish specified behavior, proposed design, and implemented functionality. Do not invent financial rules, production content, or requirements, and do not treat illustrative prototype values as approved data.

Read the documents relevant to the task:

| Source | Use |
| --- | --- |
| `docs/architecture.md` | Components, technologies, responsibilities, and interactions |
| `docs/data-model.md` | Entities, relationships, financial state, migrations, and content versions |
| `docs/api.md` | External sources, economic inputs, provenance, and data processing |
| `docs/security.md` | Authentication, authorization, ownership, privacy, and protected operations |
| `design/ui-spec.md` | Screens, theme tokens, controls, accessibility, and visualizations |
| `design/user-flows.md` | Setup, decisions, recaps, recovery, replay, group, and staff journeys |
| `README.md`, `frontend/package.json`, and affected code | Setup, available scripts, and implementation conventions |
| Task acceptance criteria and approved iteration plan | Task boundaries and sprint priorities |

Read actual configuration and code before making implementation claims. If relevant specifications conflict or a necessary decision is absent, explain the effect on the task and request team clarification before implementing the affected behavior. Record approved decisions in the appropriate specification.

## 2. Repository and scope

- `frontend/` contains the React 19, TypeScript, and Vite 8 application and verification tooling.
- `frontend/src/lib/supabaseClient.ts` creates the Supabase client using the frontend environment variables.
- `supabase/` contains Supabase configuration and the migrations directory. The current initial migration is empty.
- `docs/` contains architecture, data-model, API, and security specifications.
- `design/` contains the UI specification and user flows.
- `.github/workflows/ci.yml` defines automated frontend checks.
- `agentic-test-responces/` contains a prior agent-task record.

The current application and test are the frontend starter counter. Do not claim the simulation, deployed database, or access policies are implemented based on installed dependencies or documentation.

Sprint 1 prioritizes the individual simulation. Group gameplay and employee administration belong to later scope. Implement the assigned task and its acceptance criteria without expanding into other features or unrelated refactoring.

## 3. Architectural and behavioral constraints

Use the established React/TypeScript/Vite frontend and Supabase/PostgreSQL backend. Preserve the selected Supabase Auth, Realtime, and Cloudflare Pages architecture. Do not replace the stack or introduce another backend without team approval.

Keep rendering and temporary UI selection state separate from protected operations and persisted financial state. Follow these requirements:

- Require explicit household and support selections. Allow Review edits before confirmation, then lock both settings for the active run.
- Selecting an option does not change finances or response counts. Submission applies approved effects once and displays success only after commitment.
- Validate current scenario, choice relationships, ownership, support eligibility, and content version in protected operations. Commit response and state changes atomically.
- Keep upcoming-expense projections separate from actual deductions. Use the simulation model's approved amounts and schedules.
- Advance one day per completed question. Complete normally after Day 30; label early endings with actual progress. Do not invent an automatic ending based on balance.
- Track CAC assistance availability separately from actual use. Support selection alone grants no benefit.
- Restore committed state on refresh without reapplying effects. Replay creates a fresh run and preserves earlier response records.
- Preserve the content version of active runs when staff save changes.
- Label community statistics separately from simulation aggregates. Follow specified chart populations and denominators; missing comparisons do not block play.
- Follow the UI specification's tokens, semantic controls, keyboard behavior, focus states, and narrow-screen layouts.

For later group tasks, preserve independent participant finances and individual host-controlled advancement. Host actions must not fabricate answers or change submitted choices.

## 4. Security and data handling

Follow `docs/security.md` for every affected boundary.

Players and hosts use internal anonymous Auth sessions without a public registration or sign-in requirement. Staff use Supabase Auth plus separately enforced staff authorization. Authentication alone does not grant staff or host privileges.

Enforce ownership, membership, and role checks through database/API permissions and protected operations. Apply Row Level Security to exposed tables, and enforce equivalent restrictions on realtime subscriptions. A run identifier or join code alone is not authorization.

The frontend may use the Supabase project URL and publishable key. Never place privileged keys, passwords, database credentials, or external API secrets in browser code, Git, documentation, or logs. Use placeholder values in example configuration and keep real local configuration out of commits.

Use approved personas, scenarios, choices, statistics, and financial values. Keep source units, geography, period, and provenance. Generated narrative must not become authoritative economic data or introduce unapproved financial effects.

Public data views expose aggregates only and suppress cohorts below the security specification's threshold. Do not collect participants' actual household finances or infer their demographic characteristics from simulated decisions.

## 5. Work process and planning-only tasks

For nontrivial work:

1. Read the task, acceptance criteria, relevant specifications, and affected code.
2. Inspect existing dependencies, configuration, tests, and conventions.
3. Propose a scoped plan identifying affected files, implementation steps, dependencies, material risks, and verification.
4. Implement within the authorized scope using small, reviewable changes.
5. Run applicable checks and inspect their results. Verify meaningful success, failure, and access-denial cases.
6. Update affected documentation and report the completed work accurately.

**For the Development Readiness first implementation task, or any request explicitly limited to planning, stop after proposing the plan. Do not edit implementation code, install dependencies, create configuration, or change the database until implementation is explicitly authorized.**

A plan must state the task's goal and acceptance criteria, current relevant implementation, proposed changes, testing approach, and any decisions needed for that task. Do not perform the proposed work while presenting it as a plan.

## 6. Development commands

Use Node.js 24.x and npm. Run the following from `frontend/`:

```bash
npm ci
npm run dev
```

When a task uses Supabase, use `frontend/.env.example` as the template for local configuration. It defines `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Use the development project's values and a local environment file excluded from Git. The client module throws when required values are missing.

Before submitting application changes, run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run test:watch` runs tests continuously during development. `npm run format` applies formatting; limit formatting edits to the task's scope. In Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

The frontend CI workflow runs the same verification checks on pushes and pull requests. Inspect actual run results before claiming CI passed. Frontend checks do not establish database policy enforcement or successful deployment.

## 7. Verification and completion

Add meaningful tests for implemented behavior. The existing starter-counter test does not cover the poverty simulation.

For individual simulation changes, test the relevant setup validation, selection-versus-submission behavior, financial results, support availability/use, duplicate and failed submissions, recaps, day advancement, early/full endings, refresh restoration, and replay. Check missing-data states, keyboard use, and responsive layout where affected.

For database and security changes, verify allow/deny behavior directly at the API/database boundary, including cross-player access, unauthorized content changes, duplicate/stale submissions, and protected aggregate responses. For later features, verify host/participant boundaries, independent group state, staff authorization, and active-run content isolation.

Report what changed, affected files, checks actually run and their outcomes, and any task-specific limitations. If a check cannot run, explain why. Never claim a feature, test, security control, or deployment is complete without supporting evidence.
