# CAC Poverty Exercise — 60 scenario drafts, revised

**November 2, 2026 · Content and specification handoff · Pending staff review.** This revision replaces the earlier service-centered draft library. No application, database or financial engine has been changed.

## Branch handoff: employment prerequisites

This content branch is based on main and excludes the earlier job-selection implementation commits. The fixed-flow drafts retain the source branch's approved English/computer skill model, different-eligible-job reapplication rule, and USD 60.00 clothing assumption. Main's existing employment specifications may still describe an older qualification/fallback model. Reconcile those prerequisite content decisions before database mapping or publication; this branch does not port the earlier implementation or claim the employment specifications are fully synchronized. Day 2 interview/result/immediate reapplication timing remains unchanged.

## Approved direction and unresolved details

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
- Every scenario has exactly one general fact slot and one CAC fact slot, as the unchanged publication rule requires. All general facts remain UNRESOLVED; a topic sourcing brief appears per card. Where a relevant CAC observation is available, its slot references the registry. A scenario with no relevant CAC observation keeps that slot UNRESOLVED; do not force an unrelated CAC service onto it or imply CAC can cover the expense. Fact-policy exceptions have not been approved. This is an explicit publication blocker for unsupported topics.
- No CAC option is offered unless listed on that card and mode, actual service/item eligibility, availability and edition mapping validate. Cards without CAC support stay without it in both modes. A financial effect is capped at eligible expense remaining; no cash from in-kind coverage, no stacking. CAC impact facts do not mean support was available or used.
- Selection alone changes nothing. Protected submission atomically records the selected answer, authorized effects and actual assistance use; retries/refresh never repeat charges, fees, wages, refunds or choices. Show success only after commitment. Expensive unselected alternatives do not end play. The existing rule that an attempted unaffordable paid option ends the run remains unchanged; bill Ignore offers the separate approved no-cash continuation path. An unsuccessful sidebar Pay must never erase debt or record payment; existing unaffordable-attempt ending behavior still applies unless separately changed by the team.
- Deferral creates debt only on bill cards. “Wait,” “decline” or “buy less” on ordinary cards leaves the stated need unmet; it does not fabricate a bill or late fee. No loan, negative-balance permission, score, automatic illness, eviction, job loss or additional charge is implied. Any proposed future mechanic must be approved and explicitly implemented.
- Each ordinary choice resolves the card and shows its result. Subsequent route selection follows eligibility and circumstance state; unmet needs in result text do not automatically trigger another event. All new state dependencies, wage changes and delayed costs below are review blockers until the team defines them. Results are respectful, without a correct-parent or responsible-person score.
- Money uses USD and signed exact decimal/integer-cent calculations; round final values once with half-cent ties away from zero. Each amount needs its own edition-scoped binding: target, approved assumption or source observation, units/period/geography, quantity/formula and resolved cents. Annual CAC totals never determine individual purchase or assistance values.
- A bill’s principal, fee and total owed are liabilities, not a deduction from available cash until paid. Display current cash separately from unpaid debt. The end screen must not call a positive cash balance “debt free.” End-of-month future consequences are conditional educational text, not legal predictions or additional simulated deductions.

## Review index

| Key | Type | Category | Title | Persona intent | CAC choice |
| --- | --- | --- | --- | --- | --- |
| D001 | fixed | Employment & Adult Education | Choose a target job before Day 1 | ALL | Conditional |
| D002 | fixed | Employment & Adult Education | The first interview | ALL | Conditional |
| D003 | fixed | Employment & Adult Education | Reapply after the first interview | ALL | None |
| D004 | fixed | Employment & Adult Education | The follow-up interview | ALL | Conditional |
| D005 | fixed | Financial Literacy & Taxes | File the simulated tax return | ALL | Conditional |
| D006 | bill | Housing & Utilities | Rent before payday | ALL | Conditional |
| D007 | bill | Housing & Utilities | Electricity payment | ALL | None |
| D008 | bill | Housing & Utilities | Water and sewer bill | ALL | None |
| D009 | bill | Essential Goods & Clothing | Phone service renewal | ALL | None |
| D010 | bill | Housing & Utilities | Home internet bill | ALL | None |
| D011 | bill | Financial Literacy & Taxes | Car insurance installment | CAR | None |
| D012 | bill | Essential Goods & Clothing | A previous clinic invoice | ALL | None |
| D013 | bill | Childcare & Youth | Childcare invoice | JORDAN | None |
| D014 | bill | Childcare & Youth | School meal account | JORDAN | None |
| D015 | bill | Essential Goods & Clothing | An earlier repair invoice | CAR | None |
| D016 | bill | Essential Goods & Clothing | Prescription account invoice | ALL | None |
| D017 | bill | Financial Literacy & Taxes | An existing repayment installment | ALL | None |
| D018 | bill | Housing & Utilities | Household gas bill | ALL | None |
| D019 | bill | Housing & Utilities | Rent while rebuilding a buffer | ALL | Conditional |
| D020 | bill | Essential Goods & Clothing | A remaining approved medical bill | ALL | None |
| D021 | shock | Essential Goods & Clothing | The car will not start | CAR | None |
| D022 | shock | Essential Goods & Clothing | Urgent dental expense | ALL | None |
| D023 | shock | Essential Goods & Clothing | The phone breaks | ALL | None |
| D024 | shock | Essential Goods & Clothing | A family emergency out of town | ALL | None |
| D025 | shock | Childcare & Youth | Childcare falls through | JORDAN | None |
| D026 | shock | Essential Goods & Clothing | Four tires need replacement | CAR | None |
| D027 | shock | Essential Goods & Clothing | Replacing broken glasses | ALL | None |
| D028 | shock | Housing & Utilities | A plumbing expense you are responsible for | ALL | None |
| D029 | shock | Childcare & Youth | A child’s unexpected care expense | JORDAN | None |
| D030 | shock | Essential Goods & Clothing | The laptop stops working | ALL | None |
| D031 | shock | Essential Goods & Clothing | A towing expense | CAR | None |
| D032 | shock | Housing & Utilities | Your share of household costs increases | SOFIA | None |
| D033 | shock | Essential Goods & Clothing | A required work item is damaged | EMPLOYED | None |
| D034 | shock | Essential Goods & Clothing | A damaged bed needs replacing | ALL | None |
| D035 | shock | Food & Nutrition | A refrigerator failure spoils your groceries | ALL | Conditional |
| D036 | everyday | Food & Nutrition | Groceries or a smaller basket | ALL | Conditional |
| D037 | everyday | Employment & Adult Education | Getting to work after a canceled ride | EMPLOYED | None |
| D038 | everyday | Essential Goods & Clothing | Laundry before the workweek | ALL | None |
| D039 | everyday | Childcare & Youth | A school trip for Maya | JORDAN | None |
| D040 | everyday | Essential Goods & Clothing | Worn shoes | ALL | Conditional |
| D041 | everyday | Food & Nutrition | Dinner after a long day | ALL | None |
| D042 | everyday | Childcare & Youth | School supplies for Maya | JORDAN | Conditional |
| D043 | everyday | Essential Goods & Clothing | A family birthday | ALL | None |
| D044 | everyday | Employment & Adult Education | A workforce-program travel cost | WORKFORCE | Conditional |
| D045 | everyday | Childcare & Youth | A warm coat for Maya | JORDAN | Conditional |
| D046 | everyday | Food & Nutrition | Lunches for the next work stretch | EMPLOYED | None |
| D047 | everyday | Essential Goods & Clothing | A broken bag | ALL | None |
| D048 | everyday | Childcare & Youth | Meals for Maya during a program period | JORDAN | Conditional |
| D049 | everyday | Financial Literacy & Taxes | Paying to access your own money | ALL | None |
| D050 | everyday | Essential Goods & Clothing | A household hygiene purchase | ALL | None |
| D051 | everyday | Employment & Adult Education | An optional skills workshop | ALL | None |
| D052 | everyday | Childcare & Youth | A birthday plan for Maya | JORDAN | None |
| D053 | everyday | Food & Nutrition | A holiday meal | ALL | Conditional |
| D054 | everyday | Essential Goods & Clothing | Replacing an everyday outfit | ALL | Conditional |
| D055 | everyday | Financial Literacy & Taxes | Helping someone else while money is tight | ALL | None |
| D056 | everyday | Childcare & Youth | Hope for the Holidays | JORDAN | Conditional |
| D057 | everyday | Employment & Adult Education | A bus pass or individual fares | ALL | None |
| D058 | everyday | Essential Goods & Clothing | Laundry supplies for the household | SOFIA | None |
| D059 | everyday | Financial Literacy & Taxes | A low-cost break from the month | ALL | None |
| D060 | everyday | Food & Nutrition | Restocking food late in the month | ALL | Conditional |

