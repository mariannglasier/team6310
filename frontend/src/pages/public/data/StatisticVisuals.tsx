import { useId, useState } from 'react'
import { ExplorerIcon } from './ExplorerIcon'
import {
  loadExplorerStatistics,
  type ExplorerStatistic,
} from '../../../services/explorerService'
import {
  useExplorerStatistics,
  type LiveStatisticsState,
} from './useExplorerStatistics'
import {
  describeStatistic,
  filledIconCount,
  formatStatisticValue,
  isShare,
  pictogramFills,
} from './explorerStatistics'

// Simple shapes for the topic-specific pictograms. Empty icons are outlines,
// filled icons are solid, and a partial icon is cut part-way, so the share is
// readable without color.
const ICON_SHAPES: Readonly<Record<string, string>> = {
  grocery_item: 'M12 8c-4 0-7 2.8-7 6.5S8 21 12 21s7-2.8 7-6.5S16 8 12 8Z',
  school_item: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3Z',
  person: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8Z',
  dot: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z',
}

function PictogramIcon({ fill, icon }: { fill: number; icon: string }) {
  const clipId = useId()
  const shape = ICON_SHAPES[icon] ?? ICON_SHAPES.dot
  return (
    <svg
      className="pictogram__icon"
      viewBox="0 0 24 24"
      width="28"
      height="28"
      focusable="false"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <rect
            x="0"
            y="0"
            width={Math.round(24 * fill * 100) / 100}
            height="24"
          />
        </clipPath>
      </defs>
      {icon === 'grocery_item' && (
        <path className="pictogram__stem" d="M12 8c0-2 1-4 3-5" />
      )}
      <path className="pictogram__outline" d={shape} />
      {fill > 0 && (
        <path
          className="pictogram__fill"
          d={shape}
          clipPath={`url(#${clipId})`}
        />
      )}
    </svg>
  )
}

/**
 * A share of a whole drawn as `total` icons. The exact value stays in text
 * beside it; the picture never rounds to whole icons.
 */
export function PercentPictogram({
  percent,
  total,
  icon,
  container,
  valueText,
  dense = false,
}: {
  percent: number
  total: number
  icon: string
  container?: string
  valueText: string
  /** Smaller icons in rows of ten, for a count of 100. */
  dense?: boolean
}) {
  const fills = pictogramFills(percent, total)
  const filled = filledIconCount(fills)
  return (
    <figure
      className={`pictogram${dense ? ' pictogram--dense' : ''}`}
      data-container={container}
    >
      <div
        className="pictogram__icons"
        role="img"
        aria-label={`${valueText} shown as ${filled} of ${total} icons filled`}
      >
        {fills.map((fill, index) => (
          <PictogramIcon key={index} fill={fill} icon={icon} />
        ))}
      </div>
      <figcaption className="pictogram__caption" aria-hidden="true">
        {filled} of {total} icons filled = {valueText}
      </figcaption>
    </figure>
  )
}

