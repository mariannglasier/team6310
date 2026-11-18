# Scenario fact authoring — November 17, 2026

Implemented inside the existing Scenario Editor, separately from CAC Service
Facts. No changes to gameplay rendering, selection, financial rules, statistics,
annual CAC registry, bill/persona/job editing or publication.

## Schema and presentation

Scenario supporting copy is `public.scenario_fact_copy`, identified by the
composite primary key `(scenario_id, version_id, fact_role)`. There is no fact UUID.
The role is `general` or `cac`: at most two records per scenario. These are NOT
`cac_service_facts` or `statistics` records. The existing recap RPC selects eligible
copy by committed event/edition, and the renderer calls it Community fact,
About this decision (general context), or CAC impact. There is no fact sampling
change in this implementation. The older admin viewer does not query this table;
its statistics/service panels show different reference systems.

The new Scenario facts section exposes final text, HTTPS source URL, optional
reporting period, fact/context type, and **Eligible for gameplay display** (stored
as `verified`). Existing roles are fixed identities. New entries are created by
Add general fact or Add cac fact; available actions prevent duplicate roles.
Confirmation stages a removal in the form; it takes effect on Save Changes.
No separate review, attestation or approval step exists.

Semantic keys and arbitrary JSON evidence are displayed read-only in Technical
details. They are not automatic numerical bindings. Existing values are never
sent back as writable input and are preserved server-side. New entries get a
server-generated stable `cms:<uuid>` semantic key, empty default evidence and
eligibility false unless the administrator explicitly enables it. Key generation
has no gameplay selection or service-link meaning. Source/period are attribution
metadata, not a request to rewrite reference observations or gameplay amounts.

## Persistence

Forward migration `20261117203330_cms_scenario_facts.sql` adds facts to the staff
read RPC and introduces `cms_save_scenario_content`. This wraps the existing atomic
scenario/choice operation and saves fact changes in the same transaction and
workspace revision. Existing save RPCs remain compatible and do not change facts.
No browser table-write grants or public content policies were added.

The fact payload is an explicit role list for only the selected scenario. Existing
rows carry `original_role` and must match scenario/edition; role identity cannot
be changed. Unknown fields (including supplied scenario/version/evidence/key)
are rejected. New roles have null original identity. Removing and re-adding a role
before saving replaces it with new default provenance rather than silently
reusing the removed row. Ordinary edits update selected columns in place,
preserving semantic keys/evidence and omitted eligibility/period values.

Expected revision, staff authorization, request receipts, duplicate request
checks, published-edition guards and source isolation are retained. Invalid input
rolls back the entire operation. The successful result is reloaded before the UI
confirms saving. Facts are included in dirty-state checks and page-unload guards.

Existing draft creation already snapshots and copies scenario_fact_copy, remapping
scenario/edition while preserving role, text, key, evidence, period, copy type and
eligibility exactly. No baseline reconstruction or copy-function replacement was
needed. This migration was applied locally only; hosted rollout is not performed.

## Verification

- `supabase/tests/cms-facts.sql`: published source copying, edited/deleted/new facts,
  new eligibility false, explicit eligibility changes, arbitrary evidence and
  semantic-key retention, read/reopen, idempotent retries, stale revisions,
  foreign/invalid relationships, invalid copy rollback, source immutability and
  non-staff/revoked/anonymous access denial.
- Existing copy/preservation, choice, draft-deletion and scenario-deletion SQL
  suites passed against local Supabase; test content rolls back.
- 466 frontend tests passed (two opt-in tests skipped), including fact creation,
  ordinary fields/eligibility, role limits and removal confirmation/cancellation.
- Real local Chromium tested facts across full-page reload after creation, editing,
  eligibility change and deletion, alongside the existing scenario/choice saves,
  mode switching, scenario/draft deletion and mobile checks.
- Format, lint, TypeScript and production build passed.

Only local verification data was written. No hosted mutations, commits, pushes,
or deployments. Evidence editing and a general fact/source registry are intentionally
not provided; annual CAC facts and structured statistics remain outside this editor.

## UI refinement and integrity review

Each entry now uses the Choices section's native details/summary interaction.
Collapsed summaries show the role, copy type, eligibility, reporting period and
text preview. Controls remain mounted, so collapsing preserves unsaved text.
Invalid fields automatically open their entry during native form validation.
Deletion still requires confirmation and remains pending until Save Changes.

Gameplay colors are positional, not fixed role colors: `scenarioFacts.css` uses
blue `#dcebf9` for the first displayed card and green `#e6eadc` for the second.
`ScenarioFacts.tsx` puts eligible general copy first and filters CAC copy by support.
The editor reuses that card styling and finance palette, border (18% `#0f4e7c`
over transparency) and text (`#10121a`). General is blue; CAC is green when there
is eligible general copy, otherwise blue. This previews the supported display;
the editor retains ineligible content and does not change gameplay filtering.

Review confirmed the composite primary key and save RPC both enforce one fact per
role. Copying preserves composite relationships and arbitrary evidence; evidence
and semantic keys have no dependent child records to orphan on fact removal.
Staff checks, workspace locking, source isolation, revision checks and request
receipts remain in the protected operation. Facts share the scenario/choice
transaction, including rollback on invalid input. No migration changes were needed.

One client integrity issue was corrected: the save helper previously converted
missing fact data into an empty deletion list. It now rejects missing fact data
before sending a request. An explicit empty list still permits intentional removal
of all facts. Regression tests cover both cases; SQL tests additionally reject
duplicate roles and evidence overrides without changing draft content or revision.

Refinement verification: 469 frontend tests passed (two opt-in tests skipped), all
five local CMS SQL suites passed, and Chromium passed the CMS flow including
collapse/edit/reopen, confirmation, blue/green styling and mobile overflow checks.
Formatting, lint, typecheck and production build passed. Only the isolated local
verification environment was used; no hosted migration or deployment occurred.
