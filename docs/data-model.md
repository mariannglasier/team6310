# Data Model

## 1. Overview and evidence

This relational model supports an educational financial decision game for the Community Assistance Center (CAC) in Sandy Springs, Georgia. Players select a household persona, encounter scenarios, make choices, pay scheduled expenses, and compare outcomes with CAC assistance enabled or disabled. Statistics provide local and CAC-related educational context. Group sessions support facilitated play, and content versions identify the content used by each game.

**Platform:** Supabase (PostgreSQL), as specified by the project team. Application entities are relational tables

**Sources:** `Team 6310 ERD.drawio.png` and `Database Plan.pdf` (four pages). The plan supplies explicit field lists, PK/FK labels, and relationship explanations; the ERD supplies entities, attributes, and conceptual links. No SQL migrations or live database schema were provided. Consequently, this file documents design intent, not verified database enforcement.

### Reading the field tables

- **Specified:** explicitly listed in the source plan (including primary keys and foreign keys).
- **Proposed:** a PostgreSQL type or implementation rule recommended here, requiring team confirmation.
- **Unresolved:** absent, ambiguous, or inconsistent in the sources; references point to Section 5.
- All SQL types below are **proposed**, including UUID identifiers, numeric precision, and timestamp types. Sources do not specify types, identifier generation, defaults, lengths, or general nullability.
- Primary keys imply uniqueness and non-nullability in PostgreSQL. A foreign key alone does not imply `NOT NULL`. Only source-explicit optional fields are marked optional; other non-PK fields have unresolved nullability.
- Names are normalized to lowercase snake_case: `Persona_id` becomes `persona_id`, `Answered_at` becomes `answered_at`, and `general starting_balance` becomes `general_starting_balance`. These are documentation conventions, not confirmed deployed names.

## 2. Entities and fields

### `personas`

Selectable household profiles and initial financial conditions. Persona definitions are edition-scoped; changing employment and income state belongs to a playthrough, not this table.

| Field | Proposed PostgreSQL type | Description | Source constraints / open decisions |
| --- | --- | --- | --- |
| persona_id | uuid | Unique persona identifier. | Specified PK. |
| name | text | Household profile name. | Nullability unresolved. |
| description | text | Household background. | Nullability unresolved. |
| general_starting_balance | numeric(12,2) | Initial available balance. | Naming normalized; allowed range unresolved (I4, C2). |
| weekly_income | numeric(12,2) | Approved weekly income for the persona/job definition. | USD; use approved job qualifications. A run's changing income is stored in playthrough employment state. |
| version_id | uuid | Owning content version. | Specified FK → content_versions.version_id; C1. |

### `scenarios`

Situations encountered during gameplay. Stable logical scenario IDs may recur in multiple immutable editions; edition-scoped records identify the revision.

| Field | Proposed PostgreSQL type | Description | Source constraints / open decisions |
| --- | --- | --- | --- |
| scenario_id | uuid | Unique scenario identifier. | Specified PK. |
| title | text | Scenario title. | Nullability unresolved. |
| description | text | Situation presented to players. | Nullability unresolved. |
| default_day | integer | Default scheduling guidance for a scenario. | Pre-game or Days 1–30; fixed employment events override this guidance. |
| version_id | uuid | Content version this scenario belongs to. | Team-approved FK → content_versions.version_id; C1. |
| category_id | uuid | Scenario category. | Required FK → categories.category_id; one of the six approved categories in [scenarios.md](scenarios.md). |
| schedule_type | text | `scheduled` or `non_scheduled`. | Required; scheduled status controls timing/projection metadata, while both types use the same end-of-day scenario flow. Automatic income is a separate credited occurrence. |

### `choices`

Available scenario answers, consequences, and next destinations.

