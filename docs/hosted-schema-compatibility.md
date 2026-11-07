# Phase 2 hosted-schema reconciliation and local verification

## Recommendation

**READY FOR HOSTED DEPLOYMENT REVIEW.**
The exact migration is structurally compatible with the supplied schema export
and has passed real local Supabase API/PostgreSQL/browser tests. The new
single-result preflight export resolves the outstanding hosted security-evidence
and published-persona skill-configuration gaps. No further schema or permission
changes are indicated by these findings.

This is a deployment-review recommendation, not authorization to apply anything.
Keep the migration's explicit acknowledgment gate. Apply only through the reviewed
sequence below after separate deployment authorization and confirmation that the
hosted structure has not drifted from the evidence snapshots.

No hosted connection, SQL, migration, data mutation, permission change or
publication was performed. The production migration itself did not need changes. Tested migration SHA256: `f86fc512a76848b121608d3fe4271b9d9ac849673ef165a93c54d472dee98734`.
The original migration history remains unchanged.

## Evidence and compatibility

Source: ignored user-supplied docs/local/database-schema.csv; SHA256:
`bec4a6fb9d2aaa3887a7a33c697da678e307b61eff999d140fca8e0a8480cce1`.
5,611 structural catalog rows. No hosted participant/content data was imported.

| Area | Export finding and implementation compatibility |
| --- | --- |
| playthroughs | All 13 columns match loader/RPC references. employment_state is nullable JSONB; balance is unbounded numeric; day is nullable smallint; status is nullable text. |
| Status/day constraints | The export lists six playthrough FKs and its PK, with no CHECK constraint. completed/ended and pre-game represented by stage with current_day=1 work locally without constraint changes. This finding is supported by populated constraint sections, not an empty section alone. |
| Defaults | Several original IDs/current_scenario_id/version_id have gen_random_uuid defaults. The existing start RPC supplies explicit null scenario/job/support/employment fields, avoiding unintended FK values. |
| Job link | current_job_id FK references jobs(job_id), with default NO ACTION update/delete behavior. Same-edition eligibility is enforced by RPC validation, not a composite FK. |
| Other FKs | Persona/version/scenario links have exported cascade actions; owner-user deletion sets owner to null. These inherited deletion behaviors are reproduced, not changed by Phase 2. Do not delete referenced content during rollback. |
| Ownership/RLS | All 15 exported public tables are owned by postgres, RLS enabled, FORCE RLS false. The definer owner selected by the migration will therefore be postgres and bypass these table RLS policies as table owner. The final preflight confirms postgres is nonsuperuser with BYPASSRLS. |
| Participants | Exported table and column privileges give authenticated SELECT/INSERT on playthroughs, not direct UPDATE/DELETE. Own-read and constrained own-insert policies match the code. |
| Service role | The full export DOES contain service_role table privileges, including playthrough UPDATE/DELETE. This supersedes the earlier partial finding of no grants. Phase 2 does not depend on service_role for gameplay. |
| Creation RPC | Exported start_individual_playthrough remains SECURITY INVOKER, empty search_path, UUID result and original Day 1/null state. It accepts any nonnull auth.uid; Phase 2 independently requires the anonymous JWT claim. |
| Skills/income | The four nullable skill flags are present. Jobs have generated numeric(12,2) weekly_gross_income, wage/hour checks and published-job immutability. No skill-column migration is required. |
| Functions/default grants | Public/postgres function defaults grant EXECUTE to anon/authenticated/service_role. The actual migration removes those grants from its three new functions, then grants only gameplay EXECUTE to authenticated. Existing creation/job-guard ACLs are preserved. |
| Trigger paths | No exported playthrough trigger exists before Phase 2. The new AFTER INSERT trigger checks anonymous ownership, started_at, persona/edition publication and balance before stamping an eligible fresh run. Registered/maintenance/mismatched inserts remain unstamped. |
| Legacy records | Migration application does not backfill. Local before/after snapshots of null and unsupported records remained identical. |

## Final hosted preflight evidence

Source: docs/local/inspect-employment-preflight-results.csv; SHA256:
`7ec79e4fc7d2b6781c5d47817e8bca9f979d810b5d56a8ddc6f6dd757bb41e25`. The single deployment_preflight result confirms:

- Execution identity: current_user and session_user are postgres.
- anon/authenticated: nonsuperuser, no BYPASSRLS, no membership in the
  playthrough-owner role. These checks cover transitive membership; interpreting
  the earlier export's arrow direction is no longer necessary for this boundary.
- authenticator: nonsuperuser, no BYPASSRLS, NOINHERIT and no owner-role membership.
- postgres: nonsuperuser with BYPASSRLS. Both definer functions are explicitly
  assigned this existing table owner. Their elevated access remains deliberately
  bounded by ownership/intent validation; no claim of a restricted definer role
  is made.
