> **Implemented after this audit, November 17.** Tax credits now use all-items CPI. The deployed monthly refresh fetches and automatically publishes OEWS wages. Edition 6 tracks 99 price/wage components. Source failures carry forward prior component values, with earlier verification dates shown in Last updated. External failure notifications and expanded future-content coverage remain separate follow-up items. The findings below record the earlier audit state.

# Monthly price coverage audit

Reviewed November 17, 2026 against local code and the connected Supabase project.

The latest published content is edition 5, version `6e47473a-bd50-fef0-80bd-f00005771990`. November’s refresh record has status `published` and no required-source errors. The active cron job runs at `0 6 26 * *` UTC.

## Current coverage

The bundled catalog has 87 bindings, including 82 nonzero components and five zero fees. There are 85 CPI bindings, one rent binding and one electricity binding. The rent binding resolves all four household allocations from six ZIP responses. Zero fees and free choices retain zero.

| Displayed monetary input | Current update path | Status |
| --- | --- | --- |
| Rent | Six RentCast markets, bedroom-specific means weighted by listing counts, then household shares | Deployed and live-tested |
| Electricity | EIA Georgia residential revenue divided by customers | Deployed and live-tested |
| Other ordinary choice costs | BLS category CPI with all-items CPI fallback | Deployed and live-tested |
| Other bill principals | BLS category CPI with all-items fallback | Deployed and live-tested |
| Nonzero late fees | BLS all-items CPI | Deployed and source-tested |
| Interview clothes | BLS apparel CPI, pinned edition price, server employment state and frontend rendering | Deployed and unit-tested |
| Paid tax preparation | BLS preparation-services CPI, pinned upfront cost and net choice effect | Deployed and database-tested |
| Hourly wages and weekly pay | Separate OEWS importer stages changed wages in drafts | Automatic gameplay publication remains incomplete |
| Fixed tax credits | Authored USD 989 for Alex, Sofia and Patricia, USD 1989 for Jordan and Maya | Explicit fixed simulation values |
| Starting cash | Persona values copied from the previous edition | Fixed simulation values |
| Balances, totals and recorded transactions | Computed from committed events and pinned inputs | Follow their originating run and edition |
| Historical dollar amounts in facts | Dated source observations | Retain the reporting period |

The current catalog contains no literal dollar amounts in scenario descriptions, choice labels or authored response text. The publisher generates the tax response from the edition amounts. General and CAC facts can contain historical dollar observations.

## Work remaining for the broader goal

### Complete wage publication

The wage workflow requests the BLS API, checks the latest annual OEWS release and stages changes in draft jobs. The monthly scenario publisher copies jobs from the currently published edition. A staged wage change therefore does not automatically enter a new playable edition.

The local workflow correction removes the execution-hour guard that caused both November 1 runs to skip the importer. This correction is still an uncommitted local change. It needs to reach the default branch, where scheduled GitHub Actions run. The wage refresh then needs an approved automatic validation/publication path that preserves job flags, requirements and complete playable editions. The current published jobs still show the 2025 wage release and an October 27 sync timestamp.

Relevant code is [the wage workflow](../.github/workflows/bls_oews_sync.yml), [the importer](../integrations/bls_oews/bls_oews_sync.py), and [the scenario publisher](../supabase/migrations/20261117004053_fix_source_edition_validation.sql).

### Detect stale observations and report failed refreshes

The refresh validates schemas, units and calculations. It stores errors privately and blocks publication when a required source fails. The cron job only queues the HTTP request. Its enqueue success alone does not establish successful data retrieval or publication.

There is no configured notification for a blocked refresh, an HTTP failure, or an overdue monthly publication. Source-age checks also need release-aware rules. A correctly formatted but old EIA or RentCast response can currently pass validation. CPI can continue using its last available valid observation. Add expected release-age checks and a visible maintenance status or configured notification path. Safe retries must reuse the existing per-ZIP cache and preserve each monthly request claim.

Relevant code is [the refresh function](../supabase/functions/refresh-game-data/index.ts) and [the source adapter](../supabase/functions/_shared/game-data.mjs).

### Extend coverage enforcement for future content

Existing tests require a binding for every current nonzero ordinary choice and every current bill principal/fee. They also cover clothing, tax fee, source calculations, secret redaction and RentCast limits.

Add an inventory check spanning all live monetary input fields, including wages, starting balances and explicitly fixed credits. Each input should carry its source binding or an explicit fixed-value designation. Include content text checks so a newly typed price cannot diverge from its structured amount. Reject unresolved paid expressions before the compiler’s null-to-zero default can turn them into a free choice.

Relevant code is [the catalog](../integrations/game_data/catalog.mjs), [the compiler](../tools/scenario-library.mjs), and [the provider tests](../integrations/game_data/game-data.test.mjs).

### Verify all browser displays across an edition change

The hosted SQL tests cover four households, both CAC modes, Day 30 completion, tax-event uniqueness and protected state transitions. A full browser test against a changed-price edition remains pending. It should check job cards, interview clothes, bills, late fees, choices, upfront costs, recaps and totals in the individual and group flows.

There is an unused employment preview service that still passes a fixed USD 60 constant. No production caller was found. Bind or remove that preview before using it again. The normal saved-state gameplay path reads the pinned edition clothing cost.

## Fixed values requiring an explicit scope decision

The recent fixed-tax choice deliberately exempts USD 989 and USD 1989 from automatic price updates. Starting cash is Alex USD 350, Jordan USD 850, Sofia USD 600 and Patricia USD 1200. If the intended scope includes every financial input, those fixed inputs need a selected recalculation policy too.

Published runs retain their originating version. New games select the latest published edition. Monthly updates apply to the new edition’s inputs while recorded transactions keep the amounts committed at the time.
