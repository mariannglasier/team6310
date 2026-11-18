import { useEffect, useState } from 'react'
import { Button, ExternalButtonLink } from '../ui/Button'
import pantryPhoto from '../../assets/foodpantry2.png'
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
      {reason && <p className="simulation-result__reason">{reason}</p>}
      <section
        className="simulation-result__help"
        aria-labelledby="result-help"
      >
        <div className="simulation-result__help-content">
          <h3 id="result-help">When money is tight, CAC can help.</h3>
          <p>
            The Community Assistance Center helps neighbors facing financial
            hardship with essentials such as food and housing. Try a new run
            with CAC assistance to see how options like job preparation and
            interview clothing can change the choices available to your
            household.
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
        </div>
        <img
          className="simulation-result__help-photo"
          src={pantryPhoto}
          alt=""
        />
      </section>

      <section className="simulation-result__outcome" aria-label="Your outcome">
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
      <ExternalButtonLink href={paths.data} variant="secondary">
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
      <h3 id="result-comparison">How players answered</h3>
      <p>
        Decisions you answered, with comparisons to other players using the same
        household and assistance setting.
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
              <p>
                {row.responses ?? 1}{' '}
                {(row.responses ?? 1) === 1 ? 'response' : 'responses'}
              </p>
              <ComparisonPie
                options={
                  row.responses === null
                    ? [{ id: 'own', label: row.answer, percent: 100 }]
                    : row.options
                }
              />
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

const pieColors = [
  '#9e203b',
  '#456345',
  '#315e80',
  '#90571c',
  '#68518b',
  '#216a6c',
]

function ComparisonPie({ options }: { options: ResultComparison['options'] }) {
  const total = options.reduce((sum, option) => sum + option.percent, 0)
  const slices = options.map((option, index) => {
    const color = pieColors[index % pieColors.length]
    const start = options
      .slice(0, index)
      .reduce((sum, previous) => sum + previous.percent, 0)
    const end = start + option.percent
    return {
      ...option,
      color,
      stop: `${color} ${(100 * start) / total}% ${(100 * end) / total}%`,
    }
  })
  return (
    <>
      {total > 0 && (
        <div
          aria-hidden="true"
          className="simulation-result__pie"
          style={{
            background: `conic-gradient(${slices
              .filter((slice) => slice.percent > 0)
              .map((slice) => slice.stop)
              .join(', ')}, transparent 100%)`,
          }}
        />
      )}
      <ul
        className="simulation-result__legend"
        aria-label="Response percentages"
      >
        {slices.map((slice) => (
          <li key={slice.id}>
            <span aria-hidden="true" style={{ backgroundColor: slice.color }} />
            <span>{slice.label}</span>
            <strong>{slice.percent}%</strong>
          </li>
        ))}
      </ul>
    </>
  )
}
