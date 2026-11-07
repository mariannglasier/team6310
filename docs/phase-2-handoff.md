# Phase 2 employment gameplay handoff

Repository review: November 3, 2026. Branch: `playthrough+jobapp-careful-merge`;
HEAD: `7fb2cb7` (`Phase 2 - still working on it`). This handoff documents local
implementation and recorded verification; it does not authorize deployment.

## Current state

Phase 1 employment UI and Phase 2 server-backed employment gameplay are present.
The frontend uses `services/employmentGameplay.ts` and the individual simulation
components to submit actions, restore committed state, and reconcile uncertain
requests. This remains an employment walkthrough: ordinary scenarios, bill
deductions, and approved facts are not implemented by this work.

The migration [20261103000000_employment_gameplay.sql](../supabase/migrations/20261103000000_employment_gameplay.sql)
reuses `public.playthroughs`, its financial/progression columns, and
`employment_state` JSONB. It adds no gameplay tables. It creates three functions:
`mark_fresh_employment_run`, `submit_employment_action`, and the invoker validator
`valid_employment_document`, plus an AFTER INSERT trigger.

The SQL implements anonymous identity and ownership checks, owned-row locking,
revision validation, transactional updates, durable request receipts, and wage-day
deduplication. Function ownership is explicitly assigned to the existing table
owner; search paths are fixed. Only the gameplay RPC receives a nonowner
`authenticated` EXECUTE grant. No participant table UPDATE grant is introduced.
This deliberately uses elevated table-owner authority, with checks inside the RPC.

Only qualifying fresh inserts receive an initialization marker. Existing null or
unsupported documents are preserved and cannot be initialized by the client.
CAC replay requires an owned, completed, non-CAC Phase 2 run at Day 30; replay
creates a fresh run and preserves its predecessor. Pending request identities
and run locators are stored per participant; committed finances remain server-owned.

Migration SHA256, recomputed during this review and matching the recorded tested
artifact:

```text
f86fc512a76848b121608d3fe4271b9d9ac849673ef165a93c54d472dee98734
```

## Evidence and qualifications

[Hosted-schema compatibility](hosted-schema-compatibility.md) records successful
application of this exact migration to an isolated reconstruction of the supplied
hosted schema. It reports real Auth/API/PostgreSQL/browser checks covering both
hiring/payday paths, CAC replay, retries, rollback, legacy preservation,
independent-connection concurrency, cross-owner lock avoidance, refresh, and
lost-response recovery. It also records frontend checks passing, including 223
unit tests. These results were not rerun for this documentation task; they are
distinct from the narrower PGlite and mocked-browser suites.

The local schema and final preflight CSV files exist under ignored `docs/local/`.
Their recomputed SHA256 values match the compatibility report:

- `database-schema.csv`: `bec4a6fb9d2aaa3887a7a33c697da678e307b61eff999d140fca8e0a8480cce1`
- `inspect-employment-preflight-results.csv`: `7ec79e4fc7d2b6781c5d47817e8bca9f979d810b5d56a8ddc6f6dd757bb41e25`

The report records postgres deployment identity/ownership, nonprivileged participant
roles without owner membership, authenticator without owner membership or
inherited privileges, and configured published-persona skill flags. Its finding
is **no exported status/day CHECK constraints**, rather than constraints explicitly
allowing `completed` and `ended`. Three eligible fallback jobs were reported in an
earlier result file that was subsequently replaced; that count needs a fresh
authorized preflight before deployment.

The assessment remains **READY FOR HOSTED DEPLOYMENT REVIEW**, not deployed.
Repository records say hosted deployment has not occurred; this review did not
connect to hosted Supabase to independently establish its current state.

## Working tree and documentation gaps

At review start, tracked modifications existed in `.gitignore`,
`docs/phase-2-employment.md`, `frontend/src/hooks/useFitScale.ts`, and
`supabase/tests/inspect-employment-preflight.sql`. Untracked items were
`docs/hosted-schema-compatibility.md`, `docs/local-supabase-verification.md`,
`frontend/e2e-local/`, `frontend/playwright.local.config.ts`, and `tools/`.
The employment migration had no working-tree diff. Preserve and review these
changes: the compatibility report, local harness, and browser tests are not yet
part of the HEAD checkout. Ignored CSV evidence and `/tmp` reconstruction
artifacts also will not accompany a clone.

[Phase 2 implementation notes](phase-2-employment.md) retain earlier verification
limitations, and [local verification notes](local-supabase-verification.md) retain
historical empty-schema/stopped-stack findings. Their supersession notices point
to the later compatibility report; do not interpret historical findings as the
current reconstructed database state. The supplied handoff's function list also
omitted the validator noted above. Manual gameplay verification remains unfinished.

## Finish local manual verification

The wrapper defines project `team6310-phase2-verification`, API
`http://127.0.0.1:55321`, PostgreSQL `127.0.0.1:55322`, and Studio
`http://127.0.0.1:55323`. Startup disables migrations and seeding. The local notes
record a Studio restart preserving the playthrough count and full-row checksum.
Current container availability and database contents were not queried here.

Resume from the repository root, using Node 24:

```bash
nvm use 24
python3 tools/local_supabase.py start
python3 tools/local_supabase.py status
python3 tools/local_supabase.py frontend-env
cd frontend
npm run dev -- --mode verification --host 127.0.0.1 --port 5173 --strictPort
```

Confirm browser API traffic targets port 55321 before creating runs. In Studio,
open `/project/default/editor`, select `public.playthroughs`, and filter by the
application's run UUID. Inspect `playthrough_id`, `current_balance`, `current_day`,
`current_job_id`, `status`, and `employment_state` without saving cell edits.
Studio has administrative local access, unlike the participant session.

Record manual results for selection versus submission, both hiring/payday routes,
financial persistence, refresh at recaps, uncertain-request recovery, completion,
and CAC replay. Inspect JSON stages, revisions, receipts, and `creditedDays`.
Do not reset or rebuild the existing reconstruction to resume testing. Before
deleting disposable local runs, inspect incoming foreign keys and delete actions;
no cleanup is authorized by this handoff.

## Deployment safety and next steps

Never contact or modify hosted Supabase without explicit authorization. Do not
automatically apply migrations, reset a database, backfill markers, or repair
legacy runs. After manual verification, present the exact artifact and the
[documented deployment/rollback sequence](hosted-schema-compatibility.md#hosted-deployment-sequence--not-executed)
for review:

1. Preserve an approved secure backup and schema snapshot outside Git. Obtain
   authorization for hosted inspection; run the read-only
   [preflight queries](../supabase/tests/inspect-employment-preflight.sql), compare
   current structure, roles, grants, policies, constraints, and content readiness
   against the evidence, and resolve drift.
2. Reconfirm the migration checksum, review all three functions and trigger, and
   coordinate a pause in new-run creation. Obtain explicit deployment approval.
3. In one SQL Editor execution, set
   `SET cac.employment_security_reviewed = 'on';` followed by the exact migration.
   Do not rely on session reuse across requests or bypass the review gate.
4. Verify owners, security modes, search paths, EXECUTE grants, trigger, RLS, and
   unchanged legacy rows. Coordinate frontend release and any API cache reload.
5. With authorization for disposable hosted test runs, verify a new marker,
   complete employment/payday flows, persisted balances, duplicate protection,
   refresh/lost-response recovery, CAC replay, and preservation of existing runs.

If deployment fails, preserve the failure and investigate; do not weaken checks.
After commitment, prefer a reviewed forward correction and controlled maintenance
or RPC access revocation. Preserve financial history, receipts, runs, and content;
never use a hosted reset or destructive schema recreation as rollback.
