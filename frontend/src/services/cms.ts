import { getSupabaseClient } from './supabase'

export interface CmsDraft {
  version_id: string
  source_version: string
  name: string
  revision: number
  updated_at: string
}
export interface CmsFact {
  scenario_id?: string
  version_id?: string
  original_role?: 'general' | 'cac' | null
  fact_role: 'general' | 'cac'
  semantic_key?: string
  display_text: string
  source_url: string
  reporting_period: string | null
  copy_kind: 'fact' | 'context'
  verified: boolean
  evidence?: unknown
}
export interface CmsChoice {
  choice_id: string | null
  scenario_id?: string
  choice_text: string
  response_text: string
  balance_change: string | number
  upfront_cost: string | number
  requires_cac: boolean
  next_scenario_id: string | null
}
export interface CmsScenario {
  default_day?: number | null
  scenario_id: string
  title: string
  description: string | null
  category_id: string | null
  persona_intent: string | null
  schedule_type: string | null
}
export interface CmsContent {
  workspace: CmsDraft
  facts?: CmsFact[]
  choices?: CmsChoice[]
  scenarios: CmsScenario[]
  personas: { persona_id: string; name: string }[]
  categories: { category_id: string; name: string }[]
}
export type ScenarioInput = Pick<
  CmsScenario,
  'title' | 'description' | 'category_id' | 'persona_intent'
> & {
  schedule_type?: string
  default_day?: number | null
  facts?: CmsFact[]
  choices?: CmsChoice[]
}
async function rpc<T>(
  name: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const client = await getSupabaseClient()
  const { data, error } = await client.rpc(name, args)
  if (error) {
    if (
      (name === 'cms_delete_draft' || name === 'cms_delete_scenario') &&
      error.message?.includes('external dependencies')
    )
      throw new Error(
        'This content is referenced by other records and cannot be deleted. Nothing was removed.',
      )
    if (error.code === '40001')
      throw new Error(
        'This draft changed. Reload the draft before saving again. Your edits are still here.',
      )
    throw new Error(
      'The draft operation could not be completed. Check your staff access and try again.',
    )
  }
  return data as T
}
export const listCmsDrafts = () => rpc<CmsDraft[]>('cms_list_drafts')
export const readCmsDraft = (id: string) =>
  rpc<CmsContent>('cms_read_draft', { p_version: id })
export const createCmsDraft = (source: string, name: string, request: string) =>
  rpc<string>('cms_create_draft', {
    p_source: source,
    p_name: name,
    p_request: request,
  })
export const saveCmsScenario = (
  version: string,
  revision: number,
  request: string,
  id: string | null,
  input: ScenarioInput,
) => {
  if (!Array.isArray(input.facts))
    throw new Error(
      'Scenario facts are missing. Reload the draft before saving; no changes were sent.',
    )
  return rpc<{ scenario_id: string; revision: number }>(
    'cms_save_scenario_content',
    {
      p_schedule: input.schedule_type ?? 'non_scheduled',
      p_day: input.default_day ?? null,
      p_choices: input.choices ?? [],
      p_facts: (input.facts ?? []).map((f) => ({
        original_role: f.original_role ?? null,
        fact_role: f.fact_role,
        display_text: f.display_text,
        source_url: f.source_url,
        reporting_period: f.reporting_period,
        copy_kind: f.copy_kind,
        verified: f.verified,
      })),
      p_version: version,
      p_revision: revision,
      p_request: request,
      p_scenario: id,
      p_title: input.title,
      p_description: input.description,
      p_category: input.category_id,
      p_persona: input.persona_intent,
    },
  )
}

export const deleteCmsDraft = (id: string, revision: number) =>
  rpc<void>('cms_delete_draft', { p_version: id, p_revision: revision })

export const deleteCmsScenario = (
  version: string,
  revision: number,
  request: string,
  scenario: string,
) =>
  rpc<{ revision: number }>('cms_delete_scenario', {
    p_version: version,
    p_revision: revision,
    p_request: request,
    p_scenario: scenario,
  })
