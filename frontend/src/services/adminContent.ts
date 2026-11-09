import type {
  AdminCategory,
  AdminChoice,
  AdminContent,
  AdminEdition,
  AdminJob,
  AdminPersona,
  AdminPersonaExpense,
  AdminScenario,
  AdminScenarioStatistic,
  AdminService,
  AdminServiceFact,
  AdminStatistic,
  AdminSupportEffect,
} from '../types/adminContent'
import type { UsdCents } from '../types/domain'
import { parseUsdCents } from './contentService'
import { getSupabaseClient } from './supabase'

// Read-only access for the staff dashboard. Every query uses the signed-in
// session, so Row Level Security decides what comes back; this module never
// writes, never uses a privileged key, and never trusts the UI gate for access.

export class AdminContentError extends Error {
  constructor(options?: ErrorOptions) {
    super(
      'Unable to load the stored content right now. Please try again.',
      options,
    )
    this.name = 'AdminContentError'
  }
}

type Row = Record<string, unknown>

// PostgREST caps a response (1,000 rows by default); page through to get all.
const PAGE_SIZE = 1000

async function fetchAll(
  table: string,
  columns: string,
  orderBy: string,
): Promise<Row[]> {
  const supabase = await getSupabaseClient()
  const rows: Row[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`Unable to read ${table}`)
    const page = (data ?? []) as unknown as Row[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) return rows
  }
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}
function requiredText(value: unknown, fallback = ''): string {
  return text(value) ?? fallback
}
function integer(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}
function decimal(value: unknown): number | null {
  const number = typeof value === 'string' ? Number(value) : value
  return typeof number === 'number' && Number.isFinite(number) ? number : null
}
function flag(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}
// Unreadable amounts show as missing rather than hiding the whole record.
function cents(value: unknown): UsdCents | null {
  if (value === null || value === undefined) return null
  try {
    return parseUsdCents(value, 'amount')
  } catch {
    return null
  }
}
// Only web links are kept; any other scheme is dropped so it can never render
// as a clickable link.
function webUrl(value: unknown): string | null {
  const candidate = text(value)
  if (!candidate) return null
  try {
    const { protocol } = new URL(candidate)
    return protocol === 'https:' || protocol === 'http:' ? candidate : null
  } catch {
    return null
  }
}
function requirements(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return {}
  const result: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (
      typeof entry === 'string' ||
      typeof entry === 'number' ||
      typeof entry === 'boolean'
    )
      result[key] = String(entry)
  }
  return result
}

const toEdition = (r: Row): AdminEdition => ({
  versionId: requiredText(r.version_id),
  versionNumber: integer(r.version_number) ?? 0,
  status: requiredText(r.status, 'unknown'),
  createdAt: text(r.created_at),
  publishedAt: text(r.published_at),
  changeSummary: text(r.change_summary),
})
const toCategory = (r: Row): AdminCategory => ({
  id: requiredText(r.category_id),
  name: requiredText(r.name, 'Unnamed category'),
  description: text(r.description),
})
const toPersona = (r: Row): AdminPersona => ({
  id: requiredText(r.persona_id),
  versionId: text(r.version_id),
  name: requiredText(r.name, 'Unnamed persona'),
  description: text(r.description),
  startingBalance: cents(r.general_starting_balance),
  weeklyIncome: cents(r.weekly_income),
  startingJobId: text(r.starting_job_id),
  hasEnglishSkills: flag(r.has_english_skills),
  hasComputerSkills: flag(r.has_computer_skills),
})
const toPersonaExpense = (r: Row): AdminPersonaExpense => ({
  id: requiredText(r.expense_id),
  personaId: requiredText(r.persona_id),
  versionId: text(r.version_id),
  name: requiredText(r.name, 'Unnamed expense'),
  amount: cents(r.amount),
  firstDueDay: integer(r.first_due_day),
  repeatIntervalDays: integer(r.repeat_interval_days),
  lateFee: cents(r.late_fee_amount),
})
const toScenario = (r: Row): AdminScenario => ({
  id: requiredText(r.scenario_id),
  versionId: text(r.version_id),
  title: requiredText(r.title, 'Untitled scenario'),
  description: text(r.description),
  defaultDay: integer(r.default_day),
  categoryId: text(r.category_id),
  personaId: text(r.persona_intent),
  scheduleType: text(r.schedule_type),
})
const toChoice = (r: Row): AdminChoice => ({
  id: requiredText(r.choice_id),
  scenarioId: requiredText(r.scenario_id),
  versionId: text(r.version_id),
  text: text(r.choice_text),
  balanceChange: cents(r.balance_change),
  responseText: text(r.response_text),
  nextScenarioId: text(r.next_scenario_id),
})
const toSupportEffect = (r: Row): AdminSupportEffect => ({
  id: requiredText(r.support_effect_id),
  choiceId: requiredText(r.choice_id),
  versionId: text(r.version_id),
  assistanceAmount: cents(r.assistance_amount),
  responseText: text(r.response_text),
  explanation: text(r.explanation),
})
const toJob = (r: Row): AdminJob => ({
  id: requiredText(r.job_id),
  versionId: text(r.version_id),
  socCode: requiredText(r.soc_code),
  title: requiredText(r.title, 'Untitled job'),
  description: text(r.description),
  areaName: text(r.area_name),
  wageYear: integer(r.wage_year),
  medianHourlyWage: cents(r.median_hourly_wage),
  hoursPerWeek: decimal(r.hours_per_week),
  weeklyGrossIncome: cents(r.weekly_gross_income),
  entryEducation: text(r.entry_education),
  relatedExperience: text(r.related_experience),
  onJobTraining: text(r.on_job_training),
  requirements: requirements(r.simulation_requirements),
  wageSourceUrl: webUrl(r.wage_source_url),
  requirementsSourceUrl: webUrl(r.requirements_source_url),
  reviewedAt: text(r.reviewed_at),
  isApproved: r.is_approved === true,
  isActive: r.is_active === true,
  needsEnglishSkills: flag(r.needs_english_skills),
  needsComputerSkills: flag(r.needs_computer_skills),
})
const toStatistic = (r: Row): AdminStatistic => ({
  id: requiredText(r.statistic_id),
  versionId: text(r.version_id),
  description: requiredText(r.description, 'Untitled statistic'),
  value: decimal(r.value),
  unit: text(r.unit),
  geography: text(r.geography),
  dataPeriod: text(r.data_period),
  sourceUrl: webUrl(r.source_url),
  lastReviewedAt: text(r.last_reviewed_at),
})
const toScenarioStatistic = (r: Row): AdminScenarioStatistic => ({
  scenarioId: requiredText(r.scenario_id),
  statisticId: requiredText(r.statistic_id),
  versionId: text(r.version_id),
  factRole: text(r.fact_role),
})
const toService = (r: Row): AdminService => ({
  key: requiredText(r.service_key),
  name: requiredText(r.service_name, 'Unnamed service'),
  confirmedAt: text(r.confirmed_at),
})
const toServiceFact = (r: Row): AdminServiceFact => ({
  id: requiredText(r.fact_id),
  serviceKey: requiredText(r.service_key),
  key: requiredText(r.fact_key),
  title: requiredText(r.fact_title, 'Untitled fact'),
  value: decimal(r.value),
  unit: text(r.unit),
  reportingYear: integer(r.reporting_year),
})

