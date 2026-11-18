# Stage 1 applied to local Supabase

**Subsequent status:** [Stage 3 genuine Auth/API verification](staff-individual-stage3-api-verification.md)
has now passed locally. The original Stage 1 verification boundary below is
retained for history; Stage 4 has not started.

November 14, 2026. The unchanged migration
`supabase/migrations/20261113204615_staff_individual_authorization.sql` applied
successfully to `supabase_db_team6310-phase2-verification` through Docker's
`default` context. No hosted connection, frontend edit, genuine Auth-session
test, browser test, or Stage 3 work was performed in this stage.

## Preconditions and application

Immediately before application, all eleven target function definition hashes,
the `is_cac_staff()` hash, helper absence, and both playthrough-policy
prerequisites matched. The migration's original checks ran without modification.
The source file's SHA256 remained unchanged after application and verification.

The documented local differences do not affect these assumptions:

- `open_local_day4_run()` is a separate, existing anonymous-only local fixture
  helper. Its definition and permissions were left unchanged.
- Seventeen omitted `MAINTAIN` grants concern table maintenance, not function
  execution, admission, ownership or RLS. No maintenance grants were added.

A schema-only backup, before/after catalogs, source hash, application receipt,
data fingerprints and test results are retained privately under
`/tmp/team6310-stage1-local-w2afj9zq/`. The migration was executed verbatim using
local PostgreSQL; no migration history was fabricated for the earlier manually
installed local schema.

## Changed database objects

Added `public.is_individual_player()`: stable, invoker, empty search path, requiring
an Auth user ID and either the anonymous JWT claim or current active CAC staff
authorization. Execute is granted only to `authenticated`, `service_role` and
the function owner; `anon`/`PUBLIC` have no execute grant.

Changed only admission expressions in:

- `start_individual_playthrough(uuid)`
- `mark_fresh_employment_run()`
- `initialize_fresh_bill_schedule()`
- `submit_employment_action(uuid, uuid, integer, jsonb)`
- `submit_scenario_decision(uuid, uuid, uuid)`
- `restore_scenario_decision(uuid, uuid)`
- `pay_bill(uuid, uuid)`
- `ignore_bill(uuid, uuid)`
- `get_bill_snapshot(uuid)`
- `get_scenario_recap_facts(uuid, uuid)`
- `get_event_recap_facts(uuid, text)`

Changed `player_start_own_playthrough` and `player_read_own_playthrough` on
`public.playthroughs` to include individual eligibility without replacing
ownership or the existing insert invariants. The read policy preserves the
existing group-associated row condition. Response and expense policies remain
unchanged and continue to use the RLS-protected parent lookup.

Post-application comparison verified exact admission-only body changes and
unchanged original owners/execute permissions. All other functions, all group
policies, all trigger attachments/enabled states, tables, columns and constraints
were unchanged. Employment/scenario extensions, row locks, financial checks,
revisions and receipt logic remain intact.

## Tests executed

| Suite                                                     | Environment                                                                              | Result                                                                                                                                                                                                                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/tests/individual-staff-authorization.test.mjs`  | Disposable PostgreSQL, simulated Auth claims                                             | Passed admission, employment, bills, ordinary decisions/recaps, termination, completion/replay, ownership, non-staff/revocation denial, direct-write denial, duplicate/revision/concurrency checks and unchanged group guards/definitions.                    |
| `supabase/tests/individual-staff-authorization-local.sql` | Actual migrated local Supabase PostgreSQL, `authenticated` role and simulated JWT claims | Passed anonymous/staff creation, bill initialization/snapshots, employment initialization, termination retries, cross-owner denial, revocation, child-table RLS, recap/snapshot denial, non-staff denial and staff group rejection. All fixtures rolled back. |
| `supabase/tests/employment.test.mjs`                      | PGlite isolated fixture                                                                  | Passed fresh/legacy behavior, ownership/RLS, costs, duplicate receipts, stale requests, hiring/paydays, replay eligibility, insufficient funds and unsupported state.                                                                                         |
| `supabase/tests/bills-postgres.test.mjs`                  | Disposable PostgreSQL                                                                    | Passed bill foundation, Pay/Ignore, financial snapshots, ownership/ACLs, rollback, Day 2/3 and Day 30 rules, and real overlapping payments/payday/Ignore races.                                                                                               |

The existing regression suites retain their own isolated migration fixtures;
their success is distinct from the new local SQL-role verification. Tests ran
using Node.js 24.22.1 and the previously installed external test dependencies.

No failed executed cases remain. The old `supabase/tests/give-up.sql` was not run
unchanged: it explicitly constructs a group-associated row without membership,
which conflicts with the group foreign-key/pair constraints now correctly
installed by reconciliation. Termination is covered by the successful Stage 1
authorization suites instead. Full content-library/group journeys require
Stage 3 fixtures and were not run.

Every row in all 27 application tables and `auth.users` was fingerprinted before
application and again after testing. All matched, including 130 Auth users,
145 playthroughs, 90 responses and 224 bill occurrences. Temporary SQL fixture
users, staff records and runs did not persist.

## Readiness and remaining verification

**The local database is ready for Stage 3.** Stage 3 has not started. Real
Supabase Auth issuance/refresh/revocation, REST/RPC HTTP requests, staff dashboard
session preservation and positive anonymous group journeys remain unverified by
these SQL-role and isolated tests. Browser testing also remains unverified.

No new security concern was found within the tested boundary. The documented
fixture-helper and maintenance-grant differences remain; neither was altered.
Existing local content was preserved, so full group/library integration may need
scoped synthetic fixtures. Hosted Supabase remains unchanged and still requires
separate deployment authorization.
