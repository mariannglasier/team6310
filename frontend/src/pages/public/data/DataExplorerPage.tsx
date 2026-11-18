import { useRef, useState, type KeyboardEvent } from 'react'
import { PageSection } from '../../../components/ui/PageSection'
import type { CategoryId, Mode } from './dataExplorerContent'
import { useExplorerCategories } from './useExplorerCategories'
import { useExplorerStatistics } from './useExplorerStatistics'
import { useZoomOutStatistics } from './useZoomOutStatistics'
import { ClothingViz } from './ClothingViz'
import { EmploymentViz } from './EmploymentViz'
import { ExplorerIcon, type VizProps } from './ExplorerParts'
import { FinanceViz } from './FinanceViz'
import { FoodViz } from './FoodViz'
import { HousingViz } from './HousingViz'
import { StatisticPager } from './StatisticVisuals'
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
  const categories = useExplorerCategories()
  const zoomOut = useZoomOutStatistics()
  const [activeId, setActiveId] = useState<CategoryId>('housing')
  // Topics the visitor has opened, shown as a small check on the path.
  const [visited, setVisited] = useState<ReadonlySet<CategoryId>>(
    () => new Set<CategoryId>(['housing']),
  )
  const { state: live, retry: retryLive } = useExplorerStatistics(activeId)
  const [mode, setMode] = useState<Mode>('challenge')
  const tabRefs = useRef<Partial<Record<CategoryId, HTMLButtonElement | null>>>(
    {},
  )

  const activeIndex = categories.findIndex(
    (category) => category.id === activeId,
  )
  const active = categories[activeIndex]
  const next = categories[activeIndex + 1] ?? categories[0]
  const lastTopic = activeIndex === categories.length - 1

  function selectTopic(id: CategoryId) {
    setActiveId(id)
    setVisited((previous) =>
      previous.has(id) ? previous : new Set(previous).add(id),
    )
  }

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
    const nextId = categories[target].id
    selectTopic(nextId)
    tabRefs.current[nextId]?.focus()
  }

  function goToNext() {
    selectTopic(next.id)
    tabRefs.current[next.id]?.focus()
  }

  return (
    <div className="data-explorer">
      <PageSection title="Explore our community" eyebrow="Explore data" />
      <div
        className="topic-path"
        role="tablist"
        aria-label="Topics"
        aria-orientation="horizontal"
      >
        <div className="topic-path__track" aria-hidden="true">
          <span
            style={{
              width: `${(activeIndex / Math.max(1, categories.length - 1)) * 100}%`,
            }}
          />
        </div>
        {categories.map((category, index) => (
          <button
            key={category.id}
            ref={(node) => {
              tabRefs.current[category.id] = node
            }}
            type="button"
            role="tab"
            id={`explorer-tab-${category.id}`}
            className="topic-stop"
            data-visited={
              visited.has(category.id) && category.id !== activeId
                ? 'true'
                : undefined
            }
            aria-selected={category.id === activeId}
            aria-controls="explorer-panel"
            tabIndex={category.id === activeId ? 0 : -1}
            onClick={() => selectTopic(category.id)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            <span className="topic-stop__medallion">
              <ExplorerIcon kind={category.id} size={26} />
              <span className="topic-stop__check" aria-hidden="true" />
            </span>
            <span className="topic-stop__label">{category.label}</span>
          </button>
        ))}
      </div>
      <div
        className="explorer-panel"
        role="tabpanel"
        id="explorer-panel"
        aria-labelledby={`explorer-tab-${activeId}`}
        aria-describedby="explorer-description"
      >
        {renderVisualization(activeId, {
          category: active,
          mode,
          onModeChange: setMode,
          live,
          onRetryLive: retryLive,
        })}
      </div>
      <button
        type="button"
        className="ui-button ui-button--primary topic-next"
        onClick={goToNext}
      >
        {lastTopic ? `Back to ${next.label}` : `Next: ${next.label}`}
        <ExplorerIcon kind="arrow" size={18} />
      </button>
      {zoomOut.length > 0 && (
        <details className="zoom-out">
          <summary>
            <h2>Zoom out: poverty at different scales</h2>
          </summary>
          <p>
            Each figure describes a different group. Read them side by side, not
            as one scale.
          </p>
          <StatisticPager statistics={zoomOut} pageSize={zoomOut.length} />
        </details>
      )}
    </div>
  )
}
