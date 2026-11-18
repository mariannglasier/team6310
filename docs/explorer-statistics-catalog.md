# Explore Data statistics catalog (proposed)

Staff and developer reference for Feature 5 (Interactive Data Visualization). It maps the sources in the team's "API research and Visualization brainstorm" notes and `docs/api.md` to the Explore page's six categories, and defines what each statistic needs before it can be stored and published.

Status: **deployed to the hosted project; 27 statistics, all published automatically on November 18, 2026**. The schema is in `supabase/migrations/20261117150000_explorer_statistics.sql` (see [Explorer statistics](data-model.md#explorer-statistics-public-explore-data)). Statistics need no staff approval: every value an API returns publishes automatically, and the monthly refresh keeps the value when the source has nothing newer and replaces it when it has (see "Ingestion and publishing" and "Hosted deployment record"). Choosing which statistics exist (the definition rows) is still a development decision made in a migration.

## Decisions recorded November 17, 2026

- Keep the tabbed layout from `design/ui-spec.md` section 9A. Add icon and short description to each tab rather than building a separate landing grid.
- Store explorer statistics in separate tables, not in the edition-scoped gameplay `statistics` table.
- Routine monthly refreshes publish without staff approval. Superseded November 18, 2026: the first value of a statistic also publishes without approval, and statistics need no approval at all (see "Ingestion and publishing"). Only a value for an older period than the published one stays staged, so it never replaces the page value.
- Real-world statistics only for now. Anonymous simulation-player responses are deferred; when added they must follow the five-run suppression rule in `security.md`, and section 9A (which says the page shows no player data) must be revised first.

## Verification flags used below

- **Confirmed in repo docs**: named in `docs/api.md` or the team notes with an endpoint or series.
- **Verify**: named from general knowledge or the notes without a documented identifier. Check against the source's own variable list, codebook, or series page before use.

## Statistics by category

Units are the schema's `unit` values: `percent`, `percent_change`, `usd`, `cents_per_kwh`, `index`, `count`. Visualization types are `meter`, `pictogram`, `trend`, `comparison`, `figure`.

### Housing & Utility Security (`housing`)

| Statistic key | Source and retrieval | Measure | Geography | Unit, visual | Flags |
| --- | --- | --- | --- | --- | --- |
| `ga_residential_electricity_price` | EIA API `https://api.eia.gov/v2/electricity/retail-sales/data/`; facets state `GA`, sector residential, field `price`, monthly; key required | Average retail electricity price | Georgia | `cents_per_kwh`, `trend` (feeds the seasonal view) | Confirmed in `docs/api.md`. Average price, not a household bill. Any monthly-bill figure needs an explicit usage assumption. Shipped as a `figure` (latest month); a `trend` needs a history read that the public explorer does not have yet |
| `sandy_springs_renter_cost_burden` | Census ACS 5-year data profile DP04, place `68516`: `DP04_0141PE` + `DP04_0142PE` (rent 30.0-34.9% and 35.0%+ of income) | Share of renting households spending 30% or more of income on rent | Sandy Springs, GA | `percent`, `meter`; **derived** | **Defined and ingestion built.** Sum of two rows; margin of error combines the two as the square root of the sum of squares. Live 44.7% ±4.1 (11.4 + 33.3) |
| `fulton_eviction_filings` | Fulton County open data, dataset `cbu2-qs5w` (SODA JSON endpoint named in the notes) | Eviction filings per month | Fulton County, GA | `count`, `trend` | **Defined and ingestion built** (migration `20261117190000`). Shipped as a `figure` (latest month); a `trend` needs a history read the public explorer does not have yet. Columns verified live on November 17, 2026: `month` (YYYY-MM), `monthdate`, `filings`; 130 consecutive months from 2016-01 to 2026-10, no gaps or duplicates. Latest month October 2026: 3,095 filings. Fulton County, not Sandy Springs or Dunwoody |
| Removed facts (no API) | JCHS cost-burdened renters; EIA RECS energy insecurity | Share of households | United States | `percent`, `meter` | Not APIs, so removed from the page (November 18, 2026). The Sandy Springs renter cost burden above replaces the first for the Housing windows; ACS 1-year U.S. renter cost burden (`DP04_0141PE` + `DP04_0142PE`, `for=us:1`) returned 9.4% + 42.3% on the live API and could replace a U.S. figure. No API found for energy insecurity |

Eviction Lab data is CSV only (file import) and is not planned for the first pass.

### Food & Nutrition (`food`)

| Statistic key | Source and retrieval | Measure | Geography | Unit, visual | Flags |
| --- | --- | --- | --- | --- | --- |
| `atl_food_beverage_cpi_change` | FRED `series/observations`, `series_id=CUURA319SAF`; key required | Change in the food and beverage price index over 12 months | Atlanta-Sandy Springs-Roswell MSA | `percent_change`, `figure`; **derived** | **Defined and ingestion built** (migration `20261117160000`, `refresh-explorer-statistics`). Verified against the live API on November 17, 2026: FRED labels the series monthly, but values exist only for even months (odd months are `.`), and October 2025 is missing. The refresh uses the latest month where both the current and prior-year values exist (August 2026 vs. August 2025 = +3.63%). Formula is stored as the derivation note |
| `us_food_at_home_price_change` | FRED `CUUR0000SAF11` (CPI food at home, U.S. city average, not seasonally adjusted); year-over-year transform | Change in grocery prices over 12 months | United States | `percent_change`, `figure`; **derived** | **Defined and ingestion built.** October 2025 is missing in the series, so the latest comparable month is September 2026 vs. September 2025 = +1.8%. The hand-entered "+11.4%, then +5.0%" fact (2022 and 2023) was removed |
| Removed facts (no API) | USDA ERS food insecurity (13.5%, 2023); ACFB "1 in 6" children | Share of households or children | United States; metro Atlanta | `percent`, `pictogram` or `meter` | Not APIs, so removed from the page. No API found for either |

The notes' "$500 cart now costs $534" example is an illustrative slider preset, not a stored statistic. USDA FoodData Central is not planned: nothing in the Feature 5 acceptance criteria needs nutrient data.

### Employment & Adult Education (`employment`)

| Statistic key | Source and retrieval | Measure | Geography | Unit, visual | Flags |
| --- | --- | --- | --- | --- | --- |
| `atl_msa_unemployment_rate` | FRED, `series_id=ATLA013URN`; key required | Unemployment rate | Atlanta-Sandy Springs-Roswell MSA | `percent`, `trend` or `meter` | **Defined and ingestion built** (migration `20261117200000`). Series verified live: monthly, not seasonally adjusted, latest September 2026 = 3.5% |
| `sandy_springs_language_other_than_english` | Census ACS 5-year, subject table S1601 (Language Spoken at Home), place `1368516` | Share of residents age 5 and over who speak a language other than English at home | Sandy Springs, GA | `percent`, `meter` | **Defined and ingestion built** (migration `20261117180000`). Variable `S1601_C02_003E` (margin `S1601_C02_003M`), place 68516 in state 13. Live value on November 17, 2026: 20.1% (±1.6), 2020–2024 ACS 5-year |
| `sandy_springs_poverty_rate` | Census ACS 5-year, subject table S1701, place `1368516` | Share of residents below the poverty line | Sandy Springs, GA | `percent`, `meter` | **Defined and ingestion built.** Variable `S1701_C03_001E` (margin `S1701_C03_001M`). Live value: 8.5% (±1.2), 2020–2024 ACS 5-year |
| Removed facts (no API) | BLS Education Pays | Earnings and unemployment by education | United States | `usd`, `percent` | The published page has no API, so it was removed. The underlying series are reachable: FRED `LNS14027659`, `LNS14027660`, `LNS14027689`, `LNS14027662` (unemployment by education, verified November 18, 2026) and FRED `LEU0252916700Q`, `LEU0252917300Q`, `LEU0252918500Q` (median usual weekly earnings by education, quarterly, last observation July 2026; titles verified November 18, 2026). These are FRED series, so the existing FRED module ingests them with database rows only. Added on November 18, 2026 as `us_unemployment_*` and `us_weekly_earnings_*` (see "Statistics added November 18, 2026"); the "some college" series `LNS14027689` is not defined |

The job board stays illustrative. O\*NET data would need registration and a separate decision on qualification rules.

### Essential Goods & Clothing (`clothing`)

| Statistic key | Source and retrieval | Measure | Geography | Unit, visual | Flags |
| --- | --- | --- | --- | --- | --- |
| Pending CAC records | `cac` source, `client_provided` | Garments or items given out, and the situations they serve | Sandy Springs and Dunwoody | `count`, `figure` | The notes found no outside data. Waiting on CAC to supply approved totals and a format. Superseded: the CAC 2025 outcomes workbook now supplies clothing figures through the CSV |

### Childcare & Youth Needs (`youth`)

| Statistic key | Source and retrieval | Measure | Geography | Unit, visual | Flags |
| --- | --- | --- | --- | --- | --- |
| `fulton_child_poverty_rate`, `dekalb_child_poverty_rate` | Census SAIPE API (county level); variables for the 0-17 poverty rate and count | Children under 18 in poverty | Fulton County (13121) and DeKalb County (13089) | `percent`, `meter` | **Defined and ingestion built.** Variable `SAEPOVRT0_17_PT` with 90% bounds `SAEPOVRT0_17_LB90` and `SAEPOVRT0_17_UB90`. Live 2024 values: Fulton 12.8% (9.3–16.3), DeKalb 16.6% (12.8–20.4). SAIPE reports counties and school districts, **not** Sandy Springs or Dunwoody, so the geography is the county |
| `sandy_springs_children_in_poverty_estimate` | Derived from ACS: 18.4% under 18, 8.5% overall poverty rate | Estimated children below the poverty line | Sandy Springs, GA | `count` with a range (1,600-2,000), `figure`; **derived** (removed) | **Removed; superseded by a published ACS value** (`sandy_springs_child_poverty_rate`, variable `S1701_C03_002E`, live 10.1% ±2.5) |
| Removed facts | Census poverty report (13.7%); CAC Meals for Kids (660+ families, replaced by the CSV's 2025 children served) | Share of children; families served | United States; Sandy Springs and Dunwoody | `percent`; `count` | No API for the Census report figure as entered; ACS 1-year U.S. child poverty (`S1701_C03_002E`, `for=us:1`) returned 15.5% on November 18, 2026 and could replace it |

KIDS COUNT is named in the notes as a REST API, but its access method and availability are unconfirmed. It is not in the seeded sources until confirmed.

### Financial Literacy & Tax Credits (`finances`)

| Statistic key | Source and retrieval | Measure | Geography | Unit, visual | Flags |
| --- | --- | --- | --- | --- | --- |
| `us_personal_saving_rate` | FRED, personal saving rate series | Personal saving as a share of disposable income | United States | `percent`, `trend` | **Defined and ingestion built.** Series `PSAVERT` (monthly, seasonally adjusted annual rate). Latest September 2026 = 3.8% |
| `us_consumer_loan_delinquency_rate` | FRED, delinquency rate on consumer loans series | Share of consumer loans that are delinquent | United States | `percent`, `trend` | **Defined and ingestion built.** Series `DRCLACBS` (quarterly, seasonally adjusted), labeled by quarter. Latest second quarter 2026 = 2.62% |
| `ga_cannot_cover_emergency` | FINRA NFCS State-by-State Survey (CSV), filtered to Georgia | Share unable to come up with an emergency amount | Georgia | `percent`, `meter` | File import. Question and response codes come from the codebook. Survey wave about every three years |
| Removed facts (no API) | Federal Reserve SHED (37%); IRS VITA limit; IRS EITC claim rate | Share; dollar limit; share | United States | `percent`, `usd` | Not APIs, so removed from the page. No API found for any of the three |

The GFLEC P-Fin 8 tool is interactive only (no data download documented) and is not planned. The notes call its value for CAC unclear.

## Rendering rules (proposed)

- The exact value, unit, geography, period, and source are always shown as text next to the visual.
- A `pictogram` or `meter` draws proportion `value / 100`. A pictogram fills the last icon fractionally instead of rounding to whole icons, so the metaphor never changes the scale. Example: 13.5% on 20 icons fills 2.7 icons.
- Ranges (`value_high`) are shown as a range, never as one point.
- Derived statistics say so and show the formula.
- Color is never the only encoding (see `design/ui-spec.md` section 9A).
- Required visual tests: 0%, 50%, 100%, a fractional value, a range, and a narrow screen.

## Verified candidates for new statistics (November 18, 2026)

Read-only checks against the live APIs made before the November 18 additions. Fourteen of these were then added to the database (see "Statistics added November 18, 2026" below); the rest remain candidates. Values are what the API returned at the time, for scoping. Live values change with each release, so the published values on the page, not this table, are the current ones.

**Census ACS 5-year, 2024, Sandy Springs (place 68516, state 13).** The existing Census module reads subject tables for a place, so each needs only a database row. Margin of error variable is the `M` twin of each `E` variable.

| Candidate | Variable | Returned | Topic it would serve |
| --- | --- | --- | --- |
| Households receiving SNAP (percent) | `S2201_C04_001E` (margin `S2201_C04_001M`) | 4.1% ±0.9 (2,093 households, `S2201_C03_001E`) | Food |
| Adults 25+ with high school or higher | `S1501_C02_014E` | 96.9% ±0.8 | Employment (the share without a diploma is derived: 3.1%) |
| Adults 25+ with a bachelor's or higher | `S1501_C02_015E` | 69.2% ±1.9 | Employment |
| Households with a computing device | `S2801_C02_002E` | 98.8% ±0.5 | Employment (computer skills) |
| Households with no computer | `S2801_C02_011E` | 1.2% ±0.5 | Employment (computer skills) |
| Broadband subscription, people with a computer | `S2802_C03_001E` | 96.0% ±1.1 | Employment |
| Unemployment rate, 16 and over | `S2301_C04_001E` | 4.0% ±0.8 | Employment |
| Median household income | `S1901_C01_012E` | $104,340 ±4,421 | Finances (a `usd` value, not a share) |
| Speak English less than "very well" (percent of non-English speakers) | `S1601_C06_003E` | 26.3% | Employment (English filter). Its base is language speakers, not all residents; `S1601_C05_003E` is a count (5,331), not a percent |

Caveat for the Sandy Springs figures: it is a well-educated, connected, higher-income city, so several values are high. They are accurate and useful for the contrast with CAC's clients, but they do not show hardship by themselves. A "no diploma" share or the SNAP share carries the learning point better than the bachelor's share.

**ACS 1-year, 2024, United States (`for=us:1`).** Poverty `S1701_C03_001E` 12.1% (±0.1), child poverty `S1701_C03_002E` 15.5%, renter cost burden `DP04_0141PE` + `DP04_0142PE` 9.4% + 42.3% (51.7% derived), SNAP households `S2201_C04_001E` 11.8%, bachelor's or higher `S1501_C02_015E` 36.8%. The Census module now accepts `us:1` and the ACS 1-year datasets and picks the newest release by itself; the 2025 release (in the live API by November 18, 2026) returned poverty 11.8%, child poverty 14.8% and renter cost burden 51.8%. SNAP households and bachelor's or higher for the U.S. are not defined as statistics.

**FRED, usable with the existing module (rows only):**

- Unemployment by education, monthly, seasonally adjusted, latest October 2026: `LNS14027659` less than high school 5.8%, `LNS14027660` high school graduates 3.8%, `LNS14027689` some college or associate 3.9%, `LNS14027662` bachelor's and higher 2.6%.
- Median usual weekly earnings by education, quarterly, latest July 2026: `LEU0252917300Q` high school graduates $993 and `LEU0252918500Q` bachelor's and higher $1,752 (`LEU0252916700Q` is less than high school; its value was not read). All workers 16+ is `LEU0252881500Q` ($1,232). Note `LEU0252881500` is the all-workers series, not an education series.
- Electricity CPI, U.S. city average, `CUUR0000SEHF01`, monthly, latest October 2026 (307.673, an index). Energy services CPI `CUUR0000SEHF` (298.282). Year-over-year change can use the existing transform. The Atlanta electricity and energy-services series stop at December 2024 and must not be used.
- Apparel CPI, Atlanta, `CUURA319SAA`, latest October 2026 (163.59). Like the Atlanta food series it has missing odd months, so the latest comparable month would be used. The U.S. apparel series ID I tried (`CUUR0000SAA`) does not exist; another ID would have to be found.

**Not found:** no API for food insecurity, energy insecurity, SHED, IRS VITA limit or EITC take-up (see `data-explorer.md`).

## Where page facts come from

As of November 18, 2026 the Explore page has no hand-entered facts. Fact cards are CAC outcome totals from `frontend/src/data/cac-outcomes.csv` (see `data-explorer.md`); every other figure is a published statistic from this catalog. The older `facts`, `supersededBy` and `live` content fields and the hand-entered zoom-out list were removed. A statistic that is not published is simply not shown, and the scenes that depend on one show a neutral state.

The rows marked "Removed facts (no API)" in the tables above describe figures that were removed because they have no API. They return only as API-backed statistics.

## Ingestion and publishing

**Built and locally verified (FRED, EIA, Census and Fulton County open data):** `supabase/functions/_shared/explorer-fred.mjs` (fetch, missing-value handling, year-over-year calculation), `explorer-eia.mjs` (Georgia residential retail electricity price), `explorer-census.mjs` (ACS 5-year subject tables and SAIPE), `explorer-socrata.mjs` (Fulton County monthly eviction filings), `explorer-refresh.mjs` (database runner for both providers), and the Edge Function `supabase/functions/refresh-explorer-statistics/index.ts`. Statistics with `source_reference.provider = "fred"` and a `transform` of `level` or `yoy_percent_change` need only a database row, not new code. Tests: `node --test supabase/functions/_shared/explorer-fred.test.mjs` `explorer-eia.test.mjs` and `explorer-census.test.mjs` and `explorer-socrata.test.mjs` (61 tests together, no network), plus `supabase/tests/explorer-fred-local.mjs` (real FRED API against the disposable local database) and `supabase/tests/explorer-eia-local.mjs` (simulated EIA responses in the real API's shape against the local database; phases 1 and 2, with a staff approval in between).

**Fulton eviction filings:** `fulton_eviction_filings` (Housing, `count`, `figure`) is read from the Socrata endpoint `https://sharefulton.fultoncountyga.gov/resource/cbu2-qs5w.json` with no key. The latest `YYYY-MM` row with a whole-number count is used; a missing or non-integer count is skipped, never read as zero; a malformed month, two different counts for the same month, an empty response, or a redirect is an error that records nothing. The host must be on an allowlist in `explorer-socrata.mjs`, and the dataset ID and field names are validated, so a statistic definition cannot point the refresh at another server. A live run on November 17, 2026 staged and, after approval, published 3,095 for October 2026. Limits: the county does not state when a month's count is final, so a month that is later revised is recorded as a new observation and auto-publishes; the figure is county-wide court filings, not completed evictions.

**Additional statistics (migration `20261117200000`):** `atl_unemployment_rate`, `us_food_at_home_price_change`, `us_personal_saving_rate`, `us_consumer_loan_delinquency_rate` (FRED; the last is quarterly, via the `frequency` binding), `sandy_springs_child_poverty_rate` and `sandy_springs_renter_cost_burden` (ACS). A live run on November 17, 2026 returned 3.5%, +1.8%, 3.8%, 2.62%, 10.1% and 44.7% respectively. Earnings and unemployment by education were later added from the matching FRED series (November 18, 2026), so no BLS module was needed.

**Census statistics:** four statistics are defined by `20261117180000_explorer_census_statistics.sql`: `sandy_springs_poverty_rate` and `sandy_springs_language_other_than_english` (Employment, ACS) and `fulton_child_poverty_rate` and `dekalb_child_poverty_rate` (Youth, SAIPE), all `percent` meters. The point estimate is the figure; the margin of error (ACS) or 90% interval (SAIPE) is written into the period label so it updates with each release. Release handling: the newest year is tried first; ACS answers 404 and SAIPE answers 204 for an unreleased year, and only those fall back to the previous year. A rejected key (redirect), a bad variable, a suppressed value (Census negative codes such as -666666666), or a wrong area name or code is an error that records nothing. As of November 17, 2026, 2024 is the latest release of both datasets. A live run through the shared runner staged and, after approval, published all six statistics from their real APIs.

**EIA statistic:** `ga_residential_electricity_price` (Housing, `cents_per_kwh`, `figure`) is defined by `20261117170000_explorer_electricity_statistic.sql`. It binds to `electricity/retail-sales`, field `price`, facets `stateid=GA` and `sectorid=RES`, monthly. Each row is checked against the requested facets and for the unit `cents per kilowatt-hour` before it is recorded; a null or non-positive price is treated as missing, never filled. The figure is a statewide average price per unit, not a household bill. A live dry run on November 17, 2026 with a locally registered key returned HTTP 200 and August 2026 at 15.9 cents per kWh, in the shape the code expects (string price, `price-units` of `cents per kilowatt-hour`, facets `GA`/`RES`). The hosted `EIA_API_KEY` secret was exercised by the hosted dry run on November 17, 2026 (see "Hosted deployment record").

**Statistics added November 18, 2026** (migration `20261118130000_explorer_education_local_and_us_statistics.sql`, source `census_acs1`): Sandy Springs SNAP households (Food), high school graduates, no computer and limited English (Employment); U.S. poverty rate (Employment), U.S. child poverty rate (Youth) and U.S. renter cost burden (Housing) from the ACS 1-year; U.S. unemployment by education (three FRED series) and median weekly earnings by education (three quarterly FRED series) (Employment); and the U.S. electricity price change (Housing). Live values on first publication: SNAP 4.1% ±0.9, high school graduates 96.9%, no computer 1.2%, limited English 26.3% ±3.4, U.S. poverty 11.8%, U.S. child poverty 14.8%, U.S. renter cost burden 51.8%; unemployment 5.8%, 3.8% and 2.6% (October 2026); weekly earnings $819, $993 and $1,752 (third quarter 2026). Two limits: the Employment topic now lists 13 statistics (a lot for one tab), and the three Sandy Springs education and computer figures describe a well-educated, connected city, so they are accurate but do not show hardship by themselves. Not defined: bachelor's or higher, broadband, median household income, and the other candidates above.

**Not done:** the file and manual imports (FINRA, Eviction Lab, static facts) do not exist. The Edge Function has no Deno test suite: no Deno runtime is installed locally, so its entry point was verified only by the hosted dry run and real run below, and the shared modules by `node --test`.

## Hosted deployment record

Project `cac-poverty-exercise` (`uucneyuspeqpygiucfvr`), November 17, 2026, applied with the Supabase MCP after explicit user approval. Everything was additive; no existing table, function, policy, secret or job was changed.

- **Migrations applied** (hosted names): `explorer_statistics`, `explorer_food_cpi_statistic`, `explorer_electricity_statistic`, `explorer_census_statistics`, `explorer_fulton_evictions_statistic`, `explorer_additional_statistics`, `explorer_refresh_token_check`. The first was checked against the disposable local database by comparing md5 fingerprints of every explorer function body, table definition, constraint, index, policy, trigger and privilege (62 items, identical), and the seeded categories, sources and statistics (6, 8 and 13 rows, identical). The hosted migration history uses hosted timestamps, not the repository's file prefixes.
- **Allow/deny checked at the hosted API:** anonymous callers get permission-denied on every explorer table (SELECT and INSERT) and on `record_explorer_observation`, `publish_explorer_observation`, `restore_explorer_observation` and `explorer_promote_observation`; they can call the two public read functions. A signed-in anonymous player session reads zero rows from the staff-only tables, cannot insert, gets "Staff authorization required" from publish, and cannot call `record_explorer_observation`. The security advisor shows no new ERROR or new warning type: the new warnings are the intentionally public read functions, the staff-checked publish/restore functions, and staff-only table policies, matching the pattern of existing tables.
- **Edge Function** `refresh-explorer-statistics` (`verify_jwt` off; it authenticates callers itself). A call with no token, a wrong token, or the publishable key returns 401; GET returns 405.
- **Refresh token:** generated inside the database and stored only in Vault as `explorer_refresh_token` (64 hex characters). The function checks it through `public.explorer_refresh_token_valid`, which compares SHA-256 digests and is executable only by the service role. The token was never displayed, logged or committed, and no function secret named `EXPLORER_REFRESH_TOKEN` exists or is needed. To rotate it, replace the Vault secret.
- **Dry run:** all 13 statistics fetched live with the hosted `FRED_API_KEY`, `EIA_API_KEY` and `CENSUS_API_KEY` and recorded nothing. **Real run:** all 13 first values staged (for example Sandy Springs poverty 8.5%, margin of error ±1.2; Fulton eviction filings 3,095 for October 2026). No observation is published, so the public read functions still return no statistic.
- **Schedule:** pg_cron job `refresh-explorer-statistics-monthly`, `0 6 2 * *` (06:00 UTC on the 2nd), posting to the function with the Vault token. It is separate from `refresh-scenario-prices-monthly` (`0 6 26 * *`), which was not touched. The time is a proposal; change it with `cron.alter_job`.
- **Not part of this step:** releasing the frontend page through the normal Cloudflare Pages flow (the page code is not committed or deployed).

**November 18, 2026 deployment** (applied with the Supabase MCP after the user's explicit approval, one migration at a time):

- **Migrations applied** (hosted names): `explorer_automatic_publication` (redefines `record_explorer_observation`; grants unchanged, service role only) and `explorer_education_local_and_us_statistics` (the `census_acs1` source and 14 statistic definitions). The definitions match the local database exactly (27 rows, identical md5 of every column).
- **Edge Function** `refresh-explorer-statistics` redeployed as version 3 (`verify_jwt` off), with the Census module that accepts ACS 1-year and `us:1`.
- **Refresh run through the cron job's own call** (Vault token, never displayed): HTTP 200, 27 of 27 statistics fetched and published, no errors. This also promoted the 13 values that had been staged since November 17. Afterwards the database held 27 observations (one per statistic), 27 published, 0 staged, and none published by a person (`published_by` NULL).
- **Second run:** HTTP 200, all 27 checked (`last_checked_at` updated), and no row was added, because the source had nothing newer and the value was kept.
- **Allow/deny checked at the hosted API.** Anonymous callers can use the two public read functions (six categories; Housing 5, Food 3, Employment 13, Youth 4, Finances 2 and Clothing 0 statistics (Finances rechecked through the public read function on November 18, 2026)). Direct reads of the three explorer tables, `record_explorer_observation`, and the Edge Function with no token or a wrong token are all denied. A signed-in anonymous player session cannot call `record_explorer_observation` (403), gets "Staff authorization required" from `publish_explorer_observation`, and reads zero rows from the observations table. The public response carries no status, source binding, or published-by field.
- **Cron:** `refresh-explorer-statistics-monthly` unchanged (`0 6 2 * *`); `refresh-scenario-prices-monthly` was not touched.
- **Security advisor:** no ERROR. The warnings follow the same pattern as before (the intentionally public read functions, staff-checked functions, and anonymous-reachable policies on staff-only tables), plus findings on unrelated objects.

**Secrets** (Supabase Dashboard, Edge Functions, Secrets; local copies in the Git-ignored `supabase/functions/.env`):

| Secret | Purpose |
| --- | --- |
| `FRED_API_KEY` | FRED access. Set in the hosted project and exercised by the hosted dry and real runs. A local key is in `supabase/functions/.env` |
| `EIA_API_KEY` | Set in the hosted project for the game-data refresh (per `docs/supabase-game-data-setup.md` on the `feature/monthly-game-data-refresh` branch). The explorer function reads the same secret by name at run time and was exercised by the hosted runs. Supabase does not let anyone read a stored secret value back, so a local copy for testing comes from the person who registered the key or a fresh EIA registration |
| `CENSUS_API_KEY` | Used by the game-data refresh; the explorer function reads the same secret by name and was exercised by the hosted runs. Census keys must be activated from the signup email before the ACS endpoints accept them |
| Vault `explorer_refresh_token` | Not a function secret. Generated in the database; authenticates the scheduled call (see above) |

- Fetches run server-side only; FRED, Census, and EIA keys never reach the browser (`docs/security.md`).
- Ingestion calls `record_explorer_observation` (service role only). Each call writes an immutable observation, updates `last_checked_at`, and is idempotent per statistic, period, and `revision_key`. An invalid or failed value rolls back, so the last published value stays and no check is recorded.
- Publication rule (no staff approval, per the November 17 and November 18, 2026 decisions; migration `20261118120000_explorer_automatic_publication.sql`):
  - The first value of a statistic publishes immediately.
  - A value identical to one already recorded (same statistic, period and revision) changes nothing, so when the source has nothing new the published value is kept.
  - A value for a newer period, or a revision of the same period, publishes immediately and supersedes the current one.
  - A value for an older period than the published one stays `staged` and never replaces the page value.
  - Automatic publications have no `published_by`. Every check updates `last_checked_at`.
- `publish_explorer_observation` and `restore_explorer_observation` remain staff tools for rolling back a value; routine operation does not use them. Choosing which statistics exist, and their formulas and variables, is development work in a migration.
- Cadence: the monthly cron job runs on the 2nd at 06:00 UTC. A source that publishes less often (annual ACS, quarterly earnings) simply returns the same value until its next release, and the page keeps showing it.

## Open decisions

1. CAC approval of category descriptions and icons. The seeded descriptions are the existing page copy, and icon keys are proposed identifiers.
2. Resolved November 17 and 18, 2026: statistics publish automatically and refresh monthly with no staff approval. `docs/api.md` still contains older text saying staff approval is required for the monthly maintenance check; that text conflicts with this decision and the November 7 decision in `docs/scenarios.md` and should be reconciled by the team.
3. Allowed units and geography vocabulary (data-model item C7). The schema's unit list is a proposal.
4. How CAC supplies clothing, assistance, and Meals for Kids figures.
5. Whether staff editing of explorer statistics belongs in the Feature 4 dashboard, which is currently read-only.
