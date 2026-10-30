import { parseUsdCents } from './contentService'
import { getSupabaseClient } from './supabase'
import type { LoadedPlaythrough } from '../types/playthrough'

export class PlaythroughLoadError extends Error {
  constructor(options?: ErrorOptions) {
    super(
      'Unable to load your playthrough. Please contact the facilitator.',
      options,
    )
  }
}

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error('Invalid text field')
  return value
}
function nullableText(value: unknown): string | null {
  return value === null ? null : text(value)
}

export async function loadPlaythrough(
  id: string,
): Promise<LoadedPlaythrough | null> {
  try {
    const client = await getSupabaseClient()
    const { data: identity, error: authError } = await client.auth.getUser()
    if (authError || !identity.user?.id || identity.user.is_anonymous !== true)
      throw new Error('An existing participant session is required')
    const { data: row, error } = await client
      .from('playthroughs')
      .select(
        'playthrough_id,persona_id,version_id,owner_user_id,current_scenario_id,current_balance,current_day,cac_support_enabledabled,status,started_at,session_id,current_job_id,employment_state',
      )
      .eq('playthrough_id', id)
      .maybeSingle()
    if (error) throw error
    // RLS intentionally makes missing and inaccessible rows indistinguishable.
    if (!row) return null
    if (row.owner_user_id !== identity.user.id || row.playthrough_id !== id)
      throw new Error('Unexpected playthrough')
    if (row.current_day !== null && !Number.isInteger(row.current_day))
      throw new Error('Invalid day')
    if (
      row.cac_support_enabledabled !== null &&
      typeof row.cac_support_enabledabled !== 'boolean'
    )
      throw new Error('Invalid support flag')
    const versionId = nullableText(row.version_id)
    const personaId = text(row.persona_id)
    let persona: LoadedPlaythrough['persona'] = null
    if (versionId !== null) {
      const { data, error: personaError } = await client
        .from('personas')
        .select('persona_id,version_id,name,description')
        .eq('persona_id', personaId)
        .eq('version_id', versionId)
        .maybeSingle()
      if (personaError) throw personaError
      if (data) {
        if (data.persona_id !== personaId || data.version_id !== versionId)
          throw new Error('Unexpected persona edition')
        persona = {
          id: personaId,
          versionId,
          name: text(data.name),
          description: nullableText(data.description),
        }
      }
    }
    return {
      id: text(row.playthrough_id),
      personaId,
      versionId,
      ownerUserId: nullableText(row.owner_user_id),
      currentScenarioId: nullableText(row.current_scenario_id),
      currentBalance:
        row.current_balance === null
          ? null
          : parseUsdCents(row.current_balance, 'current_balance'),
      currentDay: row.current_day,
      supportEnabled: row.cac_support_enabledabled,
      status: nullableText(row.status),
      startedAt: nullableText(row.started_at),
      sessionId: nullableText(row.session_id),
      currentJobId: nullableText(row.current_job_id),
      employmentState: row.employment_state,
      persona,
    }
  } catch (error) {
    throw new PlaythroughLoadError({ cause: error })
  }
}
