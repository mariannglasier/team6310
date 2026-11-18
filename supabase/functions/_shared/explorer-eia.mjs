// EIA ingestion for the Explore Data page (pure logic, no Deno/Node globals).
//
// A statistic whose `source_reference` has `provider: "eia"` is refreshed here.
// The only route in use is the retail electricity price:
//   https://api.eia.gov/v2/electricity/retail-sales/data/
//   facets: stateid (e.g. GA), sectorid (e.g. RES); field `price`; monthly.
//
// The API returns the average retail price in cents per kilowatt-hour. It is a
// statewide average for a customer sector, not an individual household bill.
// Rows are checked against the requested facets and unit before anything is
// recorded, a null price is treated as missing rather than zero, and an
// unusable response raises so the last published value stays. Errors never
// include the API key.
import { redact } from './explorer-fred.mjs'

export const EIA_RETAIL_SALES_URL =
  'https://api.eia.gov/v2/electricity/retail-sales/data/'

// A year of months is enough to find the latest month that has a price.
const ROW_LIMIT = 12
const REQUEST_TIMEOUT_MS = 15000
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December',
]
const FACET = /^[A-Z0-9]{2,8}$/
const UNIT = /^cents per kilowatt-?hour$/i

/** Build the request URL. The key is part of the URL (EIA requirement). */
export function buildRetailPriceUrl({ stateId, sectorId, apiKey }) {
  if (!FACET.test(stateId ?? '') || !FACET.test(sectorId ?? '')) {
    throw new Error('EIA source_reference needs valid state and sector facets')
  }
  const url = new URL(EIA_RETAIL_SALES_URL)
  const params = {
    api_key: apiKey,
    frequency: 'monthly',
    'data[0]': 'price',
    'facets[stateid][]': stateId,
    'facets[sectorid][]': sectorId,
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: String(ROW_LIMIT),
  }
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url
}

function monthLabel(period) {
  const [year, month] = period.split('-')
  return `${MONTHS[Number(month) - 1]} ${year}`
}

function monthBounds(period) {
  const [year, month] = period.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return {
    start: `${period}-01`,
    end: `${period}-${String(lastDay).padStart(2, '0')}`,
  }
}

/**
 * Pick the latest month with a usable price from an EIA response.
 * Returns { value, periodLabel, periodStart, periodEnd, revisionKey }.
 */
export function computeRetailPrice(payload, { stateId, sectorId }) {
  const rows = payload?.response?.data
  if (!Array.isArray(rows)) {
    throw new Error('EIA response has no data array')
  }

  let latest = null
  for (const row of rows) {
    if (!row || typeof row.period !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(row.period)) {
      throw new Error('EIA row has an unexpected period format')
    }
    // Reject rows that do not match what was asked for rather than trust them.
    if (row.stateid !== stateId || row.sectorid !== sectorId) {
      throw new Error('EIA row does not match the requested state and sector')
    }
    if (row.price === null || row.price === undefined || row.price === '') continue
    const text = String(row.price).trim()
    if (!/^\d+(\.\d+)?$/.test(text)) continue
    const price = Number(text)
    if (!Number.isFinite(price) || price <= 0) continue
    if (!UNIT.test(String(row['price-units'] ?? '').trim())) {
      throw new Error(`EIA price is not in cents per kilowatt-hour (${String(row['price-units'])})`)
    }
    if (latest === null || row.period > latest.period) latest = { period: row.period, price }
  }

  if (latest === null) {
    throw new Error(`EIA ${stateId} ${sectorId}: no month with a usable price`)
  }
  const { start, end } = monthBounds(latest.period)
  return {
    value: latest.price,
    periodLabel: monthLabel(latest.period),
    periodStart: start,
    periodEnd: end,
    // Changes if EIA revises the month's price.
    revisionKey: `eia:${stateId}:${sectorId}:${latest.period}:${latest.price}`,
  }
}

/** Fetch the retail-price response. `fetchImpl` is injected for testing. */
export async function fetchRetailPrice({ stateId, sectorId, apiKey, fetchImpl }) {
  if (!apiKey) throw new Error('EIA_API_KEY is not configured')
  const url = buildRetailPriceUrl({ stateId, sectorId, apiKey })
  let response
  try {
    response = await fetchImpl(url.toString(), {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new Error(`EIA request failed: ${redact(error?.message ?? error, apiKey)}`)
  }
  if (!response.ok) {
    throw new Error(`EIA responded with HTTP ${response.status}`)
  }
  try {
    return await response.json()
  } catch {
    throw new Error('EIA returned a non-JSON response')
  }
}

/**
 * Refresh every EIA statistic.
 *   statistics: [{ statistic_key, source_reference }]
 *   record(args): calls record_explorer_observation, returns { observation_id, status }
 * One failing statistic does not stop the others, and a failure records
 * nothing, so the last published value stays.
 */
export async function refreshEiaStatistics({ statistics, apiKey, fetchImpl, record }) {
  const results = []
  for (const statistic of statistics) {
    const ref = statistic.source_reference ?? {}
    try {
      if (
        ref.provider !== 'eia' ||
        ref.route !== 'electricity/retail-sales' ||
        ref.field !== 'price'
      ) {
        throw new Error('source_reference is not a supported EIA retail price binding')
      }
      const facets = { stateId: ref.facets?.stateid, sectorId: ref.facets?.sectorid }
      const payload = await fetchRetailPrice({ ...facets, apiKey, fetchImpl })
      const observation = computeRetailPrice(payload, facets)
      const recorded = await record({
        statistic_key: statistic.statistic_key,
        value: observation.value,
        value_high: null,
        period_label: observation.periodLabel,
        period_start: observation.periodStart,
        period_end: observation.periodEnd,
        revision_key: observation.revisionKey,
        retrieval_method: 'api',
      })
      results.push({
        statistic_key: statistic.statistic_key,
        outcome: recorded.status,
        period: observation.periodLabel,
        value: observation.value,
      })
    } catch (error) {
      results.push({
        statistic_key: statistic.statistic_key,
        outcome: 'error',
        message: redact(error?.message ?? error, apiKey),
      })
    }
  }
  return results
}
