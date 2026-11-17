> **Current monthly behavior — November 17, 2026.** Tax credits now follow general CPI. Wages are fetched and published automatically with the monthly edition. When a source fails, the new edition carries forward each affected prior value and retains its earlier verification date. The Last updated panel shows this status.

# Scenario data connections and Supabase setup

The published fact audit on November 17 found no index terminology in player-facing fact text. All 17 remaining index-worded source templates, plus the phone-price template, now use plain price language with higher/lower direction. Tests cover both directions and reject index terminology in general fact templates. The current 51 logical cards have 25 general fact passages and 26 context-only general passages. There are 33 CAC fact passages, leaving 18 cards without a CAC fact. Context passages preserve useful prose when a numerical observation is unresolved. Historical CAC figures retain their reporting year. The searchable inventory has been regenerated with the plain-language templates.

The November 17 refresh successfully published edition 6 with version ID `f755edde-3679-4c5b-ba7f-0867ecd85d2d`. It contains the approved 51-card catalog, six-ZIP weighted rents, refreshed prices and CPI-adjusted simulation tax credits. Start a new game to use this edition.

## Tax scenario baselines

| Household | October 2026 baseline credit, USD |
| --- | --- |
| Alex | 989 |
| Sofia | 989 |
| Patricia | 989 |
| Jordan and Maya | 1989 |

The user selected a $989 base and asked whether Jordan’s household should receive more. The implemented recommendation is a $1000 supplement for Jordan and Maya. This is a game-design assumption. Each household credit updates through BLS all-items CPI using the original October 2026 baseline. The calculation uses the baseline amount times latest index divided by baseline index. The tax-preparation fee starts at $250 and updates using BLS CPI. Paid preparation requires the fee upfront and commits the credit minus the fee once. CAC VITA preparation charges no fee and credits the household amount once.

PolicyEngine is removed from the refresh, runtime configuration and example secrets. Its credentials are no longer required. The tax copy says “Your tax credit” and the household receives the edition-pinned inflation-adjusted amount. The applied response-copy migration is [20261117053718_fixed_tax_credit_copy.sql](../supabase/migrations/20261117053718_fixed_tax_credit_copy.sql).

