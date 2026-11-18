import { beforeEach, expect, it, vi } from 'vitest'
import {
  ensureIndividualSession,
  individualPlayerId,
} from './individualSession'
import { ensureParticipantSession } from './participantSession'
import { groupSessionService } from './groupSessionService'
import { createIndividualPlaythrough } from './playthroughService'
import { restoreStaffSession } from './staffAuth'
const { auth, rpc, client } = vi.hoisted(() => {
  const auth = {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInAnonymously: vi.fn(),
    signOut: vi.fn(),
  }
  const rpc = vi.fn()
  return { auth, rpc, client: { auth, rpc } }
})
vi.mock('./supabase', () => ({ getSupabaseClient: async () => client }))
const anonymous = { id: 'participant', is_anonymous: true }
const staff = { id: 'staff', is_anonymous: false, email: 'staff@example.org' }
beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  auth.getSession.mockResolvedValue({
    data: { session: { user: anonymous } },
    error: null,
  })
  auth.getUser.mockResolvedValue({ data: { user: anonymous }, error: null })
  rpc.mockResolvedValue({ data: true, error: null })
})
function asStaff() {
  auth.getSession.mockResolvedValue({
    data: { session: { user: staff } },
    error: null,
  })
  auth.getUser.mockResolvedValue({ data: { user: staff }, error: null })
}
function unchangedIdentity() {
  expect(auth.signInAnonymously).not.toHaveBeenCalled()
  expect(auth.signOut).not.toHaveBeenCalled()
}
it('accepts verified anonymous identity without a staff check', async () => {
  await ensureIndividualSession()
  expect(await individualPlayerId()).toBe('participant')
  expect(rpc).not.toHaveBeenCalled()
  unchangedIdentity()
})
it('accepts staff and restores dashboard access using the same session', async () => {
  asStaff()
  await ensureIndividualSession()
  expect(await individualPlayerId()).toBe('staff')
  expect(await restoreStaffSession()).toEqual({ email: staff.email })
  expect(rpc.mock.calls.every(([name]) => name === 'is_cac_staff')).toBe(true)
  unchangedIdentity()
})
it.each([false, null, 'true', { role: 'staff' }])(
  'rejects unauthorized accounts: %j',
  async (data) => {
    asStaff()
    rpc.mockResolvedValue({ data, error: null })
    await expect(ensureIndividualSession()).rejects.toThrow(
      'does not currently have access',
    )
    unchangedIdentity()
  },
)
it('rechecks authorization after revocation', async () => {
  asStaff()
  await ensureIndividualSession()
  rpc.mockResolvedValue({ data: false, error: null })
  await expect(individualPlayerId()).rejects.toThrow(
    'does not currently have access',
  )
  await expect(ensureIndividualSession()).rejects.toThrow(
    'does not currently have access',
  )
  unchangedIdentity()
})
it.each(['user', 'authorization', 'session', 'network'])(
  'fails safely on %s failure and permits retry',
  async (failure) => {
    asStaff()
    if (failure === 'user')
      auth.getUser.mockResolvedValueOnce({
        data: { user: staff },
        error: { message: 'secret' },
      })
    if (failure === 'authorization')
      rpc.mockResolvedValueOnce({ data: true, error: { message: 'secret' } })
    if (failure === 'session')
      auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'secret' },
      })
    if (failure === 'network') rpc.mockRejectedValueOnce(new Error('secret'))
    await expect(ensureIndividualSession()).rejects.toThrow(/Unable to/)
    unchangedIdentity()
    await expect(ensureIndividualSession()).resolves.toBeUndefined()
  },
)
it('never creates an identity during restoration with no verified user', async () => {
  auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  await expect(individualPlayerId()).rejects.toThrow('Unable to verify')
  expect(auth.getSession).not.toHaveBeenCalled()
  unchangedIdentity()
})
it('shares concurrent preparation with the strict participant service', async () => {
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
  auth.signInAnonymously.mockResolvedValue({
    data: { session: { user: anonymous }, user: anonymous },
    error: null,
  })
  await Promise.all([
    ensureIndividualSession(),
    ensureIndividualSession(),
    ensureParticipantSession(),
  ])
  expect(auth.signInAnonymously).toHaveBeenCalledOnce()
  expect(auth.signOut).not.toHaveBeenCalled()
})
it('does not replace staff arriving during anonymous preparation', async () => {
  asStaff()
  auth.getSession.mockResolvedValueOnce({
    data: { session: null },
    error: null,
  })
  await expect(ensureIndividualSession()).rejects.toThrow('Unable to prepare')
  unchangedIdentity()
})
it('shares concurrent staff preparation but rechecks later calls', async () => {
  asStaff()
  await Promise.all([ensureIndividualSession(), ensureIndividualSession()])
  expect(rpc).toHaveBeenCalledOnce()
  await ensureIndividualSession()
  expect(rpc).toHaveBeenCalledTimes(2)
  unchangedIdentity()
})
it('creates an owner-scoped staff locator without changing identity', async () => {
  asStaff()
  rpc.mockImplementation(async (name: string) => ({
    data: name === 'is_cac_staff' ? true : 'staff-run',
    error: null,
  }))
  expect(await createIndividualPlaythrough('persona')).toBe('staff-run')
  expect(localStorage.getItem('cac-employment-v1:staff:run')).toBe('staff-run')
  expect(rpc).toHaveBeenCalledWith('start_individual_playthrough', {
    p_persona_id: 'persona',
  })
  unchangedIdentity()
})
it('does not create a replacement run after authorization fails', async () => {
  asStaff()
  localStorage.setItem('cac-employment-v1:staff:run', 'existing')
  rpc.mockResolvedValue({ data: false, error: null })
  await expect(createIndividualPlaythrough('persona')).rejects.toThrow(
    'does not currently have access',
  )
  expect(rpc).toHaveBeenCalledExactlyOnceWith('is_cac_staff')
  expect(localStorage.getItem('cac-employment-v1:staff:run')).toBe('existing')
  unchangedIdentity()
})
it('retains real anonymous-only group admission after individual access', async () => {
  asStaff()
  await ensureIndividualSession()
  rpc.mockClear()
  await expect(groupSessionService.create(60)).rejects.toThrow()
  expect(rpc).not.toHaveBeenCalled()
  unchangedIdentity()
})