| Field | Proposed PostgreSQL type | Description | Source constraints / open decisions |
| --- | --- | --- | --- |
| choice_id | uuid | Unique choice identifier. | Specified PK. |
| scenario_id | uuid | Scenario offering this choice. | Specified FK → scenarios.scenario_id. |
| choice_text | text | Answer shown to players. | Nullability unresolved. |
| balance_change | numeric(12,2) | Base signed financial effect of choosing this answer in USD. | Negative removes household money; positive adds it. Exact arithmetic and final-cent rounding follow [scenarios.md](scenarios.md). |
| response_text | text | Feedback after the choice. | Nullability unresolved. |
| next_scenario_id | uuid | Next scenario, if any. | Specified optional FK → scenarios.scenario_id; NULL does not by itself end a run when normal routing can select another scenario. |
| version_id | uuid | Owning content version. | Specified FK → content_versions.version_id; C1. |

### `statistics`

Researched facts, source references, and review metadata.

| Field | Proposed PostgreSQL type | Description | Source constraints / open decisions |
| --- | --- | --- | --- |
| statistic_id | uuid | Unique statistic identifier. | Specified PK. |
| description | text | Meaning of the statistic. | Nullability unresolved. |
| value | numeric | Measured value. | Proposed numeric; confirm whether nonnumeric values are needed (C7). |
| unit | text | Measurement unit. | Allowed units unresolved (C7). |
| geography | text | Area covered by the data. | Geographic vocabulary unresolved (C7). |
| data_period | text | Reporting period. | Proposed text to accommodate years or ranges; format unresolved. |
| source_url | text | Reference URL for the statistic. | Requiredness and URL validation unresolved. |
| last_reviewed_at | timestamptz | Most recent review timestamp. | Nullability and review policy unresolved. |
| version_id | uuid | Owning content version. | Specified FK → content_versions.version_id; C1. |

### `scenario_statistics`

Junction table connecting scenarios and relevant statistics.

| Field | Proposed PostgreSQL type | Description | Source constraints / open decisions |
| --- | --- | --- | --- |
| scenario_id | uuid | Linked scenario. | Composite PK component and edition-scoped FK → scenarios. |
| statistic_id | uuid | Linked statistic. | Composite PK component and edition-scoped FK → statistics. |
| version_id | uuid | Version associated with the link. | Required; composite references enforce the same edition as scenario and statistic. |
| fact_role | text | `general` or `cac`. | Required; exactly one of each role per scenario per edition. |

### `categories`

The six approved scenario categories: Housing & Utilities; Food & Nutrition; Employment & Adult Education; Essential Goods & Clothing; Childcare & Youth; and Financial Literacy & Taxes. Category names and scenario/persona applicability are content decisions, not eligibility policy.

### `persona_categories` and `scenario_personas`

Edition-scoped applicability links. `persona_categories(version_id, persona_id, category_id)` identifies categories a persona can encounter. `scenario_personas(version_id, scenario_id, persona_id)` identifies selectable scenarios. Publication validation requires at least one scenario-persona link, category compatibility, and a viable six-category route for each selectable persona.

### `playthroughs`

One game attempt and its current financial and scenario state.

| Field | Proposed PostgreSQL type | Description | Source constraints / open decisions |
| --- | --- | --- | --- |
| playthrough_id | uuid | Unique attempt identifier. | Specified PK. |
| persona_id | uuid | Selected household profile. | Specified FK → personas.persona_id. |
| current_scenario_id | uuid | Current scenario. | Specified FK → scenarios.scenario_id; nullability at start/end unresolved. |
| current_balance | numeric(12,2) | Current available balance in USD. | Exact decimal or integer-cent arithmetic; signed changes. A required payable event that cannot be paid ends the run without recording an unaffordable charge. |
| current_day | integer | Current simulation day. | Pre-game stage followed by Days 1–30; multiple decisions can occur on one day. |
| cac_support_enabled | boolean | Whether CAC assistance applies. | Default and requiredness unresolved. |
| status | text | Game progress state. | Allowed values and transitions unresolved (C4). |
| started_at | timestamptz | Attempt start timestamp. | Default and requiredness unresolved. |
| version_id | uuid | Content version used for this attempt. | Specified FK → content_versions.version_id; C1. |
| session_id | uuid | Group session this attempt belongs to. | Nullable FK → group_sessions.session_id; NULL for individual play. |
| employment_state | jsonb | Run-specific job, preparation, clothing, hiring, and current weekly-income state. | Proposed shape; do not infer from narrative. Initialize weekly income to $0; weekly pay begins seven days after hiring. |

