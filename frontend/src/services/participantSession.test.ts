import { beforeEach, expect, it, vi } from 'vitest'
import { ensureParticipantSession } from './participantSession'

const { auth, getSupabaseClient } = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInAnonymously: vi.fn(),
  },
  getSupabaseClient: vi.fn(),
}))
vi.mock('./supabase', () => ({ getSupabaseClient }))

beforeEach(() => {
  vi.resetAllMocks()
  getSupabaseClient.mockResolvedValue({ auth })
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
  auth.signInAnonymously.mockResolvedValue({
    data: { session: {}, user: { is_anonymous: true } },
    error: null,
  })
})

it('creates a credential-free session and shares concurrent requests', async () => {
  await Promise.all([ensureParticipantSession(), ensureParticipantSession()])
  expect(auth.signInAnonymously).toHaveBeenCalledExactlyOnceWith()
})

it('reuses an existing verified anonymous session on repeated entry', async () => {
  auth.getSession.mockResolvedValue({ data: { session: {} }, error: null })
  auth.getUser.mockResolvedValue({
    data: { user: { is_anonymous: true } },
    error: null,
  })
  await ensureParticipantSession()
  await ensureParticipantSession()
  expect(auth.getSession).toHaveBeenCalledTimes(2)
  expect(auth.signInAnonymously).not.toHaveBeenCalled()
})

it('leaves a non-anonymous identity untouched rather than treating it as a participant', async () => {
  auth.getSession.mockResolvedValue({ data: { session: {} }, error: null })
  auth.getUser.mockResolvedValue({
    data: { user: { is_anonymous: false } },
    error: null,
  })
  await expect(ensureParticipantSession()).rejects.toThrow(
    'non-participant session',
  )
  expect(auth.signInAnonymously).not.toHaveBeenCalled()
})

it('does not replace a session when restoration or verification fails', async () => {
  auth.getSession.mockResolvedValue({ data: { session: null }, error: {} })
  await expect(ensureParticipantSession()).rejects.toThrow('restore')
  auth.getSession.mockResolvedValue({ data: { session: {} }, error: null })
  auth.getUser.mockResolvedValue({ data: { user: null }, error: {} })
  await expect(ensureParticipantSession()).rejects.toThrow('verify')
  expect(auth.signInAnonymously).not.toHaveBeenCalled()
})

it('allows retry after an anonymous sign-in failure without exposing raw errors', async () => {
  auth.signInAnonymously.mockResolvedValueOnce({
    data: {},
    error: { message: 'private detail' },
  })
  await expect(ensureParticipantSession()).rejects.toThrow('Unable to prepare')
  await expect(ensureParticipantSession()).resolves.toBeUndefined()
})

it('rejects a missing session or unexpected non-anonymous sign-in response', async () => {
  auth.signInAnonymously.mockResolvedValue({
    data: { session: null },
    error: null,
  })
  await expect(ensureParticipantSession()).rejects.toThrow('Unable to prepare')
  auth.signInAnonymously.mockResolvedValue({
    data: { session: {}, user: { is_anonymous: false } },
    error: null,
  })
  await expect(ensureParticipantSession()).rejects.toThrow('Unable to prepare')
})
