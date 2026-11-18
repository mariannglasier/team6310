# Explore Data page — phase 1 notes

Staff and developer reference for the public Explore Data page (`/data`). The player-facing behavior is specified in `design/ui-spec.md` section 9A.

## Status

- Implemented: the UI in `frontend/src/pages/public/data/` (six topic explorers on a topic path, shared frame, CAC scoreboard, paged live statistics, collapsed zoom-out section), the `/data` route, and tests (`cacOutcomes.test.ts`, `cacFacts.test.ts`, `dataExplorerLogic.test.ts`, `DataExplorerPage.test.tsx`, `useZoomOutStatistics.test.tsx`, `e2e/data-explorer.spec.ts`).
- **Where facts come from (decided November 18, 2026).** The page shows exactly two kinds of facts and nothing else: CAC's own yearly outcome totals, read from `frontend/src/data/cac-outcomes.csv`, and published statistics read from official APIs through the database. No fact is hand-entered. A figure with no API behind it is not shown (see "Facts with no API yet").
- The page reads published statistics through the two public RPCs only (`get_explorer_categories`, `get_explorer_category_statistics`). Statistics need no staff approval: the monthly refresh publishes each value automatically (see the catalog). Until a statistic has a published value, no live card appears and the scenes that depend on one show a neutral "no published statistic" state instead of a number. As of November 18, 2026 all 27 defined statistics are published on the hosted project; the page code that shows them is not yet released.
- Sample content (the grocery basket's item prices and the clothing rail) is illustrative and none of it feeds the simulation. The page shows no "interactive scene" or "illustrative sample" caption on scenes (removed November 18, 2026 at the user's request); this limitation is recorded here instead.

## CAC outcome facts

`frontend/src/data/cac-outcomes.csv` is a long-format copy of `2025 Outcomes.xlsx` (66 rows, header `key,program,group,metric,year,value,unit`). One row per workbook line, keyed `<program>.<metric>` in snake case. A later admin section will replace the file; a new year is added as more rows with the new `year`, and the page shows the newest year per key. Rules:

- The loader (`cacOutcomes.ts`) validates the header, column count, key format, four-digit year, non-negative numeric value, unit (`Number`, `Dollars`, `Pounds`) and rejects duplicate key and year. A file that fails validation shows no CAC facts and logs an error; it never shows partial or guessed data.
- The workbook has no unit for dollar rows (it uses currency formatting), so those are recorded as `Dollars`. Two typos were corrected ("Punds" to "Pounds", "Valuie" to "Value"). Values are rounded to six decimals. Every value was compared with the workbook.
- `cacFacts.ts` chooses which rows each topic shows and the wording after the figure. The wording is a literal reading of the workbook row and needs CAC confirmation.
- Not used because the workbook does not make the meaning clear: "Coats for Kids # clients goal" (goal or actual), "Sales (+taxes)", the volunteer averages, and "Returns" (503) beside "Federal returns prepared" (590). The workbook states no geography or fiscal-year definition, so cards say "CAC clients" and the year.

| Topic | CAC rows shown |
| --- | --- |
| Housing | Evictions prevented (households), people keeping a roof (individuals), financial assistance amount paid |
| Food | Households, Mini-Market visits, pounds of food provided, meals provided |
| Employment | Adult education unduplicated students, ESOL, computers; Empowerment Center job placement |
| Clothing | Households (unduplicated), individuals, thrift credit |
| Youth | Meals for Kids, School Supply, Teacher's Closet children; Hope for the Holidays individuals |
| Finances | VITA federal returns prepared, federal refunds, combined credits, Earned Income Credit |

The Youth scene's summer support line also reads the Meals for Kids row.

## Facts with no API yet

These figures were on the earlier hand-entered page and were removed because no API backs them. They return only as API-backed statistics. Some were replaced on November 18, 2026 (see the right-hand column).