### `playthrough_expenses`

Individual bill occurrences, including recurring charges and payment state.

| Field | Proposed PostgreSQL type | Description | Source constraints / open decisions |
| --- | --- | --- | --- |
| playthrough_expense_id | uuid | Unique bill occurrence identifier. | Specified PK. |
| playthrough_id | uuid | Attempt owing the bill. | Specified FK → playthroughs.playthrough_id. |
| expense_id | uuid | Source scheduled expense definition. | Specified FK → persona_expenses.expense_id. |
| due_day | integer | Simulation day payment is due. | Day bounds unresolved (C3). |
| amount_due | numeric(12,2) | Amount charged for this occurrence. | Range and snapshot behavior unresolved (C2, C1). |
| paid_at | timestamptz | Actual payment timestamp. | Specified optional; NULL represents no recorded payment. |
| version_id | uuid | Content version associated with this bill. | Specified FK → content_versions.version_id; C1. |

### `player_responses`

Recorded decisions and the financial effects actually applied.

| Field | Proposed PostgreSQL type | Description | Source constraints / open decisions |
| --- | --- | --- | --- |
| response_id | uuid | Unique decision record identifier. | Specified PK. |
| playthrough_id | uuid | Attempt containing the decision. | Specified FK → playthroughs.playthrough_id. |
| choice_id | uuid | Selected choice. | Specified FK → choices.choice_id. |
| balance_change_applied | numeric(12,2) | Actual balance adjustment. | May differ from the base choice effect; formula unresolved (C2, C5). |
| balance_after | numeric(12,2) | Balance after applying this decision. | Consistency with playthrough state unresolved (C5). |
| answered_at | timestamptz | Decision timestamp. | Name normalized from Answered_at; default unresolved. |
| version_id | uuid | Version associated with this response. | Specified FK → content_versions.version_id; C1. |

### `group_sessions`

Facilitated group games, current scenarios, and response deadlines.

| Field | Proposed PostgreSQL type | Description | Source constraints / open decisions |
| --- | --- | --- | --- |
| session_id | uuid | Unique session identifier. | Specified PK. |
| join_code | text | Code used to join a group. | Uniqueness, format, expiration, and reuse unresolved (C6). |
| facilitator_user_id | uuid | Authenticated facilitator. | Specified FK → auth.users.id; auth.users is external to this application model. |
| current_scenario_id | uuid | Scenario currently presented to the group. | Specified FK → scenarios.scenario_id; nullability unresolved. |
| round_deadline | timestamptz | Time when responses close. | Nullability and enforcement unresolved (C6). |
| status | text | Group progress state. | Suggested by source: waiting, in_progress, completed; not a confirmed CHECK constraint. |
| created_at | timestamptz | Session creation timestamp. | Default and requiredness unresolved. |
| version_id | uuid | Content version used by the group. | Specified FK → content_versions.version_id; C1. |

### `persona_expenses`

Scheduled household expenses, either one-time or recurring.

| Field | Proposed PostgreSQL type | Description | Source constraints / open decisions |
| --- | --- | --- | --- |
| expense_id | uuid | Unique scheduled expense identifier. | Specified PK. |
| persona_id | uuid | Household owing this scheduled expense. | Specified FK → personas.persona_id. |
| name | text | Expense name. | Nullability unresolved. |
| amount | numeric(12,2) | Charge per occurrence. | Allowed range unresolved (C2). |
| first_due_day | integer | First simulation day the expense is due. | Day bounds unresolved (C3). |
| repeat_interval_days | integer | Days between later occurrences. | Specified optional; blank means once. Proposed SQL representation: NULL, with positive integers for recurrence. |
| version_id | uuid | Owning content version. | Specified FK → content_versions.version_id; C1. |

