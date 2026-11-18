# CMS draft publication — contract and local implementation record

November 18, 2026. All five implementation stages were subsequently authorized.
**Publication tooling is implemented and verified locally. Full demo readiness is
blocked by reproduced group gameplay incompatibilities.**

Sections 1–8 preserve the approved contract and distinguish pre-implementation
baseline findings from requirements. Section 9 records the actual migrations,
operations, verification and remaining acceptance hold. No hosted access, deployment,
commit or push was performed; gameplay and canonical selectors were not changed.

## Evidence and scope

**Verified baseline** means inspected repository code and, where noted, the existing
local `team6310-phase2-verification` database in read-only transactions. Authorized
implementation changes and test writes are recorded separately in Section 9. Local
catalog checks covered publication/source/allocation-named functions in all
non-system schemas, final gameplay functions, edition constraints, triggers and
policies. Hosted Supabase was not accessed. A local compatibility schema is not
proof of the hosted catalog or deployment. No Supabase MCP tools were available.

**Recommended** means a proposed implementation contract, not existing behavior.
**E / Established** identifies existing project/user policy; it is not necessarily
enforced by current runtime code. Remaining human authorizations are listed at the end.

Read alongside [CMS persistence](cms-persistence.md), [Job Editor](cms-job-editor.md),
[Persona Editor](cms-persona-editor-design.md), [scenario facts](cms-scenario-facts.md),
[post-choice flow](cms-post-choice-flow.md) and [scenario requirements](scenarios.md).
Some older architecture/data-model paragraphs still describe pre-CMS scaffolding;
current code and the specific CMS records establish implemented behavior.

## 1. Publication architecture investigated before implementation

### No reusable publication RPC was found before this milestone

**Verified baseline:** no CMS/source publication RPC, general preflight RPC, publication
receipt table or administrative publish UI was found. The local catalog also has
no such function in another application schema. Existing public functions with
“published” in their names are *guards*, not publishers.

`cms-stage1.md` and a comment in
`supabase/migrations/20261117020650_cms_scenario_workspace.sql` refer to a “current
source publisher” sharing lock `(6310,1115)`. That description cannot currently be
substantiated by an executable source publication function in this checkout/local
catalog. Do not create a competing publisher on the assumption that this is the
complete hosted inventory: verify the target catalog and ask for the missing
publisher artifact, if one exists, before implementation. This document does not
claim that a publisher is absent from every environment.

The actual publication-capable paths found are:

| Path | Implemented behavior and reuse limits |
| --- | --- |
| `tools/build-library-edition.mjs` → `supabase/content/scenario-library-development.sql` | Generator writes a reviewable SQL artifact; it does not connect to a database. The artifact runs `BEGIN`, constructs a new non-CMS edition and content, checks it, updates status/timestamp, then `COMMIT`. It uses a deterministic edition UUID and refuses an existing ID. It clones source jobs/personas, generates library scenarios/choices/facts/bills, and checks exactly four personas, two unrestricted active jobs and a D005 day-18 record per persona. These are development-builder checks, not a general CMS publication contract. It neither reads an arbitrary CMS workspace nor records a publication request. No staff/Auth check is in the SQL; access depends on the trusted operator's database privileges. Re-running an already installed edition fails instead of returning a receipt. |
| `integrations/bls_oews/bls_oews_sync.py`, `supabase_client.py`; `.github/workflows/bls_oews_sync.yml` | Stages wages only. Can reuse a non-CMS draft or clone **jobs only** from a published source. Does not approve, activate or publish. Multi-request HTTP staging is not a complete transactional edition publisher. Returns the database-allocated edition number rather than trusting its proposal. |
| `tools/local_sql/bills_fixture.sql`, local API/SQL fixtures | Trusted local provisioning scripts can set non-CMS editions published within transactions. Not administrative publication interfaces or production publishers. |
| Specifications in `docs/api.md`, `docs/scenarios.md`, `docs/scenario-data-sourcing.md` | Approved future routine automatic data publication, without monthly human review. The actual BLS workflow still stages drafts. Do not turn this CMS milestone into implementation of that automation. |

**Conclusion:** reuse the verified edition allocator, guards, copy mapping and
validation knowledge. The development builder is not a safe generic CMS publisher.
If no additional source publisher is supplied/verified, a small protected CMS
publication operation is needed. Its reusable validation/transition core should
also be callable by a future trusted source publisher under a separately designed
maintenance contract; do not give maintenance staff-CMS write access.

### Edition representation, allocation and selection

**Verified schema:** `content_versions` has UUID `version_id`, **smallint**
`version_number`, nullable text `status`, creator/time/summary, nullable
`published_at`, and non-null `cms_managed`. There is no status CHECK or
`published_by` field in the inspected schema. Public read RLS requires
`status='published' AND published_at IS NOT NULL`.

`cms_private.version_guard()` allocates every INSERT as `max(version_number)+1`
inside transaction advisory lock `(6310,1115)`, regardless of the number requested.
`content_versions_number_unique` also enforces uniqueness. UPDATE cannot renumber
an existing non-CMS edition; CMS UPDATE was blocked entirely; Stage 3 now permits only the exact protected
publication transition. Numbers are allocated
at **draft creation**, not publication. Deleting the highest draft can allow reuse
of a never-published number; this is not a durable sequence. Smallint exhaustion
must fail safely; no widening or historical renumbering is proposed here.

| Consumer | Actual selection/pinning |
| --- | --- |
| Individual household setup: `frontend/src/services/contentService.ts::loadHouseholds` | Highest visible `version_number`; RLS filters published status/timestamp. All personas in that edition are offered; there is no persona enabled flag. The loader validates the entire returned persona list, so one invalid persona can break setup for all. |
| `public.start_individual_playthrough` | Validates the supplied persona belongs to a published edition, then pins that version. It does not require that edition to be the newest. A setup opened before publication may still start its already loaded published edition. |
| Group creation: `group_private.configure_host_session`, migrations `20261109185716_group_session_state_and_participant_ids.sql`, `20261109200648_group_shared_household_employment.sql` | Picks `ORDER BY published_at DESC, version_id`, then pins the session. Existing open sessions are reused rather than upgraded. |
| Active/completed gameplay, recaps, bill occurrences | Uses stored version/content IDs and historical responses/snapshots, not a lookup of the newest edition. |

There is no single editable “live edition” pointer. Making a new edition visible
updates default selection through these existing queries. **Number order and
publication-time order can disagree.** This is a publication design issue, not an
authorization to change selectors in this task.

### Canonical content and existing group discrepancies

**Established policy, clarified by the current task:** individual simulation
content is canonical. Both interaction modes are intended to consume the same
published edition, personas, jobs, expenses, scenarios, choices and supporting
copy. Group voting/host advancement are interaction mechanics, not a second
content-authoring system. “One published edition” means one current canonical
default; historical published editions must remain accessible to pinned runs.
It does not mean overwriting history or enforcing a single published database row.

The current implementations do not fully realize that policy:

| Diagnostic code | Verified difference, evidence and risk | Publication treatment / affected records |
| --- | --- | --- |
| `GROUP-EDITION-ORDER` | H uses highest published edition number; G uses latest publication timestamp. Old-number publication can split new starts across editions. | Database/platform discrepancy; `PUB-ORDER` protects final selection agreement. Report both head IDs/numbers/timestamps, not separate content standards. |
| `GROUP-QUESTION-SEQUENCE` | S builds persona-specific day/bill/employment-aware selection; G builds up to 30 title/description-deduplicated questions, sorts by default day/title/ID, and refuses fewer than 30. It does not use the canonical daily availability model. | Technical diagnostic with persona, deduplication counts and query witness. **Do not require 30 ordinary questions per persona as CMS content policy.** A known start failure in a supported demo mode triggers the platform readiness hold. |
| `GROUP-DORMANT-LEAK` | G includes general rows and ignores enabled/engine/schedule-type metadata when building questions, provided they have choices. S requires enabled ordinary persona-specific candidates; F can separately use employment/bill context. | List leaked scenario/metadata IDs and affected group persona paths. Do not complete dormant records or duplicate general scenarios to accommodate this implementation. Known supported-mode failures trigger the hold. |
| `GROUP-EFFECT-DIVERGENCE` | G applies the winning choice's direct balance delta to shared balance; it lacks S's same CAC/upfront/support-effect checks and B's individual bill-occurrence workflow. Thus matching edition IDs alone do not prove matching financial behavior. | Platform discrepancy with choice/effect/expense IDs and consumer functions. No new group-only monetary content or authoring exceptions. A demonstrated mandatory financial mismatch in a supported demo path is a readiness blocker. |
| `GROUP-EMPLOYMENT-DIVERGENCE` | G's group job voting and preparation/clothing sequence do not enforce all individual skill/fallback and calendar semantics in E. | Report affected job/persona IDs and stage, not additional qualifications for authors. Validate the canonical job contract once; resolve interaction implementation separately. |
| `GROUP-RECAP-DIVERGENCE` | F is individual-run scoped (`session_id IS NULL`); current group question state does not use the same ordinary/bill/employment fact recap RPC flow. | Platform limitation with scenario/event IDs and renderer/RPC references. Do not create group-specific facts or treat a missing group join as missing authored data. |

