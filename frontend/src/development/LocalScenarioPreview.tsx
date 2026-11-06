import { useEffect, useRef, useState } from 'react'
import { FinancialTracking } from '../components/simulation/FinancialTracking'
import { RadioGroup } from '../components/ui/RadioGroup'
import { Button } from '../components/ui/Button'
import { formatUsd } from '../lib/money'
import type { Scenario, CommittedDecision } from '../types/domain'
import {
  createLocalScenarioService,
  localRun,
  type ScenarioPresentationService,
} from './localScenario'

export default function LocalScenarioPreview({
  service: supplied,
}: {
  service?: ScenarioPresentationService
}) {
  const [service] = useState(() => supplied ?? createLocalScenarioService())
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, select] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<CommittedDecision | null>(null)
  const busy = useRef(false)
  useEffect(() => {
    let active = true
    service.load().then(
      (value) => {
        if (active) {
          setScenario(value)
          setLoading(false)
        }
      },
      () => {
        if (active) {
          setError('Unable to load the scenario. Reload to retry.')
          setLoading(false)
        }
      },
    )
    return () => {
      active = false
    }
  }, [service])
  async function submit() {
    if (!selected || busy.current || result) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      setResult(await service.submit(selected))
    } catch {
      setError('Unable to submit your decision. Please retry.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  const choice = scenario?.choices.find((item) => item.id === result?.choiceId)
  return (
    <section className="simulation-page" aria-label="Local scenario preview">
      <FinancialTracking
        run={{
          ...localRun,
          currentBalance: result?.balanceAfter ?? localRun.currentBalance,
        }}
        expenses={{ status: 'unavailable' }}
      >
        <p>
          Local test preview · Mock outcomes only · Refresh resets this preview.
        </p>
        {loading ? (
          <p role="status">Loading scenario…</p>
        ) : scenario ? (
          <div className="employment-game">
            <h2>{scenario.title}</h2>
            <p>{scenario.description}</p>
            {scenario.choices.length ? (
              <>
                <fieldset
                  disabled={pending || !!result}
                  aria-busy={pending}
                  className="employment-controls"
                >
                  <RadioGroup
                    label="Your decision"
                    name="scenario-choice"
                    value={result?.choiceId ?? selected}
                    onChange={select}
                    options={scenario.choices.map((item) => ({
                      value: item.id,
                      label: item.text,
                      description: `${item.balanceChange > 0 ? '+' : ''}${formatUsd(item.balanceChange)}`,
                    }))}
                  />
                  <Button
                    disabled={!selected || pending || !!result}
                    onClick={() => void submit()}
                  >
                    Submit decision
                  </Button>
                </fieldset>
                {result && (
                  <section role="status" aria-label="Mock decision outcome">
                    <h3>Decision recorded in preview</h3>
                    <p>{choice?.responseText}</p>
                    <p>
                      Balance change:{' '}
                      {result.balanceChangeApplied > 0 ? '+' : ''}
                      {formatUsd(result.balanceChangeApplied)}
                    </p>
                    <p>Balance after: {formatUsd(result.balanceAfter)}</p>
                  </section>
                )}
              </>
            ) : (
              <p role="status">Choices are unavailable for this scenario.</p>
            )}
          </div>
        ) : (
          !error && <p role="status">Scenario unavailable.</p>
        )}
        {error && <p role="alert">{error}</p>}
      </FinancialTracking>
    </section>
  )
}
