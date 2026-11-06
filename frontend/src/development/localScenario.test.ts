import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createLocalScenarioService } from './localScenario'
import { LOCAL_SCENARIO_ID, LOCAL_VERSION_ID } from './loadLocalScenario'
import { localScenario } from './scenarioTestFixture'

const { client, loadContent } = vi.hoisted(() => ({
  client: {
    auth: { getUser: vi.fn(), getSession: vi.fn() },
    rpc: vi.fn(),
    from: vi.fn(),
  },
  loadContent: vi.fn(),
}))
vi.mock('../services/supabase', () => ({
  getSupabaseClient: async () => client,
}))
vi.mock('./loadLocalScenario', async (original) => ({
  ...(await original<typeof import('./loadLocalScenario')>()),
  loadLocalScenario: loadContent,
}))
const run = {
  playthrough_id: 'run',
  owner_user_id: 'owner',
  persona_id: 'persona',
  version_id: LOCAL_VERSION_ID,
  current_scenario_id: LOCAL_SCENARIO_ID,
  current_day: 4,
  current_balance: '225.00',
  cac_support_enabledabled: false,
  status: 'active',
  started_at: null,
  session_id: null,
  current_job_id: null,
  employment_state: null,
}
function payload() {
  return {
    run,
    persona: {
      persona_id: 'persona',
      version_id: LOCAL_VERSION_ID,
      name: 'Alex',
      description: null,
    },
    response_count: 1,
    response_text: 'Saved server response',
    response: {
      playthrough_id: 'run',
      version_id: LOCAL_VERSION_ID,
      choice_id: 'receive',
      balance_change_applied: '25.00',
      balance_after: '225.00',
    },
  }
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:55321')
  loadContent.mockResolvedValue(localScenario)
  client.auth.getUser.mockResolvedValue({
    data: { user: { id: 'owner', is_anonymous: true } },
    error: null,
  })
  client.auth.getSession.mockResolvedValue({
    data: { session: {} },
    error: null,
  })
  client.from.mockImplementation((table) => {
    expect(table).toBe('playthroughs') // Locator only; no separate response/run reads.
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: async () => ({
        data: { playthrough_id: 'run' },
        error: null,
      }),
    }
    return chain
  })
  client.rpc.mockResolvedValue({ data: payload(), error: null })
})
afterEach(() => vi.unstubAllEnvs())
it('restores run and response from one RPC rather than separate row reads', async () => {
  const service = createLocalScenarioService()
  await service.load()
  const result = await service.restore()
  expect(client.rpc).toHaveBeenCalledExactlyOnceWith(
    'restore_scenario_decision',
    { p_run_id: 'run', p_scenario_id: LOCAL_SCENARIO_ID },
  )
  expect(client.from).toHaveBeenCalledOnce()
  expect(result?.run.currentBalance).toBe(22500)
  expect(result?.decision?.balanceAfter).toBe(22500)
  expect(result?.responseText).toBe('Saved server response')
})
it('rejects an inaccessible run snapshot', async () => {
  client.rpc.mockResolvedValue({ data: null, error: null })
  const service = createLocalScenarioService()
  await service.load()
  await expect(service.restore()).rejects.toThrow('Unexpected scenario run')
})
it('rejects multiple saved decisions', async () => {
  client.rpc.mockResolvedValue({
    data: { ...payload(), response_count: 2 },
    error: null,
  })
  const service = createLocalScenarioService()
  await service.load()
  await expect(service.restore()).rejects.toThrow(
    'Invalid saved decision count',
  )
})
it('propagates restore failure instead of substituting stale data', async () => {
  client.rpc.mockResolvedValue({ data: null, error: new Error('offline') })
  const service = createLocalScenarioService()
  await service.load()
  await expect(service.restore()).rejects.toThrow('offline')
})
