import type { Scenario, CommittedDecision } from '../types/domain'
import type { LoadedPlaythrough } from '../types/playthrough'
import { getSupabaseClient } from '../services/supabase'
import { ensureParticipantSession } from '../services/participantSession'
import { parseUsdCents } from '../services/contentService'
import {
  loadLocalScenario,
  LOCAL_SCENARIO_ID,
  LOCAL_VERSION_ID,
} from './loadLocalScenario'

export interface ScenarioRunSnapshot {
  run: LoadedPlaythrough
  decision: CommittedDecision | null
  responseText: string | null
}
export interface ScenarioPresentationService {
  load(): Promise<Scenario | null>
  restore(): Promise<ScenarioRunSnapshot | null>
  open(): Promise<ScenarioRunSnapshot>
  submit(choiceId: string): Promise<ScenarioRunSnapshot>
}
function assertLocal() {
  if (
    !import.meta.env.DEV ||
    import.meta.env.VITE_SUPABASE_URL !== 'http://127.0.0.1:55321'
  )
    throw new Error('Local verification URL required')
}
export function createLocalScenarioService(): ScenarioPresentationService {
  let scenario: Scenario | null = null
  let runId: string | null = null
  async function snapshot(id: string): Promise<ScenarioRunSnapshot> {
    const client = await getSupabaseClient()
    const { data: identity, error: authError } = await client.auth.getUser()
    if (authError || !identity.user?.is_anonymous)
      throw new Error('Anonymous participant required')
    const { data, error } = await client.rpc('restore_scenario_decision', {
      p_run_id: id,
      p_scenario_id: LOCAL_SCENARIO_ID,
    })
    if (error) throw error
    const r = data?.run
    if (
      !r ||
      r.playthrough_id !== id ||
      r.owner_user_id !== identity.user.id ||
      r.version_id !== LOCAL_VERSION_ID ||
      r.current_scenario_id !== LOCAL_SCENARIO_ID ||
      r.current_day !== 4 ||
      typeof r.cac_support_enabledabled !== 'boolean' ||
      !['active', 'ended', 'completed'].includes(r.status)
    )
      throw new Error('Unexpected scenario run')
    const persona = data.persona
    if (
      !persona ||
      persona.persona_id !== r.persona_id ||
      persona.version_id !== r.version_id ||
      typeof persona.name !== 'string' ||
      (persona.description !== null && typeof persona.description !== 'string')
    )
      throw new Error('Unexpected persona')
    const run: LoadedPlaythrough = {
      id,
      personaId: r.persona_id,
      ownerUserId: r.owner_user_id,
      versionId: r.version_id,
      currentScenarioId: r.current_scenario_id,
      currentDay: r.current_day,
      currentBalance: parseUsdCents(r.current_balance, 'current_balance'),
      supportEnabled: r.cac_support_enabledabled,
      status: r.status,
      startedAt: r.started_at,
      sessionId: r.session_id,
      currentJobId: r.current_job_id,
      employmentState: r.employment_state,
      persona: {
        id: persona.persona_id,
        versionId: persona.version_id,
        name: persona.name,
        description: persona.description,
      },
    }
    if (
      !Number.isInteger(data.response_count) ||
      data.response_count < 0 ||
      data.response_count > 1
    )
      throw new Error('Invalid saved decision count')
    const row = data.response
    const choice = scenario?.choices.find((item) => item.id === row?.choice_id)
    if (
      (data.response_count === 0) !== (row === null) ||
      (row &&
        (!choice ||
          row.playthrough_id !== id ||
          row.version_id !== run.versionId ||
          typeof data.response_text !== 'string'))
    )
      throw new Error('Unexpected saved decision')
    runId = id
    return {
      run,
      responseText: data.response_text,
      decision: row
        ? {
            scenarioId: LOCAL_SCENARIO_ID,
            choiceId: row.choice_id,
            balanceChangeApplied: parseUsdCents(
              row.balance_change_applied,
              'applied change',
            ),
            balanceAfter: parseUsdCents(row.balance_after, 'result balance'),
          }
        : null,
    }
  }
  return {
    async load() {
      assertLocal()
      scenario = await loadLocalScenario()
      return scenario
    },
    async restore() {
      assertLocal()
      const client = await getSupabaseClient()
      const { data: session, error: sessionError } =
        await client.auth.getSession()
      if (sessionError) throw sessionError
      if (!session.session) return null
      const { data: identity, error } = await client.auth.getUser()
      if (error || !identity.user?.is_anonymous)
        throw new Error('Anonymous participant required')
      const { data, error: readError } = await client
        .from('playthroughs')
        .select('playthrough_id')
        .eq('owner_user_id', identity.user.id)
        .eq('current_scenario_id', LOCAL_SCENARIO_ID)
        .eq('version_id', LOCAL_VERSION_ID)
        .eq('current_day', 4)
        .is('session_id', null)
        .order('started_at')
        .order('playthrough_id')
        .limit(1)
        .maybeSingle()
      if (readError) throw readError
      return data ? snapshot(data.playthrough_id) : null
    },
    async open() {
      assertLocal()
      await ensureParticipantSession()
      const client = await getSupabaseClient()
      const { data, error } = await client.rpc('open_local_day4_run')
      if (error || typeof data !== 'string')
        throw new Error('Unable to open local run')
      return snapshot(data)
    },
    async submit(choiceId) {
      assertLocal()
      if (!runId || !scenario?.choices.some((choice) => choice.id === choiceId))
        throw new Error('No valid current choice')
      const client = await getSupabaseClient()
      const { data, error } = await client.rpc('submit_scenario_decision', {
        p_run_id: runId,
        p_scenario_id: LOCAL_SCENARIO_ID,
        p_choice_id: choiceId,
      })
      if (error || data?.run?.playthrough_id !== runId)
        throw new Error('Decision not confirmed; reload or retry')
      // Re-read committed state through owner RLS, including after a lost-response retry.
      return snapshot(runId)
    },
  }
}
