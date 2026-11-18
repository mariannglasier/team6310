// Run with: node --test supabase/functions/_shared/explorer-fred.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  computeObservation,
  fetchFredObservations,
  parseObservations,
  redact,
  refreshFredStatistics,
} from './explorer-fred.mjs'

const KEY = 'SECRETKEY1234567890'

// Shape of the real CUURA319SAF response on November 17, 2026: even months only,
// "." for missing, and October 2025 absent so October 2026 has no prior-year pair.
const atlantaFood = {
  observations: [
    { date: '2026-10-01', value: '352.328' },
    { date: '2026-09-01', value: '.' },
    { date: '2026-08-01', value: '347.394' },
    { date: '2026-06-01', value: '348.473' },
    { date: '2026-04-01', value: '344.936' },
    { date: '2026-02-01', value: '341.336' },
    { date: '2025-12-01', value: '341.636' },
    { date: '2025-10-01', value: '.' },
    { date: '2025-08-01', value: '335.223' },
    { date: '2025-06-01', value: '331.270' },
  ],
}

const okResponse = (body) => ({ ok: true, status: 200, json: async () => body })

test('parseObservations drops missing values and keeps real ones', () => {
  const map = parseObservations(atlantaFood)
  assert.equal(map.has('2026-09'), false)
  assert.equal(map.has('2025-10'), false)
  assert.equal(map.get('2026-10'), 352.328)
  assert.equal(map.size, 8)
})

test('parseObservations rejects malformed payloads', () => {
  assert.throws(() => parseObservations({}), /no observations array/)
  assert.throws(() => parseObservations(null), /no observations array/)
  assert.throws(
    () => parseObservations({ observations: [{ date: 'Oct 2026', value: '1' }] }),
    /unexpected date format/,
  )
})

test('parseObservations treats non-numeric text as missing, not zero', () => {
  const map = parseObservations({
    observations: [
      { date: '2026-02-01', value: '' },
      { date: '2026-04-01', value: 'NaN' },
      { date: '2026-06-01', value: '12abc' },
      { date: '2026-08-01', value: '0' },
    ],
  })
  assert.deepEqual([...map.keys()], ['2026-08'])
})

test('year-over-year uses the latest month with BOTH values, not the latest month', () => {
  const result = computeObservation(
    parseObservations(atlantaFood),
    'yoy_percent_change',
    'CUURA319SAF',
  )
  assert.equal(result.periodLabel, 'August 2026 compared with August 2025')
  assert.ok(Math.abs(result.value - 3.63) < 0.005, `got ${result.value}`)
  assert.equal(result.periodStart, '2026-08-01')
  assert.equal(result.periodEnd, '2026-08-31')
  assert.equal(result.revisionKey, 'fred:CUURA319SAF:347.394:335.223')
})

test('year-over-year moves to the newest month once its prior year exists', () => {
  const payload = {
    observations: [
      ...atlantaFood.observations.filter((o) => o.date !== '2025-10-01'),
      { date: '2025-10-01', value: '340.000' },
    ],
  }
  const result = computeObservation(
    parseObservations(payload),
    'yoy_percent_change',
    'CUURA319SAF',
  )
  assert.equal(result.periodLabel, 'October 2026 compared with October 2025')
  assert.ok(Math.abs(result.value - 3.6259) < 0.001, `got ${result.value}`)
})

test('year-over-year is exact for known values and signed for declines', () => {
  const up = computeObservation(
    new Map([['2025-06', 200], ['2026-06', 210]]),
    'yoy_percent_change',
    'S',
  )
  assert.equal(up.value, 5)
  const down = computeObservation(
    new Map([['2025-06', 200], ['2026-06', 190]]),
    'yoy_percent_change',
    'S',
  )
  assert.equal(down.value, -5)
  const flat = computeObservation(
    new Map([['2025-06', 200], ['2026-06', 200]]),
    'yoy_percent_change',
    'S',
  )
  assert.equal(flat.value, 0)
})

test('year-over-year throws when no month has a prior-year pair', () => {
  assert.throws(
    () => computeObservation(new Map([['2026-02', 1], ['2026-04', 2]]), 'yoy_percent_change', 'S'),
    /no month has both/,
  )
  assert.throws(() => computeObservation(new Map(), 'yoy_percent_change', 'S'), /no usable observations/)
})

