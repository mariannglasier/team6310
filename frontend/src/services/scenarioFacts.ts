import { getSupabaseClient } from './supabase'

export interface ScenarioFact {
  role: 'general' | 'cac'
  semanticKey: string
  text: string
  sourceUrl: string
  copyKind?: 'fact' | 'context'
}

export async function loadScenarioFacts(
  runId: string,
  scenarioId: string,
  versionId: string,
  supportEnabled: boolean,
): Promise<ScenarioFact[]> {
  const client = await getSupabaseClient()
  const { data, error } = await client.rpc('get_event_recap_facts', {
    p_run_id: runId,
    p_event_key: scenarioId,
  })
  if (error) throw error
  if (!Array.isArray(data)) throw new Error('Invalid scenario facts')
  const roles = new Set<string>()
  return data.map((row) => {
    if (
      (!/^D00[1-4]$/.test(scenarioId) &&
        !scenarioId.startsWith('bill:') &&
        row.scenario_id !== scenarioId) ||
      row.version_id !== versionId ||
      !['general', 'cac'].includes(row.fact_role) ||
      (row.fact_role === 'cac' && !supportEnabled) ||
      roles.has(row.fact_role) ||
      typeof row.semantic_key !== 'string' ||
      !row.semantic_key.trim() ||
      typeof row.display_text !== 'string' ||
      !row.display_text.trim() ||
      /[{}]/.test(row.display_text) ||
      typeof row.source_url !== 'string' ||
      !/^https:\/\//.test(row.source_url)
    )
      throw new Error('Invalid scenario facts')
    roles.add(row.fact_role)
    return {
      role: row.fact_role,
      semanticKey: row.semantic_key,
      text: row.display_text,
      sourceUrl: row.source_url,
      ...(row.copy_kind ? { copyKind: row.copy_kind } : {}),
    }
  })
}
