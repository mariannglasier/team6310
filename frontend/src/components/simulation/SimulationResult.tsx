import { useEffect, useState } from 'react'
import { Button, ExternalButtonLink } from '../ui/Button'
import { externalLinks } from '../../app/externalLinks'
import { paths } from '../../app/paths'
import { formatUsd } from '../../lib/money'
import {
  loadResultComparisons,
  type ResultComparison,
} from '../../services/resultComparisons'
import type { UsdCents } from '../../types/domain'
import './simulationResult.css'

export function SimulationResult({
  reason,
  balance,
  runId,
  onReplay,
}: {
  reason: string | null
  balance: UsdCents
  runId?: string
  onReplay: (support: boolean) => void
}) {
  return (
    <div className="simulation-result">
      <section
        className="simulation-result__help"
        aria-labelledby="result-help"
      >
        <h3 id="result-help">When money is tight, CAC can help.</h3>
        <p>
          The Community Assistance Center helps neighbors facing financial
          hardship with essentials such as food and housing. Try a new run with
          CAC assistance to see how options like job preparation and interview
          clothing can change the choices available to your household.
        </p>
        <div className="simulation-result__actions">
          <Button onClick={() => onReplay(true)}>
            Play with CAC assistance
          </Button>
          <ExternalButtonLink href={externalLinks.learn}>
            Learn more about CAC
          </ExternalButtonLink>
          <ExternalButtonLink href={externalLinks.donate}>
            Donate to CAC
          </ExternalButtonLink>
        </div>
      </section>

      <section className="simulation-result__outcome" aria-label="Your outcome">
        {reason && <p>{reason}</p>}
        <p>
          Ending balance <strong>{formatUsd(balance)}</strong>
        </p>
        <Button variant="secondary" onClick={() => onReplay(false)}>
          Replay from household selection
        </Button>
        <p className="simulation-result__note">
          Choose a household and start a fresh run without CAC assistance.
        </p>
      </section>

      {runId && <ResultComparisons key={runId} runId={runId} />}
      <ExternalButtonLink href={paths.data} variant="text">
        Explore data visualizations
      </ExternalButtonLink>
    </div>
  )
}

function ResultComparisons({ runId }: { runId: string }) {
  const [rows, setRows] = useState<ResultComparison[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    void loadResultComparisons(runId).then(
      (result) => {
        if (current) setRows(result)
      },
      () => {
        if (current) setFailed(true)
      },
    )
    return () => {
      current = false
    }
  }, [runId, attempt])

  return (
    <section
      className="simulation-result__comparison"
      aria-labelledby="result-comparison"
    >
      <h3 id="result-comparison">How others answered</h3>
      <p>
        One saved decision per category you answered, compared with other
        players using the same household, content version, and assistance
        setting.
      </p>
      {failed ? (
        <div>
          <p role="status">Player comparisons are unavailable right now.</p>
          <Button
            variant="text"
            onClick={() => {
              setFailed(false)
              setAttempt(attempt + 1)
            }}
          >
            Retry comparisons
          </Button>
        </div>
      ) : rows === null ? (
        <p role="status">Loading player comparisons…</p>
      ) : rows.length === 0 ? (
        <p>No scenario answers were saved for this run.</p>
      ) : (
        <div className="simulation-result__cards">
          {rows.map((row) => (
            <article key={row.category}>
              <p className="simulation-result__category">{row.category}</p>
              <h4>{row.question}</h4>
              <p>
                <strong>Your answer</strong> <span>{row.answer}</span>
              </p>
              {row.responses === null ? (
                <p>Insufficient responses to show percentages.</p>
              ) : (
                <>
                  <p>{row.responses} other runs answered</p>
                  <ul>
                    {row.options.map((option) => (
                      <li key={option.id}>
                        <div>
                          <span>{option.label}</span>
                          <strong>{option.percent}%</strong>
                        </div>
                        <progress
                          aria-label={option.label}
                          max={100}
                          value={option.percent}
                        />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
