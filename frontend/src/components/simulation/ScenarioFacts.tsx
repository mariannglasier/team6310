import { useEffect, useState } from 'react'
import {
  loadScenarioFacts,
  type ScenarioFact,
} from '../../services/scenarioFacts'
import './scenarioFacts.css'

function statistic(text: string) {
  return (
    text.match(/\$[\d,]+(?:\.\d+)?/)?.[0] ??
    text.match(/\b\d+(?:\.\d+)?%/)?.[0] ??
    text.match(/\b\d+ in \d+\b/)?.[0] ??
    text.match(
      /\b\d[\d,]*(?:\.\d+)? (?:(?:pounds|people|households|children|students|visits|returns|individuals)\b)/,
    )?.[0] ??
    null
  )
}
function factSentence(text: string) {
  const number = statistic(text)
  if (!number) return text
  const start = text.indexOf(number)
  return (
    <>
      {text.slice(0, start)}
      <strong className="scenario-facts__stat">{number}</strong>
      {text.slice(start + number.length)}
    </>
  )
}
function factTitle(key: string, text: string) {
  if (key.startsWith('acs:'))
    return (
      (
        {
          B23025: 'Work in Sandy Springs',
          B08303: 'Getting to work',
          B25070: 'Rent and household income',
          B27001: 'Access to health insurance',
          B25048: 'Plumbing and housing',
          B25010: 'Household size',
          B08201: 'Household transportation',
          B17010: 'Family poverty',
        } as Record<string, string>
      )[key.split(':')[1]] ?? 'Life in Sandy Springs'
    )
  if (key.startsWith('cpi:')) {
    const subject = text.match(
      /average price of (.+?) (?:increased|decreased|did not change)/,
    )?.[1]
    return subject ? `The price of ${subject}` : 'The cost of everyday needs'
  }
  if (key.startsWith('social:')) return 'Food and connection'
  return 'Community fact'
}

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
          <section
            className={`scenario-facts__card scenario-facts__card--${fact.role}`}
            key={fact.role}
          >
            <h3>
              {fact.role === 'cac'
                ? `CAC’s response${fact.text.match(/\b20\d{2}\b/) ? ' in ' + fact.text.match(/\b20\d{2}\b/)![0] : ''}`
                : fact.copyKind === 'context'
                  ? 'About this decision'
                  : factTitle(fact.semanticKey, fact.text)}
            </h3>
            <p>{factSentence(fact.text)}</p>
          </section>
        ))}
    </aside>
  )
}
