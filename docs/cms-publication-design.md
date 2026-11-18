# CMS publication — minimum viable content contract and implementation

Updated November 18, 2026 after manual review. This policy supersedes the earlier
strict completeness, mandatory tax/fact-variety and group-readiness publication
contract. Historical migrations and publication audits remain unchanged.

## Approved policy

One canonical published edition serves individual and group interactions. Individual
content is the source of truth. Group implementation defects do not become a second
content-authoring standard. Publication tooling is locally verified; **group demo
compatibility is not established** and known failures remain below.

The minimum is **one usable persona and two usable jobs**. In actual employment
initialization, the two jobs must be active, approved and explicitly require neither
English nor computer skills. This is the existing initialization contract, not a
new eligibility rule. Every offered persona and active approved job must satisfy
the current loaders and required financial/relationship constraints.

Scenarios, bills, scheduled scenarios, facts, eligible facts, supporting copy,
variety, complete decision trees and optional employment metadata are not required.
Optional content may remain incomplete, with useful warnings. Drafts can always
remain incomplete; publication checks the entire saved edition and never repairs
content. Existing structural corruption and actual publication-guard failures remain
blockers. There is no equality-based bypass or special grandfathered edition.

## Verified architecture and preserved protections

- `content_versions`: UUID identity, immutable allocated smallint edition number,
  `status`, `published_at`, `cms_managed`. Published read RLS requires published
  status and timestamp. Numbers are allocated at draft INSERT as max + 1 under
  advisory lock `(6310,1115)`, plus a unique index. Publication does not renumber.
- `cms_private.workspaces`, `lineage`, `receipts`: private draft ownership/source,
  shared revision, source-to-draft UUID mapping, actor-bound save retry receipts.
  `cms_create_draft` snapshots all twelve owned tables, remaps relationships and
  choice ordering, retains shared reference IDs and recomputes generated job income.
- Owned tables: `jobs`, `personas`, `scenarios`, `choices`, `persona_expenses`,
  `statistics`, `scenario_statistics`, `cac_support_effects`,
  `scenario_library_metadata`, `scenario_fact_copy`, `scenario_bill_links`,
  `scenario_edition_prices`. Statistics remain read-only.
- `cms_publication_preflight(uuid)`: staff-only STABLE, SECURITY DEFINER with empty
  search path; complete saved-edition deterministic read, no content writes. Returns
  revision, both publication heads, validator generation and affected records.
- `cms_publish_draft`: database staff check, global allocation/publication lock,
  workspace lock, exact saved revision/validator/reviewed-head binding, table locks
  against conflicting writes and fresh preflight inside the transaction. A narrow
  transaction/actor/revision/request permit authorizes the lifecycle transition.
  Audit insertion, revision increment and permit consumption are atomic. Failure
  rolls back all effects. Direct publication writes remain denied.
- `cms_private.publications`: immutable actor/time/result/report audit. Identical
  actor-bound request retries return the original result **before** checking the new
  validator generation, preserving already completed v1 retries. Changed payloads or
  actors fail. New publications require `cms-publication-v2`, invalidating old reviews.
- `cms_list_publications`, `cms_read_draft` restore persisted outcomes. Unknown
  publication results retain the original request and lock authoring until resolved.
- Drafts are ineligible when not unpublished CMS workspaces, historically referenced,
  stale-reviewed, structurally invalid, or numerically overtaken by a published
  edition. A higher unpublished draft does not overtake an older draft.
  `cms_recover_draft` explicitly creates a new draft from the latest publication;
  old edits are preserved in the old draft, never merged automatically.
- Both default selectors must select the new publication. Previous published
  editions are immutable and retained; active runs/sessions stay pinned.
- BLS maintenance excludes CMS drafts; importer remains staging-only, not a reusable
  CMS publisher. The trusted development SQL builder is not an administrative RPC.