H/S/E/B/F/G are exact source references in the rule evidence index below. These
codes identify **implementation diagnostics**, ordinarily warnings under
`PLATFORM-GROUP-DIVERGENCE`, not a second set of authoring rules. An actual known
failure or mandatory-rule mismatch in a declared supported demo mode raises
`PUB-SUPPORTED-MODE-FAILURE` with the diagnostic as its cause. Staff must not be told
to clear it by manufacturing different content for group play.

Both individual and group interactions are now explicitly authorized demo modes.
Known failures therefore require separately authorized group alignment before
claiming complete readiness. No group deferral is presumed. Any later scope
exception would need explicit user authorization and visible operational handling,
not a warning downgrade while advertising working group play. Publication work
changes no mode availability, selector or mechanics.

### Existing completeness and immutability protections

- `content_versions_guard_bill_publication` invokes `guard_bill_publication` on
  UPDATE: rejects bill occurrences colliding with a scheduled scenario for the
  same persona. It does not validate the whole edition and is not an INSERT guard.
- Jobs have generated gross, availability/money/year/geography/SOC constraints;
  `jobs_reject_published_changes` blocks writes involving published jobs even for
  privileged maintenance. See `supabase/migrations/20261027063526_add_curated_bls_jobs_and_employment_links.sql`
  and `20261027075708_jobs_published_guard.sql`.
- `guard_bill_definition`, `guard_scenario_fact_copy`, and
  `guard_published_library_content` freeze their respective content. The library
  guard covers scenarios, choices, personas, metadata and bill links **when the
  edition has library metadata**, rather than every legacy edition universally.
- CMS content guards additionally cover all twelve copied content tables,
  regardless of library metadata. Keeping `cms_managed=true` after publication
  would freeze all those tables through the existing draft-only rule.
- For non-CMS editions, no general status-transition guard currently prevents a
  privileged operator from clearing publication state. That is not a safe rollback
  interface: old run operations still require their edition to remain published.
  There is no verified protected unpublish/rollback RPC.

Superseding an edition by publishing another is compatible with pinned runs.
Archiving/unpublishing an old edition can make old content inaccessible through
RLS and break restoration. Retain old editions with published state; no rollback
button or destructive archival is recommended for the demo.

## 2. CMS integration findings

**Verified:** private `cms_private.workspaces` owns draft name/source/creator and
revision; `lineage` maps source IDs to freshly allocated draft IDs; `receipts`
stores actor, exact payload, result and request UUID. Private tables have RLS and
no browser DML grants. The workspace is shared among active staff, not exclusive
to its creator. `require_staff()` requires database staff status and authenticated
role; anonymous Auth membership does not grant staff access.

`cms_create_draft` snapshots twelve tables in one query and copies them in one
transaction. Seven owned UUID entity types receive fresh IDs; FK references are
remapped or fail closed for cross-edition dependencies. Shared category and CAC
service/fact registries are not copied. Generated job columns are omitted and
recomputed. Later save RPCs preserve draft identities. Choice order is private
CMS metadata, not a gameplay progression rule. The baseline copy did not reproduce source private choice-order rows. Stage 3
now preserves them when cloning published CMS content; gameplay continues sorting
choices independently and no progression rule was changed.

| Publication concern | Baseline restriction / implemented treatment |
| --- | --- |
| Status transition | `cms_private.version_guard()` originally rejected every CMS edition UPDATE. It now recognizes only the publisher's exact transaction-bound capability; direct status updates remain rejected. |
| Maintenance isolation | Content guard rechecks staff and requires unpublished draft. Do not set `cms_managed=false`, disable triggers, use replication-role tricks or grant browser DML to get around it. |
| Future drafting | `cms_create_draft` now accepts genuinely published CMS sources through its existing copy/remapping implementation. It still rejects draft sources and now copies source CMS choice-order positions to remapped choice IDs. |
| Lists and reads | `cms_list_drafts` now filters unpublished CMS workspaces. `cms_list_publications` supplies persistent read-only success history; workspace/audit rows remain preserved. |
| Saving/deleting | Fresh requests must fail after publication. Existing actor-bound successful save receipts may still replay before status checks: that is safe acknowledgement of an earlier commit, not permission to write again. Test this explicitly. |
| IDs and lineage | In-place publication needs no content copy, reparenting or ID changes. Retain workspace, lineage, choice order and receipts. When a future draft is made, remap from the newly published source as usual. |
| Publisher attribution | `created_by` is not publisher identity. Add a private publication record containing publisher, time, edition, revision, request, previous head(s), validation-rule version and result. No new editorial roles. |

## 3. Recommended publication identity and workflow

### Settled identity: publish the selected saved draft in place

**Established by the current task:** keep its `version_id`, edition number, content
IDs, relationships and `cms_managed=true`. Publishing changes lifecycle state and
metadata atomically with an audit receipt. No content copy occurs on the normal
publication path. Published content stays immutable; future changes start with an
explicit new draft. Never delete, unpublish or overwrite the previous editions.
Always-publish-copy, renumbering and selector changes are not this contract.

Let D be the selected CMS draft and N the highest-numbered published edition
visible to canonical individual setup (published status plus non-null timestamp).
The exact ineligibility conditions are:

1. D is not an isolated, CMS-owned saved draft with a matching workspace, or has
   already been published/otherwise changed lifecycle state: `PUB-STATE/HISTORY`.
2. A current hard finding in the whole-edition register below remains unresolved.
3. N exists and `D.version_number <= N.version_number`: **permanently overtaken
   for this draft identity**, `PUB-ORDER`. Retrying/reviewing cannot renumber it.
4. The server-assigned timestamp and existing selectors would not both choose D
   after publication, including a conflicting future-dated published timestamp:
   `PUB-ORDER`. Do not alter existing timestamps or invent a future timestamp.
5. The saved revision, validator version or either reviewed published head changed
   before confirmation: `PUB-STALE-REVIEW`. This invalidates that review/request;
   rerun preflight to determine whether D is still otherwise eligible.

A higher-numbered **unpublished** draft alone does not overtake D. Older
`source_version` alone is reported as `PUB-SOURCE-BEHIND`; it is not a new implicit
source-equality requirement. The protected draft workflow historically allowed
selection of any published source. The numeric publication-order prohibition and
concurrent-head binding are explicit rather than an undefined “stale draft” rule.

**Recovery, clarified by this task:** explicitly create a fresh draft from N, the
**latest canonical published edition**, using the existing complete copy/remapping
architecture and allocator. If current group/individual heads differ, N is determined
by the canonical individual selector; the discrepancy is still reported. Keep D
unchanged and reopenable. Do not copy the obsolete draft into a new identity as an
order-bypass operation, automatically merge its changes into N, or silently repair
content. Staff review the fresh baseline and explicitly reapply any wanted edits.
Validate the actual new draft and its new IDs before confirming publication.
This replaces the preceding proposal to “Copy saved content” from the overtaken
workspace. No new recovery clone-from-old-draft RPC is part of this design.

A new draft copied from a published CMS edition must be supported by the future
protected source-read contract; the Stage 3 migration now supports that case without allowing draft sources.
Smallint allocation exhaustion can prevent fresh-draft recovery, but does not
itself block in-place publication of an already allocated otherwise-valid draft.

### Staff interaction

1. Open an existing saved draft. Resolve unsaved edits with existing Save/discard
   protections; preflight validates database content only, never unsaved React state.
