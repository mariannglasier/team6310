# Facts fixes part 2 — implementation record

Source: user-supplied facts fixes part 2.pdf, approved November 16, 2026. The following changes are in authored documentation, the compiled catalog, bundled refresh content and prepared edition SQL. Hosted edition 3 is published and the refresh function is active following reauthentication on November 16, 2026.

| Cards | Implemented change |
| --- | --- |
| D031, D037, D038, D041, D057, D060 | Retired without replacement. Together with part 1, nine retired IDs leave 51 cards. Historical editions remain intact. |
| D032, D034, D035, D036, D042, D044, D045, D050, D052, D053 | Retained prices remain bound to monthly sources. |
| D033 | Household small kitchen appliance; same model $80, cheaper $50, free Canopy stock check; appliance energy-efficiency fact and CAC credits fact. No employment restriction. |
| D034 | Added Canopy household essentials fact. |
| D035 | Replace all of the items. |
| D036 | Buy all your planned items / Buy just the items needed for now. |
| D039 | School soccer activity, $150 or do not participate; participation-barrier fact. All-items CPI replaces the former school-trip price category. |
| D040 | Adult coat, $60 replacement / $25 repair / free Canopy option; apparel CPI and supported cold-weather safety fact. |
| D042 | Buy only some of the items. |
| D043 | Child in your family birthday wording; retained Canopy gift option. |
| D044 | Household appointment across town wording. |
| D045 | Child coat and clothing insecurity fact. |
| D046 | Added free CAC Mini-Market lunch ingredients and relevant fact. |
| D048 | Meals during school closure; child hunger fact. |
| D051 | Added free CAC Adult Education choice and 610-student 2025 fact; training cost/time context. |
| D053 | Family traditions wording; planned holiday meal / smaller holiday meal. |

New CAC choices have zero balance effect and require CAC-enabled mode. Canopy stock checking does not promise that an item is available. Education choices do not automatically invent new wages or credentials. The November 17 correction restores the user's supplied coat fact and other authored passages; see [the correction record](authored-fact-and-bill-corrections.md).

Prices use the original October 2026 baseline and latest validated category observation; they do not compound on each refresh. Source failures block publication. CAC figures retain their 2025 reporting year until an approved annual report replaces them.

See [all prices and both facts](scenario-price-and-fact-inventory.html), [source bindings](scenario-source-bindings.md), and [Supabase keys and installation steps](supabase-game-data-setup.md).

Validation: 459 frontend tests passed (2 opt-in skips), 10 compiler/source tests passed, frontend formatting/lint/type checks and production build passed, and Edge Function type checking passed. The generated inventory showed all 51 scenarios without horizontal overflow at a 390px viewport. Hosted migrations and publication passed. All four households completed transactional database walkthroughs through Day 30 in both CAC modes. Authorization, source publication retries, published-price immutability and the upfront-fee guard passed. The deployed endpoint rejected an unauthenticated POST with HTTP 401. Live provider refresh and a full browser gameplay walkthrough remain pending.


The published baseline uses version ID `495d0b51-e061-4233-4bb1-1237804140a4`. API credential setup and monthly scheduling remain in the setup guide. Initial publication testing exposed a missing composite VITA fact identifier and an ambiguous JSON-column reference in the refresh publisher. Both were corrected and verified before completion. The existing route test assumed at least 20 ordinary answers. The source-edition test instead verifies Day 30 completion, exactly one tax event and committed answers, alongside separate bill days and income events. All eight fixture runs and test identities were rolled back.


API-only correction, November 16, 2026. Removed every HTML request and school/MARTA/IRS/caregiving page parser from the refresh adapter. School meals and transit now use BLS all-items CPI. Historical IRS and caregiving observations retain their reporting years. Dedicated rent, electricity, Census and PolicyEngine API adapters continue to supply their supported values. Tests enforce the API hostname list and verify inflation-adjusted school/transit amounts. The GitHub wage importer uses the BLS API. Both November 1 runs skipped their importer because of the midnight-only guard, so the local workflow now has one UTC schedule and no execution-hour guard. The workflow change requires merging into the default branch.


November 17 fixed-tax revision removes PolicyEngine. The user selected a $989 base. The implemented recommendation gives Jordan and Maya $1989, including a chosen $1000 child-household supplement. These authored amounts are stored per household. The paid preparation fee retains its CPI update. The live monthly refresh successfully published edition 5 and reused all six ZIP caches.


Latest November 17 policy supersedes fixed tax credits and blocked-on-source-failure publication. Tax-credit baselines now follow BLS all-items CPI. Wages automatically publish through the monthly Supabase refresh. Each failed component retains its previous published amount and last-successful verification date. The local individual/group pages display these details under Last updated. Live edition 6 published successfully, with all eight wage observations verified and all six rent caches reused.
