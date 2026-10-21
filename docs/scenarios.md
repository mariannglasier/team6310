# Scenario Creation and Maintenance — CAC Poverty Exercise

## 1. Purpose and authority

This document directs the scenario-generation agent and the developers implementing its workflow. The agent creates one reviewable scenario per request, maintains source-backed amounts and facts, and helps staff keep the scenario library aligned with CAC services. Gameplay uses saved, approved content; it never requests a model-generated scenario during play.

These requirements record the team's October 21, 2026 decisions. They extend the relational entities in `docs/data-model.md`, rather than replacing them with an unrelated card format. New storage names and fields identified below are required design additions or recommended implementation details, not claims about implemented functionality.

The initial SQL migration is empty. Database implementation and cross-table enforcement remain pending. No implemented scenario class was found; the documented relational entities define the starting structure.

For scenario behavior, these decisions supersede older conflicting statements about monthly income, unspecified money signs, undefined early termination, and advancing one day per question. Other documents must be reconciled before implementation. This document does not itself implement those changes.

## 2. Agent responsibilities and boundaries

The agent must:

- Prioritize the current CAC annual outcomes file and the six categories below.
- Cover all confirmed client-facing CAC services across the approved scenario library.
- Use approved external observations for costs, income assumptions, and general facts where appropriate.
- Generate a scenario from a CAC administrator's description using the same template and validation as maintenance-generated content.
- Propose new content when a confirmed service lacks approved coverage.
- Submit drafts for staff approval. Never publish directly, change gameplay rules, invent services, or treat generated prose as a factual source.

Default model selection is **GPT-5.4 mini**, supplied by the team. Store its API model identifier in server configuration, for example `SCENARIO_MODEL`; do not hard-code the model throughout the workflow. Validate the configured identifier against the provider before deployment. Changing models must not require rewriting generation, validation, or approval logic.

One request produces at most one scenario draft. Allow at most three total model attempts per request, including the initial attempt. Give validation errors back to subsequent attempts. After the third unsuccessful attempt, mark the request failed and report actionable errors to staff. Never silently retry indefinitely or retain a partial draft as approved content.

## 3. Categories and coverage

Create a `categories` table and require `scenarios.category_id` to reference it. Use these six categories exactly:

| Category | CAC content to prioritize from the supplied 2025 file |
| --- | --- |
| Housing & Utilities | Financial assistance, evictions prevented, housing retained; workforce-development rent assistance where applicable |
| Food & Nutrition | Mini-Market food support, food visits and quantities, holiday baskets |
| Employment & Adult Education | Career services, job placement, ESOL, computer education, workforce development, Thrive and TCC/scholarships |
| Essential Goods & Clothing | Clothing assistance and client thrift credit |
| Childcare & Youth | Meals for kids, school supplies, Teacher's Closet, Coats for Kids, Hope for the Holidays |
| Financial Literacy & Taxes | Financial Goals education and Volunteer Income Tax Assistance (VITA) |

These mappings organize content; they do not establish eligibility rules or promise benefits. The category name Childcare & Youth does not establish that CAC pays daycare costs. Teacher's Closet serves a distinct audience and requires a staff-approved household-facing framing or a relevance decision. Workforce-development transportation is present in the file, but must not be generalized into universal transportation assistance.

Each planned 30-day route must include at least one eligible scenario from every category for which the persona is eligible, while respecting persona eligibility and fixed employment events. Category coverage is a route invariant, not a random-selection hope. A household without children must not be shown child-related scenarios; it may therefore cover five categories rather than six. An early ending caused by inability to pay may occur before all eligible categories are encountered; do not claim that a terminated run completed coverage.

Distinguish **library service coverage** from **per-run category coverage**. Every confirmed service needs approved representation somewhere in the library; each run needs every category for which its persona is eligible, not every service.

Add persona-category links and scenario-persona links, scoped to an edition. A scenario without at least one persona link is invalid. Link a scenario only to personas whose category links include that scenario's category and whose circumstances satisfy its eligibility conditions. Validate that each selectable persona has a viable route covering every category to which that persona is eligible before publication. If none exists, block publication or that persona's availability and report the gap; do not silently omit an eligible category or show a child-related scenario to a household without children.

## 4. Current CAC source: 2025 Outcomes

The initial client source is `2025 Outcomes(2025 Outcomes).csv`. It has columns `CAC PROGRAM`, `2025`, and `Unit`; program and subsection labels appear in rows. A future service may appear as a new row or section, not merely a new column. A new year column usually represents a reporting-period change, not a new service.

