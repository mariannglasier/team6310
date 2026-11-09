import type { Scenario, CommittedDecision } from '../types/domain'
import type { LoadedPlaythrough } from '../types/playthrough'
import { getSupabaseClient } from './supabase'
import { parseUsdCents } from './contentService'
export interface ScenarioRunSnapshot {
  run: LoadedPlaythrough
  decision: CommittedDecision | null
  responseText: string | null
}
export async function restoreScenario(
  expected: LoadedPlaythrough,
  scenario: Scenario,
): Promise<ScenarioRunSnapshot> {
  const id = expected.id
  const client = await getSupabaseClient()
  const { data: identity, error: authError } = await client.auth.getUser()
  if (authError || !identity.user?.is_anonymous)
    throw new Error('Anonymous participant required')
  const { data, error } = await client.rpc('restore_scenario_decision', {
    p_run_id: id,
    p_scenario_id: expected.currentScenarioId,
  })
  if (error) throw error
  const r = data?.run
  if (
    !r ||
    r.playthrough_id !== id ||
    r.owner_user_id !== identity.user.id ||
    r.version_id !== expected.versionId ||
    r.current_scenario_id !== expected.currentScenarioId ||
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
  return {
    run,
    responseText: data.response_text,
    decision: row
      ? {
          scenarioId: expected.currentScenarioId!,
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
export async function submitScenario(
  run: LoadedPlaythrough,
  scenario: Scenario,
  choiceId: string,
) {
  const client = await getSupabaseClient()
  const { data, error } = await client.rpc('submit_scenario_decision', {
    p_run_id: run.id,
    p_scenario_id: scenario.id,
    p_choice_id: choiceId,
  })
  if (error || data?.run?.playthrough_id !== run.id)
    throw new Error('Unable to confirm decision. Reload or retry.')
  return restoreScenario(run, scenario)
}
