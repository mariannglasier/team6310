// FRED ingestion for the Explore Data page (pure logic, no Deno/Node globals).
//
// A statistic whose `source_reference` has `provider: "fred"` is refreshed here.
// Supported transforms:
//   level               latest non-missing observation, stored as published
//                       (`frequency: "quarterly"` labels it by quarter)
//   yoy_percent_change  percent change versus the same month one year earlier,
//                       using the latest month where BOTH values exist
//
// FRED marks missing observations with ".". Atlanta food CPI is only collected
// in even months, and some months are absent entirely, so the latest month is
// often not comparable with the prior year. Missing values are never filled or
// interpolated, and an unusable response raises instead of recording anything.
// Errors never include the API key.

export const FRED_OBSERVATIONS_URL =
  'https://api.stlouisfed.org/fred/series/observations'

// 60 slots comfortably covers a year-over-year pair for bimonthly series.
const OBSERVATION_LIMIT = 60
const REQUEST_TIMEOUT_MS = 15000
const QUARTERS = ['First', 'Second', 'Third', 'Fourth']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December',
]

/** Remove anything resembling a credential from text before it is surfaced. */
export function redact(text, apiKey) {
  let out = String(text)
  if (apiKey) out = out.split(apiKey).join('[redacted]')
  return out.replace(/api_key=[^&\s"']+/gi, 'api_key=[redacted]')
}

/** Parse FRED observations into a Map of 'YYYY-MM' to a finite number. */
export function parseObservations(payload) {
  if (!payload || !Array.isArray(payload.observations)) {
    throw new Error('FRED response has no observations array')
  }
  const byMonth = new Map()
  for (const obs of payload.observations) {
    if (!obs || typeof obs.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(obs.date)) {
      throw new Error('FRED observation has an unexpected date format')
    }
    // "." (and any non-numeric text) means no observation for that month.
    if (typeof obs.value !== 'string' || !/^-?\d+(\.\d+)?$/.test(obs.value.trim())) {
      continue
    }
    const value = Number(obs.value)
    if (Number.isFinite(value)) byMonth.set(obs.date.slice(0, 7), value)
  }
  return byMonth
}

function priorYear(month) {
  const [year, mm] = month.split('-')
  return `${Number(year) - 1}-${mm}`
}

function monthLabel(month) {
  const [year, mm] = month.split('-')
  return `${MONTHS[Number(mm) - 1]} ${year}`
}

function monthBounds(month) {
  const [year, mm] = month.split('-').map(Number)
  const start = `${month}-01`
  const lastDay = new Date(Date.UTC(year, mm, 0)).getUTCDate()
  return { start, end: `${month}-${String(lastDay).padStart(2, '0')}` }
}

function round(value, places) {
  const factor = 10 ** places
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/**
 * Turn parsed observations into the value to record.
 * Returns { value, periodLabel, periodStart, periodEnd, revisionKey }.
 */
export function computeObservation(byMonth, transform, seriesId, frequency = 'monthly') {
  const months = [...byMonth.keys()].sort()
  if (months.length === 0) {
    throw new Error(`${seriesId}: no usable observations`)
  }
  if (frequency !== 'monthly' && frequency !== 'quarterly') {
    throw new Error(`${seriesId}: unsupported frequency "${frequency}"`)
  }

  if (transform === 'level') {
    const month = months[months.length - 1]
    const value = byMonth.get(month)
    if (frequency === 'quarterly') {
      // FRED dates a quarter by its first day (Jan, Apr, Jul, Oct).
      const quarterStart = Number(month.slice(5))
      if (![1, 4, 7, 10].includes(quarterStart)) {
        throw new Error(`${seriesId}: ${month} is not the start of a quarter`)
      }
      const quarter = (quarterStart - 1) / 3 + 1
      const year = month.slice(0, 4)
      return {
        value,
        periodLabel: `${QUARTERS[quarter - 1]} quarter ${year}`,
        periodStart: `${month}-01`,
        periodEnd: monthBounds(`${year}-${String(quarterStart + 2).padStart(2, '0')}`).end,
        revisionKey: `fred:${seriesId}:${month}:${value}`,
      }
    }
    const { start, end } = monthBounds(month)
    return {
      value,
      periodLabel: monthLabel(month),
      periodStart: start,
      periodEnd: end,
      revisionKey: `fred:${seriesId}:${value}`,
    }
  }

  if (transform === 'yoy_percent_change') {
    for (let i = months.length - 1; i >= 0; i -= 1) {
      const month = months[i]
      const earlier = priorYear(month)
      if (!byMonth.has(earlier)) continue
      const current = byMonth.get(month)
      const base = byMonth.get(earlier)
      if (!(base > 0)) {
        throw new Error(`${seriesId}: prior-year value for ${earlier} is not positive`)
      }
      const { start, end } = monthBounds(month)
      return {
        value: round((current / base - 1) * 100, 4),
        periodLabel: `${monthLabel(month)} compared with ${monthLabel(earlier)}`,
        periodStart: start,
        periodEnd: end,
        // Changes whenever either underlying index value is revised.
        revisionKey: `fred:${seriesId}:${current}:${base}`,
      }
    }
    throw new Error(`${seriesId}: no month has both a current and prior-year value`)
  }

  throw new Error(`${seriesId}: unsupported transform "${transform}"`)
}

/** Fetch observations for one series. `fetchImpl` is injected for testing. */
export async function fetchFredObservations({ seriesId, apiKey, fetchImpl }) {
  if (!apiKey) throw new Error('FRED_API_KEY is not configured')
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    sort_order: 'desc',
    limit: String(OBSERVATION_LIMIT),
  })
  let response
  try {
    response = await fetchImpl(`${FRED_OBSERVATIONS_URL}?${params}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new Error(`FRED request failed: ${redact(error?.message ?? error, apiKey)}`)
  }
  if (!response.ok) {
    throw new Error(`FRED responded with HTTP ${response.status} for ${seriesId}`)
  }
  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error(`FRED returned a non-JSON response for ${seriesId}`)
  }
  return parseObservations(payload)
}

/**
 * Refresh every FRED statistic.
 *   statistics: [{ statistic_key, source_reference }]
 *   record(args): calls record_explorer_observation, returns { observation_id, status }
 * One failing statistic does not stop the others, and a failure records nothing,
 * so the last published value stays.
 */
export async function refreshFredStatistics({ statistics, apiKey, fetchImpl, record }) {
  const results = []
  for (const statistic of statistics) {
    const ref = statistic.source_reference ?? {}
    try {
      if (ref.provider !== 'fred' || typeof ref.series_id !== 'string') {
        throw new Error('source_reference is not a FRED series binding')
      }
      const byMonth = await fetchFredObservations({
        seriesId: ref.series_id,
        apiKey,
        fetchImpl,
      })
      const observation = computeObservation(
        byMonth,
        ref.transform ?? 'level',
        ref.series_id,
        ref.frequency ?? 'monthly',
      )
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