Preserve the original file, reporting year, row/section path, imported value and unit, import timestamp, and import identity or content hash. Normalize commas, currency symbols and surrounding whitespace using decimal parsing. Retain raw labels alongside normalized labels. Blank section headings are not zero-valued observations. Units such as `Punds`, `Valuie In-kind`, and the missing unit on the holiday in-kind row require explicit normalization or review rather than silent assumptions.

Examples of accurately attributable 2025 facts:

| Topic | Value reported in the file | Interpretation limit |
| --- | --- | --- |
| Evictions prevented | 1,108 households | Not an individual approval probability |
| Financial assistance amount paid | $796,416.64 | Aggregate spending, not a per-client allowance |
| Mini-Market visits | 36,521 | Visits, not unique clients |
| Clothing client thrift credit | $206,768.67 | Aggregate credit, not a guaranteed household allocation |
| ESOL | 521 students | Not a measured employment success rate |
| Computers | 42 students | Not a credential or job guarantee |
| VITA returns | 503 | Keep distinct from the separately listed 590 federal returns prepared |
| Federal refunds | $582,083.00 | Aggregate refunds, not a promised individual refund |

Do not add overlapping populations, deduce unsupported percentages, or replace a simulation cost with an annual program total. Volunteer hours, donations, sales, waste and organizational totals may provide context but are not automatically household services. Maintain a staff-reviewed service registry, including reporting evidence and applicability, rather than treating every numeric field as a benefit.

## 5. Facts and external economic inputs

Each scenario in each edition must have exactly one general fact and exactly one CAC fact. Add `fact_role` to `scenario_statistics`, restricted to `general` or `cac`, and enforce uniqueness on `(version_id, scenario_id, fact_role)`. The linked statistic must be from the same edition. Publication validation enforces both roles, including when one role will be hidden in a game mode.

- Without CAC assistance: show the general fact on the result screen.
- With CAC assistance: show both the general fact and CAC impact fact, even when the player did not select the available assistance. Clearly distinguish available support from assistance actually used.

Facts must match the scenario topic and preserve source, period, unit, population and geography. CAC facts normally come from the current approved annual file. A broader regional fact may be used when local data is unavailable, with its geography clearly labeled. If a suitable fact is unavailable, leave the scenario pending and report the missing evidence; do not invent a statistic.

Use the sources already described in `docs/api.md` as intended integrations, subject to exact series and availability verification:

| Source | Intended scenario use | Important constraint |
| --- | --- | --- |
| Census ACS | Population, poverty, education, language and related general context | Population estimates do not determine a player's individual outcome |
| HUD Fair Market Rents | Housing-cost benchmark | Requires approved household/bedroom/geography mapping |
| HUD Income Limits | Income/eligibility context | Not a household wage or benefit amount |
| BLS OEWS | Occupation-specific wage assumptions and employment context | Confirm wage measure and conversion to weekly pay; current plan uses file imports |
| USDA Food Plans | Household food-budget assumptions | Requires household composition and documented period conversion |
| EIA | Electricity-price input | Price per energy unit needs usage and other approved assumptions to become a bill |
| FRED food CPI | Adjust an approved baseline food cost | An index is not a dollar price; record baseline period and ratio formula |
| FINRA NFCS | Financial-literacy and financial-resilience context | Survey import, not a live source of purchase prices |
| CAC annual file | CAC services and impact facts | Annual aggregate outcomes do not define individual entitlements |

Not every source is an API. Retain controlled file/report imports where that is the documented integration. Fetch inputs on the backend; keep source and model credentials out of browser code and generated content.

## 6. Monthly refresh and new-service detection

Run the maintenance check on the **first day of every month at 12:00 a.m. America/New_York**. Configure a timezone-aware scheduler; a fixed UTC midnight is not equivalent. The cron expression in that timezone is `0 0 1 * *`. This is a required application schedule, not an automation created by this document.

The workflow is:

1. Start a maintenance record with an idempotency key for the month. Check configured API sources for new observations and check approved file-import locations for newer supplied files. A source with no new release remains unchanged.
2. Validate source format, units, geography, reporting period, missing values and revisions. Store observations immutably, including revised observations for the same period. Retain the last approved usable values when a source fails; flag stale data for staff.
3. Compare source observations and service mappings against the last approved set. A number change is a value update; a schema/label change is a candidate mapping change; neither by itself confirms a new service.
4. Recalculate only dependent amounts and refresh dependent facts in a draft edition. Produce a before/after diff, affected narrative, formulas, observations and validation results. Update repeated amounts in descriptions and results consistently with their authoritative money fields.
5. Ask staff to confirm candidate new services and mappings. For each newly confirmed service, create one pending draft if approved coverage is missing. Reuse an existing pending request or draft rather than creating duplicates on subsequent monthly checks. A rejected draft may be replaced by a new deliberate request.
6. Validate and submit the edition for review. Publish only after staff approval. Monthly checks stage changes; they do not bypass approval or mutate active games.

