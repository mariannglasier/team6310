// Run with: node --test supabase/functions/_shared/explorer-census.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildCensusUrl,
  computeCensusObservation,
  fetchCensusObservation,
  parseCell,
  refreshCensusStatistics,
} from './explorer-census.mjs'

const KEY = 'CENSUSKEY0123456789abcdef0123456789ab'
const NOW = new Date('2026-11-17T12:00:00Z')

const ACS = {
  provider: 'census',
  dataset: 'acs/acs5/subject',
  variable: 'S1701_C03_001E',
  moe_variable: 'S1701_C03_001M',
  geography: { for: 'place:68516', in: 'state:13' },
  expected_name: 'Sandy Springs city, Georgia',
  expect: 'percent',
}
const SAIPE = {
  provider: 'census',
  dataset: 'timeseries/poverty/saipe',
  variable: 'SAEPOVRT0_17_PT',
  lower_variable: 'SAEPOVRT0_17_LB90',
  upper_variable: 'SAEPOVRT0_17_UB90',
  geography: { for: 'county:121', in: 'state:13' },
  expected_name: 'Fulton County',
  expect: 'percent',
}

// Shapes copied from the live API on November 17, 2026.
const acsBody = (poverty = '8.5', moe = '1.2') => [
  ['NAME', 'S1701_C03_001E', 'S1701_C03_001M', 'state', 'place'],
  ['Sandy Springs city, Georgia', poverty, moe, '13', '68516'],
]
const saipeBody = (rate = '12.8', lb = '9.3', ub = '16.3', year = '2024') => [
  ['NAME', 'SAEPOVRT0_17_PT', 'SAEPOVRT0_17_LB90', 'SAEPOVRT0_17_UB90', 'time', 'state', 'county'],
  ['Fulton County', rate, lb, ub, year, '13', '121'],
]
const reply = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
})

test('buildCensusUrl differs by dataset and carries the key', () => {
  const acs = buildCensusUrl(ACS, 2024, KEY)
  assert.equal(acs.origin + acs.pathname, 'https://api.census.gov/data/2024/acs/acs5/subject')
  assert.equal(acs.searchParams.get('get'), 'NAME,S1701_C03_001E,S1701_C03_001M')
  assert.equal(acs.searchParams.get('for'), 'place:68516')
  assert.equal(acs.searchParams.get('in'), 'state:13')
  assert.equal(acs.searchParams.get('time'), null)
  assert.equal(acs.searchParams.get('key'), KEY)

  const saipe = buildCensusUrl(SAIPE, 2024, KEY)
  assert.equal(saipe.origin + saipe.pathname, 'https://api.census.gov/data/timeseries/poverty/saipe')
  assert.equal(saipe.searchParams.get('time'), '2024')
  assert.equal(saipe.searchParams.get('for'), 'county:121')
})

test('buildCensusUrl refuses unsupported or unsafe bindings', () => {
  assert.throws(() => buildCensusUrl({ ...ACS, dataset: 'acs/acs1' }, 2024, KEY), /not a supported Census binding/)
  assert.throws(() => buildCensusUrl({ ...ACS, provider: 'fred' }, 2024, KEY), /not a supported Census binding/)
  assert.throws(() => buildCensusUrl({ ...ACS, variable: 'X&key=1' }, 2024, KEY), /invalid variable/)
  assert.throws(() => buildCensusUrl({ ...ACS, moe_variable: 'a b' }, 2024, KEY), /invalid moe_variable/)
  assert.throws(
    () => buildCensusUrl({ ...ACS, geography: { for: 'place:*', in: 'state:13' } }, 2024, KEY),
    /valid geography/,
  )
  assert.throws(
    () => buildCensusUrl({ ...ACS, geography: { for: 'place:68516' } }, 2024, KEY),
    /valid geography/,
  )
  assert.throws(() => buildCensusUrl({ ...ACS, expected_name: '' }, 2024, KEY), /expected_name/)
})