## D001 — Choose a target job before Day 1

**Type / category:** fixed / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** Pre-game; household confirmed; starting skills configured.

**Situation:** “You need work, but your first paycheck will not arrive on the day you are hired. Choose a job from the postings you currently qualify for. In CAC mode, you can choose the specified preparation before selecting your target.”

**Timing:** pre-game; `non_scheduled`; numeric pre-game day unresolved.

| Key | Submitted choice | Money / state | Result |
| --- | --- | --- | --- |
| TARGET | Choose [currently eligible approved job] | No immediate pay; record target job | “You selected this job. Your weekly pay begins seven days after hiring.” |
| PREP_TARGET | Complete CAC preparation and choose [resulting eligible job] | CAC only; set both run skill flags and preparation-completed state; record target job | “You completed the exercise’s preparation and selected your target.” |

These are complete submitted pathways, not a reading action. Exact UI substeps remain an integration detail. Preparation financial treatment is UNRESOLVED; do not invent a fee or credit. Skills are English/computer only: Alex and Jordan start with English only, Patricia with neither, Sofia with computer only. No experience gate; at least two jobs require neither skill. Approved wages/IDs remain unresolved and are displayed from the edition, never from generated values. Preparation does not hire or promise real-world success.


**Facts:** general `G-D001` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D001` = candidate C07 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approved job/fee/service bindings and fixed-flow validation.

## D002 — The first interview

**Type / category:** fixed / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** Fixed Day 2; target job selected.

**Situation:** “Your interview is today. You can spend some of your limited money on professional clothes, use your current clothes, or use eligible CAC clothing. The first-interview outcome follows the exercise’s preparation-and-clothing rule.”

**Timing:** fixed Day 2; `scheduled`; `default_day=2`.

| Key | Submitted choice | Money / state | Result |
| --- | --- | --- | --- |
| BUY | Buy professional clothes | Approved USD -60.00; own professional clothes | “You bought the professional clothes. [Actual interview outcome follows.]” |
| CURRENT | Make my current clothes work | USD 0.00; do not create professional-clothing ownership | “You use your current clothes. This first interview does not lead to a job in the scripted exercise.” |
| CAC | Use eligible CAC professional clothes | CAC only; approved scripted in-kind clothing pathway, USD 0.00 net; own professional clothes | “You received professional clothes through the exercise’s CAC pathway. [Actual interview outcome follows.]” |

**Approved transition:** specified CAC preparation completed + BUY/CAC → hire selected job on Day 2. Any choice without that preparation fails; CURRENT fails even with preparation. First pay for a Day 2 hire is Day 9, then 16/23/30. Failed interview → show its result, then D003 immediately on Day 2, exactly as before. Preserve acquired clothes after failure. The USD 60.00 expense is covered in kind on CAC, not deposited as cash. An unaffordable BUY ends before purchase/hiring.


**Facts:** general `G-D002` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D002` = candidate C08 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approved job/fee/service bindings and fixed-flow validation.

## D003 — Reapply after the first interview

**Type / category:** fixed / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** Fixed Day 2 immediately after a failed interview and its result.

**Situation:** “The first interview did not lead to a job. Before leaving Day 2, choose another eligible job. The next interview will be tomorrow.”

**Timing:** fixed Day 2 immediately after failed D002 and its result; `scheduled`; `default_day=2`. This is the approved exception to one scenario event per day.

| Key | Submitted choice | Money / state | Result |
| --- | --- | --- | --- |
| OTHER_JOB | Apply for [different currently eligible job] | USD 0.00; record new target, preserve preparation/clothing | “You applied for the different job. Your follow-up interview is on Day 3.” |

Expand to every other currently eligible job, excluding the first target, with no fallback tier or wage-rank gate. If no different eligible job exists, this is a catalog gap that blocks the route, not permission to fabricate a job. After the committed reapplication and recap, Continue advances to Day 3. No unrelated Day 2 event, immediate hiring or early paycheck.


**Facts:** general `G-D003` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D003` = candidate C07 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approved job/fee/service bindings and fixed-flow validation.

## D004 — The follow-up interview

**Type / category:** fixed / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** Fixed Day 3 only after failed Day 2 and a different target selected.

**Situation:** “You have another interview. If you already acquired professional clothes, wear them without buying them again. This follow-up awards the different selected job after any available clothing choice.”

**Timing:** conditional fixed Day 3; `scheduled`; `default_day=3`. No unrelated scenario shares this interview day.

| Key | Submitted choice | Money / state | Result |
| --- | --- | --- | --- |
| REUSE | Wear my professional clothes | Only choice if already owned; USD 0.00 | “You reuse your professional clothes and obtain the different job in this exercise.” |
| BUY | Buy professional clothes | Only if not owned; approved USD -60.00; set ownership | “You buy the clothes and obtain the different job.” |
| CURRENT | Make my current clothes work | Only if not owned; USD 0.00 | “You obtain the different job in this follow-up, as specified by the exercise.” |
| CAC | Use eligible CAC professional clothes | Only if not owned, CAC mode and eligible; USD 0.00 net; set ownership | “You receive professional clothes and obtain the different job.” |

Any available valid submitted choice hires the different job on Day 3, regardless of preparation. First pay Day 10, then 17/24. Do not repeat the Day 2 success gate. An unaffordable BUY ends before purchase/hiring. If hired on Day 2, omit this event and select an eligible ordinary Day 3 scenario instead.


**Facts:** general `G-D004` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D004` = candidate C08 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approved job/fee/service bindings and fixed-flow validation.

## D005 — File the simulated tax return

**Type / category:** fixed / Financial Literacy & Taxes. **Persona intent:** ALL. **Eligibility:** Non-scheduled; proposed Day 18; not previously filed.

**Situation:** “You can try filing yourself, pay a preparer, or use eligible CAC tax preparation. In this exercise, the paid and CAC routes produce a fixed $1,000 refund. You must afford the paid fee before receiving that refund.”

**Timing:** `non_scheduled`; proposed Day 18. Only one tax filing per run.