A new annual CAC report can be imported by staff when received; the next maintenance check processes it, or staff can explicitly start maintenance sooner. Do not assume the CSV updates itself or that a CAC feed exists. Detect removed or renamed services for review without automatically deleting historical content.

## 7. Source bindings and resolved costs

Begin with a small binding record linked to a choice or an expense. It identifies the target field, source observation, unit, approved transformation and assumptions, edition, and resolved amount. The edition must own the resolved value even if immutable raw observations are shared across editions.

A binding may target `choices.balance_change` or an expense amount; extend the target mechanism deliberately when wages or other fields need sourcing. Use a controlled formula identifier with validated inputs, not executable model-generated code. Record whether an amount is externally sourced, calculated, or a staff-approved simulation assumption.

Example: a food amount may be `approved_baseline_cost × current_index / baseline_index`. Both observations, the baseline cost, household assumptions and rounding must be recorded. An electricity bill requires an approved quantity and unit conversion in addition to a price observation.

A full `scenario_parameters` table is deferred until concrete scenarios show reusable values needing it. If introduced, it stores shared named values such as a grocery amount and their edition-scoped references. Do not add an empty abstraction merely for generation. Bindings are required now to trace dependencies; their exact schema and formulas remain to be finalized as values are chosen.

## 8. Scenario template and relational mapping

Generate a structured bundle, validate it, then persist it into the existing relational entities. Nested draft objects are a transport/review format, not a replacement database model. IDs must resolve to actual records; the model must not fabricate trusted IDs.

| Component | Required fields and behavior |
| --- | --- |
| Scenario → `scenarios` | Existing `scenario_id`, `title`, `description`, `default_day`, `version_id`; add required `category_id` and `schedule_type` (`scheduled` or `non_scheduled`) |
| Persona links → new `scenario_personas` | `version_id`, `scenario_id`, `persona_id`; at least one link; validate category compatibility |
| Category applicability → new `persona_categories` | Edition, persona and category links used by route validation |
| Choices → `choices` | Existing `choice_id`, `scenario_id`, `choice_text`, `balance_change`, `response_text`, optional `next_scenario_id`, `version_id`; add explicit visibility/eligibility and state-transition data for branching |
| Assistance → `cac_support_effects` | Retain the existing effect fields; at most one financial assistance effect per choice per edition; validate eligible expense and CAC-only use |
| Facts → `statistics` and `scenario_statistics` | Exactly one linked general fact and one linked CAC fact, each with provenance and matching edition |
| Cost bindings → new binding storage | Target choice/expense, source observation or approved assumption, formula/inputs, resolved amount, edition |
| Scheduling link | Connect a scheduled scenario to its expense occurrence without charging it twice; ordinary expenses continue to use `persona_expenses` and `playthrough_expenses` |
| Service coverage → new linkage | Explicit confirmed service identifiers represented by the scenario, scoped to the edition; do not infer coverage only from keywords |
| Review metadata | Generation request, validation findings, staff edits, approval, and change summary; pending state stays separate from approved content |

`default_day` is scheduling guidance unless the scenario belongs to the fixed employment sequence. `next_scenario_id = NULL` must not automatically end a run when normal routing can select another scenario. Validate all destinations, eligibility predicates and state changes server-side. Supported mechanics must be explicitly implemented; free-form instructions in prose cannot change game state.

Each generated bundle must include title, player-facing situation, category, personas, confirmed services, timing, choices, base costs, any CAC effect, result text, general/CAC fact links, source bindings, state requirements and outcomes, and review notes for unresolved inputs. Missing required inputs make it incomplete, not publishable.

## 9. Content editions, stable IDs and approval

Every scenario, choice, assistance effect, fact link, resolved cost and linked content definition belongs to one `version_id`. Every playthrough retains its starting `version_id`, including its persona, schedule, statistics and branching definitions. Source refreshes must not change active or completed games.

Staff edit a draft edition. Publication freezes that edition. Later changes create another edition. Keep pending edits separate from approved content until approval.

