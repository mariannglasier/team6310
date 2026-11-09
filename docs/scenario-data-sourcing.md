# Scenario data sourcing and API coverage

## Automatic publication of data refreshes - November 7, 2026

User decision: routine source-driven price, wage, refund, fee, assistance-cap and numerical-fact updates automatically produce and publish a new immutable edition after automated validation, with no human review or CAC approval step. This supersedes earlier monthly review/approval gates. Configure sources, baseline evidence, formulas, fact templates and validation rules during initial setup; routine updates reuse those definitions. New scenarios, new service/eligibility mappings and changes to gameplay rules remain a separate content workflow, not a prerequisite for publishing routine data updates. Do not regenerate free-form claims or infer new services from changed data.

Monthly maintenance fetches/imports observations, validates units/geography/period/schema and required bindings, calculates dependent amounts/fact text, and atomically publishes the validated edition for new games. Keep an audit diff and machine validation results for traceability, not approval. Unchanged inputs are a no-op. Failed or missing inputs retain their last usable values and flag source status; if a complete valid edition cannot be built, retain the current published edition. No monthly review queue or approval request is created. Active/completed games and recorded obligations retain their original version. This documents required behavior; automation is not yet implemented.


November 7, 2026 · Research and review handoff · No integrations or price changes implemented.

## Baseline correction and online audit - November 7, 2026

