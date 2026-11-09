import type { ReactNode } from 'react'
import { MISSING, type Tone } from './format'

// Text always names the state; the tone only reinforces it.
export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: Tone
  children: ReactNode
}) {
  return <span className={`admin-badge admin-badge--${tone}`}>{children}</span>
}

export function StatCard({
  label,
  value,
  detail,
  selected,
  onSelect,
}: {
  label: string
  value: number
  detail?: string
  selected?: boolean
  onSelect?: () => void
}) {
  const body = (
    <>
      <span className="admin-stat__value">{value.toLocaleString('en-US')}</span>
      <span className="admin-stat__label">{label}</span>
      {detail && <span className="admin-stat__detail">{detail}</span>}
      {selected && <span className="admin-stat__viewing">Viewing</span>}
    </>
  )
  return onSelect ? (
    <button
      type="button"
      className="admin-stat admin-stat--action"
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
    >
      {body}
    </button>
  ) : (
    <div className="admin-stat">{body}</div>
  )
}

export function EmptyState({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="admin-empty">
      <p className="admin-empty__title">{title}</p>
      {children && <p>{children}</p>}
    </div>
  )
}

export function DetailList({
  items,
}: {
  items: readonly { label: string; value: ReactNode }[]
}) {
  return (
    <dl className="admin-details">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value ?? MISSING}</dd>
        </div>
      ))}
    </dl>
  )
}

// Links come from stored text, so only the web schemes parsed by the service
// ever reach this component; it still renders plain text for anything else.
export function SourceLink({
  href,
  label,
}: {
  href: string | null
  label: string
}) {
  if (!href) return <>{MISSING}</>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}
      <span className="admin-visually-hidden"> (opens in a new tab)</span>
    </a>
  )
}

export function SearchField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="ui-field admin-filter">
      <label>
        {label}
        <input
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  )
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
}) {
  return (
    <div className="ui-field admin-filter">
      <label>
        {label}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
