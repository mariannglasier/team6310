import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabase'

export interface StaffSession {
  readonly email: string
}

export type StaffAuthErrorCode =
  'invalid_credentials' | 'not_authorized' | 'rate_limited' | 'unavailable'

const messages: Record<StaffAuthErrorCode, string> = {
  invalid_credentials: 'The work email or password is incorrect.',
  not_authorized: 'This account does not have CAC staff access.',
  rate_limited: 'Too many sign-in attempts. Wait a moment and try again.',
  unavailable: 'Sign-in is unavailable right now. Please try again.',
}

export class StaffAuthError extends Error {
  readonly code: StaffAuthErrorCode
  constructor(code: StaffAuthErrorCode) {
    super(messages[code])
    this.name = 'StaffAuthError'
    this.code = code
  }
}

async function client(): Promise<SupabaseClient> {
  try {
    return await getSupabaseClient()
  } catch {
    throw new StaffAuthError('unavailable')
  }
}

// Staff authorization is decided by the database. The browser never trusts a
// stored role or user metadata; it only asks the protected function.
async function isAuthorizedStaff(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_cac_staff')
  if (error) throw new StaffAuthError('unavailable')
  return data === true
}

export async function signInStaff(
  email: string,
  password: string,
): Promise<StaffSession> {
  const supabase = await client()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) {
    if (error.status === 429) throw new StaffAuthError('rate_limited')
    // Network failures and server errors have no client-error status.
    if (!error.status || error.status >= 500)
      throw new StaffAuthError('unavailable')
    throw new StaffAuthError('invalid_credentials')
  }
  if (!data.user || data.user.is_anonymous) {
    await supabase.auth.signOut()
    throw new StaffAuthError('invalid_credentials')
  }

  const authorized = await isAuthorizedStaff(supabase).catch(
    async (failure: unknown) => {
      await supabase.auth.signOut()
      throw failure
    },
  )
  if (!authorized) {
    // Valid credentials without staff authorization must not keep a session.
    await supabase.auth.signOut()
    throw new StaffAuthError('not_authorized')
  }
  return { email: data.user.email ?? email.trim() }
}

// Restores a staff session after refresh. Returns null for no session, an
// anonymous player session, or a user who is not authorized staff. Never signs
// out a player's anonymous session.
export async function restoreStaffSession(): Promise<StaffSession | null> {
  const supabase = await client()
  const { data: stored, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw new StaffAuthError('unavailable')
  if (!stored.session) return null

  // getUser validates the token with Auth rather than trusting local storage.
  const { data: verified, error } = await supabase.auth.getUser()
  if (error) {
    if (!error.status || error.status >= 500)
      throw new StaffAuthError('unavailable')
    return null
  }
  const user = verified.user
  if (!user || user.is_anonymous) return null
  if (!(await isAuthorizedStaff(supabase))) return null
  return { email: user.email ?? '' }
}

export async function signOutStaff(): Promise<void> {
  const supabase = await client()
  const { error } = await supabase.auth.signOut()
  if (error) throw new StaffAuthError('unavailable')
}

// Lets other tabs' sign-outs end this tab's protected view. The callback must
// not call Supabase; it only updates UI state.
export function onStaffSignedOut(callback: () => void): () => void {
  let unsubscribe = () => {}
  let cancelled = false
  void getSupabaseClient()
    .then((supabase) => {
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') callback()
      })
      if (cancelled) data.subscription.unsubscribe()
      else unsubscribe = () => data.subscription.unsubscribe()
    })
    .catch(() => {})
  return () => {
    cancelled = true
    unsubscribe()
  }
}