test('a non-positive prior-year base is rejected instead of dividing by zero', () => {
  assert.throws(
    () => computeObservation(new Map([['2025-06', 0], ['2026-06', 5]]), 'yoy_percent_change', 'S'),
    /not positive/,
  )
})

test('level transform returns the latest observation with correct month bounds', () => {
  const result = computeObservation(parseObservations(atlantaFood), 'level', 'CUURA319SAF')
  assert.equal(result.value, 352.328)
  assert.equal(result.periodLabel, 'October 2026')
  assert.equal(result.periodEnd, '2026-10-31')
  const leap = computeObservation(new Map([['2024-02', 3.9]]), 'level', 'S')
  assert.equal(leap.periodEnd, '2024-02-29')
})

test('unsupported transforms are rejected', () => {
  assert.throws(
    () => computeObservation(new Map([['2026-02', 1]]), 'moving_average', 'S'),
    /unsupported transform/,
  )
})

test('fetchFredObservations requests the series with a key and a bounded window', async () => {
  let requested
  await fetchFredObservations({
    seriesId: 'CUURA319SAF',
    apiKey: KEY,
    fetchImpl: async (url) => {
      requested = new URL(url)
      return okResponse(atlantaFood)
    },
  })
  assert.equal(requested.origin + requested.pathname, 'https://api.stlouisfed.org/fred/series/observations')
  assert.equal(requested.searchParams.get('series_id'), 'CUURA319SAF')
  assert.equal(requested.searchParams.get('file_type'), 'json')
  assert.equal(requested.searchParams.get('limit'), '60')
})

test('fetchFredObservations fails clearly without a key, on HTTP errors, and on bad JSON', async () => {
  await assert.rejects(
    fetchFredObservations({ seriesId: 'S', apiKey: '', fetchImpl: async () => okResponse({}) }),
    /FRED_API_KEY is not configured/,
  )
  await assert.rejects(
    fetchFredObservations({
      seriesId: 'S',
      apiKey: KEY,
      fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) }),
    }),
    /HTTP 429/,
  )
  await assert.rejects(
    fetchFredObservations({
      seriesId: 'S',
      apiKey: KEY,
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token <')
        },
      }),
    }),
    /non-JSON/,
  )
})

test('network errors never leak the API key', async () => {
  await assert.rejects(
    fetchFredObservations({
      seriesId: 'S',
      apiKey: KEY,
      fetchImpl: async (url) => {
        throw new Error(`connect failed for ${url}`)
      },
    }),
    (error) => {
      assert.ok(!error.message.includes(KEY), error.message)
      assert.match(error.message, /\[redacted\]/)
      return true
    },
  )
  assert.equal(redact(`x api_key=${KEY}&y`, KEY).includes(KEY), false)
})

const foodStatistic = {
  statistic_key: 'atl_food_beverage_cpi_change',
  source_reference: { provider: 'fred', series_id: 'CUURA319SAF', transform: 'yoy_percent_change' },
}

test('refreshFredStatistics records one observation per statistic', async () => {
  const recorded = []
  const results = await refreshFredStatistics({
    statistics: [foodStatistic],
    apiKey: KEY,
    fetchImpl: async () => okResponse(atlantaFood),
    record: async (args) => {
      recorded.push(args)
      return { observation_id: 'o1', status: 'published' }
    },
  })
  assert.equal(recorded.length, 1)
  assert.equal(recorded[0].statistic_key, 'atl_food_beverage_cpi_change')
  assert.equal(recorded[0].retrieval_method, 'api')
  assert.equal(recorded[0].value_high, null)
  assert.deepEqual(results[0].outcome, 'published')
})

