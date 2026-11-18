import { beforeEach, expect, it, vi } from 'vitest'
import { restoreScenario, submitScenario } from './scenarioGameplay'
import type { LoadedPlaythrough } from '../types/playthrough'
import { usdCents, type Scenario } from '../types/domain'
const { auth, rpc } = vi.hoisted(() => ({
  auth: { getUser: vi.fn(), signOut: vi.fn(), signInAnonymously: vi.fn() },
  rpc: vi.fn(),
}))
vi.mock('./supabase', () => ({
  getSupabaseClient: async () => ({ auth, rpc }),
}))
const expected = {
  id: 'run',
  versionId: 'edition',
  currentScenarioId: 'scenario',
} as LoadedPlaythrough
const scenario: Scenario = {
  id: 'scenario',
  versionId: 'edition',
  categoryId: 'category',
  title: 'Fixture',
  description: 'Fixture',
  scheduleType: 'non_scheduled',
  choices: [
    {
      id: 'choice',
      versionId: 'edition',
      scenarioId: 'scenario',
      text: 'Fixture choice',
      balanceChange: usdCents(-500),
      responseText: 'Saved outcome',
    },
  ],
}

function saved(owner = 'owner') {
  return {
    run: {
      playthrough_id: 'run',
      owner_user_id: owner,
      persona_id: 'persona',
      version_id: 'edition',
      current_scenario_id: 'scenario',
      cac_support_enabledabled: false,
      status: 'active',
      current_balance: '50.00',
    },
    persona: {
      persona_id: 'persona',
      version_id: 'edition',
      name: 'Alex',
      description: null,
    },
    response_count: 1,
    response: {
      playthrough_id: 'run',
      choice_id: 'choice',
      version_id: 'edition',
      balance_change_applied: '-5.00',
      balance_after: '50.00',
    },
    response_text: 'Saved outcome',
  }
}
beforeEach(() => {
  vi.resetAllMocks()
  auth.getUser.mockResolvedValue({
    data: { user: { id: 'owner', is_anonymous: false } },
    error: null,
  })
  rpc.mockImplementation(async (name: string) => ({
    data: name === 'is_cac_staff' ? true : saved(),
    error: null,
  }))
})
it.each([true, false])(
  'restores and submits for anonymous=%s with ownership validation',
  async (anonymous) => {
    auth.getUser.mockResolvedValue({
      data: { user: { id: 'owner', is_anonymous: anonymous } },
      error: null,
    })
    expect((await restoreScenario(expected, scenario)).decision).toMatchObject({
      choiceId: 'choice',
      balanceAfter: 5000,
    })
    expect(
      (await submitScenario(expected, scenario, 'choice')).run.ownerUserId,
    ).toBe('owner')
    expect(rpc).toHaveBeenCalledWith('submit_scenario_decision', {
      p_run_id: 'run',
      p_scenario_id: 'scenario',
      p_choice_id: 'choice',
    })
    expect(auth.signOut).not.toHaveBeenCalled()
    expect(auth.signInAnonymously).not.toHaveBeenCalled()
  },
)
it('rejects a returned run owned by another user', async () => {
  rpc.mockImplementation(async (name: string) => ({
    data: name === 'is_cac_staff' ? true : saved('other'),
    error: null,
  }))
  await expect(restoreScenario(expected, scenario)).rejects.toThrow(
    'Unexpected scenario run',
  )
})
it('denies revoked staff restoration without querying scenario state or changing identities', async () => {
  rpc.mockResolvedValue({ data: false, error: null })
  await expect(restoreScenario(expected, scenario)).rejects.toThrow(
    'does not currently have access',
  )
  expect(rpc).toHaveBeenCalledExactlyOnceWith('is_cac_staff')
  expect(auth.signOut).not.toHaveBeenCalled()
  expect(auth.signInAnonymously).not.toHaveBeenCalled()
})
it('surfaces server submission denial without a retry or identity replacement', async () => {
  rpc.mockResolvedValue({ data: null, error: { code: 'P0001' } })
  await expect(submitScenario(expected, scenario, 'choice')).rejects.toThrow(
    'Unable to confirm',
  )
  expect(rpc).toHaveBeenCalledOnce()
  expect(auth.signOut).not.toHaveBeenCalled()
  expect(auth.signInAnonymously).not.toHaveBeenCalled()
})
