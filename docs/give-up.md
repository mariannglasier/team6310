# Give Up — implementation and verification

November 12, 2026. Implements the approved individual-playthrough action only.
The human-maintained local testing guide is unchanged.

## Backend boundary

Hosted definitions were inspected through Supabase MCP before editing. The
current hosted `submit_employment_action(uuid,uuid,integer,jsonb)` locks the owned
playthrough row, validates its employment document, recovers matching receipts,
and checks revision/active individual status. Its initialized end branch already
preserves financial and gameplay data. Its initialized-structure gate rejects
the valid fresh marker; employment initialization is not a lifecycle requirement.
There is no need for another RPC, table, authorization rule or schema field.

`20261112213430_give_up_before_employment.sql` inserts a narrowly validated end
branch after authentication, action-shape validation and the owned-row lock,
before employment validation. It accepts only the exact fresh five-field marker
on an active individual Day 1 run with null job/scenario/support and a saved
balance. It changes status to ended and adds only the existing termination
reason, revision and request receipt to that marker. It creates no employment
fields, history, responses, charges, credits or bill effects. The stored day and
balance stay unchanged. Identical receipt recovery remains possible after an
interrupted response; a new request against the terminal run is rejected.

All initialized requests and every non-end action execute the original function
body unchanged. The employment validator and permissions are unchanged. The
forward migration verifies the inspected original function hash
`aa41a0b9b4cf8f7e9501bb8d0a4ff2e5` before replacing its definition; drift aborts
the transaction for review. No historical migration was edited.

**Deployment:** applied only to the isolated local verification database.
Hosted definitions were read, never changed. Hosted Supabase still needs the
reviewed forward migration before fresh-marker Give Up works there. Repository
SQL and local test success do not establish hosted deployment or enforcement.

## Frontend

- `BillSimulation` owns confirmation, termination and the synchronous mutation
  gate. Employment, scenario, Pay, Ignore and authoritative financial refresh
  participate; uncertain outcomes require reconciliation. The modal holds the
  gate, pausing automatic continuation, and focuses Cancel first.
- `FinancialTracking` places the existing primary red button below the finance
  sidebar using the existing 1150px/760px breakpoints. At narrow sizes it follows
  the main and upcoming-expense content. Completed/ended/group runs have no action.
- `employmentGameplay` recognizes only the exact sparse terminal marker and
  receipt. Restoration uses no job lookup or fabricated walkthrough. The shared
  `SimulationResult` reuses the existing early-ending result presentation;
  fresh-marker endings read Before Day 1 without changing stored Day 1.
- Existing pending employment request storage supplies the original request ID,
  action and revision on recovery, including after refresh. Ordinary sparse-run
  replay uses the existing `leavePlaythrough` cleanup and waits for household
  confirmation to create a new run. Initialized replay and CAC eligibility rules
  are unchanged. PR 1 header/footer navigation is unchanged.

Employment revision does not count bill/scenario mutations. Their shared
playthrough-row lock serializes commits: termination uses the latest locked row
and updates no financial fields. A preceding bill/scenario commit is preserved;
a new gameplay operation after termination fails its active-state check.
Employment revision changes still reject stale requests. The browser gate is
in-memory; other tabs rely on these server protections.

## Verification

- `supabase/tests/give-up.sql`: rollback-only authenticated local tests for fresh
  and initialized termination, strict action validation, unchanged run fields,
  unresolved bills/totals, scenario state, identical receipt recovery, stale and
  duplicate requests, ownership, anonymous authorization, group association,
  completed runs and malformed markers. Uses synthetic local content only.
- `tools/test_give_up_local.py`: two actual database connections race termination
  against initialization, employment application, Pay, Ignore and scenario
  submission in both orders; also race identical termination requests. Synthetic
  records are removed on exit. Local scenario/scheduler definitions predate the
  hosted versions; hosted lock ordering was separately inspected read-only.
- `GiveUp.test.tsx`: real employment request/receipt service with mocked transport,
  pending/uncertain operation coordination, cancellation/automatic advancement,
  fresh/initialized results, refresh, replay and terminal navigation.
- `e2e/give-up.spec.ts`: Chromium checks with mocked API at 1440, 768, 390 and
  320px, including actual household confirmation, placement, native-dialog focus,
  Cancel, fresh termination, refresh and replay without a second run creation.
  Browser checks are not hosted integration tests.

Verified locally: formatting, lint (no warnings), typecheck and production build
pass. The frontend suite reports **421 passed, 2 skipped**, including 12 focused
Give Up tests. All four Chromium projects pass. Rollback SQL tests and all 11
two-connection races pass, including preservation of a committed scenario credit.
No retention rules, Bills implementation, hosted records or general group
termination behavior are changed.

## Changed files

- Individual pages: `BillSimulation.tsx`, `EmploymentPanel.tsx`, `EmploymentGame.tsx`.
- Simulation components: `FinancialTracking.tsx`, `financialTracking.css`,
  `ScenarioPanel.tsx`, new `SimulationResult.tsx`; shared UI `Dialog.tsx`.
- Service/state: `employmentGameplay.ts`, `SetupProvider.tsx`, `setupContext.ts`,
  new `simulationMutation.ts`.
- Frontend verification: new `GiveUp.test.tsx`, `e2e/give-up.spec.ts`, and
  `playwright.config.ts` (optional installed Chromium executable).
- Backend verification: new forward migration, `supabase/tests/give-up.sql`,
  `tools/test_give_up_local.py`.
- Documentation: `design/user-flows.md` and this record.