- service_role: nonsuperuser with BYPASSRLS, no owner-role membership. This is not
  a participant role; no service key is used by the gameplay frontend. The new
  functions' ACL normalization still removes its default EXECUTE grants.
- Published personas missing English/computer skill flags: empty list.

The earlier supplied fallback-count result showed three approved active no-skill
jobs in published edition fccbe3fe-be0b-4cdc-b6c3-4adb540e3dd1, exceeding the minimum
of two. That was the prior result file, before replacement by this combined
preflight export. No hosted data was changed to satisfy these checks.

No outstanding blocker identified by this review remains. Retain ordinary release
safeguards: approval of the exact artifact, a current backup, drift check, controlled
rollout and post-deployment verification. These are operational steps, not a need
for additional participant permissions or changes to published content.

## Reconstruction: supported definitions versus differences

`tools/reconstruct_local_schema.py` generates application-schema.sql only in the
isolated /tmp workdir. It is a reconstruction for current structural testing,
not original historical DDL, not a baseline migration and not a hosted installer.
It recreates 15 public tables using exported types, nullability, defaults,
generated columns, constraints, indexes, ownership/RLS, policies, public routines,
the existing jobs trigger and table/column grants. It also recreates exported
public/postgres creation defaults. Local Supabase supplies native Auth/API/system
objects; their hosted copies and global role configuration are not overwritten.

Local catalog audit passed:

- 124 public column types/nullability/default/generated/identity definitions;
- 54 constraints, 18 indexes and 15 table owners/RLS settings;
- 19 policy expressions, roles/commands/modes and exported names;
- 1,684 effective API-role table/column privilege checks.

Export limitations are explicit:

- Some concatenated object_name values are truncated to 63 characters. Four
  constraint identifiers and two policy identifiers are at that boundary. Their
  exported definitions were restored; truncated names were not invented/expanded.
- One column-grantee label ends in authenticate. That ambiguous row is omitted;
  exported authenticated table-level SELECT already grants the same effective
  access to that column. No participant grant was invented to resolve it.
- Original dropped-column attribute-number gaps are not recreated. Queries use
  named columns, so this does not affect gameplay; it is not a bitwise clone.
- information_schema column grants may reflect table grants. Reconstruction
  preserves effective privileges, not exact original ACL provenance.
- The original schema export omitted role attributes; the final preflight supplies them for the five relevant roles. Full global configuration, database locale,
  server version and index readiness flags are not fully established by this
  export. Local PostgreSQL 17.11/native Supabase roles remain separate evidence. The local postgres role is not superuser but does have BYPASSRLS; anon/authenticated are nonsuperuser/non-BYPASSRLS. The later hosted preflight confirms matching attributes for these roles; unrelated system-role configuration is not claimed to be identical.
- Synthetic local draft/published versions, personas/jobs and expense definitions
  are test-only fixtures. They do not validate hosted content values or alter any
  hosted published edition.

## Repeatable local verification

Prerequisites and isolated targeting are described in local-supabase-verification.md.
Commands from repository root, using the fixed local Unix Docker socket:

```bash
python3 tools/local_supabase.py start
python3 tools/local_supabase.py frontend-env
python3 tools/reconstruct_local_schema.py
```

On an EMPTY isolated application schema, restore the generated structure:

```bash
docker --host unix:///var/run/docker.sock exec -i supabase_db_team6310-phase2-verification \
  psql --host /var/run/postgresql --port 5432 -U postgres -d postgres \
  -q -v ON_ERROR_STOP=1 -f - < /tmp/team6310-phase2-verification/application-schema.sql
python3 tools/verify_employment_local.py
python3 tools/audit_local_catalog.py
python3 tools/verify_employment_edges_local.py
```

The verifier refuses preexisting persona content, creates local Auth users and
synthetic fixtures, creates legacy records BEFORE deployment, sets the review
acknowledgment ONLY on its isolated local connection, and executes the actual
20261103000000_employment_gameplay.sql unchanged. It does not call db push,
use a linked project, rewrite historical migrations or import hosted users.
Reset only through local_supabase.py reset before a complete rerun. Do not run
root migration history over this reconstruction; it already reflects those
historical structural effects.

Real browser test (no mocked local API responses):

```bash
cd frontend
LOCAL_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e -- --config=playwright.local.config.ts
```

Two live employment tests (1280px and 320px) passed; the earlier empty-schema infrastructure test is
intentionally skipped once fixture.json exists. The verifier/browser create only
disposable local accounts and runs. The stack is left running for inspection;
stop with `python3 tools/local_supabase.py stop`. Reset removes local test data.

## Actual integration results

The exact migration applied successfully against the reconstructed public schema.
All three resulting functions were inspected: postgres ownership, the intended
definer/invoker flags, fixed empty search paths, and only intended authenticated
RPC execution. service_role/anon had no new-function EXECUTE. Playthrough RLS
remained enabled without FORCE; native local Auth was used, not replacement SQL
Auth functions.

