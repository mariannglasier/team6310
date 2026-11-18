// End-to-end check of the EIA refresh against a DISPOSABLE LOCAL Supabase stack.
// It refuses any non-local database URL and never touches hosted Supabase.
//
//   LOCAL_SUPABASE_URL=http://127.0.0.1:55321 \
//   LOCAL_SERVICE_ROLE_KEY=... LOCAL_ANON_KEY=... \
//   node supabase/tests/explorer-eia-local.mjs phase1
//   (staff approve the first value, e.g. via publish_explorer_observation)
//   node supabase/tests/explorer-eia-local.mjs phase2
//
// The EIA response is simulated in the real API's shape, so no key is needed.
// Add `EIA_API_KEY=...` and `EIA_LIVE=1` to phase1 to also run a dry run against
// the real EIA API (that step records nothing).
//
// Keys come from the environment and are never printed.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { runExplorerRefresh } from '../functions/_shared/explorer-refresh.mjs'

const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { createClient } = require('@supabase/supabase-js')

const url = process.env.LOCAL_SUPABASE_URL ?? ''
const serviceKey = process.env.LOCAL_SERVICE_ROLE_KEY ?? ''
const anonKey = process.env.LOCAL_ANON_KEY ?? ''
const liveKey = process.env.EIA_LIVE === '1' ? (process.env.EIA_API_KEY ?? '') : ''
const phase = process.argv[2]

if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url)) {
  throw new Error('Refusing to run: LOCAL_SUPABASE_URL must be a local http://127.0.0.1 or localhost URL')
}
if (!serviceKey || !anonKey) {
  throw new Error('LOCAL_SERVICE_ROLE_KEY and LOCAL_ANON_KEY are required')
}
if (process.env.EIA_LIVE === '1' && !liveKey) throw new Error('EIA_LIVE=1 needs EIA_API_KEY')

const opts = { auth: { persistSession: false, autoRefreshToken: false } }
const service = createClient(url, serviceKey, opts)
const anon = createClient(url, anonKey, opts)
const STAT = 'ga_residential_electricity_price'
const FAKE_KEY = 'LOCALFAKEEIAKEY0123456789'

const step = (name) => console.log(`- ${name}`)
const row = (period, price) => ({
  period,
  stateid: 'GA',
  stateDescription: 'Georgia',
  sectorid: 'RES',
  sectorName: 'residential',
  price,
  'price-units': 'cents per kilowatt-hour',
})
const respond = (rows) => async () => ({
  ok: true,
  status: 200,
  json: async () => ({ response: { total: String(rows.length), data: rows } }),
})
const run = (fetchImpl, { apiKeys = { eia: FAKE_KEY }, ...extra } = {}) =>
  runExplorerRefresh({ client: service, apiKeys, fetchImpl, ...extra })
const eiaResult = (results) => results.find((r) => r.statistic_key === STAT)

async function observations() {
  const { data, error } = await service
    .from('explorer_statistic_observations')
    .select('observation_id, status, value, period_label, published_by')
    .eq('statistic_key', STAT)
    .order('created_at')
  assert.equal(error, null, error?.message)
  return data
}
async function publicRows() {
  const { data, error } = await anon.rpc('get_explorer_category_statistics', {
    p_category_key: 'housing',
  })
  assert.equal(error, null, error?.message)
  return data.filter((r) => r.statistic_key === STAT)
}

