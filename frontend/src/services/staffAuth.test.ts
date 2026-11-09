import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  onStaffSignedOut,
  restoreStaffSession,
  signInStaff,
  signOutStaff,
  StaffAuthError,
} from './staffAuth'

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
}))
const rpc = vi.hoisted(() => vi.fn())
const getSupabaseClient = vi.hoisted(() => vi.fn())
vi.mock('./supabase', () => ({ getSupabaseClient }))

const staffUser = { id: 'u1', email: 'staff@ourcac.org', is_anonymous: false }

beforeEach(() => {
  vi.resetAllMocks()
  getSupabaseClient.mockResolvedValue({ auth, rpc })
  auth.signOut.mockResolvedValue({ error: null })
})

async function codeOf(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(StaffAuthError)
    return (error as StaffAuthError).code
  }
  throw new Error('expected rejection')
}

describe('signInStaff', () => {
  it('signs in and returns the session only after staff authorization passes', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: staffUser },
      error: null,
    })
    rpc.mockResolvedValue({ data: true, error: null })
    expect(await signInStaff('  staff@ourcac.org ', 'pw')).toEqual({
      email: 'staff@ourcac.org',
    })
    expect(auth.signInWithPassword).toHaveBeenCalledExactlyOnceWith({
      email: 'staff@ourcac.org',
      password: 'pw',
    })
    expect(rpc).toHaveBeenCalledExactlyOnceWith('is_cac_staff')
    expect(auth.signOut).not.toHaveBeenCalled()
  })

  it('rejects wrong credentials without checking authorization', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { status: 400, message: 'Invalid login credentials' },
    })
    expect(await codeOf(signInStaff('a@b.co', 'bad'))).toBe(
      'invalid_credentials',
    )
    expect(rpc).not.toHaveBeenCalled()
  })

  it('denies valid credentials that are not authorized staff and clears the session', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: staffUser },
      error: null,
    })
    rpc.mockResolvedValue({ data: false, error: null })
    expect(await codeOf(signInStaff('a@b.co', 'pw'))).toBe('not_authorized')
    expect(auth.signOut).toHaveBeenCalledOnce()
  })

  it('treats anything other than literal true as denied', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: staffUser },
      error: null,
    })
    rpc.mockResolvedValue({ data: 'true', error: null })
    expect(await codeOf(signInStaff('a@b.co', 'pw'))).toBe('not_authorized')
  })

  it('does not accept an anonymous Auth identity', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: { ...staffUser, is_anonymous: true } },
      error: null,
    })
    expect(await codeOf(signInStaff('a@b.co', 'pw'))).toBe(
      'invalid_credentials',
    )
    expect(rpc).not.toHaveBeenCalled()
    expect(auth.signOut).toHaveBeenCalledOnce()
  })

  it('fails closed and clears the session if authorization cannot be checked', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: staffUser },
      error: null,
    })
    rpc.mockResolvedValue({ data: null, error: { message: 'raw sql detail' } })
    const code = await codeOf(signInStaff('a@b.co', 'pw'))
    expect(code).toBe('unavailable')
    expect(auth.signOut).toHaveBeenCalledOnce()
  })

  it.each([
    [429, 'rate_limited'],
    [500, 'unavailable'],
    [undefined, 'unavailable'],
  ])('maps Auth status %s to %s', async (status, expected) => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { status, message: 'raw' },
    })
    expect(await codeOf(signInStaff('a@b.co', 'pw'))).toBe(expected)
  })

  it('reports unavailable when the Supabase client cannot be created', async () => {
    getSupabaseClient.mockRejectedValue(new Error('Missing env'))
    expect(await codeOf(signInStaff('a@b.co', 'pw'))).toBe('unavailable')
  })

  it('never exposes raw backend messages', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { status: 400, message: 'raw backend secret detail' },
    })
    await expect(signInStaff('a@b.co', 'pw')).rejects.not.toThrow(/raw backend/)
  })
})

describe('restoreStaffSession', () => {
  it('returns null without a stored session', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    expect(await restoreStaffSession()).toBeNull()
    expect(auth.getUser).not.toHaveBeenCalled()
  })

  it('verifies the user with Auth and staff authorization', async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { access_token: 't' } },
      error: null,
    })
    auth.getUser.mockResolvedValue({ data: { user: staffUser }, error: null })
    rpc.mockResolvedValue({ data: true, error: null })
    expect(await restoreStaffSession()).toEqual({ email: 'staff@ourcac.org' })
  })

  it('ignores an anonymous player session without signing it out', async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { access_token: 't' } },
      error: null,
    })
    auth.getUser.mockResolvedValue({
      data: { user: { ...staffUser, is_anonymous: true } },
      error: null,
    })
    expect(await restoreStaffSession()).toBeNull()
    expect(rpc).not.toHaveBeenCalled()
    expect(auth.signOut).not.toHaveBeenCalled()
  })

  it('returns null when the token is rejected or staff access was revoked', async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { access_token: 't' } },
      error: null,
    })
    auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { status: 401, message: 'expired' },
    })
    expect(await restoreStaffSession()).toBeNull()
    auth.getUser.mockResolvedValue({ data: { user: staffUser }, error: null })
    rpc.mockResolvedValue({ data: false, error: null })
    expect(await restoreStaffSession()).toBeNull()
  })
})

describe('signOutStaff and sign-out events', () => {
  it('signs out through Auth', async () => {
    await signOutStaff()
    expect(auth.signOut).toHaveBeenCalledOnce()
  })

  it('notifies only for SIGNED_OUT and unsubscribes', async () => {
    const unsubscribe = vi.fn()
    let listener: (event: string) => void = () => {}
    auth.onAuthStateChange.mockImplementation((cb) => {
      listener = cb
      return { data: { subscription: { unsubscribe } } }
    })
    const callback = vi.fn()
    const stop = onStaffSignedOut(callback)
    await vi.waitFor(() => expect(auth.onAuthStateChange).toHaveBeenCalled())
    listener('TOKEN_REFRESHED')
    expect(callback).not.toHaveBeenCalled()
    listener('SIGNED_OUT')
    expect(callback).toHaveBeenCalledOnce()
    stop()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