2. Select Review publication. Show draft name/edition, saved revision, source,
   content counts and current individual/group default editions.
3. Run protected preflight. Group results as Blockers, Warnings and Information,
   with entity names, field locations, rule codes and actionable remedies.
4. With zero blockers, show named confirmation: this edition becomes the default
   for new starts, freezes editing, and preserves existing games/editions.
   Warnings remain visible in this confirmation; no reviewer or approval queue.
5. Submit the reviewed revision, validation-rule version, request UUID and both
   observed publication heads. Server validates again under locks. Concurrent
   changes require reload/review, not automatic acceptance of a different edition.
6. On success, display the database-confirmed edition number, publisher and time,
   open its read-only viewer, and offer explicit Create draft for later edits.
   Remove it from the editable-draft list without deleting workspace/audit rows.

These are straightforward workflow recommendations; button names are provisional.
Reuse `ScenarioWorkspace`, `AdminTabs`, `Dialog`, `FieldInfo`, the shared busy/error
patterns and the staff route boundary. No publishing from an unauthenticated page.

## 4. Final proposed edition-wide validation contract

### Policy and report structure

**Established by the current task:** incomplete drafts remain saveable, reopenable
and editable under existing draft-save constraints. Publication evaluates the
**entire saved edition**, including untouched copied rows and their relationships.
It never silently repairs data, enables facts, fills text, changes schedules,
reassigns personas/jobs, activates jobs, deletes dormant content or merges editions.
A publication failure does not become a new restriction on ordinary draft saves.

There is **one canonical content contract**, based on individual simulation
content, intended for both interaction modes. There is no group-authored edition,
separate group pass threshold, group-specific authoring checklist or separate
content-validation profile. A single report contains content findings and platform
compatibility findings. Each blocker has `origin=content|database|platform|request`
so staff can distinguish an editable problem from an implementation problem.
Known failures in a supported demo mode prevent a claim of demo readiness; they
must not be disguised as requests to author extra group-only content.

Recommended report fields: edition/workspace ID, saved revision, validator version,
reviewed individual/group selection heads, and structured findings containing
`code`, `severity`, `origin`, `basis`, `message`, `affected[]`, `field`,
`reachabilityReason`, optional persona/day/support/hiring-path witness, and remedy.
Use names **and stable IDs**; composite fact identity is scenario+version+role.
Report a dependent record and its target for relationship errors. Global findings
identify the edition plus the relevant counts/heads. Unauthorized requests return
access denial without leaking another workspace's report. Publish reruns the same
validator inside its locked transaction; an old frontend report is not authority.

Basis legend in the rule registers:

- **V:** verified code/database behavior; Section 9 records the implemented preflight check.
- **E:** established project/user requirement, with cited evidence.
- **R:** recommended diagnostic or safety mechanism, not a new simulation rule.

Severity is fixed by each register below. Do not silently promote warnings to
blockers or downgrade mandatory failures. If an R rule needs a policy change later,
version the validator and obtain authorization. No numeric target such as four
personas, 60 cards or 30 authored ordinary questions is inferred from prototype data.

### Evidence index for the rules

| Ref | Exact sources and relevant behavior |
| --- | --- |
| P | `supabase/migrations/20261117020650_cms_scenario_workspace.sql`: workspaces, lineage, allocator, staff/content/version guards. `20261117155926_cms_draft_deletion.sql`: lifecycle/dependency locks. Final `cms_private.version_guard` was inspected locally. |
| H | `frontend/src/services/contentService.ts::loadHouseholds`, `toPersona`, `toJob`, `loadJobs`; `frontend/src/types/domain.ts::usdCents`; published-content RLS in `20261027064141_restrict_game_state_and_expose_only_published_simulation_content.sql`. |
| E | `supabase/migrations/20261103000000_employment_gameplay.sql::submit_employment_action`, extended by `20261113204615_staff_individual_authorization.sql`; final local function inspected in the preceding investigation. Persona contract: `20261118003605_cms_persona_persistence.sql`, `docs/cms-persona-editor-design.md`. |
| S | `supabase/migrations/20261109181822_library_routing.sql::manage_scheduled_scenario_progression`; `frontend/src/services/scenarioContent.ts::loadScenario`, `frontend/src/components/simulation/ScenarioPanel.tsx`; direct submission foundation `tools/local_sql/scenario_submission.sql`, extended by library routing/staff authorization. |
| B | `supabase/migrations/20261108010000_bill_schedule_foundation.sql`: definition/occurrence constraints, bill snapshots and initialization; `20261108020000_bill_gameplay.sql::guard_bill_publication` and collision guards. `20261109181824_event_recap_facts.sql`: bill-context lookup. |
| F | `supabase/migrations/20261109181809_scenario_recap_facts.sql`: fact schema and guard; `20261109181824_event_recap_facts.sql::get_event_recap_facts`, authorization extension above; `frontend/src/services/scenarioFacts.ts`; `frontend/src/components/simulation/ScenarioFacts.tsx` and its empty-result test. |
| G | `supabase/migrations/20261109185716_group_session_state_and_participant_ids.sql::group_private.configure_host_session`; `20261109200648_group_shared_household_employment.sql::group_private.control_session`, `submit_job_vote`, `read_session_state`; `frontend/src/services/groupSessionService.ts`. |
| A | `docs/scenarios.md`: Required tax scenario, Fact variety within a playthrough, and publication acceptance criteria; current task's canonical-content and incomplete-draft clarification. |
| J | `supabase/migrations/20261027063526_add_curated_bls_jobs_and_employment_links.sql`; `20261118074410_cms_job_workspace.sql`; `frontend/src/pages/admin/dashboard/jobFields.ts`; `docs/cms-job-editor.md`. |

Migration filenames in this index are under `supabase/migrations/` unless another
path is specified. Runtime code takes precedence over historical implementation
claims; established requirements remain labeled separately from runtime enforcement.

### Hard blockers

