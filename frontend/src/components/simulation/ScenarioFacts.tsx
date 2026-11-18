import { useEffect, useState, type CSSProperties } from 'react'
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
      /\b\d[\d,]*(?:\.\d+)? (?:total )?(?:pounds|people|households|children|students|visits|(?:tax )?returns|individuals|job placements)\b/i,
    )?.[0] ??
    null
  )
}
function factSentence({ text, role }: ScenarioFact) {
  const highlight =
    statistic(text) ??
    (role === 'cac' ? (text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text) : null)
  if (!highlight) return text
  const start = text.indexOf(highlight)
  const after = text.slice(start + highlight.length)
  const isFinal = role === 'cac' && /^[.!?]*$/.test(after.trim())
  return (
    <>
      {text.slice(0, start)}
      <strong
        className={`scenario-facts__stat${isFinal ? ' scenario-facts__stat--final' : ''}`}
        style={
          role === 'cac'
            ? ({
                '--stat-width-font-size': `${175 / (highlight.length + (isFinal ? after.trim().length : 0))}cqi`,
              } as CSSProperties)
            : undefined
        }
      >
        {highlight}
        {isFinal && after.trim() && <span>{after.trim()}</span>}
      </strong>
      {!isFinal && after}
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
  source = 'individual',
}: {
  runId: string
  scenarioId: string
  versionId: string
  supportEnabled: boolean
  source?: 'individual' | 'group'
}) {
  const [attempt, retry] = useState(0)
  const requestKey = JSON.stringify([
    runId,
    scenarioId,
    versionId,
    supportEnabled,
    source,
    attempt,
  ])
  const [result, setResult] = useState<{
    requestKey: string
    facts: ScenarioFact[]
    failed: boolean
  } | null>(null)
  useEffect(() => {
    let active = true
    void loadScenarioFacts(
      runId,
      scenarioId,
      versionId,
      supportEnabled,
      source,
    ).then(
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
  }, [runId, scenarioId, versionId, supportEnabled, source, requestKey])
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
                ? 'CAC’s response'
                : fact.copyKind === 'context'
                  ? 'About this decision'
                  : factTitle(fact.semanticKey, fact.text)}
            </h3>
            <p>{factSentence(fact)}</p>
          </section>
        ))}
    </aside>
  )
}
