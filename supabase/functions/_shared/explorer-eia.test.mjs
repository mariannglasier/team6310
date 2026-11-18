// Run with: node --test supabase/functions/_shared/explorer-eia.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildRetailPriceUrl,
  computeRetailPrice,
  fetchRetailPrice,
  refreshEiaStatistics,
} from './explorer-eia.mjs'

const KEY = 'EIASECRET1234567890'
const FACETS = { stateId: 'GA', sectorId: 'RES' }
const BINDING = {
  provider: 'eia',
  route: 'electricity/retail-sales',
  field: 'price',
  facets: { stateid: 'GA', sectorid: 'RES' },
}

const row = (period, price, extra = {}) => ({
  period,
  stateid: 'GA',
  stateDescription: 'Georgia',
  sectorid: 'RES',
  sectorName: 'residential',
  price,
  'price-units': 'cents per kilowatt-hour',
  ...extra,
})
// Shape of the EIA v2 response: newest first, price as a string.
const payload = (rows) => ({ response: { total: String(rows.length), data: rows } })
const ok = (body) => ({ ok: true, status: 200, json: async () => body })

test('buildRetailPriceUrl requests monthly GA residential price, newest first', () => {
  const url = buildRetailPriceUrl({ ...FACETS, apiKey: KEY })
  assert.equal(url.origin + url.pathname, 'https://api.eia.gov/v2/electricity/retail-sales/data/')
  assert.equal(url.searchParams.get('frequency'), 'monthly')
  assert.equal(url.searchParams.get('data[0]'), 'price')
  assert.equal(url.searchParams.get('facets[stateid][]'), 'GA')
  assert.equal(url.searchParams.get('facets[sectorid][]'), 'RES')
  assert.equal(url.searchParams.get('sort[0][column]'), 'period')
  assert.equal(url.searchParams.get('sort[0][direction]'), 'desc')
  assert.equal(url.searchParams.get('api_key'), KEY)
})

test('buildRetailPriceUrl rejects facet values that could alter the query', () => {
  assert.throws(() => buildRetailPriceUrl({ stateId: 'GA&x=1', sectorId: 'RES', apiKey: KEY }), /valid state and sector/)
  assert.throws(() => buildRetailPriceUrl({ stateId: 'GA', sectorId: undefined, apiKey: KEY }), /valid state and sector/)
})

test('computeRetailPrice uses the latest month with a price', () => {
  const result = computeRetailPrice(
    payload([row('2026-08', '14.53'), row('2026-07', '14.20'), row('2026-06', '13.9')]),
    FACETS,
  )
  assert.equal(result.value, 14.53)
  assert.equal(result.periodLabel, 'August 2026')
  assert.equal(result.periodStart, '2026-08-01')
  assert.equal(result.periodEnd, '2026-08-31')
  assert.equal(result.revisionKey, 'eia:GA:RES:2026-08:14.53')
})

test('computeRetailPrice skips a null or blank latest price without filling it', () => {
  const result = computeRetailPrice(
    payload([row('2026-09', null), row('2026-08', ''), row('2026-07', '14.20')]),
    FACETS,
  )
  assert.equal(result.value, 14.2)
  assert.equal(result.periodLabel, 'July 2026')
})

test('computeRetailPrice handles February in a leap year and numeric prices', () => {
  const result = computeRetailPrice(payload([row('2028-02', 15.1)]), FACETS)
  assert.equal(result.periodEnd, '2028-02-29')
  assert.equal(result.value, 15.1)
})

test('computeRetailPrice treats zero, negative and non-numeric prices as unusable', () => {
  for (const bad of ['0', '-3', 'N/A', '12abc', 'NaN']) {
    assert.throws(
      () => computeRetailPrice(payload([row('2026-08', bad)]), FACETS),
      /no month with a usable price/,
      bad,
    )
  }
})

test('computeRetailPrice rejects malformed or mismatched responses', () => {
  assert.throws(() => computeRetailPrice({}, FACETS), /no data array/)
  assert.throws(() => computeRetailPrice(null, FACETS), /no data array/)
  assert.throws(() => computeRetailPrice(payload([]), FACETS), /no month with a usable price/)
  assert.throws(
    () => computeRetailPrice(payload([row('Aug 2026', '14')]), FACETS),
    /unexpected period format/,
  )
  assert.throws(
    () => computeRetailPrice(payload([row('2026-13', '14')]), FACETS),
    /unexpected period format/,
  )
  assert.throws(
    () => computeRetailPrice(payload([row('2026-08', '14', { stateid: 'US' })]), FACETS),
    /does not match the requested state and sector/,
  )
  assert.throws(
    () => computeRetailPrice(payload([row('2026-08', '14', { sectorid: 'COM' })]), FACETS),
    /does not match the requested state and sector/,
  )
})

