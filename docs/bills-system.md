# Independent bills — approved November 8, 2026

## Approved behavior

Bills are independent of scenarios. `persona_expenses` defines designer-supplied
principal, fixed late fee, first due day and optional recurrence interval. NULL
recurrence means one-time. Each run snapshots occurrences through Day 30 into
`playthrough_expenses`; no content or illustrative prices are supplied by this work.

Bills cannot be prepaid. Pay settles one occurrence in full when affordable;
insufficient funds changes neither cash nor run status and leaves Ignore available.
Ignore immediately incurs one fixed fee, without deducting cash. Overdue bills can
be settled later. Principal and fee remain separate; partial payments, interest and
CAC bill assistance are excluded. Multiple due bills have independent controls.

Bills and ordinary scenarios cannot occupy the same major-interaction day. Bills
may follow the existing employment sequence on Days 2 and 3 at the `day` stage;
they do not interrupt interview/result/reapplication stages. Payday remains first.
Normal day departure requires each due bill to be paid or ignored. Overdue bills
do not prevent Day 30 completion. The ending reports cash and unpaid obligations,
including incurred fees. Existing scenario responses and persistence stay unchanged.

## Stage 1: database foundation

Prepared migration: `20261108010000_bill_schedule_foundation.sql`. It is not applied
to hosted Supabase. Read-only inspection found zero definitions/occurrences; the
migration rejects nonempty expense tables rather than repairing/backfilling data.

Added fields:

| Table | Fields | Meaning |
| --- | --- | --- |
| `persona_expenses` | `late_fee_amount` | Required designer-supplied fixed fee; no invented default |
| `playthroughs` | `expenses_initialized_at` | Server marker; historical runs remain NULL |
| `playthrough_expenses` | `name_snapshot`, `late_fee_amount` | Immutable name and fee alongside existing original `amount_due` |
| `playthrough_expenses` | `ignored_at` | Ignore receipt and one-time fee-incurrence marker |
| `playthrough_expenses` | `paid_day`, `payment_balance_after` | Payment audit fields alongside existing `paid_at` |

Numeric columns reject nonfinite, negative, sub-cent and out-of-range principal/fee
input rather than silently rounding. Lifecycle and settlement totals are derived:
fee is incurred only when `ignored_at` exists. A paid occurrence settles principal
plus any incurred fee. Its before-payment cash is derivable from the immutable
amounts and `payment_balance_after`. Payment fields are all present or all absent.

Composite foreign keys bind occurrence/run and occurrence/definition editions.
Initialization explicitly matches persona as well. Unique run/expense/due-day keys
prevent duplicate occurrences. An unpaid run/day index supports retrieval; a
definition persona/edition index supports initialization. Relationship columns no
longer default to unrelated random UUIDs. Existing RLS and client grants remain.

Definitions must be authored in draft editions matching their persona. Once an
edition has been published, its definitions cannot change. Initialization holds a
shared edition-row lock, coordinating with publication changes. Occurrence snapshot
updates and changes to existing Ignore/payment receipts are rejected. No bill table
mutation privileges or internal function EXECUTE grants are added for clients.

An AFTER INSERT trigger independently checks fresh anonymous-owned individual-run
invariants, generates occurrences, rejects ordinary-scenario collisions and stamps
the marker in the creation transaction. It works in either order relative to the
employment AFTER INSERT trigger. All work rolls back if creation fails. It does not
call or replace scenario functions. It does not expose an initialization RPC.

A non-NULL marker with no occurrences means an initialized empty schedule. NULL
means a historical/unsupported run; no lazy reconstruction or backfill is allowed.
The marker cannot be supplied on insertion, cleared or changed after initialization.
Its initial update is restricted to the nested creation-trigger context, in addition
to existing denial of client UPDATE access. Persona/edition are locked once marked.

## Stages 2–4: gameplay, finances and presentation

Prepared migrations:

- `20261108020000_bill_gameplay.sql`: Pay/Ignore operations, separate day-departure
  guard, bill/scenario content collision checks and publication validation.
- `20261108030000_bill_financial_snapshot.sql`: one STABLE invoker/RLS SELECT
  returning run, employment document, bill receipts/totals and scenario aggregates.

Pay and Ignore lock the anonymous participant's individual run first, then its
occurrence, and validate pinned editions. Existing receipts return unchanged even
on historical retries after completion. Pay updates the bill receipt and cash in
one transaction. Insufficient funds raises a rejection, preserving the active run
and all financial state. Ignore stamps `ignored_at` once without cash movement.
No separate fee writer or request ledger is needed.

The independent advancement trigger checks unresolved occurrences through the old
day when changing day or entering normal completion. It permits income-to-day,
interview/result/reapplication transitions and explicit early endings. Ignored
occurrences do not block completion. It runs after the existing scenario selector
and rejects a newly selected bill-day collision. Separate content triggers reject
colliding scenario edits and edition publication. No existing scenario or employment
function definition is changed.

`BillSimulation` loads the coherent financial snapshot, reconstructs employment
from that same run and coordinates committed refreshes. `DueBillsPanel` provides
independent controls and saved results. `OverdueBills` provides settlement controls
and the combined overdue amount. `billGameplay.ts` sends identifiers only and
validates snapshot identity, exact money, receipt fields and duplicate occurrences.
Failed or uncertain submissions restore committed state; failed restoration blocks
further actions until explicit reload succeeds. No frontend finance is persisted.