| Stable code | Check and rationale | Evidence / basis | Affected records and origin |
| --- | --- | --- | --- |
| `PUB-STATE` | Target must be the selected CMS-owned workspace and unpublished draft, with valid status/timestamp/ownership. Prevent publication of arbitrary editions or reuse as lifecycle reassignment. | P; V, E: draft isolation. | Workspace and edition IDs/status; request/database. |
| `PUB-ACCESS` | Recheck authenticated active staff inside protected operations, including retries; no browser DML or maintenance bypass. | P; V, E: authorization. | Target edition only in authorized reports; request. |
| `PUB-STALE-REVIEW` | Expected saved revision, validator version or either observed publication head changed. Review again; a changed head does not automatically prove permanent draft obsolescence. | P, H, G; V, R: concurrent-review binding. | Edition, reviewed/current revision and head IDs; request. |
| `PUB-ORDER` | Draft number is not strictly greater than the highest published number, or final server timestamp would leave either default selector pointing elsewhere. No renumbering or selector workaround. | P, H, G; V; E: current task's overtaken-draft protection. | Draft and conflicting edition IDs/numbers/timestamps; database/platform. |
| `PUB-HISTORY` | Draft already has gameplay/historical dependencies, including inbound run/session/response/financial references. It must remain an isolated authoring workspace, not alter already-used content. | P and protected deletion/save dependencies; V, E: historical isolation. | Edition, referencing table and IDs; database. |
| `REL-EDITION` | Across all twelve copied tables, reject orphaned or cross-edition owned links and incorrect owner versions, including choice destination metadata, fact/statistic/support/bill links and persona job references. Shared category/CAC registries are shared, not mismatches. | P, B, F, J; V, E. Single-column historical FKs do not enforce every version pairing. | Both referencing and target IDs, fields and versions; content/database. |
| `REL-CONSTRAINT` | Stored content must satisfy actual required schema constraints and a valid transition must not fail existing guards. Apply real null/legacy allowances, not invented stricter rules. | P, B, F, J; V. | Table/PK/field/constraint name; database. |
| `PER-CATALOG` | At least one persona can be offered; every offered persona must be valid. No enabled flag exists to hide an incomplete persona, and one bad row breaks the setup loader. | H; V. | Edition count or persona IDs/names; content. |
| `PER-DETAILS` | Offered personas need nonblank name/description and usable finite exact starting balance compatible with the existing authoring/financial contract. Missing description or money fails loading; negative balance is outside the approved CMS monetary contract. | H, E; V, E. | Persona and offending fields; content. |
| `PER-EMPLOYMENT` | Explicit English/computer booleans, null starting job and zero coalesced starting weekly income. Null weekly income is accepted as zero, as the current loader does. Do not edit these values automatically. | H, E; V, E: all households start unemployed. | Persona IDs and fields; content. |
| `JOB-STARTABLE-CATALOG` | At least two active, approved jobs explicitly require neither English nor computer skills, permitting initialization and fallback. This count comes from the actual initialize RPC. | E; V. | Edition, matching job IDs and count; content. |
| `JOB-VISIBLE-VALID` | All active/approved jobs must pass current job loaders and application checks: required text/year, finite usable wage/generated gross/hours and explicit skill flags; retain real DB active prerequisites. Inactive/unapproved incomplete jobs do not fail this rule. | H, E, J; V. No generated-income input or new qualifications. | Job IDs/names and invalid fields; content/database. |
| `SCN-PLAYABLE-CONTENT` | Any canonical reachable ordinary scenario needs title, description, category, supported schedule and usable choices. Validate all loaded choice texts, response texts and exact direct-effect/upfront money because the loader parses all choices before mode filtering. | S; V. | Scenario and choice IDs, fields and reachability witness; content. |
| `SCN-ANSWER-AVAILABLE` | Each reachable ordinary event needs a selectable answer in each applicable support path, including a non-CAC answer without support. Do not require an affordable answer: approved early endings are valid gameplay. | S, A; V, E. | Scenario, choice IDs, persona/support/day witness; content. |
| `SCN-UNSUPPORTED-EFFECT` | A selectable ordinary answer must not have a `cac_support_effects` record that individual submission explicitly rejects. Preserve/report it; never convert or remove it. | S; V. | Choice, support-effect and scenario IDs; content/runtime compatibility. |
| `SCN-ROUTE-COVERAGE` | Continuing canonical routes cannot exhaust eligible unused scenarios. Legacy scheduled-only routes must not have ambiguous same-day candidates. Use the actual selector and all relevant hiring/support paths, not raw catalog counts. | S, E; V. Coverage proof below. | Persona, earliest failing day/path, candidate IDs/counts; content. |
| `EXP-DEFINITION` | All persona expense definitions must have matching edition/persona and existing valid name, exact amount/fixed fee and first-day/interval semantics. Calculated occurrences and run state are never authored. | B; V, E. | Expense/persona IDs and fields; content/database. |
| `EXP-SCENARIO-COLLISION` | Any scenario/expense pairing rejected by the existing publication guard blocks publication, even if metadata marks the scenario disabled. The guard ignores those flags; pretending otherwise would fail the transaction. | B; V. This is an actual database restriction, not proof that dormant content is playable. | Expense/scenario/persona IDs and occurrence day; database. |
| `FACT-STORED-VALID` | Existing fact rows must preserve valid schema identity/role/key/text/source and owner relationships. HTTPS source and no unresolved braces are real constraints. Evidence must remain present as stored; no invented evidence schema or attestation. | F, P; V. | Scenario+edition+role, field/constraint; database/content. |
| `FACT-ACTIVE-ROLES` | Canonical active scenario content needs one general and one CAC authored fact under the established content contract. PK enforces at most one, not presence. Dormant incomplete records are treated below. Both roles can remain ineligible; this is not a requirement to display them. | A; E. Presence is an authoring requirement, not a runtime error on empty facts. | Scenario+edition and missing roles, activation reason; content. |
| `FACT-GENERAL-CONFLICT` | Proven co-display of the same eligible general semantic fact on distinct canonical events conflicts with established non-repetition. Distinguish authored cross-scenario conflicts from repeated RPC event reuse, which is a platform issue. Do not reject mutually exclusive reuse or suppress/repair facts. | A, F; E; V: runtime lacks history enforcement. | Composite fact IDs/key and co-reachable event/path witness; content for authored conflicts, platform for event reuse. |
| `TAX-CONFIGURATION` | Each persona/support path must have identified mandatory D005 configuration eligible for a scheduled ordinary occurrence. Missing, disabled, non-ordinary or unscheduled-only D005 does not meet the existing requirement. | A, S; E, V. No new exact day. | Persona, tax scenario/metadata IDs and fields, or missing logical D005; content. |
| `TAX-EXACTLY-ONCE` | On complete canonical routes, the configured tax event must occur once, without bill/employment conflict or a competing non-tax scheduled answer event that can displace it. Early-ended runs need not reach a later event. | A, S, B; E, V. | Existing configured day(s), persona/path and competing IDs; content. |
| `PUB-MANDATORY-UNPROVEN` | Required structural route/tax/declared-semantic-key claims cannot be established with the actual data and bounded analysis. Do not label uncertainty as a pass. This does not require mechanical proof of factual truth or new evidence attestations; limited text/source inference remains a warning. | A; E mandatory guarantees, R fail-closed proof mechanism. | Edition, affected mandatory code, unresolved IDs/path; platform/validation. |
| `PUB-SUPPORTED-MODE-FAILURE` | A known failure prevents safe execution of this canonical edition in a declared supported demo mode. A group implementation failure is a **demo readiness hold**, not a group-specific content standard. Resolve the implementation or obtain explicit supported-mode scope authorization. | Current task; E. G supplies verified failure evidence. | Edition, affected persona/session path, compatibility diagnostic and failing function; platform. |

All hard findings identify their origin and remedy. In particular, the UI must not
instruct authors to add group-only scenarios, duplicate personas or change financial
effects to clear `PUB-SUPPORTED-MODE-FAILURE`. The protected implementation of these checks is now recorded in Section 9;
none of them authorizes a gameplay repair or an automatic content change.

### Warnings

| Stable code | Check and rationale | Evidence / basis | Affected records |
| --- | --- | --- | --- |
| `SCN-DORMANT-INCOMPLETE` | Explicitly disabled ordinary catalog content, proven outside canonical decisions and recap lookup, lacks text/choices/fact roles. Retain it without a completeness blocker. Structural constraints still apply. | Current task, S, F; E clarification, R diagnostic. | Scenario IDs, disabled flag, missing fields and exclusion proof. |
| `SCN-UNEXPECTED-EXCLUSION` | General/unassigned scenarios, missing metadata in a library edition, unsupported schedule/day or unreachable employment gating make intended ordinary content unavailable. Absence from routing is not automatic intentional dormancy. Escalate only when a blocker such as coverage or tax actually fails. | S; V, R. | Scenario/metadata/persona IDs, schedule/day, exact exclusion reason. |
| `SCN-SCHEDULE-ALTERNATIVES` | Multiple library scenarios can compete for a day, so each is not guaranteed to occur. This alone is allowed; tax displacement and legacy ambiguity have hard rules above. | S; V, R. | Persona/day and all candidate IDs. |
| `SCN-CONDITIONAL-DAY` | An ordinary Day-2 slot is excluded, and Day 3 depends on hiring. Slots beyond the calendar or on skipped paths do not imply guaranteed content. | S, E; V, R. | Scenario/day and affected paths. |
| `SCN-DORMANCY-UNCERTAIN` | Cannot establish that content is excluded from relevant canonical decision/recap paths. Do not grant a dormant exemption. Apply actual reachable requirements conservatively and identify the uncertainty. | S, F; R. | Scenario IDs and unresolved consumers/paths. |
| `FACT-DISPLAY-INELIGIBLE` | Existing role is `verified=false`, or no eligible fact remains for an event/support mode. Gameplay accepts an empty fact list. Do not turn eligibility on or invent fallback copy. | F; V, R. | Composite fact/event IDs, role and support mode. |
| `FACT-PROVENANCE-LIMITED` | Reporting period absent, evidence empty/unstructured, or structured source/text linkage cannot be verified mechanically. This is not attestation or a reason to edit read-only statistics. | F, CMS fact contract; V, R. | Composite fact IDs and absent metadata. |
| `FACT-VARIETY-UNCERTAIN` | Semantic equivalence or co-reachability cannot be inferred reliably from text/evidence, or ineligible general copy would conflict if later enabled. No automatic text comparison becomes authoritative. Proven mandatory uncertainty/conflicts use hard rules above. | A, F; V, R. | Fact IDs/semantic keys and explicit limitation. |
| `FACT-CAC-REUSE` | CAC facts reuse a relevant semantic measure. Repetition is allowed when its relevant pool is exhausted; prefer variety without replacing facts or requiring new services. | A; E, R diagnostic. | CAC fact keys/scenarios; no general-fact rule applied to CAC facts. |
| `EXP-OUTSIDE-CALENDAR` | First due day is after 30, so no bill occurrence is produced in the simulation. It is valid under existing expense constraints. | B; V, R. | Expense/persona IDs and due day. |
| `EXP-RECAP-MISSING` | Expense has no context link or event copy. Bills still work financially; do not create links or facts. | B, F; V, R. | Expense and optional bill-link/scenario IDs. |
| `SCN-DORMANT-EFFECT` | Unsupported support-effect data exists only on proven dormant ordinary content. Report preserved legacy data; do not activate or rewrite it. | S; V, R. | Effect/choice/scenario IDs. |
| `PUB-SOURCE-BEHIND` | Draft was copied from an older source than the current canonical default. Show source/current edition and changes, without automatic rebasing. Source age alone is not the previously defined numeric-order prohibition. | P, H; V, R. | Workspace source and current edition IDs/numbers. |
| `PLATFORM-GROUP-DIVERGENCE` | Current group routing, availability, recap or effects differ from canonical behavior. Document implementation ownership; promote actual supported-demo failures to the readiness hold, not to a new content-authoring rule. | G, S, F; V, E canonical clarification. | Edition/persona/scenario/choice IDs, discrepancy and function. |
| `PLATFORM-FACT-HISTORY` | Runtime has no persistent semantic display history; repeated event lookups can redisplay facts and no random/history service guarantees variety. Report actual conflict with mandatory behavior as a readiness issue when applicable. | F, A; V, E. | Event keys/paths and fact IDs; not a request for duplicate authoring. |

