#Terminal commands

### Startup

```
nvm use 24
python3 tools/local_supabase.py start
python3 tools/local_supabase.py status
python3 tools/local_supabase.py frontend-env
cd frontend
npm run dev -- --mode verification --host 127.0.0.1 --port 5173 --strictPort
```


### Teardown

```
cd ..
python3 tools/local_supabase.py stop
```

# Local Port Locations

### Vite Website:

> http://127.0.0.1:5173

### Local Supabase Interface

> http://127.0.0.1:55323

### Extra Local Supabase info

Seems important but you probably dont need it

- Volume: supabase_db_team6310-phase2-verification
- Inside the container: /var/lib/postgresql/data
- Studio: http://127.0.0.1:55323
- API: http://127.0.0.1:55321
- PostgreSQL database address: 127.0.0.1:55322

## Local categories/scenarios compatibility update

On November 6, 2026, the existing verification database received the one-time
local-only update in `tools/local_sql/scenario_compatibility.sql`. This is not a
repository migration or a hosted installer. Do not reapply it: it deliberately
fails if `categories` already exists.

The update reproduces inspected hosted definitions: `categories` (four columns,
primary key, postgres ownership, RLS enabled, no policies), nullable
`scenarios.persona_intent`, and the three scenario foreign keys to category,
persona, and content version with RESTRICT update/delete actions. Existing
scenario published-content SELECT policy is unchanged. Category table grants
match hosted; there is no category SELECT policy, so participant roles cannot
see category rows through RLS.

Verification passed for columns/defaults/nullability, validated constraints,
indexes, table RLS/ownership, policy definitions, participant-role SELECT queries,
and local publishable-key PostgREST reads (HTTP 200). Scenarios/choices remain
empty; no fixtures were loaded. Published-row visibility still needs a later
fixture test. Checksums confirmed unchanged playthrough data, employment function
definitions, personas, jobs, versions, responses, scenarios, and choices.

Column order differs: the new `persona_intent` is appended after `schedule_type`.
Named-column queries are compatible; no tables were rebuilt to reorder columns.

## Database-backed Day 4 preview

The development preview now reads scenario and choice content from local Supabase.
Its $200 starting balance and submission outcomes remain temporary in-memory
presentation state. No playthrough or response is created or changed. Refresh
resets the mock outcome. Hosted URLs are rejected by the preview content loader.

From the repository root (Node 24 selected):

```bash
python3 tools/local_supabase.py status
python3 tools/local_supabase.py frontend-env
python3 tools/load_day4_fixture.py
cd frontend
npm run dev -- --mode verification --host 127.0.0.1 --port 5173 --strictPort
```

If the isolated stack is stopped, use `python3 tools/local_supabase.py start` first.
Do not reset it or reapply the compatibility SQL. The fixture loader checks the
fixed local Docker container/volume and expected existing test persona/edition.
It inserts only missing fixture IDs; identical reruns insert nothing. Conflicting
content aborts the transaction rather than overwriting any existing record.

Open http://127.0.0.1:5173/simulation?localScenario=day4 . Confirm the database title
`[LOCAL TEST] A decision for Day 4` and three choices: Gain $25.00, Spend $15.00,
and No financial change. Selection leaves the $200 preview balance unchanged.
Submitting gives $225, $185, or $200 and database-authored response text. Refresh
between choices. The normal `/simulation` path continues to use saved gameplay.

Fixture IDs:

- Edition (existing): `3c463a7f-7036-4e0c-9c1b-1f5db7c502f3`
- Persona (existing): `cfe33068-d657-482f-b770-ef3918a87e03` (`[LOCAL TEST] Alex`)
- Category: `63100000-0000-4000-8000-000000000001`
- Scenario: `63100000-0000-4000-8000-000000000004`
- Choices: `63100000-0000-4000-8000-000000000041`,
  `63100000-0000-4000-8000-000000000042`,
  `63100000-0000-4000-8000-000000000043`

