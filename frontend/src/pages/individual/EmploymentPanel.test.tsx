import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import { EmploymentPanel } from './EmploymentPanel'
import { SetupProvider } from '../../state/SetupProvider'
import { createIndividualPlaythrough } from '../../services/playthroughService'
import { loadPlaythrough } from '../../services/loadPlaythrough'
import { getSupabaseClient } from '../../services/supabase'

vi.mock('../../services/supabase', () => ({ getSupabaseClient: vi.fn() }))
vi.mock('../../services/participantSession', () => ({
  ensureParticipantSession: vi.fn(),
  ParticipantSessionError: class extends Error {},
}))
const marker = {
  engine: 'employment-v1',
  schemaVersion: 1,
  revision: 0,
  stage: 'uninitialized',
  receipts: {},
}
let employment: unknown
let day: number
let status: string
const rpc = vi.fn()
const mutate = vi.fn()
const onCommit = vi.fn()
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  employment = null
  day = 1
  status = 'active'
  rpc.mockResolvedValue({ data: 'fresh-run', error: null })
  const client = {
    rpc,
    auth: {
      getUser: async () => ({
        data: { user: { id: 'owner', is_anonymous: true } },
        error: null,
      }),
    },
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        update: mutate,
        insert: mutate,
        maybeSingle: async () => ({
          error: null,
          data:
            table === 'playthroughs'
              ? {
                  playthrough_id: 'fresh-run',
                  persona_id: 'persona',
                  version_id: 'edition',
                  owner_user_id: 'owner',
                  current_balance: '350.00',
                  current_day: day,
                  status,
                  employment_state: employment,
                  current_job_id: null,
                  current_scenario_id: null,
                  cac_support_enabledabled: null,
                  session_id: null,
                  started_at: '2026-11-03T12:00:00Z',
                }
              : {
                  persona_id: 'persona',
                  version_id: 'edition',
                  name: 'Alex',
                  description: null,
                },
        }),
      }
      return query
    },
  }
  vi.mocked(getSupabaseClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof getSupabaseClient>>,
  )
})
async function createAndRender() {
  // Exercise the real creation and owned loading services, with the existing
  // RPC's UUID result and NULL employment_state (no Phase 2 trigger deployed).
  const id = await createIndividualPlaythrough('persona')
  const run = await loadPlaythrough(id)
  if (!run) throw new Error('Missing test run')
  render(
    <MemoryRouter>
      <SetupProvider>
        <EmploymentPanel run={run} onCommit={onCommit} />
      </SetupProvider>
    </MemoryRouter>,
  )
  return run
}
it('explains the missing backend marker after successful fresh creation, without resetting or initializing', async () => {
  const run = await createAndRender()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Phase 2 backend deployment',
  )
  expect(screen.getByRole('alert')).toHaveTextContent(
    'do not create another run',
  )
  expect(
    screen.queryByText('This run cannot be resumed by this version.', {
      exact: false,
    }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Start employment walkthrough' }),
  ).not.toBeInTheDocument()
  expect(run.employmentState).toBeNull()
  expect(run.currentBalance).toBe(35000)
  expect(rpc).toHaveBeenCalledExactlyOnceWith('start_individual_playthrough', {
    p_persona_id: 'persona',
  })
  expect(mutate).not.toHaveBeenCalled()
  expect(onCommit).not.toHaveBeenCalled()
})
it('allows the fresh server-stamped document to reach the initialization screen without auto-submission', async () => {
  employment = marker
  await createAndRender()
  expect(
    await screen.findByRole('button', { name: 'Start employment walkthrough' }),
  ).toBeEnabled()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(rpc).toHaveBeenCalledOnce()
  expect(mutate).not.toHaveBeenCalled()
})
it.each([
  [null, 10, 'active'],
  [marker, 10, 'active'],
  [marker, 1, 'ended'],
  [{ ...marker, schemaVersion: 2 }, 1, 'active'],
  [{ unexpected: 'legacy' }, 1, 'active'],
])(
  'preserves legacy/progressed/unsupported state %j',
  async (value, savedDay, savedStatus) => {
    employment = value
    day = savedDay
    status = savedStatus
    const run = await createAndRender()
    await screen.findByRole('alert')
    expect(run.employmentState).toEqual(value)
    expect(run.currentDay).toBe(savedDay)
    expect(
      screen.queryByRole('button', { name: 'Start employment walkthrough' }),
    ).not.toBeInTheDocument()
    expect(rpc).toHaveBeenCalledOnce()
    expect(mutate).not.toHaveBeenCalled()
    expect(onCommit).not.toHaveBeenCalled()
  },
)