### Information

| Stable code | Check/context and rationale | Evidence / basis | Affected records |
| --- | --- | --- | --- |
| `INFO-EDITION-SNAPSHOT` | Saved revision, source, authoring counts and both current selection heads. Confirms what is being reviewed. | P, H, G; V, R. | Workspace/edition/head IDs and counts. |
| `INFO-CONTENT-REACHABILITY` | Counts/lists by canonical decision, employment recap, bill recap and dormant/unexpectedly excluded content. Prevent mistaken catalog-size assumptions. | S, F; V, R. | Scenario/persona IDs and classification reason. |
| `INFO-FACT-DISPLAY` | Eligible general copy is returned for the event; CAC copy additionally needs support mode. No eligible result means an empty area. Existing `fact`/`context` headings differ. | F; V. | Composite fact/event IDs and current eligibility. |
| `JOB-OPTIONAL-METADATA` | Entry education, related experience, on-the-job training or requirements note is absent/non-text legacy metadata. No loader/eligibility requirement is inferred. | H, J; V; E: deferred fields. | Job IDs and optional field names. |
| `INFO-INACTIVE-JOBS` | Inactive/unapproved incomplete jobs are retained, not exposed as currently playable jobs. | H, J; V. | Job IDs/flags. |
| `INFO-GENERATED-INCOME` | PostgreSQL generates weekly gross; no publication recalculation or editing of persona starting income/job assignment. | J, E; V, E. | Job and associated persona IDs. |
| `INFO-NEXT-METADATA` | `next_scenario_id` is stored, edition-validated metadata; no routing, required outgoing edge or acyclic-graph rule exists. | S, P; V. | Choice and optional destination IDs. |
| `INFO-SHARED-REFERENCES` | Categories/CAC registries remain shared; statistics are read-only; evidence does not automatically bind copy to statistics. | P, F; V, E. | Referenced category/service/statistic/fact IDs. |
| `INFO-PRESERVATION` | Published/source content and historical runs stay pinned; new drafts remap identities. No silent repairs or historical edits. | P, B; V, E. | Draft/source IDs and lineage counts. |
| `INFO-NUMBER-CAPACITY` | Edition numbers are smallint and draft creation uses max+1. Near/exhausted capacity affects **new draft creation**, not in-place publication of an already allocated valid number. | P; V, R. | Edition maximum and allocator limit. |
| `INFO-LEGACY-PRICE-DATA` | `scenario_edition_prices` is copied compatibility data; inspected local employment uses its existing clothing constant. Do not invent a price binding or new preflight requirement. | E, `tools/local_sql/cms_price_compatibility.sql`; V limited to inspected code. | Edition price row and consumer limitation. |

### Dormancy and completeness: final recommended interpretation

A missing description, choice or fact does not by itself classify a scenario as
unplayable **or** intentionally dormant. Calculate reachability from the entire
edition, not recently edited records:

- **Canonical ordinary:** use the actual individual selector, including library
  flags, persona, schedule, employment, bills and unused-card rules. A new enabled
  unscheduled scenario with no choices can still be selected: it is not dormant
  just because its editor is incomplete.
- **Canonical recap-only:** D001–D004 employment lookups and bill-linked scenarios
  can supply facts without being ordinary questions. They do not need ordinary
  choices merely to provide recap context. `enabled=false` is not consulted by
  those fact lookups, so that flag alone does not prove complete dormancy.
- **Intentionally dormant:** explicit disabled ordinary metadata plus proof of no
  canonical decision/recap use. Missing authored fields are warnings, not blockers;
  relationship/constraint failures still block the whole edition.
- **Unexpectedly excluded:** general/unassigned content, missing metadata, bad day,
  schedule mismatch or employment requirements may explain non-selection but do
  not establish intentional retirement. Report them, and apply tax/coverage rules.
- **Leaked into current group routing:** group ignores library `enabled`/engine
  flags and can include persona/general rows with choices. Record a platform
  discrepancy; if it causes a failure in a supported demo mode, hold readiness.
  Do not require dormant content to be completed just to satisfy this group bug.

This reachable-content scope supersedes the earlier suggestion that every dormant
catalog row might need full publishable authoring. It applies the task's incomplete
content clarification while retaining established active-scenario fact requirements.
No disable/activation control or gameplay fix is authorized by this document.

### Supporting facts: verified behavior and mandatory-policy limits

The local final `get_event_recap_facts` was checked again read-only. It resolves
ordinary committed choices, employment D001–D004 events, or resolved bill links,
then returns edition-matched `scenario_fact_copy` with `verified=true`. CAC rows
also require support enabled. It returns zero, one or both roles; it does not
randomize. `scenarioFacts.ts` accepts an empty array. `ScenarioFacts.tsx` filters,
sorts general before CAC and renders all returned rows; empty results leave an
empty facts area. Retrieval errors show retry feedback, not invented facts.

There is **no persistent fact-display history or runtime variety guarantee** in
these components/RPCs. A repeated current recap can redisplay its fact; D001 is
also used for both preparation-result and application-result. Publication must
not claim a history guarantee or fix this by changing eligibility, duplication,
text, source links or fact selection. The preceding design's generic reference to
“current random fact display” is corrected by this inspection.

One general and one CAC authored role on canonical active content is an established
content requirement, independent of whether either is display-eligible. General
non-repetition is also documented as mandatory; CAC variety is preferred and
relevant repetition is permitted. Check proven co-display conflicts statically,
retain mutually exclusive reuse, and disclose proof/runtime limits. Do not demote
a proven mandatory violation to a mere quality preference, but do not invent
runtime randomization or require `verified=true` to manufacture a guarantee.
Evidence and eligibility are preserved; new facts still default false. No evidence
attestation, reviewer roles, automatic statistic bindings or new fact workflow.

### Tax placement: retain valid data, not a new exact day

The source builder and generated development SQL configure D005 on Day 18, but
`docs/scenarios.md` explicitly describes the exact day as not globally approved.
The inspected selector prioritizes **any** eligible scheduled match; it does not
special-case a mandatory day or reserve D005 against other scheduled candidates.
It excludes D005 from the unscheduled pool. There is no tax routing via title text
or `next_scenario_id`.

The follow-up local query found **no published D005 metadata rows in that local
verification database**. The artifact's Day 18 is therefore not proof that an
actual target draft/hosted edition currently has that slot installed. No hosted
system was queried. At implementation, read the selected saved draft itself.

