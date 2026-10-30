import { beforeEach, expect, it, vi } from 'vitest'
import { createIndividualPlaythrough } from './playthroughService'
import {
  ensureParticipantSession,
  ParticipantSessionError,
} from './participantSession'
import { getSupabaseClient } from './supabase'

vi.mock('./participantSession', async (original) => ({
  ...(await original<typeof import('./participantSession')>()),
  ensureParticipantSession: vi.fn(),
}))
vi.mock('./supabase', () => ({ getSupabaseClient: vi.fn() }))
const rpc = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(ensureParticipantSession).mockResolvedValue(undefined)
  vi.mocked(getSupabaseClient).mockResolvedValue({ rpc } as unknown as Awaited<
    ReturnType<typeof getSupabaseClient>
  >)
  rpc.mockResolvedValue({ data: 'new-playthrough-id', error: null })
})

it('establishes the participant session before calling the RPC with only the selected persona', async () => {
  vi.mocked(ensureParticipantSession).mockImplementation(async () => {
    expect(rpc).not.toHaveBeenCalled()
  })
  await expect(createIndividualPlaythrough('selected-persona')).resolves.toBe(
    'new-playthrough-id',
  )
  expect(ensureParticipantSession).toHaveBeenCalledOnce()
  expect(rpc).toHaveBeenCalledExactlyOnceWith('start_individual_playthrough', {
    p_persona_id: 'selected-persona',
  })
})

it('does not insert when participant authentication is denied', async () => {
  vi.mocked(ensureParticipantSession).mockRejectedValue(
    new ParticipantSessionError('A participant session is required.'),
  )
  await expect(createIndividualPlaythrough('p1')).rejects.toThrow(
    'participant session',
  )
  expect(rpc).not.toHaveBeenCalled()
})

it.each([
  { data: null, error: { message: 'private database detail' } },
  { data: null, error: null },
  { data: 123, error: null },
  { data: '', error: null },
])(
  'rejects failed or missing creation results without leaking database details: %j',
  async (result) => {
    rpc.mockResolvedValue(result)
    await expect(createIndividualPlaythrough('p1')).rejects.toThrow(
      'Unable to confirm playthrough creation.',
    )
    expect(rpc).toHaveBeenCalledOnce()
  },
)

it('does not automatically retry an uncertain network failure', async () => {
  rpc.mockRejectedValue(new Error('network detail'))
  await expect(createIndividualPlaythrough('p1')).rejects.toThrow(
    'a record may already have been created',
  )
  expect(rpc).toHaveBeenCalledOnce()
})
