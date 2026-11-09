import { useRef, useState, type KeyboardEvent } from 'react'
import { PageSection } from '../../../components/ui/PageSection'
import {
  categories,
  zoomOutFacts,
  type CategoryId,
  type Mode,
} from './dataExplorerContent'
import { ClothingViz } from './ClothingViz'
import { EmploymentViz } from './EmploymentViz'
import { ExplorerIcon, FactCard, type VizProps } from './ExplorerParts'
import { FinanceViz } from './FinanceViz'
import { FoodViz } from './FoodViz'
import { HousingViz } from './HousingViz'
import { YouthViz } from './YouthViz'
import './DataExplorer.css'

function renderVisualization(id: CategoryId, props: VizProps) {
  switch (id) {
    case 'housing':
      return <HousingViz {...props} />
    case 'food':
      return <FoodViz {...props} />
    case 'employment':
      return <EmploymentViz {...props} />
    case 'clothing':
      return <ClothingViz {...props} />
    case 'youth':
      return <YouthViz {...props} />
    case 'finances':
      return <FinanceViz {...props} />
  }
}

export function DataExplorerPage() {
  const [activeId, setActiveId] = useState<CategoryId>('housing')
  const [mode, setMode] = useState<Mode>('challenge')
  const tabRefs = useRef<Partial<Record<CategoryId, HTMLButtonElement | null>>>(
    {},
  )

  const active = categories.find((category) => category.id === activeId)!

  function onTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const last = categories.length - 1
    const target =
      event.key === 'ArrowRight'
        ? (index + 1) % categories.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + categories.length) % categories.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (target === null) return
    event.preventDefault()
    const next = categories[target].id
    setActiveId(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="data-explorer">
      <PageSection title="Explore our community" eyebrow="Explore data">
        <p className="data-explorer__lead">
          Pick a topic, test a challenge, then see how community support changes
          the picture.
        </p>
      </PageSection>
      <div
        className="explorer-tabs"
        role="tablist"
        aria-label="Topics"
        aria-orientation="horizontal"
      >
        {categories.map((category, index) => (
          <button
            key={category.id}
            ref={(node) => {
              tabRefs.current[category.id] = node
            }}
            type="button"
            role="tab"
            id={`explorer-tab-${category.id}`}
            className="explorer-tab"
            aria-selected={category.id === activeId}
            aria-controls="explorer-panel"
            tabIndex={category.id === activeId ? 0 : -1}
            onClick={() => setActiveId(category.id)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            <ExplorerIcon kind={category.id} />
            {category.label}
          </button>
        ))}
      </div>
      <div
        className="explorer-panel"
        role="tabpanel"
        id="explorer-panel"
        aria-labelledby={`explorer-tab-${activeId}`}
      >
        {renderVisualization(activeId, {
          category: active,
          mode,
          onModeChange: setMode,
        })}
      </div>
      <section className="zoom-out" aria-labelledby="zoom-out-heading">
        <h2 id="zoom-out-heading">Zoom out: poverty at three scales</h2>
        <p>
          Each figure describes a different group. Read them side by side, not
          as one scale.
        </p>
        <ul className="fact-grid">
          {zoomOutFacts.map((fact) => (
            <FactCard key={fact.id} fact={fact} />
          ))}
        </ul>
      </section>
    </div>
  )
}
