# CMS Stage 1: draft scenario workspace

Implemented locally November 16, 2026. No hosted migration, publication, commit or deployment was performed.

## Interface

Employee dashboard → **Scenario workspace**. Choose a published source and name,
then explicitly Create draft. Saved CMS drafts can be reopened by any active CAC
staff member. Search and persona filters apply to the global draft scenario list.
Select a scenario or New scenario. Title, description, category and one persona
(or general/unassigned) are editable. Save re-reads the database before confirming
success. Reload draft discards changes only after confirmation. Unrelated copied
fields, choices, facts, evidence, schedules, flags and financial definitions remain
unchanged. Unsaved changes are guarded within the workspace and on link navigation
or page unload; switching to the published viewer retains the mounted editor.

New scenarios are ordinary, unscheduled, have no choices/facts yet and receive an
unused D061–D999 key. They are drafts, not playable/publishable scenarios. General
scenarios remain subject to the existing gameplay selectors. No publication,
branching, statistics editing, bill/persona editing, timeline or fact editor is
included. Stage 2 requires separate authorization.

## Forward database contract

`20261117020650_cms_scenario_workspace.sql` adds:

- `content_versions.cms_managed` and unique edition numbers.
- Private workspaces, ID lineage, and save receipts/audit records, all with RLS.
- Authenticated-callable `cms_list_drafts`, `cms_read_draft`, `cms_create_draft`,
  and `cms_save_scenario`. Each rechecks active staff; no browser table writes.
- Per-workspace optimistic revision checks and idempotent request IDs.
- CMS edition/content guards against publication, reassignment, deletion and
  maintenance writes. No UI publication RPC is introduced.
- Edition allocation under advisory lock `(6310,1115)`, also used by the current
  source publisher. All edition INSERTs allocate their number inside the trigger;
  callers must use the returned number rather than assume their requested number.

Draft creation snapshots all edition content in one query, then copies in one
transaction. Fresh UUIDs and persisted source→draft mappings preserve job/persona,
scenario/choice/destination, bill, support-effect, statistic, fact and metadata
relationships. Cross-edition dependencies fail closed. Generated job income is
recomputed by PostgreSQL. Categories and annual service/fact registries stay shared
and read-only. Price values and their source snapshots are copied unchanged.
Original IDs and historical gameplay are not updated or deleted. Creation retries
return the same workspace; reopening never creates another draft. Save receipts
record actor, input, result and time. Creation attribution is on the workspace.

The BLS importer requests `cms_managed` and excludes CMS drafts even when explicitly
requested. Install the database migration before deploying this importer change.
CMS content guards also deny service-role maintenance writes if an older importer
still tries to target a CMS draft. The SQL unique index fails closed if a target
installation already contains duplicate edition numbers; inspect rather than
renumber historical editions.

This is a forward migration, not a baseline schema reconstruction. It expects the
verified current tables, including `scenario_edition_prices`. The older local
verification stack lacked only that dependency; the explicit local compatibility
SQL in `tools/local_sql/cms_price_compatibility.sql` created the empty current-shape
table. It is not a hosted migration, and not part of routine startup. Existing
migrations were not replayed. Review hosted drift and apply the new forward
migration only through separately authorized deployment.

## Local verification

- Frontend format, lint, typecheck, 461 tests passed (two opt-in tests skipped),
  production build passed.
- Python BLS importer suite: 50 passed, including implicit/explicit CMS exclusion.
- `supabase/tests/cms-workspace.sql`: rollback-only local tests of complete copy,
  cycles, evidence and eligibility retention, price snapshot copying, persistence,
  retries, stale and invalid saves, publication/maintenance denial, direct browser
  writes, non-staff/public/revoked access, historical content and gameplay hashes.
- `tools/test_cms_concurrency.py`: independent overlapping sessions verified stale
  save rejection and collision-safe numbering. Uses an existing local CMS draft;
  saves identical scenario values and increments its revision. Removes only its
  two explicitly generated non-CMS numbering fixtures.
- `frontend/e2e-local/cms.spec.ts`: genuine local Supabase Auth/API and Chromium;
  draft creation, create/edit/save, full-page reload and reopen, desktop/mobile,
  and no horizontal overflow at 390px. No network response mocks.

Run the SQL suite only against `supabase_db_team6310-phase2-verification` using
`psql -v ON_ERROR_STOP=1`; its fixtures roll back. The concurrency test targets
that fixed container. The browser test uses the existing local Playwright config
and an explicit private `CMS_BROWSER_FIXTURE` produced by
`tools/staff_browser_fixture.py create`; do not use hosted credentials. Its local
staff account and draft are deliberately retained for interface inspection. The
fixture JSON stays private under `/tmp`, never in Git. Browser screenshots are
under the ignored `frontend/test-results/cms-*/` folder.

Future supporting-copy UI must label `verified` **Eligible for gameplay display**,
preserve existing eligibility/evidence unless explicitly edited, and default new
facts to false. No reviewers, attestation or automatic text/statistic bindings.