test('parseCell accepts numbers and treats sentinels, nulls and text as missing', () => {
  assert.equal(parseCell('8.5'), 8.5)
  assert.equal(parseCell(0), 0)
  assert.equal(parseCell('0'), 0)
  for (const missing of ['-666666666', '-555555555', '-222222222', -1, null, undefined, '', '(X)', 'N', '12abc', 'NaN']) {
    assert.equal(parseCell(missing), null, String(missing))
  }
})

test('computeCensusObservation builds the ACS observation with its margin of error', () => {
  const result = computeCensusObservation(acsBody(), ACS, 2024)
  assert.equal(result.value, 8.5)
  assert.equal(result.periodLabel, '2020–2024 ACS 5-year estimate, margin of error ±1.2 percentage points')
  assert.equal(result.periodStart, '2020-01-01')
  assert.equal(result.periodEnd, '2024-12-31')
  assert.equal(result.revisionKey, 'census:acs/acs5/subject:S1701_C03_001E:place:68516:2024:8.5:1.2')
})

test('computeCensusObservation builds the SAIPE observation with its 90% interval', () => {
  const result = computeCensusObservation(saipeBody(), SAIPE, 2024)
  assert.equal(result.value, 12.8)
  assert.equal(result.periodLabel, '2024, 90% interval 9.3–16.3')
  assert.equal(result.periodStart, '2024-01-01')
  assert.equal(result.periodEnd, '2024-12-31')
  assert.match(result.revisionKey, /:2024:12\.8:9\.3:16\.3$/)
})

test('a revised margin of error or interval changes the revision key', () => {
  const a = computeCensusObservation(acsBody('8.5', '1.2'), ACS, 2024).revisionKey
  const b = computeCensusObservation(acsBody('8.5', '1.3'), ACS, 2024).revisionKey
  assert.notEqual(a, b)
})

test('a suppressed margin of error is left out of the label, not shown as a number', () => {
  const result = computeCensusObservation(acsBody('8.5', '-555555555'), ACS, 2024)
  assert.equal(result.periodLabel, '2020–2024 ACS 5-year estimate')
  const odd = computeCensusObservation(saipeBody('12.8', '20.0', '10.0'), SAIPE, 2024)
  assert.equal(odd.periodLabel, '2024', 'an interval that excludes the estimate is not shown')
})

test('computeCensusObservation rejects a missing or suppressed estimate', () => {
  assert.throws(() => computeCensusObservation(acsBody('-666666666'), ACS, 2024), /missing or suppressed/)
  assert.throws(() => computeCensusObservation(acsBody(null), ACS, 2024), /missing or suppressed/)
  assert.throws(() => computeCensusObservation(acsBody('(X)'), ACS, 2024), /missing or suppressed/)
})

test('computeCensusObservation rejects a percent above 100', () => {
  assert.throws(() => computeCensusObservation(acsBody('120'), ACS, 2024), /not a valid percent/)
})

test('computeCensusObservation rejects the wrong area, code or year', () => {
  const wrongName = acsBody()
  wrongName[1][0] = 'Dunwoody city, Georgia'
  assert.throws(() => computeCensusObservation(wrongName, ACS, 2024), /instead of the expected area/)

  const wrongPlace = acsBody()
  wrongPlace[1][4] = '99999'
  assert.throws(() => computeCensusObservation(wrongPlace, ACS, 2024), /place code does not match/)

  const wrongCounty = saipeBody()
  wrongCounty[1][6] = '089'
  assert.throws(() => computeCensusObservation(wrongCounty, SAIPE, 2024), /county code does not match/)

  assert.throws(
    () => computeCensusObservation(saipeBody('12.8', '9.3', '16.3', '2023'), SAIPE, 2024),
    /year does not match/,
  )
})

test('computeCensusObservation rejects malformed bodies', () => {
  for (const bad of [null, {}, [], [['NAME']], [['NAME'], ['a'], ['b']], 'text']) {
    assert.throws(() => computeCensusObservation(bad, ACS, 2024), /header row plus exactly one data row/)
  }
  assert.throws(
    () => computeCensusObservation([['NAME', 'state', 'place'], ['Sandy Springs city, Georgia', '13', '68516']], ACS, 2024),
    /missing the S1701_C03_001E column/,
  )
})