Keep each valid existing configured ordinary slot: verify all personas/support
paths, no bill/employment collision, exactly-once inclusion and no displacement.
A valid day differing from 18 is not a finding requiring correction. Missing or
unreachable mandatory configuration blocks; an optional scenario's alternative
schedule merely warns unless it breaks coverage/other mandatory rules. Never
infer a new date, create tax variants, or move an existing tax event in preflight.
Early endings before its scheduled day are permitted by the established decision.

### Canonical route coverage algorithm

Library mode is enabled by presence of any library metadata. The individual
selector requires exact persona match, enabled ordinary metadata, employment
eligibility and an unused scenario. It does not automatically select general
content. Scheduled matches beat the unscheduled pool; unscheduled D005 is excluded.
Bill days and Day 2 skip ordinary selection. Day 3 is ordinary only on the
Day-2-hiring branch. Continuing normal paths are hired by Day 3; early-ended paths
are terminal and do not need future events.

For every persona/support/hiring branch, expand actual bill occurrences and
ordinary opportunities through Day 30. At each opportunity validate every eligible
scheduled alternative. A scheduled row cannot have been consumed from the pool
on an earlier day because a row has one schedule type/default day. Days without
scheduled candidates require one unused pool card. If day 1 requires a pool card,
at least one must be non-employment-gated; later normal ordinary opportunities
have a job. Require total distinct pool capacity for all fallback opportunities,
including any day-1 consumption, and report the first failing prefix/day. General,
disabled and non-ordinary rows cannot inflate this count. Separately prove tax
inclusion and relevant general semantic uniqueness across event paths.

Validate these assumptions with actual RPC journeys; a single synthetic run UUID
or random sampling does not prove all routes. If a new selector introduces
conditions beyond this model, version and extend the proof rather than return a
false pass. Legacy no-metadata editions retain their actual scheduled-only behavior:
a day with no scenario is not library exhaustion, but duplicate matches can fail.
Publication must not inject metadata and silently switch the selector.

## 5. Security, concurrency, failure and recovery

**Recommended protected operations (names provisional):** a read-only preflight,
a single transactional publish, and existing-style explicit fresh-draft creation
from the latest published edition for recovery. Reuse any verified existing
target-environment publisher's core rather than duplicate it. Browser clients only call protected functions; they never send
authoritative content snapshots or update `content_versions` directly.

Recommended publish transaction:

1. Recheck active staff, then set bounded lock/statement timeouts. Acquire global
   allocator/publication advisory lock `(6310,1115)`, then workspace `FOR UPDATE`,
   then edition row lock. Match draft deletion's global-before-workspace order;
   ordinary editor saves hold the workspace lock and need no publication lock.
2. Check an actor-bound existing publication receipt before stale/status rejection.
   An identical committed retry returns the original result without new writes;
   altered input or another actor using that request fails. Authenticate even retries.
3. Require exact workspace/edition ownership, expected revision and observed heads.
   Check no game/history references have entered the draft. Serialize dependency
   insertion where needed, as current deletion safeguards do. No caller-supplied
   target IDs may reassign content to another workspace.
4. Recompute preflight in the locked transaction. Save operations must wait and then
   fail against the changed revision/status if publish wins, or publication must
   reject the stale revision if a save wins. No long-running validation outside the
   transaction can authorize the final transition by itself.
5. Record a private, transaction-scoped authorization for **only this edition's**
   draft→published transition, bound to actor/revision/request. Extend the edition
   guard to recognize only that exact permitted transition, retaining all other
   restrictions. A client-set GUC, service-role bypass, generic “skip guard” flag,
   or arbitrary version UPDATE is not sufficient. Private capability rows need
   no client grants, RLS and guaranteed cleanup/rollback; no durable reusable permit.
6. Set status/published timestamp with server values, keep all IDs/number and
   `cms_managed` unchanged, and bump workspace revision. Do not overwrite creator
   attribution. Existing publication collision/immutability triggers still run.
   Check both selectors now resolve this edition before commit.
7. Atomically store immutable publication audit/result and actor-bound receipt,
   consume the private permission and commit. Return edition/revision/publisher/time.

The blanket CMS transition prohibition must acquire this narrow authorized path
before publication is possible. This is a required, explicitly reviewed future
contract extension, not a current capability or a proposal to relax protections.
Any non-CMS/source publisher also needs the shared lock for the publication
transition, not just allocation. The current version guard only acquires it on
INSERT; add universal publication-transition serialization in the reviewed future
design if an independently staged source publisher is found. A newly constructed
builder transaction already retains the INSERT lock through its COMMIT.

Two different staff/drafts: serialize globally and compare reviewed heads. Only
the first succeeds against that head; the second must review again. This avoids
silent last-writer-wins activation. Keep validation, audit and publication in one
transaction. Do not use independent HTTP PATCH calls or a background half-publish.

Failure at any step rolls everything back: edition stays draft, revision stays
unchanged, previous published editions stay available, and no success audit is
created. A transport timeout after COMMIT is uncertain; keep the request UUID,
freeze publication controls and retry/resolve that receipt. Never create another
edition or show success merely because the request was sent. Definite validation
errors retain the draft and report actionable findings; busy/deadlock errors have
bounded recovery. Reload must distinguish published-with-receipt from unpublished.

CMS-managed published content remains protected from maintenance by existing staff
and draft-only guards, even if an obsolete importer explicitly targets it. BLS
also filters `cms_managed` and has a published-job guard. Preserve all three layers.
It can still create unrelated non-CMS jobs-only drafts, which must not pass CMS
publication preflight. Future automatic routine publication needs its own complete
edition builder, validation and concurrency contract; it must not reuse a staff
JWT or mutate CMS workspaces. Database-owner emergency actions remain outside
these app-level guarantees and are not a CMS rollback mechanism.

## 6. Testing strategy

Implementation will reuse existing `supabase/tests/cms-*.sql`,
`tools/test_cms_concurrency.py`, `test_cms_personas_local_api.py`,
`test_cms_jobs_local_api.py`, `test_staff_individual_local_api.py`, local employment/
bills tests, Vitest and `frontend/playwright.local.config.ts`. Use the fixed local
stack and genuine disposable staff/nonstaff/anonymous Auth; never hosted credentials.

| Test area | Required evidence |
| --- | --- |
| Valid publication | Saved complete draft freezes atomically; IDs, all twelve content tables, evidence, eligible flags, generated income and lineage unchanged; audit attribution correct; both default selectors agree. |
| Validation | Missing persona/skill/description, malformed money/relationships, unavailable jobs, empty choices, unsupported effects, bill collisions, route exhaustion, D005/required-copy policy and warnings-only cases. Group deduplication/30-question failures are platform diagnostics and supported-demo holds, not separate authoring rules. Inactive-job incompleteness must not become a new unconditional blocker. |
| Fresh-draft recovery | Overtaken draft and its saved edits remain unchanged/reopenable. Explicit new draft copies the latest canonical published edition, with allocated number/new IDs and complete remapping. Old edits are not automatically imported. Validate actual new IDs, including facts, destination metadata, bills, statistics/effects/prices. |
| Authorization | Unauthenticated, anonymous, nonstaff, revoked staff, wrong workspace and service-role maintenance attempts fail; direct status/DML and capability-table/function access denied. Publisher identity always server-derived. |
| Races | Two publishers of same/different drafts; publish versus Scenario/Persona/Job save or delete; save then publish and publish then save; ordinary edition INSERT/source publication competing for the allocator; compare-and-review heads; lock timeout/deadlock; smallint exhaustion. Verify actual overlapping sessions. |
| Recovery | Lost response before/after commit, exact retry, changed-payload/actor rejection, full browser refresh, duplicate confirmation; forced failure after state transition rolls back audit, revision and edition together. |
| Isolation/history | Fingerprint source/other editions, responses, runs, bill/payment snapshots and group data before/after. Restore active old individual/group sessions and recaps; previous editions remain published and readable. No run repinning or financial recalculation. |
| Frozen CMS | All fresh save/delete calls reject after publication; safe prior receipt replay performs no DML; published workspace leaves editable list; drafting from its published content works; maintenance cannot write either content or lifecycle state. |
| Gameplay/UI | Genuine full routes for every persona, hire-Day-2/3 and support branches; scheduled/unscheduled/general behavior; approved early endings; generated pay and bill snapshots; group implementation compatibility journeys for declared supported demo modes; warning-only confirmation, unsaved edits, keyboard/mobile dialogs and uncertain-outcome recovery. |

