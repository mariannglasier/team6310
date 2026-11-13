import { useEffect, useRef, useState } from 'react'
import { loadScenario } from '../../services/scenarioContent'
import {
  restoreScenario,
  submitScenario,
  type ScenarioRunSnapshot,
} from '../../services/scenarioGameplay'
import type { LoadedPlaythrough } from '../../types/playthrough'
import { usdCents, type Scenario } from '../../types/domain'
import { RadioGroup } from '../ui/RadioGroup'
import { Button } from '../ui/Button'
import { formatUsd } from '../../lib/money'
import { ScenarioFacts } from './ScenarioFacts'
import { useSimulationMutation } from '../../state/simulationMutation'

export function ScenarioPanel({
  run,
  onCommit,
  onContinue,
}: {
  run: LoadedPlaythrough
  onCommit: (run: LoadedPlaythrough) => void | Promise<void>
  onContinue: () => void
}) {
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [saved, setSaved] = useState<ScenarioRunSnapshot | null>(null)
  const [selected, select] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const mutation = useSimulationMutation()
  const [uncertain, setUncertain] = useState(false)
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
            await onCommit(snapshot.run)
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
    if (
      !scenario ||
      !selected ||
      busy.current ||
      saved?.decision ||
      !mutation.begin()
    )
      return
    busy.current = true
    setPending(true)
    setError('')
    try {
      const value = await submitScenario(run, scenario, selected)
      setSaved(value)
      await onCommit(value.run)
    } catch {
      setError('Unable to confirm your decision. Reload or retry.')
      try {
        const value = await restoreScenario(run, scenario)
        setSaved(value)
        await onCommit(value.run)
      } catch {
        setUncertain(true)
        mutation.uncertain('scenario', true)
      }
    } finally {
      busy.current = false
      setPending(false)
      mutation.finish()
    }
  }
  async function reconcile() {
    if (!scenario || busy.current || !mutation.begin(true)) return
    busy.current = true
    setPending(true)
    try {
      const value = await restoreScenario(run, scenario)
      setSaved(value)
      await onCommit(value.run)
      setUncertain(false)
      mutation.uncertain('scenario', false)
      setError('')
    } catch {
      setError('Unable to confirm your decision. Reload or retry.')
    } finally {
      busy.current = false
      setPending(false)
      mutation.finish()
    }
  }
  return (
    <section className="employment-game" aria-label="Ordinary scenario">
      {error && <p role="alert">{error}</p>}
      {uncertain && (
        <Button disabled={pending} onClick={() => void reconcile()}>
          Reload saved decision
        </Button>
      )}
      {!scenario && !error && <p role="status">Loading scenario…</p>}
      {scenario && (
        <>
          <h2>{scenario.title}</h2>
          <p>{scenario.description}</p>
          {!scenario.choices.length ? (
            <p role="alert">Choices are unavailable.</p>
          ) : !saved?.decision ? (
            <fieldset
              disabled={
                pending ||
                uncertain ||
                mutation.busy ||
                !!saved?.decision ||
                saved?.run.status === 'ended'
              }
              aria-busy={pending}
              className="employment-controls scenario-choice-controls"
            >
              <RadioGroup
                label="Your decision"
                name="scenario-choice"
                value={saved?.decision?.choiceId ?? selected}
                onChange={select}
                options={scenario.choices
                  .filter(
                    (choice) =>
                      !choice.requiresCac || run.supportEnabled === true,
                  )
                  .map((choice) => ({
                    value: choice.id,
                    label: choice.text,
                    description:
                      choice.upfrontCost ||
                      (choice.requiresCac && choice.balanceChange > 0)
                        ? `Initial expense: ${formatUsd(choice.upfrontCost ?? usdCents(0))}`
                        : `${choice.balanceChange > 0 ? '+' : ''}${formatUsd(choice.balanceChange)}`,
                  }))}
              />
              <Button
                disabled={!selected || pending || !!saved?.decision}
                onClick={() => void submit()}
              >
                Submit decision
              </Button>
            </fieldset>
          ) : null}
          {saved?.run.status === 'ended' && (
            <p role="status">Opening your results…</p>
          )}
          {saved?.decision && (
            <>
              <ScenarioFacts
                runId={saved.run.id}
                scenarioId={scenario.id}
                versionId={scenario.versionId}
                supportEnabled={saved.run.supportEnabled === true}
              />
              <div className="scenario-continue">
                <Button onClick={onContinue}>Continue to next day</Button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
