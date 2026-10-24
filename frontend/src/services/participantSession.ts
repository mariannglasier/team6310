import { getSupabaseClient } from './supabase'

export class ParticipantSessionError extends Error {}

let pending: Promise<void> | undefined

async function establishSession() {
  const { auth } = await getSupabaseClient()
  const { data, error } = await auth.getSession()
  if (error)
    throw new ParticipantSessionError(
      'Unable to restore participant session. Please retry.',
    )

  if (data.session) {
    const { data: verified, error: verificationError } = await auth.getUser()
    if (verificationError) {
      throw new ParticipantSessionError(
        'Unable to verify participant session. Please retry.',
      )
    }
    if (verified.user?.is_anonymous !== true) {
      throw new ParticipantSessionError(
        'This browser already has a non-participant session. Use a separate browser profile for the workshop.',
      )
    }
    return
  }

  const { data: created, error: signInError } = await auth.signInAnonymously()
  if (signInError || !created.session || created.user?.is_anonymous !== true) {
    throw new ParticipantSessionError(
      'Unable to prepare participant session. Please retry or contact the facilitator.',
    )
  }
}

// Share only in-flight work; subsequent calls recheck the SDK-managed session.
export function ensureParticipantSession(): Promise<void> {
  if (!pending) {
    pending = establishSession().finally(() => {
      pending = undefined
    })
  }
  return pending
}
