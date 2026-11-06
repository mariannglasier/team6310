import { useEffect, useRef, useState } from 'react'
import { loadScenario } from '../../services/scenarioContent'
import {
  restoreScenario,
  submitScenario,
  type ScenarioRunSnapshot,
} from '../../services/scenarioGameplay'
import type { LoadedPlaythrough } from '../../types/playthrough'
import type { Scenario } from '../../types/domain'
import { RadioGroup } from '../ui/RadioGroup'
import { Button } from '../ui/Button'
import { formatUsd } from '../../lib/money'

export function ScenarioPanel({
  run,
  onCommit,
  onContinue,
}: {
  run: LoadedPlaythrough
  onCommit: (run: LoadedPlaythrough) => void
  onContinue: () => void
}) {
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [saved, setSaved] = useState<ScenarioRunSnapshot | null>(null)
  const [selected, select] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const content = await loadScenario(
          run.currentScenarioId!,
          run.versionId!,
        )
        if (!content) throw new Error('Scenario unavailable')
        const snapshot = await restoreScenario(run, content)
        if (active) {
          setScenario(content)
          setSaved(snapshot)
          if (snapshot.run.currentBalance !== run.currentBalance)
            onCommit(snapshot.run)
        }
      } catch {
        if (active) setError('Unable to load this scenario. Reload to retry.')
      }
    })()
    return () => {
      active = false
    }
    // Run/scenario identity controls restoration; balance updates must not reset selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.id, run.currentScenarioId, run.versionId])
  async function submit() {
    if (!scenario || !selected || busy.current || saved?.decision) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      const value = await submitScenario(run, scenario, selected)
      setSaved(value)
      onCommit(value.run)
    } catch {
      setError('Unable to confirm your decision. Reload or retry.')
      try {
        const value = await restoreScenario(run, scenario)
        setSaved(value)
        onCommit(value.run)
      } catch {
        /* retain last confirmed snapshot */
      }
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <section className="employment-game" aria-label="Ordinary scenario">
      {error && <p role="alert">{error}</p>}
      {!scenario && !error && <p role="status">Loading scenario…</p>}
      {scenario && (
        <>
          <h2>{scenario.title}</h2>
          <p>{scenario.description}</p>
          {!scenario.choices.length ? (
            <p role="alert">Choices are unavailable.</p>
          ) : (
            <fieldset
              disabled={
                pending || !!saved?.decision || saved?.run.status === 'ended'
              }
              aria-busy={pending}
              className="employment-controls"
            >
              <RadioGroup
                label="Your decision"
                name="scenario-choice"
                value={saved?.decision?.choiceId ?? selected}
                onChange={select}
                options={scenario.choices.map((choice) => ({
                  value: choice.id,
                  label: choice.text,
                  description: `${choice.balanceChange > 0 ? '+' : ''}${formatUsd(choice.balanceChange)}`,
                }))}
              />
              <Button
                disabled={!selected || pending || !!saved?.decision}
                onClick={() => void submit()}
              >
                Submit decision
              </Button>
            </fieldset>
          )}
          {saved?.decision && (
            <section role="status">
              <h3>Decision recorded</h3>
              <p>{saved.responseText}</p>
              <p>
                Balance change:{' '}
                {saved.decision.balanceChangeApplied > 0 ? '+' : ''}
                {formatUsd(saved.decision.balanceChangeApplied)}
              </p>
              <p>Balance after: {formatUsd(saved.decision.balanceAfter)}</p>
              <Button onClick={onContinue}>Continue simulation</Button>
            </section>
          )}
          {saved?.run.status === 'ended' && (
            <p role="status">
              Your household could not afford this choice. The simulation ended.
            </p>
          )}
        </>
      )}
    </section>
  )
}
