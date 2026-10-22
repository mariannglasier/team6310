# Individual gameplay prototype

The individual setup starts with a persisted employment sequence followed by a
two-decision sample month spanning the grocery day through Day 30.
All costs are illustrative fixture values, not actual CAC services, household
income estimates, or statistical comparisons.
Starting balance is an opening balance, not income received.

## Fixtures

- `src/fixtures/gameScenarios.ts`: narrative, days, optional approved comparison metadata.
- `src/fixtures/gameChoices.ts`: choices, signed changes, outcomes, support eligibility.
- `src/fixtures/gameExpenses.ts`: scheduled charges and sample income deposits.
- `src/fixtures/gameImages.ts`: approved image assignments only; empty by default.
  The existing approved household illustrations and scenic background are reused.
- No comparison statistics are supplied or invented. The comparison section appears
  only when a scenario has content with source, date, geography, and unit.

## State and sample calculations

Before Day 1, the job board shows two lower-requirement roles and grays out jobs
that require skills the scenario does not yet include. CAC mode can simulate
English, computer-skills, and job-fair preparation, followed by the 2025 adult
education fact and an expanded board. The simulation explicitly notes that real
preparation takes time and does not guarantee employment. The selected target
job, preparation, clothing ownership, interview outcome, and job-obtained day are
stored in the same session snapshot as financial decisions.

The Day 2 first interview succeeds only after CAC preparation plus purchased or
CAC-provided professional clothing. A failed interview leads to a separate Day 2
reapplication decision and result screen before the guaranteed Day 3 follow-up
outcome. Purchased clothing costs $60 once; CAC-provided clothing and current
clothes cost $0. Players who already own professional clothing are not charged
again.

Scenario stages include browsing, saving, consequence, advancing, day, charges,
complete, and error in addition to the employment stages. A click immediately
selects and locks a choice. A 650ms mock processing
delay precedes confirmation. Saving must successfully write one localStorage
snapshot containing both the ledger and the resulting stage before showing an
outcome. Continue fades the consequence out; crossing days shows a brief day
interlude, followed by a persistent transaction explanation if charges/deposits
were applied. That explanation also requires Continue.

Balance = starting balance + received positive ledger amounts − charged negative
ledger amounts. Upcoming charges never enter those totals. Zero-cost decisions
do not add income or expenses. Financial outcomes can produce a negative balance;
the prototype does not invent borrowing fees or block necessary decisions.

Each decision has one stable ledger ID; scheduled charges and deposits have
independent stable IDs. Advancement only adds missing IDs. Refresh restores the
selected household, mode, scenario, ledger, and visible stage, including an
unacknowledged consequence or charge notice. Interrupted saving/advancing becomes
a retryable error without a new transaction. Storage errors retain the choice
on screen. Ending requires confirmation and removes the active snapshot.

Example using Jordan & Maya without support: buying professional clothing,
choosing weekly groceries, and paying the utility bill leaves
$500 − $60 − $60 − $45 = $335. Choosing current clothes instead leaves $395.
Weekly job income is displayed as a target but is not received during this
shortened prototype.

For manual failure testing, disable browser storage writes before selecting a
choice. The selected option and Retry remain, with no success or balance update.
Re-enable storage and Retry. Refresh during saving, after a consequence, and on
the scheduled-charge notice to verify that no transaction replays. Reduced motion
removes slide/fade animations, day delay, and balance interpolation.

## Backend enforcement required before production

localStorage is a single-browser prototype, not authoritative persistence.
Client snapshots are editable and offer no cross-tab/device concurrency guarantee.
Replace the mock save with an authenticated server API that:

1. Stores session setup immutably and checks household/support eligibility.
2. Validates scenario order and choices, and calculates money on the server in
   integer minor units; never trusts a client balance, cost, day, or ledger.
3. Atomically writes decision, financial ledger, and persisted consequence stage.
4. Uses durable idempotency keys (session + decision/advance ID), database unique
   constraints, and transactional locking/version checks to prevent duplicate
   submissions and charge replay, including concurrent tabs and network retries.
5. Applies due expenses/deposits and advances day in the same transaction, returning
   a confirmed snapshot with transaction explanations. Handles affordability,
   overdrafts, and income schedules according to approved product policy.
6. Persists consequence acknowledgement separately from financial processing;
   retries/query-after-timeout return the original transaction and visible stage.
7. Supports resume, termination, retention, and recovery server-side. Records
   approvals and eligibility for images, services, and comparison metadata.

No real backend request or real financial transaction occurs in this prototype.

## Verification

- `node --test tests/gameSession.test.cjs`: pure-state calculation, support gating,
  persistence, interrupted processing, storage failure, and idempotency checks.
- `pnpm build`: production application build.
- `pnpm exec tsc --noEmit`: repository-wide check currently blocked by a pre-existing
  malformed type declaration at `src/AdminPortal.tsx:407`. That unrelated screen
  was not changed. The active application's dependency graph was checked separately.