### `scheduled_income_occurrences`

Run-specific automatic income occurrences. Each occurrence references the playthrough's job/edition, due day, and approved amount, and is idempotent. Income is not modeled as an expense or scenario choice; it is credited every seven days after hiring.

### `source_bindings`

Edition-scoped provenance for a choice or expense amount: target field, source observation or approved assumption, unit, controlled formula and inputs, resolved USD amount, and whether the value is sourced, calculated, or staff-approved. `scenario_parameters` is intentionally deferred until concrete scenarios justify reusable values.

### `scenario_generation_requests`

Tracks admin/maintenance requests, target edition/service, description, configured model, schema revision, attempt count, validation errors, status, resulting draft, timestamps, and idempotency key. One request yields at most one scenario draft and at most three total model attempts.

### `service_coverage`

Edition-scoped links from a scenario to confirmed client-facing CAC services. Coverage is explicit and must not be inferred from keywords.

### `cac_support_effects`

Assistance associated with choices when CAC support is enabled.

| Field | Proposed PostgreSQL type | Description | Source constraints / open decisions |
| --- | --- | --- | --- |
| support_effect_id | uuid | Unique assistance effect identifier. | Specified PK. |
| choice_id | uuid | Choice receiving this assistance. | Specified FK → choices.choice_id; one-to-many in plan. |
| assistance_amount | numeric(12,2) | Financial assistance amount. | Allowed range and stacking unresolved (C2, I6). |
| response_text | text | Feedback associated with assistance. | Override versus appended feedback unresolved (I6). |
| explanation | text | Explanation of the CAC assistance. | Nullability unresolved. |
| version_id | uuid | Owning content version. | Specified FK → content_versions.version_id; C1. |

### `content_versions`

Identifies a complete edition of game content and publication metadata.

| Field | Proposed PostgreSQL type | Description | Source constraints / open decisions |
| --- | --- | --- | --- |
| version_id | uuid | Unique content version identifier. | Specified PK. Duplicate self-FK entry in plan is not adopted; I3. |
| version_number | integer | Human-readable version number. | Proposed integer; format and UNIQUE constraint unresolved (C1). |
| status | text | Publication state. | Suggested by source: drafted, published, archived; not a confirmed CHECK constraint. |
| created_by | uuid | Authenticated content author. | Specified FK → auth.users.id. |
| created_at | timestamptz | Version creation timestamp. | Default and requiredness unresolved. |
| published_at | timestamptz | Version publication timestamp. | Specified optional; publication/status consistency unresolved (C1). |
| change_summary | text | Description of content changes. | Nullability unresolved. |

### Proposed missing fields (not part of the supplied field lists)

| Table | Proposed field | Proposed type | Reason / status |
| --- | --- | --- | --- |

### External entity: `auth.users`

Supabase authentication supplies the user entity referenced by `group_sessions.facilitator_user_id` and `content_versions.created_by`. This model only documents the referenced `id` (proposed/expected UUID target); authentication fields are outside the supplied ERD and plan. Neither source associates a player account with a playthrough.

## 3. Relationships

Parent-side cardinalities describe the plan's intended design. Except for explicitly optional fields, child participation is unresolved because FK nullability is not specified. A parent being able to have many children does not establish a minimum child count.