| Key | Submitted choice | Money / state | Result |
| --- | --- | --- | --- |
| TRY | Try my best | Approved USD 0.00; no refund/deduction | “In this exercise, this choice produces no refund and no deduction.” |
| PAID | Pay someone to prepare taxes | UNRESOLVED approved fee F; require balance ≥ F before charging -F and immediately crediting approved +$1,000.00 once | “You paid the preparation fee and received the exercise’s fixed $1,000 refund.” |
| CAC | Get eligible CAC tax assistance | CAC only; no player-paid fee; approved +$1,000.00 once | “You used the exercise’s free preparation pathway and received its fixed $1,000 refund.” |

Fee and refund remain separate components, even if their net is stored on the response. The refund cannot fund the prerequisite fee. An unaffordable PAID attempt ends before fee/refund consequences. Filing is not an unpaid bill and cannot be moved to the sidebar. The refund is an explicit simulation credit, not a CAC annual average or guaranteed real refund. Fee, VITA eligibility and binding IDs remain unresolved.


**Facts:** general `G-D005` = UNRESOLVED. Source an approved financial-resilience or tax-context observation. FINRA survey facts need year/question/coding/sample/denominator; a survey is not a price quote. CAC `K-D005` = candidate C21 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approved job/fee/service bindings and fixed-flow validation.

## D006 — Rent before payday

**Type / category:** bill / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “An approved rent obligation is due before your next paycheck. Paying protects this part of your budget from late fees, but leaves less cash for everything else.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D006-PAY | Pay the bill | -$650.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D006-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |
| D006-CAC | Use eligible CAC rent assistance | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C01; candidate eligible expense is the $650.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Unpaid-sidebar proposal:** Ignore records principal $650.00 + proposed late fee $35.00 = **$685.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “Carrying rent debt into another month could put housing stability at risk. The simulation does not schedule an eviction or state a legal deadline.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D006` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D006` = candidate C01 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Rent; adjust share and amount for each persona..

## D007 — Electricity payment

**Type / category:** bill / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “The electricity bill is due. Your household still needs groceries and transportation this month. Which obligation will you carry?”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D007-PAY | Pay the bill | -$145.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D007-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $145.00 + proposed late fee $10.00 = **$155.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “The unpaid electricity balance could lead to further collection activity or service problems, depending on the actual provider’s terms.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D007` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D007` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Utility coverage by CAC is unconfirmed; no CAC choice..

## D008 — Water and sewer bill

**Type / category:** bill / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A water and sewer bill arrives. It is smaller than rent, but paying every small bill still adds up.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D008-PAY | Pay the bill | -$68.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D008-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $68.00 + proposed late fee $8.00 = **$76.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unpaid utility account can create continuing debt and possible service consequences under its provider’s rules.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D008` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D008` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Only for households with a separately billed water obligation..

## D009 — Phone service renewal

**Type / category:** bill / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “Your phone plan renews today. Keeping it paid competes with the money you were trying to save for an emergency.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D009-PAY | Pay the bill | -$55.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D009-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $55.00 + proposed late fee $5.00 = **$60.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unresolved phone account could affect continued service and staying reachable for work.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D009` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D009` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Requires a modeled plan that allows an unpaid billed balance; not a prepaid top-up..

## D010 — Home internet bill

**Type / category:** bill / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “Your internet bill is due. You use the connection for applications and household tasks, but it does not replace the phone bill.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D010-PAY | Pay the bill | -$65.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D010-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $65.00 + proposed late fee $7.00 = **$72.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unpaid internet account could affect service and leave a balance to resolve after the month.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D010` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D010` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Only if the persona has separately billed home internet..

## D011 — Car insurance installment

**Type / category:** bill / Financial Literacy & Taxes. **Persona intent:** CAR. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A car insurance installment is due. Ignoring it preserves cash today while leaving a larger amount unpaid.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D011-PAY | Pay the bill | -$130.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D011-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $130.00 + proposed late fee $15.00 = **$145.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unpaid insurance installment could put coverage at risk. Actual coverage and legal consequences depend on the policy and cannot be inferred here.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D011` = UNRESOLVED. Source an approved financial-resilience or tax-context observation. FINRA survey facts need year/question/coding/sample/denominator; a survey is not a price quote. CAC `K-D011` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Requires approved car ownership and insurance installment terms. No modeled driving or legal penalty..

## D012 — A previous clinic invoice

**Type / category:** bill / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A bill from an earlier clinic visit comes due. The care already happened; ignoring the invoice will not undo the visit.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D012-PAY | Pay the bill | -$190.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D012-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $190.00 + proposed late fee $20.00 = **$210.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “Medical debt could remain after the exercise and require payment arrangements or collection follow-up.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D012` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D012` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Requires an edition-approved prior invoice, not a new medical event or diagnosis..

## D013 — Childcare invoice

**Type / category:** bill / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “Maya’s agreed childcare arrangement has an invoice due. Paying it uses money you had hoped to keep available for the rest of the month.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D013-PAY | Pay the bill | -$260.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D013-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $260.00 + proposed late fee $25.00 = **$285.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unresolved childcare account could affect access to future care, subject to actual provider arrangements.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D013` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D013` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Requires approved care arrangement and terms. CAC daycare payments are not established..

## D014 — School meal account

**Type / category:** bill / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “An approved school meal account has a balance due. It is an existing billed amount, not a second charge for groceries.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D014-PAY | Pay the bill | -$32.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D014-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $32.00 + proposed late fee $3.00 = **$35.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “The account would remain owed. The exercise does not claim that a child will lose meal access or face a particular school sanction.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D014` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D014` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Requires actual fictional school-account applicability; no claim about local fee practices..

## D015 — An earlier repair invoice

**Type / category:** bill / Essential Goods & Clothing. **Persona intent:** CAR. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A repair completed before the month has a bill due today. The car is already repaired; this choice is about the unpaid invoice.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D015-PAY | Pay the bill | -$240.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D015-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $240.00 + proposed late fee $25.00 = **$265.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “The repair balance could remain a debt and require follow-up with the repair provider.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D015` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D015` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Mutually exclusive with charging the same repair in D021/D026/D031..

## D016 — Prescription account invoice

**Type / category:** bill / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A pharmacy account invoice for an earlier purchase is due. The medicine was already supplied.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D016-PAY | Pay the bill | -$85.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D016-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $85.00 + proposed late fee $8.00 = **$93.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “The unpaid account could become an ongoing debt. This card does not model stopping medicine or a medical outcome.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D016` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D016` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Only if a billed pharmacy arrangement is explicitly configured; do not assume pharmacies extend credit..

## D017 — An existing repayment installment

**Type / category:** bill / Financial Literacy & Taxes. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “An installment on an existing fictional repayment agreement is due. This is not an offer to borrow new money.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D017-PAY | Pay the bill | -$110.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D017-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $110.00 + proposed late fee $12.00 = **$122.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “A missed installment could increase debt and affect the relationship with the lender, according to the actual agreement.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D017` = UNRESOLVED. Source an approved financial-resilience or tax-context observation. FINRA survey facts need year/question/coding/sample/denominator; a survey is not a price quote. CAC `K-D017` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Staff must approve existence, terms and persona linkage; do not create an automatic loan..

## D018 — Household gas bill

**Type / category:** bill / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “Your household uses a separately billed gas service. Its due date falls before another expected expense.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D018-PAY | Pay the bill | -$92.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D018-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $92.00 + proposed late fee $9.00 = **$101.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unpaid gas account could create continuing debt and possible provider service consequences.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D018` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D018` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Only gas-service households; avoid including gas costs twice in electricity or rent..

## D019 — Rent while rebuilding a buffer