To reconcile stable IDs with frozen editions, use stable logical IDs with edition-scoped records: for example, `(version_id, scenario_id)` identifies a scenario revision, and choices use the equivalent key. A new edition can contain the same logical scenario ID with updated content; the previous edition's row remains unchanged. Use composite foreign keys or equivalent enforced constraints to prevent cross-edition links. The existing ID-only PK and junction-key design must be revised accordingly.

On approval, atomically promote the validated draft edition and make it the approved edition for new runs. Preserve stable logical IDs; update only the current-edition pointer and any mutable draft/review records. **Do not overwrite frozen approved rows in place.** Updating those rows under a single global primary key would contradict the requirement to preserve earlier editions. There is no requirement to regenerate every scenario or assign fresh logical IDs every month; publication must nevertheless materialize a complete valid edition or an explicitly designed equivalent snapshot.

The approval transaction must recheck draft status and expected revision, completeness, edition consistency, facts, costs, service coverage and persona routes. Concurrent or stale approvals must fail safely. Unauthorized users cannot generate protected changes, approve, or publish.

## 10. Request tracking and administrator workflow

Add `scenario_generation_requests` so generation attempts, failures and pending review remain traceable. Recommended fields: request ID, trigger (`admin` or `maintenance`), requester/maintenance ID, target edition, target service when applicable, administrator description, input observation IDs, configured model, template/schema revision, status, attempt count, validation errors, resulting draft ID, timestamps and idempotency key.

Recommended states: queued → generating → pending_review → approved or rejected; generation may instead end in failed. Approval of a scenario draft and publication of its edition are distinct operations. One request can have several attempts but at most one resulting scenario draft.

Admin flow:

1. Authorized CAC staff select a draft edition and describe the situation, intended household, category and relevant service. Existing known values and sources can be selected; missing requirements are flagged.
2. The backend loads approved source observations, current service mappings, valid personas, supported mechanics and the template. Treat administrator text and imported source text as content inputs, never as authority to bypass validation.
3. The model generates one structured scenario. Validate it and retry within the three-attempt limit if necessary.
4. Show the pending scenario, choices, effects, facts, sources and financial preview. Staff can edit or reject it without changing approved content.
5. After validation and approval, include it in an edition eligible for publication. New runs use the new edition only after publication.

Do not store credentials in request logs. Retain enough input provenance to explain the draft and model selection without exposing unnecessary staff data.

## 11. Money and assistance rules

| Item | Required rule |
| --- | --- |
| Currency | USD |
| Database amounts | `numeric(12,2)` |
| Authoritative calculation | Exact decimal arithmetic or integer cents; ordinary floating-point arithmetic is not authoritative |
| Rounding | Round each final calculated monetary amount once to the nearest cent; half-cent ties round away from zero |
| Sign | Negative balance change removes household money; positive adds household money |
| Assistance eligibility | Apply only when CAC help is enabled and the qualifying choice is submitted |
| Effect count | At most one financial assistance effect per choice per edition; ordinary choices may have none |
| Expense assistance | Cap assistance at the eligible expense remaining; never create extra cash from unused coverage |
| Duplicate charges | Charge through the scenario or its scheduled bill, never both |

For an expense of `E ≥ 0` with assistance `A ≥ 0`, household payment is `E − min(A, E)` and the expense-related balance change is its negative. Apply the cap against the eligible remaining expense, not unrelated purchases. In-kind groceries or clothing may cover the entire eligible expense, producing a household cost of $0. This represents free goods, not cash deposited into the household account.

Separate an explicit refund or income credit from expense assistance. The tax refund below is an intentional positive balance change and is not capped to a filing fee. Unsupported assistance stacking is invalid.

Selecting a choice does not commit effects. Submitting it validates eligibility and edition, computes the net household payment, and atomically records the response and state changes. Use idempotency for decisions, bills, refunds and income occurrences so retries or refreshes cannot duplicate money.

## 12. Calendar, scheduled events and inability to pay

Scenarios are either scheduled or non-scheduled. Scheduled payments, bills, and other scheduled events are still presented and resolved as scenarios at the end of the day; their scheduled status supplies timing/projection information but does not create a separate gameplay mechanism. A linked bill and scenario represent one obligation with one authoritative charge path. A sidebar projection does not itself deduct money.

Income is the exception: on its due day, automatically credit it and show a brief income notification before presenting that day's scenarios. It has no player choice and is not also represented as an end-of-day scenario. Add an income definition/occurrence mechanism rather than forcing positive income into a bill table that represents expenses. Occurrences reference the run's job and edition.

