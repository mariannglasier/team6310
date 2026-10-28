import { beforeEach, expect, it, vi } from 'vitest'
import {
  contentService,
  ContentUnavailableError,
  parseUsdCents,
  toJob,
  toPersona,
  toStatistic,
} from './contentService'

const { getSupabaseClient } = vi.hoisted(() => ({ getSupabaseClient: vi.fn() }))
vi.mock('./supabase', () => ({ getSupabaseClient }))

const personaRow = {
  persona_id: 'p1',
  version_id: 'v1',
  name: 'Alex',
  description: 'Alex description',
  general_starting_balance: 350,
  weekly_income: 0,
  starting_job_id: null,
}
const jobRow = {
  job_id: 'j1',
  version_id: 'v1',
  soc_code: '35-3023',
  title: 'Fast Food Worker',
  description: 'Counter service',
  area_name: 'Atlanta-Sandy Springs-Roswell, GA',
  wage_year: 2025,
  median_hourly_wage: 13.36,
  hours_per_week: '30.00',
  weekly_gross_income: 400.8,
  wage_source_url: 'https://data.bls.gov/timeseries/OEUM001206000000035302308',
  simulation_requirements: { notes: 'Shift variability', schedule: 'x' },
}
const statisticRow = {
  statistic_id: 'stat1',
  version_id: 'v1',
  description: 'Households below the poverty line',
  value: '0.125',
  unit: 'proportion',
  category: 'Community context',
  display_text: 'Poverty rate',
  visualization_type: null,
  visualization_config: {},
  geography: 'Fulton County, Georgia',
  data_period: '2024',
  source_url: 'https://example.test/statistic',
}

it.each([
  [13.36, 1336],
  [0.29, 29],
  [1200, 120000],
  ['400.80', 40080],
  ['0.5', 50],
  [-5.25, -525],
])('parses %s as %i cents without floating-point drift', (input, cents) => {
  expect(parseUsdCents(input, 'x')).toBe(cents)
})

it.each([null, undefined, '', 'abc', '1.234', NaN, 1.005])(
  'rejects invalid money %s',
  (input) => {
    expect(() => parseUsdCents(input, 'x')).toThrow()
  },
)

it('maps an unemployed persona with starting money in cents', () => {
  expect(toPersona(personaRow)).toEqual({
    id: 'p1',
    versionId: 'v1',
    name: 'Alex',
    description: 'Alex description',
    startingBalance: 35000,
  })
})

it('rejects personas that start employed or with income', () => {
  expect(() => toPersona({ ...personaRow, starting_job_id: 'j1' })).toThrow()
  expect(() => toPersona({ ...personaRow, weekly_income: 100 })).toThrow()
})

it('maps a job using the database-generated weekly income', () => {
  expect(toJob(jobRow)).toMatchObject({
    socCode: '35-3023',
    hoursPerWeek: 30,
    medianHourlyWage: 1336,
    weeklyGrossIncome: 40080,
    wageYear: 2025,
    requirementsNote: 'Shift variability',
  })
})

it('rejects jobs without a wage or year', () => {
  expect(() => toJob({ ...jobRow, median_hourly_wage: null })).toThrow()
  expect(() => toJob({ ...jobRow, wage_year: null })).toThrow()
  expect(() => toJob({ ...jobRow, weekly_gross_income: null })).toThrow()
})

it('maps statistic values and keeps visualization metadata as placeholders', () => {
  expect(toStatistic(statisticRow)).toEqual({
    id: 'stat1',
    versionId: 'v1',
    description: 'Households below the poverty line',
    value: 0.125,
    unit: 'proportion',
    category: 'Community context',
    displayText: 'Poverty rate',
    visualizationType: null,
    visualizationConfig: {},
    geography: 'Fulton County, Georgia',
    dataPeriod: '2024',
    sourceUrl: 'https://example.test/statistic',
  })
})

it.each([null, 'not a number', Infinity])(
  'rejects invalid statistic value %s',
  (value) => {
    expect(() => toStatistic({ ...statisticRow, value })).toThrow()
  },
)

function fakeClient(tables: Record<string, { data: unknown; error: unknown }>) {
  const calls: Record<string, unknown[]> = {}
  const client = {
    from(table: string) {
      const builder: Record<string, unknown> = {}
      const chain =
        (name: string) =>
        (...args: unknown[]) => {
          ;(calls[table] ??= []).push([name, ...args])
          return builder
        }
      for (const name of ['select', 'eq', 'order', 'limit', 'in'])
        builder[name] = chain(name)
      builder.then = (resolve: (value: unknown) => unknown) =>
        resolve(tables[table])
      return builder
    },
  }
  return { client, calls }
}

