# AGENTS.md — CAC Poverty Exercise

## 1. Purpose

This file provides persistent instructions for AI development agents working on the CAC Poverty Exercise.

The project is an interactive poverty simulation for the Community Assistance Center (CAC), supporting individual gameplay, facilitated group sessions, educational statistics, and administrative content management.

Agents must follow the team's approved specifications and existing architectural decisions. Do not independently introduce significant features, technologies, or changes to intended application behavior.

## 2. Authoritative Project Documentation

Before making changes, consult the relevant specifications in the `docs/` directory.

| Document | When to Consult |
|---|---|
| `docs/architecture.md` | Before changing system structure, components, technologies, or responsibilities |
| `docs/data-model.md` | Before modifying database entities, relationships, or stored data |
| `docs/api.md` | Before changing component interfaces, backend operations, or external integrations |
| `docs/security.md` | Before implementing authentication, authorization, or data handling |
| `docs/design/ui-spec.md` | Before implementing or modifying user interface components |
| `docs/design/user-flows.md` | Before changing navigation, gameplay flows, or user interactions |

Also consult relevant user stories and acceptance criteria from the team's approved Iteration Plan.

**[TEAM TO FILL IN: Repository path to the approved Iteration Plan and acceptance criteria: __________]**

**[TEAM TO FILL IN: Location of approved Figma designs or prototype links: __________]**

Treat these sources as authoritative for their respective areas. If documentation conflicts with the current implementation or another specification, report the conflict rather than choosing a resolution independently.

## 3. Development Constraints

Follow the approved technology stack:

- Frontend: React + TypeScript
- Backend: Supabase
- Database: PostgreSQL through Supabase
- Authentication: Supabase Auth
- Real-time communication: Supabase Realtime
- Hosting: Cloudflare Pages

Development requirements:

- Maintain separation between frontend, backend, and database responsibilities.
- Follow existing project conventions and component organization.
- Keep editable simulation content in the database rather than hardcoding it.
- Preserve existing database relationships and constraints.
- Do not introduce new frameworks or major dependencies without approval.
- Do not modify database schemas without reviewing the data model and associated migrations.
- Do not expose privileged credentials in client-side code.
- Enforce authorization and protected operations through appropriate backend and database controls.
- Do not implement unapproved external integrations or AI-generated content functionality.

Refer to `docs/architecture.md` and `docs/security.md` for detailed architectural and security requirements.

## 4. Development Workflow

For nontrivial tasks, follow this process:

1. **Review:** Read the task, relevant specifications, and acceptance criteria.
2. **Investigate:** Inspect existing code, dependencies, and related components.
3. **Plan:** Identify affected files, dependencies, implementation steps, and verification methods.
4. **Request Approval:** Present the plan before making significant changes when approval is required.
5. **Implement:** Make focused changes that follow existing conventions and approved requirements.
6. **Verify:** Run relevant checks and test affected functionality.
7. **Document:** Update affected specifications and summarize completed work.

Prefer small, reviewable changes over broad refactoring.

Do not rewrite working functionality unnecessarily.

### Planning-Only Tasks

When asked to propose an implementation plan:

- Read the task and relevant project specifications.
- Investigate the existing repository.
- Identify dependencies, risks, and unresolved requirements.
- Propose a step-by-step implementation and verification plan.
- **Stop before implementing.**

Do not modify application code, database schemas, dependencies, or configuration files until the team approves implementation.

## 5. Testing and Verification

Verify changes against the relevant acceptance criteria in the Iteration Plan.

Use the project's established testing, linting, type-checking, and build tools.

Run all frontend commands from `frontend/`.

- Install dependencies: `npm ci`
- Start development server: `npm run dev`
- Tests: `npm test` (Vitest + React Testing Library)
- Watch tests: `npm run test:watch`
- Lint: `npm run lint`
- Check formatting: `npm run format:check`
- Apply formatting: `npm run format`
- Type check: `npm run typecheck`
- Build: `npm run build`

Before submitting changes, run formatting checks, linting,
type checking, tests, and the production build.

**[TEAM TO FILL IN: Test command and testing framework: __________]**

**[TEAM TO FILL IN: Linting command: __________]**

**[TEAM TO FILL IN: Type-checking command: __________]**

**[TEAM TO FILL IN: Build command: __________]**

When applicable, verify that:

- Simulation choices produce correct financial consequences and progress updates.
- Player responses are recorded accurately.
- Group session codes, deadlines, and response restrictions function correctly.
- Real-time session updates reach the appropriate devices.
- Administrative operations enforce authorization.
- Database changes preserve data integrity.
- Interfaces remain responsive and keyboard accessible.
- Statistical comparisons display accurate source information.
- Existing functionality is not unintentionally affected.

Do not claim tests passed unless they were actually executed.

If testing cannot be completed, identify the unverified functionality and explain why.

## 6. Security and Data Handling

Follow the requirements in `docs/security.md`.

In particular:

- Do not introduce unnecessary collection of participant personal information.
- Use anonymous identifiers for simulation participation.
- Protect individual responses and administrative data.
- Do not expose service-role keys or other privileged secrets in browser code.
- Respect database access policies and authentication requirements.
- Use aggregate data for group comparisons.
- Preserve the source, reporting period, geography, and units of educational statistics.
- Do not represent simulation participant responses as population statistics.

Do not bypass security controls to simplify development or testing.

## 7. Handling Unclear Requirements

If requirements are incomplete, contradictory, or ambiguous:

1. Review the relevant project documentation.
2. Inspect existing implementation patterns when available.
3. Identify the exact missing decision or conflict.
4. Ask the development team for clarification before making significant changes.
5. Document approved decisions in the appropriate specification.

Do not invent missing requirements or assume proposed functionality has been approved.

If a task depends on an unresolved architecture, security, data, or user experience decision, stop and request clarification before proceeding with that portion of the work.

## 8. Reporting and Documentation

After completing an approved implementation task, provide:

- A summary of changes.
- Files or components modified.
- Important implementation decisions.
- Tests performed and their results.
- Remaining issues, assumptions, or follow-up work.

Update the relevant documentation when implementation changes affect the system architecture, data model, interfaces, security, or user experience.

The goal is to produce maintainable, secure, and verifiable code that follows the CAC's approved requirements.