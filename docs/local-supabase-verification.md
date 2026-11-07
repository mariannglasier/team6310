> Local Studio is now enabled at http://127.0.0.1:55323 for the verification project. See the Studio section below; migrations and seeding remain disabled.

> Hosted-schema reconciliation now supersedes the earlier missing-schema status below. See [compatibility, real local verification and deployment recommendation](hosted-schema-compatibility.md).

# Local Supabase verification — Phase 2

## Safety and current boundary

This procedure never links to or modifies hosted Supabase. It uses the explicitly
local Docker endpoint `unix:///var/run/docker.sock`, a separate workdir
`/tmp/team6310-phase2-verification`, project ID `team6310-phase2-verification`,
PostgreSQL port 55322 and API port 55321. Nothing replaces frontend/.env.local.
The wrapper removes inherited Supabase/cloud and database connection variables.
It refuses a hosted project link, edited configuration, automatic migration
files and symlinked workdirs/configuration. Private local logs stay outside Git.

The repository history cannot recreate the application schema. The isolated
stack therefore has automatic migrations and seeds **disabled**. Starting it
creates Supabase infrastructure, not a faithful application database. No
replacement baseline or application fixture is installed by this procedure.

## Prerequisites and commands

Use Node 24, Python 3.11+ (tomllib), Docker with the local Unix socket available,
and the repository's installed Supabase CLI (verified version 2.120.0).
Docker images may need downloading. Ordinary host use may require Docker socket
permissions; do not redirect these commands to a remote daemon.

Run from the repository root:

```bash
python3 tools/local_supabase.py start
python3 tools/local_supabase.py status
python3 tools/local_supabase.py frontend-env
python3 tools/local_supabase.py smoke
```

`status` prints endpoints without keys or passwords. `frontend-env` writes only
ignored frontend/.env.verification.local with the *local* public API key. It
does not read or replace frontend/.env.local. Start the UI explicitly in that mode:

```bash
cd frontend
npm run dev -- --mode verification --host 127.0.0.1
```

Vite's verification-mode file overrides the matching values in generic local
configuration. Verify the browser requests go to 127.0.0.1:55321 before creating
any test user or run. Existing browser Auth storage for the hosted URL is not a
source of local credentials. Use a separate browser profile for local testing.

Stop only this project's containers:

```bash
python3 tools/local_supabase.py stop
```

Reset only its disposable local database:

```bash
python3 tools/local_supabase.py reset
```

The wrapper constructs `db reset --local --no-seed` with the fixed isolated
workdir; it never accepts --linked, --db-url or a hosted project ref. With this
infrastructure-only configuration, reset does not install the missing application
schema. Do not run a repository-root reset to work around missing definitions.

## Schema evidence and exact reconstruction gaps

| Evidence | What it establishes |
| --- | --- |
| Empty 20261012023034_initial_schema.sql | No application baseline at all. |
| 20261025000000 integration migration | integration_test DDL, own-row policies and grants. |
| 20261027063526 jobs migration | jobs DDL, generated weekly wages, checks/index, RLS, and job links on personas/playthroughs. Requires those base tables and content_versions first. |
| 20261027063645 / 20261027064141 | Job-policy correction, table-grant restrictions and published-content SELECT policies; requires preexisting base tables. |
| 20261027064520 | owner/host fields, group_participants table/index/FKs, ownership and membership policies/grants. |
| 20261027064542 | Existing invoker start_individual_playthrough RPC definition. |
| 20261027070142 | Draft-persona seed; not a complete published, playable content edition. |
| 20261027075708 | Published-job immutability function/trigger. |
| 20261103000000 | Actual Phase 2 functions, trigger, ACL/ownership normalization and review gate. Unchanged by this local setup task. |
| Previously supplied hosted findings | 13 playthrough columns, JSONB employment_state, selected FKs/grants/policies and absence of direct participant UPDATE. Not full DDL. |
| supabase/tests/employment.test.mjs | Explicit simplified test-only tables/Auth functions. Not a hosted schema reconstruction or full Supabase test. |

Missing base CREATE TABLE definitions:

- content_versions, personas, scenarios, choices, statistics, scenario_statistics;
- persona_expenses, cac_support_effects, group_sessions;
- playthroughs, player_responses, playthrough_expenses.

The first reconstruction failure would be 20261027063526: jobs references
content_versions, which the preceding migrations never create. Later ALTERs,
REVOKEs, policies and seeds then require the remaining missing tables.

Unknown base details include all unsupplied column defaults/types/nullability,
primary/composite keys, FK actions, uniqueness and CHECK constraints, indexes,
base RLS enablement/FORCE settings, table owners and preexisting policies/grants.
The four English/computer skill columns required by Phase 2 have no addition in
this checkout's migration history. employment_state and the original financial/
calendar/support fields likewise have no creation DDL here. The reported hosted
types do not supply their complete constraints. The config also references
supabase/seed.sql, which does not exist; the isolated config disables seeding.

The referenced docs/database exports are absent. docs/data-model.md explicitly
labels its SQL types/constraints as proposals, not verified hosted definitions.
A credential-free schema-only export with owners, grants, policies, constraints,
indexes, triggers and function definitions is needed. Do not restore hosted Auth
users or participant records. Catalog checks for terminal statuses, owner-role
memberships and default privileges remain required before migration approval.

