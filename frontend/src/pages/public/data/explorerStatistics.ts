// Pure helpers for published Explore Data statistics: number formatting and the
// conversion of a percentage into pictogram fills. No React, no network.
import type { ExplorerStatistic } from '../../../services/explorerService'
import type { LiveStatisticsState } from './useExplorerStatistics'

/**
 * How full each of `total` icons is, left to right, for a share of a whole.
 *
 * The last filled icon is filled partially instead of rounded to a whole icon,
 * so 13.5% of 20 icons is 2.7 icons, never 3. The sum of the fills always
 * equals percent / 100 * total (to four decimal places), so the picture cannot
 * overstate or understate the statistic. Invalid input throws rather than
 * drawing a misleading image.
 */
export function pictogramFills(percent: number, total: number): number[] {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new RangeError(
      `A percentage must be between 0 and 100 (got ${percent})`,
    )
  }
  if (!Number.isInteger(total) || total < 1 || total > 100) {
    throw new RangeError(
      `An icon count must be a whole number from 1 to 100 (got ${total})`,
    )
  }
  const filledIcons = (percent / 100) * total
  return Array.from({ length: total }, (_, index) => {
    const fill = Math.min(1, Math.max(0, filledIcons - index))
    return Math.round(fill * 10000) / 10000
  })
}

/** Total icon-equivalents drawn, for the text alternative ("2.7 of 20"). */
export function filledIconCount(fills: readonly number[]): number {
  return Math.round(fills.reduce((sum, fill) => sum + fill, 0) * 10000) / 10000
}

const wholeNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

function decimals(statistic: ExplorerStatistic): number {
  const configured = statistic.visualizationConfig.decimals
  return typeof configured === 'number' &&
    Number.isInteger(configured) &&
    configured >= 0 &&
    configured <= 4
    ? configured
    : 1
}

function fixed(value: number, places: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  }).format(value)
}

/** Format one number in the statistic's unit. Always includes the unit. */
export function formatNumber(
  statistic: ExplorerStatistic,
  value: number,
): string {
  const places = decimals(statistic)
  switch (statistic.unit) {
    case 'percent':
      return `${fixed(value, places)}%`
    case 'percent_change': {
      const sign = value > 0 ? '+' : value < 0 ? '−' : ''
      return `${sign}${fixed(Math.abs(value), places)}%`
    }
    case 'usd':
      return `$${fixed(value, Number.isInteger(value) ? 0 : 2)}`
    case 'cents_per_kwh':
      return `${fixed(value, places)} cents per kWh`
    case 'index':
      return fixed(value, places)
    case 'count':
      return wholeNumber.format(value)
  }
}

/** The exact value as text, including a range when the source gives one. */
export function formatStatisticValue(statistic: ExplorerStatistic): string {
  const low = formatNumber(statistic, statistic.value)
  if (statistic.valueHigh === null) return low
  const high = formatNumber(statistic, statistic.valueHigh)
  return `${low}–${high}`
}

/** Plain-language reading of the value for assistive technology. */
export function describeStatistic(statistic: ExplorerStatistic): string {
  return `${statistic.title}: ${formatStatisticValue(statistic)}. ${statistic.geography}, ${statistic.periodLabel}.`
}

/** Whether the statistic can be drawn as a share of a whole. */
export function isShare(statistic: ExplorerStatistic): boolean {
  return statistic.unit === 'percent' && statistic.valueHigh === null
}

/** The published statistic with this key, once the topic's statistics have loaded. */
export function findStatistic(
  state: LiveStatisticsState,
  key: string,
): ExplorerStatistic | undefined {
  return state.status === 'ready'
    ? state.statistics.find((statistic) => statistic.key === key)
    : undefined
}

/** The same lookup, kept only when the statistic is a single share of a whole. */
export function findShare(
  state: LiveStatisticsState,
  key: string,
): ExplorerStatistic | undefined {
  const statistic = findStatistic(state, key)
  return statistic && isShare(statistic) ? statistic : undefined
}
