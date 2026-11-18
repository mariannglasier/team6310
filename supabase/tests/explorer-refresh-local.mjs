// End-to-end check of the whole Explore Data refresh against a DISPOSABLE LOCAL
// Supabase database (the Docker container of a local `supabase start`) and the
// real FRED, EIA, Census and Fulton County APIs.
//
//   LOCAL_DB_CONTAINER=supabase_db_<project> \
//   FRED_API_KEY=... EIA_API_KEY=... CENSUS_API_KEY=... \
//   node supabase/tests/explorer-refresh-local.mjs
//
// The runner talks to the database through `docker exec ... psql` (as the
// database owner for the service role, and `set role anon` for visitors), so no
// local API keys are needed. It refuses any container that is not a local
// Supabase database. The script changes only the explorer tables of that local
// database.
//
// Checks (no staff approval is involved anywhere):
//   1. A dry run records nothing.
//   2. A real run publishes every value it could fetch, including the first
//      value of a statistic, with no staff actor.
//   3. Anonymous visitors read those values through the public RPC.
//   4. A second run (the source has nothing new) keeps every published value:
//      same observations, no new rows, last_checked_at moves forward.
//
// API keys come from the environment and are never printed.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { runExplorerRefresh } from '../functions/_shared/explorer-refresh.mjs'

const container = process.env.LOCAL_DB_CONTAINER ?? ''
const apiKeys = {
  fred: process.env.FRED_API_KEY ?? '',
  eia: process.env.EIA_API_KEY ?? '',
  census: process.env.CENSUS_API_KEY ?? '',
}

if (!/^supabase_db_[A-Za-z0-9_.-]+$/.test(container)) {
  throw new Error('Refusing to run: LOCAL_DB_CONTAINER must name a local supabase_db_* container')
}
if (!apiKeys.fred || !apiKeys.eia || !apiKeys.census) {
  throw new Error('FRED_API_KEY, EIA_API_KEY and CENSUS_API_KEY are required')
}

const quote = (value) =>
  value === null || value === undefined
    ? 'null'
    : typeof value === 'number'
      ? String(value)
      : `'${String(value).replaceAll("'", "''")}'`

