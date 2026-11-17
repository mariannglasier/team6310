# Actual post-choice player flow — November 17, 2026

Source inspection only; no gameplay changes. This report corrects the earlier
assumption that ordinary `response_text` is currently rendered. It is retrieved,
but deliberately hidden by `ScenarioPanel`; its test asserts that saved feedback
is absent. Managing this text remains useful, but displaying it needs a separately
authorized gameplay/UI change.

## Data flow

```text
Select choice → React selection only (no charges)
Submit → scenarioGameplay.submitScenario → submit_scenario_decision
       → locked owned run + pinned scenario/choice/edition validation
       → affordability/CAC checks → response + run balance commit
       → restore_scenario_decision → validated saved decision
       → ScenarioPanel renders title/description + facts + Continue
       → onCommit → BillSimulation refresh → get_bill_snapshot
                   + employmentSnapshot → financial sidebars
Facts: separate get_event_recap_facts → scenario_fact_copy → ScenarioFacts
Continue: protected employment action / progression trigger (not next_scenario_id)
```

`useSimulationMutation` coordinates pending/uncertain state across financial,
employment and scenario operations. `ScenarioPanel` keeps selection temporary,
disables controls while submitting, restores after an ambiguous failure and offers
Reload saved decision when needed. Success is shown only from committed state.
Refresh restores response identity and balances without applying them again.

## What the player actually sees

| Information | Source / nature | Retrieval | Renderer | CMS location |
| --- | --- | --- | --- | --- |
| Choice selection and pre-submit amounts | Authored `choices.choice_text`, `balance_change`, `requires_cac`, `upfront_cost` | `scenarioContent.loadScenario`, pinned scenario/edition; regular mode filters CAC choices | `ScenarioPanel` + `RadioGroup`. Labels show signed effect or Initial expense for upfront-cost/CAC-positive cases | Existing choice editor |
| Scenario title and narrative remain after submission | Authored `scenarios.title`, `description` | Same content loader | `ScenarioPanel`, before and after commitment | Existing scenario editor |
| **Authored immediate response is currently NOT rendered** | `choices.response_text`, not a response-record text snapshot | Submit RPC returns it; frontend then calls restore RPC, which rejoins the pinned choice. `ScenarioRunSnapshot.responseText` receives it | No ordinary recap component reads responseText. `ScenarioPanel.test.tsx` explicitly expects it absent | Existing choice response editor; do not silently activate display |
| Current balance and income/expense totals | Calculated run `current_balance`; historical `player_responses.balance_change_applied` / `balance_after`; employment history; paid bill snapshots | `submit_scenario_decision`, restore RPC, onCommit → `BillSimulation.refresh` → `get_bill_snapshot` and `employmentSnapshot` | `FinancialTracking` and `BalanceDisplay`; starting balance is derived from current balance and committed income/charges | Edit definitions only; never editable totals, response records or balances |
| Successful choice effect | Direct `choices.balance_change` applied once, response stores applied delta/result balance/time/choice/version | Locked transaction, same-choice retry returns committed result; different-choice retry rejected | Reflected in financial totals, not a separate signed-delta ordinary recap card | Existing choice editor defines delta; historical response immutable to CMS |
| Affordability failure | Server checks `current_balance < upfront_cost` or resulting balance < 0. No extra upfront deduction; failure records terminal state, without a successful answer/charge | Protected scenario RPC, ended state restored | Opening your results in `ScenarioPanel`, then `BillSimulation` / `SimulationResult` reason and ending summary | Gameplay calculation; no editor. Threshold/net delta are authored fields |
| CAC availability/use | `requires_cac` filters/restricts individual choices; committed CAC choice sets `employment_state.assistanceUsed`. Enabling support alone grants nothing | Content loader/filter, scenario RPC and restored employment state | Available choices, support-mode context, final results. CAC impact facts are shown in CAC mode regardless of which choice was used | Choice flag editable; calculated usage state is not |
| General fact / authored context / CAC impact | Authored `scenario_fact_copy.display_text`, `fact_role`, `copy_kind`, `verified`, semantic key, source/period/evidence | Separate `get_event_recap_facts`, matching committed event, owner/run/edition; only verified=true; CAC role gated by support mode | `ScenarioFacts`: Community fact, About this decision, CAC impact. Source URL is returned/validated but not rendered as a link; reporting_period/evidence are not in RPC result | Future supporting-copy section inside Scenario Editor. Keep `verified` label **Eligible for gameplay display**, default false, editable normally; preserve evidence unless explicitly edited |
| Continue control and day progress | Computed calendar/employment state, current scenario response completion | Protected actions and progression trigger; no destination routing | `ScenarioPanel` Continue, `EmploymentPanel`, financial day timeline | No branch editor; scheduling remains authored constraints, not direct advancement |
| Household/job identity, schedule projections, payday notification | Persona/job definitions plus committed employment state/history, expense schedules | Employment/content loaders and bill snapshot | Surrounding `FinancialTracking`, employment feedback and automatic income notification | Future Persona Editor + expenses; separate Job Editor. These are not newly generated consequences of each choice |
| Due/paid/ignored bill information | `playthrough_expenses` snapshots: name, due day, principal, fixed fee, payment/Ignore history. `persona_expenses` is definition source | `pay_bill` / `ignore_bill`, then `get_bill_snapshot`; `settlement` = principal + one fee if ignored | `BillControls` / `ExpenseRow`: Paid amount, Ignored/outstanding, fee, due day; overdue sidebar and final outstanding summary | Future Persona Editor expense definitions. Never edit occurrences/payments |
| Bill context facts | `scenario_bill_links` connects expense definition to scenario/edition, not a financial effect | Event RPC resolves committed bill occurrence → expense link → scenario_fact_copy | `DueBillsPanel` loads facts after all today's bills are resolved | Future bill context selector within expense interface; supporting copy stays in Scenario Editor |