beforeEach(() => vi.resetAllMocks())

it('loads households pinned to the newest published version', async () => {
  const { client, calls } = fakeClient({
    content_versions: {
      data: [{ version_id: 'v1', version_number: 1 }],
      error: null,
    },
    personas: { data: [personaRow], error: null },
  })
  getSupabaseClient.mockResolvedValue(client)
  const households = await contentService.loadHouseholds()
  expect(households).toMatchObject({ versionId: 'v1', versionNumber: 1 })
  expect(households?.personas).toHaveLength(1)
  expect(calls.personas).toContainEqual(['eq', 'version_id', 'v1'])
  // The household step never reads jobs, and never selects every column.
  expect(calls.jobs).toBeUndefined()
  expect(JSON.stringify(calls)).not.toContain('"*"')
})

it('loads jobs only for the pinned version', async () => {
  const { client, calls } = fakeClient({
    jobs: { data: [jobRow], error: null },
  })
  getSupabaseClient.mockResolvedValue(client)
  const jobs = await contentService.loadJobs('v1')
  expect(jobs).toHaveLength(1)
  expect(calls.jobs).toContainEqual(['eq', 'version_id', 'v1'])
  expect(JSON.stringify(calls)).not.toContain('"*"')
})

it('loads only statistics linked to a scenario in the pinned edition', async () => {
  const { client, calls } = fakeClient({
    scenario_statistics: {
      data: [
        { statistic_id: 'stat1', fact_role: 'general' },
        { statistic_id: 'stat2', fact_role: 'cac' },
      ],
      error: null,
    },
    statistics: {
      data: [statisticRow, { ...statisticRow, statistic_id: 'stat2' }],
      error: null,
    },
  })
  getSupabaseClient.mockResolvedValue(client)
  const facts = await contentService.loadScenarioStatistics('scenario1', 'v1')
  expect(facts).toHaveLength(2)
  expect(facts[0]).toMatchObject({
    id: 'stat1',
    value: 0.125,
    factRole: 'general',
  })
  expect(facts[1]).toMatchObject({ id: 'stat2', factRole: 'cac' })
  expect(calls.scenario_statistics).toContainEqual([
    'eq',
    'scenario_id',
    'scenario1',
  ])
  expect(calls.scenario_statistics).toContainEqual(['eq', 'version_id', 'v1'])
  expect(calls.statistics).toContainEqual(['eq', 'version_id', 'v1'])
  expect(calls.statistics).toContainEqual([
    'in',
    'statistic_id',
    ['stat1', 'stat2'],
  ])
  expect(JSON.stringify(calls)).not.toContain('"*"')
})

it('returns no facts without querying statistics when a scenario has no links', async () => {
  const { client, calls } = fakeClient({
    scenario_statistics: { data: [], error: null },
  })
  getSupabaseClient.mockResolvedValue(client)
  expect(
    await contentService.loadScenarioStatistics('scenario1', 'v1'),
  ).toEqual([])
  expect(calls.statistics).toBeUndefined()
})

it('resolves null when no edition is published', async () => {
  getSupabaseClient.mockResolvedValue(
    fakeClient({ content_versions: { data: [], error: null } }).client,
  )
  expect(await contentService.loadHouseholds()).toBeNull()
})

it('hides database and validation detail behind a safe error', async () => {
  getSupabaseClient.mockResolvedValue(
    fakeClient({
      content_versions: {
        data: null,
        error: { message: 'relation secret_table does not exist' },
      },
    }).client,
  )
  const failure = contentService.loadHouseholds()
  await expect(failure).rejects.toBeInstanceOf(ContentUnavailableError)
  await expect(failure).rejects.not.toThrow(/secret_table/)

  getSupabaseClient.mockResolvedValue(
    fakeClient({
      content_versions: {
        data: [{ version_id: 'v1', version_number: 1 }],
        error: null,
      },
      personas: { data: [{ ...personaRow, weekly_income: 5 }], error: null },
    }).client,
  )
  await expect(contentService.loadHouseholds()).rejects.toBeInstanceOf(
    ContentUnavailableError,
  )
})

it('reports missing Supabase configuration as a safe error', async () => {
  getSupabaseClient.mockRejectedValue(
    new Error('Missing Supabase environment variables'),
  )
  await expect(contentService.loadHouseholds()).rejects.toThrow(
    'Unable to load approved content',
  )
})
