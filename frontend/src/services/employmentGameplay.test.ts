import { beforeEach, expect, it, vi } from 'vitest'
import {
  documentState,
  rememberedRun,
  rememberRun,
  forgetRun,
  rememberReplay,
  rememberedReplay,
  submitEmployment,
  employmentSnapshot,
} from './employmentGameplay'
import { contentService } from './contentService'
import { getSupabaseClient } from './supabase'
import type { LoadedPlaythrough } from '../types/playthrough'
vi.mock('./supabase', () => ({ getSupabaseClient: vi.fn() }))
const rpc = vi.fn()
let owner = 'owner'
const initial = {
  engine: 'employment-v1',
  schemaVersion: 1,
  revision: 0,
  stage: 'uninitialized',
  receipts: {},
}
const run = {
  id: 'run',
  ownerUserId: 'owner',
  personaId: 'persona',
  versionId: 'version',
  employmentState: initial,
  currentDay: 1,
  status: 'active',
  currentJobId: null,
  currentScenarioId: null,
  sessionId: null,
  supportEnabled: null,
  currentBalance: 12345,
  persona: {
    id: 'persona',
    versionId: 'version',
    name: 'Alex',
    description: null,
  },
} as LoadedPlaythrough
beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  owner = 'owner'
  vi.mocked(getSupabaseClient).mockResolvedValue({
    rpc,
    auth: {
      getUser: async () => ({
        data: { user: { id: owner, is_anonymous: true } },
        error: null,
      }),
    },
  } as unknown as Awaited<ReturnType<typeof getSupabaseClient>>)
})
it.each([
  null,
  {},
  [],
  { ...initial, schemaVersion: 2 },
  { ...initial, engine: 'other' },
  { ...initial, revision: -1 },
  { ...initial, stage: 'hacked' },
  { ...initial, receipts: [] },
  { ...initial, stage: 'board' },
  { ...initial, schemaVersion: '1' },
  { ...initial, revision: 1 },
  { ...initial, prepared: false },
  {
    ...initial,
    receipts: { bad: { action: { type: 'end' }, expectedRevision: 0 } },
  },
])('rejects incompatible documents without initializing: %j', (value) => {
  expect(() => documentState(value)).toThrow()
})
it('scopes the run locator to the verified participant', async () => {
  await rememberRun('run')
  expect(await rememberedRun()).toBe('run')
  owner = 'another'
  expect(await rememberedRun()).toBeNull()
})
it('does not forget a different run or another participant locator', async () => {
  await rememberRun('newer-run')
  await forgetRun('old-run')
  expect(await rememberedRun()).toBe('newer-run')
  owner = 'another'
  await forgetRun('newer-run')
  owner = 'owner'
  expect(await rememberedRun()).toBe('newer-run')
  expect(rpc).not.toHaveBeenCalled()
})
it('persists and clears replay intent only for the verified participant', async () => {
  await rememberReplay('completed-run')
  expect(await rememberedReplay()).toBe('completed-run')
  owner = 'another'
  expect(await rememberedReplay()).toBeUndefined()
  await rememberReplay('another-completed-run')
  owner = 'owner'
  await rememberReplay()
  expect(await rememberedReplay()).toBeUndefined()
  owner = 'another'
  expect(await rememberedReplay()).toBe('another-completed-run')
  expect(rpc).not.toHaveBeenCalled()
})
it('retries the identical persisted request after a lost response', async () => {
  rpc
    .mockResolvedValueOnce({ error: { message: 'network' } })
    .mockResolvedValueOnce({
      data: {
        run: {
          playthrough_id: 'run',
          owner_user_id: 'owner',
          persona_id: 'persona',
          version_id: 'version',
          employment_state: initial,
          current_balance: '123.45',
          current_day: 1,
          current_job_id: null,
          current_scenario_id: null,
          cac_support_enabledabled: null,
          status: 'active',
        },
      },
    })
  await expect(
    submitEmployment(run, 0, { type: 'initialize' }),
  ).rejects.toThrow('not confirmed')
  await expect(submitEmployment(run, 0, { type: 'end' })).rejects.toThrow(
    'uncertain',
  )
  const snapshot = await submitEmployment(run, 0, { type: 'continue' }, true)
  expect(rpc.mock.calls[0][1]).toEqual(rpc.mock.calls[1][1])
  expect(snapshot.run.currentBalance).toBe(12345)
})
it('clears a known rejected request but never commits client changes', async () => {
  rpc.mockResolvedValue({ error: { code: 'P0001' } })
  await expect(submitEmployment(run, 0, { type: 'end' })).rejects.toThrow(
    'rejected',
  )
  expect(run.employmentState).toEqual(initial)
  expect(localStorage.getItem('cac-employment-v1:owner:pending:run')).toBeNull()
})

it.each(['day', 'ended'])(
  'restores an ended run from stored %s state as an end screen',
  async (stage) => {
    vi.spyOn(contentService, 'loadJobs').mockResolvedValue([])
    const endedRun = {
      ...run,
      status: 'ended',
      currentDay: 7,
      supportEnabled: false,
      currentScenarioId: 'unaffordable-scenario',
      employmentState: {
        ...initial,
        stage,
        prepared: false,
        hasEnglishSkills: false,
        hasComputerSkills: false,
        assistanceUsed: false,
        clothing: 'none',
        targetId: null,
        initialTargetId: null,
        hiredDay: null,
        weeklyIncome: '0.00',
        history: [],
        creditedDays: [],
        reason: null,
      },
    }
    const restored = await employmentSnapshot(endedRun)
    expect(restored.state).toMatchObject({
      stage: 'ended',
      day: 7,
      balance: 12345,
      reason: 'Your household could not afford this choice.',
    })
    expect(endedRun.employmentState.stage).toBe(stage)
    expect(rpc).not.toHaveBeenCalled()
  },
)
