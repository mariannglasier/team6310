// Census ingestion for the Explore Data page (pure logic, no Deno/Node globals).
//
// A statistic whose `source_reference` has `provider: "census"` is refreshed here.
// Datasets supported:
//   acs/acs5/subject            ACS 5-year subject tables (year in the URL path)
//   acs/acs5/profile            ACS 5-year data profiles (same shape)
//   acs/acs1/subject            ACS 1-year subject tables, for the whole U.S.
//   acs/acs1/profile            ACS 1-year data profiles, for the whole U.S.
//   timeseries/poverty/saipe    SAIPE annual estimates (year in the `time` param)
//
// A geography has a `for` clause (for example `place:68516` or `us:1`) and an
// `in` clause (for example `state:13`). Only the U.S. as a whole (`us:1`) has
// no `in` clause.
//
// A statistic can add several percentage rows of the same table (for example
// renters paying 30.0-34.9% plus 35.0%+ of income on rent, via `add_variables`).
// The margin of error of a sum of separate categories is the square root of the
// sum of the squared margins (Census guidance for aggregated estimates); it is
// only shown when every part has a margin.
//
// Release handling: the newest year is tried first. A year that is not yet
// published (ACS answers 404, SAIPE answers 204) falls back to the next older
// year. ANYTHING else is an error and never falls back, so a rejected API key
// (a redirect), a bad variable (400) or a server fault cannot quietly produce
// older data.
//
// Census marks missing or suppressed values with large negative numbers (for
// example -666666666). Those, nulls, and non-numeric text are treated as
// missing, never as a number. Returned name and geography codes are checked
// against the binding before anything is recorded. Errors never include the
// API key.
import { redact } from './explorer-fred.mjs'

export const CENSUS_BASE_URL = 'https://api.census.gov/data'
const ACS_DATASETS = new Set([
  'acs/acs5/subject',
  'acs/acs5/profile',
  'acs/acs1/subject',
  'acs/acs1/profile',
])
const DATASETS = new Set([...ACS_DATASETS, 'timeseries/poverty/saipe'])
const MAX_ADDED = 4
const YEARS_TO_TRY = 4
const REQUEST_TIMEOUT_MS = 20000
const NAME = /^[A-Za-z0-9_]{3,40}$/
const GEO = /^[a-z ]{2,20}:\d{1,6}$/

function requireBinding(ref) {
  if (ref?.provider !== 'census' || !DATASETS.has(ref.dataset)) {
    throw new Error('source_reference is not a supported Census binding')
  }
  for (const key of ['variable', 'moe_variable', 'lower_variable', 'upper_variable']) {
    if (ref[key] !== undefined && !NAME.test(ref[key])) {
      throw new Error(`Census binding has an invalid ${key}`)
    }
  }
  if (!NAME.test(ref.variable ?? '')) throw new Error('Census binding needs a variable')
  for (const key of ['add_variables', 'add_moe_variables']) {
    const list = ref[key]
    if (list === undefined) continue
    if (!Array.isArray(list) || list.length > MAX_ADDED || !list.every((v) => NAME.test(v))) {
      throw new Error(`Census binding has an invalid ${key}`)
    }
  }
  if ((ref.add_variables?.length ?? 0) !== (ref.add_moe_variables?.length ?? 0) && ref.add_moe_variables) {
    throw new Error('Census binding add_moe_variables must match add_variables')
  }
  // Only the whole United States has no `in` clause; every other area needs one.
  const wholeCountry = ref.geography?.for === 'us:1' && ref.geography.in === undefined
  if (
    !GEO.test(ref.geography?.for ?? '') ||
    (!wholeCountry && !GEO.test(ref.geography?.in ?? ''))
  ) {
    throw new Error('Census binding needs a valid geography')
  }
  if (typeof ref.expected_name !== 'string' || !ref.expected_name) {
    throw new Error('Census binding needs an expected_name')
  }
}

/** Request URL for one release year. The key is part of the URL (Census requirement). */
export function buildCensusUrl(ref, year, apiKey) {
  requireBinding(ref)
  const isAcs = ACS_DATASETS.has(ref.dataset)
  const fields = [
    ...new Set(
      [
        'NAME',
        ref.variable,
        ...(ref.add_variables ?? []),
        ref.moe_variable,
        ...(ref.add_moe_variables ?? []),
        ref.lower_variable,
        ref.upper_variable,
      ].filter(Boolean),
    ),
  ]
  const url = new URL(
    isAcs ? `${CENSUS_BASE_URL}/${year}/${ref.dataset}` : `${CENSUS_BASE_URL}/${ref.dataset}`,
  )
  url.searchParams.set('get', fields.join(','))
  url.searchParams.set('for', ref.geography.for)
  if (ref.geography.in) url.searchParams.set('in', ref.geography.in)
  if (!isAcs) url.searchParams.set('time', String(year))
  url.searchParams.set('key', apiKey)
  return url
}

/** A usable number from a Census cell, or null when missing or suppressed. */
export function parseCell(cell) {
  if (cell === null || cell === undefined) return null
  const text = String(cell).trim()
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null
  const value = Number(text)
  // Census sentinels (-666666666, -555555555, ...) and any negative are "not available".
  if (!Number.isFinite(value) || value < 0) return null
  return value
}

