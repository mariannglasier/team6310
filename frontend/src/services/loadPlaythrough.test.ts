import { beforeEach, expect, it, vi } from 'vitest'
import { loadPlaythrough } from './loadPlaythrough'
import { getSupabaseClient } from './supabase'

vi.mock('./supabase', () => ({ getSupabaseClient: vi.fn() }))
const getUser = vi.fn()
const from = vi.fn()
const run = {
  playthrough_id: 'run',
  persona_id: 'persona',
  version_id: 'pinned-version',
  owner_user_id: 'owner',
  current_scenario_id: null,
  current_balance: '350.25',
  current_day: 1,
  cac_support_enabledabled: null,
  status: 'active',
  started_at: '2026-10-30T12:00:00Z',
  session_id: null,
  current_job_id: null,
  employment_state: null,
}
let records: Record<string, { data: unknown; error: unknown }>
let filters: Record<string, unknown[][]>
beforeEach(() => {
  vi.resetAllMocks()
  records = {
    playthroughs: { data: { ...run }, error: null },
    personas: {
      data: {
        persona_id: 'persona',
        version_id: 'pinned-version',
        name: 'Alex',
        description: null,
      },
      error: null,
    },
  }
  filters = {}
  getUser.mockResolvedValue({
    data: { user: { id: 'owner', is_anonymous: true } },
    error: null,
  })
  from.mockImplementation((table: string) => {
    filters[table] = []
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn((...args: unknown[]) => {
        filters[table].push(args)
        return query
      }),
      maybeSingle: vi.fn(async () => records[table]),
    }
    return query
  })
  vi.mocked(getSupabaseClient).mockResolvedValue({
    auth: { getUser },
    from,
  } as unknown as Awaited<ReturnType<typeof getSupabaseClient>>)
})

it('loads the owned run and its pinned persona while retaining all run fields', async () => {
  records.playthroughs.data = {
    ...run,
    current_scenario_id: 'scenario',
    current_job_id: 'job',
    employment_state: { opaque: ['preserve'] },
  }
  const loaded = await loadPlaythrough('run')
  expect(loaded).toEqual({
    id: 'run',
    personaId: 'persona',
    versionId: 'pinned-version',
    ownerUserId: 'owner',
    currentScenarioId: 'scenario',
    currentBalance: 35025,
    currentDay: 1,
    supportEnabled: null,
    status: 'active',
    startedAt: run.started_at,
    sessionId: null,
    currentJobId: 'job',
    employmentState: { opaque: ['preserve'] },
    persona: {
      id: 'persona',
      versionId: 'pinned-version',
      name: 'Alex',
      description: null,
    },
  })
  expect(filters.playthroughs).toEqual([['playthrough_id', 'run']])
  expect(filters.personas).toEqual([
    ['persona_id', 'persona'],
    ['version_id', 'pinned-version'],
  ])
})

it('preserves nullable fields without inventing initial state', async () => {
  records.playthroughs.data = {
    ...run,
    current_balance: null,
    current_day: null,
    status: null,
    started_at: null,
    version_id: null,
  }
  const loaded = await loadPlaythrough('run')
  expect(loaded).toMatchObject({
    currentBalance: null,
    currentDay: null,
    status: null,
    startedAt: null,
    versionId: null,
    employmentState: null,
    supportEnabled: null,
    persona: null,
  })
  expect(from).toHaveBeenCalledExactlyOnceWith('playthroughs')
})

it('returns unavailable for a missing or RLS-hidden run without loading content', async () => {
  records.playthroughs.data = null
  await expect(loadPlaythrough('run')).resolves.toBeNull()
  expect(from).toHaveBeenCalledExactlyOnceWith('playthroughs')
})

it('retains the run when its pinned persona is unavailable', async () => {
  records.personas.data = null
  await expect(loadPlaythrough('run')).resolves.toMatchObject({
    id: 'run',
    persona: null,
  })
})

it.each(['playthroughs', 'personas'])(
  'handles %s request failures safely',
  async (table) => {
    records[table] = { data: null, error: { message: 'private SQL detail' } }
    await expect(loadPlaythrough('run')).rejects.toThrow(
      'Unable to load your playthrough.',
    )
  },
)

it('handles a rejected network request without retry', async () => {
  from.mockImplementation(() => {
    throw new Error('network detail')
  })
  await expect(loadPlaythrough('run')).rejects.toThrow(
    'Unable to load your playthrough.',
  )
  expect(from).toHaveBeenCalledOnce()
})

it.each([null, { id: 'staff', is_anonymous: false }])(
  'does not read without an existing participant identity: %j',
  async (user) => {
    getUser.mockResolvedValue({ data: { user }, error: null })
    await expect(loadPlaythrough('run')).rejects.toThrow('Unable to load')
    expect(from).not.toHaveBeenCalled()
  },
)

it('rejects an unexpected owner even if a response is returned', async () => {
  records.playthroughs.data = { ...run, owner_user_id: 'other-player' }
  await expect(loadPlaythrough('run')).rejects.toThrow('Unable to load')
  expect(from).toHaveBeenCalledExactlyOnceWith('playthroughs')
})

it('rejects mismatched content instead of displaying a different edition', async () => {
  records.personas.data = {
    persona_id: 'persona',
    version_id: 'newest-version',
    name: 'Wrong edition',
    description: null,
  }
  await expect(loadPlaythrough('run')).rejects.toThrow('Unable to load')
})
