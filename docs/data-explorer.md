# Explore Data page — phase 1 notes

Staff and developer reference for the public Explore Data page (`/data`). The player-facing behavior is specified in `design/ui-spec.md` section 9A.

## Status

- Implemented: the static UI in `frontend/src/pages/public/data/` (six topic explorers, shared frame, fact cards, zoom-out section), the `/data` route, and tests (`dataExplorerLogic.test.ts`, `DataExplorerPage.test.tsx`, `e2e/data-explorer.spec.ts`).
- Not implemented: any API, database, cache, or Supabase access. The page calls no external source and stores nothing.
- Content is hand-entered in `dataExplorerContent.ts` (facts, sources, copy) and `dataExplorerLogic.ts` (sample cart, job board, budget). Nothing here is approved scenario or persona data, and none of it feeds the simulation.

## Facts shown, and what still needs review

Every fact lists value, measure, geography, period, and source so a later phase can swap in source-backed values. The team has not yet verified these figures against the cited pages; check each before release.

| Topic | Fact | Geography, period | Origin | Review note |
| --- | --- | --- | --- | --- |
| Housing | 22.4 million cost-burdened renter households (about half) | U.S., 2022 | Harvard JCHS, America's Rental Housing 2024 | Entered from memory; confirm figure and the "about half" wording |
| Housing | 34% of households faced a challenge paying energy bills or keeping a safe temperature | U.S., 2020 | EIA RECS 2020 | Entered from memory; confirm definition of energy insecurity |
| Housing | Fulton County eviction filings are published monthly | Fulton County, GA | Team research notes (PDF) | No value shown; pointer only |
| Food | 13.5% food-insecure households | U.S., 2023 | USDA ERS (already in the Figma prototype) | Carried over from the prototype |
| Food | Grocery prices +11.4% (2022), +5.0% (2023) | U.S. | USDA ERS Food Price Outlook | Entered from memory; confirm series and annual-average basis. Also drives the slider presets |
| Food | 1 in 6 children in metro Atlanta may face hunger tonight | Metro Atlanta | Team research notes citing the Atlanta Community Food Bank | Reporting year not stated; shown as "to be confirmed" |
| Employment | 20.1% speak a language other than English at home | Sandy Springs | Team research notes citing ACS | Table and 5-year period not stated |
| Employment | Median weekly earnings $899 (high school) vs. $1,493 (bachelor's); unemployment 3.9% vs. 2.2% | U.S., 2023 | BLS Education Pays | Entered from memory; confirm |
| Clothing | No figures | Sandy Springs and Dunwoody | None | The notes found no outside clothing data. A "Coming soon" card holds the place for CAC-approved totals |
| Youth | 660+ families receive summer meals through Meals for Kids | Sandy Springs and Dunwoody | Team research notes (CAC) | Year not stated |
| Youth | 13.7% of children under 18 below the poverty line | U.S., 2023 | Census, Poverty in the United States: 2023 | Entered from memory; confirm |
| Youth | 1,600–2,000 children estimated below the poverty line | Sandy Springs | Derived in the research notes from ACS (18.4% under 18, 8.5% overall poverty rate) | Derived estimate, not a published count; label kept as "derived" |
| Finances | 37% would not cover a $400 emergency using only cash or equivalent | U.S., 2023 | Federal Reserve SHED (already in the Figma prototype) | Carried over from the prototype |
| Finances | $67,000 general VITA income limit | U.S., 2025 filing season | IRS VITA page | Entered from memory; the limit changes yearly |
| Finances | About 1 in 5 eligible workers do not claim the EITC | U.S. | IRS EITC page | Entered from memory; confirm wording and period |
| Zoom out | Poverty rates: Sandy Springs 8.5% (ACS), U.S. 11.1% and U.S. children 13.7% (Census, 2023) | As labeled | ACS notes and Census | Confirm; the first is from the research notes |

Facts already carried over from the Figma prototype, or from the research notes, are not newly verified by this work.

## Illustrative content (not source data)

- Grocery cart: eight items totaling $500, with prices chosen to total the $500 budget the team's notes describe. The +6.8% preset reproduces the notes' $500 to $534 example.
- Job board: 12 generic postings with education, English, and computer-skill requirements. It is not the simulation's approved job catalog and does not estimate real labor-market shares.
- Budget workbench: $2,000 income, $1,850 essentials, an emergency slider, and $25 allocation steps, following the mockup's values.
- Housing windows relight half of the dark windows in CAC mode and the school bus equalizes all riders; these show support at work, not measured CAC outcomes. No CAC outcome numbers are shown beyond the 660+ families in the notes.
- Clothing: no garment counts are claimed.

## Later phase: API connections

The notes list candidate sources. Each needs team approval of the exact variables before connecting, and each fact must keep source, units, geography, and period (see `docs/api.md`).

| Topic | Candidate source | Possible use |
| --- | --- | --- |
| Housing | Eviction Lab data files (CSV, no API); Fulton County open-data eviction filings; EIA electricity retail price API | Share of windows; a seasonal utility view |
| Food | FRED series `CUURA319SAF` (Atlanta food and beverage CPI) | Replace the slider presets with the real local series |
| Employment | FRED `ATLA013URN`; Census ACS 5-year (Sandy Springs place 1368516); O*NET knowledge and education data | Language and education shares; requirement filters for the job board |
| Clothing | CAC records (no outside source found) | Garment totals on the belt |
| Youth | Census SAIPE; KIDS COUNT Data Center API | Children in poverty; free and reduced-price lunch eligibility |
| Finances | FRED savings and delinquency series; FINRA NFCS CSV for Georgia; GFLEC P-Fin | Cushion and literacy comparisons |

Open decisions for the team:

1. Where the explorer's statistics are stored (the existing `statistics` entity or a separate cache), and who approves them. `docs/api.md` describes the visualization cache as separate from simulation configuration.
2. Whether the sample job board stays illustrative or later reads the approved job catalog.
3. How CAC outcome figures are supplied and approved (clothing totals, assistance counts) so the CAC views can show real numbers.
4. Whether any sample budget value should be tied to a sourced cost.
5. The notes also describe a seasonal utility price bar and a scroll-linked clothing animation. The first version uses a winter/summer toggle and a timed, pausable belt instead.