| Former fact | Why it is removed | What could replace it |
| --- | --- | --- |
| U.S. cost-burdened renters (JCHS) | JCHS publishes reports and files, no API | The Sandy Springs renter cost burden (ACS, built) covers the Housing windows. Replaced November 18, 2026 by `us_renter_cost_burden` (ACS 1-year, whole U.S.) |
| Energy-insecure households (EIA RECS) | RECS is a survey file, not in the EIA API | None found. The Housing Utilities view is unmarked until an energy-cost share exists |
| Food-insecure households (USDA ERS) | ERS publishes downloads, no API | None found |
| "1 in 6 children may face hunger" (Atlanta Community Food Bank) | Report figure, no API, no stated year | None found. The Youth bus now marks riders from the published Sandy Springs child poverty share |
| Earnings and unemployment by education (BLS Education Pays) | The published page has no API | BLS and FRED expose the underlying series (for example FRED `LNS14027659`, `LNS14027660`, `LNS14027689`, `LNS14027662` unemployment by education (monthly, seasonally adjusted, latest October 2026); FRED `LEU0252916700Q`, `LEU0252917300Q` and `LEU0252918500Q` median usual weekly earnings (less than high school, high school graduates, bachelor's and higher)). Replaced November 18, 2026 by `us_unemployment_*` and `us_weekly_earnings_*` (three education levels each; "some college" is not defined) |
| U.S. poverty rate and U.S. child poverty (Census report) | Hand-entered | Replaced November 18, 2026 by `us_poverty_rate` and `us_child_poverty_rate` (ACS 1-year, whole U.S.) |
| 37% cannot cover a $400 emergency (Federal Reserve SHED) | SHED is a downloadable survey, no API | None found; FINRA NFCS is a CSV, not an API |
| $67,000 VITA income limit; EITC non-claim rate (IRS) | IRS web pages, no API | None found |
| Derived Sandy Springs child estimate (1,600-2,000) | Hand-derived | Superseded by the published ACS share |

## Illustrative content (not source data)

- Grocery cart: eight items totaling $500, a round budget with prices chosen to total it. The price slider starts at last year's prices; its presets come only from published price changes. The earlier "+6.8% (example)" preset and the fixed U.S. 2022 and 2023 presets were removed.
- Job board: 12 generic postings with education, English, and computer-skill requirements. It is not the simulation's approved job catalog and does not estimate real labor-market shares.
- Budget workbench: $2,000 income, $1,850 essentials, an emergency slider, and $25 allocation steps, following the mockup's values.
- Housing windows relight half of the dark windows in CAC mode and the school bus equalizes all riders; these show support at work, not measured CAC outcomes.
- Clothing belt: generic garment scenarios by moment; no garment counts are claimed. The narrative lines on each moment (for example "After a move or an emergency, families may leave with only what they can carry.") are copy, not data, and still need team review.

## Scenes and the published statistics they use

- Housing windows: `sandy_springs_renter_cost_burden`, 20 windows, rounded to the nearest window, with the exact value, place and period beside it. Without a published share the windows are grey and unmarked. The Utilities view has no statistic and is always unmarked.
- Youth bus: `sandy_springs_child_poverty_rate`, 18 riders, rounded to the nearest rider, exact value beside it; no published share means no riders are marked.
- Food presets: `us_food_at_home_price_change` and `atl_food_beverage_cpi_change`, only when a rise between 0.1% and 15.0%.
- Zoom out: poverty at different scales: Sandy Springs poverty, U.S. poverty, and child poverty for Sandy Springs, Fulton, DeKalb and the U.S., each as its own labeled card (`zoomOutStatistics` in `dataExplorerContent.ts`). The section is a collapsed disclosure and is hidden when none is published.

## Scenes tied to statistics (November 18, 2026, User Story 16)

Interactions now exist only to teach a published number (see `design/ui-spec.md` 9A). Housing and Youth compare places on the same icons; Food applies only published price changes to a sample basket; Employment pairs published unemployment and weekly earnings by education; Finances draws the published saving and loan delinquency rates as 100 icons. The job board, item-removal grocery cart, season toggles, budget workbench and tax checklist were removed. The grocery basket's item prices and the Clothing rail remain illustrative samples. Clothing has no published statistic; the planned apparel price change needs a new FRED series and a hosted migration, which have not been requested or applied. Published counts verified through the public read function on November 18, 2026: Housing 5, Food 3, Employment 13, Youth 4, Finances 2, Clothing 0.

## Layout simplification (November 18, 2026)

In response to feedback that the page was wordy and boxy, the intro paragraphs and fact cards were removed. Topics are chosen on an icon path with a `Next` button and visited checks; the view toggle slides between modes; the control rail speaks through a status bubble; the numbers behind the scene appear one set at a time (community data or CAC outcomes), three statistics per page; explanatory text moved into disclosures. The background image, scenes, data rules and sources are unchanged. Food price chips are shortened (for example `+1.8% · U.S. groceries`) and show the full place and period once chosen.

## Phase 2 database foundation (November 17, 2026)

- Added `supabase/migrations/20261117150000_explorer_statistics.sql` and `supabase/tests/explorer-statistics.sql`: separate explorer tables, published-only public read functions, and staff-only publish and restore. Verified on a disposable local database, then applied to the hosted project on November 17, 2026 (see the catalog's hosted deployment record). The page code that reads these functions is not yet released, and no value is published.
- The proposed statistics, their sources, and verification flags are in [explorer-statistics-catalog.md](explorer-statistics-catalog.md). Schema details are in `data-model.md`.
- Decisions: keep the tab layout (add icon and description to the tabs), store explorer statistics separately (this resolves open decision 1 below), and defer simulation-player data.
- Statistics publish and refresh without staff approval (decided November 17 and 18, 2026). `record_explorer_observation` publishes a first value at once, keeps the published value when the source returns the same value, replaces it when the source returns a newer one, and leaves a value for an older period staged. Ingestion for FRED, EIA, Census and Fulton County open data exists; the `refresh-explorer-statistics` Edge Function is deployed and scheduled monthly (the 2nd at 06:00 UTC), and all 27 statistics were published on November 18, 2026 (see the catalog's deployment record). The page never falls back to hand-entered facts (see Status).

## Later phase: API connections

The notes list candidate sources. Each fact must keep source, units, geography, and period (see `docs/api.md`). A new statistic is added with a migration, after its series or variables are checked against the live API.

| Topic | Candidate source | Possible use |
| --- | --- | --- |
| Housing | Eviction Lab data files (CSV, no API); Fulton County open-data eviction filings; EIA electricity retail price API | Share of windows; a seasonal utility view |
| Food | FRED series `CUURA319SAF` (Atlanta food and beverage CPI) | Slider presets (built) |
| Employment | FRED `ATLA013URN`; Census ACS 5-year (Sandy Springs place 1368516); O*NET knowledge and education data | Language and education shares; requirement filters for the job board |
| Clothing | CAC records (no outside source found) | Garment totals on the belt |
| Youth | Census SAIPE; KIDS COUNT Data Center API | Children in poverty; free and reduced-price lunch eligibility |
| Finances | FRED savings and delinquency series; FINRA NFCS CSV for Georgia; GFLEC P-Fin | Cushion and literacy comparisons |

Open decisions for the team:

1. Resolved: explorer statistics are stored in separate tables and publish automatically with no approval (November 17 and 18, 2026).
2. Whether the sample job board stays illustrative or later reads the approved job catalog.
3. CAC outcome figures now come from the CSV above. Open: CAC's confirmation of each label, the geography and fiscal year, the meaning of the Coats for Kids row, and the staff admin section that will replace the file (yearly entry, validation, audit).
4. Whether any sample budget value should be tied to a sourced cost.
5. The notes also describe a seasonal utility price bar and a scroll-linked clothing animation. The first version uses a winter/summer toggle and a timed, pausable belt instead.