if (phase === 'phase1') {
  assert.equal((await observations()).length, 0, 'phase1 needs a database with no electricity observations')

  if (liveKey) {
    step('LIVE dry run against the real EIA API records nothing')
    const live = eiaResult(
      await run(fetch, { apiKeys: { eia: liveKey }, dryRun: true }),
    )
    assert.equal(live.outcome, 'dry_run', JSON.stringify(live))
    assert.ok(live.value > 3 && live.value < 60, `implausible price ${live.value}`)
    assert.equal(JSON.stringify(live).includes(liveKey), false)
    console.log(`  ${live.period}: ${live.value} cents per kWh`)
    assert.equal((await observations()).length, 0)
  }

  step('first value stays staged and is not public (initial setup needs staff approval)')
  const first = eiaResult(await run(respond([row('2026-08', '14.53'), row('2026-07', '14.20')])))
  assert.equal(first.outcome, 'staged', JSON.stringify(first))
  assert.equal(first.value, 14.53)
  assert.equal((await observations()).length, 1)
  assert.equal((await publicRows()).length, 0)

  step('repeating the same data is idempotent')
  assert.equal(eiaResult(await run(respond([row('2026-08', '14.53')]))).outcome, 'staged')
  assert.equal((await observations()).length, 1)

  step('a dry run records nothing')
  assert.equal(
    eiaResult(await run(respond([row('2026-09', '15.00')]), { dryRun: true })).outcome,
    'dry_run',
  )
  assert.equal((await observations()).length, 1)

  step('a missing key fails only the EIA statistic and records nothing')
  const noKey = eiaResult(await run(respond([row('2026-09', '15.00')]), { apiKeys: {} }))
  assert.equal(noKey.outcome, 'error')
  assert.match(noKey.message, /EIA_API_KEY is not configured/)
  assert.equal((await observations()).length, 1)
  console.log('phase1 passed: approve the staged observation as staff, then run phase2')
} else if (phase === 'phase2') {
  step('visitors see the approved value with full provenance')
  const [pub] = await publicRows()
  assert.ok(pub, 'no public row after approval')
  assert.equal(pub.value, 14.53)
  assert.equal(pub.unit, 'cents_per_kwh')
  assert.equal(pub.is_derived, false)
  assert.equal(pub.period_label, 'August 2026')
  assert.match(pub.geography, /Georgia/)
  assert.match(pub.source_url, /^https:\/\//)
  assert.ok(pub.last_checked_at)
  assert.equal(Object.hasOwn(pub, 'source_reference'), false)

  step('the same data after approval stays published and adds no row')
  const count = (await observations()).length
  assert.equal(eiaResult(await run(respond([row('2026-08', '14.53')]))).outcome, 'published')
  assert.equal((await observations()).length, count)

  step('a newer month auto-publishes without staff approval')
  const newer = eiaResult(await run(respond([row('2026-09', '15.02'), row('2026-08', '14.53')])))
  assert.equal(newer.outcome, 'published', JSON.stringify(newer))
  let rows = await observations()
  const published = rows.filter((r) => r.status === 'published')
  assert.equal(published.length, 1)
  assert.equal(published[0].value, 15.02)
  assert.equal(published[0].published_by, null, 'automatic publish should have no staff actor')
  assert.ok(rows.some((r) => r.status === 'superseded'))
  assert.equal((await publicRows())[0].value, 15.02)

  step('an older period never replaces the published value')
  const older = eiaResult(await run(respond([row('2026-07', '14.20')])))
  assert.equal(older.outcome, 'staged', JSON.stringify(older))
  assert.equal((await publicRows())[0].value, 15.02)

  step('bad responses record nothing and keep the last published value')
  const total = (await observations()).length
  const cases = {
    'http error': async () => ({ ok: false, status: 503, json: async () => ({}) }),
    'wrong unit': respond([{ ...row('2026-10', '0.16'), 'price-units': 'dollars per kilowatt-hour' }]),
    'wrong state': respond([{ ...row('2026-10', '16'), stateid: 'US' }]),
    'null price': respond([row('2026-10', null)]),
    'no data': async () => ({ ok: true, status: 200, json: async () => ({}) }),
  }
  for (const [name, fetchImpl] of Object.entries(cases)) {
    const result = eiaResult(await run(fetchImpl))
    assert.equal(result.outcome, 'error', `${name}: ${JSON.stringify(result)}`)
    assert.equal(JSON.stringify(result).includes(FAKE_KEY), false)
  }
  rows = await observations()
  assert.equal(rows.length, total)
  assert.equal((await publicRows())[0].value, 15.02)
  console.log('phase2 passed')
} else {
  throw new Error('Usage: node explorer-eia-local.mjs phase1|phase2')
}