test('fetchCensusObservation falls back past unreleased years (ACS 404, SAIPE 204)', async () => {
  const asked = []
  const acs = await fetchCensusObservation({
    ref: ACS,
    apiKey: KEY,
    now: NOW,
    fetchImpl: async (url) => {
      asked.push(new URL(url).pathname)
      return asked.length < 3 ? reply(404) : reply(200, acsBody())
    },
  })
  assert.deepEqual(asked, [
    '/data/2026/acs/acs5/subject',
    '/data/2025/acs/acs5/subject',
    '/data/2024/acs/acs5/subject',
  ])
  assert.equal(acs.value, 8.5)

  const years = []
  const saipe = await fetchCensusObservation({
    ref: SAIPE,
    apiKey: KEY,
    now: NOW,
    fetchImpl: async (url) => {
      const year = new URL(url).searchParams.get('time')
      years.push(year)
      return year === '2024' ? reply(200, saipeBody()) : reply(204)
    },
  })
  assert.deepEqual(years, ['2026', '2025', '2024'])
  assert.equal(saipe.value, 12.8)
})

test('fetchCensusObservation fails when no recent year is published', async () => {
  await assert.rejects(
    fetchCensusObservation({ ref: ACS, apiKey: KEY, now: NOW, fetchImpl: async () => reply(404) }),
    /no release found/,
  )
})

test('a rejected key is an error and never falls back to an older year', async () => {
  let calls = 0
  await assert.rejects(
    fetchCensusObservation({
      ref: ACS,
      apiKey: KEY,
      now: NOW,
      fetchImpl: async () => {
        calls += 1
        return reply(302)
      },
    }),
    /rejected the API key/,
  )
  assert.equal(calls, 1)
})

test('other failures are errors, not fallbacks, and never include the key', async () => {
  await assert.rejects(
    fetchCensusObservation({ ref: ACS, apiKey: KEY, now: NOW, fetchImpl: async () => reply(400) }),
    (error) => error.message === 'Census responded with HTTP 400',
  )
  await assert.rejects(
    fetchCensusObservation({ ref: ACS, apiKey: '', now: NOW, fetchImpl: async () => reply(200, acsBody()) }),
    /CENSUS_API_KEY is not configured/,
  )
  await assert.rejects(
    fetchCensusObservation({
      ref: ACS,
      apiKey: KEY,
      now: NOW,
      fetchImpl: async (url) => {
        throw new Error(`socket closed for ${url}`)
      },
    }),
    (error) => {
      assert.match(error.message, /Census request failed/)
      assert.equal(error.message.includes(KEY), false)
      return true
    },
  )
  await assert.rejects(
    fetchCensusObservation({
      ref: ACS,
      apiKey: KEY,
      now: NOW,
      fetchImpl: async () => ({ status: 200, ok: true, json: async () => { throw new Error('x') } }),
    }),
    /non-JSON/,
  )
})

test('requests do not follow redirects, so a key problem is visible', async () => {
  let init
  await fetchCensusObservation({
    ref: ACS,
    apiKey: KEY,
    now: new Date('2024-06-01T00:00:00Z'),
    fetchImpl: async (_url, options) => {
      init = options
      return reply(200, acsBody())
    },
  })
  assert.equal(init.redirect, 'manual')
})