## Verification not established by an empty stack

Until the evidence gap is resolved, do not apply the Phase 2 migration to this
empty database or call that a deployment compatibility test. No live gameplay,
RLS boundary, real multi-connection race/lock, rollback or browser-persistence
result is established by startup alone. Existing PGlite and mocked browser results
remain separate, narrower evidence documented in phase-2-employment.md.

The current migration creates **three** functions (two SECURITY DEFINER functions
and one SECURITY INVOKER validator), plus one trigger. After a faithful local
schema is available, test that exact file unchanged, inspect all resulting owners,
ACLs/search paths and RLS, and perform actual local Auth/API/UI and independent
PostgreSQL-connection security/concurrency tests. Do not automatically set its
security-review acknowledgment before inspecting the restored local definitions.

## Live infrastructure browser check

After local startup and frontend-env, run from frontend:

```bash
LOCAL_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e -- --config=playwright.local.config.ts
```

Omit LOCAL_CHROMIUM_PATH to use the repository's default Chrome installation.
This separate configuration refuses any API URL other than 127.0.0.1:55321,
uses Vite port 4175 and injects the local key explicitly. It never falls back to
the hosted environment. No local Supabase API responses are mocked. External
network requests are blocked defensively. In the current empty application
schema, its expected result is a disabled Continue control and readable content
loading failure. That verifies local routing only, not employment gameplay.

The smoke command creates disposable anonymous/registered Auth users, checks
JWT claims and user endpoints, confirms the API reports the absent application
table, and opens independent real PostgreSQL connections. It does not assert
gameplay transaction/locking correctness. Use reset to remove its local users.

## Results recorded 2026-11-03

Initial Git state: clean on playthrough+jobapp-careful-merge at 7fb2cb7. The only
tracked additions for this task are this document, the local command wrapper and
its safety tests, and a separate local-infrastructure Playwright config/test.
Existing migrations/config and the hosted frontend environment are unchanged.

- Docker 29.9.1 was reached via the explicit local Unix socket. The default
  desktop-linux context pointed at a different socket; it was not used.
- Installed Supabase CLI 2.120.0 started the isolated stack successfully. Its
  infrastructure PostgreSQL/Auth/API were available. No CLI upgrade was attempted.
- Local status and ignored frontend-env generation passed.
- Anonymous and registered local Auth signup, JWT claim checks, and authenticated
  user endpoint reads passed, both before and after a successful local reset.
- Two independently opened PostgreSQL sessions had distinct backend PIDs.
  auth.users existed; public.playthroughs, personas and content_versions did not.
- The live browser infrastructure test passed against the actual local API,
  with no mocked API response and no external requests. Expected content-load
  failure kept Continue disabled. It did not complete employment gameplay.
- Four wrapper safety tests passed: explicit local reset, removal of inherited
  cloud targets, rejection of changed config, and rejection of nonlocal/wrong-port
  API endpoints. These are command-construction tests, not database security tests.
- Frontend formatting, lint, typecheck, 223 unit tests and production build passed.
- Local start, reset (--local --no-seed) and stop all exited successfully. The
  verification stack was stopped after testing. Stop preserves its disposable
  local volumes; start resumes them, reset clears local database test records.

The actual Phase 2 migration was **not applied** in this task: the faithful
application schema prerequisite is missing. No application schema was reproduced
or supplemented with invented test fixtures. Actual gameplay API authorization,
function ownership/ACLs after deployment, RLS enforcement, independent-session
lock/concurrency behavior, financial transactions and full browser restoration
remain unverified here. The needed next input is the schema-only evidence listed
above. Hosted Supabase was never contacted by this task's verification commands.

## Local Studio Table Editor

The verification profile now enables Studio on 55323 and its postgres-meta
service. Existing API/database ports remain 55321/55322. The isolated custom
Docker bridge uses loopback-only port publication. No hosted profile, database
setting, migration, seed or production configuration was changed.

To upgrade an existing old verification profile with Studio disabled, run:

```bash
python3 tools/local_supabase.py studio
```

This migrates only the exact old local config template, stops/starts this local
project without reset, retains the database volume, and compares the count and
full-row checksum of public.playthroughs before/after. The verified upgrade
preserved that snapshot. Future `start` operations retain Studio. A brief local
API interruption occurs during restart. Normal `stop` remains volume-preserving.

Open http://127.0.0.1:55323/project/default/editor, select schema public and table
playthroughs. Filter playthrough_id using the UUID shown in the application.
Scroll horizontally to employment_state. Click a JSONB value to inspect its
contents in the cell viewer/editor; close without saving when only viewing.
Refresh the table after application actions to inspect stage, revision, history,
receipts, creditedDays and employment fields. Legacy null values remain null.

The Studio dashboard has administrative local access, rather than the
participant's RLS-limited view. It was verified to load the public table list
through the local metadata service, with external requests blocked. All exposed
verification ports bind 127.0.0.1; postgres-meta has no host-published port.
No local reset, migration application or data loss was part of enabling Studio.