Original implementation migrations:
`20261118130044_cms_publication_contract.sql`,
`20261118130349_cms_publication_preflight.sql`,
`20261118131554_cms_atomic_publication.sql`.
The forward policy migration is
`supabase/migrations/20261118185602_cms_minimum_publication.sql`, applied only to the
fixed local verification database. No existing guards, tables, gameplay functions,
selectors, content or historical audit rows were changed.

## Entire rule catalog audit

The 51 stable identifiers below remain available internally for diagnostics and
historical reports. Request-bound checks may raise protected errors rather than
emit a finding. “Not emitted” means no publication finding and no UI category;
information was not merely renamed. Affected records remain in server diagnostics
as actual rows/IDs; the UI resolves names and conceptual locations instead.

| Internal code | Previous → current | Check, rationale and affected location |
| --- | --- | --- |
| `PUB-STATE` | blocker → blocker | CMS workspace/edition status and timestamp; only unpublished CMS drafts can transition. |
| `PUB-ACCESS` | blocker → blocker | Active database staff authorization, including retries. RPC denies nonstaff and anonymous callers. |
| `PUB-STALE-REVIEW` | blocker → blocker | Expected revision, validator generation and both reviewed publication heads must match. |
| `PUB-ORDER` | blocker → blocker | Allocated edition number must exceed every published number; both default selectors must select the result. |
| `PUB-HISTORY` | blocker → blocker | Inbound historical foreign keys and employment JSON references must not exist on draft content. |
| `REL-EDITION` | blocker → blocker | All twelve owned tables: referenced content must belong to the same edition. Shared registries are excluded. |
| `REL-CONSTRAINT` | blocker → blocker | Actual PostgreSQL CHECK constraints; additionally finite exact choice money and nonnegative upfront cost, including dormant records. |
| `PER-CATALOG` | blocker → blocker | At least one persona; every persona is offered by setup, with no enabled flag. |
| `PER-DETAILS` | blocker → blocker | Persona name/description and valid nonnegative starting balance; blank description breaks the current setup loader, rather than being merely cosmetic. |
| `PER-EMPLOYMENT` | blocker → blocker | Explicit skill booleans, no starting job and zero coalesced weekly income; initialization and unemployment contract. |
| `JOB-STARTABLE-CATALOG` | blocker → blocker | Two active, approved jobs explicitly requiring neither skill: actual initialize RPC minimum, not merely any two inactive records. |
| `JOB-VISIBLE-VALID` | blocker → blocker | All active approved jobs must load/apply safely: title, SOC, area, source, year, skill booleans, finite wage/generated income/hours. Optional education/experience/training/notes excluded. |
| `SCN-PLAYABLE-CONTENT` | blocker → warning | Incomplete reachable scenario narrative/category/choice text warns. Financial corruption is separately blocked under REL-CONSTRAINT; optional scenario completeness is not mandatory. |
| `SCN-ANSWER-AVAILABLE` | blocker → warning | A reachable scenario without a non-CAC answer warns; incomplete optional content is permitted. |
| `SCN-UNSUPPORTED-EFFECT` | blocker → blocker | A reachable choice with legacy cac_support_effects is explicitly rejected by submit_scenario_decision. Demonstrated selected-content failure, not a missing-content requirement. |
| `SCN-ROUTE-COVERAGE` | blocker → warning | Optional library pool exhaustion or ambiguous legacy scheduled slots warns. These may fail when exercised, but are not a requirement to author filler scenarios. |
| `EXP-DEFINITION` | blocker → blocker | Existing expense amount, fee, first day and repeat interval must be valid; no expense presence requirement. |
| `EXP-SCENARIO-COLLISION` | blocker → blocker | The unchanged guard_bill_publication rejects same-persona scenario/bill day collisions, including disabled scenarios. Actual transition failure remains blocking. |
| `FACT-STORED-VALID` | blocker → blocker | Existing fact role/owner/text/source/key must satisfy existing schema semantics. No new evidence or eligibility requirement. |
| `FACT-ACTIVE-ROLES` | blocker → warning | Missing general/CAC authored copy warns only for existing active events. No scenarios means no missing-fact findings. |
| `FACT-GENERAL-CONFLICT` | blocker → warning | Repeated eligible semantic copy is a variety warning, not a mandatory non-repetition guarantee. |
| `TAX-CONFIGURATION` | blocker → warning | Warn only if a D005 scenario is authored for the persona but has no reachable scheduled slot. No authored tax means no finding. |
| `TAX-EXACTLY-ONCE` | blocker → warning | An authored reachable D005 may be displaced or repeated: warning, not a mandatory tax requirement. |
| `PUB-MANDATORY-UNPROVEN` | blocker → blocker | Reviewed individual/safety function definition drift remains a maintenance blocker. Group functions are excluded; optional route/tax/variety proof is not required. |
| `PUB-SUPPORTED-MODE-FAILURE` | blocker → not emitted | Retired gate. All group startup, clothing, eligibility, upfront, income and bill mismatches are documented separately. D001 fact repetition is also not a gate. |
| `SCN-DORMANT-INCOMPLETE` | warning → warning | Disabled ordinary content lacks text/choices/copy; preserved as an optional authoring warning. |
| `SCN-UNEXPECTED-EXCLUSION` | warning → warning | General/unassigned, metadata-missing or otherwise excluded scenario: scheduling/applicability review, not a completeness gate. |
| `SCN-SCHEDULE-ALTERNATIVES` | warning → warning | Multiple library scenarios compete for a day; allowed but not guaranteed to appear. |
| `SCN-CONDITIONAL-DAY` | warning → warning | Day 2/3 employment exclusions or out-of-calendar schedule: review optional scheduling. |
| `SCN-DORMANCY-UNCERTAIN` | warning → warning | Reserved diagnostic; no new completeness gate is inferred from uncertainty. |
| `FACT-DISPLAY-INELIGIBLE` | warning → not emitted | Removed finding: false eligibility is an intentional authoring setting and an empty eligible result is supported. |
| `FACT-PROVENANCE-LIMITED` | warning → warning | Reporting period/evidence quality may need review. No attestation or invented evidence schema. |
| `FACT-VARIETY-UNCERTAIN` | warning → warning | Similar text/different semantic keys: optional variety review, no automatic binding or equivalence decision. |
| `FACT-CAC-REUSE` | warning → warning | Optional CAC copy variety warning; repetition is permitted. |
| `EXP-OUTSIDE-CALENDAR` | warning → warning | First due day after 30 is valid but produces no occurrence during this simulation. |
| `EXP-RECAP-MISSING` | warning → warning | A bill has no supporting context link. Payment/Ignore works independently; supporting copy remains optional. |
| `SCN-DORMANT-EFFECT` | warning → warning | Legacy effect retained only on excluded content; review before activation. |
| `PUB-SOURCE-BEHIND` | warning → warning | Older source alone is a warning. The allocated draft number, not source age, determines overtaken status. |
| `PLATFORM-GROUP-DIVERGENCE` | warning → not emitted | Removed from findings: group implementation issues belong in the compatibility record below. |
| `PLATFORM-FACT-HISTORY` | warning → not emitted | Removed from findings: no runtime fact-history/variety guarantee is required. |
| `INFO-EDITION-SNAPSHOT` | information → not emitted | Removed from findings: contextual/optional metadata or diagnostic snapshot, with no author action required. Retained internal identifier for historical audit compatibility. |
| `INFO-CONTENT-REACHABILITY` | information → not emitted | Removed from findings: contextual/optional metadata or diagnostic snapshot, with no author action required. Retained internal identifier for historical audit compatibility. |
| `INFO-FACT-DISPLAY` | information → not emitted | Removed from findings: contextual/optional metadata or diagnostic snapshot, with no author action required. Retained internal identifier for historical audit compatibility. |
| `JOB-OPTIONAL-METADATA` | information → not emitted | Removed from findings: contextual/optional metadata or diagnostic snapshot, with no author action required. Retained internal identifier for historical audit compatibility. |
| `INFO-INACTIVE-JOBS` | information → not emitted | Removed from findings: contextual/optional metadata or diagnostic snapshot, with no author action required. Retained internal identifier for historical audit compatibility. |
| `INFO-GENERATED-INCOME` | information → not emitted | Removed from findings: contextual/optional metadata or diagnostic snapshot, with no author action required. Retained internal identifier for historical audit compatibility. |
| `INFO-NEXT-METADATA` | information → not emitted | Removed from findings: contextual/optional metadata or diagnostic snapshot, with no author action required. Retained internal identifier for historical audit compatibility. |
| `INFO-SHARED-REFERENCES` | information → not emitted | Removed from findings: contextual/optional metadata or diagnostic snapshot, with no author action required. Retained internal identifier for historical audit compatibility. |
| `INFO-PRESERVATION` | information → not emitted | Removed from findings: contextual/optional metadata or diagnostic snapshot, with no author action required. Retained internal identifier for historical audit compatibility. |
| `INFO-NUMBER-CAPACITY` | information → not emitted | Removed from findings: contextual/optional metadata or diagnostic snapshot, with no author action required. Retained internal identifier for historical audit compatibility. |
| `INFO-LEGACY-PRICE-DATA` | information → not emitted | Removed from findings: contextual/optional metadata or diagnostic snapshot, with no author action required. Retained internal identifier for historical audit compatibility. |