function pick(header, row, name) {
  const index = header.indexOf(name)
  if (index === -1) throw new Error(`Census response is missing the ${name} column`)
  return row[index]
}

/** Validate a response body and turn it into the value to record. */
export function computeCensusObservation(body, ref, year) {
  requireBinding(ref)
  if (!Array.isArray(body) || body.length !== 2 || !Array.isArray(body[0]) || !Array.isArray(body[1])) {
    throw new Error('Census response is not a header row plus exactly one data row')
  }
  const [header, row] = body

  if (pick(header, row, 'NAME') !== ref.expected_name) {
    throw new Error(`Census returned "${String(pick(header, row, 'NAME'))}" instead of the expected area`)
  }
  for (const key of ['for', 'in']) {
    if (!ref.geography[key]) continue
    const [column, code] = ref.geography[key].split(':')
    if (String(pick(header, row, column)) !== code) {
      throw new Error(`Census response ${column} code does not match the binding`)
    }
  }
  if (ref.dataset === 'timeseries/poverty/saipe' && String(pick(header, row, 'time')) !== String(year)) {
    throw new Error('Census response year does not match the request')
  }

  let value = 0
  for (const name of [ref.variable, ...(ref.add_variables ?? [])]) {
    const part = parseCell(pick(header, row, name))
    if (part === null) throw new Error(`Census value for ${name} is missing or suppressed`)
    value += part
  }
  // Remove binary floating-point noise from sums such as 11.4 + 33.3.
  value = Number(value.toFixed(6))
  if (ref.expect === 'percent' && value > 100) {
    throw new Error(`Census value ${value} for ${ref.variable} is not a valid percent`)
  }

  const optional = (name) => (name ? parseCell(pick(header, row, name)) : null)
  let periodLabel
  let start
  let end
  let revisionExtra
  if (ACS_DATASETS.has(ref.dataset)) {
    let moe = optional(ref.moe_variable)
    if (moe !== null && ref.add_variables?.length) {
      const margins = (ref.add_moe_variables ?? []).map(optional)
      moe =
        margins.length === ref.add_variables.length && margins.every((m) => m !== null)
          ? Number(Math.sqrt([moe, ...margins].reduce((sum, m) => sum + m * m, 0)).toFixed(1))
          : null
    }
    const oneYear = ref.dataset.startsWith('acs/acs1/')
    const span = oneYear ? `${year} ACS 1-year estimate` : `${year - 4}–${year} ACS 5-year estimate`
    periodLabel = moe === null ? span : `${span}, margin of error ±${moe} percentage points`
    start = `${oneYear ? year : year - 4}-01-01`
    end = `${year}-12-31`
    revisionExtra = `${moe ?? 'na'}`
  } else {
    const lower = optional(ref.lower_variable)
    const upper = optional(ref.upper_variable)
    periodLabel =
      lower !== null && upper !== null && lower <= value && value <= upper
        ? `${year}, 90% interval ${lower}–${upper}`
        : String(year)
    start = `${year}-01-01`
    end = `${year}-12-31`
    revisionExtra = `${lower ?? 'na'}:${upper ?? 'na'}`
  }

  return {
    value,
    periodLabel,
    periodStart: start,
    periodEnd: end,
    // Changes whenever the estimate or its published uncertainty is revised.
    revisionKey: `census:${ref.dataset}:${[ref.variable, ...(ref.add_variables ?? [])].join('+')}:${ref.geography.for}:${year}:${value}:${revisionExtra}`,
  }
}

/** Fetch the newest published year. `now` and `fetchImpl` are injected for testing. */
export async function fetchCensusObservation({ ref, apiKey, fetchImpl, now = new Date() }) {
  if (!apiKey) throw new Error('CENSUS_API_KEY is not configured')
  const latest = now.getUTCFullYear()
  for (let year = latest; year > latest - YEARS_TO_TRY; year -= 1) {
    const url = buildCensusUrl(ref, year, apiKey)
    let response
    try {
      response = await fetchImpl(url.toString(), {
        redirect: 'manual',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      throw new Error(`Census request failed: ${redact(error?.message ?? error, apiKey)}`)
    }
    // Not published yet: ACS has no dataset for the year, SAIPE has no rows.
    if (response.status === 404 || response.status === 204) continue
    if (response.status >= 300 && response.status < 400) {
      throw new Error('Census rejected the API key or the request (redirected)')
    }
    if (!response.ok) {
      throw new Error(`Census responded with HTTP ${response.status}`)
    }
    let body
    try {
      body = await response.json()
    } catch {
      throw new Error('Census returned a non-JSON response')
    }
    return computeCensusObservation(body, ref, year)
  }
  throw new Error(`Census: no release found for ${ref.variable} in the last ${YEARS_TO_TRY} years`)
}

/**
 * Refresh every Census statistic.
 *   statistics: [{ statistic_key, source_reference }]
 *   record(args): calls record_explorer_observation, returns { observation_id, status }
 * One failing statistic does not stop the others, and a failure records
 * nothing, so the last published value stays.
 */
export async function refreshCensusStatistics({ statistics, apiKey, fetchImpl, record, now }) {
  const results = []
  for (const statistic of statistics) {
    try {
      const observation = await fetchCensusObservation({
        ref: statistic.source_reference,
        apiKey,
        fetchImpl,
        now,
      })
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
