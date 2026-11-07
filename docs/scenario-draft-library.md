# CAC Poverty Exercise — 60 scenario drafts, revised

**November 2, 2026 · Content and specification handoff · Pending staff review.** This revision replaces the earlier service-centered draft library. No application, database or financial engine has been changed.

## CAC fact pairing update — November 6, 2026

30 scenarios now have one proposed CAC fact paired to an existing database record; 30 retain a specific evidence gap. See the [60-scenario pairing review](scenario-cac-fact-pairings.md) and [read-only fact snapshot](data/cac-service-facts-2025.json). References use real fact IDs plus service key, fact key and reporting year. These are documentation pairings for review; no scenario rows, game effects, general facts, or publication state were changed. The attached revised library was checked against this branch and matched before editing.

## Combined branch status - November 6, 2026

This branch now includes GitHub main's application code through `a0d9383`, alongside the scenario drafts and CAC fact pairings. Main's Phase 1 and Phase 2 employment implementation is present; see [Phase 2 employment](phase-2-employment.md). The earlier handoff stating that employment implementation was excluded is superseded by this merge.

The draft library remains proposed content. Combining branches does not implement ordinary scenarios, ignored bills, sidebar settlements, fact display, or publication. Reconcile draft-specific employment bindings and eligibility with the implemented employment catalog before mapping or publishing these cards. The approved draft choices and fact pairings below are preserved.

### Current code versus these drafts

The merged application starts a run directly from household selection; the legacy Review route redirects. Employment already uses English/computer eligibility, CAC preparation, $60 professional clothing with ownership reuse, same-day Day 2 reapplication to another eligible job, Day 3 hiring, and weekly pay beginning seven days after hiring. These are existing employment behaviors, not features newly implemented by this draft library. See [Phase 1 employment](phase-1-employment.md) and [Phase 2 employment](phase-2-employment.md) for implementation scope.

Ordinary days still use walkthrough placeholders. The 60 cards, tax decision, annual CAC fact sentences, unpaid-bill model and sidebar Pay are content/design handoffs awaiting implementation and review. Draft references to unresolved wages or IDs concern binding these cards to approved edition records; they do not mean the current job board has no configured wages or IDs. The illustrative route below is not the current application schedule.

## Player-facing copy handoff - November 6, 2026

Each scenario title is the player-facing heading above its situation text. D001-D060 identifiers are internal references and are never displayed. Titles describe the current event without revealing later events, calendar routing, or hidden outcomes.

Only scenario titles, **Situation**, choice labels, committed result text, approved fact display sentences, and approved end-screen debt explanations are player-facing fields. All timing, money/state columns, eligibility, mapping, review blockers and explanatory prose are staff/developer notes and must not be displayed as narrative. The Markdown is a content handoff, not a file the application currently renders.

Player copy stays in the household's present circumstances. Do not mention the exercise, script, mode, numbered days, hidden rules, future interview opportunities, guaranteed hiring, refunds, or later events before they occur. Scheduled bills may be shown ahead of time. Reveal the actual committed outcome after submission; do not preview alternative outcomes. Keep implementation cautions outside visible text.

Braced tokens are rendering bindings, never literal display text: `{job_title}` comes from the selected job; `{player_payment_usd}` and `{remaining_expense_usd}` come from the committed transaction and eligible expense. Do not infer support amounts from annual facts. CAC options retain their existing conditional availability and scope; named programs do not create new coverage. Exact item coverage and benefit amounts still require the existing approvals.

For D002, append exactly one outcome after the clothing receipt: **hired:** "You got the job as {job_title}." **not hired:** "The interview did not lead to a job." Select it from the committed result, never from the clothing label alone. These branches are staff instructions; never show both or label them to the player. D004 result sentences appear only after the hiring action commits.

## Approved direction and unresolved details

**D034 replacement - November 6, 2026:** The user requested a broken dresser instead of a bed and confirmed CAC carries dressers, cabinets, chairs and home decor. D034 now includes a conditional free dresser-receipt choice. The existing $390/$165 retail alternatives remain draft assumptions. No CAC furniture outcome statistic has been assigned; the user does not require forcing a fact connection for this edit. This does not resolve the existing publication fact requirement.

**D044 replacement - November 6, 2026:** At the user’s request, the rarely used Workforce Development transportation scenario is replaced by a general household-appointment travel decision. It has no CAC support option. C13 remains in the historical source registry but is no longer paired to a scenario. The $32/$6 alternatives remain draft assumptions.

**Confirmed free CAC assistance - November 6, 2026:** CAC assistance services and items received through the listed assistance pathways have no player-paid service fee. Food, holiday baskets, clothing credits, coats, school supplies, meals and gifts are free in-kind receipts: USD 0.00 balance change, no cash deposit, no debt and no payment remainder for receiving the approved items. Credits are restricted assistance, not spendable cash. Actual items, quantities, eligibility and availability remain edition-scoped; a free allocation need not equal the priced retail alternative. CAC classes/preparation and VITA are also free. Rent/utility assistance reduces the eligible bill owed rather than increasing available cash; a player-paid uncovered bill remainder is not a CAC fee. The approved tax refund is a separate tax transaction, not a payment from CAC or cash created by taking a class. Preserve earned job wages as separate income. These rules supersede the earlier item-cost offset formulas and payment/remainder receipt text.