The design investigation was read-only. The later implementation task added and
ran the SQL/Auth/API/Chromium suites listed in Section 9. The table above is the
contract's verification strategy; Section 9 distinguishes passing tooling tests
from the unresolved supported-demo gameplay acceptance hold.

## 7. Resolved policy, remaining facts and authorization boundaries

The following are settled by this task and are not open implementation choices:

- One canonical edition/content set, derived from individual simulation content,
  intended for both modes. No group-only authoring standard or editions.
- Incomplete draft persistence continues. Whole saved editions, including untouched
  content, must pass publication validation. Preflight never repairs content.
- In-place publication retains edition/content identities and CMS guards, with
  precise order/review gates and explicit new-draft recovery from the latest
  published canonical edition. No obsolete-draft clone/rebase bypass or renumbering.
- Proven dormant incompleteness warns; structural safety and mandatory active
  content still block. No missing-choice shortcut can classify a scenario dormant.
- Existing eligibility/evidence are preserved. `verified` stays a display setting;
  new facts default false. Empty eligible fact lists work, and eligibility alone
  is not publication approval. No attestation or statistic binding.
- Keep valid existing tax placement. Missing mandatory configuration is a blocker;
  a different valid day is not a reason to relocate the event or infer a new date.
- Deferred optional job metadata cannot become a blocker or new eligibility rule.

Technical facts still unresolved in this read-only local investigation:

1. The “source publisher” mentioned in Stage-1 prose is not available in this
   checkout/local catalog. If another artifact exists, its owner must supply it
   before its concurrency/authorization contract can be relied on. The thin protected CMS operation was implemented after local inventory verification. No hosted verification is
   authorized here, and a local compatibility schema is not a target-schema audit.
2. Exact target-draft completeness and configured tax slots require running preflight on that saved edition. This task did not change or exhaustively
   audit draft content. The local published-tax query returned no D005 metadata;
   the builder artifact cannot substitute for target data.
3. Actual group compatibility and fact-history limitations must be checked against
   the supported demo paths. Missing guarantees must not be reported as passed.
   Pure interaction bugs are implementation work, not authoring policy exceptions.
4. Cross-edition legacy fields and edition-price consumers can differ by environment.
   Confirm real constraints/guards/function definitions before drafting any forward
   migration. Preserve previous published editions and existing authoritative runs.

**Deferred job-field backlog:** entry education (`entry_education`), related
experience (`related_experience`), on-the-job training (`on_job_training`), and
requirements note (`simulation_requirements.notes`, authored through
`requirements_notes`) remain deferred for further investigation. Current
`jobFields.ts`/`JobEditor.tsx` already expose these controls; their existence is not
permission to remove, extend or reinterpret them here. Null/empty optional metadata
is not a publication blocker. Other JSON remains preserved and PostgreSQL-generated
income/real skill flags retain their current semantics. See [Job Editor contract](cms-job-editor.md).

## 8. Approved implementation stages

1. **Confirm contract and target schema.** Use the settled policy and rule register;
   resolve publisher inventory and supported demo scope; inventory local/authorized
   target constraints, grants, lifecycle guards and all edition dependencies.
   Finalize audit/receipt/capability shape, rule version and structural coverage
   proof. No historical reconstruction or unsolicited hosted access.
   Acceptance: reviewed persistence/preflight contract with findings classified as
   content, database, request or platform issues, without group-only content rules.
2. **Protected read-only server preflight.** Under the subsequent implementation authorization, add a forward
   migration for staff-only validation over one coherent snapshot of the entire
   saved edition, using the stable rules above. No DML repairs or lifecycle change.
   SQL/Auth/API tests cover dormant incompleteness versus actual reachability,
   copied untouched rows, empty/ineligible facts, active-role completeness, tax
   slots, exact money, job initialization, cross-edition links and structural proofs.
   Group implementation diagnostics use the same report; known supported-mode
   failures remain visible readiness holds. Acceptance: deterministic findings with
   IDs/witnesses, no content changes and no false claim of publication readiness.
3. **Atomic publication and recovery.** Under the subsequent implementation authorization, implement
   the narrow guarded in-place transition, shared global/workspace locks, exact
   revision/head binding, server attribution, actor-bound idempotency and rollback.
   Preserve all IDs and private lineage/receipt history; freeze published writes,
   filter editable lists, and permit future drafts from published CMS sources.
   Recovery explicitly creates a draft from the latest canonical published edition,
   preserving the older draft without merging its edits. Test number-order versus
   source-age cases, concurrent save/publish/delete, competing publishers, both
   selector winners, time anomalies, uncertainty and all history protections.
   Acceptance: no guard bypass, partial publication or silent reassignment/repair.
4. **Review and confirmation UI.** Under the subsequent implementation authorization, show saved revision,
   source/selection context, blockers/warnings/information and affected records;
   distinguish author-fixable errors from implementation holds. Reuse existing
   unsaved-change protection, FieldInfo and named confirmation/retry components.
   Make clear that an obsolete draft's edits stay in that old workspace while a new
   latest-source draft is created. Acceptance: accessible keyboard/mobile workflows,
   explicit save/review, and confirmed read-only publication result.
5. **Complete demo readiness.** Verify real canonical routes for every persona,
   hiring/support branch, bills, mandatory tax, facts and restoration. Exercise each
   explicitly supported interaction mode against the same edition. Group alignment
   or fact-history fixes, if necessary, require their own authorized work, not
   content workarounds or publication side effects. Run full frontend/SQL/Auth/API/
   concurrency/browser regressions and build. Acceptance: no unresolved blockers in
   supported demo paths, old runs/editions preserved, and an accurate limitations
   record. Passing local tests does not authorize hosted rollout or deployment.

Baseline design verification used code/specification inspection and read-only
local queries. Actual implementation/verification now appears in Section 9;
passing application tests does not remove the group gameplay readiness hold.