`PER-*` references `contentService.ts::toPersona/loadHouseholds` and
`submit_employment_action` initialization. `JOB-*` references
`contentService.ts::toJob/loadJobs`, generated `jobs.weekly_gross_income` and the
employment initialization/application checks in
`supabase/migrations/20261103000000_employment_gameplay.sql`.
`SCN-*` references `manage_scheduled_scenario_progression`,
`submit_scenario_decision`, `publication_route/events` and their final local
function definitions. `EXP-*` references `persona_expenses`, bill initialization,
`guard_bill_publication` and `docs/bills-system.md`. `FACT-*` references
`scenario_fact_copy`, `get_event_recap_facts`, the ScenarioFacts renderer and the
existing supporting-copy constraints. Relationship and CHECK validation traverses
the actual PostgreSQL catalog over every owned table.

The registered descriptions of the changed rules were updated. Unchanged diagnostic
basis labels remain internal historical provenance; they are never rendered in the
staff interface. Information-only diagnostics are filtered out of the server report.

## Tax investigation and conclusion

The old rule required a persona-specific `scenario_library_metadata.library_key =
'D005'`, enabled ordinary engine, with `scenarios.schedule_type = 'scheduled'`, a
reachable `default_day`, and no displacement across hiring paths. It checked both
missing configuration and exactly-once placement. It was enforcing an earlier
scenario-library content specification, **not an independent minimum-gameplay
operation**.