`EmploymentPanel` keeps employment stages intact and presents bills at `day`.
Interview-day auto-departure waits for saved bill data and runs only on days with
no bill occurrences, preserving manual Continue after a bill recap. Income is
acknowledged first; controls are disabled during employment/income processing.
The final summary reports remaining cash and total unpaid obligations including
fees. Sidebar payments are disabled after completion.

All migrations remain unapplied to hosted Supabase. Deploy reviewed SQL before the
new frontend, which queries the new marker column. No production expense content,
legacy schedule migration, CAC bill assistance or hosted deployment is included.

For financial integration, `playthroughs.current_balance` remains authoritative.
Paid settlements enter reconstructed charged-expense totals exactly once, alongside
employment and scenario deductions. Ignore/unpaid fees are liabilities, not paid
expenses. A coherent read must include the current employment document and scenario
aggregates rather than combining separately fetched histories with a newer balance.

## Verification

Run the isolated SQL suite with Node 24 and an externally installed PGlite module:

```bash
PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node supabase/tests/bills-foundation.test.mjs
```

The suite uses an explicit disposable test schema and synthetic values only. It is
not a reconstruction of historical migrations. It exercises creation with actual
employment/scenario functions, schedules, empty/legacy runs, immutable snapshots,
edition FKs, RLS/ACL denial, trigger ordering and rollback. PGlite does not establish
multi-session locking behavior, Supabase API behavior or hosted deployment success.

For real concurrent transactions, install `embedded-postgres@17.11.0-beta.19` and
`pg` outside the repository, then run:

```bash
BILLS_TEST_MODULE_ROOT=/absolute/path/to/node_modules node supabase/tests/bills-postgres.test.mjs
```

This creates its own PostgreSQL 17 cluster and database under the operating system
temporary directory, listens only on localhost port 55439, runs the same fixture
suite, then uses separate authenticated sessions and observed lock waits to force
payment races. It accepts no database URL and cannot select a hosted target. The
server stops on completion; its temporary fixture directory is retained for review.
It requires permission to launch a localhost server. No dependency is added to the
application or repository lockfile.

Executed November 8, 2026 with Node 24.22.1:

- PGlite suite: passed through Stages 1–3 and both employment routes.
- PostgreSQL 17.11 suite: passed schema/authorization/rollback tests, overlapping
  same-bill payments, both payment/payday lock orders, Ignore/Pay races and two
  simultaneous bills competing for insufficient shared cash.
- Existing isolated employment regression suite: passed both hiring/payday routes,
  ownership, receipts, replay and failure cases.
- Frontend `format:check`, `lint`, `typecheck`, `test` and production `build`:
  passed. Vitest reported 274 passing tests and two opt-in integration tests
  skipped. This includes saved bill restoration, lost-response reconciliation,
  keyboard controls, independent simultaneous bills, employment-day presentation,
  exact financial totals and the Day 30 unpaid-obligation summary.
- `git diff --check` and both database test-script syntax checks: passed. The
  employment and scenario migration files and application dependencies are unchanged.

The two opt-in local Supabase scenario integration tests remain skipped unless
`VITE_RUN_LOCAL_SCENARIO=1` is configured. They were not enabled against the stopped
Docker stack. No hosted API/deployment or browser viewport testing is claimed.

## Local manual-test database repair — November 8, 2026

The agent applied all three bills migrations to the existing fixed local Docker
verification database. This was a one-time database change, not an addition to
the user's startup routine. The old synthetic employment `Local rent` definition
was backed up under `/tmp/team6310-phase2-verification/` and removed with explicit
user authorization. Checksums verified preservation of the 115 existing runs,
responses and employment/scenario function definitions. No hosted database changed.

The separate published local edition `63100000-0000-4000-8000-000000000800` now
provides `[LOCAL TEST] Bills Alex` and `[LOCAL TEST] Bills Low funds`. It copies the
existing local household starting balances, job inputs and ordinary decisions into
new edition/identity bindings. Its bill amounts are synthetic testing inputs:

| Bill | Principal | Fixed fee | Due days |
| --- | --- | --- | --- |
| Local rent | $50 | $5 | 2, 9, 16, 23, 30 |
| Local utilities | $20 | $2 | 3 |
| Local phone | $10 | $1 | 3 |
| Local final bill | $15 | $1 | 30 |

Fixture SQL is retained in `tools/local_sql/bills_fixture.sql` for developer
reproducibility; it is not a production migration or automatic startup seed.
Fresh runs use the new edition. Existing runs remain pinned to their old editions.

`tools/test_bills_local_api.py` passed against real anonymous Auth and REST on
`127.0.0.1:55321`, for both households through Day 30. This includes the exact
frontend playthrough GET that previously returned 400, schedule initialization,
Days 2/3 bills after employment, duplicate Pay/Ignore, three rejected low-funds
payments without ending the run, later settlement, ordinary scenario progression,
saved-state restoration and completion with $71 of unpaid obligations. The installer
refusal/idempotency unit suite also passed (six tests). Browser viewport testing
is not implied by these API checks.

The manual-testing guide is user-maintained and must not be edited by agents.
