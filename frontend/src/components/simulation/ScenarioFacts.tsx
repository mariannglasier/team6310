import { useEffect, useState } from 'react'
import {
  loadScenarioFacts,
  type ScenarioFact,
} from '../../services/scenarioFacts'
import './scenarioFacts.css'

export function ScenarioFacts({
  runId,
  scenarioId,
  versionId,
  supportEnabled,
}: {
  runId: string
  scenarioId: string
  versionId: string
  supportEnabled: boolean
}) {
  const [attempt, retry] = useState(0)
  const requestKey = JSON.stringify([
    runId,
    scenarioId,
    versionId,
    supportEnabled,
    attempt,
  ])
  const [result, setResult] = useState<{
    requestKey: string
    facts: ScenarioFact[]
    failed: boolean
  } | null>(null)
  useEffect(() => {
    let active = true
    void loadScenarioFacts(runId, scenarioId, versionId, supportEnabled).then(
      (value) => {
        if (active) setResult({ requestKey, facts: value, failed: false })
      },
      () => {
        if (active) setResult({ requestKey, facts: [], failed: true })
      },
    )
    return () => {
      active = false
    }
  }, [runId, scenarioId, versionId, supportEnabled, requestKey])
  const current = result?.requestKey === requestKey ? result : null
  if (current?.failed)
    return (
      <p role="status">
        Facts could not be loaded.{' '}
        <button type="button" onClick={() => retry((value) => value + 1)}>
          Try again
        </button>
      </p>
    )
  return (
    <aside className="scenario-facts" aria-label="Scenario facts">
      {(current?.facts ?? [])
        .filter((fact) => fact.role === 'general' || supportEnabled)
        .sort((a, b) => (a.role === b.role ? 0 : a.role === 'general' ? -1 : 1))
        .map((fact) => (
          <section className="scenario-facts__card" key={fact.role}>
            <h3>
              {fact.role === 'cac'
                ? 'CAC impact'
                : fact.copyKind === 'context'
                  ? 'About this decision'
                  : 'Community fact'}
            </h3>
            <p>{fact.text}</p>
            <a href={fact.sourceUrl} target="_blank" rel="noreferrer">
              Source
            </a>
          </section>
        ))}
    </aside>
  )
}