`publication_route` mirrors individual scheduling: employment days and bill days
can exclude ordinary slots. `manage_scheduled_scenario_progression` excludes D005
from the unscheduled pool; `submit_scenario_decision` handles the selected card's
direct effects. Employment initialization/advancement has no independent mandatory
tax transition. Bill settlement is independent of tax scenario presence. The
current published local edition (number **9002**, ID
`63100000-0000-4000-8000-000000000800`) has two personas, three active approved jobs,
four scenarios and **zero D005 records**. It did not satisfy the old tax rule.

Conclusion: no authored tax scenario is normal under the new minimum policy and
produces no finding. An authored but unreachable/displaceable D005 produces a
warning so staff can adjust it intentionally. Any valid existing configured tax
day remains accepted; no exact day, tax charge, bill or repair is invented.
Rollback-only tests publish an unchanged copy of the actual current publication
under the same general rules and verify source preservation.

## Individual/group discrepancies — separate technical risks

Individual setup uses highest visible published `version_number`
(`contentService.ts::loadHouseholds`); group creation uses latest `published_at`
then UUID (`group_private.configure_host_session`). Both pin their editions.
Publication still checks that both selectors choose its result; selectors are not
changed in this task.

`group_private.control_session` builds its own persona/general deduplicated sequence
with choices and refuses startup without 30 questions. It does not honor the same
metadata enablement/engine/scheduling rules as individual progression. A minimal
edition can therefore publish while group start fails. Staff must not author
filler scenarios to satisfy that implementation problem.

