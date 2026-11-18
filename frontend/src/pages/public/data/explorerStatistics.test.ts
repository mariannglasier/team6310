import { describe, expect, test } from 'vitest'
import type { ExplorerStatistic } from '../../../services/explorerService'
import type { LiveStatisticsState } from './useExplorerStatistics'
import {
  describeStatistic,
  findShare,
  findStatistic,
  filledIconCount,
  formatNumber,
  formatStatisticValue,
  isShare,
  pictogramFills,
} from './explorerStatistics'

function statistic(
  overrides: Partial<ExplorerStatistic> = {},
): ExplorerStatistic {
  return {
    key: 'test',
    title: 'Test statistic',
    description: 'What it measures.',
    contextNote: null,
    value: 13.5,
    valueHigh: null,
    unit: 'percent',
    geography: 'Test area',
    geographyCode: null,
    periodLabel: '2024',
    sourceName: 'Source',
    sourceTitle: 'Title',
    sourceUrl: 'https://example.org',
    lastCheckedAt: null,
    visualization: 'meter',
    visualizationConfig: {},
    isDerived: false,
    derivationNote: null,
    displayOrder: 1,
    ...overrides,
  }
}

describe('pictogramFills', () => {
  test('0% fills no icons', () => {
    const fills = pictogramFills(0, 10)
    expect(fills).toHaveLength(10)
    expect(fills.every((fill) => fill === 0)).toBe(true)
    expect(filledIconCount(fills)).toBe(0)
  })

  test('50% fills exactly half of the icons', () => {
    const fills = pictogramFills(50, 10)
    expect(fills).toEqual([1, 1, 1, 1, 1, 0, 0, 0, 0, 0])
    expect(filledIconCount(fills)).toBe(5)
  })

  test('100% fills every icon completely', () => {
    const fills = pictogramFills(100, 10)
    expect(fills.every((fill) => fill === 1)).toBe(true)
    expect(filledIconCount(fills)).toBe(10)
  })

  test('a fractional share fills the last icon partially instead of rounding', () => {
    const fills = pictogramFills(13.5, 20)
    expect(fills.slice(0, 2)).toEqual([1, 1])
    expect(fills[2]).toBe(0.7)
    expect(fills.slice(3).every((fill) => fill === 0)).toBe(true)
    expect(filledIconCount(fills)).toBe(2.7)
  })

  test('the drawn amount always equals the stored share, for many values and sizes', () => {
    for (const total of [1, 5, 6, 10, 12, 20, 25, 100]) {
      for (const percent of [
        0, 0.5, 1, 8.5, 13.7, 16.7, 33.3, 37, 50, 66.6, 99.9, 100,
      ]) {
        const expected = (percent / 100) * total
        const drawn = filledIconCount(pictogramFills(percent, total))
        expect(Math.abs(drawn - expected)).toBeLessThan(0.001 * total)
      }
    }
  })

  test('fills never fall outside 0 to 1 and are non-increasing left to right', () => {
    const fills = pictogramFills(37, 9)
    for (let i = 0; i < fills.length; i += 1) {
      expect(fills[i]).toBeGreaterThanOrEqual(0)
      expect(fills[i]).toBeLessThanOrEqual(1)
      if (i > 0) expect(fills[i]).toBeLessThanOrEqual(fills[i - 1])
    }
  })

  test.each([-0.1, 100.1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects the invalid percentage %s rather than drawing a misleading image',
    (percent) => {
      expect(() => pictogramFills(percent, 10)).toThrow(RangeError)
    },
  )

  test.each([0, -1, 101, 2.5, Number.NaN])(
    'rejects the invalid icon count %s',
    (total) => {
      expect(() => pictogramFills(50, total)).toThrow(RangeError)
    },
  )
})

describe('formatting', () => {
  test('percent keeps the configured decimals and the unit', () => {
    expect(formatNumber(statistic(), 13.5)).toBe('13.5%')
    expect(formatNumber(statistic(), 0)).toBe('0.0%')
    expect(formatNumber(statistic(), 100)).toBe('100.0%')
    expect(
      formatNumber(statistic({ visualizationConfig: { decimals: 0 } }), 13.5),
    ).toBe('14%')
  })

  test('percent change is signed and uses a true minus sign', () => {
    const change = statistic({ unit: 'percent_change' })
    expect(formatNumber(change, 3.6307)).toBe('+3.6%')
    expect(formatNumber(change, -2.04)).toBe('−2.0%')
    expect(formatNumber(change, 0)).toBe('0.0%')
  })

  test('dollars, cents per kilowatt-hour, index and counts', () => {
    expect(formatNumber(statistic({ unit: 'usd' }), 1493)).toBe('$1,493')
    expect(formatNumber(statistic({ unit: 'usd' }), 12.5)).toBe('$12.50')
    expect(formatNumber(statistic({ unit: 'cents_per_kwh' }), 13.42)).toBe(
      '13.4 cents per kWh',
    )
    expect(formatNumber(statistic({ unit: 'index' }), 352.328)).toBe('352.3')
    expect(formatNumber(statistic({ unit: 'count' }), 1600)).toBe('1,600')
  })

  test('a range keeps both ends and is never shown as a single point', () => {
    const range = statistic({ unit: 'count', value: 1600, valueHigh: 2000 })
    expect(formatStatisticValue(range)).toBe('1,600–2,000')
    expect(isShare(statistic({ valueHigh: 20 }))).toBe(false)
  })

  test('isShare only accepts a single percent', () => {
    expect(isShare(statistic())).toBe(true)
    expect(isShare(statistic({ unit: 'percent_change' }))).toBe(false)
    expect(isShare(statistic({ unit: 'count' }))).toBe(false)
  })

  test('describeStatistic includes the value, place, and period', () => {
    expect(describeStatistic(statistic())).toBe(
      'Test statistic: 13.5%. Test area, 2024.',
    )
  })
})

describe('findStatistic and findShare', () => {
  const rent = statistic({ key: 'rent', value: 44.7 })
  const burden = statistic({ key: 'burden', unit: 'percent', valueHigh: 20 })
  const price = statistic({ key: 'price', unit: 'percent_change', value: 3.6 })
  const ready: LiveStatisticsState = {
    status: 'ready',
    statistics: [rent, burden, price],
  }

  test('finds a published statistic by key', () => {
    expect(findStatistic(ready, 'rent')).toBe(rent)
    expect(findStatistic(ready, 'price')).toBe(price)
  })

  test('finds nothing for an unpublished key or an unloaded topic', () => {
    expect(findStatistic(ready, 'missing')).toBeUndefined()
    expect(findStatistic({ status: 'loading' }, 'rent')).toBeUndefined()
    expect(findStatistic({ status: 'error' }, 'rent')).toBeUndefined()
  })

  test('a share is a single percent value, never a range or a change', () => {
    expect(findShare(ready, 'rent')).toBe(rent)
    expect(findShare(ready, 'burden')).toBeUndefined()
    expect(findShare(ready, 'price')).toBeUndefined()
  })
})