The simulation has a pre-game stage followed by Days 1–30. Multiple decisions may occur on one day; completing a question does not inherently advance the calendar. Apply the automatic income notification/credit first when due, then present the day's scenarios. Scheduled and non-scheduled scenarios, including bills and events, are resolved through the same end-of-day scenario flow. Fixed employment events must retain their day even when other scenarios are selected.

If a required payable event cannot be paid after applicable assistance, end the run and show the end screen with the actual ending day, reason and committed financial history. Do not record an unaffordable deduction as successfully paid or continue with an invented loan. If an optional choice is attempted and cannot be paid after applicable assistance, end the run as well; this is allowed even when it is the only available option. Do not end play merely because an unselected option costs too much.

## 13. Fixed opening employment sequence

This sequence is authored and validated as a coordinated flow. The generator may supply narrative around it but cannot change the specified success conditions.

### Before Day 1: job selection and preparation

Show job options the persona currently qualifies for and the associated weekly incomes. Available options may be limited without CAC. In CAC mode, also offer the option to go to CAC for relevant English, computer-skills or other confirmed preparation. The simulated preparation happens before Day 1, without implying that real programs take no time or guarantee work.

Record the selected target job and whether the qualifying education/preparation was completed. Show a result screen with the general fact and, in CAC mode, CAC impact fact before starting Day 1. Merely enabling CAC does not set education-completed state.

### Day 2: first interview

Offer buying professional clothes, making current clothes work, or using the CAC clothing closet when CAC is enabled and applicable. Record ownership of professional clothing after purchase or CAC provision.

| Preparation completed before Day 1 | Interview clothing | Result |
| --- | --- | --- |
| Yes, through the specified CAC preparation choice | Purchased professional clothes | First job obtained |
| Yes, through the specified CAC preparation choice | CAC professional clothes | First job obtained |
| Yes | Current clothes made to work | First interview fails |
| No | Any clothing choice | First interview fails |

This deliberately means every player in non-CAC mode fails the first interview. It is a scripted educational rule, not a real-world statistical claim. Explain simulated conditions respectfully; do not suggest that household hardship or clothing determines a person's worth.

After failure, prompt the player immediately on Day 2 to reapply for a lower-requirement job. This additional decision must not advance to Day 3 automatically or skip the result screen.

### Day 3: follow-up interview after failure

If the player already owns purchased or CAC professional clothes, offer only “Wear my professional clothes.” Otherwise offer the same clothing options as the first interview, filtered by CAC availability. Do not charge again for previously acquired clothes.

The team has specified that the player gets the lower-requirement job after the Day 3 follow-up interview regardless of which available clothing choice is selected. Do not reuse the first interview's education gate. This is a scripted simulation rule, not a real-world employment claim.

### Employment state and weekly income

Replace the persona's `monthly_income` with `weekly_income`, initialized to $0. Keep the edition's persona definition unchanged during gameplay: store the run's current weekly income and employment state on the playthrough or a run-specific employment record. On successful hiring, update that run's weekly income to the selected job's approved amount.

Each job option has an approved weekly income and qualification requirements. Track job selection, preparation completion, professional clothing ownership, hiring day, current job and income. Record these as structured state, not inferred narrative.

Income is paid every seven days after hiring: a Day 2 hire first pays on Day 9, then Days 16, 23 and 30; a Day 3 hire first pays on Day 10, then Days 17 and 24. Do not pay immediately upon hiring. Do not deduct income taxes from scheduled pay. Explain this simplifying assumption separately from real-world wages and taxation.

## 14. Income-tax filing scenario

Include a Financial Literacy & Taxes scenario with these choices:

| Choice | Financial behavior |
| --- | --- |
| Try my best | No refund and no deduction |
| Pay someone to prepare taxes | First verify that the player can afford the approved filing fee; if not, end the game before applying any consequence of this choice. If affordable, charge the fee and award the specified $1,000 refund immediately once |
| Get CAC assistance | Available only in CAC mode; free eligible tax preparation and the specified $1,000 refund immediately once |

The $1,000 amount is a fixed simulation rule supplied by the team, not an API estimate, an average derived from CAC totals, or a guaranteed real refund. It remains fixed across monthly refreshes unless staff approve a rule change in another edition. The filing fee requires an approved source or explicit assumption. This scenario is non-scheduled. The paid-preparer affordability check occurs before either the fee or refund is applied; an unaffordable choice records no successful payment or refund consequence.

