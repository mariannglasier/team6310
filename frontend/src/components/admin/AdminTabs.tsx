import { useRef, type KeyboardEvent, type ReactNode } from 'react'

export interface AdminTab {
  readonly id: string
  readonly label: string
  readonly count?: number
}

// WAI-ARIA tabs: one tab stop, arrow/Home/End to move, panel linked by id.
export function AdminTabs({
  label,
  tabs,
  active,
  onChange,
  children,
}: {
  label: string
  tabs: readonly AdminTab[]
  active: string
  onChange: (id: string) => void
  children: ReactNode
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  function move(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === active)
    const last = tabs.length - 1
    const target: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }
    const next = target[event.key]
    if (next === undefined) return
    event.preventDefault()
    onChange(tabs[next].id)
    refs.current[tabs[next].id]?.focus()
  }

  return (
    <div className="admin-tabs">
      <div
        className="admin-tabs__list"
        role="tablist"
        aria-label={label}
        onKeyDown={move}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[tab.id] = node
            }}
            type="button"
            role="tab"
            id={`admin-tab-${tab.id}`}
            aria-selected={tab.id === active}
            aria-controls={`admin-panel-${tab.id}`}
            tabIndex={tab.id === active ? 0 : -1}
            className="admin-tabs__tab"
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="admin-tabs__count">
                {tab.count.toLocaleString('en-US')}
              </span>
            )}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`admin-panel-${active}`}
        aria-labelledby={`admin-tab-${active}`}
        tabIndex={0}
        className="admin-tabs__panel"
      >
        {children}
      </div>
    </div>
  )
}
