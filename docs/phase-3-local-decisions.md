# Phase 3: persistent local scenario decisions

Implemented only in the development Day 4 preview. Hosted Supabase has not been
modified. Ordinary gameplay routing and day advancement remain separate work.

## Local backend

`tools/local_sql/scenario_submission.sql` defines three functions, installed only
through the fixed local Docker target by `tools/install_scenario_submission.py`:

- `submit_scenario_decision(run, scenario, choice)`: anonymous Auth required;
  locks the caller's owned run, validates current scenario, persona, edition,
  choice and ordinary event day. On first submission the run must be active.
  Uses PostgreSQL numeric arithmetic and rejects nonfinite/sub-cent values.
  Records the applied change and resulting balance in `player_responses` in the
  same transaction as the balance update. A zero-dollar choice still records a
  response. No day or employment document changes occur. Day 3 additionally requires a
  Day 2 hire and the ordinary `day` stage; absent/Day 3 hires and pending
  interview/income stages are rejected.
- `restore_scenario_decision(run, scenario)`: a STABLE, SECURITY INVOKER SQL
  function reads the run, persona and saved response in one SELECT/MVCC snapshot.
  Existing RLS plus explicit anonymous ownership checks restrict reads. The
  frontend uses this result rather than separate run/response requests.
- `open_local_day4_run()`: local fixture provisioning only. An explicit Start
  action creates an owned Day 4 test run with the fixture persona's starting
  balance, or returns the existing fixture run for that participant. Concurrent
  starts are serialized using a participant-scoped advisory transaction lock.
  It never upgrades an employment run or changes the normal start operation.

All three functions are postgres-owned with empty search paths and grant
EXECUTE only to authenticated among participant/API roles. Submission and local
provisioning use SECURITY DEFINER; restoration uses SECURITY INVOKER. All enforce
anonymous identity. Existing table grants and RLS policies remain unchanged. No tables,
columns, constraints, employment routines, or migrations were added/changed.

Duplicate protection uses the owned run's row lock, then finds an existing
response by joining its choice to the scenario. Same-choice retries return the
saved response; different-choice retries reject. This also handles concurrent
different choices. It relies on participants having no direct response INSERT
or run UPDATE permission; privileged maintenance writers must follow the same
locking protocol. It is not a new table-level uniqueness constraint.

Unaffordable attempts end the run without charging or recording a successful
response; the local UI restores the ended run. The fixture normally starts with
$200. CAC effects are explicitly rejected by this narrow direct-balance slice;
no assistance, expense, branching, tax-component or unpaid-debt engine is implied.

## Frontend and restoration

The development-only `/simulation?localScenario=day4` path requires verification
mode and refuses hosted endpoints. It loads content, checks the existing Auth
session, and restores the owned fixture run and saved response through RLS.
Without an existing run it offers Start; only that explicit action prepares an
anonymous session and invokes local provisioning. No locator or finance is
written to the employment setup context or localStorage by the preview.

Submission sends identifiers only. It displays saved balance and response after
server confirmation plus a single-snapshot owned-state RPC read. On uncertain submission it attempts
restoration; reload/retry cannot repeat the adjustment. Remounting restores the
read-only recap. No Continue/day-advance action is implemented. Financial totals
remain unavailable for these fixture runs, which have no employment history.
The existing normal simulation path is unchanged.

## Verification commands

With the isolated stack and existing Day 4 fixture present:

```bash
python3 tools/install_scenario_submission.py
python3 tools/test_scenario_submission.py
cd frontend
VITE_RUN_LOCAL_SCENARIO=1 npm test -- --mode verification src/development/localScenario.integration.test.ts
LOCAL_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e -- --config=playwright.local.config.ts scenario.spec.ts
```

Tests create disposable local anonymous accounts and test runs. They do not
remove them or reset the database. Wrong-version and response-failure injection
are transactional and rolled back. Tests preserve preexisting run snapshots and
employment function definitions. Normal frontend tests mock the service boundary;
the opt-in integration/browser tests use real local Supabase.

There is no replay button in this slice. Use a fresh browser profile/context to
exercise a different answer; refreshing the same context restores its decision.
Before any hosted rollout, review deployment/security separately; this local SQL
is not applied automatically and is not a hosted deployment authorization.

### Review corrections and verification

The restore race test first reproduces the former split-read failure (old run
balance with a newly committed response). A database advisory barrier then pauses
a restore statement while a separate API connection commits a submission. The
STABLE restore returns the consistent pre-commit snapshot; a subsequent restore
returns the consistent post-commit snapshot. No sleeps or barriers were added to
production functions.

Transactional Day 3 tests cover Day 2 hire in day stage (allowed), missing hire,
Day 3 hire, interview-result and income stages (rejected). Test-only scenario and
employment-document changes are rolled back. No Phase 2 routine is modified.

Unaffordable tests verify ended status, unchanged balance/day/employment state,
no successful response, restoration of the ending, and rejection of subsequent
submissions. Exact funds and zero-cost choices at zero balance remain active.
The ending still has no dedicated persisted reason/attempt record; the local
fixture UI derives its ending message from the saved ended status. General
ending-history integration remains outside this slice.

## Individual simulation integration (local verification)

The actual `/simulation` flow now renders shared `ScenarioPanel` and generic
`services/scenarioContent.ts` / `scenarioGameplay.ts` for the saved run's current
scenario. It does not import the development preview or its fixture provisioning.
The normal setup, anonymous identity and employment run locator are unchanged.

Install `tools/local_sql/scenario_progression.sql` locally with:

```bash
python3 tools/install_scenario_progression.py
```

This adds a local BEFORE UPDATE trigger, scoped to the Day 4 fixture and its
matching persona/edition. On entry to ordinary Day 4 it assigns the existing
scenario ID. It rejects leaving that day before a saved response exists, including
when the original employment RPC is called directly. After a saved recap, Continue
uses the original `submit_employment_action`; the trigger clears the fixture ID
as that action advances to Day 5. It does not replace/edit that RPC, its revision,
receipts, employment JSON or payday calculations. No hosted SQL was installed.

New runs for the existing local Alex fixture reach this scenario through their
employment flow. No old runs are backfilled or upgraded. Other personas/editions
and days retain their existing placeholders. The trigger is local fixture
integration, not a general scheduler or a production deployment artifact.

Saved scenario adjustments contribute separately to financial totals; employment
history is not rewritten. Starting balance is reconstructed from current balance,
employment history and saved ordinary response changes. Totals show unavailable
while the additional history is unavailable. The preview remains a separate local
test entry point.

Tests: `tools/test_scenario_submission.py` exercises the advancement guard and
existing Day 30/payday flow. `frontend/e2e-local/individual-scenario.spec.ts` uses
fresh runs through protected employment actions, then tests all three answers in
the actual simulation, saved recap after refresh, financial totals and Continue
into Day 5. Scenario component tests cover selection/commit/continue separation,
restoration, and missing required content.