| Parent | Child and foreign key | Intended relationship | Notes |
| --- | --- | --- | --- |
| personas | playthroughs.persona_id | 1:N | A persona may be used in many attempts. |
| personas | persona_expenses.persona_id | 1:N | A persona has scheduled expenses. |
| scenarios | choices.scenario_id | 1:N | A scenario offers choices. Minimum choices unresolved. |
| scenarios | choices.next_scenario_id | 1:N, optional from choice | Many choices may lead to the same scenario; destination may be NULL without implicitly ending normal play. |
| scenarios | playthroughs.current_scenario_id | 1:N | Many attempts may currently be on one scenario. |
| scenarios | group_sessions.current_scenario_id | 1:N | Many groups may currently be on one scenario. |
| scenarios | scenario_statistics.scenario_id | 1:N | One side of the junction. |
| statistics | scenario_statistics.statistic_id | 1:N | Together, scenarios and statistics have an M:N relationship. |
| playthroughs | player_responses.playthrough_id | 1:N | An attempt records decisions. |
| choices | player_responses.choice_id | 1:N | A choice may be selected in many attempts. |
| playthroughs | playthrough_expenses.playthrough_id | 1:N | An attempt has individual bill occurrences. |
| persona_expenses | playthrough_expenses.expense_id | 1:N | A scheduled expense generates occurrences across attempts and due dates. |
| group_sessions | playthroughs.session_id | 1:N | A group can contain multiple playthroughs; individual playthroughs have NULL session_id. |
| choices | cac_support_effects.choice_id | 0:1 per edition | At most one financial assistance effect per choice per edition. |
| content_versions | version_id in edition-scoped content and run records | 1:N per table | Published editions are immutable. Composite keys or equivalent protected operations enforce edition consistency; playthroughs retain their starting version_id. |
| content_versions | scenarios.version_id | 1:N | Each scenario belongs to a content version; team-approved, migration implementation pending. |
| auth.users | group_sessions.facilitator_user_id | 1:N | User facilitates sessions. |
| auth.users | content_versions.created_by | 1:N | User authors content versions. |

## 4. Constraints

### Source-specified design constraints

- Logical IDs are stable across editions, while edition-scoped records use `(version_id, logical_id)` keys or an equivalent enforced design. `scenario_statistics` must permit the same logical pair in different editions.
- All source-specified FKs are listed in Sections 2 and 3. FK enforcement would require a referenced row to exist whenever the FK is non-NULL.
- `choices.next_scenario_id`, `persona_expenses.repeat_interval_days`, `playthrough_expenses.paid_at`, and `content_versions.published_at` are explicitly optional in the plan.
- A blank repeat interval represents a one-time expense. The proposed SQL representation is NULL rather than an empty string.
- Status values are suggestions in the plan, not explicit SQL enums or CHECK constraints.
- No source supplies SQL DDL, non-PK NOT NULL declarations, UNIQUE constraints beyond PKs, defaults, indexes, CHECK constraints, FK delete/update actions, triggers, or RLS policies. Their current enforcement cannot be asserted.

### Proposed constraints requiring confirmation

| ID | Area | Proposed rule or decision required |
| --- | --- | --- |
| C1 | Content versions | Resolved design: stable logical IDs with edition-scoped rows; published editions are immutable; pending edits are separate; every playthrough retains its starting version_id. Final DDL and publication transaction remain pending. |
| C2 | Money | Resolved design: USD, exact decimal/integer-cent arithmetic, final rounding once to cents with half-cent ties away from zero, signed balance changes, and capped assistance. |
| C3 | Simulation time | Resolved design: pre-game plus Days 1–30; automatic income is credited with a notification before that day's scenarios; scheduled and non-scheduled payments/events use the same end-of-day scenario flow; scheduled income begins seven days after hiring; an unaffordable attempted optional choice or missed/unaffordable required payment ends the run. |
| C4 | States and nullability | Define playthrough statuses and transitions; confirm group/content status vocabularies. Decide required text, FKs, timestamps, and version fields; decide whether current_scenario_id may be NULL while waiting or after completion. |
| C5 | Decision/payment consistency | Validate scenario, choice, ownership, eligibility, support, and edition in protected operations. Commit response, state changes, and payment/income idempotency atomically. Prevent duplicate scheduled/scenario charges. |
| C6 | Group participation | Define join-code uniqueness (global or active sessions only), expiration, membership identity, participant visibility, deadline enforcement, and how group answers advance each attempt. No round identifier or vote aggregation rule is supplied. |
| C7 | Statistics | Define value types, units, reporting-period format, supported geographies, source requirements, and review cadence. No additional provenance table or relationship to a specific choice is specified. |
| C8 | Referential actions and defaults | Choose ON DELETE/ON UPDATE behavior for every FK, especially content referenced by completed games and auth user deletion. Decide ID generation and timestamp/boolean defaults; avoid assuming cascades. |
| C9 | Supabase access | Define RLS and grants for public content reads, player-owned state, facilitator access, and CAC content editing/publication. Anonymous player ownership and CAC editor roles are not modeled. This is an implementation requirement to resolve, not an existing policy. |
| C10 | Performance | Consider indexes for frequently queried FK columns, join_code lookup, and response/bill retrieval by playthrough. Indexes other than those implied by PKs are proposals, not source-specified constraints. |