test('refreshCensusStatistics records each statistic and isolates failures', async () => {
  const recorded = []
  const results = await refreshCensusStatistics({
    statistics: [
      { statistic_key: 'sandy_springs_poverty_rate', source_reference: ACS },
      { statistic_key: 'fulton_child_poverty_rate', source_reference: SAIPE },
      { statistic_key: 'bad_binding', source_reference: { provider: 'eia' } },
      { statistic_key: 'wrong_area', source_reference: { ...ACS, expected_name: 'Atlanta city, Georgia' } },
    ],
    apiKey: KEY,
    now: NOW,
    fetchImpl: async (url) => {
      const u = new URL(url)
      if (u.pathname.includes('saipe')) return u.searchParams.get('time') === '2024' ? reply(200, saipeBody()) : reply(204)
      return u.pathname.includes('/2024/') ? reply(200, acsBody()) : reply(404)
    },
    record: async (args) => {
      recorded.push(args)
      return { observation_id: 'o', status: 'staged' }
    },
  })
  assert.deepEqual(recorded.map((r) => r.statistic_key), ['sandy_springs_poverty_rate', 'fulton_child_poverty_rate'])
  assert.equal(recorded[0].retrieval_method, 'api')
  assert.equal(recorded[1].value, 12.8)
  assert.deepEqual(results.map((r) => r.outcome), ['staged', 'staged', 'error', 'error'])
  assert.match(results[2].message, /not a supported Census binding/)
  assert.match(results[3].message, /instead of the expected area/)
  assert.equal(JSON.stringify(results).includes(KEY), false)
})

test('refreshCensusStatistics reports a database rejection as an error', async () => {
  const results = await refreshCensusStatistics({
    statistics: [{ statistic_key: 's', source_reference: ACS }],
    apiKey: KEY,
    now: new Date('2024-06-01T00:00:00Z'),
    fetchImpl: async () => reply(200, acsBody()),
    record: async () => {
      throw new Error('statistic is not active')
    },
  })
  assert.deepEqual(results, [{ statistic_key: 's', outcome: 'error', message: 'statistic is not active' }])
})

// Summed rows: renters paying 30.0-34.9% plus 35.0%+ of income on rent (DP04).
const BURDEN = {
  provider: 'census',
  dataset: 'acs/acs5/profile',
  variable: 'DP04_0141PE',
  add_variables: ['DP04_0142PE'],
  moe_variable: 'DP04_0141PM',
  add_moe_variables: ['DP04_0142PM'],
  geography: { for: 'place:68516', in: 'state:13' },
  expected_name: 'Sandy Springs city, Georgia',
  expect: 'percent',
}
// Shape and values from the live API on November 17, 2026.
const burdenBody = (a = '11.4', am = '2.4', b = '33.3', bm = '3.3') => [
  ['NAME', 'DP04_0141PE', 'DP04_0142PE', 'DP04_0141PM', 'DP04_0142PM', 'state', 'place'],
  ['Sandy Springs city, Georgia', a, b, am, bm, '13', '68516'],
]

test('buildCensusUrl requests every summed variable once on the profile table', () => {
  const url = buildCensusUrl(BURDEN, 2024, KEY)
  assert.equal(url.origin + url.pathname, 'https://api.census.gov/data/2024/acs/acs5/profile')
  assert.equal(url.searchParams.get('get'), 'NAME,DP04_0141PE,DP04_0142PE,DP04_0141PM,DP04_0142PM')
  assert.equal(url.searchParams.get('time'), null)
})

test('summed estimates add exactly and combine margins of error', () => {
  const result = computeCensusObservation(burdenBody(), BURDEN, 2024)
  assert.equal(result.value, 44.7, 'no floating point noise')
  // sqrt(2.4^2 + 3.3^2) = 4.08 -> 4.1
  assert.equal(result.periodLabel, '2020–2024 ACS 5-year estimate, margin of error ±4.1 percentage points')
  assert.equal(
    result.revisionKey,
    'census:acs/acs5/profile:DP04_0141PE+DP04_0142PE:place:68516:2024:44.7:4.1',
  )
})

test('a summed estimate fails if any part is missing, and drops the margin if any margin is missing', () => {
  assert.throws(() => computeCensusObservation(burdenBody('-666666666'), BURDEN, 2024), /DP04_0141PE is missing or suppressed/)
  assert.throws(() => computeCensusObservation(burdenBody('11.4', '2.4', null), BURDEN, 2024), /DP04_0142PE is missing or suppressed/)
  const noMargin = computeCensusObservation(burdenBody('11.4', '2.4', '33.3', '-555555555'), BURDEN, 2024)
  assert.equal(noMargin.periodLabel, '2020–2024 ACS 5-year estimate')
  assert.equal(noMargin.value, 44.7)
})

