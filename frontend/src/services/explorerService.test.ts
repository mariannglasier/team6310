import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ExplorerUnavailableError,
  loadExplorerCategories,
  loadExplorerStatistics,
  parseCategory,
  parseStatistic,
  resetExplorerCache,
} from './explorerService'

const { getSupabaseClient } = vi.hoisted(() => ({ getSupabaseClient: vi.fn() }))
vi.mock('./supabase', () => ({ getSupabaseClient }))

const categoryRow = {
  category_key: 'food',
  name: 'Food & Nutrition',
  short_label: 'Food',
  description: 'Prices move while a budget stays put.',
  icon_key: 'grocery-bag',
  display_order: 2,
  visualization_type: 'grocery_cart',
  statistic_count: 1,
}

const statisticRow = {
  statistic_key: 'atl_food_beverage_cpi_change',
  title: 'Food and beverage prices, year over year',
  description: 'How much more food costs than a year ago.',
  context_note: 'Not the price of any one item.',
  value: 3.6307,
  value_high: null,
  unit: 'percent_change',
  geography: 'Atlanta-Sandy Springs-Roswell, GA (metro area)',
  geography_code: null,
  period_label: 'August 2026 compared with August 2025',
  period_start: '2026-08-01',
  period_end: '2026-08-31',
  source_name: 'Federal Reserve Bank of St. Louis',
  source_title: 'FRED Economic Data',
  source_url: 'https://fred.stlouisfed.org/',
  last_checked_at: '2026-11-17T21:00:00+00:00',
  visualization_type: 'figure',
  visualization_config: { signed: true, decimals: 1 },
  is_derived: true,
  derivation_note: 'Percent change = latest / prior year - 1.',
  display_order: 1,
}

function clientReturning(data: unknown, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error })
  getSupabaseClient.mockResolvedValue({ rpc })
  return rpc
}

beforeEach(() => {
  getSupabaseClient.mockReset()
  resetExplorerCache()
})

describe('parsing', () => {
  it('maps a category row', () => {
    expect(parseCategory(categoryRow)).toMatchObject({
      key: 'food',
      name: 'Food & Nutrition',
      shortLabel: 'Food',
      displayOrder: 2,
      statisticCount: 1,
    })
  })

  it('maps a statistic row, including derived metadata and nulls', () => {
    const stat = parseStatistic(statisticRow)
    expect(stat).toMatchObject({
      key: 'atl_food_beverage_cpi_change',
      value: 3.6307,
      valueHigh: null,
      unit: 'percent_change',
      isDerived: true,
      geographyCode: null,
      sourceUrl: 'https://fred.stlouisfed.org/',
    })
    expect(stat.visualizationConfig).toEqual({ signed: true, decimals: 1 })
  })

  it('accepts numeric text from the API and keeps ranges', () => {
    const stat = parseStatistic({
      ...statisticRow,
      unit: 'count',
      value: '1600',
      value_high: '2000',
    })
    expect(stat.value).toBe(1600)
    expect(stat.valueHigh).toBe(2000)
  })

  it.each([
    ['an unknown unit', { unit: 'dollars_per_fortnight' }],
    ['an unknown visualization', { visualization_type: 'sparkle' }],
    ['a non-numeric value', { value: 'lots' }],
    ['a missing title', { title: '' }],
    ['a range that is inverted', { value: 10, value_high: 5 }],
    ['a percent above 100', { unit: 'percent', value: 101 }],
    ['a negative percent', { unit: 'percent', value: -1 }],
    ['an HTTP source link', { source_url: 'http://example.org' }],
    ['a script source link', { source_url: 'javascript:alert(1)' }],
    ['array visualization config', { visualization_config: [] }],
  ])('rejects %s', (_name, overrides) => {
    expect(() => parseStatistic({ ...statisticRow, ...overrides })).toThrow()
  })

  it('accepts 0%, 50% and 100% shares', () => {
    for (const value of [0, 50, 100]) {
      expect(
        parseStatistic({ ...statisticRow, unit: 'percent', value }).value,
      ).toBe(value)
    }
  })
})

describe('loading', () => {
  it('requests published statistics for one category through the RPC', async () => {
    const rpc = clientReturning([statisticRow])
    const result = await loadExplorerStatistics('food')
    expect(rpc).toHaveBeenCalledWith('get_explorer_category_statistics', {
      p_category_key: 'food',
    })
    expect(result).toHaveLength(1)
    expect(result[0].title).toMatch(/Food and beverage/)
  })

  it('returns an empty list when nothing is published', async () => {
    clientReturning([])
    expect(await loadExplorerStatistics('clothing')).toEqual([])
  })

  it('loads categories through the RPC', async () => {
    const rpc = clientReturning([categoryRow])
    const result = await loadExplorerCategories()
    expect(rpc).toHaveBeenCalledWith('get_explorer_categories', undefined)
    expect(result[0].key).toBe('food')
  })

  it('reuses a recent identical request instead of calling again', async () => {
    const rpc = clientReturning([statisticRow])
    await loadExplorerStatistics('food')
    await loadExplorerStatistics('food')
    expect(rpc).toHaveBeenCalledTimes(1)
    await loadExplorerStatistics('housing')
    expect(rpc).toHaveBeenCalledTimes(2)
  })

  it('does not cache a failure, so Retry can succeed', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'boom' } })
      .mockResolvedValueOnce({ data: [statisticRow], error: null })
    getSupabaseClient.mockResolvedValue({ rpc })
    await expect(loadExplorerStatistics('food')).rejects.toBeInstanceOf(
      ExplorerUnavailableError,
    )
    expect(await loadExplorerStatistics('food')).toHaveLength(1)
  })

  it('reports an unavailable error for database errors, bad shapes, and missing configuration', async () => {
    clientReturning(null, { message: 'permission denied' })
    await expect(loadExplorerStatistics('food')).rejects.toBeInstanceOf(
      ExplorerUnavailableError,
    )
    clientReturning({ not: 'an array' })
    await expect(loadExplorerCategories()).rejects.toBeInstanceOf(
      ExplorerUnavailableError,
    )
    getSupabaseClient.mockRejectedValue(
      new Error('Missing Supabase environment variables'),
    )
    await expect(loadExplorerStatistics('housing')).rejects.toBeInstanceOf(
      ExplorerUnavailableError,
    )
  })

  it('treats a malformed row as unavailable instead of showing wrong data', async () => {
    clientReturning([{ ...statisticRow, value: 'NaN' }])
    await expect(loadExplorerStatistics('food')).rejects.toBeInstanceOf(
      ExplorerUnavailableError,
    )
  })

  it('never sends credentials or writes: only the two read RPCs exist', async () => {
    const rpc = clientReturning([])
    await loadExplorerCategories()
    await loadExplorerStatistics('food')
    expect(rpc.mock.calls.map((call) => call[0]).sort()).toEqual([
      'get_explorer_categories',
      'get_explorer_category_statistics',
    ])
  })
})