test('computeRetailPrice refuses a price that is not in cents per kilowatt-hour', () => {
  assert.throws(
    () => computeRetailPrice(payload([row('2026-08', '0.14', { 'price-units': 'dollars per kilowatt-hour' })]), FACETS),
    /not in cents per kilowatt-hour/,
  )
  assert.throws(
    () => computeRetailPrice(payload([row('2026-08', '14', { 'price-units': undefined })]), FACETS),
    /not in cents per kilowatt-hour/,
  )
  // Accepts the hyphenated and unhyphenated spellings.
  assert.equal(
    computeRetailPrice(payload([row('2026-08', '14', { 'price-units': 'cents per kilowatthour' })]), FACETS).value,
    14,
  )
})

test('fetchRetailPrice fails without a key and never leaks it on errors', async () => {
  await assert.rejects(
    fetchRetailPrice({ ...FACETS, apiKey: '', fetchImpl: async () => ok({}) }),
    /EIA_API_KEY is not configured/,
  )
  await assert.rejects(
    fetchRetailPrice({
      ...FACETS,
      apiKey: KEY,
      fetchImpl: async (url) => {
        throw new Error(`network down for ${url}`)
      },
    }),
    (error) => {
      assert.match(error.message, /EIA request failed/)
      assert.equal(error.message.includes(KEY), false)
      assert.match(error.message, /api_key=\[redacted\]|\[redacted\]/)
      return true
    },
  )
})

test('fetchRetailPrice reports HTTP and JSON failures without the key', async () => {
  await assert.rejects(
    fetchRetailPrice({ ...FACETS, apiKey: KEY, fetchImpl: async () => ({ ok: false, status: 403 }) }),
    (error) => {
      assert.equal(error.message, 'EIA responded with HTTP 403')
      return true
    },
  )
  await assert.rejects(
    fetchRetailPrice({
      ...FACETS,
      apiKey: KEY,
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new Error('bad') } }),
    }),
    /non-JSON/,
  )
})

test('refreshEiaStatistics records the latest price once per statistic', async () => {
  const calls = []
  const fetched = []
  const results = await refreshEiaStatistics({
    statistics: [{ statistic_key: 'ga_residential_electricity_price', source_reference: BINDING }],
    apiKey: KEY,
    fetchImpl: async (url) => {
      fetched.push(url)
      return ok(payload([row('2026-08', '14.53'), row('2026-07', '14.2')]))
    },
    record: async (args) => {
      calls.push(args)
      return { observation_id: 'o1', status: 'published' }
    },
  })
  assert.equal(fetched.length, 1)
  assert.equal(calls.length, 1)
  assert.deepEqual(
    { ...calls[0] },
    {
      statistic_key: 'ga_residential_electricity_price',
      value: 14.53,
      value_high: null,
      period_label: 'August 2026',
      period_start: '2026-08-01',
      period_end: '2026-08-31',
      revision_key: 'eia:GA:RES:2026-08:14.53',
      retrieval_method: 'api',
    },
  )
  assert.deepEqual(results, [
    { statistic_key: 'ga_residential_electricity_price', outcome: 'published', period: 'August 2026', value: 14.53 },
  ])
})

test('refreshEiaStatistics records nothing on failure and isolates statistics', async () => {
  const recorded = []
  const results = await refreshEiaStatistics({
    statistics: [
      { statistic_key: 'bad_route', source_reference: { ...BINDING, route: 'electricity/other' } },
      { statistic_key: 'wrong_provider', source_reference: { provider: 'fred', series_id: 'X' } },
      { statistic_key: 'no_key_leak', source_reference: BINDING },
      { statistic_key: 'good', source_reference: BINDING },
    ],
    apiKey: KEY,
    fetchImpl: (() => {
      let n = 0
      return async (url) => {
        n += 1
        if (n === 1) throw new Error(`boom ${url}`)
        return ok(payload([row('2026-08', '14.53')]))
      }
    })(),
    record: async (args) => {
      recorded.push(args.statistic_key)
      return { observation_id: 'o', status: 'staged' }
    },
  })
  assert.deepEqual(recorded, ['good'])
  assert.equal(results[0].outcome, 'error')
  assert.match(results[0].message, /not a supported EIA/)
  assert.equal(results[1].outcome, 'error')
  assert.equal(results[2].outcome, 'error')
  assert.equal(JSON.stringify(results).includes(KEY), false)
  assert.equal(results[3].outcome, 'staged')
})

test('refreshEiaStatistics surfaces a database rejection as an error result', async () => {
  const results = await refreshEiaStatistics({
    statistics: [{ statistic_key: 's', source_reference: BINDING }],
    apiKey: KEY,
    fetchImpl: async () => ok(payload([row('2026-08', '14.53')])),
    record: async () => {
      throw new Error('statistic is not active')
    },
  })
  assert.deepEqual(results, [{ statistic_key: 's', outcome: 'error', message: 'statistic is not active' }])
})
