import { useId, type ReactNode } from 'react'
import { externalLinks } from '../../../app/externalLinks'
import {
  sources,
  type CategoryContent,
  type CategoryId,
  type ExplorerFact,
  type Mode,
} from './dataExplorerContent'

export type IconKind = CategoryId | 'check' | 'sun' | 'snow' | 'arrow'

export function ExplorerIcon({
  kind,
  size = 22,
}: {
  kind: IconKind
  size?: number
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'housing' && (
        <>
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
          <path d="M9 21v-8h6v8" />
        </>
      )}
      {kind === 'food' && (
        <>
          <path d="M3 9h18l-2 11H5Z" />
          <path d="m8 9 3-5M16 9l-3-5" />
        </>
      )}
      {kind === 'employment' && (
        <>
          <path d="M3 8h18v12H3Z" />
          <path d="M9 8V5h6v3M3 13h18" />
        </>
      )}
      {kind === 'clothing' && (
        <path d="M8 3 2 6l2 4 3-1v12h10V9l3 1 2-4-6-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3Z" />
      )}
      {kind === 'youth' && (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M17 14c2.8 0 5 2.2 5 5" />
        </>
      )}
      {kind === 'finances' && (
        <>
          <ellipse cx="12" cy="6" rx="7" ry="3" />
          <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
          <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </>
      )}
      {kind === 'check' && <path d="m5 12 5 5 9-10" />}
      {kind === 'arrow' && <path d="M5 12h14m-6-6 6 6-6 6" />}
      {kind === 'sun' && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </>
      )}
      {kind === 'snow' && (
        <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2" />
      )}
    </svg>
  )
}

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

export function RangeField({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  minLabel,
  maxLabel,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
  minLabel: string
  maxLabel: string
}) {
  const id = useId()
  return (
    <div className="range-field">
      <div className="range-field__top">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{display}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="range-field__ends" aria-hidden="true">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
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
    <div className="mode-toggle" role="group" aria-label="View">
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

export function FactCard({ fact }: { fact: ExplorerFact }) {
  const source = sources[fact.sourceId]
  return (
    <li className="fact-card">
      <strong className="fact-card__value">{fact.value}</strong>
      <p className="fact-card__label">{fact.label}</p>
      {fact.percent !== undefined && (
        <div className="fact-card__meter" aria-hidden="true">
          <span style={{ width: `${fact.percent}%` }} />
        </div>
      )}
      <p className="fact-card__meta">
        {fact.geography} · {fact.period}
      </p>
      <p className="fact-card__source">
        Source:{' '}
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          {source.name}
          <span className="explorer-sr"> (opens in a new tab)</span>
        </a>
        <span className="fact-card__source-title"> — {source.title}</span>
      </p>
    </li>
  )
}

/** Shared frame: scene on the left, controls and notes on the right. */
export function ExplorerLayout({
  category,
  mode,
  onModeChange,
  scene,
  controls,
  sceneLabel,
}: {
  category: CategoryContent
  mode: Mode
  onModeChange: (mode: Mode) => void
  scene: ReactNode
  controls: ReactNode
  sceneLabel: string
}) {
  return (
    <div className="explorer-body" data-mode={mode}>
      <h2 className="explorer-heading" id="explorer-heading">
        {category.heading}
      </h2>
      <p className="explorer-intro">{category.intro}</p>
      <div className="explorer-grid">
        <section className="explorer-scene" aria-label={sceneLabel}>
          <span className="explorer-badge">
            Interactive scene · illustrative sample
          </span>
          {scene}
        </section>
        <div className="explorer-aside">
          <ModeToggle mode={mode} onChange={onModeChange} />
          <div className="explorer-controls">{controls}</div>
          <p className="explorer-callout" role="status">
            {category.modeNotes[mode]}
          </p>
        </div>
      </div>
      <p className="explorer-takeaway">{category.takeaway}</p>
      <h3 className="explorer-subheading">Facts behind the scene</h3>
      <ul className="fact-grid">
        {category.facts.map((fact) => (
          <FactCard key={fact.id} fact={fact} />
        ))}
        <li
          className={`fact-card fact-card--cac${mode === 'impact' ? ' is-active' : ''}`}
        >
          <strong className="fact-card__value fact-card__value--cac">
            {category.cac.title}
          </strong>
          <p className="fact-card__label">{category.cac.body}</p>
          <a
            className="fact-card__cac-link"
            href={externalLinks.learn}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more at ourcac.org
            <ExplorerIcon kind="arrow" size={16} />
            <span className="explorer-sr"> (opens in a new tab)</span>
          </a>
        </li>
      </ul>
    </div>
  )
}

export interface VizProps {
  category: CategoryContent
  mode: Mode
  onModeChange: (mode: Mode) => void
}
