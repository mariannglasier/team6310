# CMS Job Editor — November 18, 2026

Implemented locally in the shared draft workspace. No publication controls,
gameplay calculation changes, persona job assignment editing or hosted changes.

## Verified schema and authoring contract

`public.jobs` has 25 columns. The existing viewer is `JobsPanel.tsx`; individual
job loading is in `frontend/src/services/contentService.ts`. The verified schema,
not illustrative prototype data, supplies this field contract:

| Fields | CMS behavior |
| --- | --- |
| `title`, `soc_code` | Authored text. SOC format NN-NNNN, unique per edition. |
| `description` | Nullable authored text. |
| `area_code`, `area_name`, `geography_level` | Explicit authored location; geography is MSA or STATE. |
| `median_hourly_wage` | Optional nonnegative exact USD amount, at most two decimals. No invented wage. |
| `hours_per_week` | Explicit hours greater than zero and at most 168, at most two decimals. No automatic 40-hour default. |
| `wage_year` | Nullable integer, 2000–2100. |
| `entry_education`, `related_experience`, `on_job_training` | Nullable descriptive source metadata; editing does not implement additional eligibility rules. |
| `needs_english_skills`, `needs_computer_skills` | Nullable booleans: Yes / No / Not configured. Existing individual employment validation requires explicit flags. |
| `simulation_requirements` | Existing JSON object preserved. Only its displayed string `notes` is exposed through the virtual `requirements_notes` save field. No arbitrary JSON or speculative legacy-rule controls. |
| `wage_source_url`, `requirements_source_url` | Required wage source and nullable requirements source. Existing database allows plain text; no new URL-format restriction. |
| `reviewed_at` | Nullable explicit source timestamp interpreted by PostgreSQL; no automatic review/attestation. |
| `is_approved`, `is_active` | Existing availability flags, initially false. Active requires approval, wage, wage year and review timestamp. These do not publish a draft or create an approval workflow. |
| `weekly_gross_income` | Read-only stored generated column: `round(median_hourly_wage * hours_per_week, 2)`. Null wage yields null gross. Display refreshes after saved readback; no independently editable income. |
| `job_id`, `version_id` | Internal stable identity/ownership; new IDs generated server-side. |
| `created_at`, `last_synced_at` | Read-only timestamps; source-sync values are preserved. |

Seven fields must be explicitly supplied for a new job: title, SOC, area code,
area name, geography, hours and wage source. An inactive draft can have no wage,
year, skills, review timestamp or descriptive fields. Optional empty inputs are
not converted into speculative content. Existing valid legacy values, including
null skills, blank source metadata and non-string JSON notes, survive unrelated
edits because existing jobs submit a changed-field patch only. Explicit monetary
changes must be finite exact decimals; unchanged historical values are retained.
PostgreSQL column limits and generated-income overflow checks still apply.

## UI

`JobEditor.tsx` adds a Jobs tab beside Scenarios and Personas. It uses the same
workspace, revision, navigation/discard protection and reload workflow. The draft
library includes inactive/unapproved jobs, title/SOC search, selected state and
the shared DeleteControl. Four compact form groups cover Job details, Wages and
area, Requirements, and Sources and availability. Generated gross and source-sync
metadata are read-only. Field explanations use shared FieldInfo; required fields
use the shared asterisk/legend. Missing skill flags on active content remain a
visible warning, not a newly imposed draft completeness requirement.

## Protected persistence

Forward migration `20261118074410_cms_job_workspace.sql`:

- Wraps the existing staff-only `cms_read_draft` to include all edition-owned jobs,
  retaining prior scenario/persona/expense bundles and revoking client access to
  the internal wrapper.
- Adds `cms_save_job(version, revision, request, job, fields)`. Allowlisted fields,
  staff authorization, unpublished CMS ownership, stable existing IDs, generated
  new UUIDs, constraints, shared workspace revision and actor-bound retry receipts
  commit atomically. No browser table writes, generated income assignments or
  job-to-persona reassignments occur.
- Adds `cms_delete_job(version, revision, request, job)`. Named UI confirmation,
  staff/revision/receipt checks and table locks precede dependency checks. Persona,
  playthrough, group session/vote references block deletion. The dependency scan
  includes every inbound foreign key (including future cascading keys), plus
  stored job IDs in employment JSON/receipts. Any gameplay tied to the draft
  edition also blocks changes. Unexpected dependencies roll back the operation.
  Only the unreferenced draft job and its draft lineage record are removed.
- Preserves existing RLS, published-content guards, gameplay and importer isolation.
  New RPCs grant execution only to authenticated callers and check staff status
  inside the database; private history/internal read helpers are not exposed.

Existing `cms_create_draft` already copies jobs with fresh UUIDs and lineage,
remaps `personas.starting_job_id`, excludes generated columns and lets PostgreSQL
recompute gross. No copy rewrite is needed. Fresh authored jobs have no source
lineage; copied IDs remain stable on edit. Published rows and persona weekly income
are unchanged, even when the copied job's wage is edited.

Save is explicit. Successful saves are read back through the protected bundle and
replace the form baseline. Failures retain edits. An uncertain save or failed
readback locks inputs and retries the identical request/payload/revision before
further editing, avoiding duplicate creations. All editors share one revision:
a concurrent Scenario or Persona save can make a Job edit stale. Reload/reopen
retrieves the stored content; unsaved edits remain memory-only and refresh loses
them subject to the existing navigation/beforeunload warnings.

Job update locks prevent concurrent insertion of historical references while
checking safety; deletion also locks all inbound dependency tables. Operations
use a five-second lock timeout and explain busy/retry failures. These locks are
brief but may contend with local gameplay writes. This intentionally conservative
historical protection never edits run state. A reference-blocked job has no force
delete or automatic reassignment path.

## Verification and remaining scope

Coverage lives in `jobFields.test.ts`, `JobEditor.test.tsx`, service RPC tests,
`supabase/tests/cms-jobs.sql`, `tools/test_cms_jobs_local_api.py`, and the genuine
local Chromium `e2e-local/cms-jobs.spec.ts`. They cover exact money, generated
income, copy/lineage, partial legacy preservation, CRUD/reopen, references,
rollback, staff/public/revoked access, retries and overlapping Job/Persona saves.
Existing Scenario/Persona suites are regression coverage.

Publication, source-import configuration, job assignment authoring, new eligibility
rules and arbitrary requirements JSON editing remain outside this milestone.

Final local verification: formatting, lint, TypeScript and production build passed;
536 frontend tests passed (two existing opt-in tests skipped). All eight CMS SQL
suites passed. Both genuine Persona and Job Auth/API suites passed, including
shared-revision overlapping saves and unchanged historical gameplay fingerprints.
All four Chromium journeys passed: Scenario, Persona, expenses and Jobs. The Job
journey covers creation, legacy selection, explicit save, lost readback/idempotent
recovery, generated gross, reload/reopen, reference-blocked and successful deletion,
keyboard FieldInfo and a 390px layout with no horizontal overflow. The build emits
a bundle-size warning; no unrelated bundling changes were made. The migration was
applied only to the fixed local verification database. No hosted changes, commits,
pushes or deployments.
