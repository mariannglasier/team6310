# Staff individual gameplay: Stage 1

**November 14 update:** the reviewed migration is now applied and verified on
local Supabase. See the [local application and test record](staff-individual-stage1-local-verification.md).
Hosted deployment and Stage 3 remain unperformed. The original preparation record
below is retained for history.

November 13, 2026. Database source and isolated verification only. The forward
migration has **not** been deployed to hosted Supabase. Frontend eligibility,
staff authentication, session management, anonymous cleanup, and run ownership
were unchanged in Stage 1. Subsequent frontend work is recorded separately in
[Stage 2](staff-individual-frontend.md).

## Authorization

`is_individual_player()` requires `auth.uid()` and either the signed anonymous
JWT claim or the existing active, non-anonymous `is_cac_staff()` database check.
It is a stable invoker function with an empty search path. No user metadata or
client-supplied owner is trusted. Default execution privileges are removed before
granting execution to `authenticated` and `service_role`.

Eligibility supplements ownership; staff cannot operate another owner's run.
Individual reads and writes recheck eligibility. Revoked staff cannot continue
through an old token merely because they still own the run. Authorization uses
the request's transaction snapshot: already executing transactions are not
cancelled, and previously displayed browser data is not erased.

Group-associated row visibility retains its existing owner condition. Group
functions, policies and anonymous-only authentication are unchanged. The helper
is never added to group admission paths.

## Forward migration

`20261113204615_staff_individual_authorization.sql` adds the helper and changes
only admission expressions in these existing functions:

- `start_individual_playthrough(uuid)`
- `mark_fresh_employment_run()`
- `initialize_fresh_bill_schedule()`
- `submit_employment_action(uuid, uuid, integer, jsonb)`
- `submit_scenario_decision(uuid, uuid, uuid)`
- `restore_scenario_decision(uuid, uuid)`
- `pay_bill(uuid, uuid)` and `ignore_bill(uuid, uuid)`
- `get_bill_snapshot(uuid)`
- `get_scenario_recap_facts(uuid, uuid)`
- `get_event_recap_facts(uuid, text)`

It extends `player_start_own_playthrough` and `player_read_own_playthrough`.
Existing response/expense SELECT policies continue through the RLS-protected
parent lookup, including revocation denial. There are no new financial write
grants. Trigger attachments, progression and bill guards remain unchanged.

Before preparing the migration, read-only hosted checks confirmed all reviewed
function hashes, ownership policy expressions, and trigger attachments still
matched planning. No existing local Supabase service was reachable. The isolated
test database installs the captured current definitions, checks them, and then
applies the migration. It does not reconstruct the gameplay functions from old
migrations or rebuild a hosted database.

The transaction refuses unexpected function definitions, an existing helper, or
different playthrough policies. Exact definition hashes intentionally fail closed,
including on formatting changes. Stop and review differences rather than removing
the guard. Function replacement operates on `pg_get_functiondef` from the target;
the tests assert exact body preservation except the intended admission expression,
plus unchanged owners and ACLs. This preserves the deployed early-termination and
scenario extensions. No records are backfilled or transferred.

## Verification performed

The new suite runs disposable PostgreSQL 18.6 with real API database roles, RLS,
function calls and independent concurrent connections. Auth identities/claims are
simulated SQL settings; this is **not** genuine Supabase Auth or PostgREST testing.
The captured fixture contains function definitions and policies, not player data,
credentials, or production content. Its application tables are minimal test tables,
not a reproduction of the complete production schema.

Passed:

- Drift rejection with transactional rollback and reviewed-definition application.
- Exact function-body, owner and ACL preservation; unchanged group definitions.
- Anonymous and active staff creation, initialization, employment, income,
  ordinary decisions/restoration, recap retrieval, bills, completion and replay.
- Early termination, duplicate receipts, duplicate decisions, duplicate Pay/Ignore.
- Cross-owner denial across affected mutation/read families.
- Revoked staff denial of actions, creation, snapshots, parent and child reads.
- Non-staff owner denial, direct-insert denial, direct financial-update denial,
  missing identity and helper execute-grant checks.
- Real overlapping bill payments deduct once; competing employment revisions
  allow one action and reject the stale action.
- Unchanged group job-vote, scenario-vote and host-configuration guards reject
  staff. Full positive group journeys were not rerun.

Existing `employment.test.mjs` passed in PGlite. Existing
`bills-postgres.test.mjs` passed in disposable PostgreSQL, including its foundation,
Pay/Ignore, snapshot and real overlapping-payment/payday/Ignore concurrency cases.
Those existing suites test their existing migration fixtures; the new suite tests
the proposed authorization migration against captured deployed function bodies.

Reproduction uses external test dependencies, leaving frontend dependencies alone:

```bash
npm install --prefix /tmp/team6310-staff-db-tests --no-audit --no-fund pg@8.23.1 embedded-postgres@18.6.0-beta.19 @electric-sql/pglite@0.5.16
STAFF_TEST_MODULE_ROOT=/tmp/team6310-staff-db-tests/node_modules node supabase/tests/individual-staff-authorization.test.mjs
PGLITE_MODULE=/tmp/team6310-staff-db-tests/node_modules/@electric-sql/pglite/dist/index.js node supabase/tests/employment.test.mjs
BILLS_TEST_MODULE_ROOT=/tmp/team6310-staff-db-tests/node_modules node supabase/tests/bills-postgres.test.mjs
```

The standalone runners require free loopback ports 55441 and 55439 respectively.
They cannot accept a hosted database URL. Socket permissions may require an
execution approval in restricted agent environments.

## Remaining boundary

Docker's local socket was unavailable and port 55322 had no database service.
Actual local Supabase Auth/API tests, full-schema migration application, browser
testing, hosted advisors and hosted deployment remain unverified. No hosted write
or deployment was attempted. Application checks were not run because no frontend
files changed. The database change is ready for Stage 2 development against this
contract, subject to local full-stack integration verification before release.
