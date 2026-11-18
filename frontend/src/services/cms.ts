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
export interface CmsPersona {
  persona_id: string
  version_id: string
  name: string
  description: string | null
  general_starting_balance: string | number | null
  weekly_income: string | number | null
  starting_job_id: string | null
  has_english_skills: boolean | null
  has_computer_skills: boolean | null
}
export type PersonaFields = Partial<
  Pick<
    CmsPersona,
    | 'name'
    | 'description'
    | 'general_starting_balance'
    | 'has_english_skills'
    | 'has_computer_skills'
  >
>
export interface CmsPersonaExpense {
  expense_id: string
  persona_id: string
  version_id: string
  name: string
  amount: string | number
  first_due_day: number
  repeat_interval_days: number | null
  late_fee_amount: string | number
}
export interface CmsExpenseInput extends Omit<
  CmsPersonaExpense,
  'expense_id' | 'persona_id' | 'first_due_day' | 'repeat_interval_days'
> {
  expense_id: string | null
  persona_id: string | null
  client_key?: string
  first_due_day: number | string
  repeat_interval_days: number | string | null
}
export interface CmsJob {
  job_id: string
  version_id: string
  soc_code: string
  title: string
  description: string | null
  area_code: string
  area_name: string
  geography_level: 'MSA' | 'STATE'
  wage_year: number | null
  median_hourly_wage: number | string | null
  hours_per_week: number | string
  weekly_gross_income: number | string | null
  entry_education: string | null
  related_experience: string | null
  on_job_training: string | null
  simulation_requirements: Record<string, unknown>
  wage_source_url: string
  requirements_source_url: string | null
  reviewed_at: string | null
  last_synced_at: string | null
  created_at: string
  is_approved: boolean
  is_active: boolean
  needs_english_skills: boolean | null
  needs_computer_skills: boolean | null
}
export type CmsJobFields = Partial<
  Omit<
    CmsJob,
    | 'job_id'
    | 'version_id'
    | 'weekly_gross_income'
    | 'created_at'
    | 'last_synced_at'
    | 'simulation_requirements'
  > & { requirements_notes: string | null }