Real EITC eligibility and amounts depend on earned income, filing status and qualifying children. A qualifying child can substantially increase the available credit. The chosen game amounts are authored values. See [IRS EITC guidance](https://www.irs.gov/taxtopics/tc601).

Treasury Fiscal Data can supply national tax-refund statistics for an educational fact. CPI-adjusted simulation credits use the existing BLS API. Historical IRS and CAC facts retain their original reporting years. Treasury’s aggregate refund data is described in [Daily Treasury Statement](https://fiscaldata.treasury.gov/datasets/daily-treasury-statement/).

## Provider secrets

Provider credentials belong in Supabase Dashboard → Edge Functions → Secrets. The example is [functions/.env.example](../supabase/functions/.env.example).

| Secret | Purpose | Registration or reference |
| --- | --- | --- |
| BLS_API_KEY | Registered access to the BLS JSON API for CPI. Small unregistered requests are also supported. | [BLS](https://data.bls.gov/registrationEngine/) |
| EIA_API_KEY | Georgia residential electricity data. Live retrieval passed. | [EIA](https://www.eia.gov/opendata/register.php) |
| RENTCAST_API_KEY | Six approved ZIP market requests monthly. Live retrieval passed. | [RentCast](https://app.rentcast.io/) |
| CENSUS_API_KEY | Optional Census access for supported ACS facts. Missing facts retain context. | [Census](https://api.census.gov/data/key_signup.html) |
| GAME_DATA_REFRESH_TOKEN | Optional separate token for manual calls. The installed cron uses its Vault token. | A private random token of at least 32 characters |

Supabase supplies SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the function. The browser uses its existing publishable key. The refresh calls JSON APIs only. School meals and transit use BLS all-items CPI; category prices fall back to all-items CPI when category observations are unavailable. CPI calculations use the original October 2026 baseline. Website links document sources, registration or API usage.

## Monthly operation

The active Supabase cron job is `refresh-scenario-prices-monthly`, scheduled at `0 6 26 * *` UTC. It posts `{"dryRun":false}` to the deployed refresh-game-data function. The private Vault token is validated through the service-only verify_game_data_refresh_token RPC. The token is generated and held inside Vault. The schedule was installed by [20261117011151_schedule_game_data_refresh.sql](../supabase/migrations/20261117011151_schedule_game_data_refresh.sql).

RentCast is limited to one attempted request per approved ZIP per UTC month, up to six requests total. The approved ZIPs are 30327, 30328, 30338, 30342, 30346 and 30350. The atomic claim and private response cache use rentcast_monthly_zip_cache. Retries and dry runs reuse cached ZIP responses. Failed attempts consume that ZIP’s allowance. The user approved the initial setup requests separately from the prior single-ZIP tests.

The validated monthly result publishes an immutable edition. Repeated published-month calls return that edition. Active runs retain their original edition. A full live call has now passed, including publication. Real provider retrieval returned 38 CPI series, EIA electricity data and all six RentCast markets. The optional Census fact request was unavailable and retained existing context.

Private status can be inspected in the SQL editor.

```sql
select period,status,published_version,result->'errors' as errors
from public.game_data_refresh_runs order by period desc;
select period,zip_code,attempted_at,cache is not null as cached
from public.rentcast_monthly_zip_cache order by period desc,zip_code;
```

For a private manual test, POST `{"dryRun":true}` with x-refresh-token. A dry run can be ready with carried-forward values. A ready dry run can be published with `{"dryRun":false}`. Published months return the existing edition. New API credentials are only necessary when a provider rejects an existing credential or access changes.

## Job wages

The existing GitHub workflow calls the BLS OEWS API monthly for the latest annual Atlanta wage release and stages changed jobs in a draft. Both November 1 runs skipped the importer because delayed execution missed its midnight guard. The local workflow correction uses one UTC schedule and removes that execution-hour guard. That correction takes effect when merged into the default branch. The deployed Supabase monthly refresh fetches the same BLS OEWS series directly and automatically publishes validated wages. It updates wage amounts, release year, source URL and last-successful-sync time while preserving job requirements and approval flags. The GitHub importer remains available for manual diagnostics.

## Verification

Fifteen source/compiler tests, 461 frontend tests (two opt-in skips), frontend lint/type checks, formatting and production build passed. The Edge Function type check passed. The published-edition database smoke test covers all four households in both CAC modes through Day 30. Tests also cover source units, CPI fallback, weighted rents, fixed household credits, duplicate ZIP claims, publication retries, access denial and published-price immutability. Four desktop/mobile browser cases passed, including opening Last updated and showing carried-forward verification dates. The Windows browser runner required interruption during server shutdown after the cases finished. Browser data was mocked; all eight transactional database gameplay routes also passed against the new hosted edition.

## Six-ZIP rent publication on November 17

The user approved six ZIP codes and a listing-weighted average. The previous 30328 cache held rent amounts without listing counts, so this approved setup fetched six complete responses, including a fresh 30328 response. All six succeeded. Each is stored in the private `rentcast_monthly_zip_cache` table under the November period. Future monthly runs can make at most one attempt per approved ZIP, up to six requests in total. Failed attempts count. Subsequent dry runs and retries reuse each cached response. The previous single-ZIP request history remains historical.

The applied migration is [20261117052333_rentcast_zip_cache.sql](../supabase/migrations/20261117052333_rentcast_zip_cache.sql). Per-ZIP duplicate-claim, unsupported-ZIP and player-denial checks passed. Twelve compiler/provider tests and the Edge Function type check passed. The published edition passed all eight database walkthroughs through Day 30.

| ZIP | One-bedroom average | One-bedroom listings | Two-bedroom average | Two-bedroom listings |
| --- | --- | --- | --- | --- |
| 30327 | 1712 | 45 | 1959 | 72 |
| 30328 | 1694 | 325 | 2067 | 269 |
| 30338 | 1526 | 132 | 1877 | 144 |
| 30342 | 1660 | 199 | 2016 | 145 |
| 30346 | 1777 | 159 | 2095 | 109 |
| 30350 | 1324 | 383 | 1641 | 433 |

All observations are dated November 17, 2026. The one-bedroom weighted mean is $1,567.978278 across 1,243 listings. The two-bedroom weighted mean is $1,875.927474 across 1,172 listings. This covers the requested ZIP areas.

| Household | Published monthly rent, USD |
| --- | --- |
| Alex | 783.99 |
| Sofia | 937.96 |
| Jordan | 1875.93 |
| Patricia | 1567.98 |

Edition 4 publishes this rent-only change using the previously published tax amount. The later fixed-tax edition successfully completed automatic price publication. New games receive edition 4.

## Failure handling and displayed dates

Each price binding records its human-readable label, source observation period, last successful verification time and status in the immutable edition snapshot. Status is current, carried_forward or fixed for zero-price rules. A failed price source copies the actual prior published amount. Tax credits carry forward their prior household amounts. Rent carries forward the complete prior household allocation if a ZIP result is unavailable. Each unavailable occupation retains its previous wage, release year and sync time. Successful components still update in the same edition.

The month can publish with source errors recorded when complete validated prior values exist. The code rejects publication when neither a fresh value nor an actual prior value is available. A published price history is available through the read-only get_edition_price_updates RPC. The individual and group game pages have a Last updated disclosure, fetched only when opened. It shows verification dates and explicitly marks carried-forward amounts. Its network failure does not prevent gameplay. Older editions without metadata show that update history is unavailable.

The implementation migration is [20261117061147_monthly_carry_forward.sql](../supabase/migrations/20261117061147_monthly_carry_forward.sql). [Database checks](../supabase/tests/monthly-carry-forward.sql) cover wage publication, generated weekly income, preserved carry-forward dates, repeat-publication identity, refresh claims and caller permissions. Source tests cover total outages, mixed success, unchanged prior prices, tax-credit CPI updates and wage annual observations. The RPC exposes status metadata for published editions and keeps the private refresh records protected.

The live edition has 99 tracked components, including all eight verified wages. The six cached rent responses were reused. The optional Census fact source remained unavailable, and historical/context facts were preserved. No additional RentCast call was made during this revision.
