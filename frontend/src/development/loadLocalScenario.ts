import { getSupabaseClient } from '../services/supabase'
import { parseUsdCents } from '../services/contentService'
import type { Scenario } from '../types/domain'

export const LOCAL_SCENARIO_ID = '63100000-0000-4000-8000-000000000004'
export const LOCAL_VERSION_ID = '3c463a7f-7036-4e0c-9c1b-1f5db7c502f3'
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error('Missing scenario content')
  return value
}
// Development preview only. Refuse hosted targets before importing the client.
export async function loadLocalScenario(): Promise<Scenario | null> {
  if (
    !import.meta.env.DEV ||
    import.meta.env.VITE_SUPABASE_URL !== 'http://127.0.0.1:55321'
  )
    throw new Error('Local verification URL required')
  const client = await getSupabaseClient()
  const { data: row, error } = await client
    .from('scenarios')
    .select(
      'scenario_id,title,description,default_day,version_id,category_id,schedule_type',
    )
    .eq('scenario_id', LOCAL_SCENARIO_ID)
    .eq('version_id', LOCAL_VERSION_ID)
    .maybeSingle()
  if (error) throw error
  if (!row) return null
  if (
    row.scenario_id !== LOCAL_SCENARIO_ID ||
    row.version_id !== LOCAL_VERSION_ID ||
    row.default_day !== 4 ||
    !['scheduled', 'non_scheduled'].includes(row.schedule_type)
  )
    throw new Error('Unexpected scenario')
  const { data, error: choicesError } = await client
    .from('choices')
    .select(
      'choice_id,scenario_id,choice_text,balance_change,response_text,next_scenario_id,version_id',
    )
    .eq('scenario_id', row.scenario_id)
    .eq('version_id', row.version_id)
    .order('choice_id')
  if (choicesError) throw choicesError
  return {
    id: row.scenario_id,
    versionId: row.version_id,
    categoryId: text(row.category_id),
    title: text(row.title),
    description: text(row.description),
    scheduleType: row.schedule_type,
    choices: (data ?? []).map((choice) => {
      if (
        choice.scenario_id !== row.scenario_id ||
        choice.version_id !== row.version_id ||
        (choice.next_scenario_id !== null &&
          typeof choice.next_scenario_id !== 'string')
      )
        throw new Error('Unexpected choice relationship')
      // next_scenario_id is deliberately not routed, including NULL destinations.
      return {
        id: text(choice.choice_id),
        scenarioId: choice.scenario_id,
        versionId: choice.version_id,
        text: text(choice.choice_text),
        balanceChange: parseUsdCents(choice.balance_change, 'balance_change'),
        responseText: text(choice.response_text),
      }
    }),
  }
}