**Type / category:** bill / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “Rent is due just as you start to rebuild a cash buffer. Paying means giving up that buffer; ignoring creates a larger obligation.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D019-PAY | Pay the bill | -$650.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D019-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |
| D019-CAC | Use eligible CAC rent assistance | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C01; candidate eligible expense is the $650.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Unpaid-sidebar proposal:** Ignore records principal $650.00 + proposed late fee $35.00 = **$685.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “The remaining rent debt and fee could make next month harder and threaten housing stability without a specific legal outcome being predicted.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D019` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D019` = candidate C01 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Alternative to D006 for the same monthly rent occurrence, never a second rent charge..

## D020 — A remaining approved medical bill

**Type / category:** bill / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Approved billed obligation; not paid, ignored or charged already; no job event on this day.

**Situation:** “A separate, approved medical invoice remains due. You can pay it now or carry the obligation into the end-of-month summary.”

**Timing:** scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D020-PAY | Pay the bill | -$320.00 | settle_current_bill | “The bill is paid once. It does not enter the unpaid list.” |
| D020-IGNORE | Ignore the bill for now | $0.00 | create_unpaid_bill | “The bill moves to the unpaid sidebar with its late fee. You keep today’s cash and owe the larger total.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Unpaid-sidebar proposal:** Ignore records principal $320.00 + proposed late fee $25.00 = **$345.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Draft Day 30 explanation if still unpaid:** “An unresolved medical balance could require later repayment or collection follow-up; no automatic credit-score effect is claimed.” Show the actual remaining principal/fee/total alongside this explanation. No threatened consequence occurs automatically within the simulated month.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component, bill principal and late fee; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D020` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D020` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Alternative medical-invoice variant; do not select with D012 for the same invoice..

## D021 — The car will not start

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** CAR. **Eligibility:** Car owned; repair not already invoiced.

**Situation:** “The car will not start. The repair quote could consume much of your remaining money, but you still need a way to travel.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D021-REPAIR | Pay for the repair | -$620.00 | car_repaired | “You pay for the quoted repair and keep the car available.” |
| D021-TRANSIT | Leave the car parked and buy a temporary transit pass | -$50.00 | car_unavailable_transit_pass | “The car stays unrepaired. You have the approved temporary transit option instead.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D021` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D021` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Route requires an approved feasible transit alternative; do not invent lost wages or repair failure..

## D022 — Urgent dental expense

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Fictional treatment need and alternatives approved.

**Situation:** “A painful dental problem needs attention. You have a quote for treatment and a lower-cost assessment, but the assessment does not include the treatment.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D022-TREAT | Pay for the quoted treatment | -$480.00 | dental_treatment_purchased | “You pay for the modeled treatment. The exercise makes no guarantee about clinical outcomes.” |
| D022-ASSESS | Pay for an assessment only | -$90.00 | dental_treatment_unresolved | “You purchase the assessment, keeping more cash while the treatment expense remains unresolved.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D022` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D022` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No treatment advice, predicted deterioration or automatic future charge; care alternatives and costs need review..

## D023 — The phone breaks

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Phone required; no duplicate handset event.

**Situation:** “Your phone breaks while you are waiting for work and household messages. Replacing it costs much more than the monthly service bill.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D023-REPLACE | Buy a replacement handset | -$240.00 | phone_replaced | “You have a replacement phone and substantially less cash.” |
| D023-REPAIR | Pay for the approved repair | -$95.00 | phone_repaired | “You pay for a repair rather than a replacement.” |
| D023-WAIT | Go without the phone for now | $0.00 | phone_unavailable | “You keep the money, but the phone remains unavailable. No missed call or job loss is invented.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D023` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D023` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D024 — A family emergency out of town

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Fictional relative and travel circumstances approved.

**Situation:** “Someone close to you has a family emergency out of town. You want to be there, but traveling would use money set aside for your own household.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D024-TRAVEL | Pay for the trip | -$360.00 | family_trip_purchased | “You commit the travel cost and choose to be present.” |
| D024-REMOTE | Stay home and support them remotely | $0.00 | family_trip_declined | “You preserve the money but cannot be there in person.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D024` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D024` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No bereavement probability, wage loss or judged family-relationship score..

## D025 — Childcare falls through

**Type / category:** shock / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Employed; care arrangement interrupted; approved short-term alternatives.

**Situation:** “Your usual childcare arrangement falls through for the coming work period. You need a replacement plan for Maya.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D025-AGENCY | Pay for approved short-term replacement care | -$340.00 | replacement_care_booked | “You arrange the higher-cost replacement care.” |
| D025-SHORT | Pay for a shorter approved arrangement and change your work availability | -$160.00 | short_care_work_availability_changed | “You spend less but need a changed work schedule. Any pay effect is unresolved and must be approved before publication.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D025` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D025` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Both alternatives must be feasible; never imply unsupervised care is acceptable. No CAC daycare benefit..

## D026 — Four tires need replacement

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** CAR. **Eligibility:** Car owned; approved tire replacement need.

**Situation:** “The car needs tires. A full new set costs a large part of your available balance; a shop has also quoted an approved lower-cost set.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D026-NEW | Buy the approved new set | -$520.00 | tires_replaced_new | “You pay for the new set.” |
| D026-LOWER | Buy the approved lower-cost set | -$310.00 | tires_replaced_alternative | “You choose the lower-cost set and keep more money for other needs.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D026` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D026` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Safety and suitability of both options need staff review; price does not imply a predicted failure rate..

## D027 — Replacing broken glasses

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Persona explicitly needs corrective glasses.

**Situation:** “Your glasses break. Replacing them was not in your plan, and the approved optical quotes differ in price and features.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D027-STANDARD | Buy the standard replacement | -$290.00 | glasses_replaced_standard | “You pay for the standard replacement.” |
| D027-BASIC | Buy the approved basic replacement | -$135.00 | glasses_replaced_basic | “You choose the basic replacement and retain more cash.” |
| D027-DEFER | Delay replacement | $0.00 | glasses_need_unmet | “No purchase is made. The need remains unmet; the exercise does not invent an accident or medical outcome.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D027` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D027` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D028 — A plumbing expense you are responsible for

**Type / category:** shock / Housing & Utilities. **Persona intent:** ALL. **Eligibility:** Approved housing arrangement explicitly assigns this cost; do not assume tenant liability.

**Situation:** “A plumbing problem produces a repair expense that the approved household arrangement assigns to you. You can resolve it now or pay for a limited temporary workaround.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D028-FIX | Pay for the full quoted repair | -$410.00 | plumbing_repaired | “The quoted repair is paid.” |
| D028-TEMP | Pay for the approved temporary workaround | -$75.00 | plumbing_repair_unresolved | “You buy time with the workaround, but the repair need remains.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D028` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D028` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Liability, habitability and feasible alternatives require review; no claim about landlord law..

## D029 — A child’s unexpected care expense

**Type / category:** shock / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Fictional child-care expense and suitable alternatives approved.

**Situation:** “Maya has an unexpected care-related expense. The household needs to choose between the approved full appointment cost and an approved initial appointment option.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D029-FULL | Pay for the full approved appointment | -$380.00 | child_appointment_purchased | “You commit the full appointment cost.” |
| D029-INITIAL | Pay for the approved initial appointment | -$120.00 | child_followup_need_unresolved | “You pay the initial amount; any follow-up remains unresolved.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D029` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D029` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Not medical advice or a recommendation to postpone necessary care; alternatives need domain/content review..

## D030 — The laptop stops working

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Laptop owned and used for household/job tasks.

