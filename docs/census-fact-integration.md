# Census facts integration

The nine formerly context-only general facts now have a shared Census ACS five-year API adapter. It retrieves all estimate and margin-of-error cells in two batches per candidate release (at most 40 variables plus NAME per request), validates Sandy Springs city, Georgia (`state:13`, `place:68516`), and calculates each measure from the same complete release. It tries the preceding year and then the two preceding releases. A malformed or unavailable release falls through to the next candidate.

## Measures

| Card | Table | Calculation |
| --- | --- | --- |
| D001 Looking for work | B23025 | Unemployed `_005E` / civilian labor force `_003E` |
| D003 Back to the job search | B23025 | Not in labor force `_007E` / population age 16 and older `_001E` |
| D004 Another interview | B08303 | Sum `_012E` and `_013E` (60+ minute commutes) / `_001E` workers who commute |
| D006 Rent is due | B25070 | Sum `_007E`–`_010E` (30%+) / (`_001E` − `_011E`, excluding ratios not computed) |
| D020 A medical bill remains | B27001 | Sum the 18 nonoverlapping uninsured sex/age cells / `_001E` civilian population living outside institutions |
| D028 A plumbing problem | B25048 | Occupied homes lacking complete plumbing `_003E` / all occupied homes `_001E` |
| D032 A larger share to cover | B25010 | Renter average household size `_003E`, already an average |
| D044 Getting to an appointment | B08201 | Households without a vehicle `_002E` / all households `_001E` |
| D055 Someone asks for help | B17010 | Families below poverty `_002E` / all families `_001E` |

Percentages multiply the ratio by 100 and display one decimal place. Household size displays two decimals. The health-insurance numerator cells are 005, 008, 011, 014, 017, 020, 023, 026, 029, 033, 036, 039, 042, 045, 048, 051, 054 and 057. Raw estimates and matching `M` margin-of-error cells remain in the private edition snapshot. No derived confidence interval is invented. Reject null, blank, nonfinite, negative/suppressed estimates and MOEs, fractional count cells, zero denominators and numerators exceeding their denominator. Valid zero numerators display 0.0%.

D003 uses a distinct measure instead of repeating D001 unemployment. D028 corrects the former B25047 mapping, whose universe includes vacant homes. The authored copy otherwise stays intact; D006 explicitly identifies the households with a reported rent-to-income ratio. Historical five-year periods remain visible and are not relabeled as current-month statistics.

Official schemas verified against the [2024 ACS detailed-table catalogue](https://api.census.gov/data/2024/acs/acs5/groups.html), including [occupied-home plumbing](https://api.census.gov/data/2024/acs/acs5/groups/B25048.html), [labor-force status](https://api.census.gov/data/2024/acs/acs5/groups/B23025.html), [commute time](https://api.census.gov/data/2024/acs/acs5/groups/B08303.html), [rent burden](https://api.census.gov/data/2024/acs/acs5/groups/B25070.html), [health coverage](https://api.census.gov/data/2024/acs/acs5/groups/B27001.html), [household size](https://api.census.gov/data/2024/acs/acs5/groups/B25010.html), [vehicle availability](https://api.census.gov/data/2024/acs/acs5/groups/B08201.html) and [family poverty](https://api.census.gov/data/2024/acs/acs5/groups/B17010.html).

## Monthly and failure behavior

The existing monthly refresh now calls the adapter and fills all nine templates. Source failures retain the last published complete passage, observation period, source URL and original successful verification date. `freshness["fact:Dxxx"]` reports `carried_forward` plus the new check date. Older annual releases never replace newer published observations. A changed semantic measure cannot inherit the old measure's text. Numeric facts are not inflation-adjusted.

The authenticated maintenance operation `{"operation":"census-facts","dryRun":true}` verifies all nine without publishing. Use `dryRun:false` to publish after validation. It copies the latest edition's financial settings and changes only the nine fact passages and their provenance/status. It makes Census requests only, with no RentCast, BLS wage, CPI or electricity requests. It returns 424 and publishes nothing if complete validated facts are unavailable. Existing playthroughs remain pinned to their original edition.

The operation uses the existing maintenance-token authentication. Keep tokens in Vault or server environment; never copy them into browser code or committed SQL. `operation:census-status` returns only whether a Census key exists, never its value. Maintenance diagnostic failures are limited to safe release/error categories and never contain credential URLs.

## Credential status

The first November 17 live check found `CENSUS_API_KEY` configured but rejected. After the user verified the key, the same adapter passed live validation and published all nine facts using the 2020–2024 release. No further user setup is needed. For future replacement, obtain/activate a key through [Census key signup](https://api.census.gov/data/key_signup.html), then replace `CENSUS_API_KEY` under Supabase Edge Functions → Secrets. Do not paste keys into chat.

## Published result and verification

Edition 9, `74aa2bd4-ac41-1ce8-696d-87a8ddd38c09`, contains 51 complete general fact passages and zero context-only general passages. Edge Function version 23 contains the monthly adapter and Census-only maintenance operation. Existing 33 CAC passages remain; the separate 18 missing CAC slots are not filled by Census statistics. Historical runs keep their original edition, so start a new run to see the newly resolved passages.

| Card | Published 2020–2024 observation |
| --- | --- |
| D001 | 4.0% unemployed among civilian labor-force participants |
| D003 | 25.8% outside the labor force among residents age 16 and older |
| D004 | 5.6% with a commute of at least 60 minutes among workers who traveled to work |
| D006 | 44.7% spent at least 30% of income on gross rent among renters with a calculated ratio |
| D020 | 8.6% lacked health insurance among civilian residents living outside institutions |
| D028 | 0.1% of occupied homes lacked complete plumbing |
| D032 | 1.84 people per renter-occupied household |
| D044 | 7.2% of households had no vehicle available |
| D055 | 7.2% of families were below the poverty threshold |

Verification passed: 25 compiler/provider tests, including the real monthly pipeline's carry-forward behavior, and Edge entry type checking. `supabase/tests/census-fact-recaps.sql` verified all nine published passages through the protected recap RPC in both modes (18 cases), with pre-decision hiding, regular-mode CAC hiding and cross-owner denial. The fixture constructs each event's committed state independently of random selection and the six-bill cap; it is not a replacement for gameplay routing tests. The full `supabase/tests/scenario-source-refresh.sql` walkthrough also passed for all four households in both modes through Day 30. All fixture changes rolled back. A hosted audit confirmed that prices, wages, rents and every pre-existing verification record exactly match edition 8. No RentCast requests were made.