export async function loadAdminContent(): Promise<AdminContent> {
  try {
    const [
      editions,
      categories,
      personas,
      personaExpenses,
      scenarios,
      choices,
      supportEffects,
      jobs,
      statistics,
      scenarioStatistics,
      services,
      serviceFacts,
    ] = await Promise.all([
      fetchAll(
        'content_versions',
        'version_id, version_number, status, created_at, published_at, change_summary',
        'version_number',
      ),
      fetchAll('categories', 'category_id, name, description', 'name'),
      fetchAll(
        'personas',
        'persona_id, version_id, name, description, general_starting_balance, weekly_income, starting_job_id, has_english_skills, has_computer_skills',
        'persona_id',
      ),
      fetchAll(
        'persona_expenses',
        'expense_id, persona_id, version_id, name, amount, first_due_day, repeat_interval_days, late_fee_amount',
        'expense_id',
      ),
      fetchAll(
        'scenarios',
        'scenario_id, version_id, title, description, default_day, category_id, persona_intent, schedule_type',
        'scenario_id',
      ),
      fetchAll(
        'choices',
        'choice_id, scenario_id, version_id, choice_text, balance_change, response_text, next_scenario_id',
        'choice_id',
      ),
      fetchAll(
        'cac_support_effects',
        'support_effect_id, choice_id, version_id, assistance_amount, response_text, explanation',
        'support_effect_id',
      ),
      fetchAll(
        'jobs',
        'job_id, version_id, soc_code, title, description, area_name, wage_year, median_hourly_wage, hours_per_week, weekly_gross_income, entry_education, related_experience, on_job_training, simulation_requirements, wage_source_url, requirements_source_url, reviewed_at, is_approved, is_active, needs_english_skills, needs_computer_skills',
        'job_id',
      ),
      fetchAll(
        'statistics',
        'statistic_id, version_id, description, value, unit, geography, data_period, source_url, last_reviewed_at',
        'statistic_id',
      ),
      fetchAll(
        'scenario_statistics',
        'scenario_id, statistic_id, version_id, fact_role',
        'scenario_id',
      ),
      fetchAll(
        'cac_services',
        'service_key, service_name, confirmed_at',
        'service_key',
      ),
      fetchAll(
        'cac_service_facts',
        'fact_id, service_key, fact_key, fact_title, value, unit, reporting_year',
        'fact_id',
      ),
    ])
    return {
      editions: editions.map(toEdition),
      categories: categories.map(toCategory),
      personas: personas.map(toPersona),
      personaExpenses: personaExpenses.map(toPersonaExpense),
      scenarios: scenarios.map(toScenario),
      choices: choices.map(toChoice),
      supportEffects: supportEffects.map(toSupportEffect),
      jobs: jobs.map(toJob),
      statistics: statistics.map(toStatistic),
      scenarioStatistics: scenarioStatistics.map(toScenarioStatistic),
      services: services.map(toService),
      serviceFacts: serviceFacts.map(toServiceFact),
    }
  } catch (cause) {
    throw new AdminContentError({ cause })
  }
}