**Situation:** “Your laptop fails. A replacement is expensive, and a repair quote is cheaper but would keep the same older device.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D030-REPLACE | Buy the approved replacement | -$450.00 | laptop_replaced | “You pay for a replacement device.” |
| D030-REPAIR | Pay for the approved repair | -$180.00 | laptop_repaired | “You repair the existing device.” |
| D030-DEFER | Manage without it for now | $0.00 | laptop_unavailable | “You keep the money and the laptop remains unavailable.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D030` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D030` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; CAC computer classes are not a laptop replacement benefit..

## D031 — A towing expense

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** CAR. **Eligibility:** Approved towing event; not duplicated with another car scenario.

**Situation:** “The car needs towing. You have quotes to take it to a repair shop or to an approved parking location. Neither quote includes repairs.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D031-SHOP | Tow it to the repair shop | -$225.00 | car_at_shop_unrepaired | “The towing charge is paid; repairs are not included.” |
| D031-PARK | Tow it to the approved parking location | -$140.00 | car_parked_unrepaired | “You pay less for the tow, and the car still needs attention.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D031` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D031` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Both destinations must be feasible; no impound rules, storage fees or later repair costs without approval..

## D032 — Your share of household costs increases

**Type / category:** shock / Housing & Utilities. **Persona intent:** SOFIA. **Eligibility:** Approved fictional shared-cost change; no spouse income inferred.

**Situation:** “Your household’s approved contribution plan changes. You can cover a larger share of a necessary household purchase or agree on a smaller immediate contribution with part of the need left unresolved.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D032-FULL | Pay the larger approved share | -$420.00 | shared_purchase_fully_funded | “You cover the stated share from your own available balance.” |
| D032-SMALL | Pay the smaller agreed contribution | -$180.00 | shared_need_partly_unmet | “You make the smaller agreed contribution; the remaining need is not silently paid by your spouse.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D032` = UNRESOLVED. Source an approved housing-cost or utility-burden observation matching the obligation and geography; do not present a rent benchmark as a measured bill. CAC `K-D032` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; This is a proposed agreed purchase, not partial bill payment or invented spouse wages; specify actual goods before publication..

## D033 — A required work item is damaged

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** EMPLOYED. **Eligibility:** Hired; approved role actually uses this item.

**Situation:** “An item used for your current job is damaged. The approved alternatives are a full replacement or repair of the existing item.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D033-REPLACE | Buy the approved replacement | -$350.00 | work_item_replaced | “You pay for the replacement.” |
| D033-REPAIR | Pay for the approved repair | -$145.00 | work_item_repaired | “You repair the existing item and preserve more cash.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D033` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D033` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Not a new job qualification or a universal worker obligation; item ownership/employer responsibility needs approval..

## D034 — A damaged bed needs replacing

**Type / category:** shock / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Owned bed damaged; no automatic landlord obligation.

**Situation:** “Your bed is damaged and needs replacing. A complete replacement and a basic approved option are both available.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D034-FULL | Buy the complete replacement | -$390.00 | bed_replaced_full | “You spend more for the complete replacement.” |
| D034-BASIC | Buy the approved basic option | -$165.00 | bed_replaced_basic | “You choose the basic option and keep more cash.” |
| D034-DEFER | Make do without replacing it this month | $0.00 | bed_need_unmet | “The replacement need remains. No health penalty is inferred.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D034` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D034` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; The source does not establish a CAC furniture benefit..

## D035 — A refrigerator failure spoils your groceries

**Type / category:** shock / Food & Nutrition. **Persona intent:** ALL. **Eligibility:** Food loss explicitly configured; do not charge appliance repair here.

**Situation:** “A refrigerator failure spoils an approved amount of stored food. You need to replace groceries even though you already paid for the food that was lost.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D035-FULL | Replace the full approved basket | -$165.00 | spoiled_food_replaced_full | “You pay again for the replacement basket, tied to the distinct loss event.” |
| D035-SMALL | Buy only the approved immediate essentials | -$65.00 | spoiled_food_replaced_partial | “You replace fewer items and leave the rest of the basket unfilled.” |
| D035-CAC | Use eligible CAC support for this specific need | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C04; candidate eligible expense is the $165.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D035` = UNRESOLVED. Source an approved food-budget/food-access observation with exact household composition, month, geography, unit and population; match the specific food decision. CAC `K-D035` = candidate C04 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; CAC option may cover the approved replacement basket in kind; no appliance-repair service is implied..

## D036 — Groceries or a smaller basket

**Type / category:** everyday / Food & Nutrition. **Persona intent:** ALL. **Eligibility:** Approved household-sized food basket.