Website review: CAC describes [free clothing assistance](https://ourcac.org/services-clothing/), [free adult classes](https://ourcac.org/services-adult-education/), [free Coats for Kids coats](https://ourcac.org/coatsforkids/) and [free VITA preparation](https://ourcac.org/2026/05/12/thats-a-wrap-on-tax-season-cacs-2026-vita-program-helped-535-individuals-receive-795k-in-refunds/). The broader no-fee rule and item pathways above also record the user’s clarification; retail Canopy Thrift purchases are separate from client assistance credits.


**Confirmed CAC bill support - November 6, 2026:** The user confirmed eviction prevention includes help paying rent and utilities. Rent cards D006/D019 retain their CAC choices; electricity D007, water/sewer D008, internet D010 and gas D018 now also offer conditional CAC bill support. This supersedes their earlier context-only/no-support instructions. Other bill types require separate service confirmation. Exact coverage amounts, household eligibility, availability and edition bindings remain pending; annual facts do not set benefits. This is a documentation change awaiting game implementation.

The user approved a library built around hard household decisions, major financial shocks, and selective CAC support. Every displayed gameplay choice below is a complete submitted decision. There are no “review your money” answers. A zero-cost answer still records a real choice and its stated outcome. The inspiration is the resource-pressure approach discussed with [SPENT](https://playspent.org/); these are original drafts, not copied cards or verified reproductions of its mechanics.

**Approved bills behavior:** ignoring a bill completes that scenario and creates an unpaid sidebar item with principal plus a late fee. It deducts no cash. Each item has a Pay button. Successful payment deducts its outstanding total once and removes it from the unpaid list, preserving history. Bills may remain unpaid through Day 30. The end screen lists the remaining debt and explains possible future consequences. Ignoring a bill does not end the run.

**Approved days:** ordinary scenarios and job events occupy separate days. Preserve the existing Day 2 first interview, its result, and immediate reapplication after failure as the sole exception. The conditional follow-up stays on Day 3. Submit → committed result → Continue → next day, except Continue after a failed Day 2 interview first opens same-day reapplication. Automatic weekly pay remains a notification/credit before the day’s scenario, not a second scenario. Sidebar Pay is an account action, not another scenario or day advance.

**Not approved by this document:** the numerical amounts, late-fee values/repetition rules, new ordinary choice consequences, scenario-specific eligibility and actual costs. All ordinary dollar figures below are **illustrative simulation assumptions proposed for review**, not market quotes, entitlements, legal fees or approved financial rules. The approved exceptions are interview clothing at USD 60.00 and the fixed USD 1,000.00 tax refund. Tax preparer fee and job wages remain unresolved. No invented draft amount is ready for production.

The fee examples provisionally show **one fee on the initial Ignore submission** so the arithmetic is reviewable. Whether fees ever repeat, a grace period exists, or an ignored balance can be paid in part is UNRESOLVED. Do not implement recurrence, interest, partial payments or compounded fees from these drafts. The currently proposed sidebar Pay settles the full outstanding total. Bills cannot be re-ignored to generate duplicate fees.

## Shared content contract

- Authority: [scenarios.md](scenarios.md), [data-model.md](data-model.md), [security.md](security.md), and the approved decisions above. The offline batch exception affects this writing task only; the application’s one-draft-per-generation-request rule is unchanged.
- Exactly 60 drafts: **5 fixed-flow/tax, 15 bill alternatives, 15 major shocks, 25 everyday/family/work tradeoffs**. Categories are the six approved names. Ten per category is no longer a constraint. A run selects a compatible subset, not all 60.
- ALL means candidate links to Alex, Jordan, Patricia and Sofia; JORDAN is child-related content only; SOFIA is the configured shared household. CAR means an explicitly approved car-owning subset of those personas; EMPLOYED means a current run hired into an applicable job; WORKFORCE requires an explicitly approved workforce-program subset. No circumstance is inferred merely from a name or category. Actual persona/category/edition links remain unresolved for every card.
- Keys D001–D060, choice suffixes, state labels and C-fact aliases are document references, not actual database IDs. No published logical IDs are replaced by these reference keys. State labels describe **proposed structured outcomes**, never working engine code.
- Every scenario has exactly one general fact slot and one CAC fact slot, as the unchanged publication rule requires. All general facts remain UNRESOLVED; a topic sourcing brief appears per card. Where a relevant CAC observation is available, its slot now references the current database-backed registry and a proposed display sentence. A context-only pairing does not add a CAC choice or assistance effect. A scenario with no relevant CAC observation keeps that slot UNRESOLVED; do not force an unrelated CAC service onto it or imply CAC can cover the expense. Fact-policy exceptions have not been approved. This is an explicit publication blocker for unsupported topics.
- No CAC option is offered unless listed on that card and mode, actual service/item eligibility, availability and edition mapping validate. Cards without CAC support stay without it in both modes. A financial effect is capped at eligible expense remaining; no cash from in-kind coverage, no stacking. CAC impact facts do not mean support was available or used.
- Selection alone changes nothing. Protected submission atomically records the selected answer, authorized effects and actual assistance use; retries/refresh never repeat charges, fees, wages, refunds or choices. Show success only after commitment. Expensive unselected alternatives do not end play. The existing rule that an attempted unaffordable paid option ends the run remains unchanged; bill Ignore offers the separate approved no-cash continuation path. An unsuccessful sidebar Pay must never erase debt or record payment; existing unaffordable-attempt ending behavior still applies unless separately changed by the team.
- Deferral creates debt only on bill cards. “Wait,” “decline” or “buy less” on ordinary cards leaves the stated need unmet; it does not fabricate a bill or late fee. No loan, negative-balance permission, score, automatic illness, eviction, job loss or additional charge is implied. Any proposed future mechanic must be approved and explicitly implemented.
- Each ordinary choice resolves the card and shows its result. Subsequent route selection follows eligibility and circumstance state; unmet needs in result text do not automatically trigger another event. All new state dependencies, wage changes and delayed costs below are review blockers until the team defines them. Results are respectful, without a correct-parent or responsible-person score.
- Money uses USD and signed exact decimal/integer-cent calculations; round final values once with half-cent ties away from zero. Each amount needs its own edition-scoped binding: target, approved assumption or source observation, units/period/geography, quantity/formula and resolved cents. Annual CAC totals never determine individual purchase or assistance values.
- A bill’s principal, fee and total owed are liabilities, not a deduction from available cash until paid. Display current cash separately from unpaid debt. The end screen must not call a positive cash balance “debt free.” End-of-month future consequences are conditional educational text, not legal predictions or additional simulated deductions.

## Review index

| Key | Type | Category | Title | Persona intent | CAC choice |
| --- | --- | --- | --- | --- | --- |
| D001 | fixed | Employment & Adult Education | Looking for work | ALL | Conditional |
| D002 | fixed | Employment & Adult Education | An interview today | ALL | Conditional |
| D003 | fixed | Employment & Adult Education | Back to the job search | ALL | None |
| D004 | fixed | Employment & Adult Education | Another interview | ALL | Conditional |
| D005 | fixed | Financial Literacy & Taxes | Time to file taxes | ALL | Conditional |
| D006 | bill | Housing & Utilities | Rent is due | ALL | Conditional |
| D007 | bill | Housing & Utilities | Keeping the lights on | ALL | Conditional |
| D008 | bill | Housing & Utilities | The water bill | ALL | Conditional |
| D009 | bill | Essential Goods & Clothing | Staying connected | ALL | None |
| D010 | bill | Housing & Utilities | The internet bill | ALL | Conditional |
| D011 | bill | Financial Literacy & Taxes | Car insurance is due | CAR | None |
| D012 | bill | Essential Goods & Clothing | A clinic bill arrives | ALL | None |
| D013 | bill | Childcare & Youth | The childcare bill | JORDAN | None |
| D014 | bill | Childcare & Youth | Maya's school meal balance | JORDAN | None |
| D015 | bill | Essential Goods & Clothing | The repair bill | CAR | None |
| D016 | bill | Essential Goods & Clothing | A pharmacy bill arrives | ALL | None |
| D017 | bill | Financial Literacy & Taxes | A repayment is due | ALL | None |
| D018 | bill | Housing & Utilities | The gas bill | ALL | Conditional |
| D019 | bill | Housing & Utilities | Rent or a cash cushion? | ALL | Conditional |
| D020 | bill | Essential Goods & Clothing | A medical bill remains | ALL | None |
| D021 | shock | Essential Goods & Clothing | The car will not start | CAR | None |
| D022 | shock | Essential Goods & Clothing | An unexpected dental expense | ALL | None |
| D023 | shock | Essential Goods & Clothing | A broken phone | ALL | None |
| D024 | shock | Essential Goods & Clothing | A family emergency | ALL | None |
| D025 | shock | Childcare & Youth | Childcare falls through | JORDAN | None |
| D026 | shock | Essential Goods & Clothing | Time for new tires | CAR | None |
| D027 | shock | Essential Goods & Clothing | Broken glasses | ALL | None |
| D028 | shock | Housing & Utilities | A plumbing problem | ALL | None |
| D029 | shock | Childcare & Youth | An unexpected appointment for Maya | JORDAN | None |
| D030 | shock | Essential Goods & Clothing | A broken laptop | ALL | None |
| D031 | shock | Essential Goods & Clothing | The car needs a tow | CAR | None |
| D032 | shock | Housing & Utilities | A larger share to cover | SOFIA | None |
| D033 | shock | Essential Goods & Clothing | A damaged work item | EMPLOYED | None |
| D034 | shock | Essential Goods & Clothing | A broken dresser | ALL | Conditional |
| D035 | shock | Food & Nutrition | Groceries lost | ALL | Conditional |
| D036 | everyday | Food & Nutrition | A full grocery basket? | ALL | Conditional |
| D037 | everyday | Employment & Adult Education | Your ride to work falls through | EMPLOYED | None |
| D038 | everyday | Essential Goods & Clothing | A load of laundry | ALL | None |
| D039 | everyday | Childcare & Youth | Maya's school trip | JORDAN | None |
| D040 | everyday | Essential Goods & Clothing | Worn-out shoes | ALL | Conditional |
| D041 | everyday | Food & Nutrition | Too tired to cook? | ALL | None |
| D042 | everyday | Childcare & Youth | School supplies for Maya | JORDAN | Conditional |
| D043 | everyday | Essential Goods & Clothing | A family birthday | ALL | None |
| D044 | everyday | Employment & Adult Education | Getting to an appointment | ALL | None |
| D045 | everyday | Childcare & Youth | A coat for Maya | JORDAN | Conditional |
| D046 | everyday | Food & Nutrition | Packing lunch or buying it? | EMPLOYED | None |
| D047 | everyday | Essential Goods & Clothing | A broken bag | ALL | None |
| D048 | everyday | Childcare & Youth | Meals for Maya | JORDAN | Conditional |
| D049 | everyday | Financial Literacy & Taxes | A fee to access your money | ALL | None |
| D050 | everyday | Essential Goods & Clothing | Running low on essentials | ALL | None |
| D051 | everyday | Employment & Adult Education | A chance to learn | ALL | None |
| D052 | everyday | Childcare & Youth | Maya's birthday | JORDAN | None |
| D053 | everyday | Food & Nutrition | A holiday meal | ALL | Conditional |
| D054 | everyday | Essential Goods & Clothing | Clothes need replacing | ALL | Conditional |
| D055 | everyday | Financial Literacy & Taxes | Someone asks for help | ALL | None |
| D056 | everyday | Childcare & Youth | A holiday gift for Maya | JORDAN | Conditional |
| D057 | everyday | Employment & Adult Education | A pass or a few fares? | ALL | None |
| D058 | everyday | Essential Goods & Clothing | Laundry supplies are running low | SOFIA | None |
| D059 | everyday | Financial Literacy & Taxes | Time with a friend | ALL | None |
| D060 | everyday | Food & Nutrition | The groceries are running low | ALL | Conditional |

## D001 — Looking for work

**Type / category:** fixed / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** Pre-game; household confirmed; starting skills configured.

**Situation:** “You need work, and money is tight. Look through the job postings and decide where to apply.”

**Timing:** pre-game; `non_scheduled`; numeric pre-game day unresolved.

| Key | Submitted choice | Money / state | Result |
| --- | --- | --- | --- |
| TARGET | Apply for {job_title} | No immediate pay; record target job | “You submitted your application for {job_title}.” |
| PREP_TARGET | Take English and computer classes through CAC Adult Education, then apply for {job_title} | CAC only; USD 0.00, free classes with no cash credit; set both run skill flags and preparation-completed state; record target job | “You completed English and computer classes through CAC Adult Education and submitted your application for {job_title}.” |

These are complete submitted pathways, not a reading action. Exact UI substeps remain an integration detail. CAC preparation is free: USD 0.00, with no fee or cash credit. Skills are English/computer only: Alex and Jordan start with English only, Patricia with neither, Sofia with computer only. No experience gate; at least two jobs require neither skill. Approved wages/IDs remain unresolved and are displayed from the edition, never from generated values. Preparation does not hire or promise real-world success.


**Facts:** general `G-D001` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D001` = paired C24 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, CAC reported 610 total students in Adult Education programs.”

**CAC fact reference:** `cac_service_facts` · service `adult_education` · fact `total_students_in_adult_education_programs` · year 2025 · `fact_id=7cb64039-5726-43da-8f15-fbf8b63e8f83`. [Pairing rationale](scenario-cac-fact-pairings.md#d001).

**Pairing scope:** The choice explicitly includes adult English/computer preparation before selecting a job. Existing conditional preparation pathway; course totals do not define skill flags or job eligibility.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approved job/fee/service bindings and fixed-flow validation.

## D002 — An interview today

**Type / category:** fixed / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** Fixed Day 2; target job selected.

**Situation:** “Your interview is today. What will you wear?”

**Timing:** fixed Day 2; `scheduled`; `default_day=2`.

| Key | Submitted choice | Money / state | Result |
| --- | --- | --- | --- |
| BUY | Buy professional clothes | Approved USD -60.00; own professional clothes | “You bought professional clothes for the interview.” |
| CURRENT | Make my current clothes work | USD 0.00; do not create professional-clothing ownership | “You wore your current clothes to the interview.” |
| CAC | Get professional clothes using credits from CAC Canopy Thrift | CAC only; approved scripted in-kind clothing pathway, USD 0.00 net; own professional clothes | “You used credits from CAC Canopy Thrift to get professional clothes for the interview.” |

**Approved transition:** specified CAC preparation completed + BUY/CAC → hire selected job on Day 2. Any choice without that preparation fails; CURRENT fails even with preparation. First pay for a Day 2 hire is Day 9, then 16/23/30. Failed interview → show its result, then D003 immediately on Day 2, exactly as before. Preserve acquired clothes after failure. The USD 60.00 expense is covered in kind on CAC, not deposited as cash. An unaffordable BUY ends before purchase/hiring.


**Facts:** general `G-D002` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D002` = paired C15 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift.”

**CAC fact reference:** `cac_service_facts` · service `canopy_thrift` · fact `dollar_amount_of_client_credits_used_at_cac_canopy_thrift` · year 2025 · `fact_id=859b8cec-1e1c-4887-9f55-fd55f1bb349c`. [Pairing rationale](scenario-cac-fact-pairings.md#d002).

**Pairing scope:** Professional-clothing costs connect directly to the client-credit program. Existing conditional clothing pathway; annual credit does not set its amount.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approved job/fee/service bindings and fixed-flow validation.

## D003 — Back to the job search

**Type / category:** fixed / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** Fixed Day 2 immediately after a failed interview and its result.

**Situation:** “The interview did not lead to a job. You still need work. Where will you apply next?”

**Timing:** fixed Day 2 immediately after failed D002 and its result; `scheduled`; `default_day=2`. This is the approved exception to one scenario event per day.

| Key | Submitted choice | Money / state | Result |
| --- | --- | --- | --- |
| OTHER_JOB | Apply for {job_title} | USD 0.00; record new target, preserve preparation/clothing | “You submitted your application for {job_title}.” |

Expand to every other currently eligible job, excluding the first target, with no fallback tier or wage-rank gate. If no different eligible job exists, this is a catalog gap that blocks the route, not permission to fabricate a job. After the committed reapplication and recap, Continue advances to Day 3. No unrelated Day 2 event, immediate hiring or early paycheck.


**Facts:** general `G-D003` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D003` = paired C07 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, Career Services helped 229 people.”

**CAC fact reference:** `cac_service_facts` · service `career_services` · fact `people_helped_by_career_services` · year 2025 · `fact_id=db12c137-fad7-4277-b4ca-6a203b344e38`. [Pairing rationale](scenario-cac-fact-pairings.md#d003).

**Pairing scope:** Reapplying after an unsuccessful interview is directly relevant to career support. Context only; retain no CAC choice and no automatic job placement.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approved job/fee/service bindings and fixed-flow validation.

## D004 — Another interview

**Type / category:** fixed / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** Fixed Day 3 only after failed Day 2 and a different target selected.

**Situation:** “You have another interview today. What will you wear?”

**Timing:** conditional fixed Day 3; `scheduled`; `default_day=3`. No unrelated scenario shares this interview day.

| Key | Submitted choice | Money / state | Result |
| --- | --- | --- | --- |
| REUSE | Wear my professional clothes | Only choice if already owned; USD 0.00 | “You wore the professional clothes you already had. You got the job as {job_title}.” |
| BUY | Buy professional clothes | Only if not owned; approved USD -60.00; set ownership | “You bought professional clothes for the interview. You got the job as {job_title}.” |
| CURRENT | Make my current clothes work | Only if not owned; USD 0.00 | “You wore your current clothes to the interview. You got the job as {job_title}.” |
| CAC | Get professional clothes using credits from CAC Canopy Thrift | Only if not owned, CAC mode and eligible; USD 0.00 net; set ownership | “You used credits from CAC Canopy Thrift to get professional clothes. You got the job as {job_title}.” |

Any available valid submitted choice hires the different job on Day 3, regardless of preparation. First pay Day 10, then 17/24. Do not repeat the Day 2 success gate. An unaffordable BUY ends before purchase/hiring. If hired on Day 2, omit this event and select an eligible ordinary Day 3 scenario instead.


**Facts:** general `G-D004` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D004` = paired C08 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, CAC reported 80 job placements.”

**CAC fact reference:** `cac_service_facts` · service `career_services` · fact `job_placements` · year 2025 · `fact_id=2675ebbd-e014-4506-a0fd-1130a9ffe692`. [Pairing rationale](scenario-cac-fact-pairings.md#d004).

**Pairing scope:** A follow-up interview is relevant to the reported job-placement outcome. Existing conditional clothing pathway is unchanged; placements do not determine scripted hiring.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approved job/fee/service bindings and fixed-flow validation.

## D005 — Time to file taxes

**Type / category:** fixed / Financial Literacy & Taxes. **Persona intent:** ALL. **Eligibility:** Non-scheduled; proposed Day 18; not previously filed.

**Situation:** “It is time to file your taxes. Will you handle the return yourself or get help preparing it?”

**Timing:** `non_scheduled`; proposed Day 18. Only one tax filing per run.

| Key | Submitted choice | Money / state | Result |
| --- | --- | --- | --- |
| TRY | Try my best | Approved USD 0.00; no refund/deduction | “You filed your taxes yourself. You received no refund and paid no preparation fee.” |
| PAID | Pay someone to prepare taxes | UNRESOLVED approved fee F; require balance ≥ F before charging -F and immediately crediting approved +$1,000.00 once | “You paid the preparation fee and received a $1,000 refund.” |
| CAC | Get free tax preparation through CAC's VITA program | CAC only; no player-paid fee; approved +$1,000.00 once | “You filed your taxes through CAC's free VITA program and received a $1,000 refund.” |

Fee and refund remain separate components, even if their net is stored on the response. The refund cannot fund the prerequisite fee. An unaffordable PAID attempt ends before fee/refund consequences. Filing is not an unpaid bill and cannot be moved to the sidebar. The refund is an explicit simulation credit, not a CAC annual average or guaranteed real refund. Fee, VITA eligibility and binding IDs remain unresolved.


**Facts:** general `G-D005` = UNRESOLVED. Source an approved financial-resilience or tax-context observation. FINRA survey facts need year/question/coding/sample/denominator; a survey is not a price quote. CAC `K-D005` = paired C21 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, CAC reported 503 tax returns through the VITA program.”

**CAC fact reference:** `cac_service_facts` · service `vita` · fact `tax_returns_through_the_vita_program` · year 2025 · `fact_id=5b9132c2-90d6-4dea-9dc0-f2de13a89e2f`. [Pairing rationale](scenario-cac-fact-pairings.md#d005).

**Pairing scope:** The scenario is tax filing, and the fact measures returns through VITA. Existing conditional VITA pathway; no change to the approved fixed simulation refund.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approved job/fee/service bindings and fixed-flow validation.

## D006 — Rent is due

**Type / category:** bill / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “Rent is due. Paying it will leave less money for groceries, transportation, and everything else.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D006-PAY | Pay the bill | -$650.00 | settle_current_bill | “You paid the bill.” |
| D006-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |
| D006-CAC | Get rent assistance through CAC | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “You received help through CAC rent assistance. Your payment: {player_payment_usd}. Remaining balance on this expense: {remaining_expense_usd}.” |

**CAC mapping:** C01; candidate eligible expense is the $650.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Unpaid-sidebar proposal:** Ignore records principal $650.00 + proposed late fee $35.00 = **$685.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “Carrying rent debt into another month could put housing stability at risk.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D006` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D006` = paired C01 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, CAC reported preventing evictions for 1,108 households.”

**CAC fact reference:** `cac_service_facts` · service `eviction_prevention` · fact `evictions_prevented` · year 2025 · `fact_id=5fa2bac7-6016-4db8-b705-fc593f6b75ec`. [Pairing rationale](scenario-cac-fact-pairings.md#d006).

**Pairing scope:** The obligation is rent and the fact is specifically about eviction prevention. Existing conditional rent pathway; no eligibility or coverage amount inferred.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Rent; adjust share and amount for each persona..

## D007 — Keeping the lights on

**Type / category:** bill / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “The electricity bill is due. Your household still needs groceries and transportation this month. Which obligation will you carry?”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D007-PAY | Pay the bill | -$145.00 | settle_current_bill | “You paid the bill.” |
| D007-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |
| D007-CAC | Get help paying the electricity bill through CAC eviction prevention | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped bill-support effect; record only actual help used | “You received help paying the electricity bill through CAC eviction prevention. Your payment: {player_payment_usd}. Remaining balance on this expense: {remaining_expense_usd}.” |

**CAC mapping:** CAC eviction prevention; user-confirmed rent and utility bill support. Candidate eligible principal is $145.00, still a draft amount. Actual coverage A, household eligibility, availability and edition/service IDs remain to be bound. In CAC mode, assistance may cover the eligible bill in full when A is sufficient; cap support at the eligible remaining expense and charge only the player remainder. No cash payout or stacking. An unaffordable remainder must not be reported as successfully paid. Do not create an unpaid sidebar balance or late fee from a CAC submission; Ignore remains the separate debt-creation choice. No late-fee coverage is inferred.

**Unpaid-sidebar proposal:** Ignore records principal $145.00 + proposed late fee $10.00 = **$155.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “The unpaid electricity balance could lead to further collection activity or service problems, depending on the actual provider’s terms.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D007` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D007` = paired C01 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, CAC reported preventing evictions for 1,108 households.”

**CAC fact reference:** `cac_service_facts` · service `eviction_prevention` · fact `evictions_prevented` · year 2025 · `fact_id=5fa2bac7-6016-4db8-b705-fc593f6b75ec`. [Pairing rationale](scenario-cac-fact-pairings.md#d007).

**Pairing scope:** Electricity costs compete with rent and other essentials, connecting this decision to housing stability and eviction prevention. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Bind confirmed utility support to approved eligibility, availability and coverage amounts.

## D008 — The water bill

**Type / category:** bill / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A water and sewer bill arrives. It is smaller than rent, but paying every small bill still adds up.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D008-PAY | Pay the bill | -$68.00 | settle_current_bill | “You paid the bill.” |
| D008-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |
| D008-CAC | Get help paying the water and sewer bill through CAC eviction prevention | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped bill-support effect; record only actual help used | “You received help paying the water and sewer bill through CAC eviction prevention. Your payment: {player_payment_usd}. Remaining balance on this expense: {remaining_expense_usd}.” |

**CAC mapping:** CAC eviction prevention; user-confirmed rent and utility bill support. Candidate eligible principal is $68.00, still a draft amount. Actual coverage A, household eligibility, availability and edition/service IDs remain to be bound. In CAC mode, assistance may cover the eligible bill in full when A is sufficient; cap support at the eligible remaining expense and charge only the player remainder. No cash payout or stacking. An unaffordable remainder must not be reported as successfully paid. Do not create an unpaid sidebar balance or late fee from a CAC submission; Ignore remains the separate debt-creation choice. No late-fee coverage is inferred.

**Unpaid-sidebar proposal:** Ignore records principal $68.00 + proposed late fee $8.00 = **$76.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unpaid utility account can create continuing debt and possible service consequences under its provider’s rules.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D008` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D008` = paired C02 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.”

**CAC fact reference:** `cac_service_facts` · service `financial_assistance` · fact `amount_paid_through_financial_assistance` · year 2025 · `fact_id=b697ae84-1fd2-4bae-83da-7a10c983ac24`. [Pairing rationale](scenario-cac-fact-pairings.md#d008).

**Pairing scope:** Water and sewer costs are part of household housing pressure, providing context for financial assistance to prevent homelessness. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Only for households with a separately billed water obligation..

## D009 — Staying connected

**Type / category:** bill / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “Your phone plan renews today. Keeping it paid competes with the money you were trying to save for an emergency.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D009-PAY | Pay the bill | -$55.00 | settle_current_bill | “You paid the bill.” |
| D009-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $55.00 + proposed late fee $5.00 = **$60.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unresolved phone account could affect continued service and staying reachable for work.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D009` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D009` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No phone-plan or telecommunications-service fact. [Gap review](scenario-cac-fact-pairings.md#d009).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Requires a modeled plan that allows an unpaid billed balance; not a prepaid top-up..

## D010 — The internet bill

**Type / category:** bill / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “Your internet bill is due. You use the connection for applications and household tasks, but it does not replace the phone bill.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D010-PAY | Pay the bill | -$65.00 | settle_current_bill | “You paid the bill.” |
| D010-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |
| D010-CAC | Get help paying the internet bill through CAC eviction prevention | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped bill-support effect; record only actual help used | “You received help paying the internet bill through CAC eviction prevention. Your payment: {player_payment_usd}. Remaining balance on this expense: {remaining_expense_usd}.” |

**CAC mapping:** CAC eviction prevention; user-confirmed rent and utility bill support. Candidate eligible principal is $65.00, still a draft amount. Actual coverage A, household eligibility, availability and edition/service IDs remain to be bound. In CAC mode, assistance may cover the eligible bill in full when A is sufficient; cap support at the eligible remaining expense and charge only the player remainder. No cash payout or stacking. An unaffordable remainder must not be reported as successfully paid. Do not create an unpaid sidebar balance or late fee from a CAC submission; Ignore remains the separate debt-creation choice. No late-fee coverage is inferred.

**Unpaid-sidebar proposal:** Ignore records principal $65.00 + proposed late fee $7.00 = **$72.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unpaid internet account could affect service and leave a balance to resolve after the month.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D010` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D010` = paired C02 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.”

**CAC fact reference:** `cac_service_facts` · service `financial_assistance` · fact `amount_paid_through_financial_assistance` · year 2025 · `fact_id=b697ae84-1fd2-4bae-83da-7a10c983ac24`. [Pairing rationale](scenario-cac-fact-pairings.md#d010).

**Pairing scope:** The home-internet bill competes with rent and other household obligations, providing broader housing-budget context for financial assistance to prevent homelessness. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Only if the persona has separately billed home internet..

## D011 — Car insurance is due

**Type / category:** bill / Financial Literacy & Taxes. **Persona intent:** CAR. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A car insurance installment is due. Ignoring it preserves cash today while leaving a larger amount unpaid.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D011-PAY | Pay the bill | -$130.00 | settle_current_bill | “You paid the bill.” |
| D011-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $130.00 + proposed late fee $15.00 = **$145.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unpaid insurance installment could put coverage at risk. Actual coverage and legal consequences depend on the policy and cannot be inferred here.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D011` = UNRESOLVED. Source an approved financial-resilience or tax-context observation. FINRA survey facts need year/question/coding/sample/denominator; a survey is not a price quote. CAC `K-D011` = paired C22 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, 218 students enrolled in Financial Literacy Classes.”

**CAC fact reference:** `cac_service_facts` · service `financial_literacy_classes` · fact `students_enrolled_in_financial_literacy_classes` · year 2025 · `fact_id=d32689c8-067a-4f59-aa48-2424384b7116`. [Pairing rationale](scenario-cac-fact-pairings.md#d011).

**Pairing scope:** Choosing how to handle an insurance installment is a financial-literacy/budget tradeoff. Context only; no CAC car-insurance payment or insurance service inferred.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Requires approved car ownership and insurance installment terms. No modeled driving or legal penalty..

## D012 — A clinic bill arrives

**Type / category:** bill / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A bill from an earlier clinic visit comes due. The care already happened; ignoring the invoice will not undo the visit.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D012-PAY | Pay the bill | -$190.00 | settle_current_bill | “You paid the bill.” |
| D012-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $190.00 + proposed late fee $20.00 = **$210.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “The unpaid medical bill could require payment arrangements or collection follow-up.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D012` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D012` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No clinic-cost or medical-assistance fact. [Gap review](scenario-cac-fact-pairings.md#d012).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Requires an edition-approved prior invoice, not a new medical event or diagnosis..

## D013 — The childcare bill

**Type / category:** bill / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “Maya’s agreed childcare arrangement has an invoice due. Paying it uses money you had hoped to keep available for the rest of the month.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D013-PAY | Pay the bill | -$260.00 | settle_current_bill | “You paid the bill.” |
| D013-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $260.00 + proposed late fee $25.00 = **$285.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unresolved childcare account could affect access to future care, subject to actual provider arrangements.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D013` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D013` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No daycare/childcare-payment fact; Meals for Kids measures food support. [Gap review](scenario-cac-fact-pairings.md#d013).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Requires approved care arrangement and terms. CAC daycare payments are not established..

## D014 — Maya's school meal balance

**Type / category:** bill / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “Maya's school meal account has a balance due. How will you handle the bill?”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D014-PAY | Pay the bill | -$32.00 | settle_current_bill | “You paid the bill.” |
| D014-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $32.00 + proposed late fee $3.00 = **$35.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “The account would remain owed.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D014` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D014` = paired C16 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, Meals for Kids served 1,097 children.”

**CAC fact reference:** `cac_service_facts` · service `meals_for_kids` · fact `children_served_by_meals_for_kids` · year 2025 · `fact_id=9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01`. [Pairing rationale](scenario-cac-fact-pairings.md#d014).

**Pairing scope:** The child’s meal-account decision has relevant child-food-access context. Context only; Meals for Kids is not represented as paying the school account.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Requires actual fictional school-account applicability; no claim about local fee practices..

## D015 — The repair bill

**Type / category:** bill / Essential Goods & Clothing. **Persona intent:** CAR. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A repair completed before the month has a bill due today. The car is already repaired; this choice is about the unpaid invoice.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D015-PAY | Pay the bill | -$240.00 | settle_current_bill | “You paid the bill.” |
| D015-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $240.00 + proposed late fee $25.00 = **$265.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “The repair balance could remain a debt and require follow-up with the repair provider.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D015` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D015` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No vehicle-repair invoice or automotive-assistance fact. [Gap review](scenario-cac-fact-pairings.md#d015).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Mutually exclusive with charging the same repair in D021/D026/D031..

## D016 — A pharmacy bill arrives

**Type / category:** bill / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A pharmacy account invoice for an earlier purchase is due. The medicine was already supplied.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D016-PAY | Pay the bill | -$85.00 | settle_current_bill | “You paid the bill.” |
| D016-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $85.00 + proposed late fee $8.00 = **$93.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “The unpaid pharmacy bill remains a debt.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D016` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D016` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No prescription-payment or medicine-assistance fact. [Gap review](scenario-cac-fact-pairings.md#d016).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Only if a billed pharmacy arrangement is explicitly configured; do not assume pharmacies extend credit..

## D017 — A repayment is due

**Type / category:** bill / Financial Literacy & Taxes. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A payment on your existing repayment agreement is due. Paying it leaves less money for your other needs.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D017-PAY | Pay the bill | -$110.00 | settle_current_bill | “You paid the bill.” |
| D017-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $110.00 + proposed late fee $12.00 = **$122.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “A missed installment could increase debt and affect the relationship with the lender, according to the actual agreement.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D017` = UNRESOLVED. Source an approved financial-resilience or tax-context observation. FINRA survey facts need year/question/coding/sample/denominator; a survey is not a price quote. CAC `K-D017` = paired C22 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, 218 students enrolled in Financial Literacy Classes.”

**CAC fact reference:** `cac_service_facts` · service `financial_literacy_classes` · fact `students_enrolled_in_financial_literacy_classes` · year 2025 · `fact_id=d32689c8-067a-4f59-aa48-2424384b7116`. [Pairing rationale](scenario-cac-fact-pairings.md#d017).

**Pairing scope:** Managing an existing repayment installment is a financial-literacy decision. Context only; CAC does not pay or restructure this debt in the draft.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Staff must approve existence, terms and persona linkage; do not create an automatic loan..

## D018 — The gas bill

**Type / category:** bill / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “Your household gas bill is due. Paying it will use some of the money you have set aside for other needs.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D018-PAY | Pay the bill | -$92.00 | settle_current_bill | “You paid the bill.” |
| D018-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |
| D018-CAC | Get help paying the gas bill through CAC eviction prevention | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped bill-support effect; record only actual help used | “You received help paying the gas bill through CAC eviction prevention. Your payment: {player_payment_usd}. Remaining balance on this expense: {remaining_expense_usd}.” |

**CAC mapping:** CAC eviction prevention; user-confirmed rent and utility bill support. Candidate eligible principal is $92.00, still a draft amount. Actual coverage A, household eligibility, availability and edition/service IDs remain to be bound. In CAC mode, assistance may cover the eligible bill in full when A is sufficient; cap support at the eligible remaining expense and charge only the player remainder. No cash payout or stacking. An unaffordable remainder must not be reported as successfully paid. Do not create an unpaid sidebar balance or late fee from a CAC submission; Ignore remains the separate debt-creation choice. No late-fee coverage is inferred.

**Unpaid-sidebar proposal:** Ignore records principal $92.00 + proposed late fee $9.00 = **$101.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unpaid gas account could create continuing debt and possible provider service consequences.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D018` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D018` = paired C01 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, CAC reported preventing evictions for 1,108 households.”

**CAC fact reference:** `cac_service_facts` · service `eviction_prevention` · fact `evictions_prevented` · year 2025 · `fact_id=5fa2bac7-6016-4db8-b705-fc593f6b75ec`. [Pairing rationale](scenario-cac-fact-pairings.md#d018).

**Pairing scope:** Household gas costs compete with rent and other essentials, connecting this decision to housing stability and eviction prevention. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Only gas-service households; avoid including gas costs twice in electricity or rent..

## D019 — Rent or a cash cushion?

**Type / category:** bill / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “Rent is due just as you start to rebuild a cash buffer. Paying means giving up that buffer; ignoring creates a larger obligation.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D019-PAY | Pay the bill | -$650.00 | settle_current_bill | “You paid the bill.” |
| D019-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |
| D019-CAC | Get rent assistance through CAC | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “You received help through CAC rent assistance. Your payment: {player_payment_usd}. Remaining balance on this expense: {remaining_expense_usd}.” |

**CAC mapping:** C01; candidate eligible expense is the $650.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Unpaid-sidebar proposal:** Ignore records principal $650.00 + proposed late fee $35.00 = **$685.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “The remaining rent debt and fee could make next month harder and threaten housing stability without a specific legal outcome being predicted.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D019` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D019` = paired C02 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.”

**CAC fact reference:** `cac_service_facts` · service `financial_assistance` · fact `amount_paid_through_financial_assistance` · year 2025 · `fact_id=b697ae84-1fd2-4bae-83da-7a10c983ac24`. [Pairing rationale](scenario-cac-fact-pairings.md#d019).

**Pairing scope:** The scenario concerns rent pressure and preserving housing stability. Existing conditional rent pathway; annual spending is not the household’s benefit amount.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Alternative to D006 for the same monthly rent occurrence, never a second rent charge..

## D020 — A medical bill remains

**Type / category:** bill / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A medical bill is due. You can pay it now or leave the balance unpaid.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D020-PAY | Pay the bill | -$320.00 | settle_current_bill | “You paid the bill.” |
| D020-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “You left the bill unpaid. A late fee was added to the amount you owe.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $320.00 + proposed late fee $25.00 = **$345.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unresolved medical balance could require later repayment or collection follow-up.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D020` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D020` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No medical-bill assistance fact. [Gap review](scenario-cac-fact-pairings.md#d020).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Alternative medical-invoice variant; do not select with D012 for the same invoice..

## D021 — The car will not start

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** CAR. **Eligibility:** Car owned; repair not already invoiced; MARTA routes and operating times can cover the configured household trips.

**Situation:** “The car will not start. The repair quote could use much of your remaining money, but you still need a way to get around.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D021-REPAIR | Pay for the repair | -$620.00 | car_repaired | “You pay for the quoted repair and keep the car available.” |
| D021-TRANSIT | Leave the car parked and use MARTA | -$50.00 | car_unavailable_marta | “You leave the car unrepaired and use MARTA. Unreliable arrival times and longer waits mean more planning and more time away from home.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. The $50.00 is a placeholder travel budget, not a verified MARTA fare or pass price. Bind the covered trips and period before publication. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. The waiting, reliability and planning tradeoffs are narrative consequences of this configured route; they do not automatically deduct wages, add travel charges, advance extra days or trigger another event.

**Facts:** general `G-D021` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D021` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No vehicle repair or roadside-assistance fact. [Gap review](scenario-cac-fact-pairings.md#d021).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Confirm feasible MARTA routes, service hours, travel period and the stated waiting/reliability tradeoffs for this household; do not invent lost wages or repair failure.

## D022 — An unexpected dental expense

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Fictional treatment need and alternatives approved.

**Situation:** “You have a painful dental problem. Treatment costs more than an assessment, and the assessment alone will not cover treatment.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D022-TREAT | Pay for the quoted treatment | -$480.00 | dental_treatment_purchased | “You paid for dental treatment.” |
| D022-ASSESS | Pay for an assessment only | -$90.00 | dental_treatment_unresolved | “You paid for the assessment. Dental treatment has not been paid for.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D022` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D022` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No dental-care cost or dental-assistance fact. [Gap review](scenario-cac-fact-pairings.md#d022).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No treatment advice, predicted deterioration or automatic future charge; care alternatives and costs need review..

## D023 — A broken phone

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Phone required; no duplicate handset event.

**Situation:** “Your phone breaks while you are waiting for work and household messages. Replacing it costs much more than the monthly service bill.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D023-REPLACE | Buy a replacement handset | -$240.00 | phone_replaced | “You have a replacement phone and substantially less cash.” |
| D023-REPAIR | Pay for the repair | -$95.00 | phone_repaired | “You pay for a repair rather than a replacement.” |
| D023-WAIT | Go without the phone for now | $0.00 | phone_unavailable | “You kept the money, but you still do not have a working phone.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D023` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D023` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No phone replacement or device-assistance fact. [Gap review](scenario-cac-fact-pairings.md#d023).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D024 — A family emergency

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Fictional relative and travel circumstances approved.

**Situation:** “Someone close to you has a family emergency out of town. You want to be there, but the trip would use money set aside for your own household.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D024-TRAVEL | Pay for the trip | -$360.00 | family_trip_purchased | “You commit the travel cost and choose to be present.” |
| D024-REMOTE | Stay home and support them remotely | $0.00 | family_trip_declined | “You preserve the money but cannot be there in person.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D024` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D024` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No emergency family-travel assistance fact; targeted workforce transportation is not a general travel benefit. [Gap review](scenario-cac-fact-pairings.md#d024).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No bereavement probability, wage loss or judged family-relationship score..

## D025 — Childcare falls through

**Type / category:** shock / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Employed; Maya attends school; usual after-school caregiver unavailable for two school days; both replacement arrangements and any work-schedule change explicitly approved.

**Situation:** “The person who usually watches Maya after school is sick and cannot care for her for the next two school days. Your shifts end after school lets out, so you need another plan.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D025-AGENCY | Arrange three hours of after-school care on each of the two days | -$120.00 | replacement_care_booked | “You arranged after-school care for both days to cover the rest of your shifts.” |
| D025-SHORT | Arrange 90 minutes of care each day and agree on earlier shifts with your employer | -$60.00 | short_care_work_availability_changed | “You arranged shorter after-school care for both days and agreed on earlier shifts with your employer.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** Proposed simulation assumption: USD 20.00 per hour. Full coverage: 2 school days x 3 hours x $20.00 = $120.00. Shorter coverage: 2 school days x 1.5 hours x $20.00 = $60.00. These are draft assumptions, not market estimates. Charge the selected two-day total once on submission; do not repeat it on the second day. Confirm school dismissal, shift times, caregiver suitability and availability. The shorter option requires an employer-approved shift change that preserves the configured paid hours; do not infer wage loss or an extra wage credit. Reconcile this period with D013 to avoid charging the same care twice. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D025` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D025` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No replacement-childcare or daycare-access fact. [Gap review](scenario-cac-fact-pairings.md#d025).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Both alternatives must be feasible; never imply unsupervised care is acceptable. No CAC daycare benefit..

## D026 — Time for new tires

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** CAR. **Eligibility:** Car owned; approved tire replacement need.

**Situation:** “Your car needs tires. A new set costs a large part of your available money. The shop also has a lower-cost set.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D026-NEW | Buy the new set | -$520.00 | tires_replaced_new | “You pay for the new set.” |
| D026-LOWER | Buy the lower-cost set | -$310.00 | tires_replaced_alternative | “You choose the lower-cost set and keep more money for other needs.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D026` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D026` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No tire replacement or automotive-assistance fact. [Gap review](scenario-cac-fact-pairings.md#d026).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Safety and suitability of both options need staff review; price does not imply a predicted failure rate..

## D027 — Broken glasses

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Persona explicitly needs corrective glasses.

**Situation:** “Your glasses break. You can choose a standard replacement or a less expensive basic pair.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D027-STANDARD | Buy the standard replacement | -$290.00 | glasses_replaced_standard | “You pay for the standard replacement.” |
| D027-BASIC | Buy the basic replacement | -$135.00 | glasses_replaced_basic | “You choose the basic replacement and retain more cash.” |
| D027-DEFER | Delay replacement | $0.00 | glasses_need_unmet | “You did not buy new glasses. Your glasses still need replacing.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D027` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D027` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No vision-care or glasses-replacement assistance fact. [Gap review](scenario-cac-fact-pairings.md#d027).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D028 — A plumbing problem

**Type / category:** shock / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved housing arrangement explicitly assigns this cost; do not assume tenant liability.

**Situation:** “There is a plumbing problem at home, and the repair is your responsibility. You can pay for the full repair or a temporary fix.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D028-FIX | Pay for the full quoted repair | -$410.00 | plumbing_repaired | “The quoted repair is paid.” |
| D028-TEMP | Pay for the temporary workaround | -$75.00 | plumbing_repair_unresolved | “You buy time with the workaround, but the repair need remains.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D028` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D028` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No plumbing/home-repair assistance fact. [Gap review](scenario-cac-fact-pairings.md#d028).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Liability, habitability and feasible alternatives require review; no claim about landlord law..

## D029 — An unexpected appointment for Maya

**Type / category:** shock / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Fictional child-care expense and suitable alternatives approved.

**Situation:** “Maya needs a care appointment you had not budgeted for. You can pay for the full appointment or an initial appointment that leaves some care to arrange.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D029-FULL | Pay for the full appointment | -$380.00 | child_appointment_purchased | “You commit the full appointment cost.” |
| D029-INITIAL | Pay for the initial appointment | -$120.00 | child_followup_need_unresolved | “You paid for the initial appointment. The remaining care has not been arranged.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D029` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D029` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No child healthcare/appointment assistance fact. [Gap review](scenario-cac-fact-pairings.md#d029).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Not medical advice or a recommendation to postpone necessary care; alternatives need domain/content review..

## D030 — A broken laptop

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Laptop owned and used for household/job tasks.

**Situation:** “Your laptop fails. A replacement is expensive, and a repair quote is cheaper but would keep the same older device.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D030-REPLACE | Buy the replacement | -$450.00 | laptop_replaced | “You pay for a replacement device.” |
| D030-REPAIR | Pay for the repair | -$180.00 | laptop_repaired | “You repair the existing device.” |
| D030-DEFER | Manage without it for now | $0.00 | laptop_unavailable | “You keep the money and the laptop remains unavailable.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D030` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D030` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** Computer Classes measures education, not laptop repair or replacement. [Gap review](scenario-cac-fact-pairings.md#d030).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; CAC computer classes are not a laptop replacement benefit..

## D031 — The car needs a tow

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** CAR. **Eligibility:** Approved towing event; not duplicated with another car scenario.

**Situation:** “The car needs towing. You have quotes to take it to a repair shop or to a parking location. Neither quote includes repairs.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D031-SHOP | Tow it to the repair shop | -$225.00 | car_at_shop_unrepaired | “The towing charge is paid; repairs are not included.” |
| D031-PARK | Tow it to the parking location | -$140.00 | car_parked_unrepaired | “You pay less for the tow, and the car still needs attention.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D031` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D031` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No towing or vehicle-recovery assistance fact. [Gap review](scenario-cac-fact-pairings.md#d031).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Both destinations must be feasible; no impound rules, storage fees or later repair costs without approval..

## D032 — A larger share to cover

**Type / category:** shock / Housing & Utilities. **Persona intent:** SOFIA. **Eligibility:** Approved fictional shared-cost change; no spouse income inferred.

**Situation:** “You and your spouse need to make a household purchase, and your share is larger than expected. You can cover the full share or agree on a smaller contribution that leaves part of the purchase unfunded.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D032-FULL | Pay the larger share | -$420.00 | shared_purchase_fully_funded | “You cover the stated share from your own available balance.” |
| D032-SMALL | Pay the smaller agreed contribution | -$180.00 | shared_need_partly_unmet | “You made the smaller contribution you agreed on. Part of the household purchase remains unfunded.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D032` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D032` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** The shared household purchase is unspecified. Define the actual goods before selecting a relevant program fact. [Gap review](scenario-cac-fact-pairings.md#d032).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; This is a proposed agreed purchase, not partial bill payment or invented spouse wages; specify actual goods before publication..

## D033 — A damaged work item

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** EMPLOYED. **Eligibility:** Hired; approved role actually uses this item.

**Situation:** “An item you need for work is damaged. You can replace it or pay to have it repaired.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D033-REPLACE | Buy the replacement | -$350.00 | work_item_replaced | “You pay for the replacement.” |
| D033-REPAIR | Pay for the repair | -$145.00 | work_item_repaired | “You repair the existing item and preserve more cash.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D033` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D033` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** The damaged work item is unspecified; clothing and computer classes do not establish equipment coverage. [Gap review](scenario-cac-fact-pairings.md#d033).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Not a new job qualification or a universal worker obligation; item ownership/employer responsibility needs approval..

## D034 — A broken dresser

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Owned dresser damaged; no automatic landlord obligation.

**Situation:** “Your dresser breaks, leaving you without enough storage for your clothes. A complete replacement costs more than a basic option.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D034-FULL | Buy the complete replacement | -$390.00 | dresser_replaced_full | “You spend more for the complete replacement.” |
| D034-BASIC | Buy the basic option | -$165.00 | dresser_replaced_basic | “You choose the basic option and keep more cash.” |
| D034-DEFER | Make do without replacing it this month | $0.00 | dresser_need_unmet | “You kept the money. Your dresser still needs replacing.” |
| D034-CAC | Get a dresser through CAC Canopy Thrift assistance | USD 0.00; free in-kind receipt; no cash credit | Record approved dresser received and assistance use | “You received a dresser through CAC Canopy Thrift.” |

**CAC mapping:** The user confirmed CAC carries household furniture such as dressers, cabinets and chairs, along with home decor. Offer this assistance choice only in CAC mode when an approved dresser is available and household/item eligibility validates. Receipt costs USD 0.00 and creates no cash credit or debt. Confirm the service/edition binding and specific allocation; ordinary retail stock does not automatically establish an assistance allocation.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D034` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D034` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No suitable dresser/furniture CAC outcome fact is assigned. The user confirmed household furniture availability; retain the fact slot unresolved rather than substituting an unrelated clothing statistic. [Gap review](scenario-cac-fact-pairings.md#d034).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Bind the user-confirmed furniture pathway to dresser availability, household eligibility and approved allocation.

## D035 — Groceries lost

**Type / category:** shock / Food & Nutrition. **Persona intent:** ALL. **Eligibility:** Food loss explicitly configured; do not charge appliance repair here.

**Situation:** “A refrigerator failure spoils your groceries. Replacing the food means spending money on something you already bought.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D035-FULL | Replace the full basket | -$165.00 | spoiled_food_replaced_full | “You bought groceries to replace the food you lost.” |
| D035-SMALL | Buy only the immediate essentials | -$65.00 | spoiled_food_replaced_partial | “You replace fewer items and leave the rest of the basket unfilled.” |
| D035-CAC | Get replacement groceries from the CAC Mini-Market | USD 0.00; free in-kind receipt; no cash credit | Record actual approved items received and assistance use | “You received replacement groceries from the CAC Mini-Market.” |

**CAC mapping:** Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D035` = UNRESOLVED. Source an approved food-budget/food-access observation with exact household composition, month, geography, unit and population; match the specific food decision. CAC `K-D035` = paired C25 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, the CAC Mini-Market reported 1,160,328 pounds of food available.”

**CAC fact reference:** `cac_service_facts` · service `mini_market` · fact `pounds_of_food_available_from_the_cac_mini_market` · year 2025 · `fact_id=efaf231b-3db3-4c4d-b276-758006af8aab`. [Pairing rationale](scenario-cac-fact-pairings.md#d035).

**Pairing scope:** The expense here is replacement groceries, not repairing the refrigerator. Existing conditional food pathway; no CAC appliance service or value-per-pound calculation.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; CAC option may cover the approved replacement basket in kind; no appliance-repair service is implied..

## D036 — A full grocery basket?

**Type / category:** everyday / Food & Nutrition. **Persona intent:** ALL. **Eligibility:** Approved household-sized food basket.

**Situation:** “You have a grocery list, but buying everything on it would leave little money for anything else.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D036-FULL | Buy the full basket | -$95.00 | food_basket_full | “You buy the full basket.” |
| D036-SMALL | Buy the smaller basket | -$50.00 | food_basket_reduced | “You spend less and leave some listed food unpurchased.” |
| D036-CAC | Get groceries from the CAC Mini-Market | USD 0.00; free in-kind receipt; no cash credit | Record actual approved items received and assistance use | “You received groceries from the CAC Mini-Market.” |

**CAC mapping:** Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D036` = UNRESOLVED. Source an approved food-budget/food-access observation with exact household composition, month, geography, unit and population; match the specific food decision. CAC `K-D036` = paired C04 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, there were 36,521 visits to the CAC Mini-Market.”

**CAC fact reference:** `cac_service_facts` · service `mini_market` · fact `visits_to_the_cac_mini_market` · year 2025 · `fact_id=94210a01-4766-46ad-beba-d7400c9fd31e`. [Pairing rationale](scenario-cac-fact-pairings.md#d036).

**Pairing scope:** The decision is grocery access and choosing a food basket. Existing conditional food pathway; visits do not create an entitlement.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D037 — Your ride to work falls through

**Type / category:** everyday / Employment & Adult Education. **Persona intent:** EMPLOYED. **Eligibility:** Hired; ride canceled; both routes feasible.

**Situation:** “The ride you arranged to work is canceled. You can pay for a direct ride or use a cheaper route that takes longer.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D037-RIDE | Pay for the direct ride | -$38.00 | work_trip_direct | “You pay more for the direct route.” |
| D037-TRANSIT | Take the transit route | -$6.00 | work_trip_longer | “You pay less and commit more travel time.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D037` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D037` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** The transportation measure is workforce-program-specific; this card applies to employed people generally. [Gap review](scenario-cac-fact-pairings.md#d037).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Do not invent lateness, wage loss or dismissal..

## D038 — A load of laundry

**Type / category:** everyday / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Paid laundry facilities required.

**Situation:** “Your clothes need washing. Washing and drying the full load costs more than washing a smaller load and air-drying it.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D038-FULL | Wash and dry the full load | -$18.00 | laundry_full | “You washed and dried the full load.” |
| D038-SMALL | Wash the smaller load and air-dry it | -$8.00 | laundry_partial | “You spend less, wash fewer items, and handle drying yourself.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D038` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D038` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No laundry-service or laundry-fee assistance fact; clothing distribution is a different activity. [Gap review](scenario-cac-fact-pairings.md#d038).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D039 — Maya's school trip

**Type / category:** everyday / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Optional school trip with approved nonparticipation arrangement.

**Situation:** “Maya brings home an optional school trip notice. The fee is modest compared with rent, but it is another claim on the same money.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D039-PAY | Pay for the trip | -$28.00 | school_trip_paid | “You paid for Maya to go on the school trip.” |
| D039-DECLINE | Decline the optional trip | $0.00 | school_trip_declined | “You kept the money, and Maya did not go on the trip.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D039` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D039` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** Tools for School concerns supplies, not school-trip participation or fees. [Gap review](scenario-cac-fact-pairings.md#d039).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D040 — Worn-out shoes

**Type / category:** everyday / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Everyday shoes; not interview outfit.

**Situation:** “Your everyday shoes are wearing out. A new pair costs more than repairing the existing pair.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D040-BUY | Buy the replacement shoes | -$70.00 | everyday_shoes_replaced | “You buy the new pair.” |
| D040-REPAIR | Repair your existing shoes | -$25.00 | everyday_shoes_repaired | “You repair the current pair instead.” |
| D040-CAC | Get shoes using credits from CAC Canopy Thrift | USD 0.00; free in-kind receipt; no cash credit | Record actual approved items received and assistance use | “You used CAC Canopy Thrift credits to get shoes.” |

**CAC mapping:** Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D040` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D040` = paired C14 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, CAC Canopy Thrift served 2,152 households.”

**CAC fact reference:** `cac_service_facts` · service `canopy_thrift` · fact `households_served_by_cac_canopy_thrift` · year 2025 · `fact_id=5d6bc795-8a41-49ca-862f-9aaf73405b49`. [Pairing rationale](scenario-cac-fact-pairings.md#d040).

**Pairing scope:** Replacing everyday shoes connects to the clothing program’s household reach. Existing conditional item pathway; approval of the specific shoe/item scope is still required.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Coverage for the specific item requires approval; professional-clothing ownership is unaffected..

## D041 — Too tired to cook?

**Type / category:** everyday / Food & Nutrition. **Persona intent:** ALL. **Eligibility:** Household-sized meal costs approved.

**Situation:** “You get home tired. Buying a prepared meal saves effort, but ingredients cost less and require cooking.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D041-PREPARED | Buy the prepared meal | -$24.00 | meal_prepared_purchased | “You pay more and avoid cooking this meal.” |
| D041-COOK | Buy ingredients and cook | -$10.00 | meal_ingredients_purchased | “You spend less and commit the preparation time.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D041` = UNRESOLVED. Source an approved food-budget/food-access observation with exact household composition, month, geography, unit and population; match the specific food decision. CAC `K-D041` = paired C05 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, the CAC Mini-Market served 2,995 households.”

**CAC fact reference:** `cac_service_facts` · service `mini_market` · fact `households_served_by_the_cac_mini_market` · year 2025 · `fact_id=ec44118c-3be1-46b1-9585-8f34d638bbd9`. [Pairing rationale](scenario-cac-fact-pairings.md#d041).

**Pairing scope:** Buying meal ingredients has relevant household food-access context. Context only; no restaurant, prepared-meal reimbursement or new CAC option.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No nutrition score or assumed cooking facilities; route requires a usable kitchen for COOK..

## D042 — School supplies for Maya

**Type / category:** everyday / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Actual school period and approved item list.

**Situation:** “Maya needs supplies for an upcoming school activity. You can buy the complete set or just the immediate required items.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D042-FULL | Buy the full supply set | -$48.00 | school_supplies_full | “You purchase the complete set.” |
| D042-BASIC | Buy only the immediate items | -$22.00 | school_supplies_partial | “You buy the smaller set and leave the other items unpurchased.” |
| D042-CAC | Get school supplies through Tools for School | USD 0.00; free in-kind receipt; no cash credit | Record actual approved items received and assistance use | “You received school supplies through Tools for School.” |

**CAC mapping:** Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D042` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D042` = paired C17 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, Tools for School served 1,090 children.”

**CAC fact reference:** `cac_service_facts` · service `tools_for_school` · fact `children_served_by_tools_for_school` · year 2025 · `fact_id=c6a72bf1-47ac-4d53-9adc-8ad68dd120c4`. [Pairing rationale](scenario-cac-fact-pairings.md#d042).

**Pairing scope:** The decision is specifically school supplies for a child. Existing conditional school-supply pathway; no item list or per-child amount inferred.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D043 — A family birthday

**Type / category:** everyday / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Fictional family occasion approved.

**Situation:** “A family birthday is coming up. You want to acknowledge it while keeping enough money for necessities.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D043-GIFT | Buy the gift you planned | -$35.00 | birthday_gift_purchased | “You spend money on the planned gift.” |
| D043-SMALL | Choose a smaller gift | -$10.00 | birthday_small_gift | “You choose a less expensive gift.” |
| D043-TIME | Give your time instead | $0.00 | birthday_no_purchase | “You make no purchase and choose a nonfinancial gesture.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D043` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D043` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** Hope for the Holidays is seasonal holiday support, not general birthday gifts. [Gap review](scenario-cac-fact-pairings.md#d043).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D044 — Getting to an appointment

**Type / category:** everyday / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** A required household appointment and two feasible travel options are explicitly configured; not a workforce-program or medical-care event.

**Situation:** “You have a household appointment across town. A direct ride costs more, while the transit route takes longer.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D044-DIRECT | Pay for a direct ride | -$32.00 | household_appointment_trip_direct | “You pay for the direct trip.” |
| D044-TRANSIT | Take the transit route | -$6.00 | household_appointment_trip_transit | “You spend less and commit more travel time.” |

**CAC option:** none in either mode. No assistance or transport benefit is inferred.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D044` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D044` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No general household-appointment transportation fact is assigned. The rarely used workforce transportation service is excluded from this replacement. [Gap review](scenario-cac-fact-pairings.md#d044).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Approve the appointment purpose, feasible routes and travel costs. No missed-appointment fee, wage loss or automatic later event is implied.

## D045 — A coat for Maya

**Type / category:** everyday / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Approved cold-weather season and need.

**Situation:** “Cold weather is here, and Maya needs a coat. You can buy a new one or a less expensive secondhand coat.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D045-NEW | Buy the new coat | -$60.00 | child_coat_new | “You buy the new coat.” |
| D045-USED | Buy the secondhand coat | -$24.00 | child_coat_secondhand | “You meet the coat need with the lower-cost option.” |
| D045-CAC | Get a coat for Maya through Coats for Kids | USD 0.00; free in-kind receipt; no cash credit | Record actual approved items received and assistance use | “You received a coat for Maya through Coats for Kids.” |

**CAC mapping:** Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D045` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D045` = paired C18 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, Coats for Kids served 623 children.”

**CAC fact reference:** `cac_service_facts` · service `coats_for_kids` · fact `children_served_by_coats_for_kids` · year 2025 · `fact_id=e8473e58-6338-4855-93be-7608f27696ab`. [Pairing rationale](scenario-cac-fact-pairings.md#d045).

**Pairing scope:** The need is a child’s warm coat in the program’s season. Existing conditional coat pathway; the client has resolved the source goal-versus-actual ambiguity.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; The client confirmed the Coats for Kids figures are achieved outcomes. No child-coat event outside its season..

## D046 — Packing lunch or buying it?

**Type / category:** everyday / Food & Nutrition. **Persona intent:** EMPLOYED. **Eligibility:** Hired; feasible cooking/storage assumptions.

**Situation:** “You can prepare lunches ahead of time or buy them during workdays. One option takes more time now; the other costs more money.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D046-PACK | Buy ingredients and pack lunches | -$26.00 | work_lunches_packed | “You spend less and do the preparation.” |
| D046-BUY | Buy the workday lunches | -$55.00 | work_lunches_purchased | “You save preparation time and spend more.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D046` = UNRESOLVED. Source an approved food-budget/food-access observation with exact household composition, month, geography, unit and population; match the specific food decision. CAC `K-D046` = paired C05 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, the CAC Mini-Market served 2,995 households.”

**CAC fact reference:** `cac_service_facts` · service `mini_market` · fact `households_served_by_the_cac_mini_market` · year 2025 · `fact_id=ec44118c-3be1-46b1-9585-8f34d638bbd9`. [Pairing rationale](scenario-cac-fact-pairings.md#d046).

**Pairing scope:** Ingredients for work lunches connect to household food access. Context only; no workplace-lunch subsidy or new CAC choice.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D047 — A broken bag

**Type / category:** everyday / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Bag owned and needed; not a qualification.

**Situation:** “The bag you use for everyday travel breaks. You can replace it or pay for a repair.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D047-REPLACE | Buy the replacement bag | -$45.00 | bag_replaced | “You buy a replacement.” |
| D047-REPAIR | Repair the existing bag | -$15.00 | bag_repaired | “You choose the repair.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D047` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D047` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No fact establishes bag replacement/repair; the general clothing program is insufficient. [Gap review](scenario-cac-fact-pairings.md#d047).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No CAC coverage assumed for bags from a general clothing label..

## D048 — Meals for Maya

**Type / category:** everyday / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Approved program season and child meals not already in groceries.

**Situation:** “Maya needs meals during a Meals for Kids program period. You can buy prepared meals or ingredients to cook at home.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D048-MEALS | Buy the prepared meal allocation | -$42.00 | child_meals_prepared | “You pay for the prepared meals.” |
| D048-COOK | Buy ingredients and prepare the meals | -$24.00 | child_meals_home_prepared | “You spend less and commit preparation time.” |
| D048-CAC | Get meals for Maya through Meals for Kids | USD 0.00; free in-kind receipt; no cash credit | Record actual approved items received and assistance use | “You received meals for Maya through Meals for Kids.” |

**CAC mapping:** Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D048` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D048` = paired C16 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, Meals for Kids served 1,097 children.”

**CAC fact reference:** `cac_service_facts` · service `meals_for_kids` · fact `children_served_by_meals_for_kids` · year 2025 · `fact_id=9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01`. [Pairing rationale](scenario-cac-fact-pairings.md#d048).

**Pairing scope:** The scenario explicitly covers meals for a child during the program period. Existing conditional child-food pathway; no childcare payment inferred.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No childcare payments; eliminate overlap with the ordinary grocery basket..

## D049 — A fee to access your money

**Type / category:** everyday / Financial Literacy & Taxes. **Persona intent:** ALL. **Eligibility:** Approved fictional payment-access options; no new credit.

**Situation:** “You need to access your money. One option charges a fee; a slower option is free.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D049-FEE | Use the fee-charging access option | -$9.00 | payment_access_fee_paid | “You paid the fee to access your money sooner.” |
| D049-FREE | Use the free option | $0.00 | payment_access_free | “You avoid the fee and accept the slower process.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D049` = UNRESOLVED. Source an approved financial-resilience or tax-context observation. FINRA survey facts need year/question/coding/sample/denominator; a survey is not a price quote. CAC `K-D049` = paired C22 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, 218 students enrolled in Financial Literacy Classes.”

**CAC fact reference:** `cac_service_facts` · service `financial_literacy_classes` · fact `students_enrolled_in_financial_literacy_classes` · year 2025 · `fact_id=d32689c8-067a-4f59-aa48-2424384b7116`. [Pairing rationale](scenario-cac-fact-pairings.md#d049).

**Pairing scope:** Comparing a fee-charging money-access route with a free route is financial-literacy context. Context only; no claim that CAC pays fees or offers the payment instrument.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Exact payment instrument, timing and feasibility unresolved. Do not credit wages twice or move a locked paycheck..

## D050 — Running low on essentials

**Type / category:** everyday / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Approved item quantities and household size.

**Situation:** “You are running low on household hygiene supplies. Buying the larger pack costs more today, while the smaller pack leaves more cash available.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D050-LARGE | Buy the larger pack | -$32.00 | hygiene_large_pack | “You buy more supplies now.” |
| D050-SMALL | Buy the smaller pack | -$14.00 | hygiene_small_pack | “You keep more cash and buy fewer supplies.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D050` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D050` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No hygiene-supply assistance fact. [Gap review](scenario-cac-fact-pairings.md#d050).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No unverified CAC hygiene benefit or automatic repeat purchase..

## D051 — A chance to learn

**Type / category:** everyday / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** Approved non-CAC workshop, attendance feasible, no qualification effect.

**Situation:** “There is a skills workshop you would like to attend. The fee would leave less money for other needs.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D051-ATTEND | Pay for and attend the workshop | -$45.00 | optional_workshop_attended | “You paid the fee and attended the workshop.” |
| D051-DECLINE | Decline the workshop this month | $0.00 | optional_workshop_declined | “You keep the money and do not attend.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D051` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D051` = paired C24 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, CAC reported 610 total students in Adult Education programs.”

**CAC fact reference:** `cac_service_facts` · service `adult_education` · fact `total_students_in_adult_education_programs` · year 2025 · `fact_id=7cb64039-5726-43da-8f15-fbf8b63e8f83`. [Pairing rationale](scenario-cac-fact-pairings.md#d051).

**Pairing scope:** The card asks whether to invest money and time in optional learning. Context only; CAC does not fund the private workshop or grant a qualification in this draft.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Not the fixed CAC preparation; content value and fee need review..

## D052 — Maya's birthday

**Type / category:** everyday / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Fictional birthday occurs this month.

**Situation:** “Maya wants a birthday celebration. You can pay for the original plan or choose a smaller celebration at home.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D052-PLAN | Pay for the original plan | -$80.00 | child_birthday_original | “You spend the money on the original celebration.” |
| D052-HOME | Choose the smaller home celebration | -$20.00 | child_birthday_home | “You choose the less expensive celebration.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D052` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D052` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** Holiday-program facts do not establish birthday-party support. [Gap review](scenario-cac-fact-pairings.md#d052).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No happiness score or judgment about parenting..

## D053 — A holiday meal

**Type / category:** everyday / Food & Nutrition. **Persona intent:** ALL. **Eligibility:** Approved holiday season and distinct meal need.

**Situation:** “A holiday meal is approaching. You can buy the larger planned basket or a smaller one that costs less.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D053-FULL | Buy the planned holiday basket | -$85.00 | holiday_meal_full | “You purchase the planned meal ingredients.” |
| D053-SMALL | Choose the smaller holiday basket | -$38.00 | holiday_meal_small | “You spend less and prepare a smaller meal.” |
| D053-CAC | Get a holiday food basket through CAC | USD 0.00; free in-kind receipt; no cash credit | Record actual approved items received and assistance use | “You received a holiday food basket through CAC.” |

**CAC mapping:** Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D053` = UNRESOLVED. Source an approved food-budget/food-access observation with exact household composition, month, geography, unit and population; match the specific food decision. CAC `K-D053` = paired C06 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, 984 households received Holiday Food Baskets.”

**CAC fact reference:** `cac_service_facts` · service `holiday_food_baskets` · fact `households_who_received_holiday_food_baskets` · year 2025 · `fact_id=1eec83c9-41ca-4aef-be22-1e36289d9d95`. [Pairing rationale](scenario-cac-fact-pairings.md#d053).

**Pairing scope:** The need is a distinct seasonal holiday food basket. Existing conditional seasonal food pathway; no automatic current availability.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Seasonal availability and duplicate grocery coverage need approval..

## D054 — Clothes need replacing

**Type / category:** everyday / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Not the professional-clothing event.

**Situation:** “An everyday clothing item needs replacing. Buying it new costs more than buying it secondhand.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D054-NEW | Buy the new item | -$55.00 | everyday_clothing_new | “You buy the new item.” |
| D054-USED | Buy the secondhand item | -$20.00 | everyday_clothing_used | “You choose the lower-cost item.” |
| D054-CAC | Get clothing using credits from CAC Canopy Thrift | USD 0.00; free in-kind receipt; no cash credit | Record actual approved items received and assistance use | “You used CAC Canopy Thrift credits to get clothing.” |

**CAC mapping:** Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D054` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D054` = paired C15 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift.”

**CAC fact reference:** `cac_service_facts` · service `canopy_thrift` · fact `dollar_amount_of_client_credits_used_at_cac_canopy_thrift` · year 2025 · `fact_id=859b8cec-1e1c-4887-9f55-fd55f1bb349c`. [Pairing rationale](scenario-cac-fact-pairings.md#d054).

**Pairing scope:** The decision concerns replacement clothing and a lower-cost alternative. Existing conditional clothing pathway; no cash allocation or interview-state change.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Only one clothing effect; no interview outcome change or thrift-credit cash allocation..

## D055 — Someone asks for help

**Type / category:** everyday / Financial Literacy & Taxes. **Persona intent:** ALL. **Eligibility:** Fictional person and request approved; no real contact information.

**Situation:** “Someone you care about asks for help with an unexpected expense. Helping them leaves less for your own household.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D055-FULL | Give the requested help | -$60.00 | family_help_full | “You give the requested amount. It is not a loan or expected repayment.” |
| D055-SMALL | Give a smaller amount | -$20.00 | family_help_partial | “You help with a smaller contribution.” |
| D055-DECLINE | Explain that you cannot contribute money | $0.00 | family_help_declined | “You keep the money and decline the financial request.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D055` = UNRESOLVED. Source an approved financial-resilience or tax-context observation. FINRA survey facts need year/question/coding/sample/denominator; a survey is not a price quote. CAC `K-D055` = paired C22 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, 218 students enrolled in Financial Literacy Classes.”

**CAC fact reference:** `cac_service_facts` · service `financial_literacy_classes` · fact `students_enrolled_in_financial_literacy_classes` · year 2025 · `fact_id=d32689c8-067a-4f59-aa48-2424384b7116`. [Pairing rationale](scenario-cac-fact-pairings.md#d055).

**Pairing scope:** Balancing help for another person against one’s own budget is financial-literacy context. Context only; no CAC reimbursement, loan, or moral score.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D056 — A holiday gift for Maya

**Type / category:** everyday / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Approved holiday season and supported item.

**Situation:** “You are considering a holiday gift for Maya. The planned gift costs more than a modest alternative.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D056-PLANNED | Buy the planned gift | -$65.00 | holiday_gift_planned | “You buy the planned gift.” |
| D056-MODEST | Buy the modest alternative | -$18.00 | holiday_gift_modest | “You choose the less expensive gift.” |
| D056-DECLINE | Make no gift purchase this month | $0.00 | holiday_gift_not_purchased | “You did not buy a holiday gift this month.” |
| D056-CAC | Get a holiday gift for Maya through Hope for the Holidays | USD 0.00; free in-kind receipt; no cash credit | Record actual approved items received and assistance use | “You received a holiday gift for Maya through Hope for the Holidays.” |

**CAC mapping:** Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D056` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D056` = paired C19 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, Hope for the Holidays served 614 households.”

**CAC fact reference:** `cac_service_facts` · service `hope_for_the_holidays` · fact `households_served_by_hope_for_the_holidays` · year 2025 · `fact_id=18b975be-96cb-49ec-901b-ccd04c6c6a5c`. [Pairing rationale](scenario-cac-fact-pairings.md#d056).

**Pairing scope:** The card explicitly concerns the named holiday program and a child’s holiday gift. Existing conditional holiday pathway; approved items and eligibility remain necessary.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Program-supported items and eligibility must be confirmed; no cash benefit..

## D057 — A pass or a few fares?

**Type / category:** everyday / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** Transit use and valid fare products approved.

**Situation:** “You need to get around. A transit pass costs more upfront than buying fares for the trips you need right now.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D057-PASS | Buy the pass | -$50.00 | transit_pass_owned | “You bought the transit pass.” |
| D057-FARES | Buy only the immediate fares | -$12.00 | immediate_fares_purchased | “You keep more cash now without pass coverage for later travel.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D057` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D057` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No general bus-pass/fare fact; workforce-specific transportation cannot be generalized to all personas. [Gap review](scenario-cac-fact-pairings.md#d057).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Pass duration, trip coverage and route needs must be configured; no automatic savings invented..

## D058 — Laundry supplies are running low

**Type / category:** everyday / Essential Goods & Clothing. **Persona intent:** SOFIA. **Eligibility:** Two-person household; not already included in hygiene basket.

**Situation:** “You and your spouse need laundry supplies. A larger purchase costs more today; buying only the immediate amount keeps cash available.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D058-LARGE | Buy the larger quantity | -$28.00 | laundry_supplies_large | “You bought the larger quantity of laundry supplies.” |
| D058-SMALL | Buy the immediate amount | -$12.00 | laundry_supplies_small | “You buy less and keep more cash.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D058` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D058` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**CAC fact gap:** No laundry-detergent/supply assistance fact. [Gap review](scenario-cac-fact-pairings.md#d058).

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No inferred spouse contribution or duplicate hygiene charge..

## D059 — Time with a friend

**Type / category:** everyday / Financial Literacy & Taxes. **Persona intent:** ALL. **Eligibility:** Optional fictional outing; no wellbeing scoring.

**Situation:** “You have an opportunity to spend time with a friend. The planned outing costs money; an agreed free alternative is available.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D059-OUT | Pay for the planned outing | -$25.00 | social_outing_paid | “You choose the paid outing and its cost.” |
| D059-FREE | Choose the free alternative together | $0.00 | social_outing_free | “You keep the money and choose the free plan.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D059` = UNRESOLVED. Source an approved financial-resilience or tax-context observation. FINRA survey facts need year/question/coding/sample/denominator; a survey is not a price quote. CAC `K-D059` = paired C22 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, 218 students enrolled in Financial Literacy Classes.”

**CAC fact reference:** `cac_service_facts` · service `financial_literacy_classes` · fact `students_enrolled_in_financial_literacy_classes` · year 2025 · `fact_id=d32689c8-067a-4f59-aa48-2424384b7116`. [Pairing rationale](scenario-cac-fact-pairings.md#d059).

**Pairing scope:** Choosing between a paid outing and a free alternative is a discretionary-budget tradeoff. Context only; no claim of CAC leisure funding or a judgment about spending.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Do not frame all discretionary spending as irresponsible or award a virtue score..

## D060 — The groceries are running low

**Type / category:** everyday / Food & Nutrition. **Persona intent:** ALL. **Eligibility:** Distinct final grocery need; previous purchases reconciled.

**Situation:** “There are still days left in the month, and the household needs food. A full restock costs more than the smaller basket.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D060-FULL | Buy the full restock | -$90.00 | late_food_full | “You purchase the full restock.” |
| D060-SMALL | Buy the smaller restock | -$45.00 | late_food_partial | “You buy less food and preserve more cash.” |
| D060-CAC | Get groceries from the CAC Mini-Market | USD 0.00; free in-kind receipt; no cash credit | Record actual approved items received and assistance use | “You received groceries from the CAC Mini-Market.” |

**CAC mapping:** Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D060` = UNRESOLVED. Source an approved food-budget/food-access observation with exact household composition, month, geography, unit and population; match the specific food decision. CAC `K-D060` = paired C26 for review; source identity and proposed display text are below. Exactly these two roles; missing facts block publication.

**CAC fact text:** “In 2025, the CAC Mini-Market served 7,034 individuals.”

**CAC fact reference:** `cac_service_facts` · service `mini_market` · fact `individuals_served_by_the_cac_mini_market` · year 2025 · `fact_id=0a3f963a-b2c5-47d6-8b9d-e0d396da6a66`. [Pairing rationale](scenario-cac-fact-pairings.md#d060).

**Pairing scope:** The scenario is a distinct late-month household food need. Existing conditional food pathway; no personal allocation or duplicate grocery coverage.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## Illustrative route and difficulty review

The 60 cards are alternatives. Draft amounts and one sample route are insufficient evidence that difficulty is balanced. Use approved starting balances, jobs/wages and household expenses to evaluate routes in both modes before publication. The aim is sustained pressure from competing needs and a few large shocks, without forcing every household through all 15 shocks or making survival mathematically impossible on every path. No completion-rate target is approved.

The following is an **unapproved editorial route for Jordan**, assuming the necessary car, household-service, school, care and seasonal predicates have been explicitly approved. It demonstrates day separation and category coverage only; it is not a validated or ready-to-publish schedule. Replace ineligible events rather than assume the predicates. No rule makes these scenarios appear in live play today.

| Day | Draft | Routing note |
| --- | --- | --- |
| Pre-game | D001 | Target/preparation; no paycheck |
| 1 | D036 | Groceries |
| 2 | D002 → conditional D003 | Existing interview/result/reapplication exception; no unrelated event |
| 3 | D004 if first interview failed; otherwise D038 | Follow-up interview owns this day when needed |
| 4 | D007 | Electricity bill; approved due date must match |
| 5 | D039 | School trip |
| 6 | D037 | Work travel if hired |
| 7 | D009 | Phone bill |
| 8 | D041 | Dinner |
| 9 | D021 | Car shock; approved car ownership and feasible MARTA trips required |
| 10 | D038; substitute D040 if D038 used on Day 3 | No repeated scenario |
| 11 | D013 | Childcare invoice |
| 12 | D042 | School supplies |
| 13 | D043 | Birthday gift |
| 14 | D006 | Rent; replaces D019 variant |
| 15 | D045 | Child coat only if season appropriate |
| 16 | D022 | Dental shock; alternatives require review |
| 17 | D046 | Work lunches |
| 18 | D005 | Single tax decision |
| 19 | D049 | Payment-access tradeoff if applicable |
| 20 | D050 | Hygiene supplies |
| 21 | D025 | Childcare shock; no duplicate care period |
| 22 | D052 | Child birthday only if appropriate |
| 23 | D048 | Meals for Kids period must apply |
| 24 | D012 | Medical invoice, not a duplicate of dental treatment |
| 25 | D054 | Everyday clothing |
| 26 | D055 | Request from someone close |
| 27 | D057 | Transit pass; reconcile earlier travel coverage |
| 28 | D060 | Food restock |
| 29 | D059 | Social tradeoff |
| 30 | D010 | Internet bill; may remain unpaid at completion |

Automatic wages are not extra scenarios: Day 2 hires pay on 9/16/23/30; Day 3 hires on 10/17/24. On payday credit once before the day’s event. The sidebar Pay action can settle debt without replacing the event. No ordinary scenario shares an actual interview day. On Day 30, resolve the scenario and show its recap, then the end screen with any remaining unpaid obligations.

**Difficulty validation to perform after content approval:** calculate cash and unpaid debt separately for several complete choice paths, across jobs/personas/modes; compare paying versus ignoring obligations; verify feasible cheaper paths, high-cost shock exposure, food/care/transport needs left unmet, and tax affordability before refund. Do not infer difficulty from high prices alone. No such gameplay calculation has been validated in this writing task.

## CAC fact registry verified against the database

Source: `public.cac_service_facts` joined to `public.cac_services`, project `uucneyuspeqpygiucfvr`; retrieved November 6, 2026. The [snapshot](data/cac-service-facts-2025.json) retains all 66 records and exact decimal text for reproducible review. Every selected reference resolves to an existing record. Geography remains CAC’s reported service population; no exact geographic boundary is asserted.

C01–C23 retain their earlier document aliases where possible; C24–C26 extend the registry. The original CSV-derived registry is preserved in Git history, not used as a second live source. Current database keys are copied as stored even when a later title edit differs from the key. No retired outcome-table identifiers are used. Future-year changes require choosing and reviewing a new source record before publishing a new edition; this snapshot is not a live data fetch.

The client has confirmed the Coats for Kids figures are actual outcomes and the holiday in-kind unit is Dollars. Financial Assistance and Empowerment Center are now separate confirmed service records. Those clarifications do not create new assistance eligibility or cost rules.

| Alias | Service / fact key | Fact ID | Year | Exact value / unit | Proposed CAC fact text | Interpretation limit |
|---|---|---|---|---|---|---|
| C01 | `eviction_prevention` / `evictions_prevented` | `5fa2bac7-6016-4db8-b705-fc593f6b75ec` | 2025 | `1108` / Number | In 2025, CAC reported preventing evictions for 1,108 households. | Households; not an individual approval probability. |
| C02 | `financial_assistance` / `amount_paid_through_financial_assistance` | `b697ae84-1fd2-4bae-83da-7a10c983ac24` | 2025 | `796416.64` / Dollars | In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness. | Aggregate spending; not an individual allowance or proof of utility coverage. |
| C03 | `workforce_development` / `rent_assistance_through_workforce_development` | `8c32e385-bc00-44c0-a60f-fa09b6016e66` | 2025 | `4` / Number | The 2025 Workforce Development facts list 4 for rent assistance. | The counting unit is Number; do not infer four households or a dollar amount. |
| C04 | `mini_market` / `visits_to_the_cac_mini_market` | `94210a01-4766-46ad-beba-d7400c9fd31e` | 2025 | `36521` / Number | In 2025, there were 36,521 visits to the CAC Mini-Market. | Visits, not unique clients or a household visit entitlement. |
| C05 | `mini_market` / `households_served_by_the_cac_mini_market` | `ec44118c-3be1-46b1-9585-8f34d638bbd9` | 2025 | `2995` / Number | In 2025, the CAC Mini-Market served 2,995 households. | Annual households; do not add overlapping populations or infer a food allocation. |
| C06 | `holiday_food_baskets` / `households_who_received_holiday_food_baskets` | `1eec83c9-41ca-4aef-be22-1e36289d9d95` | 2025 | `984` / Number | In 2025, 984 households received Holiday Food Baskets. | Seasonal program context; current availability and eligibility remain separate. |
| C07 | `career_services` / `people_helped_by_career_services` | `db12c137-fad7-4277-b4ca-6a203b344e38` | 2025 | `229` / Number | In 2025, Career Services helped 229 people. | People helped; not a placement rate or a guarantee that an applicant gets a job. |
| C08 | `career_services` / `job_placements` | `2675ebbd-e014-4506-a0fd-1130a9ffe692` | 2025 | `80` / Number | In 2025, CAC reported 80 job placements. | Annual placements; not the probability of passing an interview. |
| C09 | `esol` / `students_enrolled_in_esol_classes` | `2baa9c38-09b0-476d-9d02-5015a37443e5` | 2025 | `521` / Number | In 2025, 521 students enrolled in ESOL classes. | Students; not a course-completion count or employment guarantee. |
| C10 | `computer_classes` / `students_in_computer_classes` | `1431705b-90b7-4a17-87d6-3c6fbdad30e5` | 2025 | `42` / Number | In 2025, CAC reported 42 students in Computer Classes. | Classes, not laptop repair, replacement or a credential guarantee. |
| C11 | `workforce_development` / `thrive_participants_in_workforce_development` | `730b31fa-554a-4d51-8ae7-eae50126ceaa` | 2025 | `9` / Number | In 2025, CAC reported 9 Thrive participants in Workforce Development. | Workforce-program population; not universal assistance. |
| C12 | `workforce_development` / `tcc_scholarships_through_workforce_development` | `0077c68e-1c89-43b8-835c-4e90348a8b6d` | 2025 | `4` / Number | The 2025 Workforce Development facts list 4 for TCC/scholarships. | TCC meaning, counting population and eligibility require clarification. |
| C13 | `workforce_development` / `transportation_through_workforce_development` | `5ff54cca-96b1-4638-b1a2-18b473b93329` | 2025 | `1` / Number | The 2025 Workforce Development facts list 1 for transportation. | Source unit is Number; do not call this one person, pass, ride or dollar. Workforce scope only. |
| C14 | `canopy_thrift` / `households_served_by_cac_canopy_thrift` | `5d6bc795-8a41-49ca-862f-9aaf73405b49` | 2025 | `2152` / Number | In 2025, CAC Canopy Thrift served 2,152 households. | Clothing-program context; specific item coverage and availability require approval. |
| C15 | `canopy_thrift` / `dollar_amount_of_client_credits_used_at_cac_canopy_thrift` | `859b8cec-1e1c-4887-9f55-fd55f1bb349c` | 2025 | `206768.67` / Dollars | In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift. | Aggregate credits; not an individual credit balance or cash allowance. |
| C16 | `meals_for_kids` / `children_served_by_meals_for_kids` | `9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01` | 2025 | `1097` / Number | In 2025, Meals for Kids served 1,097 children. | Food-program context; not daycare or school-account bill payment. |
| C17 | `tools_for_school` / `children_served_by_tools_for_school` | `c6a72bf1-47ac-4d53-9adc-8ad68dd120c4` | 2025 | `1090` / Number | In 2025, Tools for School served 1,090 children. | School-supply context; not trip fees or a per-child allowance. |
| C18 | `coats_for_kids` / `children_served_by_coats_for_kids` | `e8473e58-6338-4855-93be-7608f27696ab` | 2025 | `623` / Number | In 2025, Coats for Kids served 623 children. | The client confirmed these are actual outcomes despite the original goal heading. Seasonal eligibility remains separate. |
| C19 | `hope_for_the_holidays` / `households_served_by_hope_for_the_holidays` | `18b975be-96cb-49ec-901b-ccd04c6c6a5c` | 2025 | `614` / Number | In 2025, Hope for the Holidays served 614 households. | Holiday-program context; no birthday benefit or cash gift allowance inferred. |
| C20 | `teachers_closet` / `requests_for_the_teachers_closet_program` | `e4b80614-48ce-475e-a4c1-d49c74c86fec` | 2025 | `222` / Number | In 2025, CAC reported 222 requests for the Teacher’s Closet program. | Requests, not household recipients; no teacher persona is specified in this library. |
| C21 | `vita` / `tax_returns_through_the_vita_program` | `5b9132c2-90d6-4dea-9dc0-f2de13a89e2f` | 2025 | `503` / Number | In 2025, CAC reported 503 tax returns through the VITA program. | Keep distinct from the separate 590 federal returns prepared; no individual refund promise. |
| C22 | `financial_literacy_classes` / `students_enrolled_in_financial_literacy_classes` | `d32689c8-067a-4f59-aa48-2424384b7116` | 2025 | `218` / Number | In 2025, 218 students enrolled in Financial Literacy Classes. | Education context only; no evidence of debt repayment, bank-fee coverage or measured savings. |
| C23 | `vita` / `federal_refunds_through_the_vita_program` | `7f25dabd-f5a5-4a54-9201-fd5f3ccd173d` | 2025 | `582083` / Dollars | In 2025, CAC reported $582,083 in federal refunds through the VITA program. | Aggregate refunds; does not set the exercise’s fixed refund or a household entitlement. |
| C24 | `adult_education` / `total_students_in_adult_education_programs` | `7cb64039-5726-43da-8f15-fbf8b63e8f83` | 2025 | `610` / Number | In 2025, CAC reported 610 total students in Adult Education programs. | Do not sum overlapping course enrollments or infer completion, skill gains or employment. |
| C25 | `mini_market` / `pounds_of_food_available_from_the_cac_mini_market` | `efaf231b-3db3-4c4d-b276-758006af8aab` | 2025 | `1160328` / Pounds | In 2025, the CAC Mini-Market reported 1,160,328 pounds of food available. | Food available, not food actually distributed, replacement value or appliance repair. |
| C26 | `mini_market` / `individuals_served_by_the_cac_mini_market` | `0a3f963a-b2c5-47d6-8b9d-e0d396da6a66` | 2025 | `7034` / Number | In 2025, the CAC Mini-Market served 7,034 individuals. | Annual individuals; not a household allocation, meal count or combined-program total. |

## Service coverage and fact-policy gaps

30 scenarios have proposed pairings and 30 have no sufficiently relevant fact; each decision is explained in the [pairing review](scenario-cac-fact-pairings.md). Some cards without a CAC option now carry housing-stability, food-access, learning, or financial-literacy context. Context-only pairings preserve existing choices and support scope. The separately approved utility support update adds conditional CAC choices to D007, D008, D010 and D018. A relevant annual statistic is educational context, not proof that CAC pays that scenario’s particular expense.

Do not force health, vehicle repair, phones, furniture, daycare, laundry, birthday gifts, or other facts from unrelated services. The user confirmed that CAC eviction prevention helps pay rent and utilities. D007, D008, D010 and D018 therefore include conditional CAC bill-support choices, with coverage amounts and household bindings pending. Their annual eviction-prevention or financial-assistance facts do not determine individual benefit amounts. Do not generalize the Workforce Development transportation measure to every employed/transit-using persona. Unspecified household/work purchases need item definitions before a program match. Broader budget/learning context on D011, D017, D049, D051, D055 and D059 is explicitly identified for editorial review.

Teacher’s Closet audience, TCC meaning and workforce counting units still need clarification for any future scenario designed around them. Coats for Kids goal-versus-actual and Hope for the Holidays in-kind units are resolved by the client and current facts. Empowerment Center event participants and CAC General totals are available in the snapshot, but are not substituted for topic-specific evidence. No service is forced into the library just to claim coverage.

The requirement for exactly one relevant CAC fact plus one general fact remains unchanged. All 60 general fact slots remain unsourced. The 30 unmatched CAC slots remain publication blockers until suitable facts or a separately approved policy revision exist. Pairing existing CAC records does not publish this draft library or approve its illustrative prices.

## Database handoff

| Draft field | Intended mapping | Resolution required |
| --- | --- | --- |
| D-key, title, situation, category, timing | `scenarios` | Real stable logical ID, edition, category, scheduled occurrence or eligible route day |
| Persona intent and eligibility | `scenario_personas`, `persona_categories` | Actual edition-scoped IDs and validated circumstances |
| Choice key, label, result | `choices` | Actual choice ID, parent scenario and edition; every displayed choice is submittable |
| Proposed costs and outcomes | Choice/expense bindings and structured transition definitions | Approved exact money, supported state, affordability checks, no executable narrative |
| CAC option when present | `cac_support_effects`, service coverage | One capped effect at most; confirmed service/item/household eligibility; real service ID |
| Fact slots | Proposed CAC source: `cac_service_facts`; edition linkage: `statistics`, `scenario_statistics` | Use the referenced real fact record as source; resolve actual scenario/edition IDs and exactly one approved general/CAC role. No database link was created by this documentation edit. |
| Ignored bill | Run-specific bill occurrence plus liability/fee tracking | Original principal, outstanding principal, fee components, paid status, version, source response and idempotency; exact schema still to be designed |
| Sidebar Pay | Separate protected settlement operation/history | Caller ownership, active run, owned outstanding bill, current total, affordability, atomic payment and debt settlement; never replace the original scenario answer |
| Deferred effects / needs | Run-specific circumstance definitions | Approve mechanics and route predicates before implementation; no extra charge inferred from prose |
| Draft review | Pending content/review records | Staff approvals and provenance; do not invent model API calls, generation request records or attempt counts for this offline authoring task |

For each unresolved field, retain a pending marker instead of a fake ID or numeric zero. Freeze approved contents by edition, pin runs to their starting version, and keep pending edits out of gameplay. Restore ignored balances, fee components and paid history without replaying transactions. Replays start new runs and retain the old summary/history.

## Remaining decisions and verification

Approved mechanics are recorded in the corresponding specifications; they are not implemented by this document. Before publication, approve all new amount assumptions, late-fee timing/repetition, whether partial settlement is supported, applicable billed obligations/provider terms, future-consequence text, new state transitions, general/CAC facts, and compatible routes with no day collisions. Keep the two approved fixed money rules and original Day 2 sequence intact.

Editorial checks cover 60 sequential unique entries, the 5/15/15/25 type mix, choice rows and required fields, no review-only answers, arithmetic in unpaid examples, selective CAC options, preserved source references, and fixed-flow markers. They do not demonstrate actual simulation, security enforcement, market/legal accuracy, route solvability or balanced difficulty. Frontend tests/builds are outside this content-only update.