test('a sum above 100 percent is rejected', () => {
  assert.throws(() => computeCensusObservation(burdenBody('60', '1', '60', '1'), BURDEN, 2024), /not a valid percent/)
})

test('summed-variable bindings are validated', () => {
  assert.throws(() => buildCensusUrl({ ...BURDEN, add_variables: 'DP04_0142PE' }, 2024, KEY), /invalid add_variables/)
  assert.throws(() => buildCensusUrl({ ...BURDEN, add_variables: ['a&b'] }, 2024, KEY), /invalid add_variables/)
  assert.throws(
    () => buildCensusUrl({ ...BURDEN, add_variables: ['A_1', 'A_2', 'A_3', 'A_4', 'A_5'] }, 2024, KEY),
    /invalid add_variables/,
  )
  assert.throws(() => buildCensusUrl({ ...BURDEN, add_moe_variables: [] }, 2024, KEY), /must match add_variables/)
})

// ---- ACS 1-year, whole United States (no `in` clause) ----------------------
const US_POVERTY = {
  provider: 'census',
  dataset: 'acs/acs1/subject',
  variable: 'S1701_C03_001E',
  moe_variable: 'S1701_C03_001M',
  geography: { for: 'us:1' },
  expected_name: 'United States',
  expect: 'percent',
}
// Shape copied from the live API on November 18, 2026.
const usBody = (poverty = '12.1', moe = '0.1') => [
  ['NAME', 'S1701_C03_001E', 'S1701_C03_001M', 'us'],
  ['United States', poverty, moe, '1'],
]

test('a U.S. 1-year binding sends no `in` clause and uses the acs1 path', () => {
  const url = buildCensusUrl(US_POVERTY, 2025, KEY)
  assert.equal(url.origin + url.pathname, 'https://api.census.gov/data/2025/acs/acs1/subject')
  assert.equal(url.searchParams.get('for'), 'us:1')
  assert.equal(url.searchParams.has('in'), false)
})

test('a 1-year observation is labeled by its single year', () => {
  const result = computeCensusObservation(usBody(), US_POVERTY, 2025)
  assert.equal(result.value, 12.1)
  assert.equal(result.periodLabel, '2025 ACS 1-year estimate, margin of error ±0.1 percentage points')
  assert.equal(result.periodStart, '2025-01-01')
  assert.equal(result.periodEnd, '2025-12-31')
  assert.match(result.revisionKey, /acs\/acs1\/subject/)
})

test('a 1-year observation still checks the returned area and geography code', () => {
  assert.throws(
    () => computeCensusObservation(usBody().map((row, i) => (i === 1 ? ['Puerto Rico', '12.1', '0.1', '1'] : row)), US_POVERTY, 2025),
    /instead of the expected area/,
  )
  assert.throws(
    () => computeCensusObservation(usBody().map((row, i) => (i === 1 ? ['United States', '12.1', '0.1', '2'] : row)), US_POVERTY, 2025),
    /us code does not match/,
  )
})

test('a malformed `in` clause is still refused, and `in` may be left out only when absent', () => {
  assert.throws(
    () => buildCensusUrl({ ...US_POVERTY, geography: { for: 'us:1', in: 'state' } }, 2025, KEY),
    /valid geography/,
  )
  assert.throws(() => buildCensusUrl({ ...US_POVERTY, geography: {} }, 2025, KEY), /valid geography/)
  assert.throws(
    () => buildCensusUrl({ ...US_POVERTY, geography: { for: 'us:2' } }, 2025, KEY),
    /valid geography/,
  )
})

test('the newest 1-year release is used and an unreleased year falls back one year', async () => {
  const calls = []
  const result = await fetchCensusObservation({
    ref: US_POVERTY,
    apiKey: KEY,
    now: NOW,
    fetchImpl: async (url) => {
      calls.push(new URL(url).pathname)
      return calls.length === 1 ? reply(404, null) : reply(200, usBody())
    },
  })
  assert.deepEqual(calls, ['/data/2026/acs/acs1/subject', '/data/2025/acs/acs1/subject'])
  assert.equal(result.periodLabel.startsWith('2025 ACS 1-year'), true)
})