**Situation:** “You have a grocery list that would last the approved period, but buying it all would leave little room for surprises.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D036-FULL | Buy the full basket | -$95.00 | food_basket_full | “You buy the full approved basket.” |
| D036-SMALL | Buy the approved smaller basket | -$50.00 | food_basket_reduced | “You spend less and leave some listed food unpurchased.” |
| D036-CAC | Use eligible CAC support for this specific need | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C04; candidate eligible expense is the $95.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D036` = UNRESOLVED. Source an approved food-budget/food-access observation with exact household composition, month, geography, unit and population; match the specific food decision. CAC `K-D036` = candidate C04 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D037 — Getting to work after a canceled ride

**Type / category:** everyday / Employment & Adult Education. **Persona intent:** EMPLOYED. **Eligibility:** Hired; ride canceled; both routes feasible.

**Situation:** “The ride you arranged to work is canceled. You can pay for a direct ride or use a cheaper route that takes longer.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D037-RIDE | Pay for the direct ride | -$38.00 | work_trip_direct | “You pay more for the direct route.” |
| D037-TRANSIT | Take the approved transit route | -$6.00 | work_trip_longer | “You pay less and commit more travel time.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D037` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D037` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Do not invent lateness, wage loss or dismissal..

## D038 — Laundry before the workweek

**Type / category:** everyday / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Paid laundry facilities required.

**Situation:** “Your clothes need washing. Paying for the full wash and dry costs more than the approved smaller-load option.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D038-FULL | Wash and dry the full load | -$18.00 | laundry_full | “The full modeled load is washed and dried.” |
| D038-SMALL | Wash the smaller load and air-dry it | -$8.00 | laundry_partial | “You spend less, wash fewer items, and handle drying yourself.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D038` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D038` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D039 — A school trip for Maya

**Type / category:** everyday / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Optional school trip with approved nonparticipation arrangement.

**Situation:** “Maya brings home an optional school trip notice. The fee is modest compared with rent, but it is another claim on the same money.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D039-PAY | Pay for the trip | -$28.00 | school_trip_paid | “You pay for Maya to participate in the modeled trip.” |
| D039-DECLINE | Decline the optional trip | $0.00 | school_trip_declined | “You preserve the money, and Maya does not participate. No school penalty is applied.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D039` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D039` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D040 — Worn shoes

**Type / category:** everyday / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Everyday shoes; not interview outfit.

**Situation:** “Your everyday shoes are wearing out. A new pair costs more than repairing the existing pair.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D040-BUY | Buy the replacement shoes | -$70.00 | everyday_shoes_replaced | “You buy the new pair.” |
| D040-REPAIR | Repair your existing shoes | -$25.00 | everyday_shoes_repaired | “You repair the current pair instead.” |
| D040-CAC | Use eligible CAC support for this specific need | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C14; candidate eligible expense is the $70.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D040` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D040` = candidate C14 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Coverage for the specific item requires approval; professional-clothing ownership is unaffected..

## D041 — Dinner after a long day

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

**Facts:** general `G-D041` = UNRESOLVED. Source an approved food-budget/food-access observation with exact household composition, month, geography, unit and population; match the specific food decision. CAC `K-D041` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No nutrition score or assumed cooking facilities; route requires a usable kitchen for COOK..

## D042 — School supplies for Maya

**Type / category:** everyday / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Actual school period and approved item list.

**Situation:** “Maya needs supplies for an upcoming school activity. You can buy the complete set or just the immediate required items.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D042-FULL | Buy the full supply set | -$48.00 | school_supplies_full | “You purchase the complete approved set.” |
| D042-BASIC | Buy only the immediate items | -$22.00 | school_supplies_partial | “You buy the smaller set and leave the other items unpurchased.” |
| D042-CAC | Use eligible CAC support for this specific need | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C17; candidate eligible expense is the $48.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D042` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D042` = candidate C17 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

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

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D044 — A workforce-program travel cost

**Type / category:** everyday / Employment & Adult Education. **Persona intent:** WORKFORCE. **Eligibility:** Approved program participation and actual trip required.

**Situation:** “An approved workforce-program appointment requires travel. A direct ride costs more than the approved transit route.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D044-DIRECT | Pay for a direct ride | -$32.00 | program_trip_direct | “You pay for the direct trip.” |
| D044-TRANSIT | Take the approved transit route | -$6.00 | program_trip_transit | “You spend less and commit more travel time.” |
| D044-CAC | Use eligible CAC support for this specific need | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C13; candidate eligible expense is the $32.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D044` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D044` = candidate C13 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; CAC workforce transportation is program-specific. Assistance covers only the approved eligible trip, not universal transport..

## D045 — A warm coat for Maya

**Type / category:** everyday / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Approved cold-weather season and need.

**Situation:** “Maya needs a coat for the approved season. There is a new option and a lower-cost secondhand option.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D045-NEW | Buy the new coat | -$60.00 | child_coat_new | “You buy the new coat.” |
| D045-USED | Buy the approved secondhand coat | -$24.00 | child_coat_secondhand | “You meet the coat need with the lower-cost option.” |
| D045-CAC | Use eligible CAC support for this specific need | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C18; candidate eligible expense is the $60.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D045` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D045` = candidate C18 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Confirm whether the source’s goal label represents achieved outcomes. No child-coat event outside its season..

## D046 — Lunches for the next work stretch

**Type / category:** everyday / Food & Nutrition. **Persona intent:** EMPLOYED. **Eligibility:** Hired; feasible cooking/storage assumptions.

**Situation:** “You can prepare lunches ahead of time or buy them during workdays. One option takes more time now; the other costs more money.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D046-PACK | Buy ingredients and pack lunches | -$26.00 | work_lunches_packed | “You spend less and do the preparation.” |
| D046-BUY | Buy the approved workday lunches | -$55.00 | work_lunches_purchased | “You save preparation time and spend more.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D046` = UNRESOLVED. Source an approved food-budget/food-access observation with exact household composition, month, geography, unit and population; match the specific food decision. CAC `K-D046` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

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

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No CAC coverage assumed for bags from a general clothing label..

## D048 — Meals for Maya during a program period

**Type / category:** everyday / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Approved program season and child meals not already in groceries.

**Situation:** “A distinct meal need for Maya falls within an approved program period. You can buy prepared meals or the approved ingredients.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D048-MEALS | Buy the prepared meal allocation | -$42.00 | child_meals_prepared | “You pay for the prepared meals.” |
| D048-COOK | Buy ingredients and prepare the meals | -$24.00 | child_meals_home_prepared | “You spend less and commit preparation time.” |
| D048-CAC | Use eligible CAC support for this specific need | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C16; candidate eligible expense is the $42.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D048` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D048` = candidate C16 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No childcare payments; eliminate overlap with the ordinary grocery basket..

## D049 — Paying to access your own money

**Type / category:** everyday / Financial Literacy & Taxes. **Persona intent:** ALL. **Eligibility:** Approved fictional payment-access options; no new credit.

**Situation:** “You need access to an approved payment balance. One available route costs a fee; the slower alternative is free.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D049-FEE | Use the fee-charging access option | -$9.00 | payment_access_fee_paid | “You pay for the faster access option; no extra income is created.” |
| D049-FREE | Use the free approved option | $0.00 | payment_access_free | “You avoid the fee and accept the slower process.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D049` = UNRESOLVED. Source an approved financial-resilience or tax-context observation. FINRA survey facts need year/question/coding/sample/denominator; a survey is not a price quote. CAC `K-D049` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Exact payment instrument, timing and feasibility unresolved. Do not credit wages twice or move a locked paycheck..

## D050 — A household hygiene purchase

**Type / category:** everyday / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Approved item quantities and household size.

**Situation:** “You are running low on household hygiene supplies. Buying the larger pack costs more today, while the smaller pack leaves more cash available.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D050-LARGE | Buy the larger approved pack | -$32.00 | hygiene_large_pack | “You buy more supplies now.” |
| D050-SMALL | Buy the smaller pack | -$14.00 | hygiene_small_pack | “You keep more cash and buy fewer supplies.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D050` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D050` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No unverified CAC hygiene benefit or automatic repeat purchase..

## D051 — An optional skills workshop

**Type / category:** everyday / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** Approved non-CAC workshop, attendance feasible, no qualification effect.

**Situation:** “An optional workshop interests you. Attending has a cost and takes time, but it does not guarantee a job or a raise.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D051-ATTEND | Pay for and attend the workshop | -$45.00 | optional_workshop_attended | “You commit the fee and time, with no promised wage or skill-flag change.” |
| D051-DECLINE | Decline the workshop this month | $0.00 | optional_workshop_declined | “You keep the money and do not attend.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D051` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D051` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Not the fixed CAC preparation; content value and fee need review..

## D052 — A birthday plan for Maya

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
| D053-CAC | Use eligible CAC support for this specific need | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C06; candidate eligible expense is the $85.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D053` = UNRESOLVED. Source an approved food-budget/food-access observation with exact household composition, month, geography, unit and population; match the specific food decision. CAC `K-D053` = candidate C06 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Seasonal availability and duplicate grocery coverage need approval..

## D054 — Replacing an everyday outfit

**Type / category:** everyday / Essential Goods & Clothing. **Persona intent:** ALL. **Eligibility:** Not the professional-clothing event.

**Situation:** “Your everyday clothing needs a replacement item. A new option costs more than an approved secondhand option.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D054-NEW | Buy the new item | -$55.00 | everyday_clothing_new | “You buy the new item.” |
| D054-USED | Buy the secondhand item | -$20.00 | everyday_clothing_used | “You choose the lower-cost item.” |
| D054-CAC | Use eligible CAC support for this specific need | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C15; candidate eligible expense is the $55.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D054` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D054` = candidate C15 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Only one clothing effect; no interview outcome change or thrift-credit cash allocation..

## D055 — Helping someone else while money is tight

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

**Facts:** general `G-D055` = UNRESOLVED. Source an approved financial-resilience or tax-context observation. FINRA survey facts need year/question/coding/sample/denominator; a survey is not a price quote. CAC `K-D055` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences.

## D056 — Hope for the Holidays

**Type / category:** everyday / Childcare & Youth. **Persona intent:** JORDAN. **Eligibility:** Approved holiday season and supported item.

