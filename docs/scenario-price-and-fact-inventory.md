# Scenario prices and fact numbers

Prepared November 17, 2026. All 50 logical scenario cards are included.

This inventory compares the authored draft with the checked-in development SQL artifact. Development amounts are provisional where documented. The full fact templates retain unresolved fields. The development edition uses shorter context copy where observations remain pending. The source fact-verification flags remain historical review flags. These changes are prepared for deployment. Runtime database values were not queried.

Numbers listed under facts include years, counts, percentages, currency, and written numeric terms. Read the full sentence to identify the measure and population. Source URLs and binding identifiers are shown separately.

Use Find to search a scenario ID, subject, dollar amount, fact number, or source. The accompanying HTML provides search and filters.

## Scenario index

- [D001 Looking for work](#d001)
- [D002 An interview today](#d002)
- [D003 Back to the job search](#d003)
- [D004 Another interview](#d004)
- [D005 Time to file taxes](#d005)
- [D006 Rent is due](#d006)
- [D007 Keeping the lights on](#d007)
- [D008 The water bill](#d008)
- [D009 Staying connected](#d009)
- [D010 The internet bill](#d010)
- [D011 Car insurance is due](#d011)
- [D012 A clinic bill arrives](#d012)
- [D013 The childcare bill](#d013)
- [D014 Maya's school meal balance](#d014)
- [D015 The repair bill](#d015)
- [D018 The gas bill](#d018)
- [D019 Rent or a cash cushion?](#d019)
- [D020 A medical bill remains](#d020)
- [D021 The car will not start](#d021)
- [D022 An unexpected dental expense](#d022)
- [D024 A family emergency](#d024)
- [D025 Childcare falls through](#d025)
- [D026 Time for new tires](#d026)
- [D027 Broken work shoes](#d027)
- [D028 A plumbing problem](#d028)
- [D029 An unexpected appointment for Maya](#d029)
- [D030 A broken laptop](#d030)
- [D032 A larger share to cover](#d032)
- [D033 A damaged small kitchen appliance](#d033)
- [D034 A broken dresser](#d034)
- [D035 Groceries lost](#d035)
- [D036 A full grocery basket?](#d036)
- [D039 School Activities](#d039)
- [D040 Worn-out coat](#d040)
- [D042 School supplies for Maya](#d042)
- [D043 A family birthday](#d043)
- [D044 Getting to an appointment](#d044)
- [D045 A coat for Maya](#d045)
- [D046 Packing lunch or buying it?](#d046)
- [D047 A broken bag](#d047)
- [D048 Meals for Maya](#d048)
- [D049 A fee to access your money](#d049)
- [D050 Running low on essentials](#d050)
- [D051 A chance to learn](#d051)
- [D053 A holiday meal](#d053)
- [D054 Clothes need replacing](#d054)
- [D055 Someone asks for help](#d055)
- [D056 A holiday gift for Maya](#d056)
- [D058 Laundry supplies are running low](#d058)
- [D059 Time with a friend](#d059)

<a id="d001"></a>
## D001 Looking for work

Category — Employment & Adult Education. Household scope — ALL. Engine — employment.

You need work, and money is tight. Look through the job postings and decide where to apply.

Eligibility — Pre-game; household confirmed; starting skills configured.

Authored timing — pre-game; `non_scheduled`; numeric pre-game day unresolved.

### Prices fees and outcomes

Application has no immediate wage payment. Future weekly gross income comes from the selected edition’s approved job wage and configured weekly hours. Individual job amounts are loaded from the database and are not contained in this 60-card artifact.

**TARGET — Apply for {job_title}**

Authored financial expression — No immediate pay; record target job

Outcome — See response and engine rules.

Response — You submitted your application for {job_title}.

**PREP_TARGET — Take English and computer classes through CAC Adult Education, then apply for {job_title}**

Authored financial expression — CAC only; USD 0.00, free classes with no cash credit; set both run skill flags and preparation-completed state; record target job

Outcome — See response and engine rules.

Response — You completed English and computer classes through CAC Adult Education and submitted your application for {job_title}.

Baseline and price notes — Rule/source: existing OEWS job binding; configured hours/gross treatment. Free CAC service rule, not retail credit. Historical amounts audited: Application/preparation $0; future wage. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

Finding work can take time while everyday expenses continue.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Finding work can take time while everyday expenses continue. In {period}, {pct}% of Sandy Springs civilian labor-force participants were unemployed.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {period} · {pct}
Data binding — acs:B23025:unemployment
Sources — https://api.census.gov/data/2024/acs/acs5/groups.html

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “Finding work can take time while everyday expenses continue. In {period}, {pct}% of Sandy Springs civilian labor-force participants were unemployed.”

**General fact semantic key:** `acs:B23025:unemployment`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B23025. Unemployed / civilian labor force; exclude armed forces. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (fact)

Building skills can be one part of preparing for the search for work. In 2025, CAC reported 610 total students in Adult Education programs.

Numbers in that text — one · 2025, · 610
Snapshot value — 610 Number. Reporting year 2025. Measure — total students in Adult Education programs.

**Authored full fact or template**

Building skills can be one part of preparing for the search for work. In 2025, CAC reported 610 total students in Adult Education programs.

Numbers in authored text — one · 2025, · 610
Unresolved fields — None.
Data binding — 7cb64039-5726-43da-8f15-fbf8b63e8f83
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Building skills can be one part of preparing for the search for work. In 2025, CAC reported 610 total students in Adult Education programs.”

Source: S18/S19; fact ID `7cb64039-5726-43da-8f15-fbf8b63e8f83`; service `adult_education`; key `total_students_in_adult_education_programs`; reporting year 2025; exact stored value `610` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The choice explicitly includes adult English/computer preparation before selecting a job. Conditional free CAC preparation; USD 0.00, no cash credit. Course totals do not determine skills, eligibility or wages.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D001 — Looking for work

**Baseline evidence and disposition (November 7):** Rule/source: existing OEWS job binding; configured hours/gross treatment. Free CAC service rule, not retail credit. Historical amounts audited: Application/preparation $0; future wage. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d001)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| TARGET — Apply for {job_title} | No immediate pay; record target job |
| PREP_TARGET — Take English and computer classes through CAC Adult Education, then apply for {job_title} | CAC only; USD 0.00, free classes with no cash credit; set both run skill flags and preparation-completed state; record target job |

**Recommended source/method:** Existing BLS OEWS API importer via A01 (S24); S10 is the file fallback/reference. Reuse the implemented wage binding; do not inflation-index wages in parallel. **Candidate index category:** none. **Required definition:** Bind every eligible job to occupation, area, wage year, hours and gross/net treatment; preserve configured pay schedule.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Finding work can take time while everyday expenses continue. In {period}, {pct}% of Sandy Springs civilian labor-force participants were unemployed.”

**General fact semantic key:** `acs:B23025:unemployment`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B23025. Unemployed / civilian labor force; exclude armed forces. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Building skills can be one part of preparing for the search for work. In 2025, CAC reported 610 total students in Adult Education programs.”

Source: S18/S19; fact ID `7cb64039-5726-43da-8f15-fbf8b63e8f83`; service `adult_education`; key `total_students_in_adult_education_programs`; reporting year 2025; exact stored value `610` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The choice explicitly includes adult English/computer preparation before selecting a job. Conditional free CAC preparation; USD 0.00, no cash credit. Course totals do not determine skills, eligibility or wages.

</details>

<a id="d002"></a>
## D002 An interview today

Category — Employment & Adult Education. Household scope — ALL. Engine — employment.

Your interview is today. What will you wear?

Eligibility — Fixed Day 2; target job selected.

Authored timing — fixed Day 2; `scheduled`; `default_day=2`.

### Prices fees and outcomes

Employment engine clothing purchase $60.00. Current clothes, CAC clothing, and reuse have $0.00 immediate cash cost when eligible. Owned professional clothes are reused without a second purchase.

**BUY — Buy professional clothes**

Authored financial expression — Approved USD -60.00; own professional clothes

Outcome — See response and engine rules.

Response — You bought professional clothes for the interview.

**CURRENT — Make my current clothes work**

Authored financial expression — USD 0.00; do not create professional-clothing ownership

Outcome — See response and engine rules.

Response — You wore your current clothes to the interview.

**CAC — Get professional clothes using credits from CAC Canopy Thrift**

Authored financial expression — CAC only; approved scripted in-kind clothing pathway, USD 0.00 net; own professional clothes

Outcome — See response and engine rules.

Response — You used credits from CAC Canopy Thrift to get professional clothes for the interview.

Baseline and price notes — User-approved November 15 starting outfit cost USD 60.00, updated monthly using apparel CPI. Reuse has zero additional cost.

#### General fact

**Development edition text** (context)

An interview can bring hope and another expense when you need something to wear.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

An interview can bring hope and another expense when you need something to wear. In the past year, the average price of apparel {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SAA
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “An interview can bring hope and another expense when you need something to wear. In the past year, the average price of apparel {change} by {pct}%.”

**General fact semantic key:** `cpi:SAA`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SAA. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (fact)

Clothing can be an important part of looking professional. In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift to receive essential clothing.

Numbers in that text — 2025, · $206,768.67
Snapshot value — 206768.67 Dollars. Reporting year 2025. Measure — dollar amount of client credits used at CAC Canopy Thrift.

**Authored full fact or template**

Clothing can be an important part of looking professional. In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift to receive essential clothing.

Numbers in authored text — 2025, · $206,768.67
Unresolved fields — None.
Data binding — 859b8cec-1e1c-4887-9f55-fd55f1bb349c
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Clothing can be an important part of looking professional. In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift to receive essential clothing.”

Source: S18/S19; fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`; service `canopy_thrift`; key `dollar_amount_of_client_credits_used_at_cac_canopy_thrift`; reporting year 2025; exact stored value `206768.67` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Professional-clothing costs connect directly to the client-credit program. Existing conditional clothing pathway; annual credit does not set its amount.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D002 — An interview today

**Baseline evidence and disposition (November 15, 2026):** User-approved November 15 starting outfit cost USD 60.00, updated monthly using apparel CPI. Reuse has zero additional cost.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d002)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| BUY — Buy professional clothes | Approved USD -60.00; own professional clothes |
| CURRENT — Make my current clothes work | USD 0.00; do not create professional-clothing ownership |
| CAC — Get professional clothes using credits from CAC Canopy Thrift | CAC only; approved scripted in-kind clothing pathway, USD 0.00 net; own professional clothes |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** apparel. **Required definition:** Define and verify the interview outfit baseline, then automatically recalculate from the approved apparel index on monthly maintenance; replace the previous permanent $60 rule. D004 shares this binding.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “An interview can bring hope and another expense when you need something to wear. In the past year, the average price of apparel {change} by {pct}%.”

**General fact semantic key:** `cpi:SAA`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SAA. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Clothing can be an important part of looking professional. In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift to receive essential clothing.”

Source: S18/S19; fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`; service `canopy_thrift`; key `dollar_amount_of_client_credits_used_at_cac_canopy_thrift`; reporting year 2025; exact stored value `206768.67` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Professional-clothing costs connect directly to the client-credit program. Existing conditional clothing pathway; annual credit does not set its amount.

</details>

<a id="d003"></a>
## D003 Back to the job search

Category — Employment & Adult Education. Household scope — ALL. Engine — employment.

The interview did not lead to a job. You still need work. Where will you apply next?

Eligibility — Fixed Day 2 immediately after a failed interview and its result.

Authored timing — fixed Day 2 immediately after failed D002 and its result; `scheduled`; `default_day=2`. This is the approved exception to one scenario event per day.

### Prices fees and outcomes

Application has no immediate wage payment. Future weekly gross income comes from the selected edition’s approved job wage and configured weekly hours. Individual job amounts are loaded from the database and are not contained in this 60-card artifact.

**OTHER_JOB — Apply for {job_title}**

Authored financial expression — USD 0.00; record new target, preserve preparation/clothing

Outcome — Direct effect or engine rule

Response — You submitted your application for {job_title}.

Baseline and price notes — Rule/source: reuse OEWS binding; no application charge. Historical amounts audited: Application $0; future wage. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

After an unsuccessful interview, the search continues.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

After an unsuccessful interview, the search continues. In {period}, {pct}% of Sandy Springs residents age 16 and older were not in the labor force.

Numbers in authored text — 16
Unresolved fields — {period} · {pct}
Data binding — acs:B23025:not_in_labor_force
Sources — https://api.census.gov/data/2024/acs/acs5/groups/B23025.json

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “After an unsuccessful interview, the search continues. In {period}, {pct}% of Sandy Springs residents age 16 and older were not in the labor force.”

**General fact semantic key:** `acs:B23025:not_in_labor_force`

Source/update: https://api.census.gov/data/2024/acs/acs5/groups/B23025.json. Annual ACS five-year not-in-labor-force estimate, B23025_007E / B23025_001E, Georgia place 68516. Refreshed monthly when a new annual release becomes available. Approved revision from facts fixes.docx, November 15, 2026.


</details>

#### CAC fact

**Development edition text** (fact)

Career support connects with the effort of finding your next opportunity. In 2025, the Empowerment Center's Career Services helped 229 people.

Numbers in that text — 2025, · 229
Snapshot value — 229 Number. Reporting year 2025. Measure — people helped by Career Services.

**Authored full fact or template**

Career support connects with the effort of finding your next opportunity. In 2025, the Empowerment Center's Career Services helped 229 people.

Numbers in authored text — 2025, · 229
Unresolved fields — None.
Data binding — db12c137-fad7-4277-b4ca-6a203b344e38
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Career support connects with the effort of finding your next opportunity. In 2025, the Empowerment Center's Career Services helped 229 people.”

Source: S18/S19; fact ID `db12c137-fad7-4277-b4ca-6a203b344e38`; service `career_services`; key `people_helped_by_career_services`; reporting year 2025; exact stored value `229` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Reapplying after an unsuccessful interview is directly relevant to career support. Context only; retain no CAC choice and no automatic job placement.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D003 — Back to the job search

**Baseline evidence and disposition (November 7):** Rule/source: reuse OEWS binding; no application charge. Historical amounts audited: Application $0; future wage. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d003)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| OTHER_JOB — Apply for {job_title} | USD 0.00; record new target, preserve preparation/clothing |

**Recommended source/method:** Existing BLS OEWS API importer via A01 (S24); S10 is the file fallback/reference. Reuse the implemented wage binding; do not inflation-index wages in parallel. **Candidate index category:** none. **Required definition:** Reuse the selected job wage binding; applications cost zero.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “After an unsuccessful interview, the search continues. In {period}, {pct}% of Sandy Springs residents age 16 and older were not in the labor force.”

**General fact semantic key:** `acs:B23025:not_in_labor_force`

Source/update: https://api.census.gov/data/2024/acs/acs5/groups/B23025.json. Annual ACS five-year not-in-labor-force estimate, B23025_007E / B23025_001E, Georgia place 68516. Refreshed monthly when a new annual release becomes available. Approved revision from facts fixes.docx, November 15, 2026.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Career support connects with the effort of finding your next opportunity. In 2025, the Empowerment Center's Career Services helped 229 people.”

Source: S18/S19; fact ID `db12c137-fad7-4277-b4ca-6a203b344e38`; service `career_services`; key `people_helped_by_career_services`; reporting year 2025; exact stored value `229` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Reapplying after an unsuccessful interview is directly relevant to career support. Context only; retain no CAC choice and no automatic job placement.

</details>

<a id="d004"></a>
## D004 Another interview

Category — Employment & Adult Education. Household scope — ALL. Engine — employment.

You have another interview today. What will you wear?

Eligibility — Fixed Day 3 only after failed Day 2 and a different target selected.

Authored timing — conditional fixed Day 3; `scheduled`; `default_day=3`. No unrelated scenario shares this interview day.

### Prices fees and outcomes

Employment engine clothing purchase $60.00. Current clothes, CAC clothing, and reuse have $0.00 immediate cash cost when eligible. Owned professional clothes are reused without a second purchase.

**REUSE — Wear my professional clothes**

Authored financial expression — Only choice if already owned; USD 0.00

Outcome — See response and engine rules.

Response — You wore the professional clothes you already had. You got the job as {job_title}.

**BUY — Buy professional clothes**

Authored financial expression — Only if not owned; approved USD -60.00; set ownership

Outcome — See response and engine rules.

Response — You bought professional clothes for the interview. You got the job as {job_title}.

**CURRENT — Make my current clothes work**

Authored financial expression — Only if not owned; USD 0.00

Outcome — See response and engine rules.

Response — You wore your current clothes to the interview. You got the job as {job_title}.

**CAC — Get professional clothes using credits from CAC Canopy Thrift**

Authored financial expression — Only if not owned, CAC mode and eligible; USD 0.00 net; set ownership

Outcome — See response and engine rules.

Response — You used credits from CAC Canopy Thrift to get professional clothes. You got the job as {job_title}.

Baseline and price notes — Reuse the edition-bound D002 clothing price and ownership. Starting purchase USD 60.00, apparel CPI updates. Owned clothes have no second charge.

#### General fact

**Development edition text** (context)

Another interview can mean more time spent traveling and preparing, while keeping other needs in view.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Another interview can mean more time spent traveling and preparing, while keeping other needs in view. In {period}, {pct}% of Sandy Springs workers who traveled to work had a commute of at least 60 minutes.

Numbers in authored text — 60
Unresolved fields — {period} · {pct}
Data binding — acs:B08303:long_commute
Sources — https://api.census.gov/data/2024/acs/acs5/groups.html

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “Another interview can mean more time spent traveling and preparing, while keeping other needs in view. In {period}, {pct}% of Sandy Springs workers who traveled to work had a commute of at least 60 minutes.”

**General fact semantic key:** `acs:B08303:long_commute`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B08303. Sum nonoverlapping 60+ minute brackets / workers with a reported journey to work; exclude home workers. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (fact)

In 2025, the CAC reported 80 job placements, helping people support themselves financially.

Numbers in that text — 2025, · 80
Snapshot value — 80 Number. Reporting year 2025. Measure — job placements.

**Authored full fact or template**

In 2025, the CAC reported 80 job placements, helping people support themselves financially.

Numbers in authored text — 2025, · 80
Unresolved fields — None.
Data binding — 2675ebbd-e014-4506-a0fd-1130a9ffe692
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “In 2025, the CAC reported 80 job placements, helping people support themselves financially.”

Source: S18/S19; fact ID `2675ebbd-e014-4506-a0fd-1130a9ffe692`; service `career_services`; key `job_placements`; reporting year 2025; exact stored value `80` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. A follow-up interview is relevant to the reported job-placement outcome. Existing conditional clothing pathway is unchanged; placements do not determine scripted hiring.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D004 — Another interview

**Baseline evidence and disposition (November 15, 2026):** Reuse the edition-bound D002 clothing price and ownership. Starting purchase USD 60.00, apparel CPI updates. Owned clothes have no second charge.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d004)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| REUSE — Wear my professional clothes | Only choice if already owned; USD 0.00 |
| BUY — Buy professional clothes | Only if not owned; approved USD -60.00; set ownership |
| CURRENT — Make my current clothes work | Only if not owned; USD 0.00 |
| CAC — Get professional clothes using credits from CAC Canopy Thrift | Only if not owned, CAC mode and eligible; USD 0.00 net; set ownership |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** apparel. **Required definition:** Reuse the same outfit and ownership binding as D002; no second charge for owned clothing.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Another interview can mean more time spent traveling and preparing, while keeping other needs in view. In {period}, {pct}% of Sandy Springs workers who traveled to work had a commute of at least 60 minutes.”

**General fact semantic key:** `acs:B08303:long_commute`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B08303. Sum nonoverlapping 60+ minute brackets / workers with a reported journey to work; exclude home workers. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “In 2025, the CAC reported 80 job placements, helping people support themselves financially.”

Source: S18/S19; fact ID `2675ebbd-e014-4506-a0fd-1130a9ffe692`; service `career_services`; key `job_placements`; reporting year 2025; exact stored value `80` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. A follow-up interview is relevant to the reported job-placement outcome. Existing conditional clothing pathway is unchanged; placements do not determine scripted hiring.

</details>

<a id="d005"></a>
## D005 Time to file taxes

Category — Financial Literacy & Taxes. Household scope — ALL. Engine — ordinary.

It is time to file your taxes. Will you handle the return yourself or get help preparing it?

Eligibility — Non-scheduled; proposed Day 18; not previously filed.

Authored timing — Required once per playthrough; scheduled ordinary-day slot, exact day pending. See the required-occurrence decision below.

### Prices fees and outcomes

Tax preparation starts at $250.00 upfront and follows CPI. PolicyEngine will supply the household EITC after credentials and the refresh are installed. This baseline artifact still uses the provisional $1,000.00 credit. The IRS recipient-average fact is a separate measure.

**TRY — Try my best**

Authored financial expression — Approved USD 0.00; no refund/deduction

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — Direct effect or engine rule

Response — You filed your taxes yourself. You received no refund and paid no preparation fee.

**PAID — Pay someone to prepare taxes**

Authored financial expression — Approved starting fee F = USD 250.00; require balance ≥ F; monthly CPI fee and all-items-CPI-adjusted household tax credit R; charge -F and credit +R once

Development balance change — +$739.00. Upfront requirement — $250.00. CAC-only — No.

Outcome — Direct effect or engine rule

Response — You paid the preparation fee and received your tax credit.

**CAC — Get free tax preparation through CAC's VITA program**

Authored financial expression — CAC only; no preparation fee; apply the all-items-CPI-adjusted household tax credit R once

Development balance change — +$989.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Direct effect or engine rule

Response — You filed your taxes through CAC's free VITA program and received your tax credit.

Baseline and price notes — User-approved starting preparation fee USD 250.00, updated through tax-return-preparation CPI SS68023. The fixed simulation credit is USD 989 for Alex, Sofia and Patricia, and a recommended USD 1989 for Jordan and Maya. This replaces the former USD 1000 amount. The observed IRS recipient-average fact retains its stated year.

#### General fact

**Development edition text** (fact)

The Earned Income Tax Credit can help working households keep more of their income. In tax year 2024, recipients nationwide received an average EITC of $2,894.

Numbers in that text — 2024, · $2,894

**Authored full fact or template**

The Earned Income Tax Credit can help working households keep more of their income. In tax year 2024, recipients nationwide received an average EITC of $2,894.

Numbers in authored text — 2024, · $2,894
Unresolved fields — None.
Data binding — irs:average_eitc
Sources — https://www.irs.gov/tax-professionals/eitc-central/statistics-for-tax-returns-with-the-earned-income-tax-credit-eitc

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “The Earned Income Tax Credit can help working households keep more of their income. In tax year 2024, recipients nationwide received an average EITC of $2,894.”

**General fact semantic key:** `irs:average_eitc`

Source/update: https://www.irs.gov/tax-professionals/eitc-central/statistics-for-tax-returns-with-the-earned-income-tax-credit-eitc. IRS recipient average, tax year 2024 processed in 2025. Retain this dated IRS observation without automatic website requests. The simulation uses authored credit amounts, independently of this observed national average. Approved revision from facts fixes.docx, November 15, 2026.


</details>

#### CAC fact

**Development edition text** (fact)

Tax preparation can connect households with money back at filing time. In 2025, CAC reported 503 tax returns through VITA and $672,056 in combined federal and state refunds.

Numbers in that text — 2025, · 503 · $672,056

**Authored full fact or template**

Tax preparation can connect households with money back at filing time. In 2025, CAC reported 503 tax returns through VITA and $672,056 in combined federal and state refunds.

Numbers in authored text — 2025, · 503 · $672,056
Unresolved fields — None.
Data binding — cac:vita:2025:returns_and_refunds
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Tax preparation can connect households with money back at filing time. In 2025, CAC reported 503 tax returns through VITA and $672,056 in combined federal and state refunds.”

**CAC fact semantic key:** `cac:vita:2025:returns_and_refunds`

**Composite CAC fact sources:** S18/S19; service `vita`; 2025 return-count record `5b9132c2-90d6-4dea-9dc0-f2de13a89e2f` = 503 Number; federal-refund record `7f25dabd-f5a5-4a54-9201-fd5f3ccd173d` = USD 582083; state-refund record `d4d72fe4-20b1-4a1b-97a4-dea745b7e4f7` = USD 89973. Derived total: 582083 + 89973 = USD 672056. This is one player-facing CAC passage backed by three observations, not three fact slots. Require matching reporting years, compatible scopes and complete inputs before automatically updating the passage; never add tax-credit totals to refunds, divide this total by 503, or infer 503 unique recipients. Count and refund observations are reported program measures, not a verified matched cohort. Exact original source verification remains pending; the snapshot verifies the stored figures. The passage does not set the simulated household refund. Historical pairing files remain the earlier single-record proposal; this composite supersedes it for D005 final binding.

**Required occurrence - user decision, November 7, 2026:** D005 is mandatory once in every playthrough, in both support modes and for every persona. Reserve a scheduled ordinary-day slot; it must not be omitted by random selection, selected again, or collide with employment events. This supersedes earlier non-scheduled/optional sampling instructions for D005. The exact due day remains to be configured; the earlier Day 18 is a proposal, not a newly approved day. Early-ended runs cannot show later days: they may end before reaching the reserved tax event, but every complete route must include it. Existing early-ending rules are unchanged. If literal display before every possible early ending is required, its placement needs a separate explicit change; no new pre-game event is inferred. Verify exactly-once inclusion, all personas/modes, routing and refresh restoration. This is a documentation requirement; scheduling is not implemented here.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D005 — Time to file taxes

**Baseline evidence and disposition (November 15, 2026):** User-approved starting preparation fee USD 250.00, updated through tax-return-preparation CPI SS68023. The fixed simulation credit is USD 989 for Alex, Sofia and Patricia, and a recommended USD 1989 for Jordan and Maya. This replaces the former USD 1000 amount. The observed IRS recipient-average fact retains its stated year.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d005)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| TRY — Try my best | Approved USD 0.00; no refund/deduction |
| PAID — Pay someone to prepare taxes | UNRESOLVED approved fee F; require balance ≥ F before charging -F and immediately crediting authored household credit R once |
| CAC — Get free tax preparation through CAC's VITA program | CAC only; no player-paid fee; authored household credit R once |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** tax preparation services, if available; otherwise all items. **Required definition:** Quote return complexity and provider fee; give the refund a separate automatically recalculated binding. Proposed simulation-only fallback: approve a November 2026 refund baseline and all-items CPI anchor, then recalculate monthly by the index ratio. The former $1,000 is a candidate baseline requiring review, not a permanent amount or an actual tax entitlement. A real tax calculation would instead require household tax inputs and maintained tax rules; that method is not selected here.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “The Earned Income Tax Credit can help working households keep more of their income. In tax year 2024, recipients nationwide received an average EITC of $2,894.”

**General fact semantic key:** `irs:average_eitc`

Source/update: https://www.irs.gov/tax-professionals/eitc-central/statistics-for-tax-returns-with-the-earned-income-tax-credit-eitc. IRS recipient average, tax year 2024 processed in 2025. Retain this dated IRS observation without automatic website requests. The simulation uses authored credit amounts, independently of this observed national average. Approved revision from facts fixes.docx, November 15, 2026.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Tax preparation can connect households with money back at filing time. In 2025, CAC reported 503 tax returns through VITA and $672,056 in combined federal and state refunds.”

**CAC fact semantic key:** `cac:vita:2025:returns_and_refunds`

**Composite CAC fact sources:** S18/S19; service `vita`; 2025 return-count record `5b9132c2-90d6-4dea-9dc0-f2de13a89e2f` = 503 Number; federal-refund record `7f25dabd-f5a5-4a54-9201-fd5f3ccd173d` = USD 582083; state-refund record `d4d72fe4-20b1-4a1b-97a4-dea745b7e4f7` = USD 89973. Derived total: 582083 + 89973 = USD 672056. This is one player-facing CAC passage backed by three observations, not three fact slots. Require matching reporting years, compatible scopes and complete inputs before automatically updating the passage; never add tax-credit totals to refunds, divide this total by 503, or infer 503 unique recipients. Count and refund observations are reported program measures, not a verified matched cohort. Exact original source verification remains pending; the snapshot verifies the stored figures. The passage does not set the simulated household refund. Historical pairing files remain the earlier single-record proposal; this composite supersedes it for D005 final binding.

**Required occurrence - user decision, November 7, 2026:** D005 is mandatory once in every playthrough, in both support modes and for every persona. Reserve a scheduled ordinary-day slot; it must not be omitted by random selection, selected again, or collide with employment events. This supersedes earlier non-scheduled/optional sampling instructions for D005. The exact due day remains to be configured; the earlier Day 18 is a proposal, not a newly approved day. Early-ended runs cannot show later days: they may end before reaching the reserved tax event, but every complete route must include it. Existing early-ending rules are unchanged. If literal display before every possible early ending is required, its placement needs a separate explicit change; no new pre-game event is inferred. Verify exactly-once inclusion, all personas/modes, routing and refresh restoration. This is a documentation requirement; scheduling is not implemented here.

</details>

<a id="d006"></a>
## D006 Rent is due

Category — Housing & Utilities. Household scope — ALL. Engine — bill.

Rent is due. Paying it will leave less money for groceries, transportation, and everything else.

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

Development bill principal — Alex $693.50; Sofia $868.50; Jordan $1,737.00; Patricia $1,387.00. Due Day 6. One-time Ignore late fee $35.00.

The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.

**D006-PAY — Pay the bill**

Authored financial expression — -$650.00

Outcome — settle_current_bill

Response — You paid the bill.

**D006-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

**D006-CAC — Get rent assistance through CAC**

Authored financial expression — UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense

Outcome — Apply one approved capped effect; record only actual help used

Response — You received help through CAC rent assistance. Your payment: {player_payment_usd}. Remaining balance on this expense: {remaining_expense_usd}.

Baseline and price notes — RentCast ZIP 30328 bedroom-specific average listed rent, allocated using documented household shares. One markets request per month. Starting late fee USD 35.00 follows all-items CPI.

#### General fact

**Development edition text** (context)

When rent comes due, keeping a roof over your head can leave less for everything else.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

When rent comes due, keeping a roof over your head can leave less for everything else. In {period}, {pct}% of Sandy Springs renter households with a reported rent-to-income ratio spent at least 30% of their income on gross rent.

Numbers in authored text — 30%
Unresolved fields — {period} · {pct}
Data binding — acs:B25070:rent_burden
Sources — https://api.census.gov/data/2024/acs/acs5/groups.html

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “When rent comes due, keeping a roof over your head can leave less for everything else. In {period}, {pct}% of Sandy Springs renter households with a reported rent-to-income ratio spent at least 30% of their income on gross rent.”

**General fact semantic key:** `acs:B25070:rent_burden`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B25070. Sum 30%+ brackets / computed-ratio households; retain MOEs. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (fact)

Keeping housing stable is at the heart of CAC eviction prevention. In 2025, CAC reported preventing evictions for 1,108 households.

Numbers in that text — 2025, · 1,108
Snapshot value — 1108 Number. Reporting year 2025. Measure — evictions prevented.

**Authored full fact or template**

Keeping housing stable is at the heart of CAC eviction prevention. In 2025, CAC reported preventing evictions for 1,108 households.

Numbers in authored text — 2025, · 1,108
Unresolved fields — None.
Data binding — 5fa2bac7-6016-4db8-b705-fc593f6b75ec
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Keeping housing stable is at the heart of CAC eviction prevention. In 2025, CAC reported preventing evictions for 1,108 households.”

Source: S18/S19; fact ID `5fa2bac7-6016-4db8-b705-fc593f6b75ec`; service `eviction_prevention`; key `evictions_prevented`; reporting year 2025; exact stored value `1108` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The obligation is rent and the fact is specifically about eviction prevention. Existing conditional rent pathway; no eligibility or coverage amount inferred.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D006 — Rent is due

**Baseline evidence and disposition (November 15, 2026):** RentCast ZIP 30328 bedroom-specific average listed rent, allocated using documented household shares. One markets request per month. Starting late fee USD 35.00 follows all-items CPI.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d006)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D006-PAY — Pay the bill | -$650.00 |
| D006-IGNORE — Ignore the bill for now | $0.00 |
| D006-CAC — Get rent assistance through CAC | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense |

**Bill components (draft; fee policy unapproved):** Ignore records principal $650.00 + proposed late fee $35.00 = **$685.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S06; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** rent of primary residence. **Required definition:** Select ZIP/bedrooms and household rent share; avoid double-counting utilities included in gross rent.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. CAC bill cap A, eligibility and availability require CAC-approved records (S18/S19 plus new operational evidence); retain the approved capped formula. 

**General fact (separate from price)**

**Player-facing general fact template:** “When rent comes due, keeping a roof over your head can leave less for everything else. In {period}, {pct}% of Sandy Springs renter households with a reported rent-to-income ratio spent at least 30% of their income on gross rent.”

**General fact semantic key:** `acs:B25070:rent_burden`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B25070. Sum 30%+ brackets / computed-ratio households; retain MOEs. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Keeping housing stable is at the heart of CAC eviction prevention. In 2025, CAC reported preventing evictions for 1,108 households.”

Source: S18/S19; fact ID `5fa2bac7-6016-4db8-b705-fc593f6b75ec`; service `eviction_prevention`; key `evictions_prevented`; reporting year 2025; exact stored value `1108` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The obligation is rent and the fact is specifically about eviction prevention. Existing conditional rent pathway; no eligibility or coverage amount inferred.

</details>

<a id="d007"></a>
## D007 Keeping the lights on

Category — Housing & Utilities. Household scope — ALL. Engine — bill.

The electricity bill is due. Your household still needs groceries and transportation this month. Which obligation will you carry?

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

Development bill principal — $145.00. Due Day 12. One-time Ignore late fee $10.00.

The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.

**D007-PAY — Pay the bill**

Authored financial expression — -$145.00

Outcome — settle_current_bill

Response — You paid the bill.

**D007-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

**D007-CAC — Get help paying the electricity bill through CAC eviction prevention**

Authored financial expression — UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense

Outcome — Apply one approved capped bill-support effect; record only actual help used

Response — You received help paying the electricity bill through CAC eviction prevention. Your payment: {player_payment_usd}. Remaining balance on this expense: {remaining_expense_usd}.

Baseline and price notes — Monthly Georgia residential average bill from EIA revenue in million dollars multiplied by 1000000 and divided by residential customer count. The general fact uses the identical observation.

#### General fact

**Development edition text** (context)

Electricity keeps a household running.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Electricity keeps a household running. In {period}, Georgia residential electricity customers paid an average monthly bill of ${monthly_bill}, calculated from EIA residential revenue and customer counts.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {period} · {monthly_bill}
Data binding — eia:GA:residential_monthly_bill
Sources — https://api.eia.gov/v2/electricity/retail-sales/

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “Electricity keeps a household running. In {period}, Georgia residential electricity customers paid an average monthly bill of ${monthly_bill}, calculated from EIA residential revenue and customer counts.”

**General fact semantic key:** `eia:GA:residential_monthly_bill`

Source/update: https://api.eia.gov/v2/electricity/retail-sales/. Use monthly residential Georgia revenue in million dollars divided by residential customer count, multiplied by 1,000,000. This is a Georgia customer average, not a Sandy Springs tariff. Bill amount and fact use the same observation. Approved revision from facts fixes.docx, November 15, 2026.


</details>

#### CAC fact

**Development edition text** (fact)

Utilities and rent draw on the money needed to keep a home. In 2025, CAC reported preventing evictions for 1,108 households.

Numbers in that text — 2025, · 1,108
Snapshot value — 1108 Number. Reporting year 2025. Measure — evictions prevented.

**Authored full fact or template**

Utilities and rent draw on the money needed to keep a home. In 2025, CAC reported preventing evictions for 1,108 households.

Numbers in authored text — 2025, · 1,108
Unresolved fields — None.
Data binding — 5fa2bac7-6016-4db8-b705-fc593f6b75ec
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Utilities and rent draw on the money needed to keep a home. In 2025, CAC reported preventing evictions for 1,108 households.”

Source: S18/S19; fact ID `5fa2bac7-6016-4db8-b705-fc593f6b75ec`; service `eviction_prevention`; key `evictions_prevented`; reporting year 2025; exact stored value `1108` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Electricity costs compete with rent and other essentials, connecting this decision to housing stability and eviction prevention. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D007 — Keeping the lights on

**Baseline evidence and disposition (November 15, 2026):** Monthly Georgia residential average bill from EIA revenue in million dollars multiplied by 1000000 and divided by residential customer count. The general fact uses the identical observation.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d007)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D007-PAY — Pay the bill | -$145.00 |
| D007-IGNORE — Ignore the bill for now | $0.00 |
| D007-CAC — Get help paying the electricity bill through CAC eviction prevention | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense |

**Bill components (draft; fee policy unapproved):** Ignore records principal $145.00 + proposed late fee $10.00 = **$155.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S08/S14; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** electricity. **Required definition:** Choose actual supplier tariff or GA residential benchmark; bind kWh, fixed charges, taxes and billing period.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. CAC bill cap A, eligibility and availability require CAC-approved records (S18/S19 plus new operational evidence); retain the approved capped formula. 

**General fact (separate from price)**

**Player-facing general fact template:** “Electricity keeps a household running. In {period}, Georgia residential electricity customers paid an average monthly bill of ${monthly_bill}, calculated from EIA residential revenue and customer counts.”

**General fact semantic key:** `eia:GA:residential_monthly_bill`

Source/update: https://api.eia.gov/v2/electricity/retail-sales/. Use monthly residential Georgia revenue in million dollars divided by residential customer count, multiplied by 1,000,000. This is a Georgia customer average, not a Sandy Springs tariff. Bill amount and fact use the same observation. Approved revision from facts fixes.docx, November 15, 2026.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Utilities and rent draw on the money needed to keep a home. In 2025, CAC reported preventing evictions for 1,108 households.”

Source: S18/S19; fact ID `5fa2bac7-6016-4db8-b705-fc593f6b75ec`; service `eviction_prevention`; key `evictions_prevented`; reporting year 2025; exact stored value `1108` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Electricity costs compete with rent and other essentials, connecting this decision to housing stability and eviction prevention. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.

</details>

<a id="d008"></a>
## D008 The water bill

Category — Housing & Utilities. Household scope — ALL. Engine — bill.

A water and sewer bill arrives. It is smaller than rent, but paying every small bill still adds up.

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

Development bill principal — $68.00. Due Day 27. One-time Ignore late fee $8.00.

The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.

**D008-PAY — Pay the bill**

Authored financial expression — -$68.00

Outcome — settle_current_bill

Response — You paid the bill.

**D008-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

**D008-CAC — Get help paying the water and sewer bill through CAC eviction prevention**

Authored financial expression — UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense

Outcome — Apply one approved capped bill-support effect; record only actual help used

Response — You received help paying the water and sewer bill through CAC eviction prevention. Your payment: {player_payment_usd}. Remaining balance on this expense: {remaining_expense_usd}.

Baseline and price notes — Retain the USD 68.00 water baseline and update using BLS water/sewerage CPI CUUR0000SEHG01, the same price category used for the fact.

#### General fact

**Development edition text** (context)

A water bill is another essential expense competing for the money you have.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

A water bill is another essential expense competing for the money you have. In the past year, the average price of water and sewerage maintenance {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SEHG01
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “A water bill is another essential expense competing for the money you have. In the past year, the average price of water and sewerage maintenance {change} by {pct}%.”

**General fact semantic key:** `cpi:SEHG01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEHG01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (fact)

Water and sewer costs share the household budget with rent and other essentials. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.

Numbers in that text — 2025, · $796,416.64
Snapshot value — 796416.64 Dollars. Reporting year 2025. Measure — total financial assistance amount to prevent homelessness.

**Authored full fact or template**

Water and sewer costs share the household budget with rent and other essentials. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.

Numbers in authored text — 2025, · $796,416.64
Unresolved fields — None.
Data binding — b697ae84-1fd2-4bae-83da-7a10c983ac24
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Water and sewer costs share the household budget with rent and other essentials. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.”

Source: S18/S19; fact ID `b697ae84-1fd2-4bae-83da-7a10c983ac24`; service `financial_assistance`; key `amount_paid_through_financial_assistance`; reporting year 2025; exact stored value `796416.64` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Water and sewer costs are part of household housing pressure, providing context for financial assistance to prevent homelessness. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D008 — The water bill

**Baseline evidence and disposition (November 15, 2026):** Retain the USD 68.00 water baseline and update using BLS water/sewerage CPI CUUR0000SEHG01, the same price category used for the fact.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d008)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D008-PAY — Pay the bill | -$68.00 |
| D008-IGNORE — Ignore the bill for now | $0.00 |
| D008-CAC — Get help paying the water and sewer bill through CAC eviction prevention | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense |

**Bill components (draft; fee policy unapproved):** Ignore records principal $68.00 + proposed late fee $8.00 = **$76.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S14; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** water and sewer maintenance. **Required definition:** Confirm address-specific water/sewer tariffs, meter, tiered consumption and fixed charges separately.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. CAC bill cap A, eligibility and availability require CAC-approved records (S18/S19 plus new operational evidence); retain the approved capped formula. 

**General fact (separate from price)**

**Player-facing general fact template:** “A water bill is another essential expense competing for the money you have. In the past year, the average price of water and sewerage maintenance {change} by {pct}%.”

**General fact semantic key:** `cpi:SEHG01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEHG01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Water and sewer costs share the household budget with rent and other essentials. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.”

Source: S18/S19; fact ID `b697ae84-1fd2-4bae-83da-7a10c983ac24`; service `financial_assistance`; key `amount_paid_through_financial_assistance`; reporting year 2025; exact stored value `796416.64` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Water and sewer costs are part of household housing pressure, providing context for financial assistance to prevent homelessness. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.

</details>

<a id="d009"></a>
## D009 Staying connected

Category — Essential Goods & Clothing. Household scope — ALL. Engine — bill.

Your phone plan renews today. Keeping it paid competes with the money you were trying to save for an emergency.

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

Development bill principal — $100.00. Due Day 16. One-time Ignore late fee $5.00.

The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.

**D009-PAY — Pay the bill**

Authored financial expression — -$100.00

Outcome — settle_current_bill

Response — You paid the bill.

**D009-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

Baseline and price notes — User-approved USD 100.00 starting monthly phone cost. Update using wireless services CPI CUUR0000SEED03. Keep the doxo ranking explicitly dated 2026.

#### General fact

**Development edition text** (context)

A phone connection can be mandatory for keeping up with work, family and daily responsibilities.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

A phone connection can be mandatory for keeping up with work, family and daily responsibilities. It is the second most common household bill, surpassed only by electricity. In the past year, the average price of wireless telephone services {change} by {pct}%.

Numbers in authored text — second
Unresolved fields — {change} · {pct}
Data binding — cpi:SEED03
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm · https://www.telecompetitor.com/u-s-households-pay-1200-per-year-for-mobile-phone-service-on-average/

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “A phone connection can be mandatory for keeping up with work, family and daily responsibilities. It is the second most common household bill, surpassed only by electricity. In the past year, the average price of wireless telephone services {change} by {pct}%.”

**General fact semantic key:** `cpi:SEED03`

Source/update: https://www.bls.gov/cpi/additional-resources/index-publication-level.htm. User supplied Telecompetitor summary https://www.telecompetitor.com/u-s-households-pay-1200-per-year-for-mobile-phone-service-on-average/ reports a $100 monthly median. Retain 2026 for the ranking. CPI-U CUUR0000SEED03 supplies the rolling 12-month category price change. Approved revision from facts fixes.docx, November 15, 2026.


</details>

#### CAC fact

**Development edition text** (fact)

Bills can start to add up and cause stress for the money needed to keep a home. In 2025, CAC reported preventing evictions for 1,108 households.

Numbers in that text — 2025, · 1,108
Snapshot value — 1108 Number. Reporting year 2025. Measure — evictions prevented.

**Authored full fact or template**

Bills can start to add up and cause stress for the money needed to keep a home. In 2025, CAC reported preventing evictions for 1,108 households.

Numbers in authored text — 2025, · 1,108
Unresolved fields — None.
Data binding — 5fa2bac7-6016-4db8-b705-fc593f6b75ec
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** “Bills can start to add up and cause stress for the money needed to keep a home. In 2025, CAC reported preventing evictions for 1,108 households.”

Source fact ID `5fa2bac7-6016-4db8-b705-fc593f6b75ec`

Source/update: https://ourcac.org/. CAC 2025 repository snapshot. evictions prevented: 1108 Number. Reporting year 2025. Annual refresh requires a CAC-provided report/export. User approved this pairing November 15, 2026. Approved revision from facts fixes.docx, November 15, 2026.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D009 — Staying connected

**Baseline evidence and disposition (November 15, 2026):** User-approved USD 100.00 starting monthly phone cost. Update using wireless services CPI CUUR0000SEED03. Keep the doxo ranking explicitly dated 2026.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d009)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D009-PAY — Pay the bill | -$55.00 |
| D009-IGNORE — Ignore the bill for now | $0.00 |

**Bill components (draft; fee policy unapproved):** Ignore records principal $55.00 + proposed late fee $5.00 = **$60.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** wireless telephone services. **Required definition:** Choose provider plan, line count, device inclusion, taxes and promotional expiry.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. 

**General fact (separate from price)**

**Player-facing general fact template:** “A phone connection can be mandatory for keeping up with work, family and daily responsibilities. It is the second most common household bill, surpassed only by electricity. In the past year, the average price of wireless telephone services {change} by {pct}%.”

**General fact semantic key:** `cpi:SEED03`

Source/update: https://www.bls.gov/cpi/additional-resources/index-publication-level.htm. User supplied Telecompetitor summary https://www.telecompetitor.com/u-s-households-pay-1200-per-year-for-mobile-phone-service-on-average/ reports a $100 monthly median. Retain 2026 for the ranking. CPI-U CUUR0000SEED03 supplies the rolling 12-month category price change. Approved revision from facts fixes.docx, November 15, 2026.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** “Bills can start to add up and cause stress for the money needed to keep a home. In 2025, CAC reported preventing evictions for 1,108 households.”

Source fact ID `5fa2bac7-6016-4db8-b705-fc593f6b75ec`

Source/update: https://ourcac.org/. CAC 2025 repository snapshot. evictions prevented: 1108 Number. Reporting year 2025. Annual refresh requires a CAC-provided report/export. User approved this pairing November 15, 2026. Approved revision from facts fixes.docx, November 15, 2026.

</details>

<a id="d010"></a>
## D010 The internet bill

Category — Housing & Utilities. Household scope — ALL. Engine — bill.

Your internet bill is due. You use the connection for applications and household tasks, but it does not replace the phone bill.

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

Development bill principal — $65.00. Due Day 23. One-time Ignore late fee $7.00.

The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.

**D010-PAY — Pay the bill**

Authored financial expression — -$65.00

Outcome — settle_current_bill

Response — You paid the bill.

**D010-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

**D010-CAC — Get help paying the internet bill through CAC eviction prevention**

Authored financial expression — UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense

Outcome — Apply one approved capped bill-support effect; record only actual help used

Response — You received help paying the internet bill through CAC eviction prevention. Your payment: {player_payment_usd}. Remaining balance on this expense: {remaining_expense_usd}.

Baseline and price notes — Retain USD 65.00 starting internet cost and update using internet services CPI CUUR0000SEEE03.

#### General fact

**Development edition text** (fact)

Internet access is part of everyday life for most adults. In a 2025 U.S. survey, 90% of adults said they used the internet every day.

Numbers in that text — 2025 · 90%

**Authored full fact or template**

Internet access is part of everyday life for most adults. In a 2025 U.S. survey, 90% of adults said they used the internet every day.

Numbers in authored text — 2025 · 90%
Unresolved fields — None.
Data binding — digital:adult_daily_internet_use
Sources — https://www.pewresearch.org/short-reads/2026/01/08/internet-use-smartphone-ownership-digital-divides-in-u-s/

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Internet access is part of everyday life for most adults. In a 2025 U.S. survey, 90% of adults said they used the internet every day.”

**General fact semantic key:** `digital:adult_daily_internet_use`

Source/update: S29, [Pew Research Center: Internet use and digital divides](https://www.pewresearch.org/short-reads/2026/01/08/internet-use-smartphone-ownership-digital-divides-in-u-s/), published January 8, 2026; survey February 5-June 18, 2025. Daily use includes almost constantly, several times daily and about once daily; denominator all U.S. adults, not only internet users. Exact observed value 90 percent. Source checked November 7, 2026. This demonstrates everyday use, not that every activity requires internet or a paid home broadband subscription. Proposed copy; initial binding verification pending. Retain the survey year and source observation; monitor later releases through a configured backend report import with schema/population checks and automatic validated edition publication. No free-form claim regeneration.


</details>

#### CAC fact

**Development edition text** (fact)

Home internet is another bill competing for the money needed to maintain a household. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.

Numbers in that text — 2025, · $796,416.64
Snapshot value — 796416.64 Dollars. Reporting year 2025. Measure — total financial assistance amount to prevent homelessness.

**Authored full fact or template**

Home internet is another bill competing for the money needed to maintain a household. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.

Numbers in authored text — 2025, · $796,416.64
Unresolved fields — None.
Data binding — b697ae84-1fd2-4bae-83da-7a10c983ac24
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Home internet is another bill competing for the money needed to maintain a household. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.”

Source: S18/S19; fact ID `b697ae84-1fd2-4bae-83da-7a10c983ac24`; service `financial_assistance`; key `amount_paid_through_financial_assistance`; reporting year 2025; exact stored value `796416.64` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The home-internet bill competes with rent and other household obligations, providing broader housing-budget context for financial assistance to prevent homelessness. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D010 — The internet bill

**Baseline evidence and disposition (November 15, 2026):** Retain USD 65.00 starting internet cost and update using internet services CPI CUUR0000SEEE03.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d010)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D010-PAY — Pay the bill | -$65.00 |
| D010-IGNORE — Ignore the bill for now | $0.00 |
| D010-CAC — Get help paying the internet bill through CAC eviction prevention | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense |

**Bill components (draft; fee policy unapproved):** Ignore records principal $65.00 + proposed late fee $7.00 = **$72.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** internet services. **Required definition:** Quote address-available plan, speed, equipment, taxes and post-promotion rate.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. CAC bill cap A, eligibility and availability require CAC-approved records (S18/S19 plus new operational evidence); retain the approved capped formula. 

**General fact (separate from price)**

**Player-facing general fact:** “Internet access is part of everyday life for most adults. In a 2025 U.S. survey, 90% of adults said they used the internet every day.”

**General fact semantic key:** `digital:adult_daily_internet_use`

Source/update: S29, [Pew Research Center: Internet use and digital divides](https://www.pewresearch.org/short-reads/2026/01/08/internet-use-smartphone-ownership-digital-divides-in-u-s/), published January 8, 2026; survey February 5-June 18, 2025. Daily use includes almost constantly, several times daily and about once daily; denominator all U.S. adults, not only internet users. Exact observed value 90 percent. Source checked November 7, 2026. This demonstrates everyday use, not that every activity requires internet or a paid home broadband subscription. Proposed copy; initial binding verification pending. Retain the survey year and source observation; monitor later releases through a configured backend report import with schema/population checks and automatic validated edition publication. No free-form claim regeneration.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Home internet is another bill competing for the money needed to maintain a household. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.”

Source: S18/S19; fact ID `b697ae84-1fd2-4bae-83da-7a10c983ac24`; service `financial_assistance`; key `amount_paid_through_financial_assistance`; reporting year 2025; exact stored value `796416.64` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The home-internet bill competes with rent and other household obligations, providing broader housing-budget context for financial assistance to prevent homelessness. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.

</details>

<a id="d011"></a>
## D011 Car insurance is due

Category — Financial Literacy & Taxes. Household scope — CAR. Engine — bill.

A car insurance installment is due. Ignoring it preserves cash today while leaving a larger amount unpaid.

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

Development bill principal — $130.00. Due Day 4. One-time Ignore late fee $0.00.

The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.

**D011-PAY — Pay the bill**

Authored financial expression — -$130.00

Outcome — settle_current_bill

Response — You paid the bill.

**D011-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

Baseline and price notes — All four personas own a car. Retain USD 130.00 insurance baseline and update through motor vehicle insurance CPI CUUR0000SETE.

#### General fact

**Development edition text** (fact)

The price of car insurance isn’t the same for every person. Factors for higher costs can include being a home renter, having less education, being a blue-collar worker, or having a lower credit score, factors that disproportionately affect lower-income individuals.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

The price of car insurance isn’t the same for every person. Factors for higher costs can include being a home renter, having less education, being a blue-collar worker, or having a lower credit score, factors that disproportionately affect lower-income individuals.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — insurance:non_driving_rating_factors
Sources — https://consumerfed.org/news/testimony-comments/auto-insurance-rating-factors-and-their-effect-on-different-demographics-of-consumers/

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “The price of car insurance isn’t the same for every person. Factors for higher costs can include being a home renter, having less education, being a blue-collar worker, or having a lower credit score, factors that disproportionately affect lower-income individuals.”

**General fact semantic key:** `insurance:non_driving_rating_factors`

Source/update: https://consumerfed.org/news/testimony-comments/auto-insurance-rating-factors-and-their-effect-on-different-demographics-of-consumers/.  Approved revision from facts fixes.docx, November 15, 2026.


</details>

#### CAC fact

**Development edition text** (fact)

Deciding how to handle an insurance bill is part of managing financial demands. In 2025, 218 students enrolled in Financial Literacy Classes.

Numbers in that text — 2025, · 218
Snapshot value — 218 Number. Reporting year 2025. Measure — students enrolled in Financial Literacy Classes.

**Authored full fact or template**

Deciding how to handle an insurance bill is part of managing financial demands. In 2025, 218 students enrolled in Financial Literacy Classes.

Numbers in authored text — 2025, · 218
Unresolved fields — None.
Data binding — d32689c8-067a-4f59-aa48-2424384b7116
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Deciding how to handle an insurance bill is part of managing financial demands. In 2025, 218 students enrolled in Financial Literacy Classes.”

Source: S18/S19; fact ID `d32689c8-067a-4f59-aa48-2424384b7116`; service `financial_literacy_classes`; key `students_enrolled_in_financial_literacy_classes`; reporting year 2025; exact stored value `218` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Choosing how to handle an insurance installment is a financial-literacy/budget tradeoff. Context only; no CAC car-insurance payment or insurance service inferred.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D011 — Car insurance is due

**Baseline evidence and disposition (November 15, 2026):** All four personas own a car. Retain USD 130.00 insurance baseline and update through motor vehicle insurance CPI CUUR0000SETE.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d011)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D011-PAY — Pay the bill | -$130.00 |
| D011-IGNORE — Ignore the bill for now | $0.00 |

**Bill components (draft; fee policy unapproved):** Ignore records principal $130.00 + proposed late fee $15.00 = **$145.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** motor vehicle insurance. **Required definition:** Quote a fictional vehicle/driver/coverage/deductible profile and installment period; no participant information.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. 

**General fact (separate from price)**

**Player-facing general fact:** “The price of car insurance isn’t the same for every person. Factors for higher costs can include being a home renter, having less education, being a blue-collar worker, or having a lower credit score, factors that disproportionately affect lower-income individuals.”

**General fact semantic key:** `insurance:non_driving_rating_factors`

Source/update: https://consumerfed.org/news/testimony-comments/auto-insurance-rating-factors-and-their-effect-on-different-demographics-of-consumers/.  Approved revision from facts fixes.docx, November 15, 2026.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Deciding how to handle an insurance bill is part of managing financial demands. In 2025, 218 students enrolled in Financial Literacy Classes.”

Source: S18/S19; fact ID `d32689c8-067a-4f59-aa48-2424384b7116`; service `financial_literacy_classes`; key `students_enrolled_in_financial_literacy_classes`; reporting year 2025; exact stored value `218` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Choosing how to handle an insurance installment is a financial-literacy/budget tradeoff. Context only; no CAC car-insurance payment or insurance service inferred.

</details>

<a id="d012"></a>
## D012 A clinic bill arrives

Category — Essential Goods & Clothing. Household scope — ALL. Engine — bill.

A bill from an earlier clinic visit comes due.

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

Development bill principal — $190.00. Due Day 7. One-time Ignore late fee $0.00.

The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.

**D012-PAY — Pay the bill**

Authored financial expression — -$190.00

Outcome — settle_current_bill

Response — You paid the bill.

**D012-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

Baseline and price notes — Retain USD 190.00 clinic-invoice baseline and update through physicians services CPI CUUR0000SEMC01. The unnecessary sentence about care already happening is removed.

#### General fact

**Development edition text** (fact)

In the Federal Reserve's 2025 U.S. survey, adults with lower family incomes were more likely to have gone without medical care because they could not afford it.

Numbers in that text — 2025

**Authored full fact or template**

In the Federal Reserve's 2025 U.S. survey, adults with lower family incomes were more likely to have gone without medical care because they could not afford it.

Numbers in authored text — 2025
Unresolved fields — None.
Data binding — health:income_related_forgone_care
Sources — https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-economic-hardships.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “In the Federal Reserve's 2025 U.S. survey, adults with lower family incomes were more likely to have gone without medical care because they could not afford it.”

**General fact semantic key:** `health:income_related_forgone_care`

Source/update: S30, [Federal Reserve: economic hardships](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-economic-hardships.htm). Income-group comparison of forgone care; association, not proof of causation. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No clinic-cost or medical-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D012 — A clinic bill arrives

**Baseline evidence and disposition (November 15, 2026):** Retain USD 190.00 clinic-invoice baseline and update through physicians services CPI CUUR0000SEMC01. The unnecessary sentence about care already happening is removed.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d012)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D012-PAY — Pay the bill | -$190.00 |
| D012-IGNORE — Ignore the bill for now | $0.00 |

**Bill components (draft; fee policy unapproved):** Ignore records principal $190.00 + proposed late fee $20.00 = **$210.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** medical care services. **Required definition:** Define service, billing code if available, self-pay/insured status and patient responsibility.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. 

**General fact (separate from price)**

**Player-facing general fact:** “In the Federal Reserve's 2025 U.S. survey, adults with lower family incomes were more likely to have gone without medical care because they could not afford it.”

**General fact semantic key:** `health:income_related_forgone_care`

Source/update: S30, [Federal Reserve: economic hardships](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-economic-hardships.htm). Income-group comparison of forgone care; association, not proof of causation. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No clinic-cost or medical-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d013"></a>
## D013 The childcare bill

Category — Childcare & Youth. Household scope — JORDAN. Engine — bill.

Maya’s agreed childcare arrangement has an invoice due. Paying it uses money you had hoped to keep available for the rest of the month.

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

Development bill principal — $260.00. Due Day 8. One-time Ignore late fee $25.00.

The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.

**D013-PAY — Pay the bill**

Authored financial expression — -$260.00

Outcome — settle_current_bill

Response — You paid the bill.

**D013-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

Baseline and price notes — User-approved USD 260.00 starting childcare bill, updated with daycare and preschool CPI CUUR0000SEEB03. The CAC fact describes other child-related support and does not imply CAC pays this childcare bill.

#### General fact

**Development edition text** (fact)

Childcare can be one of a family's largest expenses. In the Federal Reserve's 2025 U.S. survey, most families paying for both childcare and housing spent at least half as much on childcare as on rent or mortgage payments.

Numbers in that text — one · 2025 · half

**Authored full fact or template**

Childcare can be one of a family's largest expenses. In the Federal Reserve's 2025 U.S. survey, most families paying for both childcare and housing spent at least half as much on childcare as on rent or mortgage payments.

Numbers in authored text — one · 2025 · half
Unresolved fields — None.
Data binding — care:childcare_cost_relative_to_housing
Sources — https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-living-arrangements-care-work.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Childcare can be one of a family's largest expenses. In the Federal Reserve's 2025 U.S. survey, most families paying for both childcare and housing spent at least half as much on childcare as on rent or mortgage payments.”

**General fact semantic key:** `care:childcare_cost_relative_to_housing`

Source/update: S31, [Federal Reserve: Living Arrangements and Care Work](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-living-arrangements-care-work.htm), childcare section and figure 13, published May 2026. Population: families paying for both childcare and housing; national 2025 survey, not a Sandy Springs estimate. Source explicitly reports the majority comparison; this is not a ratio of the two published medians. Monthly childcare costs use weekly payments multiplied by 52/12; housing is rent or mortgage payments. Source checked November 8, 2026. Initial binding verification pending. Check monthly for annual SHED releases; replace the dated comparison only when the same population and calculation are validated from a configured report/data import. Otherwise retain the 2025 statement and flag unavailable or changed source structure; do not automatically rewrite the claim. This fact does not set the scenario's bill amount.


</details>

#### CAC fact

**Development edition text** (fact)

Often, childcare costs do not end at the price for a care program. The CAC offers free coats for kids and school supply bags to help families when the costs start to add up. In 2025, Coats for Kids served 623 children.

Numbers in that text — 2025, · 623
Snapshot value — 623 Number. Reporting year 2025. Measure — children served by Coats for Kids.

**Authored full fact or template**

Often, childcare costs do not end at the price for a care program. The CAC offers free coats for kids and school supply bags to help families when the costs start to add up. In 2025, Coats for Kids served 623 children.

Numbers in authored text — 2025, · 623
Unresolved fields — None.
Data binding — e8473e58-6338-4855-93be-7608f27696ab
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** “Often, childcare costs do not end at the price for a care program. The CAC offers free coats for kids and school supply bags to help families when the costs start to add up. In 2025, Coats for Kids served 623 children.”

Source fact ID `e8473e58-6338-4855-93be-7608f27696ab`

Source/update: https://ourcac.org/. CAC 2025 repository snapshot. children served by Coats for Kids: 623 Number. Reporting year 2025. Annual refresh requires a CAC-provided report/export. User approved this pairing November 15, 2026. Approved revision from facts fixes.docx, November 15, 2026.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D013 — The childcare bill

**Baseline evidence and disposition (November 15, 2026):** User-approved USD 260.00 starting childcare bill, updated with daycare and preschool CPI CUUR0000SEEB03. The CAC fact describes other child-related support and does not imply CAC pays this childcare bill.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d013)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D013-PAY — Pay the bill | -$260.00 |
| D013-IGNORE — Ignore the bill for now | $0.00 |

**Bill components (draft; fee policy unapproved):** Ignore records principal $260.00 + proposed late fee $25.00 = **$285.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S11/S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** day care and preschool. **Required definition:** Define child age, care type and billed hours/days; benchmark Fulton County and verify local provider quote.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. 

**General fact (separate from price)**

**Player-facing general fact:** “Childcare can be one of a family's largest expenses. In the Federal Reserve's 2025 U.S. survey, most families paying for both childcare and housing spent at least half as much on childcare as on rent or mortgage payments.”

**General fact semantic key:** `care:childcare_cost_relative_to_housing`

Source/update: S31, [Federal Reserve: Living Arrangements and Care Work](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-living-arrangements-care-work.htm), childcare section and figure 13, published May 2026. Population: families paying for both childcare and housing; national 2025 survey, not a Sandy Springs estimate. Source explicitly reports the majority comparison; this is not a ratio of the two published medians. Monthly childcare costs use weekly payments multiplied by 52/12; housing is rent or mortgage payments. Source checked November 8, 2026. Initial binding verification pending. Check monthly for annual SHED releases; replace the dated comparison only when the same population and calculation are validated from a configured report/data import. Otherwise retain the 2025 statement and flag unavailable or changed source structure; do not automatically rewrite the claim. This fact does not set the scenario's bill amount.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** “Often, childcare costs do not end at the price for a care program. The CAC offers free coats for kids and school supply bags to help families when the costs start to add up. In 2025, Coats for Kids served 623 children.”

Source fact ID `e8473e58-6338-4855-93be-7608f27696ab`

Source/update: https://ourcac.org/. CAC 2025 repository snapshot. children served by Coats for Kids: 623 Number. Reporting year 2025. Annual refresh requires a CAC-provided report/export. User approved this pairing November 15, 2026. Approved revision from facts fixes.docx, November 15, 2026.

</details>

<a id="d014"></a>
## D014 Maya's school meal balance

Category — Childcare & Youth. Household scope — JORDAN. Engine — bill.

Maya needs school lunches for the month. How will you handle the bill?

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

Development bill principal — $62.00. Due Day 14. One-time Ignore late fee $0.00.

The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.

**D014-PAY — Pay the bill**

Authored financial expression — -$62.00

Outcome — settle_current_bill

Response — You paid the bill.

**D014-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

Baseline and price notes — Use the published elementary lunch rate times 20 school days. Checked November 15, 2026: USD 3.10 per lunch and USD 62.00 per month for 2026-2027. The $62 baseline now updates through the BLS all-items CPI API, CUUR0000SA0. The school page documents the initial rate.

#### General fact

**Development edition text** (fact)

Studies have demonstrated that school meal programs play an important role in overall student health and academic achievement by improving children’s diets and combatting hunger. The National School Lunch Program helps students have free or reduced-price meals.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Studies have demonstrated that school meal programs play an important role in overall student health and academic achievement by improving children’s diets and combatting hunger. The National School Lunch Program helps students have free or reduced-price meals.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — school:nslp:nutrition_and_learning
Sources — https://www.fns.usda.gov/nslp

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Studies have demonstrated that school meal programs play an important role in overall student health and academic achievement by improving children’s diets and combatting hunger. The National School Lunch Program helps students have free or reduced-price meals.”

**General fact semantic key:** `school:nslp:nutrition_and_learning`

Source/update: https://www.fns.usda.gov/nslp.  Approved revision from facts fixes.docx, November 15, 2026.


</details>

#### CAC fact

**Development edition text** (fact)

Students still need meals even when they are not in school during the summer. In 2025, Meals for Kids served 1,097 children.

Numbers in that text — 2025, · 1,097
Snapshot value — 1097 Number. Reporting year 2025. Measure — children served by Meals for Kids.

**Authored full fact or template**

Students still need meals even when they are not in school during the summer. In 2025, Meals for Kids served 1,097 children.

Numbers in authored text — 2025, · 1,097
Unresolved fields — None.
Data binding — 9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** “Students still need meals even when they are not in school during the summer. In 2025, Meals for Kids served 1,097 children.”

Source fact ID `9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01`

Source/update: https://ourcac.org/. CAC 2025 repository snapshot. children served by Meals for Kids: 1097 Number. Reporting year 2025. Annual refresh requires a CAC-provided report/export. User approved this pairing November 15, 2026. Approved revision from facts fixes.docx, November 15, 2026.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D014 — Maya's school meal balance

**Baseline evidence and disposition (November 15, 2026):** Use the published elementary lunch rate times 20 school days. Checked November 15, 2026: USD 3.10 per lunch and USD 62.00 per month for 2026-2027. The $62 baseline now updates through the BLS all-items CPI API, CUUR0000SA0. The school page documents the initial rate.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d014)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D014-PAY — Pay the bill | -$32.00 |
| D014-IGNORE — Ignore the bill for now | $0.00 |

**Bill components (draft; fee policy unapproved):** Ignore records principal $32.00 + proposed late fee $3.00 = **$35.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S13; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** none; published school rates. **Required definition:** Identify school/year, meal count and free/reduced eligibility; account balance is rate times unpaid meals.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. 

**General fact (separate from price)**

**Player-facing general fact:** “Studies have demonstrated that school meal programs play an important role in overall student health and academic achievement by improving children’s diets and combatting hunger. The National School Lunch Program helps students have free or reduced-price meals.”

**General fact semantic key:** `school:nslp:nutrition_and_learning`

Source/update: https://www.fns.usda.gov/nslp.  Approved revision from facts fixes.docx, November 15, 2026.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** “Students still need meals even when they are not in school during the summer. In 2025, Meals for Kids served 1,097 children.”

Source fact ID `9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01`

Source/update: https://ourcac.org/. CAC 2025 repository snapshot. children served by Meals for Kids: 1097 Number. Reporting year 2025. Annual refresh requires a CAC-provided report/export. User approved this pairing November 15, 2026. Approved revision from facts fixes.docx, November 15, 2026.

</details>

<a id="d015"></a>
## D015 The repair bill

Category — Essential Goods & Clothing. Household scope — CAR. Engine — bill.

A repair completed before the month has a bill due today. The car is already repaired; this choice is about the unpaid invoice.

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

Development bill principal — $240.00. Due Day 11. One-time Ignore late fee $0.00.

The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.

**D015-PAY — Pay the bill**

Authored financial expression — -$240.00

Outcome — settle_current_bill

Response — You paid the bill.

**D015-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

Baseline and price notes — User-approved USD 240.00 repair-invoice starting balance, updated using motor vehicle repair CPI CUUR0000SETD03. Enabled for all four car-owning households.

#### General fact

**Development edition text** (context)

A repair bill can keep taking up space in your budget after the car is back on the road.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

A repair bill can keep taking up space in your budget after the car is back on the road. In the past year, the average price of motor vehicle repair {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SETD03
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “A repair bill can keep taking up space in your budget after the car is back on the road. In the past year, the average price of motor vehicle repair {change} by {pct}%.”

**General fact semantic key:** `cpi:SETD03`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SETD03. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No vehicle-repair invoice or automotive-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D015 — The repair bill

**Baseline evidence and disposition (November 15, 2026):** User-approved USD 240.00 repair-invoice starting balance, updated using motor vehicle repair CPI CUUR0000SETD03. Enabled for all four car-owning households.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d015)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D015-PAY — Pay the bill | -$240.00 |
| D015-IGNORE — Ignore the bill for now | $0.00 |

**Bill components (draft; fee policy unapproved):** Ignore records principal $240.00 + proposed late fee $25.00 = **$265.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** motor vehicle maintenance and repair. **Required definition:** Define vehicle, repair, parts/labor, tax and diagnostic inclusion.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. 

**General fact (separate from price)**

**Player-facing general fact template:** “A repair bill can keep taking up space in your budget after the car is back on the road. In the past year, the average price of motor vehicle repair {change} by {pct}%.”

**General fact semantic key:** `cpi:SETD03`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SETD03. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No vehicle-repair invoice or automotive-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d018"></a>
## D018 The gas bill

Category — Housing & Utilities. Household scope — ALL. Engine — bill.

Your household gas bill is due. Paying it will use some of the money you have set aside for other needs.

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

Development bill principal — $75.00. Due Day 29. One-time Ignore late fee $9.00.

The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.

**D018-PAY — Pay the bill**

Authored financial expression — -$75.00

Outcome — settle_current_bill

Response — You paid the bill.

**D018-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

**D018-CAC — Get help paying the gas bill through CAC eviction prevention**

Authored financial expression — UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense

Outcome — Apply one approved capped bill-support effect; record only actual help used

Response — You received help paying the gas bill through CAC eviction prevention. Your payment: {player_payment_usd}. Remaining balance on this expense: {remaining_expense_usd}.

Baseline and price notes — User-approved USD 75.00 gas bill baseline, updated through piped gas CPI CUUR0000SEHF02.

#### General fact

**Development edition text** (fact)

Some U.S. households reported keeping their homes at unhealthy temperatures because of energy costs in the 2024 Residential Energy Consumption Survey.

Numbers in that text — 2024

**Authored full fact or template**

Some U.S. households reported keeping their homes at unhealthy temperatures because of energy costs in the 2024 Residential Energy Consumption Survey.

Numbers in authored text — 2024
Unresolved fields — None.
Data binding — energy:unhealthy_home_temperature
Sources — https://www.eia.gov/consumption/residential/data/2024/hc/pdf/HC11.1_2024.pdf

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Some U.S. households reported keeping their homes at unhealthy temperatures because of energy costs in the 2024 Residential Energy Consumption Survey.”

**General fact semantic key:** `energy:unhealthy_home_temperature`

Source/update: S37, [EIA: 2024 household energy insecurity](https://www.eia.gov/consumption/residential/data/2024/hc/pdf/HC11.1_2024.pdf). Reported household energy insecurity, not specific to natural gas or proof of a local effect. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.


</details>

#### CAC fact

**Development edition text** (fact)

A gas bill is part of the wider pressure of keeping a home running. In 2025, CAC reported preventing evictions for 1,108 households.

Numbers in that text — 2025, · 1,108
Snapshot value — 1108 Number. Reporting year 2025. Measure — evictions prevented.

**Authored full fact or template**

A gas bill is part of the wider pressure of keeping a home running. In 2025, CAC reported preventing evictions for 1,108 households.

Numbers in authored text — 2025, · 1,108
Unresolved fields — None.
Data binding — 5fa2bac7-6016-4db8-b705-fc593f6b75ec
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “A gas bill is part of the wider pressure of keeping a home running. In 2025, CAC reported preventing evictions for 1,108 households.”

Source: S18/S19; fact ID `5fa2bac7-6016-4db8-b705-fc593f6b75ec`; service `eviction_prevention`; key `evictions_prevented`; reporting year 2025; exact stored value `1108` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Household gas costs compete with rent and other essentials, connecting this decision to housing stability and eviction prevention. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D018 — The gas bill

**Baseline evidence and disposition (November 15, 2026):** User-approved USD 75.00 gas bill baseline, updated through piped gas CPI CUUR0000SEHF02.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d018)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D018-PAY — Pay the bill | -$92.00 |
| D018-IGNORE — Ignore the bill for now | $0.00 |
| D018-CAC — Get help paying the gas bill through CAC eviction prevention | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense |

**Bill components (draft; fee policy unapproved):** Ignore records principal $92.00 + proposed late fee $9.00 = **$101.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S14/S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** utility piped gas service. **Required definition:** Confirm marketer/service area; bind therms, supply, delivery, customer charges and taxes.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. CAC bill cap A, eligibility and availability require CAC-approved records (S18/S19 plus new operational evidence); retain the approved capped formula. 

**General fact (separate from price)**

**Player-facing general fact:** “Some U.S. households reported keeping their homes at unhealthy temperatures because of energy costs in the 2024 Residential Energy Consumption Survey.”

**General fact semantic key:** `energy:unhealthy_home_temperature`

Source/update: S37, [EIA: 2024 household energy insecurity](https://www.eia.gov/consumption/residential/data/2024/hc/pdf/HC11.1_2024.pdf). Reported household energy insecurity, not specific to natural gas or proof of a local effect. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “A gas bill is part of the wider pressure of keeping a home running. In 2025, CAC reported preventing evictions for 1,108 households.”

Source: S18/S19; fact ID `5fa2bac7-6016-4db8-b705-fc593f6b75ec`; service `eviction_prevention`; key `evictions_prevented`; reporting year 2025; exact stored value `1108` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Household gas costs compete with rent and other essentials, connecting this decision to housing stability and eviction prevention. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.

</details>

<a id="d019"></a>
## D019 Rent or a cash cushion?

Category — Housing & Utilities. Household scope — ALL. Engine — bill.

Rent is due just as you start to rebuild a cash buffer. Paying means giving up that buffer; ignoring creates a larger obligation.

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

No separate bill occurrence is created for this logical card by the development edition artifact. Read the draft choices and source notes below.

**D019-PAY — Pay the bill**

Authored financial expression — -$650.00

Outcome — settle_current_bill

Response — You paid the bill.

**D019-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

**D019-CAC — Get rent assistance through CAC**

Authored financial expression — UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense

Outcome — Apply one approved capped effect; record only actual help used

Response — You received help through CAC rent assistance. Your payment: {player_payment_usd}. Remaining balance on this expense: {remaining_expense_usd}.

Baseline and price notes — Uses the same RentCast rent-cost binding as D006 and creates no duplicate rent occurrence. The educational fact now describes the dated Atlanta disparity study.

#### General fact

**Development edition text** (fact)

Rents in lower-cost, unsubsidized "workforce housing" sectors have risen sharply, with a recent study showing rents for low-wage Atlantans increasing up to nine times faster than rents for high earners.

Numbers in that text — nine

**Authored full fact or template**

Rents in lower-cost, unsubsidized "workforce housing" sectors have risen sharply, with a recent study showing rents for low-wage Atlantans increasing up to nine times faster than rents for high earners.

Numbers in authored text — nine
Unresolved fields — None.
Data binding — housing:atlanta:unequal_rent_growth
Sources — https://www.ajc.com/news/2025/11/study-rents-for-low-wage-atlantans-rose-9-times-faster-than-for-high-earners/

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Rents in lower-cost, unsubsidized "workforce housing" sectors have risen sharply, with a recent study showing rents for low-wage Atlantans increasing up to nine times faster than rents for high earners.”

**General fact semantic key:** `housing:atlanta:unequal_rent_growth`

Source/update: https://www.ajc.com/news/2025/11/study-rents-for-low-wage-atlantans-rose-9-times-faster-than-for-high-earners/. User-approved dated claim. RentCast updates the scenario cost separately. Retain 2025 and do not extrapolate nine times to later periods. Approved revision from facts fixes.docx, November 15, 2026.


</details>

#### CAC fact

**Development edition text** (fact)

Rent pressure connects with the housing instability CAC financial assistance addresses. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.

Numbers in that text — 2025, · $796,416.64
Snapshot value — 796416.64 Dollars. Reporting year 2025. Measure — total financial assistance amount to prevent homelessness.

**Authored full fact or template**

Rent pressure connects with the housing instability CAC financial assistance addresses. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.

Numbers in authored text — 2025, · $796,416.64
Unresolved fields — None.
Data binding — b697ae84-1fd2-4bae-83da-7a10c983ac24
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Rent pressure connects with the housing instability CAC financial assistance addresses. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.”

Source: S18/S19; fact ID `b697ae84-1fd2-4bae-83da-7a10c983ac24`; service `financial_assistance`; key `amount_paid_through_financial_assistance`; reporting year 2025; exact stored value `796416.64` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The scenario concerns rent pressure and preserving housing stability. Existing conditional rent pathway; annual spending is not the household’s benefit amount.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D019 — Rent or a cash cushion?

**Baseline evidence and disposition (November 15, 2026):** Uses the same RentCast rent-cost binding as D006 and creates no duplicate rent occurrence. The educational fact now describes the dated Atlanta disparity study.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d019)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D019-PAY — Pay the bill | -$650.00 |
| D019-IGNORE — Ignore the bill for now | $0.00 |
| D019-CAC — Get rent assistance through CAC | UNRESOLVED: `-(E-min(A,E))`, where E is eligible remaining expense |

**Bill components (draft; fee policy unapproved):** Ignore records principal $650.00 + proposed late fee $35.00 = **$685.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S06; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** rent of primary residence. **Required definition:** Reuse D006 rent/share binding for the same household, not an unrelated second rent estimate.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. CAC bill cap A, eligibility and availability require CAC-approved records (S18/S19 plus new operational evidence); retain the approved capped formula. 

**General fact (separate from price)**

**Player-facing general fact:** “Rents in lower-cost, unsubsidized "workforce housing" sectors have risen sharply, with a recent study showing rents for low-wage Atlantans increasing up to nine times faster than rents for high earners.”

**General fact semantic key:** `housing:atlanta:unequal_rent_growth`

Source/update: https://www.ajc.com/news/2025/11/study-rents-for-low-wage-atlantans-rose-9-times-faster-than-for-high-earners/. User-approved dated claim. RentCast updates the scenario cost separately. Retain 2025 and do not extrapolate nine times to later periods. Approved revision from facts fixes.docx, November 15, 2026.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Rent pressure connects with the housing instability CAC financial assistance addresses. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.”

Source: S18/S19; fact ID `b697ae84-1fd2-4bae-83da-7a10c983ac24`; service `financial_assistance`; key `amount_paid_through_financial_assistance`; reporting year 2025; exact stored value `796416.64` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The scenario concerns rent pressure and preserving housing stability. Existing conditional rent pathway; annual spending is not the household’s benefit amount.

</details>

<a id="d020"></a>
## D020 A medical bill remains

Category — Essential Goods & Clothing. Household scope — ALL. Engine — bill.

A medical bill is due. You can pay it now or leave the balance unpaid.

Eligibility — Approved billed obligation; not paid, ignored or charged already; no job event on this day.

Authored timing — scheduled; approved occurrence due day UNRESOLVED. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

Development bill principal — $320.00. Due Day 21. One-time Ignore late fee $0.00.

The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.

**D020-PAY — Pay the bill**

Authored financial expression — -$320.00

Outcome — settle_current_bill

Response — You paid the bill.

**D020-IGNORE — Ignore the bill for now**

Authored financial expression — $0.00

Outcome — create_unpaid_bill

Response — You left the bill unpaid. A late fee was added to the amount you owe.

Baseline and price notes — Retain USD 320.00 medical-invoice baseline, updated through physicians services CPI CUUR0000SEMC01. The displayed fact uses plain language for the ACS population.

#### General fact

**Development edition text** (context)

An unpaid medical bill can remain part of the budget as new needs arrive.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

An unpaid medical bill can remain part of the budget as new needs arrive. In {period}, {pct}% of Sandy Springs civilian residents living outside institutions lacked health insurance.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {period} · {pct}
Data binding — acs:B27001:uninsured
Sources — https://api.census.gov/data/2024/acs/acs5/groups.html

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “An unpaid medical bill can remain part of the budget as new needs arrive. In {period}, {pct}% of Sandy Springs civilian residents living outside institutions lacked health insurance.”

**General fact semantic key:** `acs:B27001:uninsured`

Source/update: https://api.census.gov/data/2024/acs/acs5/groups.html. **Player-facing general fact template:** “An unpaid medical bill can remain part of the budget as new needs arrive. In {period}, {pct}% of Sandy Springs civilian noninstitutionalized residents lacked health insurance.”

**General fact semantic key:** `acs:B27001:uninsured`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B27001. Sum uninsured sex/age cells / table universe, with no overlapping age cells. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.
 Approved revision from facts fixes.docx, November 15, 2026.


</details>

#### CAC fact

**Development edition text** (fact)

Medical bills are a common cause of sudden financial crisis. In 2025, CAC contributed $796,416.64 to prevent homelessness, helping people stay safe and sheltered during times of crisis.

Numbers in that text — 2025, · $796,416.64
Snapshot value — 796416.64 Dollars. Reporting year 2025. Measure — total financial assistance amount to prevent homelessness.

**Authored full fact or template**

Medical bills are a common cause of sudden financial crisis. In 2025, CAC contributed $796,416.64 to prevent homelessness, helping people stay safe and sheltered during times of crisis.

Numbers in authored text — 2025, · $796,416.64
Unresolved fields — None.
Data binding — b697ae84-1fd2-4bae-83da-7a10c983ac24
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** “Medical bills are a common cause of sudden financial crisis. In 2025, CAC contributed $796,416.64 to prevent homelessness, helping people stay safe and sheltered during times of crisis.”

Source fact ID `b697ae84-1fd2-4bae-83da-7a10c983ac24`

Source/update: https://ourcac.org/. CAC 2025 repository snapshot. total financial assistance amount to prevent homelessness: 796416.64 Dollars. Reporting year 2025. Annual refresh requires a CAC-provided report/export. User approved this pairing November 15, 2026. Approved revision from facts fixes.docx, November 15, 2026.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D020 — A medical bill remains

**Baseline evidence and disposition (November 15, 2026):** Retain USD 320.00 medical-invoice baseline, updated through physicians services CPI CUUR0000SEMC01. The displayed fact uses plain language for the ACS population.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d020)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D020-PAY — Pay the bill | -$320.00 |
| D020-IGNORE — Ignore the bill for now | $0.00 |

**Bill components (draft; fee policy unapproved):** Ignore records principal $320.00 + proposed late fee $25.00 = **$345.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** medical care services. **Required definition:** Specify remaining patient liability and any previous payments; no new charge for existing principal.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. 

**General fact (separate from price)**

**Player-facing general fact template:** “An unpaid medical bill can remain part of the budget as new needs arrive. In {period}, {pct}% of Sandy Springs civilian residents living outside institutions lacked health insurance.”

**General fact semantic key:** `acs:B27001:uninsured`

Source/update: https://api.census.gov/data/2024/acs/acs5/groups.html. **Player-facing general fact template:** “An unpaid medical bill can remain part of the budget as new needs arrive. In {period}, {pct}% of Sandy Springs civilian noninstitutionalized residents lacked health insurance.”

**General fact semantic key:** `acs:B27001:uninsured`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B27001. Sum uninsured sex/age cells / table universe, with no overlapping age cells. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.
 Approved revision from facts fixes.docx, November 15, 2026.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** “Medical bills are a common cause of sudden financial crisis. In 2025, CAC contributed $796,416.64 to prevent homelessness, helping people stay safe and sheltered during times of crisis.”

Source fact ID `b697ae84-1fd2-4bae-83da-7a10c983ac24`

Source/update: https://ourcac.org/. CAC 2025 repository snapshot. total financial assistance amount to prevent homelessness: 796416.64 Dollars. Reporting year 2025. Annual refresh requires a CAC-provided report/export. User approved this pairing November 15, 2026. Approved revision from facts fixes.docx, November 15, 2026.

</details>

<a id="d021"></a>
## D021 The car will not start

Category — Essential Goods & Clothing. Household scope — CAR. Engine — ordinary.

The car will not start. The repair quote could use much of your remaining money, but you still need a way to get around.

Eligibility — Car owned; repair not already invoiced; MARTA routes and operating times can cover the configured household trips.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D021-REPAIR — Pay for the repair**

Authored financial expression — -$620.00

Development balance change — -$620.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — car_repaired

Response — You pay for the quoted repair and keep the car available.

**D021-TRANSIT — Use MARTA this month with a 30-day pass**

Authored financial expression — -$95.00

Development balance change — -$95.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — car_unavailable_marta

Response — You leave the car unrepaired and use MARTA. Unreliable arrival times and longer waits mean more planning and more time away from home.

Baseline and price notes — Repair USD 620.00 follows motor vehicle maintenance CPI. The alternative explicitly buys the posted MARTA 30-day pass, currently USD 95.00, used as an initial baseline and updated through the BLS all-items CPI API, CUUR0000SA0.

#### General fact

**Development edition text** (fact)

A lack of reliable transit cuts low-income workers off from the majority of the region's employment opportunities, worsening unemployment and limiting upward mobility.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

A lack of reliable transit cuts low-income workers off from the majority of the region's employment opportunities, worsening unemployment and limiting upward mobility.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — transit:access_to_employment
Sources — https://www.urban.org/urban-wire/how-commuters-low-incomes-use-public-transit-and-how-one-city-expanded-ridership

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “A lack of reliable transit cuts low-income workers off from the majority of the region's employment opportunities, worsening unemployment and limiting upward mobility.”

**General fact semantic key:** `transit:access_to_employment`

Source/update: https://www.urban.org/urban-wire/how-commuters-low-incomes-use-public-transit-and-how-one-city-expanded-ridership.  Approved revision from facts fixes.docx, November 15, 2026.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No vehicle repair or roadside-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D021 — The car will not start

**Baseline evidence and disposition (November 15, 2026):** Repair USD 620.00 follows motor vehicle maintenance CPI. The alternative explicitly buys the posted MARTA 30-day pass, currently USD 95.00, used as an initial baseline and updated through the BLS all-items CPI API, CUUR0000SA0.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d021)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D021-REPAIR — Pay for the repair | -$620.00 |
| D021-TRANSIT — Leave the car parked and use MARTA | -$50.00 |

**Recommended source/method:** S20/S12; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** motor vehicle maintenance and repair; transit uses published fares. **Required definition:** Define repair and vehicle separately from exact MARTA product/duration for the alternative.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “A lack of reliable transit cuts low-income workers off from the majority of the region's employment opportunities, worsening unemployment and limiting upward mobility.”

**General fact semantic key:** `transit:access_to_employment`

Source/update: https://www.urban.org/urban-wire/how-commuters-low-incomes-use-public-transit-and-how-one-city-expanded-ridership.  Approved revision from facts fixes.docx, November 15, 2026.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No vehicle repair or roadside-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d022"></a>
## D022 An unexpected dental expense

Category — Essential Goods & Clothing. Household scope — ALL. Engine — ordinary.

You have a painful dental problem. Treatment costs more than an assessment, and the assessment alone will not cover treatment.

Eligibility — Fictional treatment need and alternatives approved.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D022-TREAT — Pay for the quoted treatment**

Authored financial expression — -$480.00

Development balance change — -$480.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — dental_treatment_purchased

Response — You paid for dental treatment.

**D022-ASSESS — Pay for an assessment only**

Authored financial expression — -$90.00

Development balance change — -$90.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — dental_treatment_unresolved

Response — You paid for the assessment. Dental treatment has not been paid for.

Baseline and price notes — Replace scope proposal: E08 component prices; procedure and imaging still required before complete alternatives can be priced. Historical amounts audited: Dental $480/$90. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (fact)

Dental care was the type of care U.S. adults most often reported skipping because of cost in the Federal Reserve's 2025 survey.

Numbers in that text — 2025

**Authored full fact or template**

Dental care was the type of care U.S. adults most often reported skipping because of cost in the Federal Reserve's 2025 survey.

Numbers in authored text — 2025
Unresolved fields — None.
Data binding — health:dental_most_skipped_care
Sources — https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-economic-hardships.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Dental care was the type of care U.S. adults most often reported skipping because of cost in the Federal Reserve's 2025 survey.”

**General fact semantic key:** `health:dental_most_skipped_care`

Source/update: S30, [Federal Reserve: economic hardships](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-economic-hardships.htm). Comparison across care types, distinct from prescription and income-group facts. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No dental-care cost or dental-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D022 — An unexpected dental expense

**Baseline evidence and disposition (November 7):** Replace scope proposal: E08 component prices; procedure and imaging still required before complete alternatives can be priced. Historical amounts audited: Dental $480/$90. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d022)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D022-TREAT — Pay for the quoted treatment | -$480.00 |
| D022-ASSESS — Pay for an assessment only | -$90.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** dental services. **Required definition:** Define treatment and assessment separately, patient responsibility and included procedures.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “Dental care was the type of care U.S. adults most often reported skipping because of cost in the Federal Reserve's 2025 survey.”

**General fact semantic key:** `health:dental_most_skipped_care`

Source/update: S30, [Federal Reserve: economic hardships](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-economic-hardships.htm). Comparison across care types, distinct from prescription and income-group facts. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No dental-care cost or dental-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d024"></a>
## D024 A family emergency

Category — Essential Goods & Clothing. Household scope — ALL. Engine — ordinary.

Someone close to you has a family emergency out of town. You want to be there, but the trip would use money set aside for your own household.

Eligibility — Fictional relative and travel circumstances approved.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D024-TRAVEL — Pay for the trip**

Authored financial expression — -$360.00

Development balance change — -$360.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — family_trip_purchased

Response — You commit the travel cost and choose to be present.

**D024-REMOTE — Stay home and support them remotely**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — family_trip_declined

Response — You preserve the money but cannot be there in person.

Baseline and price notes — The 2025 SHED adult-caregiving finding is 18 percent. The USD 360.00 travel cost follows public transportation CPI, separately from that annual fact.

#### General fact

**Development edition text** (fact)

In the Federal Reserve’s 2025 U.S. survey, 18% of adults regularly provided unpaid care for an adult relative or friend who needed help because of aging, disability or illness.

Numbers in that text — 2025 · 18%

**Authored full fact or template**

In the Federal Reserve’s 2025 U.S. survey, 18% of adults regularly provided unpaid care for an adult relative or friend who needed help because of aging, disability or illness.

Numbers in authored text — 2025 · 18%
Unresolved fields — None.
Data binding — care:unpaid_adult_relative_support
Sources — https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-living-arrangements-care-work.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “In the Federal Reserve’s 2025 U.S. survey, 18% of adults regularly provided unpaid care for an adult relative or friend who needed help because of aging, disability or illness.”

**General fact semantic key:** `care:unpaid_adult_relative_support`

Source/update: https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-living-arrangements-care-work.htm. Overall adults, 2025 SHED. Preserve regular unpaid adult caregiving population. Retain this dated annual observation without automatic website requests. Approved revision from facts fixes.docx, November 15, 2026.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No emergency family-travel assistance fact; targeted workforce transportation is not a general travel benefit. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D024 — A family emergency

**Baseline evidence and disposition (November 15, 2026):** The 2025 SHED adult-caregiving finding is 18 percent. The USD 360.00 travel cost follows public transportation CPI, separately from that annual fact.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d024)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D024-TRAVEL — Pay for the trip | -$360.00 |
| D024-REMOTE — Stay home and support them remotely | $0.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** airline fares or transportation category after trip is defined. **Required definition:** Define destination, dates, mode, passengers, baggage and booking lead time.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “In the Federal Reserve’s 2025 U.S. survey, 18% of adults regularly provided unpaid care for an adult relative or friend who needed help because of aging, disability or illness.”

**General fact semantic key:** `care:unpaid_adult_relative_support`

Source/update: https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-living-arrangements-care-work.htm. Overall adults, 2025 SHED. Preserve regular unpaid adult caregiving population. Retain this dated annual observation without automatic website requests. Approved revision from facts fixes.docx, November 15, 2026.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No emergency family-travel assistance fact; targeted workforce transportation is not a general travel benefit. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d025"></a>
## D025 Childcare falls through

Category — Childcare & Youth. Household scope — JORDAN. Engine — ordinary.

The person who usually watches Maya after school is sick and cannot care for her for the next two school days. Your shifts end after school lets out, so you need another plan.

Eligibility — Employed; Maya attends school; usual after-school caregiver unavailable for two school days; both replacement arrangements and any work-schedule change explicitly approved.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D025-AGENCY — Arrange three hours of after-school care on each of the two days**

Authored financial expression — -$120.00

Development balance change — -$129.96. Upfront requirement — $0.00. CAC-only — No.

Outcome — replacement_care_booked

Response — You arranged after-school care for both days to cover the rest of your shifts.

**D025-SHORT — Arrange 90 minutes of care each day and agree on earlier shifts with your employer**

Authored financial expression — -$60.00

Development balance change — -$64.98. Upfront requirement — $0.00. CAC-only — No.

Outcome — short_care_work_availability_changed

Response — You arranged shorter after-school care for both days and agreed on earlier shifts with your employer.

Baseline and price notes — Replace benchmark proposal: E10 $129.96/$64.98, not agency quote. Verify booking minimums and employer-approved hours. Historical amounts audited: Six/three care hours $120/$60. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (fact)

A Census Bureau study of U.S. households found that problems finding adequate childcare were accompanied by time away from work.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

A Census Bureau study of U.S. households found that problems finding adequate childcare were accompanied by time away from work.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — care:disruption_work_absence
Sources — https://www.census.gov/library/working-papers/2026/demo/sehsd-wp2026-08.html

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “A Census Bureau study of U.S. households found that problems finding adequate childcare were accompanied by time away from work.”

**General fact semantic key:** `care:disruption_work_absence`

Source/update: S32, [Census: childcare challenges](https://www.census.gov/library/working-papers/2026/demo/sehsd-wp2026-08.html). 2026 working paper, 2025 CPS ASEC about 2024; descriptive finding, not a predicted penalty for this choice. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No replacement-childcare or daycare-access fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D025 — Childcare falls through

**Baseline evidence and disposition (November 7):** Replace benchmark proposal: E10 $129.96/$64.98, not agency quote. Verify booking minimums and employer-approved hours. Historical amounts audited: Six/three care hours $120/$60. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d025)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D025-AGENCY — Arrange three hours of after-school care on each of the two days | -$120.00 |
| D025-SHORT — Arrange 90 minutes of care each day and agree on earlier shifts with your employer | -$60.00 |

**Recommended source/method:** S11/S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** day care and preschool. **Required definition:** Price six total hours versus three total hours: 3 hours/day × 2 days and 90 minutes/day × 2 days. Verify minimum booking fees and agreed shift changes.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**Additional numerical source notes (draft, not verified prices):**

**Cost bindings:** Proposed simulation assumption: USD 20.00 per hour. Full coverage: 2 school days x 3 hours x $20.00 = $120.00. Shorter coverage: 2 school days x 1.5 hours x $20.00 = $60.00. These are draft assumptions, not market estimates. Charge the selected two-day total once on submission; do not repeat it on the second day. Confirm school dismissal, shift times, caregiver suitability and availability. The shorter option requires an employer-approved shift change that preserves the configured paid hours; do not infer wage loss or an extra wage credit. Reconcile this period with D013 to avoid charging the same care twice. **State/routing:** the chosen row commits its proposed outcome; recap then Continue to the next day. No hidden financial penalty or automatic follow-up.

**General fact (separate from price)**

**Player-facing general fact:** “A Census Bureau study of U.S. households found that problems finding adequate childcare were accompanied by time away from work.”

**General fact semantic key:** `care:disruption_work_absence`

Source/update: S32, [Census: childcare challenges](https://www.census.gov/library/working-papers/2026/demo/sehsd-wp2026-08.html). 2026 working paper, 2025 CPS ASEC about 2024; descriptive finding, not a predicted penalty for this choice. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No replacement-childcare or daycare-access fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d026"></a>
## D026 Time for new tires

Category — Essential Goods & Clothing. Household scope — CAR. Engine — ordinary.

Your car needs tires. A new set costs a large part of your available money. The shop also has a lower-cost set.

Eligibility — Car owned; approved tire replacement need.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D026-NEW — Buy the new set**

Authored financial expression — -$520.00

Development balance change — -$520.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — tires_replaced_new

Response — You pay for the new set.

**D026-LOWER — Buy the lower-cost set**

Authored financial expression — -$310.00

Development balance change — -$310.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — tires_replaced_alternative

Response — You choose the lower-cost set and keep more money for other needs.

Baseline and price notes — New tires USD 520.00 and lower-cost tires USD 310.00 follow tire CPI CUUR0000SETC01.

#### General fact

**Development edition text** (context)

New tires are another expense to weigh against keeping the car available.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

New tires are another expense to weigh against keeping the car available. In the past year, the average price of tires {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SETC01
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “New tires are another expense to weigh against keeping the car available. In the past year, the average price of tires {change} by {pct}%.”

**General fact semantic key:** `cpi:SETC01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SETC01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No tire replacement or automotive-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D026 — Time for new tires

**Baseline evidence and disposition (November 15, 2026):** New tires USD 520.00 and lower-cost tires USD 310.00 follow tire CPI CUUR0000SETC01.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d026)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D026-NEW — Buy the new set | -$520.00 |
| D026-LOWER — Buy the lower-cost set | -$310.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** motor vehicle parts and equipment. **Required definition:** Define vehicle, tire size, count/condition and installed out-the-door cost for each set.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “New tires are another expense to weigh against keeping the car available. In the past year, the average price of tires {change} by {pct}%.”

**General fact semantic key:** `cpi:SETC01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SETC01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No tire replacement or automotive-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d027"></a>
## D027 Broken work shoes

Category — Essential Goods & Clothing. Household scope — ALL. Engine — ordinary.

Your work shoes are worn out and beginning to split. You need a usable pair for your next shift.

Eligibility — Persona explicitly needs corrective glasses.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D027-STANDARD — Buy replacement work shoes**

Authored financial expression — -$90.00

Development balance change — -$90.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — Direct effect or engine rule

Response — You bought replacement work shoes.

**D027-REPAIR — Repair your current work shoes**

Authored financial expression — -$25.00

Development balance change — -$25.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — Direct effect or engine rule

Response — You repaired your current work shoes.

**D027-DEFER — Make do with your current shoes for now**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — Direct effect or engine rule

Response — You kept your current shoes for now.

**D027-CAC — Use Canopy Thrift credits for a pair of secondhand work shoes**

Authored financial expression — USD 0.00; free in-kind shoes; no cash credit

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Direct effect or engine rule

Response — You used Canopy Thrift credits to get secondhand work shoes.

Baseline and price notes — Replaced eyeglasses with work shoes. Approved starting replacement USD 90.00 and assumed repair USD 25.00 follow footwear CPI CUUR0000SEAE. Deferral and eligible Canopy Thrift credits have zero cash cost.

#### General fact

**Development edition text** (fact)

With the rise of fast fashion manufacturing, many clothing items are lower quality and break after fewer wears. Low-income consumers can become trapped in a costly cycle of constantly replacing worn-out clothes.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

With the rise of fast fashion manufacturing, many clothing items are lower quality and break after fewer wears. Low-income consumers can become trapped in a costly cycle of constantly replacing worn-out clothes.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — clothing:quality_and_replacement_cost
Sources — https://prospect.org/2025/08/29/2025-08-29-how-fast-fashion-keeps-people-poor/

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “With the rise of fast fashion manufacturing, many clothing items are lower quality and break after fewer wears. Low-income consumers can become trapped in a costly cycle of constantly replacing worn-out clothes.”

**General fact semantic key:** `clothing:quality_and_replacement_cost`

Source/update: https://prospect.org/2025/08/29/2025-08-29-how-fast-fashion-keeps-people-poor/.  Approved revision from facts fixes.docx, November 15, 2026.


</details>

#### CAC fact

**Development edition text** (fact)

Canopy Thrift has a selective process to choose the items that make it to the floor, helping people gain access to higher quality items. In 2025, clients used $206,768.67 in Canopy Thrift credits.

Numbers in that text — 2025, · $206,768.67
Snapshot value — 206768.67 Dollars. Reporting year 2025. Measure — dollar amount of client credits used at CAC Canopy Thrift.

**Authored full fact or template**

Canopy Thrift has a selective process to choose the items that make it to the floor, helping people gain access to higher quality items. In 2025, clients used $206,768.67 in Canopy Thrift credits.

Numbers in authored text — 2025, · $206,768.67
Unresolved fields — None.
Data binding — 859b8cec-1e1c-4887-9f55-fd55f1bb349c
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** “Canopy Thrift has a selective process to choose the items that make it to the floor, helping people gain access to higher quality items. In 2025, clients used $206,768.67 in Canopy Thrift credits.”

Source fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`

Source/update: https://ourcac.org/. CAC 2025 repository snapshot. dollar amount of client credits used at CAC Canopy Thrift: 206768.67 Dollars. Reporting year 2025. Annual refresh requires a CAC-provided report/export. User approved this pairing November 15, 2026. Approved revision from facts fixes.docx, November 15, 2026.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D027 — Broken glasses

**Baseline evidence and disposition (November 15, 2026):** Replaced eyeglasses with work shoes. Approved starting replacement USD 90.00 and assumed repair USD 25.00 follow footwear CPI CUUR0000SEAE. Deferral and eligible Canopy Thrift credits have zero cash cost.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d027)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D027-STANDARD — Buy the standard replacement | -$290.00 |
| D027-BASIC — Buy the basic replacement | -$135.00 |
| D027-DEFER — Delay replacement | $0.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** eyeglasses and eye care. **Required definition:** Specify frames, prescription lenses, exam inclusion and coverage; compare equivalent needs.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “With the rise of fast fashion manufacturing, many clothing items are lower quality and break after fewer wears. Low-income consumers can become trapped in a costly cycle of constantly replacing worn-out clothes.”

**General fact semantic key:** `clothing:quality_and_replacement_cost`

Source/update: https://prospect.org/2025/08/29/2025-08-29-how-fast-fashion-keeps-people-poor/.  Approved revision from facts fixes.docx, November 15, 2026.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** “Canopy Thrift has a selective process to choose the items that make it to the floor, helping people gain access to higher quality items. In 2025, clients used $206,768.67 in Canopy Thrift credits.”

Source fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`

Source/update: https://ourcac.org/. CAC 2025 repository snapshot. dollar amount of client credits used at CAC Canopy Thrift: 206768.67 Dollars. Reporting year 2025. Annual refresh requires a CAC-provided report/export. User approved this pairing November 15, 2026. Approved revision from facts fixes.docx, November 15, 2026.

</details>

<a id="d028"></a>
## D028 A plumbing problem

Category — Housing & Utilities. Household scope — ALL. Engine — ordinary.

There is a plumbing problem at home, and the repair is your responsibility. You can pay for the full repair or a temporary fix.

Eligibility — Approved housing arrangement explicitly assigns this cost; do not assume tenant liability.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D028-FIX — Pay for the full quoted repair**

Authored financial expression — -$410.00

Development balance change — -$410.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — plumbing_repaired

Response — The quoted repair is paid.

**D028-TEMP — Pay for the temporary workaround**

Authored financial expression — -$75.00

Development balance change — -$75.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — plumbing_repair_unresolved

Response — You buy time with the workaround, but the repair need remains.

Baseline and price notes — Retain full repair USD 410.00 and temporary workaround USD 75.00. Monthly household-operations CPI updates these simulation prices.

#### General fact

**Development edition text** (context)

A plumbing problem can bring an expense that was never part of your plan for the month.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

A plumbing problem can bring an expense that was never part of your plan for the month. In {period}, {pct}% of occupied homes in Sandy Springs lacked complete plumbing facilities.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {period} · {pct}
Data binding — acs:B25048:lacking_plumbing
Sources — https://api.census.gov/data/2024/acs/acs5/groups.html

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “A plumbing problem can bring an expense that was never part of your plan for the month. In {period}, {pct}% of occupied homes in Sandy Springs lacked complete plumbing facilities.”

**General fact semantic key:** `acs:B25048:lacking_plumbing`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B25048. Occupied units lacking complete plumbing / all occupied units; does not measure temporary plumbing failures. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No plumbing/home-repair assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D028 — A plumbing problem

**Baseline evidence and disposition (November 15, 2026):** Retain full repair USD 410.00 and temporary workaround USD 75.00. Monthly household-operations CPI updates these simulation prices.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d028)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D028-FIX — Pay for the full quoted repair | -$410.00 |
| D028-TEMP — Pay for the temporary workaround | -$75.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** household operations/repair category after scope review. **Required definition:** Define full repair and temporary workaround; approve who bears the expense before pricing.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “A plumbing problem can bring an expense that was never part of your plan for the month. In {period}, {pct}% of occupied homes in Sandy Springs lacked complete plumbing facilities.”

**General fact semantic key:** `acs:B25048:lacking_plumbing`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B25048. Occupied units lacking complete plumbing / all occupied units; does not measure temporary plumbing failures. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No plumbing/home-repair assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d029"></a>
## D029 An unexpected appointment for Maya

Category — Childcare & Youth. Household scope — JORDAN. Engine — ordinary.

Maya needs a care appointment you had not budgeted for. You can pay for the full appointment or an initial appointment that leaves some care to arrange.

Eligibility — Fictional child-care expense and suitable alternatives approved.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D029-FULL — Pay for the full appointment**

Authored financial expression — -$380.00

Development balance change — -$380.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — child_appointment_purchased

Response — You commit the full appointment cost.

**D029-INITIAL — Pay for the initial appointment**

Authored financial expression — -$120.00

Development balance change — -$120.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — child_followup_need_unresolved

Response — You paid for the initial appointment. The remaining care has not been arranged.

Baseline and price notes — Retain appointment USD 380.00 and initial visit USD 120.00, updated through services by other medical professionals CPI CUUR0000SEMC04.

#### General fact

**Development edition text** (context)

An unexpected appointment for Maya means finding money for care alongside other family needs.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

An unexpected appointment for Maya means finding money for care alongside other family needs. In the past year, the average price of services by other medical professionals {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SEMC04
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “An unexpected appointment for Maya means finding money for care alongside other family needs. In the past year, the average price of services by other medical professionals {change} by {pct}%.”

**General fact semantic key:** `cpi:SEMC04`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEMC04. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No child healthcare/appointment assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D029 — An unexpected appointment for Maya

**Baseline evidence and disposition (November 15, 2026):** Retain appointment USD 380.00 and initial visit USD 120.00, updated through services by other medical professionals CPI CUUR0000SEMC04.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d029)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D029-FULL — Pay for the full appointment | -$380.00 |
| D029-INITIAL — Pay for the initial appointment | -$120.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** medical care services. **Required definition:** Define appointment type, full versus initial scope, child coverage and patient responsibility.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “An unexpected appointment for Maya means finding money for care alongside other family needs. In the past year, the average price of services by other medical professionals {change} by {pct}%.”

**General fact semantic key:** `cpi:SEMC04`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEMC04. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No child healthcare/appointment assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d030"></a>
## D030 A broken laptop

Category — Essential Goods & Clothing. Household scope — ALL. Engine — ordinary.

Your laptop fails. A replacement is expensive, and a repair quote is cheaper but would keep the same older device.

Eligibility — Laptop owned and used for household/job tasks.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D030-REPLACE — Buy the replacement**

Authored financial expression — -$600.00

Development balance change — -$600.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — laptop_replaced

Response — You pay for a replacement device.

**D030-REPAIR — Pay for the repair**

Authored financial expression — -$180.00

Development balance change — -$180.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — laptop_repaired

Response — You repair the existing device.

**D030-DEFER — Manage without it for now**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — laptop_unavailable

Response — You keep the money and the laptop remains unavailable.

Baseline and price notes — User-approved replacement laptop starts at USD 600.00. Retain repair USD 180.00. Both follow computer-equipment CPI CUUR0000SEEE01.

#### General fact

**Development edition text** (fact)

Lacking a full computer restricts workers from building digital skills, running heavy work software, and reliably completing remote employment or educational tasks that require larger screens and physical keyboards. Having more devices means more purchasing and repair costs that can strain families.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Lacking a full computer restricts workers from building digital skills, running heavy work software, and reliably completing remote employment or educational tasks that require larger screens and physical keyboards. Having more devices means more purchasing and repair costs that can strain families.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — digital:full_computer_access
Sources — https://publicknowledge.org/the-device-divide-is-hurting-americans-heres-how-we-solve-it/

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Lacking a full computer restricts workers from building digital skills, running heavy work software, and reliably completing remote employment or educational tasks that require larger screens and physical keyboards. Having more devices means more purchasing and repair costs that can strain families.”

**General fact semantic key:** `digital:full_computer_access`

Source/update: https://publicknowledge.org/the-device-divide-is-hurting-americans-heres-how-we-solve-it/.  Approved revision from facts fixes.docx, November 15, 2026.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** Computer Classes measures education, not laptop repair or replacement. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D030 — A broken laptop

**Baseline evidence and disposition (November 15, 2026):** User-approved replacement laptop starts at USD 600.00. Retain repair USD 180.00. Both follow computer-equipment CPI CUUR0000SEEE01.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d030)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D030-REPLACE — Buy the replacement | -$450.00 |
| D030-REPAIR — Pay for the repair | -$180.00 |
| D030-DEFER — Manage without it for now | $0.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** computers, peripherals and smart home assistants. **Required definition:** Define replacement specifications/condition and repair fault, labor and warranty.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “Lacking a full computer restricts workers from building digital skills, running heavy work software, and reliably completing remote employment or educational tasks that require larger screens and physical keyboards. Having more devices means more purchasing and repair costs that can strain families.”

**General fact semantic key:** `digital:full_computer_access`

Source/update: https://publicknowledge.org/the-device-divide-is-hurting-americans-heres-how-we-solve-it/.  Approved revision from facts fixes.docx, November 15, 2026.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** Computer Classes measures education, not laptop repair or replacement. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d032"></a>
## D032 A larger share to cover

Category — Housing & Utilities. Household scope — SOFIA. Engine — ordinary.

You and your spouse need to make a household purchase, and your share is larger than expected. You can cover the full share or agree on a smaller contribution that leaves part of the purchase unfunded.

Eligibility — Approved fictional shared-cost change; no spouse income inferred.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D032-FULL — Pay the larger share**

Authored financial expression — -$420.00

Development balance change — -$420.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — shared_purchase_fully_funded

Response — You cover the stated share from your own available balance.

**D032-SMALL — Pay the smaller agreed contribution**

Authored financial expression — -$180.00

Development balance change — -$180.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — shared_need_partly_unmet

Response — You made the smaller contribution you agreed on. Part of the household purchase remains unfunded.

Baseline and price notes — Unresolved: purchase not identified; total price and agreed allocation required. Historical amounts audited: Shared purchase $420/$180. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

Covering more of a shared purchase can leave less for your own needs.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Covering more of a shared purchase can leave less for your own needs. In {period}, renter-occupied households in Sandy Springs averaged {persons} people.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {period} · {persons}
Data binding — acs:B25010:renter_household_size
Sources — https://api.census.gov/data/2024/acs/acs5/groups.html

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “Covering more of a shared purchase can leave less for your own needs. In {period}, renter-occupied households in Sandy Springs averaged {persons} people.”

**General fact semantic key:** `acs:B25010:renter_household_size`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B25010. Renter average household size; no percentage denominator or assumed equal cost sharing. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** The shared household purchase is unspecified. Define the actual goods before selecting a relevant program fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D032 — A larger share to cover

**Baseline evidence and disposition (November 7):** Unresolved: purchase not identified; total price and agreed allocation required. Historical amounts audited: Shared purchase $420/$180. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d032)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D032-FULL — Pay the larger share | -$420.00 |
| D032-SMALL — Pay the smaller agreed contribution | -$180.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** category pending identification of shared purchase. **Required definition:** Identify purchase, total price, household allocation and agreed contributions; no automatic equal split.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Covering more of a shared purchase can leave less for your own needs. In {period}, renter-occupied households in Sandy Springs averaged {persons} people.”

**General fact semantic key:** `acs:B25010:renter_household_size`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B25010. Renter average household size; no percentage denominator or assumed equal cost sharing. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** The shared household purchase is unspecified. Define the actual goods before selecting a relevant program fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d033"></a>
## D033 A damaged small kitchen appliance

Category — Essential Goods & Clothing. Household scope — ALL. Engine — ordinary.

One of your small kitchen appliances became damaged and no longer works. You can buy the same version you had or look for something cheaper.

Eligibility — A small household kitchen appliance is damaged; no employment requirement.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D033-REPLACE — Buy the same model**

Authored financial expression — -$80.00

Development balance change — -$80.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — Direct effect or engine rule

Response — You bought the same model of small kitchen appliance.

**D033-CHEAPER — Buy a cheaper model**

Authored financial expression — -$50.00

Development balance change — -$50.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — Direct effect or engine rule

Response — You bought a cheaper small kitchen appliance.

**D033-CAC — Check Canopy Thrift for a replacement**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Direct effect or engine rule

Response — You checked Canopy Thrift for an available replacement.

Baseline and price notes — Unresolved: item not identified; exact replacement, fault/repair and reimbursement rule required. Historical amounts audited: Work item $350/$145. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (fact)

When cheap or older appliances break down completely, many low-income households cannot afford immediate replacements, forcing them to go without necessities. Older and cheaper appliances can also be less energy efficient, costing people even more in energy bills.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

When cheap or older appliances break down completely, many low-income households cannot afford immediate replacements, forcing them to go without necessities. Older and cheaper appliances can also be less energy efficient, costing people even more in energy bills.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — appliances:replacement_and_energy
Sources — https://www.whirlpoolcorp.com/latest-news/habitat-whirlpool-study-illustrates-energy-efficient-appliances-can-help-low-income-families-lower-utility-bills.html

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “When cheap or older appliances break down completely, many low-income households cannot afford immediate replacements, forcing them to go without necessities. Older and cheaper appliances can also be less energy efficient, costing people even more in energy bills.”

**General fact semantic key:** `appliances:replacement_and_energy`

Source/update: https://www.whirlpoolcorp.com/latest-news/habitat-whirlpool-study-illustrates-energy-efficient-appliances-can-help-low-income-families-lower-utility-bills.html. User-approved part 2 revision November 16, 2026. Qualitative educational context; retain source provenance.


</details>

#### CAC fact

**Development edition text** (fact)

Canopy Thrift helps neighbors access donated clothing and household essentials. In 2025, clients used $206,768.67 in Canopy Thrift credits.

Numbers in that text — 2025, · $206,768.67
Snapshot value — 206768.67 Dollars. Reporting year 2025. Measure — dollar amount of client credits used at CAC Canopy Thrift.

**Authored full fact or template**

Canopy Thrift helps neighbors access donated clothing and household essentials. In 2025, clients used $206,768.67 in Canopy Thrift credits.

Numbers in authored text — 2025, · $206,768.67
Unresolved fields — None.
Data binding — 859b8cec-1e1c-4887-9f55-fd55f1bb349c
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** “Canopy Thrift helps neighbors access donated clothing and household essentials. In 2025, clients used $206,768.67 in Canopy Thrift credits.”

Source fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`

Source/update: https://ourcac.org/. User-approved part 2 revision November 16, 2026. CAC 2025 repository snapshot; annual report refresh remains required. This program fact does not guarantee item availability.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D033 — A damaged small kitchen appliance

**Baseline evidence and disposition (November 7):** Unresolved: item not identified; exact replacement, fault/repair and reimbursement rule required. Historical amounts audited: Work item $350/$145. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d033)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D033-REPLACE — Buy the replacement | -$350.00 |
| D033-REPAIR — Pay for the repair | -$145.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** category pending identification of work item. **Required definition:** Identify item, specifications, damage and employer reimbursement policy before replacement/repair pricing.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “When cheap or older appliances break down completely, many low-income households cannot afford immediate replacements, forcing them to go without necessities. Older and cheaper appliances can also be less energy efficient, costing people even more in energy bills.”

**General fact semantic key:** `appliances:replacement_and_energy`

Source/update: https://www.whirlpoolcorp.com/latest-news/habitat-whirlpool-study-illustrates-energy-efficient-appliances-can-help-low-income-families-lower-utility-bills.html. User-approved part 2 revision November 16, 2026. Qualitative educational context; retain source provenance.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** “Canopy Thrift helps neighbors access donated clothing and household essentials. In 2025, clients used $206,768.67 in Canopy Thrift credits.”

Source fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`

Source/update: https://ourcac.org/. User-approved part 2 revision November 16, 2026. CAC 2025 repository snapshot; annual report refresh remains required. This program fact does not guarantee item availability.

</details>

<a id="d034"></a>
## D034 A broken dresser

Category — Essential Goods & Clothing. Household scope — ALL. Engine — ordinary.

Your dresser breaks, leaving you without enough storage for your clothes. A complete replacement costs more than a basic option.

Eligibility — Owned dresser damaged; no automatic landlord obligation.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D034-FULL — Buy the complete replacement**

Authored financial expression — -$390.00

Development balance change — -$279.99. Upfront requirement — $0.00. CAC-only — No.

Outcome — dresser_replaced_full

Response — You spend more for the complete replacement.

**D034-BASIC — Buy the basic option**

Authored financial expression — -$165.00

Development balance change — -$165.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — dresser_replaced_basic

Response — You choose the basic option and keep more cash.

**D034-DEFER — Make do without replacing it this month**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — dresser_need_unmet

Response — You kept the money. Your dresser still needs replacing.

**D034-CAC — Get a dresser through CAC Canopy Thrift assistance**

Authored financial expression — USD 0.00; free in-kind receipt; no cash credit

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Record approved dresser received and assistance use

Response — You received a dresser through CAC Canopy Thrift.

Baseline and price notes — Replace new-item proposal: E11 $279.99 plus required charges; basic alternative needs exact product. CAC item separate. Historical amounts audited: Dresser $390/$165. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

Replacing a broken dresser means choosing how much of your budget to spend on a household need.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Replacing a broken dresser means choosing how much of your budget to spend on a household need. In the past year, the average price of bedroom furniture {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SEHJ01
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “Replacing a broken dresser means choosing how much of your budget to spend on a household need. In the past year, the average price of bedroom furniture {change} by {pct}%.”

**General fact semantic key:** `cpi:SEHJ01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEHJ01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (fact)

Canopy Thrift helps neighbors access donated clothing and household essentials. In 2025, clients used $206,768.67 in Canopy Thrift credits.

Numbers in that text — 2025, · $206,768.67
Snapshot value — 206768.67 Dollars. Reporting year 2025. Measure — dollar amount of client credits used at CAC Canopy Thrift.

**Authored full fact or template**

Canopy Thrift helps neighbors access donated clothing and household essentials. In 2025, clients used $206,768.67 in Canopy Thrift credits.

Numbers in authored text — 2025, · $206,768.67
Unresolved fields — None.
Data binding — 859b8cec-1e1c-4887-9f55-fd55f1bb349c
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** “Canopy Thrift helps neighbors access donated clothing and household essentials. In 2025, clients used $206,768.67 in Canopy Thrift credits.”

Source fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`

Source/update: https://ourcac.org/. User-approved part 2 revision November 16, 2026. CAC 2025 repository snapshot; annual report refresh remains required. This program fact does not guarantee item availability.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D034 — A broken dresser

**Baseline evidence and disposition (November 7):** Replace new-item proposal: E11 $279.99 plus required charges; basic alternative needs exact product. CAC item separate. Historical amounts audited: Dresser $390/$165. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d034)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D034-FULL — Buy the complete replacement | -$390.00 |
| D034-BASIC — Buy the basic option | -$165.00 |
| D034-DEFER — Make do without replacing it this month | $0.00 |
| D034-CAC — Get a dresser through CAC Canopy Thrift assistance | USD 0.00; free in-kind receipt; no cash credit |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** furniture and bedding. **Required definition:** Price two dresser specifications with delivery/assembly; separately confirm free CAC item availability.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Replacing a broken dresser means choosing how much of your budget to spend on a household need. In the past year, the average price of bedroom furniture {change} by {pct}%.”

**General fact semantic key:** `cpi:SEHJ01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEHJ01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** “Canopy Thrift helps neighbors access donated clothing and household essentials. In 2025, clients used $206,768.67 in Canopy Thrift credits.”

Source fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`

Source/update: https://ourcac.org/. User-approved part 2 revision November 16, 2026. CAC 2025 repository snapshot; annual report refresh remains required. This program fact does not guarantee item availability.

</details>

<a id="d035"></a>
## D035 Groceries lost

Category — Food & Nutrition. Household scope — ALL. Engine — ordinary.

A refrigerator failure spoils your groceries. Replacing the food means spending money on something you already bought.

Eligibility — Food loss explicitly configured; do not charge appliance repair here.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D035-FULL — Replace all of the items**

Authored financial expression — -$165.00

Development balance change — -$165.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — spoiled_food_replaced_full

Response — You bought groceries to replace the food you lost.

**D035-SMALL — Buy only the immediate essentials**

Authored financial expression — -$65.00

Development balance change — -$65.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — spoiled_food_replaced_partial

Response — You replace fewer items and leave the rest of the basket unfilled.

**D035-CAC — Get replacement groceries from the CAC Mini-Market**

Authored financial expression — USD 0.00; free in-kind receipt; no cash credit

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Record actual approved items received and assistance use

Response — You received replacement groceries from the CAC Mini-Market.

Baseline and price notes — Unresolved: lost item list/quantities and store-specific prices; E13 cross-check only. Historical amounts audited: Lost groceries $165/$65. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

Losing groceries means paying again for food you had already planned to use.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Losing groceries means paying again for food you had already planned to use. In the past year, the average price of groceries purchased for home use {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SAF11
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “Losing groceries means paying again for food you had already planned to use. In the past year, the average price of groceries purchased for home use {change} by {pct}%.”

**General fact semantic key:** `cpi:SAF11`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SAF11. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (fact)

Replacing lost groceries brings the need for food back into the budget. In 2025, the CAC Mini-Market reported 1,160,328 pounds of food available.

Numbers in that text — 2025, · 1,160,328
Snapshot value — 1160328 Pounds. Reporting year 2025. Measure — pounds of food available from the CAC Mini-Market.

**Authored full fact or template**

Replacing lost groceries brings the need for food back into the budget. In 2025, the CAC Mini-Market reported 1,160,328 pounds of food available.

Numbers in authored text — 2025, · 1,160,328
Unresolved fields — None.
Data binding — efaf231b-3db3-4c4d-b276-758006af8aab
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Replacing lost groceries brings the need for food back into the budget. In 2025, the CAC Mini-Market reported 1,160,328 pounds of food available.”

Source: S18/S19; fact ID `efaf231b-3db3-4c4d-b276-758006af8aab`; service `mini_market`; key `pounds_of_food_available_from_the_cac_mini_market`; reporting year 2025; exact stored value `1160328` Pounds. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The expense here is replacement groceries, not repairing the refrigerator. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D035 — Groceries lost

**Baseline evidence and disposition (November 7):** Unresolved: lost item list/quantities and store-specific prices; E13 cross-check only. Historical amounts audited: Lost groceries $165/$65. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d035)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D035-FULL — Replace the full basket | -$165.00 |
| D035-SMALL — Buy only the immediate essentials | -$65.00 |
| D035-CAC — Get replacement groceries from the CAC Mini-Market | USD 0.00; free in-kind receipt; no cash credit |

**Recommended source/method:** S20/S09; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** food at home. **Required definition:** Define lost-food basket and replacement quantities; USDA is a household budget cross-check.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Losing groceries means paying again for food you had already planned to use. In the past year, the average price of groceries purchased for home use {change} by {pct}%.”

**General fact semantic key:** `cpi:SAF11`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SAF11. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Replacing lost groceries brings the need for food back into the budget. In 2025, the CAC Mini-Market reported 1,160,328 pounds of food available.”

Source: S18/S19; fact ID `efaf231b-3db3-4c4d-b276-758006af8aab`; service `mini_market`; key `pounds_of_food_available_from_the_cac_mini_market`; reporting year 2025; exact stored value `1160328` Pounds. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The expense here is replacement groceries, not repairing the refrigerator. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

</details>

<a id="d036"></a>
## D036 A full grocery basket?

Category — Food & Nutrition. Household scope — ALL. Engine — ordinary.

You have a grocery list, but buying everything on it would leave little money for anything else.

Eligibility — Approved household-sized food basket.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D036-FULL — Buy all your planned items**

Authored financial expression — -$95.00

Development balance change — -$95.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — food_basket_full

Response — You buy the full basket.

**D036-SMALL — Buy just the items needed for now**

Authored financial expression — -$50.00

Development balance change — -$50.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — food_basket_reduced

Response — You spend less and leave some listed food unpurchased.

**D036-CAC — Get groceries from the CAC Mini-Market**

Authored financial expression — USD 0.00; free in-kind receipt; no cash credit

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Record actual approved items received and assistance use

Response — You received groceries from the CAC Mini-Market.

Baseline and price notes — Unresolved: full/small item lists, people and coverage days; shared unit prices with D060. Historical amounts audited: Grocery basket $95/$50. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (fact)

Food insecurity can mean eating a less varied diet even when a household is still getting enough food to avoid cutting meal sizes.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Food insecurity can mean eating a less varied diet even when a household is still getting enough food to avoid cutting meal sizes.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — food:reduced_diet_variety
Sources — https://ers.usda.gov/topics/food-nutrition-assistance/food-security-in-the-us/measurement

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Food insecurity can mean eating a less varied diet even when a household is still getting enough food to avoid cutting meal sizes.”

**General fact semantic key:** `food:reduced_diet_variety`

Source/update: S33, [USDA: food-security measurement](https://ers.usda.gov/topics/food-nutrition-assistance/food-security-in-the-us/measurement). Paraphrases low food security definition; distinct from episodic shortages and child-specific measures. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.


</details>

#### CAC fact

**Development edition text** (fact)

Food support can be part of finding a way to fill the next grocery basket. In 2025, there were 36,521 visits to the CAC Mini-Market.

Numbers in that text — 2025, · 36,521
Snapshot value — 36521 Number. Reporting year 2025. Measure — visits to the CAC Mini-Market.

**Authored full fact or template**

Food support can be part of finding a way to fill the next grocery basket. In 2025, there were 36,521 visits to the CAC Mini-Market.

Numbers in authored text — 2025, · 36,521
Unresolved fields — None.
Data binding — 94210a01-4766-46ad-beba-d7400c9fd31e
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Food support can be part of finding a way to fill the next grocery basket. In 2025, there were 36,521 visits to the CAC Mini-Market.”

Source: S18/S19; fact ID `94210a01-4766-46ad-beba-d7400c9fd31e`; service `mini_market`; key `visits_to_the_cac_mini_market`; reporting year 2025; exact stored value `36521` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The decision is grocery access and choosing a food basket. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D036 — A full grocery basket?

**Baseline evidence and disposition (November 7):** Unresolved: full/small item lists, people and coverage days; shared unit prices with D060. Historical amounts audited: Grocery basket $95/$50. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d036)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D036-FULL — Buy the full basket | -$95.00 |
| D036-SMALL — Buy the smaller basket | -$50.00 |
| D036-CAC — Get groceries from the CAC Mini-Market | USD 0.00; free in-kind receipt; no cash credit |

**Recommended source/method:** S20/S09; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** food at home. **Required definition:** Define full/reduced baskets, servings and household/time coverage; do not assume proportional nutrition.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “Food insecurity can mean eating a less varied diet even when a household is still getting enough food to avoid cutting meal sizes.”

**General fact semantic key:** `food:reduced_diet_variety`

Source/update: S33, [USDA: food-security measurement](https://ers.usda.gov/topics/food-nutrition-assistance/food-security-in-the-us/measurement). Paraphrases low food security definition; distinct from episodic shortages and child-specific measures. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Food support can be part of finding a way to fill the next grocery basket. In 2025, there were 36,521 visits to the CAC Mini-Market.”

Source: S18/S19; fact ID `94210a01-4766-46ad-beba-d7400c9fd31e`; service `mini_market`; key `visits_to_the_cac_mini_market`; reporting year 2025; exact stored value `36521` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The decision is grocery access and choosing a food basket. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

</details>

<a id="d039"></a>
## D039 School Activities

Category — Childcare & Youth. Household scope — JORDAN. Engine — ordinary.

Maya brings home an information sheet for joining the soccer team. The fee is modest compared with rent, but it is another claim on the same money.

Eligibility — Maya is eligible for the optional school soccer activity.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D039-PAY — Pay the soccer team fee**

Authored financial expression — -$150.00

Development balance change — -$150.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — Direct effect or engine rule

Response — You paid the fee for Maya to participate in the soccer team.

**D039-DECLINE — Do not participate**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — Direct effect or engine rule

Response — Maya will not participate in the soccer team.

Baseline and price notes — Unresolved: dated actual school notice, admission/transport and fee; meal prices cannot validate a trip. Historical amounts audited: School trip $28. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (fact)

Participating in school activities can provide social, emotional, physical and intellectual benefits for children. School activities also strengthen the connections with peers and with their school community, enhancing the likelihood of graduation and preventing dropouts. The costs for these activities can leave students out.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Participating in school activities can provide social, emotional, physical and intellectual benefits for children. School activities also strengthen the connections with peers and with their school community, enhancing the likelihood of graduation and preventing dropouts. The costs for these activities can leave students out.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — school:activity_participation_barriers
Sources — https://mottpoll.org/reports-surveys/pay-participate-limiting-school-activities-lower-income-students

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Participating in school activities can provide social, emotional, physical and intellectual benefits for children. School activities also strengthen the connections with peers and with their school community, enhancing the likelihood of graduation and preventing dropouts. The costs for these activities can leave students out.”

**General fact semantic key:** `school:activity_participation_barriers`

Source/update: https://mottpoll.org/reports-surveys/pay-participate-limiting-school-activities-lower-income-students. User-approved part 2 revision November 16, 2026. Qualitative educational context; retain source provenance.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** Tools for School concerns supplies, not school-trip participation or fees. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D039 — School Activities

**Baseline evidence and disposition (November 7):** Unresolved: dated actual school notice, admission/transport and fee; meal prices cannot validate a trip. Historical amounts audited: School trip $28. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d039)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D039-PAY — Pay for the trip | -$28.00 |
| D039-DECLINE — Decline the optional trip | $0.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** none for official school fee; recheck notice. **Required definition:** Obtain dated school trip notice with included transport/admission and participation policy.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “Participating in school activities can provide social, emotional, physical and intellectual benefits for children. School activities also strengthen the connections with peers and with their school community, enhancing the likelihood of graduation and preventing dropouts. The costs for these activities can leave students out.”

**General fact semantic key:** `school:activity_participation_barriers`

Source/update: https://mottpoll.org/reports-surveys/pay-participate-limiting-school-activities-lower-income-students. User-approved part 2 revision November 16, 2026. Qualitative educational context; retain source provenance.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** Tools for School concerns supplies, not school-trip participation or fees. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d040"></a>
## D040 Worn-out coat

Category — Essential Goods & Clothing. Household scope — ALL. Engine — ordinary.

Your coat is worn out. You can replace it or repair it.

Eligibility — An adult household member needs a usable winter coat.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D040-BUY — Buy a replacement coat**

Authored financial expression — -$60.00

Development balance change — -$60.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — Direct effect or engine rule

Response — You bought a replacement coat.

**D040-REPAIR — Repair your current coat**

Authored financial expression — -$25.00

Development balance change — -$25.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — Direct effect or engine rule

Response — You repaired your current coat.

**D040-CAC — Use Canopy Thrift credits for a coat**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Direct effect or engine rule

Response — You used Canopy Thrift credits to get a coat.

Baseline and price notes — Unresolved: type/size/condition, exact item and repair work; no verified pair/repair quote. Historical amounts audited: Shoes $70/repair $25. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (fact)

Cold weather makes the body work harder, putting stress on the heart to ensure the body stays warm, and exposure to the cold predisposes people to infections like pneumonia. Coats are an essential part of staying safe and healthy during the winter months.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Cold weather makes the body work harder, putting stress on the heart to ensure the body stays warm, and exposure to the cold predisposes people to infections like pneumonia. Coats are an essential part of staying safe and healthy during the winter months.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — clothing:winter_cold_protection
Sources — https://www.cdc.gov/winter-weather/prevention/index.html

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Cold weather makes the body work harder, putting stress on the heart to ensure the body stays warm, and exposure to the cold predisposes people to infections like pneumonia. Coats are an essential part of staying safe and healthy during the winter months.”

**General fact semantic key:** `clothing:winter_cold_protection`

Source/update: https://www.cdc.gov/winter-weather/prevention/index.html. User-approved part 2 revision November 16, 2026. Qualitative educational context; retain source provenance.


</details>

#### CAC fact

**Development edition text** (fact)

Canopy Thrift helps neighbors access donated clothing and household essentials. In 2025, clients used $206,768.67 in Canopy Thrift credits.

Numbers in that text — 2025, · $206,768.67
Snapshot value — 206768.67 Dollars. Reporting year 2025. Measure — dollar amount of client credits used at CAC Canopy Thrift.

**Authored full fact or template**

Canopy Thrift helps neighbors access donated clothing and household essentials. In 2025, clients used $206,768.67 in Canopy Thrift credits.

Numbers in authored text — 2025, · $206,768.67
Unresolved fields — None.
Data binding — 859b8cec-1e1c-4887-9f55-fd55f1bb349c
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** “Canopy Thrift helps neighbors access donated clothing and household essentials. In 2025, clients used $206,768.67 in Canopy Thrift credits.”

Source fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`

Source/update: https://ourcac.org/. User-approved part 2 revision November 16, 2026. CAC 2025 repository snapshot; annual report refresh remains required. This program fact does not guarantee item availability.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D040 — Worn-out coat

**Baseline evidence and disposition (November 7):** Unresolved: type/size/condition, exact item and repair work; no verified pair/repair quote. Historical amounts audited: Shoes $70/repair $25. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d040)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D040-BUY — Buy the replacement shoes | -$70.00 |
| D040-REPAIR — Repair your existing shoes | -$25.00 |
| D040-CAC — Get shoes using credits from CAC Canopy Thrift | USD 0.00; free in-kind receipt; no cash credit |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** footwear; repair category if available. **Required definition:** Define shoe type/size and repair work; quote separately.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “Cold weather makes the body work harder, putting stress on the heart to ensure the body stays warm, and exposure to the cold predisposes people to infections like pneumonia. Coats are an essential part of staying safe and healthy during the winter months.”

**General fact semantic key:** `clothing:winter_cold_protection`

Source/update: https://www.cdc.gov/winter-weather/prevention/index.html. User-approved part 2 revision November 16, 2026. Qualitative educational context; retain source provenance.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** “Canopy Thrift helps neighbors access donated clothing and household essentials. In 2025, clients used $206,768.67 in Canopy Thrift credits.”

Source fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`

Source/update: https://ourcac.org/. User-approved part 2 revision November 16, 2026. CAC 2025 repository snapshot; annual report refresh remains required. This program fact does not guarantee item availability.

</details>

<a id="d042"></a>
## D042 School supplies for Maya

Category — Childcare & Youth. Household scope — JORDAN. Engine — ordinary.

Maya needs supplies for an upcoming school activity. You can buy the complete set or just the immediate required items.

Eligibility — Actual school period and approved item list.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D042-FULL — Buy the full supply set**

Authored financial expression — -$48.00

Development balance change — -$48.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — school_supplies_full

Response — You purchase the complete set.

**D042-BASIC — Buy only some of the items**

Authored financial expression — -$22.00

Development balance change — -$22.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — school_supplies_partial

Response — You buy the smaller set and leave the other items unpurchased.

**D042-CAC — Get school supplies through Tools for School**

Authored financial expression — USD 0.00; free in-kind receipt; no cash credit

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Record actual approved items received and assistance use

Response — You received school supplies through Tools for School.

Baseline and price notes — Unresolved: grade-specific school list and full/immediate item quantities; school lunch rate is unrelated pricing. Historical amounts audited: Supplies $48/$22. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

School supplies create another shopping list when the household budget is already committed.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

School supplies create another shopping list when the household budget is already committed. In the past year, the average price of educational books and supplies {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SEEA
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “School supplies create another shopping list when the household budget is already committed. In the past year, the average price of educational books and supplies {change} by {pct}%.”

**General fact semantic key:** `cpi:SEEA`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEEA. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (fact)

School supplies are the need at the center of Tools for School. In 2025, Tools for School served 1,090 children.

Numbers in that text — 2025, · 1,090
Snapshot value — 1090 Number. Reporting year 2025. Measure — children served by Tools for School.

**Authored full fact or template**

School supplies are the need at the center of Tools for School. In 2025, Tools for School served 1,090 children.

Numbers in authored text — 2025, · 1,090
Unresolved fields — None.
Data binding — c6a72bf1-47ac-4d53-9adc-8ad68dd120c4
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “School supplies are the need at the center of Tools for School. In 2025, Tools for School served 1,090 children.”

Source: S18/S19; fact ID `c6a72bf1-47ac-4d53-9adc-8ad68dd120c4`; service `tools_for_school`; key `children_served_by_tools_for_school`; reporting year 2025; exact stored value `1090` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The decision is specifically school supplies for a child. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D042 — School supplies for Maya

**Baseline evidence and disposition (November 7):** Unresolved: grade-specific school list and full/immediate item quantities; school lunch rate is unrelated pricing. Historical amounts audited: Supplies $48/$22. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d042)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D042-FULL — Buy the full supply set | -$48.00 |
| D042-BASIC — Buy only the immediate items | -$22.00 |
| D042-CAC — Get school supplies through Tools for School | USD 0.00; free in-kind receipt; no cash credit |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** educational books and supplies if available. **Required definition:** Obtain actual school supply list and separate full/immediate item baskets.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “School supplies create another shopping list when the household budget is already committed. In the past year, the average price of educational books and supplies {change} by {pct}%.”

**General fact semantic key:** `cpi:SEEA`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEEA. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “School supplies are the need at the center of Tools for School. In 2025, Tools for School served 1,090 children.”

Source: S18/S19; fact ID `c6a72bf1-47ac-4d53-9adc-8ad68dd120c4`; service `tools_for_school`; key `children_served_by_tools_for_school`; reporting year 2025; exact stored value `1090` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The decision is specifically school supplies for a child. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

</details>

<a id="d043"></a>
## D043 A family birthday

Category — Essential Goods & Clothing. Household scope — ALL. Engine — ordinary.

A child in your family has a birthday coming up. You can buy the gift you planned, choose a smaller gift, or give your time.

Eligibility — Fictional family occasion approved.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D043-GIFT — Buy the gift you planned**

Authored financial expression — -$35.00

Development balance change — -$35.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — birthday_gift_purchased

Response — You spend money on the planned gift.

**D043-SMALL — Choose a smaller gift**

Authored financial expression — -$10.00

Development balance change — -$10.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — birthday_small_gift

Response — You choose a less expensive gift.

**D043-TIME — Give your time instead**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — birthday_no_purchase

Response — You make no purchase and choose a nonfinancial gesture.

**D043-CAC — Use Canopy Thrift credits to choose a gift**

Authored financial expression — USD 0.00; in-kind gift; no cash credit

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Direct effect or engine rule

Response — You used Canopy Thrift credits to choose a gift.

Baseline and price notes — Add the user-approved eligible Canopy Thrift gift-credit choice at zero cash cost. Paid gift options continue to follow their price binding.

#### General fact

**Development edition text** (context)

A family birthday can mean balancing a gesture of care with money needed for essentials.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

A family birthday can mean balancing a gesture of care with money needed for essentials. In the past year, the average price of stationery, supplies and gift wrap {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SS33032
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “A family birthday can mean balancing a gesture of care with money needed for essentials. In the past year, the average price of stationery, supplies and gift wrap {change} by {pct}%.”

**General fact semantic key:** `cpi:SS33032`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SS33032. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** Hope for the Holidays is seasonal holiday support, not general birthday gifts. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D043 — A family birthday

**Baseline evidence and disposition (November 15, 2026):** Add the user-approved eligible Canopy Thrift gift-credit choice at zero cash cost. Paid gift options continue to follow their price binding.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d043)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D043-GIFT — Buy the gift you planned | -$35.00 |
| D043-SMALL — Choose a smaller gift | -$10.00 |
| D043-TIME — Give your time instead | $0.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** category pending selection of gifts. **Required definition:** Choose actual planned/smaller gifts; nonfinancial gesture stays zero.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “A family birthday can mean balancing a gesture of care with money needed for essentials. In the past year, the average price of stationery, supplies and gift wrap {change} by {pct}%.”

**General fact semantic key:** `cpi:SS33032`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SS33032. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** Hope for the Holidays is seasonal holiday support, not general birthday gifts. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d044"></a>
## D044 Getting to an appointment

Category — Employment & Adult Education. Household scope — ALL. Engine — ordinary.

You have a household appointment across town that you will need a ride to. A direct ride costs more, while the transit route takes longer.

Eligibility — A required household appointment and two feasible travel options are explicitly configured; not a workforce-program or medical-care event.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D044-DIRECT — Pay for a direct ride**

Authored financial expression — -$32.00

Development balance change — -$32.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — household_appointment_trip_direct

Response — You pay for the direct trip.

**D044-TRANSIT — Take the transit route**

Authored financial expression — -$6.00

Development balance change — -$5.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — household_appointment_trip_transit

Response — You spend less and commit more travel time.

Baseline and price notes — Ride unresolved; E02 transit formula requires paid-trip count and applicable operators. Historical amounts audited: Ride $32/transit $6. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

Getting to an appointment can mean choosing between a higher fare and more time in transit.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Getting to an appointment can mean choosing between a higher fare and more time in transit. In {period}, {pct}% of Sandy Springs households had no vehicle available.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {period} · {pct}
Data binding — acs:B08201:no_vehicle_households
Sources — https://api.census.gov/data/2024/acs/acs5/groups.html

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “Getting to an appointment can mean choosing between a higher fare and more time in transit. In {period}, {pct}% of Sandy Springs households had no vehicle available.”

**General fact semantic key:** `acs:B08201:no_vehicle_households`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B08201. Sum household-size categories with zero vehicles / all households; no inference about the player. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No general household-appointment transportation fact is assigned. The rarely used workforce transportation service is excluded from this replacement. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D044 — Getting to an appointment

**Baseline evidence and disposition (November 7):** Ride unresolved; E02 transit formula requires paid-trip count and applicable operators. Historical amounts audited: Ride $32/transit $6. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d044)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D044-DIRECT — Pay for a direct ride | -$32.00 |
| D044-TRANSIT — Take the transit route | -$6.00 |

**Recommended source/method:** S20/S12; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** transportation services; transit uses published fares. **Required definition:** Define household appointment route/time, direct fare, transit trips and transfers; no invented travel durations.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Getting to an appointment can mean choosing between a higher fare and more time in transit. In {period}, {pct}% of Sandy Springs households had no vehicle available.”

**General fact semantic key:** `acs:B08201:no_vehicle_households`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B08201. Sum household-size categories with zero vehicles / all households; no inference about the player. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No general household-appointment transportation fact is assigned. The rarely used workforce transportation service is excluded from this replacement. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d045"></a>
## D045 A coat for Maya

Category — Childcare & Youth. Household scope — JORDAN. Engine — ordinary.

Cold weather is here, and Maya needs a coat. You can buy a new one or a less expensive secondhand coat.

Eligibility — Approved cold-weather season and need.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D045-NEW — Buy the new coat**

Authored financial expression — -$60.00

Development balance change — -$60.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — child_coat_new

Response — You buy the new coat.

**D045-USED — Buy the secondhand coat**

Authored financial expression — -$24.00

Development balance change — -$24.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — child_coat_secondhand

Response — You meet the coat need with the lower-cost option.

**D045-CAC — Get a coat for Maya through Coats for Kids**

Authored financial expression — USD 0.00; free in-kind receipt; no cash credit

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Record actual approved items received and assistance use

Response — You received a coat for Maya through Coats for Kids.

Baseline and price notes — Unresolved: child size/material/warmth, new/used condition and exact offers. A toddler promotion cannot price Maya's unspecified coat. Historical amounts audited: Coat $60/$24. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (fact)

Coats are often the most expensive item in a child’s wardrobe, yet they tend to outgrow them quickly. Tight budgets can leave little room for seasonal clothing, yet clothing is not covered by major federal safety nets as food and healthcare are. Not having a coat can lead to school absences, physical health risks, or poor emotional well-being.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Coats are often the most expensive item in a child’s wardrobe, yet they tend to outgrow them quickly. Tight budgets can leave little room for seasonal clothing, yet clothing is not covered by major federal safety nets as food and healthcare are. Not having a coat can lead to school absences, physical health risks, or poor emotional well-being.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — clothing:child_clothing_insecurity
Sources — https://noteinthepocket.org/clothing-insecurity/

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Coats are often the most expensive item in a child’s wardrobe, yet they tend to outgrow them quickly. Tight budgets can leave little room for seasonal clothing, yet clothing is not covered by major federal safety nets as food and healthcare are. Not having a coat can lead to school absences, physical health risks, or poor emotional well-being.”

**General fact semantic key:** `clothing:child_clothing_insecurity`

Source/update: https://noteinthepocket.org/clothing-insecurity/. User-approved part 2 revision November 16, 2026. Qualitative educational context; retain source provenance.


</details>

#### CAC fact

**Development edition text** (fact)

A warm coat is the need at the center of Coats for Kids. In 2025, Coats for Kids served 623 children.

Numbers in that text — 2025, · 623
Snapshot value — 623 Number. Reporting year 2025. Measure — children served by Coats for Kids.

**Authored full fact or template**

A warm coat is the need at the center of Coats for Kids. In 2025, Coats for Kids served 623 children.

Numbers in authored text — 2025, · 623
Unresolved fields — None.
Data binding — e8473e58-6338-4855-93be-7608f27696ab
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “A warm coat is the need at the center of Coats for Kids. In 2025, Coats for Kids served 623 children.”

Source: S18/S19; fact ID `e8473e58-6338-4855-93be-7608f27696ab`; service `coats_for_kids`; key `children_served_by_coats_for_kids`; reporting year 2025; exact stored value `623` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The need is a child’s warm coat in the program’s season. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D045 — A coat for Maya

**Baseline evidence and disposition (November 7):** Unresolved: child size/material/warmth, new/used condition and exact offers. A toddler promotion cannot price Maya's unspecified coat. Historical amounts audited: Coat $60/$24. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d045)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D045-NEW — Buy the new coat | -$60.00 |
| D045-USED — Buy the secondhand coat | -$24.00 |
| D045-CAC — Get a coat for Maya through Coats for Kids | USD 0.00; free in-kind receipt; no cash credit |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** apparel. **Required definition:** Specify child coat size/material and new/secondhand condition; confirm season and CAC availability.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “Coats are often the most expensive item in a child’s wardrobe, yet they tend to outgrow them quickly. Tight budgets can leave little room for seasonal clothing, yet clothing is not covered by major federal safety nets as food and healthcare are. Not having a coat can lead to school absences, physical health risks, or poor emotional well-being.”

**General fact semantic key:** `clothing:child_clothing_insecurity`

Source/update: https://noteinthepocket.org/clothing-insecurity/. User-approved part 2 revision November 16, 2026. Qualitative educational context; retain source provenance.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “A warm coat is the need at the center of Coats for Kids. In 2025, Coats for Kids served 623 children.”

Source: S18/S19; fact ID `e8473e58-6338-4855-93be-7608f27696ab`; service `coats_for_kids`; key `children_served_by_coats_for_kids`; reporting year 2025; exact stored value `623` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The need is a child’s warm coat in the program’s season. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

</details>

<a id="d046"></a>
## D046 Packing lunch or buying it?

Category — Food & Nutrition. Household scope — EMPLOYED. Engine — ordinary.

You can prepare lunches ahead of time or get lunch out with your coworkers for this week's lunches. One option takes more time now; the other costs more money.

Eligibility — Hired; feasible cooking/storage assumptions.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D046-PACK — Buy ingredients and pack lunches**

Authored financial expression — -$26.00

Development balance change — -$26.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — work_lunches_packed

Response — You spend less and do the preparation.

**D046-BUY — Get lunch out with your coworkers**

Authored financial expression — -$55.00

Development balance change — -$55.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — work_lunches_purchased

Response — You got lunch out with your coworkers.

**D046-CAC — Get lunch ingredients from the CAC Mini-Market**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Direct effect or engine rule

Response — You received lunch ingredients from the CAC Mini-Market.

Baseline and price notes — Unresolved: lunch count, servings and actual ingredients/menu prices. Historical amounts audited: Lunch ingredients $26/bought $55. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (fact)

Sharing a meal can be about more than food. A 2017 study found that people who ate with others more often reported greater life satisfaction and more friends they could rely on.

Numbers in that text — 2017

**Authored full fact or template**

Sharing a meal can be about more than food. A 2017 study found that people who ate with others more often reported greater life satisfaction and more friends they could rely on.

Numbers in authored text — 2017
Unresolved fields — None.
Data binding — social:shared_meals_connection
Sources — https://doi.org/10.1007/s40750-017-0061-4

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Sharing a meal can be about more than food. A 2017 study found that people who ate with others more often reported greater life satisfaction and more friends they could rely on.”

**General fact semantic key:** `social:shared_meals_connection`

Source/update: https://doi.org/10.1007/s40750-017-0061-4. Dunbar (2017), Breaking Bread: the Functions of Social Eating. UK national survey; association, not proof that buying lunch causes wellbeing or that packed lunches prevent social contact. User approved this passage without “UK” in the displayed wording on November 17, 2026. Static dated research fact; monthly price bindings remain separate.


</details>

#### CAC fact

**Development edition text** (fact)

The CAC Mini-Market helps households obtain groceries, including food to prepare meals. In 2025, it served 7,034 individuals.

Numbers in that text — 2025, · 7,034
Snapshot value — 7034 Number. Reporting year 2025. Measure — individuals served by the CAC Mini-Market.

**Authored full fact or template**

The CAC Mini-Market helps households obtain groceries, including food to prepare meals. In 2025, it served 7,034 individuals.

Numbers in authored text — 2025, · 7,034
Unresolved fields — None.
Data binding — 0a3f963a-b2c5-47d6-8b9d-e0d396da6a66
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** “The CAC Mini-Market helps households obtain groceries, including food to prepare meals. In 2025, it served 7,034 individuals.”

Source fact ID `0a3f963a-b2c5-47d6-8b9d-e0d396da6a66`

Source/update: https://ourcac.org/. User-approved part 2 revision November 16, 2026. CAC 2025 repository snapshot; annual report refresh remains required. This program fact does not guarantee item availability.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D046 — Packing lunch or buying it?

**Baseline evidence and disposition (November 7):** Unresolved: lunch count, servings and actual ingredients/menu prices. Historical amounts audited: Lunch ingredients $26/bought $55. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d046)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D046-PACK — Buy ingredients and pack lunches | -$26.00 |
| D046-BUY — Get lunch out with your coworkers | -$55.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** food at home for packed; food away from home for purchased. **Required definition:** Define workday lunch count and servings; separate ingredient basket and local menu quotes.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “Sharing a meal can be about more than food. A 2017 study found that people who ate with others more often reported greater life satisfaction and more friends they could rely on.”

**General fact semantic key:** `social:shared_meals_connection`

Source/update: https://doi.org/10.1007/s40750-017-0061-4. Dunbar (2017), Breaking Bread: the Functions of Social Eating. UK national survey; association, not proof that buying lunch causes wellbeing or that packed lunches prevent social contact. User approved this passage without “UK” in the displayed wording on November 17, 2026. Static dated research fact; monthly price bindings remain separate.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** “The CAC Mini-Market helps households obtain groceries, including food to prepare meals. In 2025, it served 7,034 individuals.”

Source fact ID `0a3f963a-b2c5-47d6-8b9d-e0d396da6a66`

Source/update: https://ourcac.org/. User-approved part 2 revision November 16, 2026. CAC 2025 repository snapshot; annual report refresh remains required. This program fact does not guarantee item availability.

</details>

<a id="d047"></a>
## D047 A broken bag

Category — Essential Goods & Clothing. Household scope — ALL. Engine — ordinary.

The bag you use for everyday travel breaks. You can replace it or pay for a repair.

Eligibility — Bag owned and needed; not a qualification.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D047-REPLACE — Buy the replacement bag**

Authored financial expression — -$45.00

Development balance change — -$45.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — bag_replaced

Response — You buy a replacement.

**D047-REPAIR — Repair the existing bag**

Authored financial expression — -$15.00

Development balance change — -$15.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — bag_repaired

Response — You choose the repair.

Baseline and price notes — Unresolved: bag type/specification and fault/repair. Historical amounts audited: Bag $45/repair $15. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

A replacement bag is one of the personal goods that can become an unexpected purchase.

Numbers in that text — one

**Authored full fact or template**

A replacement bag is one of the personal goods that can become an unexpected purchase. In the past year, the average price of miscellaneous personal goods {change} by {pct}%.

Numbers in authored text — one
Unresolved fields — {change} · {pct}
Data binding — cpi:SEGE
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “A replacement bag is one of the personal goods that can become an unexpected purchase. In the past year, the average price of miscellaneous personal goods {change} by {pct}%.”

**General fact semantic key:** `cpi:SEGE`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEGE. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No fact establishes bag replacement/repair; the general clothing program is insufficient. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D047 — A broken bag

**Baseline evidence and disposition (November 7):** Unresolved: bag type/specification and fault/repair. Historical amounts audited: Bag $45/repair $15. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d047)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D047-REPLACE — Buy the replacement bag | -$45.00 |
| D047-REPAIR — Repair the existing bag | -$15.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** apparel accessories or luggage after item selection. **Required definition:** Define bag type/specification and each alternative including any repair.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “A replacement bag is one of the personal goods that can become an unexpected purchase. In the past year, the average price of miscellaneous personal goods {change} by {pct}%.”

**General fact semantic key:** `cpi:SEGE`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEGE. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No fact establishes bag replacement/repair; the general clothing program is insufficient. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d048"></a>
## D048 Meals for Maya

Category — Childcare & Youth. Household scope — JORDAN. Engine — ordinary.

Maya needs meals during a period when school is out of session.

Eligibility — Approved program season and child meals not already in groceries.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D048-MEALS — Buy the prepared meal allocation**

Authored financial expression — -$42.00

Development balance change — -$42.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — child_meals_prepared

Response — You pay for the prepared meals.

**D048-COOK — Buy ingredients and prepare the meals**

Authored financial expression — -$24.00

Development balance change — -$24.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — child_meals_home_prepared

Response — You spend less and commit preparation time.

**D048-CAC — Get meals for Maya through Meals for Kids**

Authored financial expression — USD 0.00; free in-kind receipt; no cash credit

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Record actual approved items received and assistance use

Response — You received meals for Maya through Meals for Kids.

Baseline and price notes — Unresolved: meal count and retail/school context; use E03 only for actual school meals. CAC allocation separate. Historical amounts audited: Prepared meals $42/ingredients $24. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (fact)

Missing meals and experiencing chronic hunger significantly impact children's physical growth, cognitive development, and mental health. This becomes a larger issue when school is out of session and it is up to households to find a child’s next meal.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Missing meals and experiencing chronic hunger significantly impact children's physical growth, cognitive development, and mental health. This becomes a larger issue when school is out of session and it is up to households to find a child’s next meal.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — food:child_hunger_school_breaks
Sources — https://www.nokidhungry.org/blog/effects-of-hunger-on-the-body

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Missing meals and experiencing chronic hunger significantly impact children's physical growth, cognitive development, and mental health. This becomes a larger issue when school is out of session and it is up to households to find a child’s next meal.”

**General fact semantic key:** `food:child_hunger_school_breaks`

Source/update: https://www.nokidhungry.org/blog/effects-of-hunger-on-the-body. User-approved part 2 revision November 16, 2026. Qualitative educational context; retain source provenance.


</details>

#### CAC fact

**Development edition text** (fact)

Meals for Kids connects with the need to plan food for Maya. In 2025, Meals for Kids served 1,097 children.

Numbers in that text — 2025, · 1,097
Snapshot value — 1097 Number. Reporting year 2025. Measure — children served by Meals for Kids.

**Authored full fact or template**

Meals for Kids connects with the need to plan food for Maya. In 2025, Meals for Kids served 1,097 children.

Numbers in authored text — 2025, · 1,097
Unresolved fields — None.
Data binding — 9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Meals for Kids connects with the need to plan food for Maya. In 2025, Meals for Kids served 1,097 children.”

Source: S18/S19; fact ID `9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01`; service `meals_for_kids`; key `children_served_by_meals_for_kids`; reporting year 2025; exact stored value `1097` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The scenario explicitly covers meals for a child during the program period. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D048 — Meals for Maya

**Baseline evidence and disposition (November 7):** Unresolved: meal count and retail/school context; use E03 only for actual school meals. CAC allocation separate. Historical amounts audited: Prepared meals $42/ingredients $24. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d048)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D048-MEALS — Buy the prepared meal allocation | -$42.00 |
| D048-COOK — Buy ingredients and prepare the meals | -$24.00 |
| D048-CAC — Get meals for Maya through Meals for Kids | USD 0.00; free in-kind receipt; no cash credit |

**Recommended source/method:** S13/S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** published school rates; food at home for retail meals. **Required definition:** Define school versus household meals, count and eligibility; free CAC receipt is separate.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “Missing meals and experiencing chronic hunger significantly impact children's physical growth, cognitive development, and mental health. This becomes a larger issue when school is out of session and it is up to households to find a child’s next meal.”

**General fact semantic key:** `food:child_hunger_school_breaks`

Source/update: https://www.nokidhungry.org/blog/effects-of-hunger-on-the-body. User-approved part 2 revision November 16, 2026. Qualitative educational context; retain source provenance.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Meals for Kids connects with the need to plan food for Maya. In 2025, Meals for Kids served 1,097 children.”

Source: S18/S19; fact ID `9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01`; service `meals_for_kids`; key `children_served_by_meals_for_kids`; reporting year 2025; exact stored value `1097` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The scenario explicitly covers meals for a child during the program period. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

</details>

<a id="d049"></a>
## D049 A fee to access your money

Category — Financial Literacy & Taxes. Household scope — ALL. Engine — ordinary.

You need to access your money. One option charges a fee; a slower option is free.

Eligibility — Approved fictional payment-access options; no new credit.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D049-FEE — Use the fee-charging access option**

Authored financial expression — -$9.00

Development balance change — -$9.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — payment_access_fee_paid

Response — You paid the fee to access your money sooner.

**D049-FREE — Use the free option**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — payment_access_free

Response — You avoid the fee and accept the slower process.

Baseline and price notes — Unresolved: institution/service, amount accessed, flat/percentage/third-party fees and genuine free alternative. Historical amounts audited: Money-access fee $9. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (fact)

People without bank accounts have cited high or unpredictable fees and minimum balance requirements among their reasons for staying outside the banking system.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

People without bank accounts have cited high or unpredictable fees and minimum balance requirements among their reasons for staying outside the banking system.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — banking:reported_access_barriers
Sources — https://www.federalreserve.gov/newsevents/speech/barr20250715a.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “People without bank accounts have cited high or unpredictable fees and minimum balance requirements among their reasons for staying outside the banking system.”

**General fact semantic key:** `banking:reported_access_barriers`

Source/update: S36, [Federal Reserve: financial inclusion](https://www.federalreserve.gov/newsevents/speech/barr20250715a.htm). Reported reasons, not evidence that every account has these charges or that the player is unbanked. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.


</details>

#### CAC fact

**Development edition text** (fact)

Comparing a fee with a free alternative is part of making your money stretch. In 2025, 218 students enrolled in Financial Literacy Classes.

Numbers in that text — 2025, · 218
Snapshot value — 218 Number. Reporting year 2025. Measure — students enrolled in Financial Literacy Classes.

**Authored full fact or template**

Comparing a fee with a free alternative is part of making your money stretch. In 2025, 218 students enrolled in Financial Literacy Classes.

Numbers in authored text — 2025, · 218
Unresolved fields — None.
Data binding — d32689c8-067a-4f59-aa48-2424384b7116
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Comparing a fee with a free alternative is part of making your money stretch. In 2025, 218 students enrolled in Financial Literacy Classes.”

Source: S18/S19; fact ID `d32689c8-067a-4f59-aa48-2424384b7116`; service `financial_literacy_classes`; key `students_enrolled_in_financial_literacy_classes`; reporting year 2025; exact stored value `218` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Comparing a fee-charging money-access route with a free route is financial-literacy context. Context only; no claim that CAC pays fees or offers the payment instrument.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D049 — A fee to access your money

**Baseline evidence and disposition (November 7):** Unresolved: institution/service, amount accessed, flat/percentage/third-party fees and genuine free alternative. Historical amounts audited: Money-access fee $9. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d049)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D049-FEE — Use the fee-charging access option | -$9.00 |
| D049-FREE — Use the free option | $0.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** none; published financial fee schedule. **Required definition:** Identify ATM/check-cashing/payment service, flat versus percentage charges, transaction size and free alternative.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “People without bank accounts have cited high or unpredictable fees and minimum balance requirements among their reasons for staying outside the banking system.”

**General fact semantic key:** `banking:reported_access_barriers`

Source/update: S36, [Federal Reserve: financial inclusion](https://www.federalreserve.gov/newsevents/speech/barr20250715a.htm). Reported reasons, not evidence that every account has these charges or that the player is unbanked. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Comparing a fee with a free alternative is part of making your money stretch. In 2025, 218 students enrolled in Financial Literacy Classes.”

Source: S18/S19; fact ID `d32689c8-067a-4f59-aa48-2424384b7116`; service `financial_literacy_classes`; key `students_enrolled_in_financial_literacy_classes`; reporting year 2025; exact stored value `218` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Comparing a fee-charging money-access route with a free route is financial-literacy context. Context only; no claim that CAC pays fees or offers the payment instrument.

</details>

<a id="d050"></a>
## D050 Running low on essentials

Category — Essential Goods & Clothing. Household scope — ALL. Engine — ordinary.

You are running low on household hygiene supplies. Buying the larger pack costs more today, while the smaller pack leaves more cash available.

Eligibility — Approved item quantities and household size.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D050-LARGE — Buy the larger pack**

Authored financial expression — -$32.00

Development balance change — -$32.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — hygiene_large_pack

Response — You buy more supplies now.

**D050-SMALL — Buy the smaller pack**

Authored financial expression — -$14.00

Development balance change — -$14.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — hygiene_small_pack

Response — You keep more cash and buy fewer supplies.

Baseline and price notes — Unresolved: item list/package sizes, unit quantities and store prices. Historical amounts audited: Essentials $32/$14. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

Running low on essentials means deciding how much you can buy with the cash available.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Running low on essentials means deciding how much you can buy with the cash available. In the past year, the average price of personal care products {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SEGB
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “Running low on essentials means deciding how much you can buy with the cash available. In the past year, the average price of personal care products {change} by {pct}%.”

**General fact semantic key:** `cpi:SEGB`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEGB. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No hygiene-supply assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D050 — Running low on essentials

**Baseline evidence and disposition (November 7):** Unresolved: item list/package sizes, unit quantities and store prices. Historical amounts audited: Essentials $32/$14. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d050)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D050-LARGE — Buy the larger pack | -$32.00 |
| D050-SMALL — Buy the smaller pack | -$14.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** personal care/household supplies by item. **Required definition:** Specify essentials basket, sizes, units and reduced option; apply separate indices where needed.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Running low on essentials means deciding how much you can buy with the cash available. In the past year, the average price of personal care products {change} by {pct}%.”

**General fact semantic key:** `cpi:SEGB`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEGB. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No hygiene-supply assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d051"></a>
## D051 A chance to learn

Category — Employment & Adult Education. Household scope — ALL. Engine — ordinary.

There is a skills workshop you would like to attend. The fee would leave less money for other needs.

Eligibility — Approved non-CAC workshop, attendance feasible, no qualification effect.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D051-ATTEND — Pay for and attend the workshop**

Authored financial expression — -$45.00

Development balance change — -$45.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — optional_workshop_attended

Response — You paid the fee and attended the workshop.

**D051-DECLINE — Decline the workshop this month**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — optional_workshop_declined

Response — You keep the money and do not attend.

**D051-CAC — Attend a free CAC Adult Education class**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Direct effect or engine rule

Response — You attended a free CAC Adult Education class.

Baseline and price notes — Unresolved: actual course/provider/date/material fees; no generic education price. Historical amounts audited: Workshop $45. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (fact)

Training can give people valuable skills for the workplace. Because they cannot afford the upfront time or money to participate, low-income families can miss out on income boosts from having advanced skills.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Training can give people valuable skills for the workplace. Because they cannot afford the upfront time or money to participate, low-income families can miss out on income boosts from having advanced skills.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — education:training_time_and_cost_barriers
Sources — https://www.oecd.org/en/publications/trends-in-adult-learning_ec0624a6-en.html

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Training can give people valuable skills for the workplace. Because they cannot afford the upfront time or money to participate, low-income families can miss out on income boosts from having advanced skills.”

**General fact semantic key:** `education:training_time_and_cost_barriers`

Source/update: https://www.oecd.org/en/publications/trends-in-adult-learning_ec0624a6-en.html. User-approved part 2 revision November 16, 2026. Qualitative educational context; retain source provenance.


</details>

#### CAC fact

**Development edition text** (fact)

CAC Adult Education offers opportunities to develop skills. In 2025, its adult education programs served 610 students.

Numbers in that text — 2025, · 610
Snapshot value — 610 Number. Reporting year 2025. Measure — total students in Adult Education programs.

**Authored full fact or template**

CAC Adult Education offers opportunities to develop skills. In 2025, its adult education programs served 610 students.

Numbers in authored text — 2025, · 610
Unresolved fields — None.
Data binding — 7cb64039-5726-43da-8f15-fbf8b63e8f83
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** “CAC Adult Education offers opportunities to develop skills. In 2025, its adult education programs served 610 students.”

Source fact ID `7cb64039-5726-43da-8f15-fbf8b63e8f83`

Source/update: https://ourcac.org/. User-approved part 2 revision November 16, 2026. CAC 2025 repository snapshot; annual report refresh remains required. This program fact does not guarantee item availability.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D051 — A chance to learn

**Baseline evidence and disposition (November 7):** Unresolved: actual course/provider/date/material fees; no generic education price. Historical amounts audited: Workshop $45. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d051)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D051-ATTEND — Pay for and attend the workshop | -$45.00 |
| D051-DECLINE — Decline the workshop this month | $0.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** tuition or instruction category after course selection. **Required definition:** Specify course/provider/materials and paid or free alternatives; no automatic earnings increase.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “Training can give people valuable skills for the workplace. Because they cannot afford the upfront time or money to participate, low-income families can miss out on income boosts from having advanced skills.”

**General fact semantic key:** `education:training_time_and_cost_barriers`

Source/update: https://www.oecd.org/en/publications/trends-in-adult-learning_ec0624a6-en.html. User-approved part 2 revision November 16, 2026. Qualitative educational context; retain source provenance.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** “CAC Adult Education offers opportunities to develop skills. In 2025, its adult education programs served 610 students.”

Source fact ID `7cb64039-5726-43da-8f15-fbf8b63e8f83`

Source/update: https://ourcac.org/. User-approved part 2 revision November 16, 2026. CAC 2025 repository snapshot; annual report refresh remains required. This program fact does not guarantee item availability.

</details>

<a id="d053"></a>
## D053 A holiday meal

Category — Food & Nutrition. Household scope — ALL. Engine — ordinary.

You can buy all the food that is a part of your normal family traditions, or a smaller selection that costs less.

Eligibility — Approved holiday season and distinct meal need.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D053-FULL — Buy the planned holiday meal**

Authored financial expression — -$85.00

Development balance change — -$85.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — holiday_meal_full

Response — You purchase the planned meal ingredients.

**D053-SMALL — Choose the smaller holiday meal**

Authored financial expression — -$38.00

Development balance change — -$38.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — holiday_meal_small

Response — You spend less and prepare a smaller meal.

**D053-CAC — Get a holiday food basket through CAC**

Authored financial expression — USD 0.00; free in-kind receipt; no cash credit

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Record actual approved items received and assistance use

Response — You received a holiday food basket through CAC.

Baseline and price notes — Unresolved: seasonal ingredient/serving lists and store prices; E13 is a budget cross-check, CAC receipt separate. Historical amounts audited: Holiday baskets $85/$38. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

Turkey can be one of the ingredients to budget for when planning a holiday meal.

Numbers in that text — one

**Authored full fact or template**

Turkey can be one of the ingredients to budget for when planning a holiday meal. In the past year, the average price of uncooked poultry other than chicken {change} by {pct}%.

Numbers in authored text — one
Unresolved fields — {change} · {pct}
Data binding — cpi:SEFF02
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “Turkey can be one of the ingredients to budget for when planning a holiday meal. In the past year, the average price of uncooked poultry other than chicken {change} by {pct}%.”

**General fact semantic key:** `cpi:SEFF02`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEFF02. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (fact)

Holiday food support connects with putting a seasonal meal on the table. In 2025, 984 households received Holiday Food Baskets.

Numbers in that text — 2025, · 984
Snapshot value — 984 Number. Reporting year 2025. Measure — households who received Holiday Food Baskets.

**Authored full fact or template**

Holiday food support connects with putting a seasonal meal on the table. In 2025, 984 households received Holiday Food Baskets.

Numbers in authored text — 2025, · 984
Unresolved fields — None.
Data binding — 1eec83c9-41ca-4aef-be22-1e36289d9d95
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Holiday food support connects with putting a seasonal meal on the table. In 2025, 984 households received Holiday Food Baskets.”

Source: S18/S19; fact ID `1eec83c9-41ca-4aef-be22-1e36289d9d95`; service `holiday_food_baskets`; key `households_who_received_holiday_food_baskets`; reporting year 2025; exact stored value `984` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The need is a distinct seasonal holiday food basket. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D053 — A holiday meal

**Baseline evidence and disposition (November 7):** Unresolved: seasonal ingredient/serving lists and store prices; E13 is a budget cross-check, CAC receipt separate. Historical amounts audited: Holiday baskets $85/$38. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d053)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D053-FULL — Buy the planned holiday basket | -$85.00 |
| D053-SMALL — Choose the smaller holiday basket | -$38.00 |
| D053-CAC — Get a holiday food basket through CAC | USD 0.00; free in-kind receipt; no cash credit |

**Recommended source/method:** S20/S09; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** food at home. **Required definition:** Define holiday meal servings, ingredients and smaller alternative; seasonal basket review.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Turkey can be one of the ingredients to budget for when planning a holiday meal. In the past year, the average price of uncooked poultry other than chicken {change} by {pct}%.”

**General fact semantic key:** `cpi:SEFF02`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEFF02. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Holiday food support connects with putting a seasonal meal on the table. In 2025, 984 households received Holiday Food Baskets.”

Source: S18/S19; fact ID `1eec83c9-41ca-4aef-be22-1e36289d9d95`; service `holiday_food_baskets`; key `households_who_received_holiday_food_baskets`; reporting year 2025; exact stored value `984` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The need is a distinct seasonal holiday food basket. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

</details>

<a id="d054"></a>
## D054 Clothes need replacing

Category — Essential Goods & Clothing. Household scope — ALL. Engine — ordinary.

An everyday clothing item needs replacing. Buying it new costs more than buying it secondhand.

Eligibility — Not the professional-clothing event.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D054-NEW — Buy the new item**

Authored financial expression — -$55.00

Development balance change — -$55.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — everyday_clothing_new

Response — You buy the new item.

**D054-USED — Buy the secondhand item**

Authored financial expression — -$20.00

Development balance change — -$20.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — everyday_clothing_used

Response — You choose the lower-cost item.

**D054-CAC — Get clothing using credits from CAC Canopy Thrift**

Authored financial expression — USD 0.00; free in-kind receipt; no cash credit

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Record actual approved items received and assistance use

Response — You used CAC Canopy Thrift credits to get clothing.

Baseline and price notes — Unresolved: garment/size and new/used equivalent item offers. Historical amounts audited: Clothing $55/$20. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

Replacing worn clothing means balancing what you need now with money needed elsewhere.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Replacing worn clothing means balancing what you need now with money needed elsewhere. In the past year, the average price of clothing other than footwear {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SA311
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “Replacing worn clothing means balancing what you need now with money needed elsewhere. In the past year, the average price of clothing other than footwear {change} by {pct}%.”

**General fact semantic key:** `cpi:SA311`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SA311. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (fact)

Clothing credits are one way CAC supports access to replacement clothing. In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift.

Numbers in that text — one · 2025, · $206,768.67
Snapshot value — 206768.67 Dollars. Reporting year 2025. Measure — dollar amount of client credits used at CAC Canopy Thrift.

**Authored full fact or template**

Clothing credits are one way CAC supports access to replacement clothing. In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift.

Numbers in authored text — one · 2025, · $206,768.67
Unresolved fields — None.
Data binding — 859b8cec-1e1c-4887-9f55-fd55f1bb349c
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Clothing credits are one way CAC supports access to replacement clothing. In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift.”

Source: S18/S19; fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`; service `canopy_thrift`; key `dollar_amount_of_client_credits_used_at_cac_canopy_thrift`; reporting year 2025; exact stored value `206768.67` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The decision concerns replacement clothing and a lower-cost alternative. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D054 — Clothes need replacing

**Baseline evidence and disposition (November 7):** Unresolved: garment/size and new/used equivalent item offers. Historical amounts audited: Clothing $55/$20. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d054)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D054-NEW — Buy the new item | -$55.00 |
| D054-USED — Buy the secondhand item | -$20.00 |
| D054-CAC — Get clothing using credits from CAC Canopy Thrift | USD 0.00; free in-kind receipt; no cash credit |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** apparel. **Required definition:** Define garment type/size, new/used condition and alternatives; free CAC allocation is separate.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Replacing worn clothing means balancing what you need now with money needed elsewhere. In the past year, the average price of clothing other than footwear {change} by {pct}%.”

**General fact semantic key:** `cpi:SA311`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SA311. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Clothing credits are one way CAC supports access to replacement clothing. In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift.”

Source: S18/S19; fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`; service `canopy_thrift`; key `dollar_amount_of_client_credits_used_at_cac_canopy_thrift`; reporting year 2025; exact stored value `206768.67` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The decision concerns replacement clothing and a lower-cost alternative. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

</details>

<a id="d055"></a>
## D055 Someone asks for help

Category — Financial Literacy & Taxes. Household scope — ALL. Engine — ordinary.

Someone you care about asks for help with an unexpected expense. Helping them leaves less for your own household.

Eligibility — Fictional person and request approved; no real contact information.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D055-FULL — Give the requested help**

Authored financial expression — -$60.00

Development balance change — -$60.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — family_help_full

Response — You give the requested amount. It is not a loan or expected repayment.

**D055-SMALL — Give a smaller amount**

Authored financial expression — -$20.00

Development balance change — -$20.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — family_help_partial

Response — You help with a smaller contribution.

**D055-DECLINE — Explain that you cannot contribute money**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — family_help_declined

Response — You keep the money and decline the financial request.

Baseline and price notes — Rule/source: chosen simulation amounts, not market prices; require explicit baseline rationale and maintained formula, never call them online-verified prices. Historical amounts audited: Voluntary transfers $60/$20. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

Helping someone else means deciding how much room is left in your own budget.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Helping someone else means deciding how much room is left in your own budget. In {period}, {pct}% of Sandy Springs families lived below the poverty threshold.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {period} · {pct}
Data binding — acs:B17010:family_poverty
Sources — https://api.census.gov/data/2024/acs/acs5/groups.html

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “Helping someone else means deciding how much room is left in your own budget. In {period}, {pct}% of Sandy Springs families lived below the poverty threshold.”

**General fact semantic key:** `acs:B17010:family_poverty`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B17010. Below-poverty families / all families in table; distinct from resident poverty rate. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (fact)

Deciding what you can give means taking your own financial commitments into account. In 2025, 218 students enrolled in Financial Literacy Classes.

Numbers in that text — 2025, · 218
Snapshot value — 218 Number. Reporting year 2025. Measure — students enrolled in Financial Literacy Classes.

**Authored full fact or template**

Deciding what you can give means taking your own financial commitments into account. In 2025, 218 students enrolled in Financial Literacy Classes.

Numbers in authored text — 2025, · 218
Unresolved fields — None.
Data binding — d32689c8-067a-4f59-aa48-2424384b7116
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Deciding what you can give means taking your own financial commitments into account. In 2025, 218 students enrolled in Financial Literacy Classes.”

Source: S18/S19; fact ID `d32689c8-067a-4f59-aa48-2424384b7116`; service `financial_literacy_classes`; key `students_enrolled_in_financial_literacy_classes`; reporting year 2025; exact stored value `218` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Balancing help for another person against one’s own budget is financial-literacy context. Context only; no CAC reimbursement, loan, or moral score.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D055 — Someone asks for help

**Baseline evidence and disposition (November 7):** Rule/source: chosen simulation amounts, not market prices; require explicit baseline rationale and maintained formula, never call them online-verified prices. Historical amounts audited: Voluntary transfers $60/$20. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d055)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D055-FULL — Give the requested help | -$60.00 |
| D055-SMALL — Give a smaller amount | -$20.00 |
| D055-DECLINE — Explain that you cannot contribute money | $0.00 |

**Recommended source/method:** S22; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** all items for approved simulated transfer baselines. **Required definition:** Treat $60/$20 as candidate November 2026 transfer baselines; proposed automatic plan is monthly all-items CPI-ratio recalculation after baseline/index approval. These remain voluntary simulated transfers, not loans or market quotes.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Helping someone else means deciding how much room is left in your own budget. In {period}, {pct}% of Sandy Springs families lived below the poverty threshold.”

**General fact semantic key:** `acs:B17010:family_poverty`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B17010. Below-poverty families / all families in table; distinct from resident poverty rate. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Deciding what you can give means taking your own financial commitments into account. In 2025, 218 students enrolled in Financial Literacy Classes.”

Source: S18/S19; fact ID `d32689c8-067a-4f59-aa48-2424384b7116`; service `financial_literacy_classes`; key `students_enrolled_in_financial_literacy_classes`; reporting year 2025; exact stored value `218` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Balancing help for another person against one’s own budget is financial-literacy context. Context only; no CAC reimbursement, loan, or moral score.

</details>

<a id="d056"></a>
## D056 A holiday gift for Maya

Category — Childcare & Youth. Household scope — JORDAN. Engine — ordinary.

You are considering a holiday gift for Maya. The planned gift costs more than a modest alternative.

Eligibility — Approved holiday season and supported item.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D056-PLANNED — Buy the planned gift**

Authored financial expression — -$65.00

Development balance change — -$65.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — holiday_gift_planned

Response — You buy the planned gift.

**D056-MODEST — Buy the modest alternative**

Authored financial expression — -$18.00

Development balance change — -$18.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — holiday_gift_modest

Response — You choose the less expensive gift.

**D056-DECLINE — Make no gift purchase this month**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — holiday_gift_not_purchased

Response — You did not buy a holiday gift this month.

**D056-CAC — Get a holiday gift for Maya through Hope for the Holidays**

Authored financial expression — USD 0.00; free in-kind receipt; no cash credit

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — Yes.

Outcome — Record actual approved items received and assistance use

Response — You received a holiday gift for Maya through Hope for the Holidays.

Baseline and price notes — Unresolved: exact planned/modest gifts and price/availability; CAC benefit independent. Historical amounts audited: Gifts $65/$18. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

A holiday gift can be meaningful while still competing with everyday expenses.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

A holiday gift can be meaningful while still competing with everyday expenses. In the past year, the average price of toys {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SERE01
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “A holiday gift can be meaningful while still competing with everyday expenses. In the past year, the average price of toys {change} by {pct}%.”

**General fact semantic key:** `cpi:SERE01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SERE01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (fact)

Hope for the Holidays connects with the wish to include a child in seasonal gift giving. In 2025, Hope for the Holidays served 614 households.

Numbers in that text — 2025, · 614
Snapshot value — 614 Number. Reporting year 2025. Measure — households served by Hope for the Holidays.

**Authored full fact or template**

Hope for the Holidays connects with the wish to include a child in seasonal gift giving. In 2025, Hope for the Holidays served 614 households.

Numbers in authored text — 2025, · 614
Unresolved fields — None.
Data binding — 18b975be-96cb-49ec-901b-ccd04c6c6a5c
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Hope for the Holidays connects with the wish to include a child in seasonal gift giving. In 2025, Hope for the Holidays served 614 households.”

Source: S18/S19; fact ID `18b975be-96cb-49ec-901b-ccd04c6c6a5c`; service `hope_for_the_holidays`; key `households_served_by_hope_for_the_holidays`; reporting year 2025; exact stored value `614` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The card explicitly concerns the named holiday program and a child’s holiday gift. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D056 — A holiday gift for Maya

**Baseline evidence and disposition (November 7):** Unresolved: exact planned/modest gifts and price/availability; CAC benefit independent. Historical amounts audited: Gifts $65/$18. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d056)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D056-PLANNED — Buy the planned gift | -$65.00 |
| D056-MODEST — Buy the modest alternative | -$18.00 |
| D056-DECLINE — Make no gift purchase this month | $0.00 |
| D056-CAC — Get a holiday gift for Maya through Hope for the Holidays | USD 0.00; free in-kind receipt; no cash credit |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** toys or appropriate gift category after item selection. **Required definition:** Specify planned/modest gifts; confirm CAC seasonal item availability without equating retail values.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “A holiday gift can be meaningful while still competing with everyday expenses. In the past year, the average price of toys {change} by {pct}%.”

**General fact semantic key:** `cpi:SERE01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SERE01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Hope for the Holidays connects with the wish to include a child in seasonal gift giving. In 2025, Hope for the Holidays served 614 households.”

Source: S18/S19; fact ID `18b975be-96cb-49ec-901b-ccd04c6c6a5c`; service `hope_for_the_holidays`; key `households_served_by_hope_for_the_holidays`; reporting year 2025; exact stored value `614` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The card explicitly concerns the named holiday program and a child’s holiday gift. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

</details>

<a id="d058"></a>
## D058 Laundry supplies are running low

Category — Essential Goods & Clothing. Household scope — SOFIA. Engine — ordinary.

You and your spouse need laundry supplies. A larger purchase costs more today; buying only the immediate amount keeps cash available.

Eligibility — Two-person household; not already included in hygiene basket.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D058-LARGE — Buy the larger quantity**

Authored financial expression — -$28.00

Development balance change — -$28.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — laundry_supplies_large

Response — You bought the larger quantity of laundry supplies.

**D058-SMALL — Buy the immediate amount**

Authored financial expression — -$12.00

Development balance change — -$12.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — laundry_supplies_small

Response — You buy less and keep more cash.

Baseline and price notes — Unresolved: exact detergent/supply SKU, package size/doses, store availability, tax. Generic online prices without selected store do not verify totals. Historical amounts audited: Laundry supplies $28/$12. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (context)

Buying laundry supplies means balancing what you need now against the cost of a larger pack.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Buying laundry supplies means balancing what you need now against the cost of a larger pack. In the past year, the average price of household cleaning products {change} by {pct}%.

Numbers in authored text — No explicit numeric value.
Unresolved fields — {change} · {pct}
Data binding — cpi:SEHN01
Sources — https://www.bls.gov/cpi/additional-resources/index-publication-level.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact template:** “Buying laundry supplies means balancing what you need now against the cost of a larger pack. In the past year, the average price of household cleaning products {change} by {pct}%.”

**General fact semantic key:** `cpi:SEHN01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEHN01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.


</details>

#### CAC fact

**Development edition text** (unavailable)

No topic-matched fact is included in this development edition.

Numbers in that text — No explicit numeric value.

**Authored full fact or template**

Awaiting a supported topic-matched observation.

Numbers in authored text — No explicit numeric value.
Unresolved fields — None.
Data binding — Not assigned.
Sources — See evidence notes.

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No laundry-detergent/supply assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D058 — Laundry supplies are running low

**Baseline evidence and disposition (November 7):** Unresolved: exact detergent/supply SKU, package size/doses, store availability, tax. Generic online prices without selected store do not verify totals. Historical amounts audited: Laundry supplies $28/$12. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d058)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D058-LARGE — Buy the larger quantity | -$28.00 |
| D058-SMALL — Buy the immediate amount | -$12.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** housekeeping supplies. **Required definition:** Define detergent/supplies, package sizes and unit prices; distinguish purchase cost from cost per load.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Buying laundry supplies means balancing what you need now against the cost of a larger pack. In the past year, the average price of household cleaning products {change} by {pct}%.”

**General fact semantic key:** `cpi:SEHN01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEHN01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No laundry-detergent/supply assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

</details>

<a id="d059"></a>
## D059 Time with a friend

Category — Financial Literacy & Taxes. Household scope — ALL. Engine — ordinary.

You have an opportunity to spend time with a friend. The planned outing costs money; an agreed free alternative is available.

Eligibility — Optional fictional outing; no wellbeing scoring.

Authored timing — non_scheduled; eligible ordinary day selected by the approved route. No automatic day number is invented. Exclude Day 2 and conditional interview Day 3.

### Prices fees and outcomes

**D059-OUT — Pay for the planned outing**

Authored financial expression — -$25.00

Development balance change — -$25.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — social_outing_paid

Response — You choose the paid outing and its cost.

**D059-FREE — Choose the free alternative together**

Authored financial expression — $0.00

Development balance change — $0.00. Upfront requirement — $0.00. CAC-only — No.

Outcome — social_outing_free

Response — You keep the money and choose the free plan.

Baseline and price notes — Unresolved: actual venue/activity/people/menu/fees; free alternative remains $0. Historical amounts audited: Outing $25. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

#### General fact

**Development edition text** (fact)

Americans were less likely to spend time socializing or communicating on an average day in 2025 than in 2015, according to the U.S. time-use survey.

Numbers in that text — 2025 · 2015,

**Authored full fact or template**

Americans were less likely to spend time socializing or communicating on an average day in 2025 than in 2015, according to the U.S. time-use survey.

Numbers in authored text — 2025 · 2015,
Unresolved fields — None.
Data binding — social:less_daily_socializing
Sources — https://www.bls.gov/news.release/archives/atus_06252026.htm

<details><summary>Source evidence and update method</summary>

**Player-facing general fact:** “Americans were less likely to spend time socializing or communicating on an average day in 2025 than in 2015, according to the U.S. time-use survey.”

**General fact semantic key:** `social:less_daily_socializing`

Source/update: S34, [BLS: 2025 American Time Use Survey](https://www.bls.gov/news.release/archives/atus_06252026.htm). Release comparison across years; does not establish that paid outings improve well-being or that socializing requires money. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.


</details>

#### CAC fact

**Development edition text** (fact)

Finding room for a paid outing is one of the choices involved in managing a budget. In 2025, 218 students enrolled in Financial Literacy Classes.

Numbers in that text — one · 2025, · 218
Snapshot value — 218 Number. Reporting year 2025. Measure — students enrolled in Financial Literacy Classes.

**Authored full fact or template**

Finding room for a paid outing is one of the choices involved in managing a budget. In 2025, 218 students enrolled in Financial Literacy Classes.

Numbers in authored text — one · 2025, · 218
Unresolved fields — None.
Data binding — d32689c8-067a-4f59-aa48-2424384b7116
Sources — https://ourcac.org/

<details><summary>Source evidence and update method</summary>

**Player-facing CAC fact template:** “Finding room for a paid outing is one of the choices involved in managing a budget. In 2025, 218 students enrolled in Financial Literacy Classes.”

Source: S18/S19; fact ID `d32689c8-067a-4f59-aa48-2424384b7116`; service `financial_literacy_classes`; key `students_enrolled_in_financial_literacy_classes`; reporting year 2025; exact stored value `218` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Choosing between a paid outing and a free alternative is a discretionary-budget tradeoff. Context only; no claim of CAC leisure funding or a judgment about spending.



</details>

<details><summary>Complete scenario sourcing section</summary>

### D059 — Time with a friend

**Baseline evidence and disposition (November 7):** Unresolved: actual venue/activity/people/menu/fees; free alternative remains $0. Historical amounts audited: Outing $25. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d059)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D059-OUT — Pay for the planned outing | -$25.00 |
| D059-FREE — Choose the free alternative together | $0.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** recreation or food away from home after outing selection. **Required definition:** Define venue/activity, person count and included costs; free plan has no invented expense.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “Americans were less likely to spend time socializing or communicating on an average day in 2025 than in 2015, according to the U.S. time-use survey.”

**General fact semantic key:** `social:less_daily_socializing`

Source/update: S34, [BLS: 2025 American Time Use Survey](https://www.bls.gov/news.release/archives/atus_06252026.htm). Release comparison across years; does not establish that paid outings improve well-being or that socializing requires money. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Finding room for a paid outing is one of the choices involved in managing a budget. In 2025, 218 students enrolled in Financial Literacy Classes.”

Source: S18/S19; fact ID `d32689c8-067a-4f59-aa48-2424384b7116`; service `financial_literacy_classes`; key `students_enrolled_in_financial_literacy_classes`; reporting year 2025; exact stored value `218` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Choosing between a paid outing and a free alternative is a discretionary-budget tradeoff. Context only; no claim of CAC leisure funding or a judgment about spending.

</details>

## Source files

- [Structured authored library](data/scenario-library-draft.json)
- [Development SQL artifact](../supabase/content/scenario-library-development.sql)
- [Scenario source research and financial components](scenario-data-sourcing.md)
- [CAC 2025 fact snapshot](data/cac-service-facts-2025.json)
- [Employment engine SQL](../supabase/migrations/20261103000000_employment_gameplay.sql)
