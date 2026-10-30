import {
  ensureParticipantSession,
  ParticipantSessionError,
} from './participantSession'
import { getSupabaseClient } from './supabase'

// The RPC derives ownership, edition, and balance; only the persona ID is sent.
export async function createIndividualPlaythrough(
  personaId: string,
): Promise<string> {
  try {
    await ensureParticipantSession()
    const client = await getSupabaseClient()
    const { data, error } = await client.rpc('start_individual_playthrough', {
      p_persona_id: personaId,
    })
    if (error || typeof data !== 'string' || !data.trim())
      throw new Error('Creation failed', { cause: error })
    return data
  } catch (error) {
    if (error instanceof ParticipantSessionError) throw error
    throw new Error(
      'Unable to confirm playthrough creation. Please contact the facilitator before retrying; a record may already have been created.',
      { cause: error },
    )
  }
}
