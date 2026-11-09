import { getSupabaseClient } from './supabase'
import { parseUsdCents } from './contentService'
import type { Scenario } from '../types/domain'
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error('Missing scenario content')
  return value
}
export async function loadScenario(
  scenarioId: string,
  versionId: string,
): Promise<Scenario | null> {
  const client = await getSupabaseClient()
  const { data: row, error } = await client
    .from('scenarios')
    .select(
      'scenario_id,title,description,default_day,version_id,category_id,schedule_type',
    )
    .eq('scenario_id', scenarioId)
    .eq('version_id', versionId)
    .maybeSingle()
  if (error) throw error
  if (!row) return null
  if (
    row.scenario_id !== scenarioId ||
    row.version_id !== versionId ||
    !['scheduled', 'non_scheduled'].includes(row.schedule_type)
  )
    throw new Error('Unexpected scenario')
  const { data, error: choicesError } = await client
    .from('choices')
    .select(
      'choice_id,scenario_id,choice_text,balance_change,response_text,next_scenario_id,version_id,requires_cac,upfront_cost',
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
        requiresCac: choice.requires_cac === true,
        upfrontCost: parseUsdCents(choice.upfront_cost, 'upfront_cost'),
      }
    }),
  }
}