Group also differs in skill/CAC/upfront eligibility, clothing failure handling,
ordinary affordability, income credits and bill settlement. The genuine local
API regression reproduces the same positive-wage/bill edition finishing individual
play with **$153**, versus group with **$40**: group stores weekly income but does
not credit canonical weekly pay and does not execute the individual payment/Ignore
path. These failures are no longer publication gates. No group behavior was repaired,
no separate edition/contract was introduced, and full group demo readiness must not
be claimed. Gameplay remediation or an explicit supported-demo scope decision needs
separate authorization.

Optional scenario gaps can also affect individual tests: once library metadata is
present, its selector can exhaust the pool; legacy duplicate scheduled slots can
raise an error. These are explicit warnings under the approved minimum authoring
policy, not filler-content requirements. Empty legacy scheduled days are allowed.
Incomplete reachable narrative/choices should be reviewed before exercising that
scenario. Unsupported selected legacy support effects and corrupt financial values
remain blockers for their demonstrated rejection/safety consequences.

## Review interface

`PublicationReview.tsx` renders **Blockers** and **Warnings** only. Findings are
indented under readable red/amber parent panels, using the existing CMS badge
palette (#8f1e18/#fdeceb/#f0b8b4; #5c3d00/#fff1cf/#efd28b). Each concise summary
names the issue and its conceptual object/location. Native per-finding details hide
why/fix/consequence copy until expanded, with keyboard operation and mobile wrapping.
There is no rule-code grouping, table/UUID dump, internal basis/origin classification
or global rule-description wall. `publicationFindings.ts` owns staff-facing copy;
server findings retain stable diagnostic identities. Known scenario IDs offer an
Open scenario action into the existing editor. Persona/job findings identify the
record; staff select it in the existing respective library (no editor redesign).

Save-before-review, stale-review feedback, named confirmation, exact-request retry,
unknown-result recovery, immutable success history and fresh-draft recovery are
preserved. FieldInfo remains the compact general publication explanation. Warnings,
validation errors and save status remain visible where needed.

## Verification and implementation stages

1. Preserve target schema/security contract: forward function replacements only;
   original publication locks, receipts, permits, guards and audit stay intact.
2. Replace strict completeness policy with deterministic minimum preflight;
   classify all 51 codes as above and invalidate old uncommitted reviews with v2.
3. Preserve atomic transition/recovery and run rollback, failure-injection,
   authorization, stale/head binding, retry and concurrent publisher/editor tests.
4. Simplify review using existing native dialogs/details and CMS styling;
   verify hidden explanations, hierarchy, severity, keyboard, mobile and navigation.
5. Run complete frontend, CMS SQL/API/concurrency and genuine Chromium regressions.
   Verify canonical publication independently from known group demo limitations.

Tests and their final results are recorded below after execution. Relevant suites:
`supabase/tests/cms-publication-{contract,preflight,minimum,atomic}.sql`,
`tools/run_cms_sql_local.py`, `tools/test_cms_publication_local_api.py`,
`tools/test_cms_{personas,jobs}_local_api.py`, `PublicationReview.test.tsx`,
`publicationFindings.test.ts`, and all five `frontend/e2e-local` CMS journeys.
Minimum tests cover no scenarios/bills/facts/eligible results, optional employment
metadata, one persona/two startable jobs, zero personas/insufficient jobs denial,
old validator rejection and actual unchanged-source publication. Existing tests
retain authorization, relationships, source isolation, atomic failures, idempotency,
concurrency and historical-preservation assertions.

## Decisions and remaining risks

No further content-policy decision is needed for this authorized refinement.
Group remediation or a supported-demo scope decision remains separate future work.
Optional incomplete scenarios and pool gaps can affect the specific routes exercised;
publication is not a guarantee that every unfinished optional scenario is playable.
Smallint edition capacity and the inspected local-versus-hosted schema remain
operational considerations, not new content requirements. No hosted access,
deployment, commit or push is part of this work.

Deferred job fields (entry education, related experience, on-the-job training and
`simulation_requirements.notes`) remain optional and unchanged. No new employment
eligibility or authoring rules are inferred from them.

## Final local verification — November 18, 2026 refinement

- Formatting, ESLint, TypeScript and production build passed. Build retains the
  existing advisory about a JavaScript chunk over 500 kB; no bundling changes were
  made in this scope.
- Frontend: **556 tests passed, 2 existing skips** on the final full run. The
  focused publication presentation/navigation suites also passed all 14 tests.
- All **12** rollback-only CMS SQL suites passed, including actual unchanged-current
  publication, minimum-only publication, old-validator rejection, missing fact
  warnings, financial corruption blocking, authorization and audit-failure rollback.
- Genuine local Auth/API: publication, Persona and Job suites passed. Publication
  includes simultaneous edition allocation, same/different draft publication races,
  publication versus editing, stale revision/head rejection, exact retry, fresh
  recovery, source preservation and cleanup fingerprints.
- New minimum API case publishes one persona/two jobs with no scenarios, bills,
  facts or tax and completes **individual Day 30**, including refresh restoration.
  The group session selects that same edition but refuses startup, reproducing the
  known 30-question limitation without making it a publication gate. The separate
  positive-income/bill case still reproduces individual $153 versus group $40.
- All **five genuine local CMS Chromium journeys passed**: Scenario, Persona,
  expenses, Jobs and publication. Publication covers a genuine insufficient-jobs
  blocker, incomplete optional scenario warning, hidden independent explanations,
  keyboard expansion, nested indentation, exact red/amber colors, 390px layout,
  retries/readback loss, immutable reopening and fresh recovery. Mobile screenshot:
  ignored `frontend/test-results/cms-publication-*/cms-publication-mobile.png`.
- The initial publication browser fixture expected a warning despite its fully
  populated optional source details. It was corrected to deliberately omit optional
  reporting periods in **synthetic test content only**, then the complete CMS
  browser set passed. No designer content was repaired to make tests pass.
- An additional **unfiltered** browser invocation included seven failing non-CMS
  tests outside this task: three `individual-scenario.spec.ts` assertions for old
  Day-5 copy; `infrastructure.spec.ts` expecting a missing-schema error on the now
  configured stack; two `scenario.spec.ts` fixed-$200 preview assertions; and
  `staff-individual.spec.ts` expecting the previously removed Main site link.
  Two employment journeys were skipped without their dedicated fixture setting.
  These tests were not modified and the entire legacy browser collection is not
  claimed green. The scoped five CMS journeys were rerun separately and passed.
- Final local catalog: all twelve CMS content guards enabled; no outstanding
  publication permits; all four publication RPCs remain SECURITY DEFINER with empty
  search path, callable only through the authenticated staff boundary (anonymous
  and maintenance-role execution denied). The publisher body was compared with the
  prior migration: only validator generation and the blocked-message wording differ.

No publication-policy blocker remains for the unchanged current local edition or
for the minimum-only fixture. Structural/reference/financial errors, insufficient
usable personas/jobs, historical dependencies, stale reviews and overtaken editions
still block as documented. Group gameplay remediation remains a separately
unauthorized milestone; publication approval does not establish group demo readiness.
