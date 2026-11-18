// Run with: node --test supabase/functions/_shared/explorer-socrata.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSocrataUrl,
  computeSocrataObservation,
  fetchSocrataRows,
  refreshSocrataStatistics,
} from './explorer-socrata.mjs'

const REF = {
  provider: 'socrata',
  domain: 'sharefulton.fultoncountyga.gov',
  dataset_id: 'cbu2-qs5w',
  period_field: 'month',
  value_field: 'filings',
}
// Shape copied from the live endpoint on November 17, 2026: newest first, count as a string.
const rows = (...pairs) => pairs.map(([month, filings]) => ({ month, filings }))
const live = rows(['2026-10', '3095'], ['2026-09', '3099'], ['2026-08', '3491'])
const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body })

test('buildSocrataUrl requests the newest months of the two named fields', () => {
  const url = buildSocrataUrl(REF)
  assert.equal(url.origin + url.pathname, 'https://sharefulton.fultoncountyga.gov/resource/cbu2-qs5w.json')
  assert.equal(url.searchParams.get('$select'), 'month,filings')
  assert.equal(url.searchParams.get('$order'), 'month DESC')
  assert.equal(url.searchParams.get('$limit'), '24')
})

test('buildSocrataUrl refuses other hosts and unsafe values', () => {
  assert.throws(() => buildSocrataUrl({ ...REF, domain: 'evil.example.com' }), /not a supported Socrata binding/)
  assert.throws(() => buildSocrataUrl({ ...REF, domain: 'sharefulton.fultoncountyga.gov@evil.com' }), /not a supported/)
  assert.throws(() => buildSocrataUrl({ ...REF, provider: 'census' }), /not a supported Socrata binding/)
  assert.throws(() => buildSocrataUrl({ ...REF, dataset_id: '../etc' }), /invalid dataset_id/)
  assert.throws(() => buildSocrataUrl({ ...REF, value_field: 'filings,secret' }), /invalid value_field/)
  assert.throws(() => buildSocrataUrl({ ...REF, period_field: 'a b' }), /invalid period_field/)
})

test('computeSocrataObservation uses the latest month', () => {
  const result = computeSocrataObservation(live, REF)
  assert.equal(result.value, 3095)
  assert.equal(result.periodLabel, 'October 2026')
  assert.equal(result.periodStart, '2026-10-01')
  assert.equal(result.periodEnd, '2026-10-31')
  assert.equal(result.revisionKey, 'socrata:cbu2-qs5w:2026-10:3095')
})

test('computeSocrataObservation does not depend on row order', () => {
  const result = computeSocrataObservation([...live].reverse(), REF)
  assert.equal(result.periodLabel, 'October 2026')
})

test('a revised count changes the revision key', () => {
  const a = computeSocrataObservation(rows(['2026-10', '3095']), REF).revisionKey
  const b = computeSocrataObservation(rows(['2026-10', '3101']), REF).revisionKey
  assert.notEqual(a, b)
})

test('a missing latest count is skipped, never recorded as zero', () => {
  const result = computeSocrataObservation(
    [{ month: '2026-11' }, { month: '2026-10', filings: null }, { month: '2026-09', filings: '3099' }],
    REF,
  )
  assert.equal(result.value, 3099)
  assert.equal(result.periodLabel, 'September 2026')
})

test('non-integer, negative and text counts are unusable', () => {
  for (const bad of ['3095.5', '-4', 'N/A', '12abc', '', '1e3']) {
    assert.throws(
      () => computeSocrataObservation(rows(['2026-10', bad]), REF),
      /no month with a usable count/,
      bad,
    )
  }
})

test('a genuine zero is a real count', () => {
  assert.equal(computeSocrataObservation(rows(['2026-10', '0']), REF).value, 0)
})

test('February in a leap year ends on the 29th', () => {
  assert.equal(computeSocrataObservation(rows(['2028-02', '100']), REF).periodEnd, '2028-02-29')
})

test('malformed or conflicting responses are rejected', () => {
  assert.throws(() => computeSocrataObservation({}, REF), /not a list of rows/)
  assert.throws(() => computeSocrataObservation(null, REF), /not a list of rows/)
  assert.throws(() => computeSocrataObservation([], REF), /no month with a usable count/)
  assert.throws(() => computeSocrataObservation(rows(['Oct 2026', '1']), REF), /unexpected period format/)
  assert.throws(() => computeSocrataObservation(rows(['2026-13', '1']), REF), /unexpected period format/)
  assert.throws(() => computeSocrataObservation([{ filings: '1' }], REF), /unexpected period format/)
  assert.throws(
    () => computeSocrataObservation(rows(['2026-10', '3095'], ['2026-10', '3000']), REF),
    /conflicting rows for 2026-10/,
  )
  // An exact duplicate is harmless.
  assert.equal(computeSocrataObservation(rows(['2026-10', '3095'], ['2026-10', '3095']), REF).value, 3095)
})

test('fetchSocrataRows reports redirects, HTTP errors, bad JSON and network failures', async () => {
  await assert.rejects(fetchSocrataRows({ ref: REF, fetchImpl: async () => reply(302) }), /redirected/)
  await assert.rejects(fetchSocrataRows({ ref: REF, fetchImpl: async () => reply(503) }), /HTTP 503/)
  await assert.rejects(
    fetchSocrataRows({ ref: REF, fetchImpl: async () => ({ status: 200, ok: true, json: async () => { throw new Error('x') } }) }),
    /non-JSON/,
  )
  await assert.rejects(
    fetchSocrataRows({ ref: REF, fetchImpl: async () => { throw new Error('socket closed') } }),
    /Socrata request failed: socket closed/,
  )
  let init
  await fetchSocrataRows({ ref: REF, fetchImpl: async (_u, o) => { init = o; return reply(200, live) } })
  assert.equal(init.redirect, 'manual')
})

test('refreshSocrataStatistics records the latest month and isolates failures', async () => {
  const recorded = []
  const results = await refreshSocrataStatistics({
    statistics: [
      { statistic_key: 'fulton_eviction_filings', source_reference: REF },
      { statistic_key: 'wrong_host', source_reference: { ...REF, domain: 'evil.example.com' } },
      { statistic_key: 'empty', source_reference: REF },
    ],
    fetchImpl: (() => {
      let n = 0
      return async () => (++n === 1 ? reply(200, live) : reply(200, []))
    })(),
    record: async (args) => {
      recorded.push(args)
      return { observation_id: 'o', status: 'staged' }
    },
  })
  assert.deepEqual(
    { ...recorded[0] },
    {
      statistic_key: 'fulton_eviction_filings',
      value: 3095,
      value_high: null,
      period_label: 'October 2026',
      period_start: '2026-10-01',
      period_end: '2026-10-31',
      revision_key: 'socrata:cbu2-qs5w:2026-10:3095',
      retrieval_method: 'api',
    },
  )
  assert.equal(recorded.length, 1)
  assert.deepEqual(results.map((r) => r.outcome), ['staged', 'error', 'error'])
  assert.match(results[1].message, /not a supported Socrata binding/)
})

test('refreshSocrataStatistics reports a database rejection as an error', async () => {
  const results = await refreshSocrataStatistics({
    statistics: [{ statistic_key: 's', source_reference: REF }],
    fetchImpl: async () => reply(200, live),
    record: async () => { throw new Error('statistic is not active') },
  })
  assert.deepEqual(results, [{ statistic_key: 's', outcome: 'error', message: 'statistic is not active' }])
})