## 5. Inconsistencies and resolution status.

| ID | Source issue | Consequence | Resolution / current status |
| --- | --- | --- | --- |
| I1 | Plan relationship section says group_sessions has many playthroughs and individual games have no session_id, but playthroughs field list omits session_id. ERD also depicts the conceptual group link. | Group membership cannot be represented by the listed fields. | Resolved: The team agreed that playthroughs would use session_id as a foreign key through group_sessions. |
| I2 | scenarios has no version_id in the plan or its attribute list in the ERD, although content_versions is described as covering scenario changes and the ERD depicts a content-version/scenario link. | Scenarios cannot be explicitly tied to the content snapshot referenced by choices and games. | Resolved: Team-approved: add scenarios.version_id referencing content_versions.version_id. Migration implementation pending. |
| I3 | content_versions lists version_id once as its PK and again as an FK to content_versions. The ERD shows one version_id attribute. | The duplicate field cannot be implemented as two columns with the same name; intended self-reference is unclear. | Resolved: Just a simple copy/paste error. Duplicate can be ignored. |
| I4 | Mixed capitalization and the plan's general starting_balance label differ from the ERD's general_starting_balance; Answered_at also differs in case. | Literal implementation could produce inconsistent or quoted identifiers. | Use the normalized names in this file; verify names against migrations before implementation. |
| I5 | scenario_statistics carries version_id but its original PK omitted it. | Stable logical IDs cannot be reused safely across editions with that PK. | Superseded: use edition-scoped composite identity and exactly one `general` plus one `cac` fact role per scenario/edition. |
| I6 | choices → cac_support_effects was structurally one-to-many. | Unbounded stacking could create unintended cash or duplicate effects. | Resolved design: at most one financial assistance effect per choice per edition; assistance is capped to the eligible remaining expense. |
| I7 | ERD includes facilitator_user_id as an underlined attribute while session_id is also underlined; the plan labels session_id as PK and facilitator_user_id as FK. | Underlining could be misread as a composite group_sessions PK. | Follow the plan's session_id-only PK and facilitator_user_id FK in this draft; confirm and correct ERD notation. |
| I8 | ERD is conceptual; connector lines/cardinality labels are not legible in the supplied rendering, and several FK attributes are expressed through relationships rather than listed as ovals. | Mandatory participation and precise cardinalities cannot be independently verified from the image. | Use different ERD made by Roger. |

## 6. Implementation readiness

This draft covers all 12 application entities, the external authentication reference, every listed field, intended relationships, and explicit versus proposed constraints. It is suitable for design review but is not a migration script or a certification of the deployed database.

I1-I6 are resolved at the design level where noted; migration implementation is pending.
Open scenario decisions remain in [scenarios.md](scenarios.md), including the
job catalog, preparer fee, optional-choice affordability and missed-payment edge
cases, source variables and formulas, binding shape, and service inventory. Validate the final
DDL, composite references, idempotency, and ownership/RLS before implementation.