Passed actual Auth/API/PostgreSQL tests:

- Existing creation and fresh initialization; preserved legacy null/unknown JSON;
- ordinary/CAC preparation, job eligibility, application, both interview outcomes,
  owned clothing, affordability ending, Day 2/3 hiring and both payday schedules;
- completion/early ending protection, acknowledgment without another credit;
- unauthenticated/registered/cross-participant rejection and own-row RLS reads;
- malformed types/extra fields, invalid/cross-edition jobs, invalid replay sources,
  missing day, textual/unknown document versions, retries and altered intent;
- same-revision actions on two independent PostgreSQL connections: one commit;
- concurrent real API day-10 advancement: exactly one wage credit;
- denied cross-owner action while another connection held the target row lock:
  ownership rejection without waiting or lock timeout;
- injected local CHECK failure: complete state/receipt/balance rollback;
- direct authenticated UPDATE/DELETE denied.

Passed actual UI tests: creation, explicit selection/submission, refresh of
preparation/application/reapplication/interview/income/completion/ending recaps,
real server commitment followed by a dropped HTTP response, request reconciliation
without duplicate clothing cost, CAC replay and independent browser-participant
isolation. Existing expense definitions stayed visible without deductions.
These are distinct from prior mocked browser and PGlite fixture tests.

## Hosted deployment sequence — NOT executed

1. Preserve a secure current backup and schema snapshot using approved operational
   tooling. Do not place credentials or participant backups in Git.
2. In Supabase SQL Editor run only the read-only queries in
   supabase/tests/inspect-employment-preflight.sql. Confirm current/session user,
   postgres ownership, owner-role memberships/attributes, API-role memberships,
   RLS/FORCE flags, actual constraints, default grants and data readiness. Compare
   against the snapshot and resolve drift before continuing.
3. Review the three function definitions, trigger and intended ACL removals. The
   owner is deliberately the existing table owner, not a new restricted role.
   No new participant table grants are needed. Pause new-run creation during the
   coordinated release; keep older runs read-only when unsupported.
4. After explicit deployment approval, in ONE SQL Editor execution set
   `SET cac.employment_security_reviewed = 'on';`, then include and execute the exact migration
   file once in that same execution (do not rely on session reuse between separate dashboard requests). Its BEGIN/COMMIT makes object creation/ACL normalization atomic.
   This acknowledgment does not substitute for the preceding review.
5. Reinspect the three functions' owners/security/search paths/ACLs, the trigger,
   and playthrough RLS. Confirm no legacy rows changed. Refresh the API schema
   cache if necessary using the approved dashboard/PostgREST reload procedure.
6. Release the frontend build, then smoke-test only specifically authorized
   disposable deployment-verification runs. No historical unmarked run becomes
   initialization-eligible after migration. Do not repair it by adding a marker.

No Auth dashboard setting changes, anonymous-user registration UI, additional
table grants, content publishing or data backfill are required by this migration.
Native anonymous sign-in must already be enabled as the existing application
requires. Any hosted operational smoke test requires separate authorization.

## Non-destructive rollback and recovery

Before COMMIT, an error rolls the migration transaction back. Do not modify checks
or data to force it through. Save the failure and investigate locally.

After deployment, prefer a reviewed forward correction. To stop new gameplay,
place the UI in read-only maintenance mode and, with operator approval, revoke
new gameplay RPC EXECUTE from authenticated. Do not delete the functions,
JSON documents, receipts, runs or content. If new-run marking must also stop,
disable only mark_fresh_employment_run through a reviewed change; coordinate
creation pause so new unmarked runs are not stranded. Preserve the jobs guard.

Already committed financial outcomes are historical records, not transaction
failures to erase. No blanket reversal/reset is proposed. Reenable access only
after a tested correction; unknown document versions remain read-only. Retain
request receipts for reconciliation and all referenced content. Never use a
hosted reset, drop/recreate schema, replay browser balances, or delete editions
as rollback.

## UI correction found by live narrow-screen verification

The 320px live test initially could not activate Confirm selection because the
Review panel's CSS zoom kept changing. useFitScale assumed a proportional height
change, but zoom also changes line wrapping, so its ResizeObserver loop could
oscillate between layouts. The fit calculation now only shrinks during a sizing
cycle and resets on a true viewport resize. The minimum scale and Figma tokens
are unchanged. No employment rules or authoritative state handling changed.
The live browser test waits for committed recaps before refreshing; it does not
force-click unstable controls or fabricate server responses.

Final frontend checks passed: formatting, lint, typecheck, 223 unit tests and
production build. Four local-command safety tests and Python compilation passed.
The 320px real flow passed after the zoom correction; the desktop real flow passed
before it, and all 12 existing mocked responsive setup/financial-layout checks passed afterward. These are not counted as live database tests.
