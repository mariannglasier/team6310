import { getSupabaseClient } from './supabase'

// Read-only access to the PUBLISHED Explore Data statistics. The database
// exposes them only through two RPCs that return published rows and omit staged
// values and source bindings; this module still validates what it receives and
// never writes. These tables are separate from gameplay content.

export type StatisticUnit =
  'percent' | 'percent_change' | 'usd' | 'cents_per_kwh' | 'index' | 'count'

export type StatisticVisualization =
  'meter' | 'pictogram' | 'trend' | 'comparison' | 'figure'

export interface ExplorerCategorySummary {
  readonly key: string
  readonly name: string
  readonly shortLabel: string
  readonly description: string
  readonly iconKey: string
  readonly displayOrder: number
  readonly visualizationType: string
  readonly statisticCount: number
}

export interface ExplorerStatistic {
  readonly key: string
  readonly title: string
  readonly description: string
  readonly contextNote: string | null
  readonly value: number
  readonly valueHigh: number | null
  readonly unit: StatisticUnit
  readonly geography: string
  readonly geographyCode: string | null
  readonly periodLabel: string
  readonly sourceName: string
  readonly sourceTitle: string
  readonly sourceUrl: string
  readonly lastCheckedAt: string | null
  readonly visualization: StatisticVisualization
  readonly visualizationConfig: Readonly<Record<string, unknown>>
  readonly isDerived: boolean
  readonly derivationNote: string | null
  readonly displayOrder: number
}

export class ExplorerUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super('Live statistics could not be loaded right now.', options)
    this.name = 'ExplorerUnavailableError'
  }
}

const UNITS: readonly StatisticUnit[] = [
  'percent',
  'percent_change',
  'usd',
  'cents_per_kwh',
  'index',
  'count',
]
const VISUALIZATIONS: readonly StatisticVisualization[] = [
  'meter',
  'pictogram',
  'trend',
  'comparison',
  'figure',
]

type Row = Record<string, unknown>

function text(row: Row, field: string): string {
  const value = row[field]
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error(`${field} is missing`)
  return value
}

function optionalText(row: Row, field: string): string | null {
  const value = row[field]
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw new Error(`${field} is not text`)
  return value.trim() === '' ? null : value
}

// PostgREST returns numeric columns as JSON numbers; accept numeric text too.
function numeric(row: Row, field: string): number {
  const value = row[field]
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim())
        ? Number(value)
        : Number.NaN
  if (!Number.isFinite(parsed)) throw new Error(`${field} is not a number`)
  return parsed
}

function optionalNumeric(row: Row, field: string): number | null {
  return row[field] === null || row[field] === undefined
    ? null
    : numeric(row, field)
}

function integer(row: Row, field: string): number {
  const value = numeric(row, field)
  if (!Number.isInteger(value))
    throw new Error(`${field} is not a whole number`)
  return value
}

// Source links are rendered as hrefs, so only HTTPS URLs are accepted.
function httpsUrl(row: Row, field: string): string {
  const value = text(row, field)
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${field} is not a URL`)
  }
  if (parsed.protocol !== 'https:') throw new Error(`${field} must be HTTPS`)
  return value
}

export function parseCategory(row: Row): ExplorerCategorySummary {
  return {
    key: text(row, 'category_key'),
    name: text(row, 'name'),
    shortLabel: text(row, 'short_label'),
    description: text(row, 'description'),
    iconKey: text(row, 'icon_key'),
    displayOrder: integer(row, 'display_order'),
    visualizationType: text(row, 'visualization_type'),
    statisticCount: integer(row, 'statistic_count'),
  }
}

export function parseStatistic(row: Row): ExplorerStatistic {
  const unit = text(row, 'unit') as StatisticUnit
  if (!UNITS.includes(unit)) throw new Error(`unit "${unit}" is not supported`)
  const visualization = text(
    row,
    'visualization_type',
  ) as StatisticVisualization
  if (!VISUALIZATIONS.includes(visualization))
    throw new Error(`visualization "${visualization}" is not supported`)
  const config = row.visualization_config
  if (config === null || typeof config !== 'object' || Array.isArray(config))
    throw new Error('visualization_config is not an object')

  const value = numeric(row, 'value')
  const valueHigh = optionalNumeric(row, 'value_high')
  if (valueHigh !== null && valueHigh < value)
    throw new Error('value_high is below value')
  if (
    unit === 'percent' &&
    (value < 0 || value > 100 || (valueHigh !== null && valueHigh > 100))
  )
    throw new Error('a percent value is outside 0 to 100')

  return {
    key: text(row, 'statistic_key'),
    title: text(row, 'title'),
    description: text(row, 'description'),
    contextNote: optionalText(row, 'context_note'),
    value,
    valueHigh,
    unit,
    geography: text(row, 'geography'),
    geographyCode: optionalText(row, 'geography_code'),
    periodLabel: text(row, 'period_label'),
    sourceName: text(row, 'source_name'),
    sourceTitle: text(row, 'source_title'),
    sourceUrl: httpsUrl(row, 'source_url'),
    lastCheckedAt: optionalText(row, 'last_checked_at'),
    visualization,
    visualizationConfig: config as Record<string, unknown>,
    isDerived: row.is_derived === true,
    derivationNote: optionalText(row, 'derivation_note'),
    displayOrder: integer(row, 'display_order'),
  }
}

// Published values change at most monthly, so a short cache avoids repeated
// identical requests when visitors move between topics.
const CACHE_MS = 5 * 60 * 1000
const cache = new Map<string, { at: number; value: unknown }>()

export function resetExplorerCache(): void {
  cache.clear()
}

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T
  const value = await load()
  cache.set(key, { at: Date.now(), value })
  return value
}

async function rpcRows(name: string, args?: Record<string, string>) {
  try {
    const client = await getSupabaseClient()
    const { data, error } = await client.rpc(name, args)
    if (error) throw error
    if (!Array.isArray(data)) throw new Error('unexpected response')
    return data as Row[]
  } catch (cause) {
    throw new ExplorerUnavailableError({ cause })
  }
}

export function loadExplorerCategories(): Promise<
  readonly ExplorerCategorySummary[]
> {
  return cached('categories', async () => {
    const rows = await rpcRows('get_explorer_categories')
    try {
      return rows.map(parseCategory)
    } catch (cause) {
      throw new ExplorerUnavailableError({ cause })
    }
  })
}

export function loadExplorerStatistics(
  categoryKey: string,
): Promise<readonly ExplorerStatistic[]> {
  return cached(`statistics:${categoryKey}`, async () => {
    const rows = await rpcRows('get_explorer_category_statistics', {
      p_category_key: categoryKey,
    })
    try {
      return rows.map(parseStatistic)
    } catch (cause) {
      throw new ExplorerUnavailableError({ cause })
    }
  })
}