The historical draft amounts below are not verified market baselines. The [online baseline evidence](#online-baseline-evidence---november-7-2026) and individual scenario dispositions below supersede them as baseline guidance, covering all D001-D060 monetary choices and shared fees. In particular, reject $650 as supported full-apartment Sandy Springs monthly rent: the checked Rent.com figures are $1,387 for a one-bedroom and $1,737 for a two-bedroom North Springs apartment. Bedroom, lease/share and mandatory-charge mappings remain necessary. Do not inflation-index an unsupported draft amount and call it verified.

The API search now also identifies RentCast rental listings, Best Buy product/store APIs and OpenEI electricity tariffs as candidates. Kroger's official API access could not be verified. No integration or gameplay price was changed. Unresolved baseline rows remain publication blockers; a link to a generic source does not resolve them.

## Scope and reading guide

This document inventories all 60 cards in [the draft library](scenario-draft-library.md), separates financial inputs from general and CAC facts, and recommends retrieval/update methods. Current draft prices are reproduced for traceability, not endorsed as November 2026 quotes. Exactly one proposed general fact and one existing CAC pairing or explicit CAC gap appear per card. Missing evidence remains a publication blocker under [scenarios.md](scenarios.md). The November 7 monetary-update requirement below supersedes earlier fixed-amount exceptions; other approved gameplay rules remain in force.

Goal: every monetary component and factual number has an identified source or an explicitly reviewed simulation assumption. API availability does not establish local accuracy. Prefer address/ZIP evidence, then city, county, metro, state or national evidence as appropriate; record the actual geography rather than relabeling it Sandy Springs. ZIP boundaries are not city boundaries.

**Status:** Online baseline evidence and replacement proposals are recorded in the online evidence below; complete all-in local baselines remain unresolved where scope, eligibility or charges are missing. No general numerical facts resolved or approved. Existing CAC records are reproduced from the November 6 snapshot, not independently verified against original reports. General and CAC fact passages include scenario-specific player-facing context. Templates become display-ready after validated source values replace all braced tokens. The 30 CAC evidence gaps still lack supported fact passages. New sources/categories are recommendations pending review. API documentation was inspected, but authenticated endpoint calls and exact variable/series validation were not performed.

## Fact variety within a playthrough - November 7, 2026

General facts must not repeat within the same playthrough. CAC facts may repeat when the relevant available pool is exhausted, but prefer unused relevant observations, especially across multiple food scenarios. Changing an introduction, rounding, observation date or provider does not make the same measure/population/geography a different general fact. Different measures from one source can be distinct facts.

Use stable semantic fact keys alongside edition-specific observation IDs. Persist committed fact-display history per playthrough and restore it on refresh; redisplaying the current recap is not a new selection. New runs start a fresh history. Relevance takes priority over variety: never substitute an unrelated statistic or imply new assistance.

At edition construction, assign exactly one general and one CAC fact per scenario under the existing content contract. Automated validation must ensure scenarios reachable together have distinct general semantic fact keys. Shared general bindings are allowed only for mutually exclusive scenarios. Otherwise source another relevant observation or explicitly constrain routing before publication. Route selection must preserve uniqueness. Unresolved conflicts block automated publication rather than repeat or omit a required general fact.

Distribute distinct suitable CAC observations across scenarios that can appear together. Prefer unused candidates, then the least-used relevant fact if a repeat is necessary; break ties by least-recently shown, then stable ID. This requirement does not change eligibility or benefits. Routine data refresh preserves semantic identities and validates variety without monthly human approval.

Current status: the 60 general slots below now have 60 distinct semantic measure keys; no mutually exclusive routing workaround is needed to resolve document duplicates. Numerical observations and initial binding validation remain pending. CAC repeats are allowed under the relevance/exhaustion rule; D046 now uses the sourced donation observation instead of repeating D041. This is a document assignment, not implemented gameplay enforcement.

## Player-facing fact copy

General facts may be numerical or qualitative. Prefer a sourced observation about people, their circumstances or the decision over a loosely related statistic. Do not turn every price binding into an inflation fact: financial maintenance and player-facing facts serve separate purposes. Qualitative facts must be descriptive, not recommendations, unsupported moral lessons or claims about what the player should do. Preserve their source, population, date where relevant and semantic identity.

Facts describe people, their circumstances or sourced real-world conditions; they are not recommendations or instructions about what the player should do. Qualitative facts are welcome and do not need a numerical API binding.

November 7 copy update: all 60 general fact templates and 30 sourced CAC passages now connect the observation to the household decision. Context does not assert a measured cause, guaranteed outcome or new assistance benefit. These passages are proposed display copy; source/update paragraphs and evidence gaps are staff/developer notes. Substitute validated numbers, dates and geography from the versioned source binding before display; never show unresolved tokens. Missing CAC facts remain publication gaps. Initial template/source verification is separate from routine automatic refresh and publication, which requires no monthly human review.

## Shared numerical and review rules

- All money rows below are copied from source choice tables, including zero-cost decisions and unresolved formulas. Separate components even when a choice displays a net amount. All bill late-fee/principal/total statements are inventoried separately. Repeated dollar figures in result text must resolve to the same binding.
- Zero-cost decisions and free CAC services stay zero. CAC goods are in-kind receipts, not cash or a credit equal to the retail alternative. Bill support uses approved eligible coverage capped to the expense; annual CAC totals never set benefits. Exact benefit caps, eligibility, quantities and availability need CAC review.
- **User decision, November 7, 2026: no monetary value may be hard coded without an automatic update plan.** This includes interview clothing, tax refunds, wages, fees, transfer amounts and assistance caps. Earlier approval of $60 clothing or a $1,000 refund is not an exemption. Dollar amounts reproduced below are historical draft references or candidate baselines, never permanent constants. Every monetary binding must declare its source, automatic retrieval/import or recalculation method, schedule, formula, baseline where relevant, failure/staleness handling and edition review/publication path. Missing plans block publication.
- Numerical rules such as Days 1–30, Day 2/3 interviews, weekly pay seven days after hiring, one-time filing, zero starting weekly income and counts of events remain model rules. Their source is S22, not a market API. Child ages, household size, ownership, quantities and hours are approved model inputs unless expressly externally sourced. D025 care hours require explicit quantity calculations.
- Use exact USD/cents; record rounding once at the resolved monetary value, with half-cent ties away from zero. Retain raw observations and calculations. Derived debt totals, shares, tax, fees, CAC remainders and percentages are formulas, not independent API prices.
- Each numerical fact needs source/series or table, precise variable(s), geography, universe, denominator, units, observation period, release/retrieval dates, calculation and reviewer. Keep ACS margins of error and survey weights/methodology. Annual historical facts retain their year; do not inflate counts or percentages.

## November 2026 baseline and update policy

For a price with no suitable direct feed, first collect a dated local quote: exact product/service, quantity, condition, provider location, mandatory tax/delivery/installation charges and promotion terms. A draft amount is not that evidence. Then approve a matching CPI category/geography and baseline observation.

`estimate(t) = verified baseline price × index(t) / index(base)`

Record baseline quote date separately from CPI observation period and release date. Use the same series, units and seasonal-adjustment treatment in both observations. Atlanta CPI has observations every two months (S02); S04 is labeled monthly by FRED but contains missing alternate months. Never convert missing observations to zero, invent November CPI, or compound an annual percentage every month. If the desired baseline index is unavailable, keep the quote unchanged until staff explicitly approve a documented anchor period. Index-adjusted estimates are not newly verified quotes. Category availability must be validated; national category data may be preferable to a local all-items index but must retain its national label.

Recommended local quote recheck: quarterly, plus sooner for discontinued products, expired promotions or changed service scope. Published tariffs/fares/school rates update by effective date, not CPI. Existing liabilities and contractual payments stay fixed to their originating agreement.

Use the existing first-of-month 12:00 a.m. America/New_York maintenance schedule: fetch/import, validate, store immutable observations, recompute dependent bindings and fact text, retain an audit diff, and automatically publish a validated new immutable edition without staff review. New games receive the approved edition; active/completed games retain theirs. Monthly checking does not imply monthly publication by a source. On failure retain the last approved value, its original observation date and a staff-visible stale/error status. Never silently substitute geography or index. Suggested freshness thresholds must be configured per release schedule before launch. No scheduler was created here.

### Automatic update coverage for every monetary value

An automatic update plan may retrieve a released API observation, ingest a supported published file/rate, or recalculate an approved baseline using a maintained index/formula. Automated validation is the publication gate; routine updates require no staff review or approval. Initial source/formula setup is separate from monthly operation. Rates can remain unchanged when a scheduled check finds no change. A failed check preserves the last approved value and flags staleness; it does not manufacture a new price.

Published fares, school prices, provider fees and contract schedules need a defined machine-readable import or supported extraction job with schema/effective-date validation. These jobs are proposed, not implemented. Where automation is not yet established, the binding is PENDING and cannot be published under this policy. Wages already have an automatic BLS OEWS ingestion implementation (see the job-wage integration section); reuse its hourly-wage and weekly-gross calculation, and extend draft-only publication to the requested automatic edition publication. Any net-income transformation needs its own defined formula. Assistance caps require an automatically maintained CAC source or an approved recalculation method; annual impact totals cannot supply that cap.

For new editions, fictional repayment amounts require an automatically maintained agreement source or approved baseline/formula; voluntary transfer amounts require an approved baseline/index calculation. Already-incurred debt and an active game retain their originating edition and transaction amounts: this protects recorded obligations and does not exempt future editions from automatic maintenance. Zero-dollar choices and free CAC receipts resolve through the maintained no-charge eligibility/service rule; they are not inflation-indexed. Rule checks can confirm zero remains correct without creating a fee.

## Existing job-wage integration as the implementation model

Repository inspection on November 7, 2026 confirms an implemented BLS OEWS importer, not merely a proposed table import. Its operational deployment, GitHub secrets, successful scheduled runs and current live database values were not checked in this inspection.

| Part | Existing implementation | Pattern to reuse for scenario values |
| --- | --- | --- |
| Source adapter | [sources.py](../integrations/bls_oews/sources.py) retrieves BLS Public Data API observations; optional official spreadsheet file input | Provider-specific adapters with a common observation contract; external APIs need not be called during gameplay |
| Stable mapping | [config.py](../integrations/bls_oews/config.py) selects eight SOC occupations and Atlanta metro area 12060; hourly median datatype 08 and annual median datatype 13 | Stable price/fact binding IDs, explicit geography and measure; do not match by narrative text |
| Release discovery | Latest published annual wage year is discovered from returned hourly series rather than hard coded; missing occupations in that year are flagged | Detect newest usable releases and distinguish missing observations from unchanged data |
| Validation | [validate.py](../integrations/bls_oews/validate.py) checks occupation, geography, year, plausible range and whole cents; source adapter also cross-checks hourly/annual medians | Validate units, period, category and formulas before writing; configure source-specific checks |
| Provenance | Importer writes median_hourly_wage, wage_year, wage_source_url and last_synced_at only | Preserve raw source observation, reporting period, retrieval time and dependent bindings |
| Calculated amounts | [jobs migration](../supabase/migrations/20261027063526_add_curated_bls_jobs_and_employment_links.sql) defines weekly_gross_income as round(median_hourly_wage * hours_per_week, 2) | Store source inputs and controlled derived formulas; render and charge the same resolved amount |
| Scheduler | [GitHub Actions workflow](../.github/workflows/bls_oews_sync.yml) has first-of-month UTC schedules plus an America/New_York guard, importer tests, secrets checks, concurrency control and a run summary | Reuse scheduled backend maintenance, visible failures, dry runs and audit summaries; actual execution time depends on the scheduler |
| Unchanged/invalid inputs | Unchanged wages are not rewritten; invalid or older observations are skipped and reported | No-op unchanged bindings; preserve usable values and record failures |
| Version boundary | [bls_oews_sync.py](../integrations/bls_oews/bls_oews_sync.py) writes only drafts; when needed it clones jobs into a new draft, leaving published versions unchanged | Preserve immutable published snapshots and active-run version references |

**Current gap against the requested behavior:** the wage importer deliberately does not approve, activate or publish jobs. New draft jobs start inactive/unapproved; the existing README describes manual activation/review. It clones jobs only, not a complete playable edition. Automatic publication therefore requires extending the publication workflow to construct and validate a complete edition and atomically publish it without monthly human approval. Do not simply activate a jobs-only clone or remove checks. Initial configuration of hours/qualifications remains separate from source wage refreshes; the importer does not change those fields. Weekly pay is gross, not automatically estimated take-home pay.

**Correction to earlier source recommendations:** S10 is a fallback/reference, not a new wage integration that must be built. A01 already supplies the implemented OEWS wage path. D001/D003 and hired-job income associated with D002/D004 should reuse these existing bindings and extend their publication path. Other economic adapters should follow this source -> validation -> stored input -> calculated amount -> immutable edition pattern, with automatic publication added to satisfy the current policy. No wage code or workflow behavior was changed by this documentation update.

## Local evidence register

S20 now includes the [online evidence register](#checked-online-price-evidence). These observations are scoped cross-checks and replacement proposals; missing all-in local quote details remain collection tasks. Create one record per quote with: evidence ID, scenario/choice/component, seller/provider URL, location/service area, captured date, effective/expiry dates, product/SKU or service scope, quantity/unit, base price, mandatory taxes/fees, final price, evidence attachment/reference, reviewer and approval date. Record at least two comparable local quotes where practical and document the approved selection method; do not call their average a representative market survey. No retailer, insurer, repair, medical, bank or rideshare pricing API is established by this audit.

## Online baseline evidence - November 7, 2026

Online evidence checked November 7, 2026. This evidence supersedes the historical dollar examples in the draft library and scenario inventory as baseline guidance. It does not change application prices or approve new household, product, service or gameplay definitions.

The earlier amounts were copied from scenario drafts. They were not collected market baselines. None becomes a verified baseline simply because it appears plausible or has a proposed CPI category. An index cannot correct an unsupported starting price.

## Rent correction

Reject $650 as a supported full-apartment monthly rent for Sandy Springs. No evidence collected here supports it. Do not explain it retroactively as a roommate share, subsidy or partial month; those require an explicit household arrangement and calculation.

[Rent.com](https://www.rent.com/georgia/sandy-springs-apartments/rent-trends), updated November 5, 2026, reports city apartment averages of **$1,387 for one bedroom and $1,737 for two bedrooms**. Its neighborhood figures are:

| Neighborhood | One bedroom/month | Two bedrooms/month |
| --- | ---: | ---: |
| North Springs | $1,387 | $1,737 |
| Highpoint | $1,584 | $1,884 |
| Downtown Sandy Springs | $1,570 | $2,131 |
| Perimeter Center | $1,779 | $2,308 |
| Sandy Springs ITP | $1,795 | $2,325 |
| Westfair | $2,051 | $2,710 |

[Apartments.com](https://www.apartments.com/rent-market-trends/sandy-springs-ga/), updated November 2026, independently reports $1,543 for one bedroom and $1,839 for two bedrooms. These are different listing samples and methods; do not average them into a purported precise local market price. Neither establishes the price of a particular lease or proves that cheaper units never exist.

For D006/D019, use **$1,387/month for a proposed North Springs one-bedroom benchmark or $1,737/month for a proposed North Springs two-bedroom benchmark**, according to the household's explicitly configured housing. These replace $650 as researched baseline proposals. Bedroom assignment, actual lease terms, included utilities and mandatory charges still need definition before publication. Do not automatically assign a bedroom count from household size. Both scenarios must use the same rent binding, and routing must prevent charging the same month's rent twice. A household share is `full rent * approved share`, never an unexplained discount.

Prefer a maintained local listing sample or documented lease quote over CPI when available. Refresh asking-rent evidence for new editions; keep an existing game's lease and obligations fixed. HUD FMR remains a program benchmark with utility treatment, not a substitute label for current asking rent.

## API search revisited

These are additional candidates, not deployed integrations. No authenticated calls, credentials, subscriptions or paid access were established in this audit.

| Candidate | Suitable coverage | Required acceptance checks |
| --- | --- | --- |
| [RentCast rental listings](https://developers.rentcast.io/reference/rental-listings-long-term) | Rental listing search by location and property attributes; possible D006/D019 source | Backend key; confirm access terms/cost, returned listing dates/status, bedroom/type filters, duplicates and city boundaries. A ZIP alone is not Sandy Springs. Specify sample and selection method; a single cheap listing is not a representative baseline. |
| [Best Buy APIs](https://developers.bestbuy.com/apis) and [official documentation](https://bestbuyapis.github.io/api-documentation/) | Product prices/specifications and stores for D023/D030 replacement electronics | Backend key; exact SKU, condition, local availability, promotion expiry, tax and delivery. Product API prices do not price repair labor or establish that a device meets the scenario's needs. |
| [OpenEI Utility Rate Database](https://apps.openei.org/services/doc/rest/util_rates/) | Electricity tariff candidate for D007, beyond EIA's average-price benchmark | API key; match actual supplier, residential tariff, effective dates, consumption tiers, fixed charges, riders and taxes. A rate record alone is not a complete bill. |
| [Kroger Product API portal](https://developer.kroger.com/api-products/api/product-api) | Potential store-specific grocery/supply pricing | Official portal could not be retrieved with this research tool. Access, current API terms, authentication, store-specific price fields and live responses remain unverified. Do not claim an established grocery API or rely on third-party scraper documentation as proof. |

For other goods, retry an official retailer/provider API first. If no suitable accessible feed exists, capture a dated exact-item/provider quote from the sources below and configure the supported import or baseline/index method. A generic category page, search snippet or national average is a cross-check, not an all-in local quote. Persist the evidence used, since live pages and promotions change.

## Checked online price evidence

All prices below were observed online, not purchased or independently confirmed by telephone. Unless stated otherwise, the page did not establish a price effective date. National offers need local availability and terms checks. These are scoped alternatives and cross-checks; they do not silently redefine the scenario.

| Evidence ID | Source and observed amount | Use and limits |
| --- | --- | --- |
| E01 | Rent.com and Apartments.com linked above | Rent correction and bedroom-specific cross-check; listing aggregates, not signed leases. |
| E02 | [MARTA fares](https://itsmarta.com/ride/how-to-pay/fares-and-transfers): standard one-way $2.50; seven-day $23.75; thirty-day $95; ten-trip $25; twenty-trip $42.50 | Replace unsupported generic $50 passes and $6/$12 fares with a named product or trip calculation. Two separately paid standard trips cost $5; four cost $10. Up to four transfers within three hours do not mean four paid trips. Include any required fare-media charge separately. |
| E03 | [Fulton County Schools 2026-27 prices](https://nutrition.fultonschools.org/MealPrices/Disclaimer): elementary lunch $3.10; middle/high lunch $3.35 | Ten paid lunches would be $31 or $33.50, respectively; quantity and grade are proposed examples. Resolve actual meal count and free/reduced status. Do not invent a late fee or price retail meals from a school rate. |
| E04 | [Laundry Nook](https://laundrynook.com/coin_laundry), 350 Northridge Road: 18-pound wash $2.50, 30-pound wash $4; dryer $0.25 per five minutes | Proposed 18-pound wash plus thirty minutes drying = $4; wash only = $2.50. Supplies/other charges not established. Posted page has no confirmed effective date. [Laundry Lounge](https://www.laundryloungesandysprings.com/) lists wash-and-fold at $1.95/pound, a different service. |
| E05 | [Visible](https://www.visible.com/m/plans): base service $25/month, taxes/fees included | Alternative to the unsupported $55 phone bill for one compatible existing handset; check coverage/device compatibility. [Mint](https://www.mintmobile.com/plans/) advertises $15/month equivalent with a three-month $45 initial payment; never charge only $15 for that upfront purchase. |
| E06 | [Xfinity Internet Essentials](https://www.xfinity.com/learn/internet-service/internet-essentials): $14.95/month and $29.95/month program tiers | Eligibility and address availability required. Not a universal replacement for the $65 bill; ordinary service needs its own address-specific quote. |
| E07 | [America's Best two-pair offer](https://www.americasbest.com/save-money/2-pair-offer): $95 for two pairs plus exam | Basic offer with restrictions; validate lens/frame/prescription requirements, local participation and tax. Not evidence for arbitrary $135/$290 single-pair alternatives. |
| E08 | [Hammond Dental extraction pricing](https://sandyspringsdentist.com/tooth-extraction-sandy-springs/): simple extraction $153; limited exam $79; surgical extraction $248 | Defined components, not an unspecified complete treatment. Simple extraction + limited exam = $232 before any separately required imaging/other charges; do not describe that subtotal as an all-in quote. |
| E09 | [Peachtree Immediate Care self-pay](https://www.peachtreemed.com/affordable-self-pay-pricing-2/): basic visit $250, second tier $275 | Possible defined urgent-care baseline; dispensed medicine/equipment extra. Does not establish an existing clinic balance, specialist appointment, insured copay or child-care alternative. Confirm selected location/service. |
| E10 | [Nanny Lane Sandy Springs](https://www.nannylane.com/cost/babysitters/ga/sandy-springs): listed average $21.66/hour | Local advertised-rate benchmark, not a guaranteed booking. Six hours = $129.96; three = $64.98 before agency/minimum-booking charges. Do not call this an agency quote. |
| E11 | [IKEA VIHALS six-drawer dresser](https://www.ikea.com/us/en/p/vihals-6-drawer-dresser-white-anchor-unlock-function-30490115/): $279.99 | Specific new dresser cross-check for D034, before tax/delivery/assembly. Lower-priced option still needs an exact comparable product. Recalled-product refund schedules are not current retail prices. |
| E12 | [RepairPal alternator estimate](https://repairpal.com/estimator/alternator-replacement-cost): national $809-$1,088, updated September 3, 2026 | Shows why 'repair' alone cannot validate $240/$620. Vehicle, fault, local labor, tax/fees and prior payments required. Not a Sandy Springs quote and not a reason to assume an alternator fault. |
| E13 | [USDA monthly Food Plans](https://fns-prod.azureedge.us/research/cnpp/usda-food-plans/cost-food-monthly-reports) | Official monthly file source accessible on this follow-up; no local item basket or exact scenario total resolved. Use age/household adjustments and food-at-home assumptions only as a cross-check. Earlier 403 did not establish permanent unavailability. |
| E14 | [H&R Block](https://www.hrblock.com/tax-software/): tax-pro offering starts at $99 plus additional state fee | Starting price is not a complete federal/Georgia quote. Return complexity and selected service required. Never use software-only prices as professional preparation fees. |
| E15 | [Discount Tire installation](https://www.discounttire.com/learn/tire-installation-cost) | Installation is a separate pricing component; exact vehicle/tire/cart required. No supported all-in $520/$310 set established. |

## Shared baseline components

Every D006-D020 late-fee amount remains unsupported: $35, $10, $8, $5, $7, $15, $20, $25, $3, $25, $8, $12, $9, $35 and $25, respectively. No verified contract, fee schedule or recurrence rule was obtained. Do not adopt a generic online 'typical late fee' for rent, medical care, school meals or any other obligation. Store principal and applicable fee separately; derive debt totals after those inputs are established. Existing draft totals are historical arithmetic, not validated obligations.

All free choices and CAC in-kind pathways remain governed by the explicit no-charge/service rules. They are not discounted retail prices. CAC caps, availability and allocation sizes still need maintained operational evidence; annual totals do not price individual benefits. Wage inputs reuse the existing OEWS integration. Simulation refunds, transfers and agreements need their own declared rationale/formula rather than a fictitious market quote.

## Baseline publication and maintenance requirements

For **every** monetary component, require either (1) a successful validated source observation, (2) dated exact-scope online/provider evidence plus an automatic update plan, or (3) an explicitly configured simulation rule with its maintained formula. Record provider/location, SKU/service, quantity, cash payment timing, observed/effective dates, tax, mandatory fees, delivery, promotions and evidence reference. Separate base price from final payable amount; an unknown mandatory charge means the final baseline is unresolved.

Compare a baseline with another relevant leading source where practical, documenting why any difference is acceptable. Never use a source that describes another product, geography, service or eligibility class merely to fill the field. Resolve undefined goods/services before treating a baseline as checked. The unresolved scenario dispositions below remain real work; this document does not claim every baseline has been verified.

Only after the initial evidence and mappings are complete should monthly jobs reuse the definitions, validate new observations and automatically publish a complete immutable edition. No monthly human review is introduced. Missing setup blocks publication; failed later refreshes follow the existing last-usable-value/staleness policy. No API, scheduler, price migration or gameplay change was implemented by this audit.

## Scenario-by-scenario coverage

Baseline dispositions: **Replace** identifies researched replacement proposals; **Unresolved** means equivalent scope or evidence is missing and the legacy amount is not validated; **Rule/source** identifies a simulation rule, agreement or existing wage source rather than a retail quote. These statuses do not grant publication approval.

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

### D002 — An interview today

**Baseline evidence and disposition (November 7):** Unresolved: define garments, sizes, footwear inclusion and all-in local basket. No verified outfit supports $60. Historical amounts audited: Outfit $60. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “An interview can bring hope and another expense when you need something to wear. Between {base observation period} and {latest observation period}, the U.S. price index for apparel changed by {pct}%.”

**General fact semantic key:** `cpi:SAA`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SAA. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Clothing can be an important part of looking professional. In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift to receive essential clothing.”

Source: S18/S19; fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`; service `canopy_thrift`; key `dollar_amount_of_client_credits_used_at_cac_canopy_thrift`; reporting year 2025; exact stored value `206768.67` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Professional-clothing costs connect directly to the client-credit program. Existing conditional clothing pathway; annual credit does not set its amount.

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

**Player-facing general fact:** “People come back to the job search from different starting points. Some are looking after a job ends, while others are returning after time away from work or seeking their first job.”

**General fact semantic key:** `employment:jobseekers_different_work_histories`

Source/update: S27, [BLS Current Population Survey concepts and definitions](https://www.bls.gov/cps/definitions.htm), reasons for unemployment: job losers, reentrants and new entrants. Qualitative description of jobseekers, not application advice or a claim about the frequency of any experience. Source checked November 7, 2026. No numerical API binding needed. Scheduled source checks retain the evidence reference and detect definition changes; no automatic free-form rewriting.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Career support connects with the effort of finding your next opportunity. In 2025, The Empowerment Center's Career Services helped 229 people.”

Source: S18/S19; fact ID `db12c137-fad7-4277-b4ca-6a203b344e38`; service `career_services`; key `people_helped_by_career_services`; reporting year 2025; exact stored value `229` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Reapplying after an unsuccessful interview is directly relevant to career support. Context only; retain no CAC choice and no automatic job placement.

### D004 — Another interview

**Baseline evidence and disposition (November 7):** Unresolved: same D002 basket, ownership prevents repeat purchase. Historical amounts audited: Outfit $60/reuse $0. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

### D005 — Time to file taxes

**Baseline evidence and disposition (November 7):** Unresolved: E14 is only a starting price. Federal/Georgia return fee quote required. Refund depends on household/tax rules or explicit simulation assumption; aggregate CAC refunds do not validate $1,000. Historical amounts audited: Fee F; refund $1,000. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d005)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| TRY — Try my best | Approved USD 0.00; no refund/deduction |
| PAID — Pay someone to prepare taxes | UNRESOLVED approved fee F; require balance ≥ F before charging -F and immediately crediting approved +$1,000.00 once |
| CAC — Get free tax preparation through CAC's VITA program | CAC only; no player-paid fee; approved +$1,000.00 once |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** tax preparation services, if available; otherwise all items. **Required definition:** Quote return complexity and provider fee; give the refund a separate automatically recalculated binding. Proposed simulation-only fallback: approve a November 2026 refund baseline and all-items CPI anchor, then recalculate monthly by the index ratio. The former $1,000 is a candidate baseline requiring review, not a permanent amount or an actual tax entitlement. A real tax calculation would instead require household tax inputs and maintained tax rules; that method is not selected here.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “Filing a tax return can mean money back for eligible workers and families. The Earned Income Tax Credit can provide a refund to people with low or moderate earnings even when they owe no federal income tax.”

**General fact semantic key:** `tax:eitc_refundable_credit_for_workers`

Source/update: S28, [IRS Topic 601: Earned Income Credit](https://www.irs.gov/taxtopics/tc601). Qualitative fact about refundable tax credits and eligible workers; source checked November 7, 2026. No numerical API binding needed for this passage. Scheduled checks monitor source availability and changes to the credit definition; preserve the verified passage on retrieval failure and revalidate substantive source changes before replacing its meaning. This fact does not set the simulated refund, establish player eligibility or change filing-choice outcomes. Refund amounts retain their separate automatic update plan.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Tax preparation can connect households with money back at filing time. In 2025, CAC reported 503 tax returns through VITA and $672,056 in combined federal and state refunds.”

**Composite CAC fact sources:** S18/S19; service `vita`; 2025 return-count record `5b9132c2-90d6-4dea-9dc0-f2de13a89e2f` = 503 Number; federal-refund record `7f25dabd-f5a5-4a54-9201-fd5f3ccd173d` = USD 582083; state-refund record `d4d72fe4-20b1-4a1b-97a4-dea745b7e4f7` = USD 89973. Derived total: 582083 + 89973 = USD 672056. This is one player-facing CAC passage backed by three observations, not three fact slots. Require matching reporting years, compatible scopes and complete inputs before automatically updating the passage; never add tax-credit totals to refunds, divide this total by 503, or infer 503 unique recipients. Count and refund observations are reported program measures, not a verified matched cohort. Exact original source verification remains pending; the snapshot verifies the stored figures. The passage does not set the simulated household refund. Historical pairing files remain the earlier single-record proposal; this composite supersedes it for D005 final binding.

**Required occurrence - user decision, November 7, 2026:** D005 is mandatory once in every playthrough, in both support modes and for every persona. Reserve a scheduled ordinary-day slot; it must not be omitted by random selection, selected again, or collide with employment events. This supersedes earlier non-scheduled/optional sampling instructions for D005. The exact due day remains to be configured; the earlier Day 18 is a proposal, not a newly approved day. Early-ended runs cannot show later days: they may end before reaching the reserved tax event, but every complete route must include it. Existing early-ending rules are unchanged. If literal display before every possible early ending is required, its placement needs a separate explicit change; no new pre-game event is inferred. Verify exactly-once inclusion, all personas/modes, routing and refresh restoration. This is a documentation requirement; scheduling is not implemented here.

### D006 — Rent is due

**Baseline evidence and disposition (November 7):** Replace: E01 bedroom-specific rent proposal; reject $650 as verified full rent. Historical amounts audited: Rent $650. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “When rent comes due, keeping a roof over your head can leave less for everything else. In {period}, {pct}% of Sandy Springs renter households spent at least 30% of their income on gross rent.”

**General fact semantic key:** `acs:B25070:rent_burden`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B25070. Sum 30%+ brackets / computed-ratio households; retain MOEs. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Keeping housing stable is at the heart of CAC eviction prevention. In 2025, CAC reported preventing evictions for 1,108 households.”

Source: S18/S19; fact ID `5fa2bac7-6016-4db8-b705-fc593f6b75ec`; service `eviction_prevention`; key `evictions_prevented`; reporting year 2025; exact stored value `1108` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The obligation is rent and the fact is specifically about eviction prevention. Existing conditional rent pathway; no eligibility or coverage amount inferred.

### D007 — Keeping the lights on

**Baseline evidence and disposition (November 7):** Unresolved: supplier/tariff, kWh, billing period and all charges; OpenEI candidate. EIA average alone cannot validate bill. Historical amounts audited: Electricity $145. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “Keeping the lights on means making room for electricity in a crowded budget. In {month}, Georgia residential electricity averaged {rate} cents per kilowatt-hour.”

**General fact semantic key:** `eia:GA:RES:monthly_electricity_price`

Source/update: S08 / A04. GA residential monthly electricity price; retain cents/kWh and reporting month.  Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Utilities and rent draw on the money needed to keep a home. In 2025, CAC reported preventing evictions for 1,108 households.”

Source: S18/S19; fact ID `5fa2bac7-6016-4db8-b705-fc593f6b75ec`; service `eviction_prevention`; key `evictions_prevented`; reporting year 2025; exact stored value `1108` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Electricity costs compete with rent and other essentials, connecting this decision to housing stability and eviction prevention. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.

### D008 — The water bill

**Baseline evidence and disposition (November 7):** Unresolved: actual address/provider tariff, consumption, meter/base charges and sewer basis. Provider directory alone is not price evidence. Historical amounts audited: Water/sewer $68. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “A water bill is another essential expense competing for the money you have. Between {base observation period} and {latest observation period}, the U.S. price index for water and sewerage maintenance changed by {pct}%.”

**General fact semantic key:** `cpi:SEHG01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEHG01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Water and sewer costs share the household budget with rent and other essentials. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.”

Source: S18/S19; fact ID `b697ae84-1fd2-4bae-83da-7a10c983ac24`; service `financial_assistance`; key `amount_paid_through_financial_assistance`; reporting year 2025; exact stored value `796416.64` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Water and sewer costs are part of household housing pressure, providing context for financial assistance to prevent homelessness. The user confirmed rent and utility bill support through CAC eviction prevention. Offer conditional CAC bill support in CAC mode; validate household eligibility and availability, cap assistance at the eligible bill balance, and bind the approved coverage amount separately from annual facts.

### D009 — Staying connected

**Baseline evidence and disposition (November 7):** Replace proposal: E05 $25 monthly existing-device plan, if selected and compatible; no invented device financing. Historical amounts audited: Phone $55. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “A phone connection can be part of keeping up with work, family and daily responsibilities. Between {base observation period} and {latest observation period}, the U.S. price index for wireless telephone services changed by {pct}%.”

**General fact semantic key:** `cpi:SEED03`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEED03. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No phone-plan or telecommunications-service fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D010 — The internet bill

**Baseline evidence and disposition (November 7):** Unresolved: address-specific ordinary plan quote; E06 only if program eligibility is explicitly established. Historical amounts audited: Internet $65. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

### D011 — Car insurance is due

**Baseline evidence and disposition (November 7):** Unresolved: fictional driver/vehicle, coverage, deductible, installment and mandatory fees; no matching quote. Historical amounts audited: Car insurance $130. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “Car insurance is another cost of keeping a vehicle available. Between {base observation period} and {latest observation period}, the U.S. price index for motor vehicle insurance changed by {pct}%.”

**General fact semantic key:** `cpi:SETE`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SETE. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Deciding how to handle an insurance bill is part of managing financial demands. In 2025, 218 students enrolled in Financial Literacy Classes.”

Source: S18/S19; fact ID `d32689c8-067a-4f59-aa48-2424384b7116`; service `financial_literacy_classes`; key `students_enrolled_in_financial_literacy_classes`; reporting year 2025; exact stored value `218` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Choosing how to handle an insurance installment is a financial-literacy/budget tradeoff. Context only; no CAC car-insurance payment or insurance service inferred.

### D012 — A clinic bill arrives

**Baseline evidence and disposition (November 7):** Unresolved: original service/patient responsibility required. E09 $250 is a new basic urgent-care service comparator, not this debt. Historical amounts audited: Clinic balance $190. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

### D013 — The childcare bill

**Baseline evidence and disposition (November 7):** Unresolved: age, provider, dates/hours and overlap with D025. Hourly babysitting benchmark E10 is not a daycare invoice. Historical amounts audited: Childcare bill $260. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No daycare/childcare-payment fact; Meals for Kids measures food support. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D014 — Maya's school meal balance

**Baseline evidence and disposition (November 7):** Replace formula: E03 meal price times documented unpaid count; no arbitrary balance or fee. Historical amounts audited: Meal debt $32. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “A school meal balance is another expense to cover while making sure Maya has food during the day. For {school year}, a full-price student lunch at {school level} in Fulton County Schools cost {amount}.”

**General fact semantic key:** `school:FCS:student_lunch_rate`

Source/update: S13; configure automatic extraction of the school-year meal rate. Select actual school-level lunch rate and eligibility; no breakfast or adult rate. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Making sure children have food is a concern that extends beyond a single meal balance. In 2025, Meals for Kids served 1,097 children.”

Source: S18/S19; fact ID `9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01`; service `meals_for_kids`; key `children_served_by_meals_for_kids`; reporting year 2025; exact stored value `1097` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The child’s meal-account decision has relevant child-food-access context. Context only; Meals for Kids is not represented as paying the school account.

### D015 — The repair bill

**Baseline evidence and disposition (November 7):** Unresolved: original repair invoice and remaining liability; E12 cannot price an unspecified repair. Historical amounts audited: Repair balance $240. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “A repair bill can keep taking up space in your budget after the car is back on the road. Between {base observation period} and {latest observation period}, the U.S. price index for motor vehicle repair changed by {pct}%.”

**General fact semantic key:** `cpi:SETD03`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SETD03. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No vehicle-repair invoice or automotive-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D016 — A pharmacy bill arrives

**Baseline evidence and disposition (November 7):** Unresolved: medication/strength/quantity, pharmacy, insurance/discount and original liability. No interchangeable 'prescription price'. Historical amounts audited: Pharmacy balance $85. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d016)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D016-PAY — Pay the bill | -$85.00 |
| D016-IGNORE — Ignore the bill for now | $0.00 |

**Bill components (draft; fee policy unapproved):** Ignore records principal $85.00 + proposed late fee $8.00 = **$93.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** prescription drugs. **Required definition:** Specify drug, strength, quantity, pharmacy and insurance/discount assumptions; use patient price.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. 

**General fact (separate from price)**

**Player-facing general fact:** “Some U.S. adults reported going without prescription medicine because of its cost in the Federal Reserve's 2025 survey.”

**General fact semantic key:** `health:prescription_cost_barrier`

Source/update: S30, [Federal Reserve: economic hardships](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-economic-hardships.htm). Prescription-medicine item, distinct from overall care and dental items; no treatment recommendation. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No prescription-payment or medicine-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D017 — A repayment is due

**Baseline evidence and disposition (November 7):** Rule/source: originating agreement balance/payment; no comparable retail price and no CPI change to incurred debt. Future editions need maintained agreement/formula. Historical amounts audited: Repayment $110. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d017)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D017-PAY — Pay the bill | -$110.00 |
| D017-IGNORE — Ignore the bill for now | $0.00 |

**Bill components (draft; fee policy unapproved):** Ignore records principal $110.00 + proposed late fee $12.00 = **$122.00 owed**, with USD 0.00 deducted today. Pay later settles the current outstanding total once and removes the card from unpaid, retaining the history; it does not edit the original Ignore response or consume a day. Fee recurrence remains unresolved; the displayed total assumes one fee only.

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** none; repayment agreement. **Required definition:** Define fictional loan balance, contract payment and approved fee schedule; CPI cannot change contractual debt.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. Bill principal and late fee need separate bindings. Automatically check/import the effective provider/contract fee schedule during monthly maintenance; if a fictional fee has no maintained schedule, define an approved baseline and automatic index/formula plan. The exact fee-source ingestion route remains PENDING; a manual-review-only plan does not satisfy the automatic-update requirement. Recalculate total as outstanding principal plus approved fee; do not fetch or inflate total independently. 

**General fact (separate from price)**

**Player-facing general fact template:** “A repayment coming due can narrow the choices you have for other expenses. In {period}, {pct}% of Sandy Springs residents whose poverty status was determined lived below the poverty threshold.”

**General fact semantic key:** `acs:B17001:poverty`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B17001. Below-poverty population / poverty-status universe. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Repayments are one of the commitments a household has to plan around. In 2025, 218 students enrolled in Financial Literacy Classes.”

Source: S18/S19; fact ID `d32689c8-067a-4f59-aa48-2424384b7116`; service `financial_literacy_classes`; key `students_enrolled_in_financial_literacy_classes`; reporting year 2025; exact stored value `218` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Managing an existing repayment installment is a financial-literacy decision. Context only; CAC does not pay or restructure this debt in the draft.

### D018 — The gas bill

**Baseline evidence and disposition (November 7):** Unresolved: address/marketer, therms, contract, delivery and fixed charges; no verified total. Historical amounts audited: Gas $92. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

### D019 — Rent or a cash cushion?

**Baseline evidence and disposition (November 7):** Replace: same E01/D006 binding; prevent duplicate monthly obligation. Historical amounts audited: Rent $650. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “Paying rent can mean giving up the cash you hoped to keep for an unexpected expense. In {period}, median monthly gross rent in Sandy Springs was {amount}.”

**General fact semantic key:** `acs:B25064:median_gross_rent`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B25064. Published median for cash-rent renter units; source-year dollars, not individual rent. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Rent pressure connects with the housing instability CAC financial assistance addresses. In 2025, CAC reported $796,416.64 in total financial assistance to prevent homelessness.”

Source: S18/S19; fact ID `b697ae84-1fd2-4bae-83da-7a10c983ac24`; service `financial_assistance`; key `amount_paid_through_financial_assistance`; reporting year 2025; exact stored value `796416.64` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The scenario concerns rent pressure and preserving housing stability. Existing conditional rent pathway; annual spending is not the household’s benefit amount.

### D020 — A medical bill remains

**Baseline evidence and disposition (November 7):** Unresolved: service, coverage and prior payments; do not replace an existing balance with E09's new-visit charge. Historical amounts audited: Medical balance $320. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “An unpaid medical bill can remain part of the budget as new needs arrive. In {period}, {pct}% of Sandy Springs civilian noninstitutionalized residents lacked health insurance.”

**General fact semantic key:** `acs:B27001:uninsured`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B27001. Sum uninsured sex/age cells / table universe, with no overlapping age cells. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No medical-bill assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D021 — The car will not start

**Baseline evidence and disposition (November 7):** Repair unresolved by fault/vehicle; transit replace with E02 named pass, $23.75 seven-day or $95 thirty-day according to coverage period. Historical amounts audited: Repair $620/transit $50. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d021)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D021-REPAIR — Pay for the repair | -$620.00 |
| D021-TRANSIT — Leave the car parked and use MARTA | -$50.00 |

**Recommended source/method:** S20/S12; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** motor vehicle maintenance and repair; transit uses published fares. **Required definition:** Define repair and vehicle separately from exact MARTA product/duration for the alternative.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “When the car will not start, repair costs compete with the cost of getting around another way. Between {base observation period} and {latest observation period}, the U.S. price index for vehicle maintenance and repair changed by {pct}%.”

**General fact semantic key:** `cpi:SETD`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SETD. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No vehicle repair or roadside-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

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

### D023 — A broken phone

**Baseline evidence and disposition (November 7):** Unresolved: exact compatible handset/condition and repair fault. Best Buy API candidate for replacement only. Historical amounts audited: Handset $240/repair $95. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d023)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D023-REPLACE — Buy a replacement handset | -$240.00 |
| D023-REPAIR — Pay for the repair | -$95.00 |
| D023-WAIT — Go without the phone for now | $0.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** telephone hardware; repair category availability pending. **Required definition:** Specify handset condition/model and damage; separate replacement and repair quotes.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “A broken phone means weighing a repair against the cost of a replacement. In {period}, {pct}% of Sandy Springs households had a smartphone but no other type of computing device.”

**General fact semantic key:** `acs:B28001:smartphone_only`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B28001. Smartphone-only households / all households; use exclusive category, not all smartphone owners. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No phone replacement or device-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D024 — A family emergency

**Baseline evidence and disposition (November 7):** Unresolved: origin/destination, dates, mode, passengers, baggage and booking lead time; local transit fare is not an equivalent family trip. Historical amounts audited: Family trip $360. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d024)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D024-TRAVEL — Pay for the trip | -$360.00 |
| D024-REMOTE — Stay home and support them remotely | $0.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** airline fares or transportation category after trip is defined. **Required definition:** Define destination, dates, mode, passengers, baggage and booking lead time.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “In the Federal Reserve's 2025 U.S. survey, people provided unpaid care to relatives or friends who needed help because of illness, disability or aging.”

**General fact semantic key:** `care:unpaid_adult_relative_support`

Source/update: S31, [Federal Reserve: care work](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-living-arrangements-care-work.htm). Adult caregiving observation; no claim about travel, family obligations or the specific emergency. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No emergency family-travel assistance fact; targeted workforce transportation is not a general travel benefit. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

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

### D026 — Time for new tires

**Baseline evidence and disposition (November 7):** Unresolved: vehicle, tire dimensions/count/condition, E15 installation, disposal and tax. Historical amounts audited: Tire sets $520/$310. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d026)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D026-NEW — Buy the new set | -$520.00 |
| D026-LOWER — Buy the lower-cost set | -$310.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** motor vehicle parts and equipment. **Required definition:** Define vehicle, tire size, count/condition and installed out-the-door cost for each set.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “New tires are another expense to weigh against keeping the car available. Between {base observation period} and {latest observation period}, the U.S. price index for tires changed by {pct}%.”

**General fact semantic key:** `cpi:SETC01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SETC01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No tire replacement or automotive-assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D027 — Broken glasses

**Baseline evidence and disposition (November 7):** Replace basic-option proposal: E07 $95 restricted two-pair/exam offer; premium option and final local total unresolved. Historical amounts audited: Glasses $290/$135. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “Replacing broken glasses means finding an option that meets your needs and fits your budget. Between {base observation period} and {latest observation period}, the U.S. price index for eyeglasses and eye care changed by {pct}%.”

**General fact semantic key:** `cpi:SEMC03`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEMC03. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No vision-care or glasses-replacement assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D028 — A plumbing problem

**Baseline evidence and disposition (November 7):** Unresolved: exact fault/full and temporary work, property responsibility and local provider quote. Broad online repair ranges do not validate either alternative. Historical amounts audited: Plumbing $410/$75. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**General fact semantic key:** `acs:B25047:lacking_plumbing`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B25047. Occupied units lacking complete plumbing / all occupied units; does not measure temporary plumbing failures. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No plumbing/home-repair assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D029 — An unexpected appointment for Maya

**Baseline evidence and disposition (November 7):** Unresolved: specialty/service, full/initial difference and patient responsibility. E09 urgent care is not proof of equivalent scope. Historical amounts audited: Child appointment $380/$120. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d029)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D029-FULL — Pay for the full appointment | -$380.00 |
| D029-INITIAL — Pay for the initial appointment | -$120.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** medical care services. **Required definition:** Define appointment type, full versus initial scope, child coverage and patient responsibility.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “An unexpected appointment for Maya means finding money for care alongside other family needs. Between {base observation period} and {latest observation period}, the U.S. price index for services by other medical professionals changed by {pct}%.”

**General fact semantic key:** `cpi:SEMC04`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEMC04. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No child healthcare/appointment assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D030 — A broken laptop

**Baseline evidence and disposition (November 7):** Unresolved: workload/specifications, exact SKU/condition and fault; Best Buy candidate. A cheap Chromebook is not automatically equivalent. Historical amounts audited: Laptop $450/repair $180. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “A broken laptop means weighing the cost of restoring a tool you use against other expenses. In {period}, {pct}% of Sandy Springs households had a desktop or laptop computer.”

**General fact semantic key:** `acs:B28001:desktop_laptop`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B28001. Inclusive desktop/laptop category / all households; not device-only category. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** Computer Classes measures education, not laptop repair or replacement. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D031 — The car needs a tow

**Baseline evidence and disposition (November 7):** Unresolved: two actual routes, vehicle, hookup/mileage/after-hours fees; impound tariffs are not voluntary tow quotes. Historical amounts audited: Tow $225/$140. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d031)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D031-SHOP — Tow it to the repair shop | -$225.00 |
| D031-PARK — Tow it to the parking location | -$140.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** motor vehicle maintenance and repair. **Required definition:** Quote each route distance, hookup, mileage and after-hours charges; repairs excluded.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “A tow is another cost to cover before the car can be repaired. Between {base observation period} and {latest observation period}, the U.S. price index for vehicle maintenance and servicing changed by {pct}%.”

**General fact semantic key:** `cpi:SETD02`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SETD02. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No towing or vehicle-recovery assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

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

### D033 — A damaged work item

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

**Player-facing general fact template:** “A damaged work item can mean paying to replace equipment you rely on. Tools are one part of the wider cost of work equipment. Between {base observation period} and {latest observation period}, the U.S. price index for tools, hardware and supplies changed by {pct}%.”

**General fact semantic key:** `cpi:SEHM01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEHM01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** The damaged work item is unspecified; clothing and computer classes do not establish equipment coverage. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

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

**Player-facing general fact template:** “Replacing a broken dresser means choosing how much of your budget to spend on a household need. Between {base observation period} and {latest observation period}, the U.S. price index for bedroom furniture changed by {pct}%.”

**General fact semantic key:** `cpi:SEHJ01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEHJ01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No suitable dresser/furniture CAC outcome fact is assigned. The user confirmed household furniture availability; retain the fact slot unresolved rather than substituting an unrelated clothing statistic. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

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

**Player-facing general fact template:** “Losing groceries means paying again for food you had already planned to use. Between {base observation period} and {latest observation period}, the U.S. price index for groceries purchased for home use changed by {pct}%.”

**General fact semantic key:** `cpi:SAF11`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SAF11. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Replacing lost groceries brings the need for food back into the budget. In 2025, the CAC Mini-Market reported 1,160,328 pounds of food available.”

Source: S18/S19; fact ID `efaf231b-3db3-4c4d-b276-758006af8aab`; service `mini_market`; key `pounds_of_food_available_from_the_cac_mini_market`; reporting year 2025; exact stored value `1160328` Pounds. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The expense here is replacement groceries, not repairing the refrigerator. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

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

### D037 — Your ride to work falls through

**Baseline evidence and disposition (November 7):** Ride unresolved by route/time; transit replace with E02 paid-trip count, e.g. $5 for two standard trips. Historical amounts audited: Ride $38/transit $6. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d037)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D037-RIDE — Pay for the direct ride | -$38.00 |
| D037-TRANSIT — Take the transit route | -$6.00 |

**Recommended source/method:** S20/S12; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** transportation services; transit uses published fares. **Required definition:** Specify ride route/time and alternative fare count, transfer rules and feasible arrival.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “When your ride to work falls through, getting to your shift becomes another expense to solve. In {period}, {pct}% of Sandy Springs workers age 16 and older used public transportation to get to work.”

**General fact semantic key:** `acs:B08301:public_transport_commute`

Source/update: S05 / A02; [S26 table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), table B08301. Public transportation excluding taxicab / all workers age 16+; retain ACS universe. Resolve exact estimate/MOE cells and Sandy Springs place geography against the selected annual five-year release; reject missing/suppressed values and zero denominators. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** The transportation measure is workforce-program-specific; this card applies to employed people generally. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D038 — A load of laundry

**Baseline evidence and disposition (November 7):** Replace scope proposal: E04 $4 wash/thirty-minute dry versus $2.50 wash only, same 18-pound capacity; supplies and effective rate unresolved. Historical amounts audited: Laundry $18/$8. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d038)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D038-FULL — Wash and dry the full load | -$18.00 |
| D038-SMALL — Wash the smaller load and air-dry it | -$8.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** laundry and dry cleaning services. **Required definition:** Specify wash/dry loads, machine size, supplies inclusion and lower-cost option.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Clean clothes take a place in the budget alongside food, transportation and bills. Between {base observation period} and {latest observation period}, the U.S. price index for laundry and dry cleaning services changed by {pct}%.”

**General fact semantic key:** `cpi:SEGD03`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEGD03. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No laundry-service or laundry-fee assistance fact; clothing distribution is a different activity. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D039 — Maya's school trip

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

**Player-facing general fact template:** “Admission fees can be one part of a school outing, alongside travel and other trip costs. Between {base observation period} and {latest observation period}, the U.S. price index for admission fees changed by {pct}%.”

**General fact semantic key:** `cpi:SERF02`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SERF02. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** Tools for School concerns supplies, not school-trip participation or fees. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

### D040 — Worn-out shoes

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

**Player-facing general fact template:** “Worn-out shoes mean weighing replacement against making the current pair last. Between {base observation period} and {latest observation period}, the U.S. price index for footwear changed by {pct}%.”

**General fact semantic key:** `cpi:SEAE`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEAE. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Finding shoes you can use is one way clothing needs enter the household budget. In 2025, CAC Canopy Thrift served 2,152 households.”

Source: S18/S19; fact ID `5d6bc795-8a41-49ca-862f-9aaf73405b49`; service `canopy_thrift`; key `households_served_by_cac_canopy_thrift`; reporting year 2025; exact stored value `2152` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Replacing everyday shoes connects to the clothing program’s household reach. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

### D041 — Too tired to cook?

**Baseline evidence and disposition (November 7):** Unresolved: matching servings/menu/basket, pickup/delivery/tax/tip assumptions. E13 does not price a restaurant meal. Historical amounts audited: Prepared meal $24/ingredients $10. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d041)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D041-PREPARED — Buy the prepared meal | -$24.00 |
| D041-COOK — Buy ingredients and cook | -$10.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** food away from home for prepared; food at home for ingredients. **Required definition:** Specify equivalent meal servings and kitchen access; price menu charges and ingredient quantities separately.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “In the 2025 U.S. time-use survey, women were more likely than men to spend part of their day preparing food and cleaning up afterward.”

**General fact semantic key:** `time:cooking_gender_participation`

Source/update: S34, [BLS: 2025 American Time Use Survey](https://www.bls.gov/news.release/archives/atus_06252026.htm). Table 1, population age 15 and older; descriptive national pattern, not an expectation about the player. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Ingredients for a home-cooked meal are part of a household food budget. In 2025, the CAC Mini-Market served 2,995 households.”

Source: S18/S19; fact ID `ec44118c-3be1-46b1-9585-8f34d638bbd9`; service `mini_market`; key `households_served_by_the_cac_mini_market`; reporting year 2025; exact stored value `2995` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. Buying meal ingredients has relevant household food-access context. Context only; no restaurant, prepared-meal reimbursement or new CAC option.

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

**Player-facing general fact template:** “School supplies create another shopping list when the household budget is already committed. Between {base observation period} and {latest observation period}, the U.S. price index for educational books and supplies changed by {pct}%.”

**General fact semantic key:** `cpi:SEEA`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEEA. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “School supplies are the need at the center of Tools for School. In 2025, Tools for School served 1,090 children.”

Source: S18/S19; fact ID `c6a72bf1-47ac-4d53-9adc-8ad68dd120c4`; service `tools_for_school`; key `children_served_by_tools_for_school`; reporting year 2025; exact stored value `1090` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The decision is specifically school supplies for a child. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

### D043 — A family birthday

**Baseline evidence and disposition (November 7):** Unresolved: exact comparable planned/smaller items and local all-in price; giving time remains $0. Historical amounts audited: Gifts $35/$10. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

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

**Player-facing general fact template:** “A family birthday can mean balancing a gesture of care with money needed for essentials. Between {base observation period} and {latest observation period}, the U.S. price index for stationery, supplies and gift wrap changed by {pct}%.”

**General fact semantic key:** `cpi:SS33032`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SS33032. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** Hope for the Holidays is seasonal holiday support, not general birthday gifts. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

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

**Player-facing general fact template:** “A coat is one of the clothing needs to plan for as Maya grows. Between {base observation period} and {latest observation period}, the U.S. price index for girls' apparel changed by {pct}%.”

**General fact semantic key:** `cpi:SEAD`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEAD. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “A warm coat is the need at the center of Coats for Kids. In 2025, Coats for Kids served 623 children.”

Source: S18/S19; fact ID `e8473e58-6338-4855-93be-7608f27696ab`; service `coats_for_kids`; key `children_served_by_coats_for_kids`; reporting year 2025; exact stored value `623` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The need is a child’s warm coat in the program’s season. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

### D046 — Packing lunch or buying it?

**Baseline evidence and disposition (November 7):** Unresolved: lunch count, servings and actual ingredients/menu prices. Historical amounts audited: Lunch ingredients $26/bought $55. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d046)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D046-PACK — Buy ingredients and pack lunches | -$26.00 |
| D046-BUY — Buy the workday lunches | -$55.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** food at home for packed; food away from home for purchased. **Required definition:** Define workday lunch count and servings; separate ingredient basket and local menu quotes.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Packing lunches means buying ingredients ahead of time. Sandwich fillings are one part of that shopping list. Between {base observation period} and {latest observation period}, the U.S. price index for lunchmeats changed by {pct}%.”

**General fact semantic key:** `cpi:SS0501A`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SS0501A. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Packing lunches starts with having groceries available at home. In 2025, the CAC Mini-Market reported 1,140,047 pounds of donated food.”

Source: S18; fact ID `f1e16055-cb30-4633-8ce2-89d834ec92d1`; service `mini_market`; key `pounds_of_food_donated_to_the_cac_mini_market`; year 2025; exact stored value `1140047` Pounds. Replaces the duplicate household-count proposal in this sourcing document. Initial source verification pending. Donations are not distributed food, individual benefit amounts or a workplace-lunch subsidy. Historical pairing files are unchanged.

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

**Player-facing general fact template:** “A replacement bag is one of the personal goods that can become an unexpected purchase. Between {base observation period} and {latest observation period}, the U.S. price index for miscellaneous personal goods changed by {pct}%.”

**General fact semantic key:** `cpi:SEGE`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEGE. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No fact establishes bag replacement/repair; the general clothing program is insufficient. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

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

**Player-facing general fact template:** “Planning meals for Maya means covering food alongside the rest of the household budget. Between {base observation period} and {latest observation period}, the U.S. price index for food at employee sites and schools changed by {pct}%.”

**General fact semantic key:** `cpi:SEFV03`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEFV03. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Meals for Kids connects with the need to plan food for Maya. In 2025, Meals for Kids served 1,097 children.”

Source: S18/S19; fact ID `9496c5fe-de45-4ce7-96a9-4d6ba7f2ac01`; service `meals_for_kids`; key `children_served_by_meals_for_kids`; reporting year 2025; exact stored value `1097` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The scenario explicitly covers meals for a child during the program period. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

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

**Player-facing general fact template:** “Running low on essentials means deciding how much you can buy with the cash available. Between {base observation period} and {latest observation period}, the U.S. price index for personal care products changed by {pct}%.”

**General fact semantic key:** `cpi:SEGB`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEGB. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No hygiene-supply assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

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

**Player-facing general fact template:** “A chance to learn can mean weighing an opportunity against an immediate expense. Between {base observation period} and {latest observation period}, the U.S. price index for lesson and instruction fees changed by {pct}%.”

**General fact semantic key:** `cpi:SERF03`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SERF03. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Taking time to build skills is part of the learning journey. In 2025, CAC reported 610 total students in Adult Education programs.”

Source: S18/S19; fact ID `7cb64039-5726-43da-8f15-fbf8b63e8f83`; service `adult_education`; key `total_students_in_adult_education_programs`; reporting year 2025; exact stored value `610` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The card asks whether to invest money and time in optional learning. Context only; CAC does not fund the private workshop or grant a qualification in this draft.

### D052 — Maya's birthday

**Baseline evidence and disposition (November 7):** Unresolved: attendees/activity/food/items and respective all-in costs. Historical amounts audited: Birthday $80/$20. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d052)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D052-PLAN — Pay for the original plan | -$80.00 |
| D052-HOME — Choose the smaller home celebration | -$20.00 |

**Recommended source/method:** S20; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** category pending birthday goods/activity selection. **Required definition:** Specify child birthday alternatives, attendees and included items; do not infer CAC birthday support.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Even a smaller birthday at home can mean finding money for a cake. Between {base observation period} and {latest observation period}, the U.S. price index for fresh cakes and cupcakes changed by {pct}%.”

**General fact semantic key:** `cpi:SS02041`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SS02041. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** Holiday-program facts do not establish birthday-party support. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

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

**Player-facing general fact template:** “Turkey can be one of the ingredients to budget for when planning a holiday meal. Between {base observation period} and {latest observation period}, the U.S. price index for uncooked poultry other than chicken changed by {pct}%.”

**General fact semantic key:** `cpi:SEFF02`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEFF02. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Holiday food support connects with putting a seasonal meal on the table. In 2025, 984 households received Holiday Food Baskets.”

Source: S18/S19; fact ID `1eec83c9-41ca-4aef-be22-1e36289d9d95`; service `holiday_food_baskets`; key `households_who_received_holiday_food_baskets`; reporting year 2025; exact stored value `984` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The need is a distinct seasonal holiday food basket. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

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

**Player-facing general fact template:** “Replacing worn clothing means balancing what you need now with money needed elsewhere. Between {base observation period} and {latest observation period}, the U.S. price index for clothing other than footwear changed by {pct}%.”

**General fact semantic key:** `cpi:SA311`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SA311. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Clothing credits are one way CAC supports access to replacement clothing. In 2025, clients used $206,768.67 in credits at CAC Canopy Thrift.”

Source: S18/S19; fact ID `859b8cec-1e1c-4887-9f55-fd55f1bb349c`; service `canopy_thrift`; key `dollar_amount_of_client_credits_used_at_cac_canopy_thrift`; reporting year 2025; exact stored value `206768.67` Dollars. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The decision concerns replacement clothing and a lower-cost alternative. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

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

**Player-facing general fact template:** “A holiday gift can be meaningful while still competing with everyday expenses. Between {base observation period} and {latest observation period}, the U.S. price index for toys changed by {pct}%.”

**General fact semantic key:** `cpi:SERE01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SERE01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “Hope for the Holidays connects with the wish to include a child in seasonal gift giving. In 2025, Hope for the Holidays served 614 households.”

Source: S18/S19; fact ID `18b975be-96cb-49ec-901b-ccd04c6c6a5c`; service `hope_for_the_holidays`; key `households_served_by_hope_for_the_holidays`; reporting year 2025; exact stored value `614` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The card explicitly concerns the named holiday program and a child’s holiday gift. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

### D057 — A pass or a few fares?

**Baseline evidence and disposition (November 7):** Replace: E02 exact product and trip count; seven-day $23.75, thirty-day $95, four standard trips $10, not arbitrary pass/fare totals. Historical amounts audited: Pass $50/fares $12. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d057)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D057-PASS — Buy the pass | -$50.00 |
| D057-FARES — Buy only the immediate fares | -$12.00 |

**Recommended source/method:** S12; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** none; published transit fares. **Required definition:** Identify exact pass duration, rider eligibility, fare count and transfer rules; draft $50/$12 must be replaced or justified.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact template:** “Buying a transit pass means spending more now in exchange for coverage on later trips. As of {effective date}, the regular MARTA base fare was {amount} per {fare unit}.”

**General fact semantic key:** `marta:MARTA:regular_base_fare`

Source/update: S12; configure automatic extraction of current official fares and effective dates. Use the published base fare and transfer conditions; do not substitute a pass price. Observation retrieval remains pending. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No general bus-pass/fare fact; workforce-specific transportation cannot be generalized to all personas. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

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

**Player-facing general fact template:** “Buying laundry supplies means balancing what you need now against the cost of a larger pack. Between {base observation period} and {latest observation period}, the U.S. price index for household cleaning products changed by {pct}%.”

**General fact semantic key:** `cpi:SEHN01`

Source/update: S01 / A01; [S25 category catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm). Candidate CPI-U non-seasonally-adjusted series CUUR0000SEHN01. U.S. city average, not a Sandy Springs observation. Calculate 100 * (latest nonmissing index / base index - 1), using the same published series and a configured comparison period. Category is factual context, not the exact scenario product price. Endpoint observations/series availability still require validation before display. Initial binding verification is pending; subsequent validated observations update and publish automatically.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact:** Awaiting a supported topic-matched observation.

**Evidence gap:** No laundry-detergent/supply assistance fact. Source: S19. Ask CAC for a topic-matched dated observation and its original evidence, or obtain an explicit change to the two-fact publication policy. Do not substitute an unrelated service fact. No API or numerical CAC sentence is currently supported.

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

### D060 — The groceries are running low

**Baseline evidence and disposition (November 7):** Unresolved: exact full/small baskets and coverage period; reuse D036 unit prices. Historical amounts audited: Grocery restock $90/$45. Evidence IDs refer to the [checked online price evidence](#checked-online-price-evidence) below.

[Original scenario](scenario-draft-library.md) · [CAC pairing/gap](scenario-cac-fact-pairings.md#d060)

**Numerical inputs and price sources**

| Choice/component | Historical draft expression (not verified pricing) |
| --- | --- |
| D060-FULL — Buy the full restock | -$90.00 |
| D060-SMALL — Buy the smaller restock | -$45.00 |
| D060-CAC — Get groceries from the CAC Mini-Market | USD 0.00; free in-kind receipt; no cash credit |

**Recommended source/method:** S20/S09; CPI fallback via A01 (or A05) only where appropriate. **Candidate index category:** food at home. **Required definition:** Define full/smaller late-month baskets and days/persons covered; use shared item prices with D036.

**Update/review:** Local quotes follow the baseline policy; official rates follow effective dates; statistical sources follow release dates. Baseline/evidence ID, exact API variables/series where applicable, and reviewer are PENDING. 

**General fact (separate from price)**

**Player-facing general fact:** “For U.S. households experiencing very low food security, disrupted meals and reduced food intake were usually occasional episodes rather than a constant condition, according to USDA's 2024 report.”

**General fact semantic key:** `food:episodic_shortages`

Source/update: S35, [USDA: Household Food Security in 2024](https://ers.usda.gov/sites/default/files/_laserfiche/publications/113623/ERR-358.pdf). Retain reporting year and very-low-food-security population; do not generalize to every household. Source checked November 7, 2026. Proposed qualitative display copy; initial content verification remains pending. Preserve the dated observation and semantic key on routine refresh; do not regenerate free-form claims automatically. No numerical binding is required for this passage.

**CAC fact (separate from price and general fact)**

**Player-facing CAC fact template:** “A late-month food need is another reason a household may turn to food support. In 2025, the CAC Mini-Market served 7,034 individuals.”

Source: S18/S19; fact ID `0a3f963a-b2c5-47d6-8b9d-e0d396da6a66`; service `mini_market`; key `individuals_served_by_the_cac_mini_market`; reporting year 2025; exact stored value `7034` Number. Status: existing pairing for review, not publication approval. Update through a CAC-approved report/export and protected backend ingestion; no public CAC API has been established. Require original report/page or staff certification before final factual review. The scenario is a distinct late-month household food need. Free in-kind receipt: player balance change USD 0.00; no fee, cash deposit, cash-equivalent refund or debt. Record only the approved items/quantity actually received. Eligibility, availability, item scope and edition/service bindings remain pending; no entitlement to the priced retail alternative or complete basket is inferred. If the approved allocation meets only part of the need, record that need as partly unmet without charging a remainder or inventing a follow-up purchase. Any separately approved retail purchase is a distinct cost, never a CAC service fee. Annual facts do not determine individual quantities or benefit values.

### Fact uniqueness audit

All 60 general slots have distinct semantic fact keys, not merely different introductory wording. The library mixes sourced qualitative observations with numerical templates; neither wording changes nor removing digits makes a repeated underlying claim unique. Remaining CPI candidates use U.S. city-average observations for distinct categories, explicitly labeled U.S.; ACS candidates use distinct measures and population universes. Initial API validation must also reject aliased series and accidental duplicate underlying measures. No new current numerical observations were invented.

D046 now uses the distinct donated-food CAC observation directly in its scenario section. The historical CAC pairing files retain their earlier proposals; this document records the replacement for final edition binding. Other CAC repeats remain permitted where no suitable distinct observation has been established.

| Scenario | General semantic measure key |
| --- | --- |
| D001 | acs:B23025:unemployment |
| D002 | cpi:SAA |
| D003 | employment:jobseekers_different_work_histories |
| D004 | acs:B08303:long_commute |
| D005 | tax:eitc_refundable_credit_for_workers |
| D006 | acs:B25070:rent_burden |
| D007 | eia:GA:RES:monthly_electricity_price |
| D008 | cpi:SEHG01 |
| D009 | cpi:SEED03 |
| D010 | digital:adult_daily_internet_use |
| D011 | cpi:SETE |
| D012 | health:income_related_forgone_care |
| D013 | care:childcare_cost_relative_to_housing |
| D014 | school:FCS:student_lunch_rate |
| D015 | cpi:SETD03 |
| D016 | health:prescription_cost_barrier |
| D017 | acs:B17001:poverty |
| D018 | energy:unhealthy_home_temperature |
| D019 | acs:B25064:median_gross_rent |
| D020 | acs:B27001:uninsured |
| D021 | cpi:SETD |
| D022 | health:dental_most_skipped_care |
| D023 | acs:B28001:smartphone_only |
| D024 | care:unpaid_adult_relative_support |
| D025 | care:disruption_work_absence |
| D026 | cpi:SETC01 |
| D027 | cpi:SEMC03 |
| D028 | acs:B25047:lacking_plumbing |
| D029 | cpi:SEMC04 |
| D030 | acs:B28001:desktop_laptop |
| D031 | cpi:SETD02 |
| D032 | acs:B25010:renter_household_size |
| D033 | cpi:SEHM01 |
| D034 | cpi:SEHJ01 |
| D035 | cpi:SAF11 |
| D036 | food:reduced_diet_variety |
| D037 | acs:B08301:public_transport_commute |
| D038 | cpi:SEGD03 |
| D039 | cpi:SERF02 |
| D040 | cpi:SEAE |
| D041 | time:cooking_gender_participation |
| D042 | cpi:SEEA |
| D043 | cpi:SS33032 |
| D044 | acs:B08201:no_vehicle_households |
| D045 | cpi:SEAD |
| D046 | cpi:SS0501A |
| D047 | cpi:SEGE |
| D048 | cpi:SEFV03 |
| D049 | banking:reported_access_barriers |
| D050 | cpi:SEGB |
| D051 | cpi:SERF03 |
| D052 | cpi:SS02041 |
| D053 | cpi:SEFF02 |
| D054 | cpi:SA311 |
| D055 | acs:B17010:family_poverty |
| D056 | cpi:SERE01 |
| D057 | marta:MARTA:regular_base_fare |
| D058 | cpi:SEHN01 |
| D059 | social:less_daily_socializing |
| D060 | food:episodic_shortages |

## Implementation sequence and acceptance checks

1. Review this inventory and assign data owners. Resolve product/service scope, household quantities and geographic mappings. Collect and approve S20 baselines; require an automatic update plan for every monetary binding, including clothing and refunds.
2. Prove A01 and A02 first, then A03/A04 for rent and energy. Choose BLS or FRED for the same index; avoid duplicate ingestion. Import official rates and datasets behind the same source-observation mechanism.
3. Create stable source, observation, price-binding and fact identifiers; store quote evidence, controlled formulas and reviewer decisions. API requests and credentials belong on the backend. Do not expose private CAC exports or secrets.
4. Pilot rent, electricity, groceries, a dresser, a transit fare and a general/CAC fact pair. Validate units, denominator, seasonal treatment, missing data, fee inclusion and household allocation with staff.
5. Require the [baseline audit](#online-baseline-evidence---november-7-2026) disposition to be resolved for every monetary component; reject unsupported legacy values, missing quantities and unknown mandatory charges. Verify every choice/component, repeated narrative amount and fact resolves consistently; reject publication with missing baselines or required facts. Check source revisions, unavailable data, rounding, stale approvals, idempotent monthly refresh, capped support, and frozen active-run editions.

Documentation verification performed for this handoff: all D001–D060 sections and their source-table financial rows included; bill component statements retained; 30 CAC pairings checked against snapshot IDs/values/units and 30 gaps retained. General fact templates intentionally remain unresolved. No application tests are required for this documentation-only change.

## Consolidated API list

These are the proposed integrations for API-suitable inputs. They do not collectively provide exact prices for every purchase. Non-API rate sheets, quotes and imports are listed separately below. Exact series/variables/geographies remain implementation acceptance gates unless specifically identified.

| ID | API and documentation | Coverage | Authentication / request design | Refresh and limits |
| --- | --- | --- | --- | --- |
| A01 | [BLS Public Data API](https://www.bls.gov/developers/) (S01/S02) | Already implemented OEWS wage retrieval for eight Atlanta jobs (S24), plus proposed category inflation for eligible S20 baselines and category-index facts | POST https://api.bls.gov/publicAPI/v2/timeseries/data/ with validated series IDs and year range; registration key for expanded access; keep it server-side | Monthly checks; only consume released nonmissing observations. Atlanta CPI every two months; category/geographic availability varies. Not item prices. |
| A02 | [Census ACS five-year](https://www.census.gov/data/developers/data-sets/acs-5year.html) (S05) | Employment, poverty, rent burden, internet subscriptions and health-insurance fact templates | https://api.census.gov/data/{release}/acs/acs5; get=NAME plus validated estimate/MOE variables; for=place:{verified Sandy Springs place code}; in=state:13; provision Census key per service guidance | Check monthly for annual releases. Five-year estimates are historical multi-year statistics, not current-month facts. Proposed B23025/B17001/B25070/B28002/B27001 mappings need execution and denominator review. |
| A03 | [HUD FMR / Income Limits](https://www.huduser.gov/portal/dataset/fmr-api.html) (S06/S07) | Rent benchmarks D006/D019; income limits only if separately required by an approved eligibility rule | Bearer token; discover county/metro entity IDs and year, then documented fmr/data/{entityid} route; inspect available ZIP/bedroom data rather than inventing a ZIP endpoint | Annual releases, checked monthly. Gross-rent benchmark; bind utilities and rent share carefully. Income Limits are not a required dependency for an unapproved CAC eligibility rule. |
| A04 | [EIA API v2](https://www.eia.gov/opendata/documentation.php) (S08) | D007 Georgia residential electricity reference rate/fact; gas benchmark optional after route validation | API key; https://api.eia.gov/v2/electricity/retail-sales/data/ with GA, residential, price, frequency and period filters; validate returned facets/units | Monthly released data with lag. Price in cents/kWh must be converted for dollar calculations. Gas supplier tariffs need separate records. |
| A05 | [FRED API](https://fred.stlouisfed.org/docs/api/fred/) (S03/S04), optional alternative to A01 | Existing Atlanta food/beverages CUURA319SAF; other index series after validation | API key; https://api.stlouisfed.org/fred/series/observations with series_id, date range and file_type=json | Same underlying source release; alternate-month missing values must be skipped explicitly. Do not treat FRED as an independent second price observation. |
| A06 | Proposed internal approved-data API, not an existing external service | Approved CAC fact exports, reviewed quotes, tariff imports, resolved prices and facts across all scenarios | Implement within the established Supabase backend and protected staff workflow; public gameplay reads only approved edition data | Scheduled ingestion, automated validation and automatic publication without staff approval; existing database snapshot does not establish a live CAC feed. Active runs retain their edition. |
| A07 | [RentCast rental listings](https://developers.rentcast.io/reference/rental-listings-long-term) | Proposed current rental listings for D006/D019 | Backend key; validate city boundary, bedrooms, listing status, sample and access terms | Monthly checks proposed; asking rents, not leases or HUD gross rent; no authenticated call made. |
| A08 | [Best Buy APIs](https://developers.bestbuy.com/apis) | Proposed D023/D030 replacement electronics | Backend key; exact SKU, condition, local availability and final charges | Monthly checks proposed; no repair pricing or authenticated call made. |
| A09 | [OpenEI tariffs](https://apps.openei.org/services/doc/rest/util_rates/) | Proposed D007 electricity tariff input | Backend key; match utility/tariff, effective dates, tiers, fixed charges, riders and taxes | Effective-date imports proposed; tariff alone is not a complete bill; no authenticated call made. |

The [follow-up API search](#api-search-revisited) identifies additional rental-listing, electronics and electricity-tariff API candidates. No authenticated integration was established. No medical, insurance, rideshare, bank-fee, school or transit pricing API is asserted. OEWS already uses the BLS API with an optional file fallback. USDA Food Plans, NDCP, FINRA and CAC reports require separately configured import automation. Optional SHED/ERS imports provide alternative facts, not required additional integrations.

## Consolidated source list

External documentation checks: November 7, 2026. “Verified” means the cited documentation/page was inspected, not that a production API request or local price was verified. See source-specific limitations. Local documents are evidence of existing project decisions or stored observations, not proof of current retail prices.

| ID | Source | Role and verification boundary |
| --- | --- | --- |
| S01 | [BLS API and CPI](https://www.bls.gov/developers/) | API documentation verified; category series selection pending. |
| S02 | [Atlanta CPI observation schedule](https://www.bls.gov/regions/southeast/cpi-summary/consumerpriceindex_summary_southeast.pdf) | Atlanta observations are every two months. |
| S03 | [FRED API](https://fred.stlouisfed.org/docs/api/fred/) | Optional alternative transport for BLS observations. |
| S04 | [Atlanta food and beverages CPI CUURA319SAF](https://fred.stlouisfed.org/series/CUURA319SAF) | Verified series metadata; monthly grid includes missing alternate months. |
| S05 | [Census ACS five-year API](https://www.census.gov/data/developers/data-sets/acs-5year.html) | API documentation verified; proposed table/variable mappings require execution and denominator review. |
| S06 | [HUD FMR and Income Limits API](https://www.huduser.gov/portal/dataset/fmr-api.html) | Documentation verified; choose returned geography/ZIP and bedrooms before use. |
| S07 | [HUD Small Area Fair Market Rents](https://www.hud.gov/helping-americans/housing-choice-vouchers-safmr) | ZIP-level program rent benchmarks, not individual rental quotes. |
| S08 | [EIA API documentation](https://www.eia.gov/opendata/documentation.php) | API documentation verified; GA residential electricity route is a benchmark. |
| S09 | [USDA monthly Food Plans](https://www.fns.usda.gov/research/cnpp/usda-food-plans/cost-food-monthly-reports) | Existing api.md source; browser returned 403 on this audit. File retrieval and schema remain unverified. |
| S10 | [BLS OEWS area tables](https://www.bls.gov/oes/current/oessrcma.htm) | Official published occupation/area wage tables; fallback/reference for the implemented OEWS API importer (S24). |
| S11 | [DOL National Database of Childcare Prices](https://www.dol.gov/agencies/wb/topics/featured-childcare) | County-level benchmark by age/provider; download, not a confirmed live API. |
| S12 | [MARTA fares and transfers](https://itsmarta.com/ride/how-to-pay/fares-and-transfers) | Official fare source verified; import fare products and effective dates. No pricing API established. |
| S13 | [Fulton County Schools meal prices](https://nutrition.fultonschools.org/MealPrices/Disclaimer) | Official price page verified; school year, eligibility and actual school matter. |
| S14 | [Sandy Springs utility providers](https://www.sandyspringsga.gov/utilities/) | Provider directory verified; follow provider rate documents for the actual address. |
| S15 | [FINRA NFCS downloads](https://www.finrafoundation.org/nfcs-data-and-downloads) | Reviewed survey import; no public REST API established. |
| S16 | [Federal Reserve SHED data](https://www.federalreserve.gov/consumerscommunities/shed_data.htm) | Optional reviewed financial-resilience survey import. |
| S17 | [USDA ERS food-security data](https://www.ers.usda.gov/data-products/food-security-in-the-united-states) | Optional reviewed food-access dataset import. |
| S18 | [CAC fact snapshot](data/cac-service-facts-2025.json) | 66 existing records retrieved November 6, 2026; upstream reports not independently rechecked here. |
| S19 | [CAC pairing review](scenario-cac-fact-pairings.md) | Existing pairing rationale and topic gaps; retain annual reporting year. |
| S20 | [Local price evidence register (to collect)](scenario-data-sourcing.md#local-evidence-register) | Follow-up online evidence is in the [baseline audit](#online-baseline-evidence---november-7-2026); unresolved exact products, scope and all-in charges still block baseline approval. |
| S21 | [Scenario draft library](scenario-draft-library.md) | Authority for the draft amounts inventoried below, not evidence of market prices. |
| S22 | [Scenario specification](scenarios.md) | Authority for approved simulation rules, review and publication. |
| S23 | [Existing API plan](api.md) | Existing source and integration proposals. |
| S25 | [BLS category publication catalogue](https://www.bls.gov/cpi/additional-resources/index-publication-level.htm) | Category names/codes and national publication scope inspected November 7; candidate series observations not fetched. |
| S28 | [IRS Topic 601: Earned Income Credit](https://www.irs.gov/taxtopics/tc601) | Qualitative D005 fact: eligible workers can receive a refundable EITC even without federal income tax liability. Source checked November 7, 2026; does not supply the simulated refund amount. |
| S27 | [BLS CPS definitions](https://www.bls.gov/cps/definitions.htm) | Describes jobseekers with different work histories; supports the qualitative D003 fact. Source checked November 7, 2026. |
| S26 | [ACS detailed table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html) | Table catalogue inspected November 7; exact cells and observations require initial validation. |
| S24 | [Existing wage importer](../integrations/bls_oews/bls_oews_sync.py), [scheduler](../.github/workflows/bls_oews_sync.yml), [README](../README.md#bls-wage-synchronization) | Implementation inspected locally: BLS API, eight SOC jobs, Atlanta area 12060, monthly checks, draft-only writes. Live execution and deployment not verified. |
| S29 | [Pew: everyday internet use](https://www.pewresearch.org/short-reads/2026/01/08/internet-use-smartphone-ownership-digital-divides-in-u-s/) | January 2026 report, 2025 U.S. adult survey: 90 percent use the internet daily. Does not measure need for paid home broadband. Checked November 7, 2026; initial binding verification pending. |
| S30 | [Federal Reserve: economic hardships](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-economic-hardships.htm) | 2025 SHED U.S. adult findings; distinct healthcare measures, not local estimates. Checked November 7, 2026; proposed copy, initial content verification pending. |
| S31 | [Federal Reserve: care work](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-living-arrangements-care-work.htm) | 2025 SHED: childcare spending relative to housing and adult caregiving are distinct observations; D013 rechecked November 8, 2026. Checked November 7, 2026; proposed copy, initial content verification pending. |
| S32 | [Census: childcare challenges](https://www.census.gov/library/working-papers/2026/demo/sehsd-wp2026-08.html) | May 2026 working paper using 2025 CPS ASEC about 2024; descriptive findings, not causal estimates. Checked November 7, 2026; proposed copy, initial content verification pending. |
| S33 | [USDA: food-security measurement](https://ers.usda.gov/topics/food-nutrition-assistance/food-security-in-the-us/measurement) | Definitions distinguish dietary variety from disrupted intake; not a local prevalence estimate. Checked November 7, 2026; proposed copy, initial content verification pending. |
| S34 | [BLS: 2025 American Time Use Survey](https://www.bls.gov/news.release/archives/atus_06252026.htm) | June 2026 archived release; national time-use observations, not individual behavior predictions. Checked November 7, 2026; proposed copy, initial content verification pending. |
| S35 | [USDA: Household Food Security in 2024](https://ers.usda.gov/sites/default/files/_laserfiche/publications/113623/ERR-358.pdf) | Historical U.S. food insecurity can be episodic; not an individual household assessment. Checked November 7, 2026; proposed copy, initial content verification pending. |
| S36 | [Federal Reserve: financial inclusion](https://www.federalreserve.gov/newsevents/speech/barr20250715a.htm) | July 2025 speech citing household banking research; reasons people report being unbanked. Checked November 7, 2026; proposed copy, initial content verification pending. |
| S37 | [EIA: 2024 household energy insecurity](https://www.eia.gov/consumption/residential/data/2024/hc/pdf/HC11.1_2024.pdf) | RECS table HC11.1 includes reported unhealthy indoor temperatures; national, not local. Checked November 7, 2026; proposed copy, initial content verification pending. |

### Consolidated local evidence still needed

| Evidence group | Scenarios | Evidence to collect |
| --- | --- | --- |
| Rent/utility/telecom | D006–D010, D018, D019, D028, D032 | Address-specific rent/share, provider tariffs, consumption, plans, plumbing scope and shared purchase. |
| Employment/education/tax | D001–D005, D033, D051 | Occupation wages/hours, clothing evidence, tax-preparer scope/fee, work item and course quotes. |
| Medical/pharmacy/vision/dental | D012, D016, D020, D022, D027, D029 | Exact service/product and patient responsibility; do not use identifiable participant records. |
| Transport/vehicle/insurance | D011, D015, D021, D024, D026, D031, D037, D044, D057 | Vehicle/coverage/repair profiles, routes and quotes; official fare product and count. |
| Childcare/school | D013, D014, D025, D039, D042, D048 | Care age/hours/provider; school rate/eligibility, trip notice and supply list. |
| Retail goods/services | D023, D030, D034, D038, D040, D043, D045, D047, D050, D052, D054, D056, D058, D059 | Exact devices, dresser, laundry, clothing, gifts, essentials and outing specifications and all-in quotes. |
| Food baskets/meals | D035, D036, D041, D046, D048, D053, D060 | Item/serving lists, local unit/menu prices, household composition and coverage period. |
| Contract/transfer/financial fees | D017, D049, D055; late fees D006–D020 | Agreement or fee schedule and explicit rule approval, not inflation-based repricing. |
| CAC operational evidence | All CAC-supported choices and all 60 CAC fact slots | Original annual fact evidence, topic gaps, benefit caps, item availability, eligible scope and approval owner. |
