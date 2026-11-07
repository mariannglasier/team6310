# Scenario and CAC fact pairings

November 6, 2026. This review pairs 27 of the 60 source drafts with current 2025 CAC facts; 33 remain unpaired for specific evidence reasons. Each paired draft has exactly one primary CAC fact. All general facts, scenario costs and scenario-publication approvals remain outside this update.

The source is the scenario-documentation branch `content/scenario-draft-library` at `aef3d98`; the attached revised library matched that file before editing. The database source is the [66-record snapshot](data/cac-service-facts-2025.json), with real UUIDs, current keys, exact values and units. This document is a review handoff, not live scenario/edition linkage. See the [machine-readable pairings](data/scenario-cac-fact-pairings.json).

Facts on a no-CAC-choice card are context only. No costs, household assistance, eligibility, choice rows, day routing or simulation rules are added or changed. Future gameplay integration must map the D-reference to a real scenario ID and pin an approved fact/version.

## Index

| Draft | Scenario | CAC fact |
|---|---|---|
| [D001](#d001) | Choose a target job before Day 1 | C24 · `adult_education` |
| [D002](#d002) | The first interview | C15 · `canopy_thrift` |
| [D003](#d003) | Reapply after the first interview | C07 · `career_services` |
| [D004](#d004) | The follow-up interview | C08 · `career_services` |
| [D005](#d005) | File the simulated tax return | C21 · `vita` |
| [D006](#d006) | Rent before payday | C01 · `eviction_prevention` |
| [D007](#d007) | Electricity payment | No suitable fact |
| [D008](#d008) | Water and sewer bill | No suitable fact |
| [D009](#d009) | Phone service renewal | No suitable fact |
| [D010](#d010) | Home internet bill | No suitable fact |
| [D011](#d011) | Car insurance installment | C22 · `financial_literacy_classes` |
| [D012](#d012) | A previous clinic invoice | No suitable fact |
| [D013](#d013) | Childcare invoice | No suitable fact |
| [D014](#d014) | School meal account | C16 · `meals_for_kids` |
| [D015](#d015) | An earlier repair invoice | No suitable fact |
| [D016](#d016) | Prescription account invoice | No suitable fact |
| [D017](#d017) | An existing repayment installment | C22 · `financial_literacy_classes` |
| [D018](#d018) | Household gas bill | No suitable fact |
| [D019](#d019) | Rent while rebuilding a buffer | C02 · `financial_assistance` |
| [D020](#d020) | A remaining approved medical bill | No suitable fact |
| [D021](#d021) | The car will not start | No suitable fact |
| [D022](#d022) | Urgent dental expense | No suitable fact |
| [D023](#d023) | The phone breaks | No suitable fact |
| [D024](#d024) | A family emergency out of town | No suitable fact |
| [D025](#d025) | Childcare falls through | No suitable fact |
| [D026](#d026) | Four tires need replacement | No suitable fact |
| [D027](#d027) | Replacing broken glasses | No suitable fact |
| [D028](#d028) | A plumbing expense you are responsible for | No suitable fact |
| [D029](#d029) | A child’s unexpected care expense | No suitable fact |
| [D030](#d030) | The laptop stops working | No suitable fact |
| [D031](#d031) | A towing expense | No suitable fact |
| [D032](#d032) | Your share of household costs increases | No suitable fact |
| [D033](#d033) | A required work item is damaged | No suitable fact |
| [D034](#d034) | A damaged bed needs replacing | No suitable fact |
| [D035](#d035) | A refrigerator failure spoils your groceries | C25 · `mini_market` |
| [D036](#d036) | Groceries or a smaller basket | C04 · `mini_market` |
| [D037](#d037) | Getting to work after a canceled ride | No suitable fact |
| [D038](#d038) | Laundry before the workweek | No suitable fact |
| [D039](#d039) | A school trip for Maya | No suitable fact |
| [D040](#d040) | Worn shoes | C14 · `canopy_thrift` |
| [D041](#d041) | Dinner after a long day | C05 · `mini_market` |
| [D042](#d042) | School supplies for Maya | C17 · `tools_for_school` |
| [D043](#d043) | A family birthday | No suitable fact |
| [D044](#d044) | A workforce-program travel cost | C13 · `workforce_development` |
| [D045](#d045) | A warm coat for Maya | C18 · `coats_for_kids` |
| [D046](#d046) | Lunches for the next work stretch | C05 · `mini_market` |
| [D047](#d047) | A broken bag | No suitable fact |
| [D048](#d048) | Meals for Maya during a program period | C16 · `meals_for_kids` |
| [D049](#d049) | Paying to access your own money | C22 · `financial_literacy_classes` |
| [D050](#d050) | A household hygiene purchase | No suitable fact |
| [D051](#d051) | An optional skills workshop | C24 · `adult_education` |
| [D052](#d052) | A birthday plan for Maya | No suitable fact |
| [D053](#d053) | A holiday meal | C06 · `holiday_food_baskets` |
| [D054](#d054) | Replacing an everyday outfit | C15 · `canopy_thrift` |
| [D055](#d055) | Helping someone else while money is tight | C22 · `financial_literacy_classes` |
| [D056](#d056) | Hope for the Holidays | C19 · `hope_for_the_holidays` |
| [D057](#d057) | A bus pass or individual fares | No suitable fact |
| [D058](#d058) | Laundry supplies for the household | No suitable fact |
| [D059](#d059) | A low-cost break from the month | C22 · `financial_literacy_classes` |
| [D060](#d060) | Restocking food late in the month | C26 · `mini_market` |

<a id="d001"></a>

## D001 — Choose a target job before Day 1

**Proposed CAC fact:** In 2025, CAC reported 610 total students in Adult Education programs.

**Source record:** `7cb64039-5726-43da-8f15-fbf8b63e8f83` · `adult_education` / `total_students_in_adult_education_programs` · 2025 · exact value `610` Number.

**Why it fits:** The choice explicitly includes adult English/computer preparation before selecting a job.

**Assistance boundary:** Existing conditional preparation pathway; course totals do not define skill flags or job eligibility.

**Interpretation:** Do not sum overlapping course enrollments or infer completion, skill gains or employment.

<a id="d002"></a>

## D002 — The first interview

**Proposed CAC fact:** In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift.

**Source record:** `859b8cec-1e1c-4887-9f55-fd55f1bb349c` · `canopy_thrift` / `dollar_amount_of_client_credits_used_at_cac_canopy_thrift` · 2025 · exact value `206768.67` Dollars.

**Why it fits:** Professional-clothing costs connect directly to the client-credit program.

**Assistance boundary:** Existing conditional clothing pathway; annual credit does not set its amount.

**Interpretation:** Aggregate credits; not an individual credit balance or cash allowance.

<a id="d003"></a>

## D003 — Reapply after the first interview

**Proposed CAC fact:** In 2025, Career Services helped 229 people.

**Source record:** `db12c137-fad7-4277-b4ca-6a203b344e38` · `career_services` / `people_helped_by_career_services` · 2025 · exact value `229` Number.

**Why it fits:** Reapplying after an unsuccessful interview is directly relevant to career support.

**Assistance boundary:** Context only; retain no CAC choice and no automatic job placement.

**Interpretation:** People helped; not a placement rate or a guarantee that an applicant gets a job.

<a id="d004"></a>

## D004 — The follow-up interview

**Proposed CAC fact:** In 2025, CAC reported 80 job placements.

**Source record:** `2675ebbd-e014-4506-a0fd-1130a9ffe692` · `career_services` / `job_placements` · 2025 · exact value `80` Number.

**Why it fits:** A follow-up interview is relevant to the reported job-placement outcome.

**Assistance boundary:** Existing conditional clothing pathway is unchanged; placements do not determine scripted hiring.

**Interpretation:** Annual placements; not the probability of passing an interview.

<a id="d005"></a>

## D005 — File the simulated tax return

**Proposed CAC fact:** In 2025, CAC reported 503 tax returns through the VITA program.

**Source record:** `5b9132c2-90d6-4dea-9dc0-f2de13a89e2f` · `vita` / `tax_returns_through_the_vita_program` · 2025 · exact value `503` Number.

**Why it fits:** The scenario is tax filing, and the fact measures returns through VITA.

**Assistance boundary:** Existing conditional VITA pathway; no change to the approved fixed simulation refund.

**Interpretation:** Keep distinct from the separate 590 federal returns prepared; no individual refund promise.

<a id="d006"></a>

## D006 — Rent before payday

**Proposed CAC fact:** In 2025, CAC reported preventing evictions for 1,108 households.

**Source record:** `5fa2bac7-6016-4db8-b705-fc593f6b75ec` · `eviction_prevention` / `evictions_prevented` · 2025 · exact value `1108` Number.

**Why it fits:** The obligation is rent and the fact is specifically about eviction prevention.

**Assistance boundary:** Existing conditional rent pathway; no eligibility or coverage amount inferred.

**Interpretation:** Households; not an individual approval probability.

<a id="d007"></a>

## D007 — Electricity payment

**No suitable CAC fact:** No electricity-payment fact. General financial-assistance totals do not establish utility coverage.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d008"></a>

## D008 — Water and sewer bill

**No suitable CAC fact:** No water/sewer-payment fact. General housing-assistance totals are insufficient.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d009"></a>

## D009 — Phone service renewal

**No suitable CAC fact:** No phone-plan or telecommunications-service fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d010"></a>

## D010 — Home internet bill

**No suitable CAC fact:** No home-internet payment or connectivity-service fact; computer classes are a different service.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d011"></a>

## D011 — Car insurance installment

**Proposed CAC fact:** In 2025, 218 students enrolled in Financial Literacy Classes.

**Source record:** `d32689c8-067a-4f59-aa48-2424384b7116` · `financial_literacy_classes` / `students_enrolled_in_financial_literacy_classes` · 2025 · exact value `218` Number.

**Why it fits:** Choosing how to handle an insurance installment is a financial-literacy/budget tradeoff.

**Assistance boundary:** Context only; no CAC car-insurance payment or insurance service inferred.

**Interpretation:** Education context only; no evidence of debt repayment, bank-fee coverage or measured savings.

<a id="d012"></a>

## D012 — A previous clinic invoice

**No suitable CAC fact:** No clinic-cost or medical-assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d013"></a>

## D013 — Childcare invoice

**No suitable CAC fact:** No daycare/childcare-payment fact; Meals for Kids measures food support.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d014"></a>

## D014 — School meal account

**Proposed CAC fact:** In 2025, Meals for Kids served 1,097 children.

**Source record:** `9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01` · `meals_for_kids` / `children_served_by_meals_for_kids` · 2025 · exact value `1097` Number.

**Why it fits:** The child’s meal-account decision has relevant child-food-access context.

**Assistance boundary:** Context only; Meals for Kids is not represented as paying the school account.

**Interpretation:** Food-program context; not daycare or school-account bill payment.

<a id="d015"></a>

## D015 — An earlier repair invoice

**No suitable CAC fact:** No vehicle-repair invoice or automotive-assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d016"></a>

## D016 — Prescription account invoice

**No suitable CAC fact:** No prescription-payment or medicine-assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d017"></a>

## D017 — An existing repayment installment

**Proposed CAC fact:** In 2025, 218 students enrolled in Financial Literacy Classes.

**Source record:** `d32689c8-067a-4f59-aa48-2424384b7116` · `financial_literacy_classes` / `students_enrolled_in_financial_literacy_classes` · 2025 · exact value `218` Number.

**Why it fits:** Managing an existing repayment installment is a financial-literacy decision.

**Assistance boundary:** Context only; CAC does not pay or restructure this debt in the draft.

**Interpretation:** Education context only; no evidence of debt repayment, bank-fee coverage or measured savings.

<a id="d018"></a>

## D018 — Household gas bill

**No suitable CAC fact:** No household-gas-payment fact or confirmed utility-coverage measure.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d019"></a>

## D019 — Rent while rebuilding a buffer

**Proposed CAC fact:** In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.

**Source record:** `b697ae84-1fd2-4bae-83da-7a10c983ac24` · `financial_assistance` / `amount_paid_through_financial_assistance` · 2025 · exact value `796416.64` Dollars.

**Why it fits:** The scenario concerns rent pressure and preserving housing stability.

**Assistance boundary:** Existing conditional rent pathway; annual spending is not the household’s benefit amount.

**Interpretation:** Aggregate spending; not an individual allowance or proof of utility coverage.

<a id="d020"></a>

## D020 — A remaining approved medical bill

**No suitable CAC fact:** No medical-bill assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d021"></a>

## D021 — The car will not start

**No suitable CAC fact:** No vehicle repair or roadside-assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d022"></a>

## D022 — Urgent dental expense

**No suitable CAC fact:** No dental-care cost or dental-assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d023"></a>

## D023 — The phone breaks

**No suitable CAC fact:** No phone replacement or device-assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d024"></a>

## D024 — A family emergency out of town

**No suitable CAC fact:** No emergency family-travel assistance fact; targeted workforce transportation is not a general travel benefit.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d025"></a>

## D025 — Childcare falls through

**No suitable CAC fact:** No replacement-childcare or daycare-access fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d026"></a>

## D026 — Four tires need replacement

**No suitable CAC fact:** No tire replacement or automotive-assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d027"></a>

## D027 — Replacing broken glasses

**No suitable CAC fact:** No vision-care or glasses-replacement assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d028"></a>

## D028 — A plumbing expense you are responsible for

**No suitable CAC fact:** No plumbing/home-repair assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d029"></a>

## D029 — A child’s unexpected care expense

**No suitable CAC fact:** No child healthcare/appointment assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d030"></a>

## D030 — The laptop stops working

**No suitable CAC fact:** Computer Classes measures education, not laptop repair or replacement.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d031"></a>

## D031 — A towing expense

**No suitable CAC fact:** No towing or vehicle-recovery assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d032"></a>

## D032 — Your share of household costs increases

**No suitable CAC fact:** The shared household purchase is unspecified. Define the actual goods before selecting a relevant program fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d033"></a>

## D033 — A required work item is damaged

**No suitable CAC fact:** The damaged work item is unspecified; clothing and computer classes do not establish equipment coverage.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d034"></a>

## D034 — A damaged bed needs replacing

**No suitable CAC fact:** No bed/furniture assistance fact; the clothing program is not evidence of furniture coverage.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d035"></a>

## D035 — A refrigerator failure spoils your groceries

**Proposed CAC fact:** In 2025, the CAC Mini-Market reported 1,160,328 pounds of food available.

**Source record:** `efaf231b-3db3-4c4d-b276-758006af8aab` · `mini_market` / `pounds_of_food_available_from_the_cac_mini_market` · 2025 · exact value `1160328` Pounds.

**Why it fits:** The expense here is replacement groceries, not repairing the refrigerator.

**Assistance boundary:** Existing conditional food pathway; no CAC appliance service or value-per-pound calculation.

**Interpretation:** Food available, not food actually distributed, replacement value or appliance repair.

<a id="d036"></a>

## D036 — Groceries or a smaller basket

**Proposed CAC fact:** In 2025, there were 36,521 visits to the CAC Mini-Market.

**Source record:** `94210a01-4766-46ad-beba-d7400c9fd31e` · `mini_market` / `visits_to_the_cac_mini_market` · 2025 · exact value `36521` Number.

**Why it fits:** The decision is grocery access and choosing a food basket.

**Assistance boundary:** Existing conditional food pathway; visits do not create an entitlement.

**Interpretation:** Visits, not unique clients or a household visit entitlement.

<a id="d037"></a>

## D037 — Getting to work after a canceled ride

**No suitable CAC fact:** The transportation measure is workforce-program-specific; this card applies to employed people generally.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d038"></a>

## D038 — Laundry before the workweek

**No suitable CAC fact:** No laundry-service or laundry-fee assistance fact; clothing distribution is a different activity.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d039"></a>

## D039 — A school trip for Maya

**No suitable CAC fact:** Tools for School concerns supplies, not school-trip participation or fees.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d040"></a>

## D040 — Worn shoes

**Proposed CAC fact:** In 2025, CAC Canopy Thrift served 2,152 households.

**Source record:** `5d6bc795-8a41-49ca-862f-9aaf73405b49` · `canopy_thrift` / `households_served_by_cac_canopy_thrift` · 2025 · exact value `2152` Number.

**Why it fits:** Replacing everyday shoes connects to the clothing program’s household reach.

**Assistance boundary:** Existing conditional item pathway; approval of the specific shoe/item scope is still required.

**Interpretation:** Clothing-program context; specific item coverage and availability require approval.

<a id="d041"></a>

## D041 — Dinner after a long day

**Proposed CAC fact:** In 2025, the CAC Mini-Market served 2,995 households.

**Source record:** `ec44118c-3be1-46b1-9585-8f34d638bbd9` · `mini_market` / `households_served_by_the_cac_mini_market` · 2025 · exact value `2995` Number.

**Why it fits:** Buying meal ingredients has relevant household food-access context.

**Assistance boundary:** Context only; no restaurant, prepared-meal reimbursement or new CAC option.

**Interpretation:** Annual households; do not add overlapping populations or infer a food allocation.

<a id="d042"></a>

## D042 — School supplies for Maya

**Proposed CAC fact:** In 2025, Tools for School served 1,090 children.

**Source record:** `c6a72bf1-47ac-4d53-9adc-8ad68dd120c4` · `tools_for_school` / `children_served_by_tools_for_school` · 2025 · exact value `1090` Number.

**Why it fits:** The decision is specifically school supplies for a child.

**Assistance boundary:** Existing conditional school-supply pathway; no item list or per-child amount inferred.

**Interpretation:** School-supply context; not trip fees or a per-child allowance.

<a id="d043"></a>

## D043 — A family birthday

**No suitable CAC fact:** Hope for the Holidays is seasonal holiday support, not general birthday gifts.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d044"></a>

## D044 — A workforce-program travel cost

**Proposed CAC fact:** The 2025 Workforce Development facts list 1 for transportation.

**Source record:** `5ff54cca-96b1-4638-b1a2-18b473b93329` · `workforce_development` / `transportation_through_workforce_development` · 2025 · exact value `1` Number.

**Why it fits:** The draft explicitly restricts this travel cost to workforce-program participants.

**Assistance boundary:** Existing conditional workforce pathway; keep Number as an unspecified counting unit until clarified.

**Interpretation:** Source unit is Number; do not call this one person, pass, ride or dollar. Workforce scope only.

<a id="d045"></a>

## D045 — A warm coat for Maya

**Proposed CAC fact:** In 2025, Coats for Kids served 623 children.

**Source record:** `e8473e58-6338-4855-93be-7608f27696ab` · `coats_for_kids` / `children_served_by_coats_for_kids` · 2025 · exact value `623` Number.

**Why it fits:** The need is a child’s warm coat in the program’s season.

**Assistance boundary:** Existing conditional coat pathway; the client has resolved the source goal-versus-actual ambiguity.

**Interpretation:** The client confirmed these are actual outcomes despite the original goal heading. Seasonal eligibility remains separate.

<a id="d046"></a>

## D046 — Lunches for the next work stretch

**Proposed CAC fact:** In 2025, the CAC Mini-Market served 2,995 households.

**Source record:** `ec44118c-3be1-46b1-9585-8f34d638bbd9` · `mini_market` / `households_served_by_the_cac_mini_market` · 2025 · exact value `2995` Number.

**Why it fits:** Ingredients for work lunches connect to household food access.

**Assistance boundary:** Context only; no workplace-lunch subsidy or new CAC choice.

**Interpretation:** Annual households; do not add overlapping populations or infer a food allocation.

<a id="d047"></a>

## D047 — A broken bag

**No suitable CAC fact:** No fact establishes bag replacement/repair; the general clothing program is insufficient.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d048"></a>

## D048 — Meals for Maya during a program period

**Proposed CAC fact:** In 2025, Meals for Kids served 1,097 children.

**Source record:** `9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01` · `meals_for_kids` / `children_served_by_meals_for_kids` · 2025 · exact value `1097` Number.

**Why it fits:** The scenario explicitly covers meals for a child during the program period.

**Assistance boundary:** Existing conditional child-food pathway; no childcare payment inferred.

**Interpretation:** Food-program context; not daycare or school-account bill payment.

<a id="d049"></a>

## D049 — Paying to access your own money

**Proposed CAC fact:** In 2025, 218 students enrolled in Financial Literacy Classes.

**Source record:** `d32689c8-067a-4f59-aa48-2424384b7116` · `financial_literacy_classes` / `students_enrolled_in_financial_literacy_classes` · 2025 · exact value `218` Number.

**Why it fits:** Comparing a fee-charging money-access route with a free route is financial-literacy context.

**Assistance boundary:** Context only; no claim that CAC pays fees or offers the payment instrument.

**Interpretation:** Education context only; no evidence of debt repayment, bank-fee coverage or measured savings.

<a id="d050"></a>

## D050 — A household hygiene purchase

**No suitable CAC fact:** No hygiene-supply assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d051"></a>

## D051 — An optional skills workshop

**Proposed CAC fact:** In 2025, CAC reported 610 total students in Adult Education programs.

**Source record:** `7cb64039-5726-43da-8f15-fbf8b63e8f83` · `adult_education` / `total_students_in_adult_education_programs` · 2025 · exact value `610` Number.

**Why it fits:** The card asks whether to invest money and time in optional learning.

**Assistance boundary:** Context only; CAC does not fund the private workshop or grant a qualification in this draft.

**Interpretation:** Do not sum overlapping course enrollments or infer completion, skill gains or employment.

<a id="d052"></a>

## D052 — A birthday plan for Maya

**No suitable CAC fact:** Holiday-program facts do not establish birthday-party support.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d053"></a>

## D053 — A holiday meal

**Proposed CAC fact:** In 2025, 984 households received Holiday Food Baskets.

**Source record:** `1eec83c9-41ca-4aef-be22-1e36289d9d95` · `holiday_food_baskets` / `households_who_received_holiday_food_baskets` · 2025 · exact value `984` Number.

**Why it fits:** The need is a distinct seasonal holiday food basket.

**Assistance boundary:** Existing conditional seasonal food pathway; no automatic current availability.

**Interpretation:** Seasonal program context; current availability and eligibility remain separate.

<a id="d054"></a>

## D054 — Replacing an everyday outfit

**Proposed CAC fact:** In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift.

**Source record:** `859b8cec-1e1c-4887-9f55-fd55f1bb349c` · `canopy_thrift` / `dollar_amount_of_client_credits_used_at_cac_canopy_thrift` · 2025 · exact value `206768.67` Dollars.

**Why it fits:** The decision concerns replacement clothing and a lower-cost alternative.

**Assistance boundary:** Existing conditional clothing pathway; no cash allocation or interview-state change.

**Interpretation:** Aggregate credits; not an individual credit balance or cash allowance.

<a id="d055"></a>

## D055 — Helping someone else while money is tight

**Proposed CAC fact:** In 2025, 218 students enrolled in Financial Literacy Classes.

**Source record:** `d32689c8-067a-4f59-aa48-2424384b7116` · `financial_literacy_classes` / `students_enrolled_in_financial_literacy_classes` · 2025 · exact value `218` Number.

**Why it fits:** Balancing help for another person against one’s own budget is financial-literacy context.

**Assistance boundary:** Context only; no CAC reimbursement, loan, or moral score.

**Interpretation:** Education context only; no evidence of debt repayment, bank-fee coverage or measured savings.

<a id="d056"></a>

## D056 — Hope for the Holidays

**Proposed CAC fact:** In 2025, Hope for the Holidays served 614 households.

**Source record:** `18b975be-96cb-49ec-901b-ccd04c6c6a5c` · `hope_for_the_holidays` / `households_served_by_hope_for_the_holidays` · 2025 · exact value `614` Number.

**Why it fits:** The card explicitly concerns the named holiday program and a child’s holiday gift.

**Assistance boundary:** Existing conditional holiday pathway; approved items and eligibility remain necessary.

**Interpretation:** Holiday-program context; no birthday benefit or cash gift allowance inferred.

<a id="d057"></a>

## D057 — A bus pass or individual fares

**No suitable CAC fact:** No general bus-pass/fare fact; workforce-specific transportation cannot be generalized to all personas.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d058"></a>

## D058 — Laundry supplies for the household

**No suitable CAC fact:** No laundry-detergent/supply assistance fact.

Keep the CAC slot unresolved. Do not fill it with an unrelated service or add an assistance option.

<a id="d059"></a>

## D059 — A low-cost break from the month

**Proposed CAC fact:** In 2025, 218 students enrolled in Financial Literacy Classes.

**Source record:** `d32689c8-067a-4f59-aa48-2424384b7116` · `financial_literacy_classes` / `students_enrolled_in_financial_literacy_classes` · 2025 · exact value `218` Number.

**Why it fits:** Choosing between a paid outing and a free alternative is a discretionary-budget tradeoff.

**Assistance boundary:** Context only; no claim of CAC leisure funding or a judgment about spending.

**Interpretation:** Education context only; no evidence of debt repayment, bank-fee coverage or measured savings.

<a id="d060"></a>

## D060 — Restocking food late in the month

**Proposed CAC fact:** In 2025, the CAC Mini-Market served 7,034 individuals.

**Source record:** `0a3f963a-b2c5-47d6-8b9d-e0d396da6a66` · `mini_market` / `individuals_served_by_the_cac_mini_market` · 2025 · exact value `7034` Number.

**Why it fits:** The scenario is a distinct late-month household food need.

**Assistance boundary:** Existing conditional food pathway; no personal allocation or duplicate grocery coverage.

**Interpretation:** Annual individuals; not a household allocation, meal count or combined-program total.