Bills are independent operations, not a cascade of ordinary choice submission.
Pay deducts full settlement once; insufficient funds rejects without ending the
run. Ignore adds one obligation fee without immediately deducting it; the bill
may later be fully paid. Ordinary scenario days and bill days are separated by
existing guards. Income can occur before the day's content but is not a scenario
choice credit. Missing facts do not invent replacement observations.

## Related reference systems that are not equivalent to recap copy

- `statistics`: structured value/unit/geography/period/source observations.
  `scenario_statistics` links scenarios and statistics within edition metadata.
  Current ordinary recap RPCs do not join either table. Existing schema has a
  scenario-ID-only link PK; it does not enforce the intended two-role fact model.
  Viewer Statistics/scenario link panels expose them; statistics stay read-only.
- `cac_support_effects`: choice/edition-linked assistance amount and alternate
  feedback/explanation. Individual submission explicitly rejects choices having
  these records. Group flow applies winning direct choice delta, not this table.
  Viewer can inspect stored effects; no current editor or runtime application.
- `cac_services` / `cac_service_facts`: shared service registry and annual
  values/units/reporting years. Viewer Service Facts exposes them. No recap join,
  no automatic household entitlement, and no enforced text/number binding.
- `scenario_bill_links`: association only; retains a bill's reference to authored
  context without charging a scenario. Deleting its scenario removes the link,
  not the expense definition or any bill occurrence.
- `player_responses`: historical applied amounts and answer identity, not mutable
  authoring content. Narrative is restored from immutable edition content, not
  recalculated from new CMS drafts.

Group play is a distinct path: group controller/state RPCs apply a winning choice's
direct delta to shared balance and expose question/choice/tally data. The inspected
`GroupPages` path does not render individual ScenarioFacts or responseText, and
has different CAC/upfront checks. Do not imply that changing stored feedback or
source data currently changes every mode's recap. Development preview fixtures
also do not establish normal gameplay rendering behavior.

## Next authoring work

Keep title/narrative, scheduling/persona, choices, response copy and direct effect
fields together. Add supporting general/CAC copy, source/period and display
eligibility inside Scenario Editor next. Keep evidence preservation and simple
eligibility, without reviewers, attestation, approvals or automatic bindings.
Do not expose balance calculations, transactions, fees already incurred or source
statistics as ordinary scenario fields. Unsupported cac_support_effects need a
separate gameplay decision before any editor. The missing ordinary responseText
rendering is an identified follow-up, not implemented here.

Key inspected files: `frontend/src/components/simulation/ScenarioPanel.tsx`,
`ScenarioPanel.test.tsx`, `ScenarioFacts.tsx`, `FinancialTracking.tsx`,
`BillControls.tsx`; `frontend/src/pages/individual/{EmploymentPanel,BillSimulation}.tsx`;
`frontend/src/services/{scenarioContent,scenarioGameplay,scenarioFacts,billGameplay,
employmentGameplay}.ts`; migrations `20261107010000`, `20261109181822`,
`20261109181824`, `20261109192414`, `20261108020000`, `20261108030000`,
`20261109200648` and the staff-admission extension `20261113204615`.

## Scenario deletion implementation and verification

`20261117163821_cms_scenario_deletion.sql` introduces a staff-only deletion RPC,
expected revision and idempotent request receipt. It locks the workspace and
relevant FK tables, snapshots only the target scenario's owned rows, and checks
every incoming FK (including unknown tables/composite keys) before deleting.
Another scenario's incoming destination, a gameplay reference or unexpected
dependency blocks the whole transaction. It removes choices, facts, metadata,
scenario/statistic and bill links, choice support effects/order and matching
lineage. Statistics and expense definitions remain; receipts retain the audit.
No browser cascades or disabled constraints. Applied locally only.

UI: a shared DeleteControl is a separate sibling of each scenario's open button,
with named confirmation, pending state and recoverable error. The deletion request
ID is retained for retries; success reloads the workspace and clears the editor
only if its scenario was removed.

Final checks: 464 frontend tests passed (two opt-in tests skipped); format, lint,
typecheck and build passed. Four local SQL suites passed, including complete copy,
historical preservation, atomic saves, draft deletion and new scenario deletion.
Chromium passed scenario confirmation/cancellation/removal, existing editing and
refresh/reopen, mode switching, draft deletion and mobile layout. No hosted writes,
commits, pushes or deployments.