Model the fee and refund as distinct components even if the existing choice ultimately records their net balance change. A refund is not a second financial assistance effect. Do not silently use a net positive balance change to bypass affordability validation.

## 15. Validation and acceptance criteria

Before publishing any edition, verify:

- Every scenario has required text, category, schedule type, at least one valid persona link, supported choices and one general plus one CAC fact.
- All content links and resolved values match the edition; stable IDs can recur across editions without overwriting prior records.
- Each selectable persona has a full route covering every category to which it is eligible, with pre-game preparation, Day 2 interview and conditional Day 3 interview correctly ordered.
- Confirmed client-facing services have approved library coverage or explicit staff-reviewed applicability decisions. Newly confirmed uncovered services create only one pending draft.
- General and CAC facts are relevant and accurately attributed. Changed CSV labels, new year columns, duplicate labels and missing units do not silently become services or facts.
- Bound costs update consistently after a valid monthly observation change; unchanged observations are a no-op. Invalid or unavailable sources preserve approved content and raise reviewable errors.
- Assistance applies only to a qualifying selected choice in CAC mode, never exceeds eligible expense, and never stacks multiple financial effects for one choice.
- Money signs, precision, rounding, zero-cost in-kind support, duplicate-charge protection and failure-to-pay behavior match this document.
- Education and clothing state determine the first interview exactly as specified. Existing clothing is reused without a second purchase, and weekly pay starts seven days after hiring.
- Generation is backend-only, one scenario per request, configurable by model, bounded to three attempts, and failures are visible to staff.
- Pending edits never affect gameplay. Approval is atomic, published content is immutable, and active/completed runs retain their original edition.

These are implementation acceptance criteria, not tests claimed to have passed. Include boundary tests for half-cent rounding, assistance exceeding an expense, repeated submissions, source revisions, stale approvals, mode-dependent choices and interrupted maintenance.

## 16. Open decisions and implementation follow-up

Resolve these before implementing or publishing the affected behavior; unrelated draft writing can continue.

1. **Day 3 hiring:** Resolved: the player gets the lower-requirement job regardless of the available clothing selection. The job is recorded on Day 3 and weekly income begins on Day 10. The remaining clothing presentation and state-recording details follow the approved flow above.
2. **Job catalog and preparation:** Exact jobs, weekly amounts, qualifications, persona mappings, and how the pre-game job selection and preparation choices fit together. Confirm which education qualifies the player for each first-interview job.
3. **Tax details:** Resolved: “Try my best” has no refund or deduction; the $1,000 refund is immediate; the player must afford the paid-preparer fee before any fee or refund consequence; an unaffordable choice ends the game before consequences; and the scenario is non-scheduled. The approved preparer fee remains to be supplied.
4. **Daily ordering and payment failure:** Resolved: automatic income is credited with a brief notification before scenarios are presented; scheduled and non-scheduled payments, bills, and events use the same scenario flow at the end of the day; an unaffordable attempted optional choice ends the run, even if it is the only option; and a missed or unaffordable required payment ends the run.
5. **Source selection:** Exact API variables, series, observation rules, geographies, quantities, conversions, baseline assumptions and supported formulas for each bound value. Verify model identifier availability before deployment.
6. **Source maintenance:** How staff receive/import newer CAC files; who confirms service mappings and retires services; acceptable data age and source-failure notification behavior.
7. **Binding schema:** Final small-record shape, supported target fields and observation storage. Decide whether concrete reuse justifies `scenario_parameters` later.
8. **Edition schema:** Implement stable logical IDs with edition-scoped records and matching composite references. Finalize draft storage and publication pointer/transaction rather than overwriting frozen rows.
9. **Category applicability:** Resolved: personas see scenarios only from categories for which they are eligible. Households without children do not see child-related scenarios and may cover the other five categories; route validation uses the persona's eligible-category set.
10. **Full service inventory:** Staff confirmation of client-facing services, ambiguous labels such as TCC, and household relevance of Teacher's Closet and workforce-specific benefits. Do not treat the source mapping above as confirmed eligibility policy.

Update `docs/data-model.md`, `docs/api.md`, `docs/architecture.md`, `design/user-flows.md`, `design/ui-spec.md`, and conflicting `AGENTS.md` rules when implementation begins. Required schema work includes categories, persona/category and scenario/persona links, service coverage, fact roles, request tracking, bindings, edition keys, employment state, weekly income, scheduled income occurrences, and decision/payment idempotency. The current empty migration implements none of these.