**Situation:** “You are considering a holiday gift for Maya. The planned gift costs more than a modest alternative.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D056-PLANNED | Buy the planned gift | -$65.00 | holiday_gift_planned | “You buy the planned gift.” |
| D056-MODEST | Buy the modest alternative | -$18.00 | holiday_gift_modest | “You choose the less expensive gift.” |
| D056-DECLINE | Make no gift purchase this month | $0.00 | holiday_gift_not_purchased | “No purchase is made. The exercise does not score your parenting.” |
| D056-CAC | Use eligible CAC support for this specific need | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C19; candidate eligible expense is the $65.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D056` = UNRESOLVED. Source an approved child-household, school-cost or care-access observation matching the need, child population and geography; do not imply CAC daycare coverage. CAC `K-D056` = candidate C19 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Program-supported items and eligibility must be confirmed; no cash benefit..

## D057 — A bus pass or individual fares

**Type / category:** everyday / Employment & Adult Education. **Persona intent:** ALL. **Eligibility:** Transit use and valid fare products approved.

**Situation:** “You expect more travel this month. A pass costs more upfront, while buying only the approved immediate trips costs less today.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D057-PASS | Buy the approved pass | -$50.00 | transit_pass_owned | “You pay upfront for the pass. Later trips require an approved coverage rule to avoid double charging.” |
| D057-FARES | Buy only the immediate fares | -$12.00 | immediate_fares_purchased | “You keep more cash now without pass coverage for later travel.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D057` = UNRESOLVED. Source an approved employment, skills or commuting observation relevant to this decision; no causal employment guarantee. CAC `K-D057` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Pass duration, trip coverage and route needs must be configured; no automatic savings invented..

## D058 — Laundry supplies for the household

**Type / category:** everyday / Essential Goods & Clothing. **Persona intent:** SOFIA. **Eligibility:** Two-person household; not already included in hygiene basket.

**Situation:** “You and your spouse need laundry supplies. A larger purchase costs more today; buying only the immediate amount keeps cash available.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D058-LARGE | Buy the larger approved quantity | -$28.00 | laundry_supplies_large | “You buy the larger quantity using your run’s money.” |
| D058-SMALL | Buy the immediate amount | -$12.00 | laundry_supplies_small | “You buy less and keep more cash.” |