For future function security, follow Supabase's
[database function security guidance](https://supabase.com/docs/guides/database/functions#security-definer-vs-invoker)
with explicit grants, staff checks and an empty search path. Application rules
above derive from inspected code and established decisions, not generic examples.

### Remaining authorization boundary

Publication implementation and both interaction modes are already authorized.
Gameplay remediation is not. A separately scoped group-alignment task is needed to
resolve the demonstrated financial/eligibility/progression issues. No demo scope
waiver is assumed. Hosted access, rollout, commits and pushes remain unauthorized.

## 9. Actual local implementation and verification

### Stage 1 — persistence foundation: passed

Migration `supabase/migrations/20261118130044_cms_publication_contract.sql` was
applied to the existing isolated verification database. It checks the twelve
content-table/version/guard prerequisites, generated job income and unique edition
allocator, then creates private `publications` and `publication_permits` tables.
Both have RLS and no browser/service-role grants. Audit UPDATE/DELETE is rejected.
No historical migrations were replayed or reconstructed. No separate source
publisher was present in the local catalog, so the thin CMS publisher below was
implemented instead of invoking an unverified production mechanism.

`cms-publication-contract.sql` verifies these ACLs, RLS, retained direct-write guard,
allocator and generated-income prerequisites. Existing Stage-1 behavior remains
protected; publication gets an explicitly reviewed narrow capability, not a generic
bypass or client-set session flag.

### Stage 2 — protected preflight: passed

Migration `20261118130349_cms_publication_preflight.sql` implements
`public.cms_publication_preflight(version)` as a staff-only STABLE/read-only RPC.
It validates the entire saved edition in one snapshot, with structured affected
records, stable rule metadata, origin, basis and deterministic ordering. Errors on
unauthorized requests disclose no private report. It returns the revision,
validator version (`cms-publication-v1`), both selection heads, findings and
`can_publish`. No data is repaired or made eligible by validation.

Private helpers implement the existing canonical daily selector model and the
existing group question query for compatibility diagnostics. All 51 contract rule
codes/severities are registered. Request rules are enforced at the RPC boundary;
findings are emitted where their conditions occur. Under the reviewed fixed
selector, known exclusions can be classified directly; changed runtime definitions
raise `PUB-MANDATORY-UNPROVEN` rather than silently granting a dormant exemption.
General semantic comparison uses declared keys and concrete event/path witnesses,
not untrusted text-to-statistic inference. Reports cap repeated semantic-conflict
examples at 200, disclose the cap, and remain blocked whenever any conflict exists.

`cms_private.publication_runtime_contract` stores reviewed hashes of ten relevant
runtime functions. A later function change requires explicit validator review,
rather than using an obsolete route proof. Current canonical/group selectors and
all gameplay functions themselves remain unchanged. Numeric validation uses exact
PostgreSQL values and frontend-safe cents; optional job metadata is informational.
Existing tax slots are checked rather than replaced with Day 18.

Known platform diagnostics include group startup/deduplication, lost mandatory tax
inclusion, leaked dormant/general/context content, malformed group-exposed choices,
missing CAC/upfront/skill guards, possible negative balances, divergent unaffordable
clothing handling, uncredited positive weekly income and missing bill settlement.
A within-calendar bill cannot be cleared merely by giving it a zero amount: group
still lacks canonical payment/Ignore resolution. These are supported-mode holds,
not new authoring rules or requests to change financial definitions.

`cms-publication-preflight.sql` covers deterministic/no-write behavior, dormant
versus newly enabled incomplete content, eligibility/evidence preservation, valid
alternative tax dates, missing tax, invalid relationships, runtime-contract drift,
proven general-fact conflicts, platform holds and staff denial. Genuine Auth/API
checks verify anonymous, ordinary authenticated, revoked staff and direct-DML denial.

### Stage 3 — atomic publication and recovery: passed

Migration `20261118131554_cms_atomic_publication.sql` implements:

- `cms_publish_draft(version, revision, request, validator, heads)`: staff check,
  shared advisory lock `(6310,1115)`, workspace lock, content/dependency table locks,
  edition row lock, fresh preflight, exact actor/transaction/revision capability,
  status/timestamp transition, both-selector agreement check, revision increment
  and immutable audit/result in one transaction. The transient permit is consumed.
  Direct CMS insertion as published, flag changes, renumbering and direct lifecycle
  updates remain rejected. All twelve content guards still freeze published rows.
- `cms_recover_draft(version, revision, source, name, request)`: explicitly creates
  from the latest canonical published edition. It locks/binds the old workspace and
  source, records an actor-bound recovery receipt, preserves the old draft/edits,
  and never merges them. It rejects non-overtaken drafts and changed recovery heads.
- `cms_list_publications()`: staff-only persisted success results/name/source for
  reopening after a full-page reload. It exposes no mutable audit access.
- Published-aware `cms_read_draft` and editable-only `cms_list_drafts`. Existing
  bundle fields remain present; published reads add edition/result metadata.
- `cms_create_draft` retains its existing full copy/remapping algorithm and now
  accepts published CMS sources. CMS choice-order positions are copied through
  choice-ID lineage on initial creation; retries return before copying again.
  Generated income remains PostgreSQL-owned. No content or run ID is reassigned.

Table locks precede the edition row lock to avoid the known table-insert / bill
version-share lock inversion. Lock acquisition has a five-second timeout; clients
receive actionable busy/deadlock feedback. Different publication attempts bind the
heads they reviewed: only one wins, even when two distinct drafts are competing.
Identical committed retries return the original audit result before stale/state
checks, while actor/payload mismatches fail. Authentication is checked on retries.

`cms-publication-atomic.sql` injects failure during audit insertion **after** the
transition and verifies rollback of lifecycle, revision, permit and audit. It also
checks order rejection, direct guard denial, immutable source/content/audit,
choice/fact identity preservation, published reopening, published-source drafting,
choice-order lineage and latest-source recovery. Real HTTP overlap tests exercise
same/different drafts, simultaneous edition allocation, and publication versus a Job save on the shared revision.

### Stage 4 — workspace UI: passed

`PublicationReview.tsx` integrates into `ScenarioWorkspace.tsx`; it is not a separate
application. Staff review the saved edition, expand severity/code groups, inspect
named/identified affected records, then explicitly confirm the edition and saved
revision. Unsaved Scenario/Persona/Job edits disable review until saved or reloaded.
Existing navigation/beforeunload protections also cover unresolved outcomes.

A lost response/readback keeps the original publication request and locks authoring
until the same request confirms its outcome. Recovery creation similarly preserves
its request/name during uncertainty. Published workspaces mount an immutable result
rather than editor forms, appear in persistent publication history and can be used
as explicit new-draft sources. Recovery explains that old saved edits remain in the
old workspace. The Viewer refreshes published data when staff switch to it after
publication. Existing FieldInfo, dialog, required-marker and mobile conventions are
reused; no reviewer role or approval chain was introduced. Content is database
persisted; browser storage is not used for drafts or publication receipts.

Changed frontend files: `frontend/src/services/cms.ts`,
`frontend/src/pages/admin/dashboard/{ScenarioWorkspace,AdminDashboardPage,PublicationReview}.tsx`,
and `admin.css`; new/extended Vitest and `e2e-local/cms-publication.spec.ts` coverage.
The genuine Chromium journey covers blocked content, warning-only review, keyboard
confirmation, lost readback/idempotent retry, immutable reopening, Viewer refresh,
overtaken recovery and 390px no-overflow layout.

### Stage 5 — tooling verification passed; full demo readiness blocked

Final local verification:

| Check | Result |
| --- | --- |
| Frontend formatting, lint, TypeScript | Passed. An unused browser-test import and a closed-dialog legend regression were fixed before the passing runs. |
| Frontend tests | 551 passed; two existing opt-in tests skipped. |
| Production build | Passed; bundle-size warning remains. |
| CMS SQL | All 11 rollback-only suites passed via `tools/run_cms_sql_local.py`. An old direct-guard message assertion was preserved by retaining the existing denial wording. |
| Real Auth/API regressions | Persona, Job and Publication suites passed, including authorization, isolation, idempotency and overlapping saves. |
| Real Chromium | All five journeys passed: Scenario, Persona, expenses, Jobs and Publication. |
| Source/history protection | Pre-existing edition/content/gameplay/Auth fingerprints and guard definitions remain unchanged after disposable fixture teardown. |

`tools/test_cms_publication_local_api.py` completes actual Day-30 individual play,
CAC replay, and group interaction in both support modes against one CMS-published
**synthetic** edition.
It checks published-default agreement, pinned versions, mandatory tax once, empty
ineligible-fact behavior, committed recap restoration and full refresh. Test fixture
wages/direct effects are explicitly zero, with no expenses; these isolate publication
mechanics and **are not new defaults or recommended designer content**.

A second synthetic positive-income/bill source demonstrates a real incompatibility:
with the same $100 starting balance, two $1/hour × 40-hour jobs and a $7 scheduled
bill, canonical individual play ends at **$153**, while group ends at **$40**.
`group_private.control_session` stores `weekly_income` but applies only winning
choice deltas to `shared_balance`; it neither credits the canonical paydays nor
executes the individual bill payment/Ignore workflow. The test checks that preflight
returns `PUB-SUPPORTED-MODE-FAILURE` and the publisher rejects that copied draft.
No designer content was changed to clear this hold.

The fixture source is trusted test provisioning, not a publication bypass available
to the application. Tests prove normal direct transitions/writes are denied.
`tools/cms_publication_test_support.py` tears down only tracked synthetic lineage
rooted at the fixture marker on the fixed local container. Its owner-only locked
transaction temporarily suspends user triggers for those fixture deletions, keeps
FK triggers enforced, then restores every original trigger mode. It installs no
server backdoor and aborts atomically on unexpected references. Existing rows and
guard definitions are fingerprinted before/after. No historical designer edition
is used as a deletion or mutation target.

**Acceptance hold:** both interaction modes remain intended for the demo, so the
reproduced group financial failure prevents full demo-readiness acceptance. Group
skill/CAC/upfront/early-ending and recap differences also remain implementation
risks/holds as identified. The publication system reports and blocks demonstrated
unsafe paths; it does not remedy gameplay or claim universal compatibility.
Separate authorization is required for group alignment (or a later explicit scope
exception). No such exception, gameplay remediation, hosted rollout, commit or
push occurred in this publication task.

Current authoring limitation: some legacy blockers involve metadata/mappings that
existing forms do not edit, such as a missing D005 library identity or engine/context
association. The report identifies the records; publication does not create a tax
slot, assign an engine or enable content automatically. Any additional setup/editor
work must be explicitly authorized with designer-supplied configuration.
