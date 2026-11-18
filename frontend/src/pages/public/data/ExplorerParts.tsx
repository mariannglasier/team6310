import { useId, useState, type ReactNode } from 'react'
import { externalLinks } from '../../../app/externalLinks'
import { sources, type CategoryContent, type Mode } from './dataExplorerContent'
import { LiveStatisticsView } from './StatisticVisuals'
import { ExplorerIcon } from './ExplorerIcon'
import type { LiveStatisticsState } from './useExplorerStatistics'

export { ExplorerIcon, type IconKind } from './ExplorerIcon'

/** Single-choice button set. Selecting never advances or commits anything. */
export function ChoiceGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  hint,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  hint?: string
}) {
  const labelId = useId()
  return (
    <div className="choice-group" role="group" aria-labelledby={labelId}>
      <p className="choice-group__label" id={labelId}>
        {label}
      </p>
      <div className="choice-group__options">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              className="choice-group__button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
            >
              {selected && <ExplorerIcon kind="check" size={16} />}
              {option.label}
            </button>
          )
        })}
      </div>
      {hint && <p className="choice-group__hint">{hint}</p>}
    </div>
  )
}

/** Supporting detail for a scene, tucked behind a small disclosure. */
export function SceneDetails({
  summary = 'How to read this',
  children,
}: {
  summary?: string
  children: ReactNode
}) {
  return (
    <details className="scene-details">
      <summary>{summary}</summary>
      <p>{children}</p>
    </details>
  )
}

export function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode
  onChange: (mode: Mode) => void
}) {
  return (
    <div
      className="mode-toggle"
      role="group"
      aria-label="View"
      data-mode={mode}
    >
      <button
        type="button"
        className="mode-toggle__button mode-toggle__button--challenge"
        aria-pressed={mode === 'challenge'}
        onClick={() => onChange('challenge')}
      >
        Explore challenges
      </button>
      <button
        type="button"
        className="mode-toggle__button mode-toggle__button--impact"
        aria-pressed={mode === 'impact'}
        onClick={() => onChange('impact')}
      >
        See CAC impact
      </button>
    </div>
  )
}

type FactsView = 'community' | 'cac'

/**
 * The numbers behind the scene. One set shows at a time: the community data
 * while exploring the challenge, and CAC's outcomes once the impact view is on.
 * A choice made here is kept, and a topic with no published statistics shows
 * the CAC outcomes alone.
 */
function ExplorerFacts({
  category,
  mode,
  live,
  onRetryLive,
}: {
  category: CategoryContent
  mode: Mode
  live: LiveStatisticsState
  onRetryLive: () => void
}) {
  const cacHeadingId = useId()
  const [chosen, setChosen] = useState<FactsView | null>(null)
  const hasCommunity = live.status !== 'ready' || live.statistics.length > 0
  const view: FactsView = !hasCommunity
    ? 'cac'
    : (chosen ?? (mode === 'impact' ? 'cac' : 'community'))
  const factSources = [...new Set(category.facts.map((fact) => fact.sourceId))]

  return (
    <div className="explorer-facts">
      {hasCommunity && (
        <div
          className="facts-switch"
          role="group"
          aria-label="Numbers behind the scene"
        >
          <button
            type="button"
            className="facts-switch__button"
            aria-pressed={view === 'community'}
            onClick={() => setChosen('community')}
          >
            Community data
          </button>
          <button
            type="button"
            className="facts-switch__button"
            aria-pressed={view === 'cac'}
            onClick={() => setChosen('cac')}
          >
            CAC outcomes
          </button>
        </div>
      )}
      {view === 'community' ? (
        <LiveStatisticsView state={live} onRetry={onRetryLive} />
      ) : (
        <section className="cac-board" aria-labelledby={cacHeadingId}>
          <h3 className="explorer-sr" id={cacHeadingId}>
            CAC outcomes behind the scene
          </h3>
          <ul className="scoreboard">
            {category.facts.map((fact) => (
              <li className="scoreboard__item" key={fact.id}>
                <strong className="scoreboard__value">{fact.value}</strong>
                <span className="scoreboard__label">{fact.label}</span>
                <span className="scoreboard__meta">
                  {fact.geography} · {fact.period}
                </span>
              </li>
            ))}
          </ul>
          <p className="scoreboard__source">
            Source:{' '}
            {factSources.map((id, index) => (
              <span key={id}>
                {index > 0 && '; '}
                <a
                  href={sources[id].url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {sources[id].name}
                  <span className="explorer-sr"> (opens in a new tab)</span>
                </a>
                <span> — {sources[id].title}</span>
              </span>
            ))}
          </p>
          <div
            className={`cac-callout${mode === 'impact' ? ' is-active' : ''}`}
          >
            <strong className="cac-callout__title">{category.cac.title}</strong>
            <p>{category.cac.body}</p>
            <a
              className="cac-callout__link"
              href={externalLinks.learn}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more at ourcac.org
              <ExplorerIcon kind="arrow" size={16} />
              <span className="explorer-sr"> (opens in a new tab)</span>
            </a>
          </div>
        </section>
      )}
    </div>
  )
}

/**
 * Shared frame: the topic title and view switch on top, the scene with a slim
 * rail of controls beside it, then the numbers behind the scene.
 */
export function ExplorerLayout({
  category,
  mode,
  onModeChange,
  scene,
  controls,
  sceneLabel,
  live,
  onRetryLive,
}: {
  category: CategoryContent
  mode: Mode
  onModeChange: (mode: Mode) => void
  scene: ReactNode
  controls: ReactNode
  sceneLabel: string
  live: LiveStatisticsState
  onRetryLive: () => void
}) {
  return (
    <div className="explorer-body" data-mode={mode}>
      <div className="explorer-top">
        <div className="explorer-title">
          <span className="explorer-medallion" aria-hidden="true">
            <ExplorerIcon kind={category.id} size={30} />
          </span>
          <div>
            <p className="explorer-category-name">{category.name}</p>
            <h2 className="explorer-heading" id="explorer-heading">
              {category.heading}
            </h2>
            <p className="explorer-description" id="explorer-description">
              {category.description}
            </p>
          </div>
        </div>
        <ModeToggle mode={mode} onChange={onModeChange} />
      </div>
      <div className="explorer-stage">
        <section className="explorer-scene" aria-label={sceneLabel}>
          {scene}
        </section>
        <div className="explorer-rail">
          <div className="explorer-controls">{controls}</div>
          <p className="explorer-bubble" role="status">
            {category.modeNotes[mode]}
          </p>
        </div>
      </div>
      <p className="explorer-takeaway">{category.takeaway}</p>
      <ExplorerFacts
        category={category}
        mode={mode}
        live={live}
        onRetryLive={onRetryLive}
      />
    </div>
  )
}

export interface VizProps {
  category: CategoryContent
  mode: Mode
  onModeChange: (mode: Mode) => void
  /** Published statistics for this topic; scenes use them only when published. */
  live: LiveStatisticsState
  onRetryLive: () => void
}