The scenario is scheduled for Day 4. All choices share the scenario's edition and
have explicit NULL `next_scenario_id`. Publication uses the existing published
test edition; no edition, persona, policy, or existing content is updated.

Run the real-client retrieval test from `frontend/`:

```bash
VITE_RUN_LOCAL_SCENARIO=1 npm test -- --mode verification src/development/localScenario.integration.test.ts
```

Ordinary `npm test` skips that opt-in test and runs mocked read/error validation
and preview component tests without requiring local services. Persistent decision
submission, restoration, and advancement integration remain separate tasks.

## Persistent Day 4 decisions (supersedes mock-submission instructions above)

The local preview now saves responses and balances in the verification database.
Install the local functions once (or reapply their definitions after a reviewed
change), without resets or repository migrations:

```bash
python3 tools/install_scenario_submission.py
cd frontend
npm run dev -- --mode verification --host 127.0.0.1 --port 5173 --strictPort
```

Open http://127.0.0.1:5173/simulation?localScenario=day4 . Select **Start local
scenario run** to prepare/reuse anonymous Auth and create an isolated owned Day 4
run. The balance comes from the saved run. Selecting changes nothing; Submit
records the answer and displays the saved outcome. Refresh restores it and keeps
submission disabled. Test another choice in a separate browser profile. No next-day
advancement or replay is implemented. Normal `/simulation` employment is unchanged.

See [local decision implementation and test commands](phase-3-local-decisions.md).
No hosted operation is part of this workflow.

## Day 4 in the individual simulation

With the fixture and local submission functions installed, run from repo root:

```bash
python3 tools/install_scenario_progression.py
cd frontend
npm run dev -- --mode verification --host 127.0.0.1 --port 5173 --strictPort
```

Open http://127.0.0.1:5173/simulation/individual and start a fresh `[LOCAL TEST] Alex`
run using normal setup. Complete the existing employment sequence. Ordinary Day 4
shows the fixture automatically; no `localScenario` query parameter is needed.
Select, submit, refresh to confirm the saved recap, then Continue simulation to
Day 5. Employment state and payday timing are preserved; ordinary financial
changes appear in the existing balance and totals. Existing runs already on/past
Day 4 are not rewritten. Other households have no new scenario assigned.

Run the actual-flow browser tests with:

```bash
LOCAL_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e -- --config=playwright.local.config.ts individual-scenario.spec.ts
```

This local-only integration installs no hosted SQL. The development preview is
still available independently.

## Additional scheduled test scenarios: Days 5–7

Loaded locally with `python3 tools/load_scenario_test_days.py` (insert-only,
repeatable, rejects conflicting fixture IDs). Local progression was updated with
`python3 tools/install_scenario_progression.py`. The selector now looks up
`scheduled` content using `default_day`, the run's edition and persona; it has
no fixed day/scenario-ID mapping. Multiple eligible scenarios on one day fail
with a content-collision error instead of being selected arbitrarily. Employment
days remain excluded, including the conditional Day 3 interview.

For a fresh local Alex run, continue through these distinct titles:

| Day | Title | Scenario UUID |
| --- | --- | --- |
| 5 | [LOCAL TEST] Day 5 - An opportunity | `63100000-0000-4000-8000-000000000005` |
| 6 | [LOCAL TEST] Day 6 - An unexpected expense | `63100000-0000-4000-8000-000000000006` |
| 7 | [LOCAL TEST] Day 7 - A household tradeoff | `63100000-0000-4000-8000-000000000007` |

Each copies the three Day 4 effects (+$25, -$15, $0), preserves its existing test
persona/edition/category relationships, and prefixes response text with its day.
Choice UUID suffixes are 051/052/053, 061/062/063, and 071/072/073 respectively,
using the same `63100000-0000-4000-8000-` prefix and twelve-digit suffix padding.
All branching destinations are NULL. Existing Day 4 content is unchanged.

Submit and review each recap, then Continue. Refresh should restore the current
recap; after Day 7, Day 8 retains the existing placeholder. Existing saved runs
are not backfilled. No hosted database changes or repetition model are involved.
