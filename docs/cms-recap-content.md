> **November 17 correction:** The full [post-choice trace](cms-post-choice-flow.md) confirms ordinary response text is retrieved but not rendered. Earlier statements below implying its display are superseded. See the [current roadmap](cms-roadmap.md).

# Scenario recap content and draft deletion — November 17, 2026

Investigation used repository migrations, loaders/renderers and read-only hosted
foreign-key catalog inspection. CMS changes and tests use local Supabase only.
No new fact/statistic editors are implemented.

## Storage → gameplay → CMS

| Storage / relationship | Runtime use and actual display | CMS visibility / future editing location |
| --- | --- | --- |
| `choices`, keyed by choice and scenario/edition | `submit_scenario_decision` commits `balance_change` to a response and returns `response_text`; `restore_scenario_decision` rejoins the edition's choice for recap copy. `ScenarioPanel` displays committed feedback and financial result. `upfront_cost` is a threshold, not another deduction. | Viewer choice details; current choice editor. Keep feedback and direct effects here. |
| `player_responses` → choice, run, edition | Stores applied amount, resulting balance, answer/time. Submission retries restore the committed answer. Not editable content. | Never expose as a CMS content editor. |
| `scenario_fact_copy` → scenario and edition, unique role general/CAC | A separate `loadScenarioFacts` call uses `get_event_recap_facts`, after submission. Requires eligible owner/run/event, matching edition, and `verified=true`. General copy returned in both modes; CAC copy only in support mode. `ScenarioFacts` renders stored text under Community fact, About this decision (`copy_kind=context`), or CAC impact. Source URL is validated/returned but this renderer currently does not render a link; evidence and reporting period are not returned. These are scenario/event-specific, not choice-specific facts. | Not in current viewer queries or editor. Future supporting-copy section inside scenario editor; eligibility labelled Eligible for gameplay display, no separate verification workflow. |
| `statistics` ← `scenario_statistics` → scenario/edition | Structured observation and association model. Neither recap RPC joins these tables. Existing schema's link PK is scenario_id alone, unlike the intended two-fact-role design. Prior read-only inspection found both tables empty; do not treat them as the source of current displayed copy. | Viewer Statistics and scenario-link details; remain read-only. No automatic text binding. |
| `cac_support_effects` → choice/edition | Legacy/unsupported assistance-effect records. Individual `submit_scenario_decision` explicitly rejects a choice having these rows. Group controller applies the winning choice's direct balance_change, not these effects. Not interchangeable with requires_cac or recap facts. | Viewer renders stored effects; draft copying preserves them. No new editor until supported semantics are approved; eventual location would be choice editor. |
| `scenario_bill_links` → expense definition, scenario, edition | For a bill event, `get_event_recap_facts` follows the committed occurrence's expense definition to a scenario, then reads that scenario's fact copy. This is recap context, not a second financial effect. | Not currently shown as an editable relationship. Future shared bill-definition editor can select context; fact copy remains in scenario editor. |
| `cac_services` ← `cac_service_facts` | Shared service registry and annual values/units/reporting years. Not edition-scoped. Recap reads do not join them. Semantic keys sometimes resemble fact UUIDs, but no enforced observation binding exists. Existing builder uses a documentation snapshot and one special formatting case; this is not a general runtime numerical binding. | Viewer CAC Service Facts. Future source/import management, not ordinary choice editing. |

Individual flow:

`choice submission → player_responses + run balance → committed response_text recap`

`committed recap → separate event-facts RPC → edition-bound scenario_fact_copy → ScenarioFacts`

Bill events first resolve `playthrough_expenses → persona_expenses → scenario_bill_links`.
Employment D001–D004 resolve through library metadata/persona and employment stage.
The older `get_scenario_recap_facts` is retained but frontend uses the event RPC.

Group mode uses `group_private.control_session` and `read_session_state`: winning
choice tallies/direct balance changes and stored question sequence. The inspected
group path does not call the supporting-fact RPCs or render the individual
ScenarioFacts component. It does not apply the individual eligibility/upfront
checks. No mode's progression follows next_scenario_id.

References: `frontend/src/components/simulation/{ScenarioPanel,ScenarioFacts}.tsx`,
`frontend/src/services/{scenarioGameplay,scenarioFacts,adminContent}.ts`, migrations
`20261107010000`, `20261109181809`, `20261109181824`, `20261109200648`.

## Deletion boundary

`cms_delete_draft(version, expectedRevision)` requires active staff and an
unpublished CMS workspace. It removes all twelve edition-content tables, private
choice order, receipts, lineage, workspace and version, in reverse FK order.
Shared categories, services and annual service facts are untouched.

Full FK inspection found dangerous gameplay references through choices, scenarios,
personas, jobs, expenses and editions (including cascades), plus hosted
`game_data_refresh_runs.published_version`. The operation inspects all incoming
FKs dynamically, including composite keys, and refuses any reference outside the
target's known owned records. Unknown future dependencies also block deletion.
No historical gameplay table is included in the deletion allowlist.

Deletion locks the workspace and involved/reference tables for the short
transaction, with a five-second lock timeout. Concurrent saves serialize on the
workspace revision. A private, ungranted transaction marker narrowly authorizes
the final version removal; general CMS publication/deletion guards remain closed.
No triggers or constraints are disabled. Any error rolls back all changes. A
retry of a successfully deleted UUID is harmless. A referenced draft is not
partially deleted. Saved requests/lineage are removed with the draft as requested.

Tests: rollback-only `supabase/tests/cms-deletion.sql` checks all owned tables,
stale revisions, published/non-staff denial and an unexpected ON DELETE CASCADE
reference that must block deletion without losing content. Existing historical
hash/security and atomic-choice suites remain applicable. Browser coverage checks
named confirmation/cancel/delete and floating-help layout stability.

Final verification: 463 frontend tests passed (two opt-in tests skipped), format,
lint, typecheck and build passed. All three local SQL suites passed. The Chromium
journey passed named confirmation/cancellation/deletion, keyboard Escape on help,
no help-induced form movement, persistence, mode switching and mobile checks.
The forward deletion migration was applied only locally. No hosted writes,
commits, pushes or deployments were performed.
