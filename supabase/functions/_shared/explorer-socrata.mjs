// Socrata open-data ingestion for the Explore Data page (pure logic, no Deno/Node globals).
//
// A statistic whose `source_reference` has `provider: "socrata"` is refreshed here.
// It reads one monthly count: the row with the latest `YYYY-MM` period.
//   https://{domain}/resource/{dataset_id}.json
// Fulton County's "Monthly Eviction Filings" (cbu2-qs5w) is the only dataset in
// use. The host must be on the allowlist below, so a statistic definition cannot
// point the refresh at an arbitrary server. No API key is needed.
//
// Rows with a missing or non-integer count are skipped, never treated as zero.
// A malformed period, a duplicated month, or an empty response raises, so the
// last published value stays.
import { redact } from './explorer-fred.mjs'

export const SOCRATA_DOMAINS = new Set(['sharefulton.fultoncountyga.gov'])

const ROW_LIMIT = 24
const REQUEST_TIMEOUT_MS = 20000
const DATASET_ID = /^[a-z0-9]{4}-[a-z0-9]{4}$/
const FIELD = /^[a-z][a-z0-9_]{1,40}$/
const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December',
]

function requireBinding(ref) {
  if (ref?.provider !== 'socrata' || !SOCRATA_DOMAINS.has(ref.domain)) {
    throw new Error('source_reference is not a supported Socrata binding')
  }
  if (!DATASET_ID.test(ref.dataset_id ?? '')) {
    throw new Error('Socrata binding has an invalid dataset_id')
  }
  for (const key of ['value_field', 'period_field']) {
    if (!FIELD.test(ref[key] ?? '')) throw new Error(`Socrata binding has an invalid ${key}`)
  }
}

/** Request URL: the newest periods first, only the two fields needed. */
export function buildSocrataUrl(ref) {
  requireBinding(ref)
  const url = new URL(`https://${ref.domain}/resource/${ref.dataset_id}.json`)
  url.searchParams.set('$select', `${ref.period_field},${ref.value_field}`)
  url.searchParams.set('$order', `${ref.period_field} DESC`)
  url.searchParams.set('$limit', String(ROW_LIMIT))
  return url
}

function monthBounds(period) {
  const [year, month] = period.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return { start: `${period}-01`, end: `${period}-${String(lastDay).padStart(2, '0')}` }
}

/** Pick the latest month with a usable count. */
export function computeSocrataObservation(rows, ref) {
  requireBinding(ref)
  if (!Array.isArray(rows)) throw new Error('Socrata response is not a list of rows')

  const seen = new Map()
  for (const row of rows) {
    const period = row?.[ref.period_field]
    if (typeof period !== 'string' || !PERIOD.test(period)) {
      throw new Error('Socrata row has an unexpected period format')
    }
    const raw = row[ref.value_field]
    const text = raw === null || raw === undefined ? '' : String(raw).trim()
    const value = /^\d+$/.test(text) ? Number(text) : null
    if (seen.has(period) && seen.get(period) !== value) {
      throw new Error(`Socrata returned conflicting rows for ${period}`)
    }
    seen.set(period, value)
  }

  const periods = [...seen.keys()].filter((p) => seen.get(p) !== null).sort()
  if (periods.length === 0) throw new Error('Socrata response has no month with a usable count')
  const period = periods[periods.length - 1]
  const value = seen.get(period)
  if (!Number.isSafeInteger(value)) throw new Error('Socrata count is not a safe integer')

  const [year, month] = period.split('-')
  const { start, end } = monthBounds(period)
  return {
    value,
    periodLabel: `${MONTHS[Number(month) - 1]} ${year}`,
    periodStart: start,
    periodEnd: end,
    // Changes if the county revises the month's count.
    revisionKey: `socrata:${ref.dataset_id}:${period}:${value}`,
  }
}

/** Fetch the rows. `fetchImpl` is injected for testing. */
export async function fetchSocrataRows({ ref, fetchImpl }) {
  const url = buildSocrataUrl(ref)
  let response
  try {
    response = await fetchImpl(url.toString(), {
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new Error(`Socrata request failed: ${redact(error?.message ?? error, '')}`)
  }
  if (response.status >= 300 && response.status < 400) {
    throw new Error('Socrata redirected the request instead of returning data')
  }
  if (!response.ok) throw new Error(`Socrata responded with HTTP ${response.status}`)
  try {
    return await response.json()
  } catch {
    throw new Error('Socrata returned a non-JSON response')
  }
}

/**
 * Refresh every Socrata statistic.
 *   statistics: [{ statistic_key, source_reference }]
 *   record(args): calls record_explorer_observation, returns { observation_id, status }
 * One failing statistic does not stop the others, and a failure records
 * nothing, so the last published value stays.
 */
export async function refreshSocrataStatistics({ statistics, fetchImpl, record }) {
  const results = []
  for (const statistic of statistics) {
    try {
      const ref = statistic.source_reference
      const rows = await fetchSocrataRows({ ref, fetchImpl })
      const observation = computeSocrataObservation(rows, ref)
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
        message: String(error?.message ?? error),
      })
    }
  }
  return results
}
