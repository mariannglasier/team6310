import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  loadLocalScenario,
  LOCAL_SCENARIO_ID,
  LOCAL_VERSION_ID,
} from './loadLocalScenario'
const { getSupabaseClient } = vi.hoisted(() => ({ getSupabaseClient: vi.fn() }))
vi.mock('../services/supabase', () => ({ getSupabaseClient }))
const scenario = {
  scenario_id: LOCAL_SCENARIO_ID,
  version_id: LOCAL_VERSION_ID,
  default_day: 4,
  title: 'Database title',
  description: 'Database description',
  category_id: 'category',
  schedule_type: 'scheduled',
}
const choice = {
  choice_id: 'choice',
  scenario_id: LOCAL_SCENARIO_ID,
  version_id: LOCAL_VERSION_ID,
  choice_text: 'Database choice',
  response_text: 'Database response',
  balance_change: '25.00',
  next_scenario_id: null,
}
function mock(
  row: unknown = scenario,
  choices: unknown[] = [choice],
  error: unknown = null,
  choiceError: unknown = null,
) {
  const calls: string[][] = []
  getSupabaseClient.mockResolvedValue({
    from(table: string) {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn((...args: string[]) => {
          calls.push(args)
          return chain
        }),
        maybeSingle: async () => ({ data: row, error }),
        order: async () => ({ data: choices, error: choiceError }),
      }
      expect(['scenarios', 'choices']).toContain(table)
      return chain
    },
  })
  return calls
}
beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:55321')
  vi.clearAllMocks()
})
afterEach(() => vi.unstubAllEnvs())
it('reads matching-edition content, parses money, and accepts NULL next scenario', async () => {
  const calls = mock()
  const result = await loadLocalScenario()
  expect(result?.title).toBe('Database title')
  expect(result?.choices[0]).toMatchObject({
    text: 'Database choice',
    balanceChange: 2500,
    responseText: 'Database response',
  })
  expect(calls).toContainEqual(['scenario_id', LOCAL_SCENARIO_ID])
  expect(calls.filter((args) => args[0] === 'version_id')).toEqual([
    ['version_id', LOCAL_VERSION_ID],
    ['version_id', LOCAL_VERSION_ID],
  ])
})
it('returns missing scenario without substituting fixtures', async () => {
  mock(null)
  expect(await loadLocalScenario()).toBeNull()
})
it('preserves no choices', async () => {
  mock(scenario, [])
  expect((await loadLocalScenario())?.choices).toEqual([])
})
it.each(['scenario', 'choice'])('rejects %s read failure', async (source) => {
  mock(
    scenario,
    [choice],
    source === 'scenario' ? new Error('offline') : null,
    source === 'choice' ? new Error('offline') : null,
  )
  await expect(loadLocalScenario()).rejects.toThrow('offline')
})
it('rejects wrong-version choice', async () => {
  mock(scenario, [{ ...choice, version_id: 'wrong' }])
  await expect(loadLocalScenario()).rejects.toThrow('relationship')
})
it('rejects hosted targets before client access', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  await expect(loadLocalScenario()).rejects.toThrow('Local verification URL')
  expect(getSupabaseClient).not.toHaveBeenCalled()
})