function sql(statement, role) {
  const text = role ? `set role ${role};\n${statement}` : statement
  try {
    const out = execFileSync(
      'docker',
      ['exec', '-i', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tA'],
      { input: text, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    )
    const lines = out.split('\n').filter((line) => line && line !== 'SET')
    return lines.length ? JSON.parse(lines[lines.length - 1]) : null
  } catch (error) {
    const message = String(error.stderr ?? error.message).replace(/^.*ERROR:\s*/s, '').split('\n')[0]
    return { __error: message }
  }
}

// Just enough of the supabase-js surface for the shared runner and this script.
function query(table) {
  const conditions = []
  let columns = '*'
  let orderBy = ''
  const builder = {
    select(cols) {
      columns = cols
      return builder
    },
    eq(column, value) {
      const expression = column.replace(/->>([A-Za-z_]+)/, "->>'$1'")
      conditions.push(`${expression} = ${quote(value)}`)
      return builder
    },
    order(column) {
      orderBy = ` order by ${column}`
      return builder
    },
    then(resolve, reject) {
      const where = conditions.length ? ` where ${conditions.join(' and ')}` : ''
      const result = sql(
        `select coalesce(jsonb_agg(t), '[]'::jsonb) from (select ${columns} from public.${table}${where}${orderBy}) t;`,
      )
      const settled = result?.__error ? { data: null, error: { message: result.__error } } : { data: result, error: null }
      return Promise.resolve(settled).then(resolve, reject)
    },
  }
  return builder
}

function makeClient(role) {
  return {
    from: query,
    async rpc(name, args = {}) {
      const named = Object.entries(args)
        .map(([key, value]) => `${key} => ${quote(value)}`)
        .join(', ')
      const result = sql(
        `select coalesce(jsonb_agg(t), '[]'::jsonb) from public.${name}(${named}) t;`,
        role,
      )
      return result?.__error ? { data: null, error: { message: result.__error } } : { data: result, error: null }
    },
  }
}

const service = makeClient(null)
const anon = makeClient('anon')

const step = (name) => console.log(`- ${name}`)
const run = (extra = {}) => runExplorerRefresh({ client: service, apiKeys, fetchImpl: fetch, ...extra })

async function all(table, columns) {
  const { data, error } = await service.from(table).select(columns).order('statistic_key')
  assert.equal(error, null, error?.message)
  return data
}
const observations = () =>
  all('explorer_statistic_observations', 'observation_id, statistic_key, status, value, period_label, published_by, published_at')
const statistics = () => all('explorer_statistics', 'statistic_key, category_key, last_checked_at, active')

step('dry run fetches and computes but records nothing')
const beforeRows = (await observations()).length
const dry = await run({ dryRun: true })
assert.equal((await observations()).length, beforeRows, 'a dry run recorded rows')
assert.ok(dry.length > 0)

step('a real run publishes every value it could fetch')
const publishedBefore = new Map(
  (await observations()).filter((o) => o.status === 'published').map((o) => [o.statistic_key, o.observation_id]),
)
const first = await run()
const failed = first.filter((r) => r.outcome === 'error')
const fetched = first.filter((r) => r.outcome !== 'error')
console.log(`  fetched ${fetched.length} of ${first.length} statistics`)
for (const r of failed) console.log(`  FAILED ${r.statistic_key}: ${r.message}`)
assert.equal(failed.length, 0, 'some statistics could not be fetched')
for (const r of fetched) {
  assert.equal(r.outcome, 'published', `${r.statistic_key} was ${r.outcome}, not published`)
}

const afterFirst = await observations()
const published = new Map(afterFirst.filter((o) => o.status === 'published').map((o) => [o.statistic_key, o]))
for (const r of fetched) {
  const row = published.get(r.statistic_key)
  assert.ok(row, `${r.statistic_key} has no published value`)
  if (!publishedBefore.has(r.statistic_key)) {
    assert.equal(row.published_by, null, `${r.statistic_key} first value was published by a person`)
  }
}
assert.equal(
  afterFirst.filter((o) => o.status === 'staged').length,
  0,
  'values were left staged',
)

step('anonymous visitors read the published values')
const categories = ['housing', 'food', 'employment', 'clothing', 'youth', 'finances']
const visible = new Map()
for (const category of categories) {
  const { data, error } = await anon.rpc('get_explorer_category_statistics', { p_category_key: category })
  assert.equal(error, null, error?.message)
  for (const row of data) visible.set(row.statistic_key, row)
}
for (const r of fetched) assert.ok(visible.has(r.statistic_key), `${r.statistic_key} is not visible to visitors`)
for (const r of fetched.slice(0, 3)) console.log(`  ${r.statistic_key}: ${r.value} (${r.period})`)

step('a second run keeps every published value when the source has nothing new')
const statsBefore = new Map((await statistics()).map((s) => [s.statistic_key, s.last_checked_at]))
await new Promise((resolve) => setTimeout(resolve, 1100))
const second = await run()
assert.equal(second.filter((r) => r.outcome === 'error').length, 0)
const afterSecond = await observations()
assert.equal(afterSecond.length, afterFirst.length, 'a repeat check created rows')
const publishedAgain = new Map(afterSecond.filter((o) => o.status === 'published').map((o) => [o.statistic_key, o.observation_id]))
for (const [key, row] of published) assert.equal(publishedAgain.get(key), row.observation_id, `${key} changed on a repeat run`)
for (const s of await statistics()) {
  if (fetched.some((r) => r.statistic_key === s.statistic_key)) {
    assert.ok(new Date(s.last_checked_at) > new Date(statsBefore.get(s.statistic_key) ?? 0), `${s.statistic_key} last_checked_at did not move`)
  }
}

console.log('explorer refresh: all checks passed')
