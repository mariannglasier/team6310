import {
  usdCents,
  type Job,
  type Persona,
  type PublishedHouseholds,
  type UsdCents,
} from '../types/domain'
import { getSupabaseClient } from './supabase'

// Read-only access to approved content. Row Level Security exposes only published
// editions (and only approved, active jobs) to the publishable key; this module
// still validates what it receives and never writes or accepts client money.

export class ContentUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super(
      'Unable to load households and jobs right now. Please retry or contact the facilitator.',
      options,
    )
    this.name = 'ContentUnavailableError'
  }
}

export interface ContentService {
  // Resolves null when no edition has been published.
  loadHouseholds(): Promise<PublishedHouseholds | null>
  // Approved jobs for a pinned edition; used by the later pre-game job step.
  loadJobs(versionId: string): Promise<readonly Job[]>
}

const MONEY = /^(-)?(\d+)(?:\.(\d{1,2}))?$/

// PostgREST returns numeric columns as JSON numbers or strings. Convert through
// text so binary floating point never touches currency.
export function parseUsdCents(value: unknown, field: string): UsdCents {
  let text: string
  if (typeof value === 'number' && Number.isFinite(value)) {
    text = value.toFixed(2)
    if (Number(text) !== value)
      throw new Error(`${field} has sub-cent precision`)
  } else if (typeof value === 'string') {
    text = value.trim()
  } else {
    throw new Error(`${field} is missing`)
  }
  const match = MONEY.exec(text)
  if (!match) throw new Error(`${field} is not a USD amount`)
  const [, sign, whole, fraction = ''] = match
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return usdCents(sign ? -cents : cents)
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error(`${field} is missing`)
  return value
}

function requireInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value))
    throw new Error(`${field} is not an integer`)
  return value
}

function toNumber(value: unknown, field: string): number {
  const number = typeof value === 'string' ? Number(value) : value
  if (typeof number !== 'number' || !Number.isFinite(number) || number <= 0)
    throw new Error(`${field} is not a positive number`)
  return number
}

type Row = Record<string, unknown>

export function toPersona(row: Row): Persona {
  // All approved households begin unemployed with $0 weekly income.
  if (row.starting_job_id !== null && row.starting_job_id !== undefined)
    throw new Error('persona must start unemployed')
  if (parseUsdCents(row.weekly_income ?? 0, 'weekly_income') !== 0)
    throw new Error('persona weekly income must start at $0')
  return {
    id: requireString(row.persona_id, 'persona_id'),
    versionId: requireString(row.version_id, 'version_id'),
    name: requireString(row.name, 'name'),
    description: requireString(row.description, 'description'),
    startingBalance: parseUsdCents(
      row.general_starting_balance,
      'general_starting_balance',
    ),
  }
}

function requirementsNote(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null
  const note = (value as Row).notes
  return typeof note === 'string' && note.trim() !== '' ? note : null
}

export function toJob(row: Row): Job {
  return {
    id: requireString(row.job_id, 'job_id'),
    versionId: requireString(row.version_id, 'version_id'),
    socCode: requireString(row.soc_code, 'soc_code'),
    title: requireString(row.title, 'title'),
    description: typeof row.description === 'string' ? row.description : null,
    hoursPerWeek: toNumber(row.hours_per_week, 'hours_per_week'),
    medianHourlyWage: parseUsdCents(
      row.median_hourly_wage,
      'median_hourly_wage',
    ),
    weeklyGrossIncome: parseUsdCents(
      row.weekly_gross_income,
      'weekly_gross_income',
    ),
    wageYear: requireInteger(row.wage_year, 'wage_year'),
    areaName: requireString(row.area_name, 'area_name'),
    wageSourceUrl: requireString(row.wage_source_url, 'wage_source_url'),
    requirementsNote: requirementsNote(row.simulation_requirements),
  }
}

function unavailable(error: unknown): never {
  // Do not surface database or validation detail to participants.
  throw new ContentUnavailableError({ cause: error })
}

async function loadHouseholds(): Promise<PublishedHouseholds | null> {
  try {
    const supabase = await getSupabaseClient()
    const versions = await supabase
      .from('content_versions')
      .select('version_id,version_number')
      .order('version_number', { ascending: false })
      .limit(1)
    if (versions.error) throw versions.error
    const version = versions.data?.[0]
    if (!version) return null
    const personas = await supabase
      .from('personas')
      .select(
        'persona_id,version_id,name,description,general_starting_balance,weekly_income,starting_job_id',
      )
      .eq('version_id', version.version_id)
      .order('name')
    if (personas.error) throw personas.error
    return {
      versionId: version.version_id,
      versionNumber: version.version_number,
      personas: (personas.data ?? []).map(toPersona),
    }
  } catch (error) {
    return unavailable(error)
  }
}

async function loadJobs(versionId: string): Promise<readonly Job[]> {
  try {
    const supabase = await getSupabaseClient()
    const jobs = await supabase
      .from('jobs')
      .select(
        'job_id,version_id,soc_code,title,description,area_name,wage_year,median_hourly_wage,hours_per_week,weekly_gross_income,wage_source_url,simulation_requirements',
      )
      .eq('version_id', versionId)
      .order('title')
    if (jobs.error) throw jobs.error
    return (jobs.data ?? []).map(toJob)
  } catch (error) {
    return unavailable(error)
  }
}

export const contentService: ContentService = { loadHouseholds, loadJobs }
