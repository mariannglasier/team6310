// End-to-end check of the FRED refresh against a DISPOSABLE LOCAL Supabase stack
// and the real FRED API. It refuses any non-local database URL.
//
//   LOCAL_SUPABASE_URL=http://127.0.0.1:55321 \
//   LOCAL_SERVICE_ROLE_KEY=... LOCAL_ANON_KEY=... FRED_API_KEY=... \
//   node supabase/tests/explorer-fred-local.mjs phase1
//   (staff approve the first value, e.g. via publish_explorer_observation)
//   node supabase/tests/explorer-fred-local.mjs phase2
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
const fredKey = process.env.FRED_API_KEY ?? ''
const phase = process.argv[2]

if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url)) {
  throw new Error('Refusing to run: LOCAL_SUPABASE_URL must be a local http://127.0.0.1 or localhost URL')
}
if (!serviceKey || !anonKey || !fredKey) {
  throw new Error('LOCAL_SERVICE_ROLE_KEY, LOCAL_ANON_KEY and FRED_API_KEY are required')
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } }
const service = createClient(url, serviceKey, opts)
const anon = createClient(url, anonKey, opts)
const STAT = 'atl_food_beverage_cpi_change'

const step = (name) => console.log(`- ${name}`)
const run = (extra = {}) =>
  runExplorerRefresh({ client: service, apiKeys: { fred: fredKey }, fetchImpl: fetch, ...extra })

async function observations() {
  const { data, error } = await service
    .from('explorer_statistic_observations')
    .select('observation_id, status, value, period_label, revision_key, published_by')
    .eq('statistic_key', STAT)
    .order('created_at')
  assert.equal(error, null, error?.message)
  return data
}

async function publicRows() {
  const { data, error } = await anon.rpc('get_explorer_category_statistics', {
    p_category_key: 'food',
  })
  assert.equal(error, null, error?.message)
  return data.filter((row) => row.statistic_key === STAT)
}

if (phase === 'phase1') {
  step('dry run fetches and computes but records nothing')
  const before = (await observations()).length
  const [dry] = await run({ dryRun: true })
  assert.equal(dry.outcome, 'dry_run', JSON.stringify(dry))
  assert.ok(dry.value > -20 && dry.value < 40, `implausible value ${dry.value}`)
  assert.equal((await observations()).length, before)
  console.log(`  ${dry.period}: ${dry.value}%`)

  step('first real refresh stays staged (initial setup needs staff approval)')
  const [first] = await run()
  assert.equal(first.outcome, 'staged', JSON.stringify(first))

  step('repeating the check is idempotent')
  const [again] = await run()
  assert.equal(again.outcome, 'staged')
  assert.equal((await observations()).length, before + 1)

  step('staged data is not public')
  assert.equal((await publicRows()).length, 0)
  console.log('phase1 passed: approve the staged observation as staff, then run phase2')
} else if (phase === 'phase2') {
  step('unchanged data after approval stays published and adds no row')
  const count = (await observations()).length
  const [same] = await run()
  assert.equal(same.outcome, 'published', JSON.stringify(same))
  assert.equal((await observations()).length, count)

  step('visitors see the approved value with full provenance')
  const [row] = await publicRows()
  assert.ok(row, 'no public row after approval')
  assert.equal(row.unit, 'percent_change')
  assert.equal(row.is_derived, true)
  assert.match(row.period_label, / compared with /)
  assert.match(row.geography, /Atlanta/)
  assert.match(row.source_url, /^https:\/\//)
  assert.ok(row.derivation_note.includes('Missing months'))
  assert.ok(row.last_checked_at)
  assert.equal(Object.hasOwn(row, 'source_reference'), false)
  const approvedValue = row.value
  console.log(`  public: ${row.value}% (${row.period_label})`)

  step('a revised source value auto-publishes without staff approval')
  const revisedFetch = async (input, init) => {
    const response = await fetch(input, init)
    const body = await response.json()
    // Simulate FRED revising the latest comparable month upward.
    const latest = body.observations.find((o, i, all) =>
      o.value !== '.' && all.some((p) => p.value !== '.' && p.date === `${Number(o.date.slice(0, 4)) - 1}${o.date.slice(4)}`))
    latest.value = String(Number(latest.value) + 10)
    return { ok: true, status: 200, json: async () => body }
  }
  const [revised] = await run({ fetchImpl: revisedFetch })
  assert.equal(revised.outcome, 'published', JSON.stringify(revised))
  const rows = await observations()
  const published = rows.filter((r) => r.status === 'published')
  assert.equal(published.length, 1)
  assert.equal(published[0].published_by, null, 'automatic publish should have no staff actor')
  assert.ok(rows.some((r) => r.status === 'superseded'), 'previous value should be superseded')
  const [now] = await publicRows()
  assert.notEqual(now.value, approvedValue)
  console.log(`  public now: ${now.value}% (was ${approvedValue}%)`)

  step('a failed fetch records nothing and keeps the last published value')
  const total = (await observations()).length
  const [failed] = await run({
    fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }),
  })
  assert.equal(failed.outcome, 'error')
  assert.ok(!JSON.stringify(failed).includes(fredKey))
  assert.equal((await observations()).length, total)
  assert.equal((await publicRows())[0].value, now.value)
  console.log('phase2 passed')
} else {
  throw new Error('Usage: node explorer-fred-local.mjs phase1|phase2')
}