test('a failing statistic records nothing and does not stop the others', async () => {
  const recorded = []
  const results = await refreshFredStatistics({
    statistics: [
      { statistic_key: 'bad_binding', source_reference: { provider: 'census' } },
      { statistic_key: 'bad_series', source_reference: { provider: 'fred', series_id: 'BROKEN' } },
      foodStatistic,
    ],
    apiKey: KEY,
    fetchImpl: async (url) =>
      new URL(url).searchParams.get('series_id') === 'BROKEN'
        ? { ok: false, status: 400, json: async () => ({}) }
        : okResponse(atlantaFood),
    record: async (args) => {
      recorded.push(args.statistic_key)
      return { observation_id: 'o', status: 'staged' }
    },
  })
  assert.deepEqual(recorded, ['atl_food_beverage_cpi_change'])
  assert.deepEqual(results.map((r) => r.outcome), ['error', 'error', 'staged'])
  assert.match(results[0].message, /not a FRED series binding/)
  assert.match(results[1].message, /HTTP 400/)
})

test('errors surfaced to callers never contain the API key', async () => {
  const results = await refreshFredStatistics({
    statistics: [foodStatistic],
    apiKey: KEY,
    fetchImpl: async (url) => {
      throw new Error(`socket hang up ${url}`)
    },
    record: async () => {
      throw new Error('should not be called')
    },
  })
  assert.equal(results[0].outcome, 'error')
  assert.ok(!JSON.stringify(results).includes(KEY))
})

test('a database failure is reported as an error, not a success', async () => {
  const results = await refreshFredStatistics({
    statistics: [foodStatistic],
    apiKey: KEY,
    fetchImpl: async () => okResponse(atlantaFood),
    record: async () => {
      throw new Error('A percent value must be between 0 and 100')
    },
  })
  assert.equal(results[0].outcome, 'error')
  assert.match(results[0].message, /percent value/)
})

// Quarterly series (e.g. DRCLACBS): FRED dates a quarter by its first day.
test('quarterly level observation is labeled and bounded by quarter', () => {
  const byMonth = new Map([['2025-10', 2.63], ['2026-01', 2.64], ['2026-04', 2.62]])
  const result = computeObservation(byMonth, 'level', 'DRCLACBS', 'quarterly')
  assert.equal(result.value, 2.62)
  assert.equal(result.periodLabel, 'Second quarter 2026')
  assert.equal(result.periodStart, '2026-04-01')
  assert.equal(result.periodEnd, '2026-06-30')
  assert.equal(result.revisionKey, 'fred:DRCLACBS:2026-04:2.62')
  const q4 = computeObservation(new Map([['2026-10', 1]]), 'level', 'X', 'quarterly')
  assert.equal(q4.periodLabel, 'Fourth quarter 2026')
  assert.equal(q4.periodEnd, '2026-12-31')
  const q1 = computeObservation(new Map([['2026-01', 1]]), 'level', 'X', 'quarterly')
  assert.equal(q1.periodLabel, 'First quarter 2026')
  assert.equal(q1.periodEnd, '2026-03-31')
})

test('a quarterly series with an off-quarter date or unknown frequency is rejected', () => {
  assert.throws(
    () => computeObservation(new Map([['2026-05', 2]]), 'level', 'X', 'quarterly'),
    /not the start of a quarter/,
  )
  assert.throws(
    () => computeObservation(new Map([['2026-04', 2]]), 'level', 'X', 'weekly'),
    /unsupported frequency/,
  )
})

test('monthly level stays labeled by month by default', () => {
  const result = computeObservation(new Map([['2026-09', 3.5]]), 'level', 'ATLA013URN')
  assert.equal(result.periodLabel, 'September 2026')
  assert.equal(result.periodEnd, '2026-09-30')
})

test('refreshFredStatistics passes a binding frequency through', async () => {
  const recorded = []
  const results = await refreshFredStatistics({
    statistics: [
      { statistic_key: 'q', source_reference: { provider: 'fred', series_id: 'DRCLACBS', transform: 'level', frequency: 'quarterly' } },
    ],
    apiKey: KEY,
    fetchImpl: async () => okResponse({ observations: [{ date: '2026-04-01', value: '2.62' }, { date: '2026-01-01', value: '2.64' }] }),
    record: async (args) => {
      recorded.push(args)
      return { observation_id: 'o', status: 'staged' }
    },
  })
  assert.equal(results[0].outcome, 'staged')
  assert.equal(recorded[0].period_label, 'Second quarter 2026')
})