**CAC option:** none in either mode. No service or financial effect is inferred for this expense.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D058` = UNRESOLVED. Source a topic-specific approved observation about the item, care cost or resource pressure. New health/transport sources need approval; do not invent medical facts or use unrelated clothing data. CAC `K-D058` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; No inferred spouse contribution or duplicate hygiene charge..

## D059 — A low-cost break from the month

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

**Facts:** general `G-D059` = UNRESOLVED. Source an approved financial-resilience or tax-context observation. FINRA survey facts need year/question/coding/sample/denominator; a survey is not a price quote. CAC `K-D059` = UNRESOLVED — no suitable topic-matched CAC observation assigned; no assistance inferred. Exactly these two roles; missing facts block publication.

**Review blockers:** actual edition/scenario/category/persona/choice IDs; both approved facts; supported transitions and state predicates; approve all draft prices and circumstances, alternative feasibility and financial consequences; Do not frame all discretionary spending as irresponsible or award a virtue score..

## D060 — Restocking food late in the month

**Type / category:** everyday / Food & Nutrition. **Persona intent:** ALL. **Eligibility:** Distinct final grocery need; previous purchases reconciled.

**Situation:** “There are still days left in the month, and the household needs food. A full restock costs more than the approved smaller basket.”

**Timing:** non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

**All numerical amounts in this table are DRAFT assumptions requiring approval.** Every row is a submitted answer.

| Key | Choice | Immediate balance change | Proposed committed outcome | Result text |
| --- | --- | --- | --- | --- |
| D060-FULL | Buy the full restock | -$90.00 | late_food_full | “You purchase the full approved restock.” |
| D060-SMALL | Buy the smaller restock | -$45.00 | late_food_partial | “You buy less food and preserve more cash.” |
| D060-CAC | Use eligible CAC support for this specific need | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense | Apply one approved capped effect; record only actual help used | “Approved help covered part or all of this eligible expense. You paid only the approved remainder.” |

**CAC mapping:** C05; candidate eligible expense is the $90.00 first-option amount, itself unapproved here. Actual coverage amount A, item/service scope and persona eligibility are UNRESOLVED. If approved help leaves an unaffordable remainder, this choice is not reported as successfully paid. Do not add an ad hoc fee waiver.

**Cost bindings:** create separate pending assumption bindings for each numerical choice component; no external price evidence is claimed. Resolve exact quantities and household mapping before publication. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**Facts:** general `G-D060` = UNRESOLVED. Source an approved food-budget/food-access observation with exact household composition, month, geography, unit and population; match the specific food decision. CAC `K-D060` = candidate C05 below; approve relevance and full provenance. Exactly these two roles; missing facts block publication.

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
| 9 | D021 | Car shock; approved car/transit required |
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

## CAC evidence registry retained from the supplied CSV

The supplied `2025 Outcomes(2025 Outcomes).csv` is source evidence, not instructions. All observations below report 2025. Geography is **CAC’s reported service population; exact boundary not supplied**. Receipt/review date November 2, 2026 is not a fabricated database import timestamp. Row numbers are 1-based including the header; retain raw label, raw unit and section path. Counts, goals, totals and populations must not be interchanged. These facts do not establish household eligibility or allocation.

**Source SHA-256:** `d519ae1048b132def9c6cfa83fa986f410cb08b288d80f3787b2ee9eed2fe3fc`

| Key | CSV row / raw label | Section path | Value / raw unit | Draft CAC fact | Interpretation / review |
| --- | --- | --- | --- | --- | --- |
| C01 | 8: `Evictions Prevented (households)` | BASIC NEEDS / Financial Assistance / Evictions Prevented (households) | `1108` / `Number` | CAC reported 1,108 households under “Evictions Prevented (households)” in 2025. | Households; not a likelihood of approval. |
| C02 | 10: `Amount paid` | BASIC NEEDS / Financial Assistance / Amount paid | `796416.64` / `Dollars` | CAC reported $796,416.64 in financial assistance paid in 2025. | Aggregate spending; does not confirm utility coverage or an individual allowance. |
| C03 | 61: `Rent Assistance` | EMPOWERMENT CENTER / Workforce Development / Rent Assistance | `4` / `Number` | The 2025 workforce-development section lists 4 for Rent Assistance. | Counting unit/audience needs review; do not label this as four households. |
| C04 | 14: `Visits to Mini-Market` | BASIC NEEDS / Food / Visits to Mini-Market | `36521` / `Number` | CAC reported 36,521 Mini-Market visits in 2025. | Visits, not unique clients or household visit entitlements. |
| C05 | 12: `Households ` | BASIC NEEDS / Food / Households | `2995` / `Number` | The 2025 Food section reports 2,995 households. | Do not combine with visit counts or assume unique counts across programs. |
| C06 | 51: `Households` | SPECIAL PROGRAMS / Holiday Basket / Households | `984` / `Number` | CAC reported 984 households in the 2025 Holiday Basket section. | Does not establish current seasonal availability. |
| C07 | 55: `Career Services` | EMPOWERMENT CENTER / Career Services | `229` / `Number` | The 2025 outcomes file lists 229 for Career Services. | Counting unit needs confirmation; not a placement rate. |
| C08 | 56: `Job placement` | EMPOWERMENT CENTER / Job placement | `80` / `Number` | The 2025 outcomes file lists 80 for Job placement. | Counting unit needs confirmation; not a success probability. |
| C09 | 65: `ESOL` | EMPOWERMENT CENTER / Adult Education - # students / ESOL | `521` / `Number` | CAC reported 521 ESOL students in 2025. | Students; no job guarantee or course-duration claim. |
| C10 | 66: `Computers` | EMPOWERMENT CENTER / Adult Education - # students / Computers | `42` / `Number` | CAC reported 42 computer-education students in 2025. | Students; not a credential or employment outcome. |
| C11 | 59: `Thrive participants - Workforce development` | EMPOWERMENT CENTER / Workforce Development / Thrive participants - Workforce development | `9` / `Number` | The 2025 file reports 9 Thrive workforce-development participants. | Not an eligibility rule or benefit amount. |
| C12 | 60: `TCC/Scholarships` | EMPOWERMENT CENTER / Workforce Development / TCC/Scholarships | `4` / `Number` | The 2025 file lists 4 for TCC/Scholarships. | Meaning of TCC, counting unit and eligible audience remain unresolved. |
| C13 | 62: `Transportation` | EMPOWERMENT CENTER / Workforce Development / Transportation | `1` / `Number` | The 2025 workforce-development section lists 1 for Transportation. | Counting unit needs review; not universal transportation assistance. |
| C14 | 23: `Households (Undup)` | BASIC NEEDS / Clothing / Households (Undup) | `2152` / `Number` | CAC reported 2,152 unduplicated clothing-service households in 2025. | Unduplicated within this reported measure; no personal allocation implied. |
| C15 | 26: `Thrift Credit (clients)` | BASIC NEEDS / Clothing / Thrift Credit (clients) | `206768.67` / `Dollars` | CAC reported $206,768.67 in client thrift credit in 2025. | Aggregate credit, not a household allowance. |
| C16 | 29: `Children` | SPECIAL PROGRAMS / Meals for kids / Children | `1097` / `Number` | CAC reported 1,097 children in the 2025 Meals for Kids section. | Food program; does not imply childcare payments. |
| C17 | 35: `Children` | SPECIAL PROGRAMS / School Supply / Children | `1090` / `Number` | CAC reported 1,090 children in the 2025 School Supply section. | No per-child allocation or item list implied. |
| C18 | 43: `Children` | SPECIAL PROGRAMS / Coats for Kids # clients goal / Children | `623` / `Number` | The 2025 Coats for Kids section lists 623 children. | Raw heading contains “# clients goal”; confirm whether this is an achieved outcome or goal before publication. |
| C19 | 46: `Households` | SPECIAL PROGRAMS / Hope for the Holidays / Households | `614` / `Number` | The 2025 Hope for the Holidays section lists 614 households. | No gift allowance inferred; separate in-kind row has a missing unit and misspelled label. |
| C20 | 38: `Requests` | SPECIAL PROGRAMS / Teacher's Closet / Requests | `222` / `Number` | The 2025 Teacher’s Closet section lists 222 requests. | Requests, not household recipients; household relevance remains unapproved. |
| C21 | 71: `Returns` | EMPOWERMENT CENTER / Volunteer Income Tax Assistance - VITA / Returns | `503` / `Number` | The 2025 VITA section lists 503 returns. | Distinct from the separately reported 590 federal returns prepared. |
| C22 | 67: `Financial Goals` | EMPOWERMENT CENTER / Adult Education - # students / Financial Goals | `218` / `Number` | The 2025 adult-education section lists 218 Financial Goals students. | No measured savings, debt reduction, or graduation outcome implied. |
| C23 | 73: `Federal Refund` | EMPOWERMENT CENTER / Volunteer Income Tax Assistance - VITA / Federal Refund | `582083.00` / `Dollars` | CAC reported $582,083.00 in federal refunds in the 2025 VITA section. | Aggregate refunds; not the exercise’s fixed $1,000 rule or an individual forecast. |

## Service coverage and fact-policy gaps

Most of these drafts intentionally have no CAC choice. The CSV supports references for rent assistance, groceries, clothing, workforce-specific travel, youth services and VITA; it does not establish help for vehicle repairs, healthcare, phones, furniture, daycare, or every utility. Relevant C-facts are linked only where applicable. The fact registry is not a promise that all listed services appear in the revised gameplay library.

Career services/job-placement context accompanies the fixed flow. ESOL and computer preparation may be represented in D001 only after staff approve that mapping; one pre-game scenario still has just one CAC fact role. Financial Goals, Thrive, TCC/Scholarships, workforce rent support, Teacher’s Closet, and events labeled SSC/BC need a coverage or applicability review. Do not add filler “read about the service” cards just to claim full coverage. Teacher’s Closet audience, TCC meaning, workforce eligibility, and the Coats for Kids goal label remain unresolved. Events SSC/BC has reported 432 participants but no approved service interpretation in this handoff.

The requirement for one topic-relevant CAC fact on every scenario still exists. General hardship cards without matching evidence are explicitly blocked, rather than assigned unrelated facts. Staff may source suitable facts or separately revise that policy; this document does not approve omitting required facts. General-fact observations, URLs, periods, units and populations likewise need sourcing.

## Database handoff

| Draft field | Intended mapping | Resolution required |
| --- | --- | --- |
| D-key, title, situation, category, timing | `scenarios` | Real stable logical ID, edition, category, scheduled occurrence or eligible route day |
| Persona intent and eligibility | `scenario_personas`, `persona_categories` | Actual edition-scoped IDs and validated circumstances |
| Choice key, label, result | `choices` | Actual choice ID, parent scenario and edition; every displayed choice is submittable |
| Proposed costs and outcomes | Choice/expense bindings and structured transition definitions | Approved exact money, supported state, affordability checks, no executable narrative |
| CAC option when present | `cac_support_effects`, service coverage | One capped effect at most; confirmed service/item/household eligibility; real service ID |
| Fact slots | `statistics`, `scenario_statistics` | Exactly one approved general and CAC fact per scenario in same edition |
| Ignored bill | Run-specific bill occurrence plus liability/fee tracking | Original principal, outstanding principal, fee components, paid status, version, source response and idempotency; exact schema still to be designed |
| Sidebar Pay | Separate protected settlement operation/history | Caller ownership, active run, owned outstanding bill, current total, affordability, atomic payment and debt settlement; never replace the original scenario answer |
| Deferred effects / needs | Run-specific circumstance definitions | Approve mechanics and route predicates before implementation; no extra charge inferred from prose |
| Draft review | Pending content/review records | Staff approvals and provenance; do not invent model API calls, generation request records or attempt counts for this offline authoring task |

For each unresolved field, retain a pending marker instead of a fake ID or numeric zero. Freeze approved contents by edition, pin runs to their starting version, and keep pending edits out of gameplay. Restore ignored balances, fee components and paid history without replaying transactions. Replays start new runs and retain the old summary/history.

## Remaining decisions and verification

Approved mechanics are recorded in the corresponding specifications; they are not implemented by this document. Before publication, approve all new amount assumptions, late-fee timing/repetition, whether partial settlement is supported, applicable billed obligations/provider terms, future-consequence text, new state transitions, general/CAC facts, and compatible routes with no day collisions. Keep the two approved fixed money rules and original Day 2 sequence intact.

Editorial checks cover 60 sequential unique entries, the 5/15/15/25 type mix, choice rows and required fields, no review-only answers, arithmetic in unpaid examples, selective CAC options, preserved source references, and fixed-flow markers. They do not demonstrate actual simulation, security enforcement, market/legal accuracy, route solvability or balanced difficulty. Frontend tests/builds are outside this content-only update.