/** A 0–100% bar with its endpoints and exact value as text. */
export function PercentMeter({
  percent,
  label,
  valueText,
}: {
  percent: number
  label: string
  valueText: string
}) {
  const safe = Math.min(100, Math.max(0, percent))
  return (
    <div className="stat-meter">
      <div
        className="stat-meter__bar"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safe}
        aria-valuetext={valueText}
      >
        <span style={{ width: `${safe}%` }} />
      </div>
      <div className="stat-meter__ends" aria-hidden="true">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

function pictogramTotal(statistic: ExplorerStatistic): number | null {
  const total = statistic.visualizationConfig.total
  return typeof total === 'number' &&
    Number.isInteger(total) &&
    total >= 1 &&
    total <= 100
    ? total
    : null
}

function checkedOn(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
}

function StatisticVisual({ statistic }: { statistic: ExplorerStatistic }) {
  if (!isShare(statistic)) return null
  const valueText = formatStatisticValue(statistic)
  const total = pictogramTotal(statistic)
  if (statistic.visualization === 'pictogram' && total !== null) {
    const icon = statistic.visualizationConfig.icon
    const container = statistic.visualizationConfig.container
    return (
      <PercentPictogram
        percent={statistic.value}
        total={total}
        icon={typeof icon === 'string' ? icon : 'dot'}
        container={typeof container === 'string' ? container : undefined}
        valueText={valueText}
      />
    )
  }
  if (
    statistic.visualization === 'meter' ||
    statistic.visualization === 'pictogram'
  ) {
    return (
      <PercentMeter
        percent={statistic.value}
        label={describeStatistic(statistic)}
        valueText={valueText}
      />
    )
  }
  return null
}

export function StatisticCard({ statistic }: { statistic: ExplorerStatistic }) {
  const headingId = useId()
  const checked = statistic.lastCheckedAt
    ? checkedOn(statistic.lastCheckedAt)
    : null
  return (
    <li className="stat-card" aria-labelledby={headingId}>
      <h4 className="stat-card__title" id={headingId}>
        {statistic.title}
      </h4>
      <strong className="stat-card__value">
        {formatStatisticValue(statistic)}
      </strong>
      <StatisticVisual statistic={statistic} />
      <p className="stat-card__meta">
        {statistic.geography} · {statistic.periodLabel}
      </p>
      <details className="stat-card__more">
        <summary>About this number</summary>
        <p className="stat-card__what">{statistic.description}</p>
        {statistic.isDerived && statistic.derivationNote && (
          <p className="stat-card__derived">
            <strong>How it is calculated:</strong> {statistic.derivationNote}
          </p>
        )}
        {statistic.contextNote && (
          <p className="stat-card__note">{statistic.contextNote}</p>
        )}
        <p className="stat-card__source">
          Source:{' '}
          <a
            href={statistic.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {statistic.sourceName}
            <span className="explorer-sr"> (opens in a new tab)</span>
          </a>
          <span className="stat-card__source-title">
            {' '}
            — {statistic.sourceTitle}
          </span>
          {checked && <span> · Last checked {checked}</span>}
        </p>
      </details>
    </li>
  )
}

const PAGE_SIZE = 3

/**
 * Statistic cards a few at a time, so a topic with many published statistics
 * stays a single row instead of a long wall of cards. Nothing is dropped:
 * Previous and Next reach every statistic.
 */
export function StatisticPager({
  statistics,
  pageSize = PAGE_SIZE,
}: {
  statistics: readonly ExplorerStatistic[]
  pageSize?: number
}) {
  const [requested, setRequested] = useState(0)
  const pages = Math.max(1, Math.ceil(statistics.length / pageSize))
  const page = Math.min(requested, pages - 1)
  const first = page * pageSize
  const visible = statistics.slice(first, first + pageSize)
  const last = first + visible.length

  return (
    <div className="stat-pager">
      <ul className="stat-grid">
        {visible.map((statistic) => (
          <StatisticCard key={statistic.key} statistic={statistic} />
        ))}
      </ul>
      {pages > 1 && (
        <div className="stat-pager__bar" role="group" aria-label="More numbers">
          <button
            type="button"
            className="stat-pager__button"
            aria-label="Previous numbers"
            disabled={page === 0}
            onClick={() => setRequested(page - 1)}
          >
            <ExplorerIcon kind="arrow" size={18} />
          </button>
          <span className="stat-pager__count" aria-live="polite">
            {first + 1}–{last} of {statistics.length}
          </span>
          <button
            type="button"
            className="stat-pager__button stat-pager__button--next"
            aria-label="Next numbers"
            disabled={page === pages - 1}
            onClick={() => setRequested(page + 1)}
          >
            <ExplorerIcon kind="arrow" size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Presents the published statistics for one topic. Nothing is shown when none
 * are published (the topic's other facts remain), and a load failure offers
 * Retry without blocking the rest of the page.
 */
export function LiveStatisticsView({
  state,
  onRetry,
}: {
  state: LiveStatisticsState
  onRetry: () => void
}) {
  const headingId = useId()

  if (state.status === 'loading') {
    return (
      <p className="live-stats__loading" aria-busy="true">
        Loading the latest published statistics…
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="live-stats__error" role="alert">
        <p>Live statistics could not be loaded right now.</p>
        <button type="button" className="live-stats__retry" onClick={onRetry}>
          Retry
        </button>
      </div>
    )
  }

  if (state.statistics.length === 0) return null

  return (
    <section className="live-stats" aria-labelledby={headingId}>
      <h3 className="explorer-sr" id={headingId}>
        Latest published statistics
      </h3>
      <StatisticPager statistics={state.statistics} />
    </section>
  )
}

/** Self-loading wrapper around {@link LiveStatisticsView}. */
export function LiveStatistics({
  categoryKey,
  load = loadExplorerStatistics,
}: {
  categoryKey: string
  load?: (categoryKey: string) => Promise<readonly ExplorerStatistic[]>
}) {
  const { state, retry } = useExplorerStatistics(categoryKey, load)
  return <LiveStatisticsView state={state} onRetry={retry} />
}
