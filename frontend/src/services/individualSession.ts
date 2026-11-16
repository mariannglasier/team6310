import { ensureParticipantSession } from './participantSession'
import { getSupabaseClient } from './supabase'

export class IndividualSessionError extends Error {}

// Restoration never creates an identity. Staff eligibility is rechecked on each
// call; the database independently enforces eligibility and run ownership.
export async function individualPlayerId(): Promise<string> {
  try {
    const client = await getSupabaseClient()
    const { data, error } = await client.auth.getUser()
    if (error || !data.user?.id)
      throw new IndividualSessionError(
        'Unable to verify your simulation session. Please retry.',
      )
    if (data.user.is_anonymous === true) return data.user.id
    const { data: authorized, error: authorizationError } =
      await client.rpc('is_cac_staff')
    if (authorizationError)
      throw new IndividualSessionError(
        'Unable to verify simulation access. Please retry.',
      )
    if (authorized !== true)
      throw new IndividualSessionError(
        'This account does not currently have access to individual simulations.',
      )
    return data.user.id
  } catch (error) {
    if (error instanceof IndividualSessionError) throw error
    throw new IndividualSessionError(
      'Unable to verify your simulation session. Please retry.',
    )
  }
}

let pending: Promise<void> | undefined
async function prepareSession(): Promise<void> {
  try {
    const client = await getSupabaseClient()
    const { data, error } = await client.auth.getSession()
    if (error)
      throw new IndividualSessionError(
        'Unable to restore your simulation session. Please retry.',
      )
    // The strict participant service rechecks before creating anonymous Auth,
    // including if another caller establishes a session in the meantime.
    if (!data.session) await ensureParticipantSession()
    await individualPlayerId()
  } catch (error) {
    if (error instanceof IndividualSessionError) throw error
    throw new IndividualSessionError(
      'Unable to prepare your simulation session. Please retry.',
    )
  }
}

// Share only preparation in flight, never a cached authorization decision.
export function ensureIndividualSession(): Promise<void> {
  if (!pending) {
    pending = prepareSession().finally(() => {
      pending = undefined
    })
  }
  return pending
}
