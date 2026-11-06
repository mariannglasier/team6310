import { useEffect, useRef, useState } from 'react'
import { FinancialTracking } from '../components/simulation/FinancialTracking'
import { RadioGroup } from '../components/ui/RadioGroup'
import { Button } from '../components/ui/Button'
import { formatUsd } from '../lib/money'
import type { Scenario } from '../types/domain'
import {
  createLocalScenarioService,
  type ScenarioPresentationService,
  type ScenarioRunSnapshot,
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
  const [saved, setSaved] = useState<ScenarioRunSnapshot | null>(null)
  const result = saved?.decision ?? null
  const busy = useRef(false)
  useEffect(() => {
    let active = true
    service.load().then(
      async (value) => {
        try {
          const restored = value ? await service.restore() : null
          if (active) {
            setScenario(value)
            setSaved(restored)
            setLoading(false)
          }
        } catch {
          if (active) {
            setError('Unable to restore the local run. Reload to retry.')
            setLoading(false)
          }
        }
      },
      () => {
        if (active) {
          setError(
            'Unable to load the local scenario. Check the verification server, local environment and fixture, then reload.',
          )
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
      setSaved(await service.submit(selected))
    } catch {
      setError(
        'Unable to confirm your decision. Reload or retry to restore saved progress.',
      )
      try {
        const restored = await service.restore()
        if (restored) setSaved(restored)
      } catch {
        /* Keep the last confirmed state. */
      }
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  const choice = scenario?.choices.find((item) => item.id === result?.choiceId)
  return (
    <section className="simulation-page" aria-label="Local scenario preview">
      {saved && (
        <FinancialTracking run={saved.run} expenses={{ status: 'unavailable' }}>
          <p>Local test run · Decisions are saved after server confirmation.</p>
          {loading ? (
            <p role="status">Loading scenario…</p>
          ) : scenario ? (
            <div className="employment-game">
              <h2>{scenario.title}</h2>
              <p>{scenario.description}</p>
              {scenario.choices.length ? (
                <>
                  <fieldset
                    disabled={
                      pending || !!result || saved.run.status !== 'active'
                    }
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
                      disabled={
                        !selected ||
                        pending ||
                        !!result ||
                        saved.run.status !== 'active'
                      }
                      onClick={() => void submit()}
                    >
                      Submit decision
                    </Button>
                  </fieldset>
                  {result && (
                    <section role="status" aria-label="Decision outcome">
                      <h3>Decision recorded</h3>
                      <p>{saved.responseText ?? choice?.responseText}</p>
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
          {saved.run.status === 'ended' && (
            <p role="status">
              Your household could not afford this choice. The run ended without
              a charge.
            </p>
          )}
        </FinancialTracking>
      )}
      {!saved && (
        <>
          {loading && <p role="status">Loading scenario…</p>}
          {error && <p role="alert">{error}</p>}
          {!loading && scenario && (
            <Button
              disabled={pending}
              onClick={() => {
                if (busy.current) return
                busy.current = true
                setPending(true)
                setError('')
                void service
                  .open()
                  .then(setSaved, () =>
                    setError('Unable to open the local run. Please retry.'),
                  )
                  .finally(() => {
                    busy.current = false
                    setPending(false)
                  })
              }}
            >
              Start local scenario run
            </Button>
          )}
          {!loading && !scenario && !error && (
            <p role="status">Scenario unavailable.</p>
          )}
        </>
      )}
    </section>
  )
}