>
export class CmsJobSaveUncertain extends Error {}
export interface CmsContent {
  workspace: CmsDraft
  jobs?: CmsJob[]
  facts?: CmsFact[]
  choices?: CmsChoice[]
  scenarios: CmsScenario[]
  personas: CmsPersona[]
  expenses?: CmsPersonaExpense[]
  bill_links?: { expense_id: string; scenario_id: string; version_id: string }[]
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
export class CmsPersonaSaveUncertain extends Error {}
async function rpc<T>(
  name: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const client = await getSupabaseClient()
  let response
  try {
    response = await client.rpc(name, args)
  } catch (failure) {
    if (name === 'cms_save_job')
      throw new CmsJobSaveUncertain(
        'Unable to confirm the job save. Retry Save Changes to recover the same request before editing further.',
      )
    if (name === 'cms_save_persona_bundle')
      throw new CmsPersonaSaveUncertain(
        'Unable to confirm the persona save. Retry Save Changes to recover the same request before editing further.',
      )
    throw failure
  }
  const { data, error } = response
  if (error) {
    if (
      (name === 'cms_delete_draft' || name === 'cms_delete_scenario') &&
      error.message?.includes('external dependencies')
    )
      throw new Error(
        'This content is referenced by other records and cannot be deleted. Nothing was removed.',
      )
    if (name === 'cms_save_job' || name === 'cms_delete_job') {
      if (error.code === '42501')
        throw new Error(
          'Staff access is required. Sign in again before continuing; your edits are retained.',
        )
      if (error.code === '23505')
        throw new Error(
          'This SOC code already exists in this draft. Choose a different code; no changes were saved.',
        )
      if (error.code === 'P0001') throw new Error(error.message)
      if (error.code === 'P0002')
        throw new Error(
          'This draft is no longer available. Reopen a saved draft; your edits are retained.',
        )
      if (
        ['23514', '23502', '22003', '22007', '22008', '22P02'].includes(
          error.code,
        )
      )
        throw new Error(
          'Check job values: SOC NN-NNNN, geography MSA/STATE, wage year 2000–2100, finite exact wage/hours, valid review timestamp and active-job requirements. No changes were saved.',
        )
      if (error.code === '55P03')
        throw new Error(
          'The draft is busy. Wait a moment and retry the same operation.',
        )
      if (error.code !== '40001' && name === 'cms_save_job')
        throw new CmsJobSaveUncertain(
          'Unable to confirm the job save. Retry Save Changes before editing further.',
        )
    }
    if (error.code === '40001')
      throw new Error(
        'This draft changed. Reload the draft before saving again. Your edits are still here.',
      )
    if (name === 'cms_delete_persona' && error.code === 'P0001')
      throw new Error(`Persona could not be deleted: ${error.message}`)
    if (name === 'cms_save_persona_bundle') {
      if (error.code === '42501')
        throw new Error(
          'Your staff access could not be confirmed. Sign in again before saving. Your edits are still here.',
        )
      if (error.code === 'P0002')
        throw new Error(
          'This draft is no longer available. Reopen a saved draft before continuing. Your edits are still here.',
        )
      if (error.code === '55P03')
        throw new Error(
          'The draft is busy. Wait a moment and retry the same save. Your edits are still here.',
        )
      if (
        error.code === 'P0001' &&
        error.message?.includes('external dependencies')
      )
        throw new Error(
          'An expense is linked to a bill recap or another record and cannot be removed. No changes were saved. Restore the expense or reload the draft; your edits are still here.',
        )
      if (error.code === 'P0001')
        throw new Error(
          `Persona could not be saved: ${error.message}. Your edits are still here.`,
        )
      throw new CmsPersonaSaveUncertain(
        'Unable to confirm the persona save. Your edits are still here. Retry Save Changes; if it already saved, the same request will recover it.',
      )
    }
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

// One atomic persona/expense bundle. Existing identities and ownership are retained.
export function saveCmsPersona(
  version: string,
  revision: number,
  request: string,
  id: string | null,
  fields: PersonaFields,
  expenses: readonly CmsExpenseInput[] | undefined,
) {
  if (!Array.isArray(expenses))
    throw new Error(
      'Expense data is missing. Reload the draft before saving; no changes were sent.',
    )
  if (
    expenses.some(
      (e) =>
        e.persona_id !== id ||
        e.version_id !== version ||
        (e.expense_id === null ? !e.client_key : !e.expense_id),
    )
  )
    throw new Error(
      'Expense relationships do not match this persona draft. Reload before saving; no changes were sent.',
    )
  const day = (value: number | string, label: string) => {
    if (
      !/^[0-9]+$/.test(String(value)) ||
      Number(value) < 1 ||
      Number(value) > 32767
    )
      throw new Error(`${label} must be a whole day from 1 to 32767.`)
    return Number(value)
  }
  const money = (value: string | number, label: string) => {
    if (
      !/^[0-9]+(\.[0-9]{1,2})?$/.test(String(value)) ||
      Number(value) >= 10000000000
    )
      throw new Error(
        `${label} must be a nonnegative USD amount below $10 billion with at most two decimal places.`,
      )
    return value
  }
  const payload = expenses.map((e) => {
    if (!e.name.trim())
      throw new Error('Enter a name for each scheduled expense.')
    return {
      expense_id: e.expense_id,
      ...(e.expense_id === null ? { client_key: e.client_key } : {}),
      name: e.name,
      amount: money(e.amount, `${e.name} amount`),
      first_due_day: day(e.first_due_day, `${e.name} first due day`),
      repeat_interval_days:
        e.repeat_interval_days === null
          ? null
          : day(e.repeat_interval_days, `${e.name} repeat interval`),
      late_fee_amount: money(e.late_fee_amount, `${e.name} late fee`),
    }
  })
  return rpc<{ persona_id: string; revision: number }>(
    'cms_save_persona_bundle',
    {
      p_version: version,
      p_revision: revision,
      p_request: request,
      p_persona: id,
      p_fields: fields,
      p_expenses: payload,
    },
  )
}

export const deleteCmsPersona = (
  version: string,
  revision: number,
  request: string,
  persona: string,
) =>
  rpc<{ persona_id: string; revision: number }>('cms_delete_persona', {
    p_version: version,
    p_revision: revision,
    p_request: request,
    p_persona: persona,
  })

export const saveCmsJob = (
  version: string,
  revision: number,
  request: string,
  job: string | null,
  fields: CmsJobFields,
) =>
  rpc<{ job_id: string; revision: number }>('cms_save_job', {
    p_version: version,
    p_revision: revision,
    p_request: request,
    p_job: job,
    p_fields: fields,
  })
export const deleteCmsJob = (
  version: string,
  revision: number,
  request: string,
  job: string,
) =>
  rpc<{ job_id: string; revision: number }>('cms_delete_job', {
    p_version: version,
    p_revision: revision,
    p_request: request,
    p_job: job,
  })
