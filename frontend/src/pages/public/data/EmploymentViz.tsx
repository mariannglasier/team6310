import { useState } from 'react'
import { cacFigure } from './cacFacts'
import { ChoiceGroup, ExplorerLayout, type VizProps } from './ExplorerParts'
import {
  findShare,
  findStatistic,
  formatStatisticValue,
} from './explorerStatistics'
import { PercentPictogram } from './StatisticVisuals'
import type { LiveStatisticsState } from './useExplorerStatistics'

// Each step of the ladder pairs two published U.S. statistics for adults age
// 25 and over: the unemployment rate and the median weekly earnings. Choosing a
// step shows both, and the earnings of every step stay side by side.
const LEVELS = [
  {
    id: 'less',
    label: 'No high school diploma',
    group: 'adults without a high school diploma',
    unemployment: 'us_unemployment_less_than_high_school',
    earnings: 'us_weekly_earnings_less_than_high_school',
  },
  {
    id: 'hs',
    label: 'High school diploma',
    group: 'high school graduates with no college',
    unemployment: 'us_unemployment_high_school_graduates',
    earnings: 'us_weekly_earnings_high_school_graduates',
  },
  {
    id: 'college',
    label: 'Bachelor’s degree or higher',
    group: 'adults with a bachelor’s degree or higher',
    unemployment: 'us_unemployment_bachelors_degree',
    earnings: 'us_weekly_earnings_bachelors_degree',
  },
] as const

function unavailableMessage(live: LiveStatisticsState) {
  if (live.status === 'loading')
    return 'Loading the latest published statistics for each education level…'
  if (live.status === 'error')
    return 'The statistics for each education level could not be loaded.'
  return 'No published statistics are available yet for education and work.'
}

function classesNote(): string | null {
  const esol = cacFigure('adult_education.esol')
  const computers = cacFigure('adult_education.computers')
  if (!esol || !computers) return null
  return `CAC adult education in ${esol.year}: ${esol.value} students in English classes and ${computers.value} in computer classes.`
}

export function EmploymentViz({
  category,
  mode,
  onModeChange,
  live,
  onRetryLive,
}: VizProps) {
  const [levelId, setLevelId] = useState<string>(LEVELS[0].id)

  const levels = LEVELS.map((level) => ({
    ...level,
    rate: findShare(live, level.unemployment),
    pay: findStatistic(live, level.earnings),
  })).filter((level) => level.rate || level.pay)
  const level = levels.find((item) => item.id === levelId) ?? levels[0]
  const paid = levels.flatMap((item) =>
    item.pay ? [{ ...item, pay: item.pay }] : [],
  )
  const topPay = Math.max(...paid.map((item) => item.pay.value), 0)
  const note = mode === 'impact' ? classesNote() : null

  return (
    <ExplorerLayout
      category={category}
      mode={mode}
      onModeChange={onModeChange}
      live={live}
      onRetryLive={onRetryLive}
      sceneLabel="Education, unemployment and earnings"
      scene={
        level ? (
          <div className="ladder">
            <section className="ladder__rate" aria-label="Unemployment">
              <p className="ladder__title">
                Out of every 100 in the labor force
                <span> · {level.label}</span>
              </p>
              {level.rate ? (
                <>
                  <PercentPictogram
                    percent={level.rate.value}
                    total={100}
                    icon="person"
                    dense
                    valueText={formatStatisticValue(level.rate)}
                  />
                  <p className="scene-readout">
                    <strong>
                      {formatStatisticValue(level.rate)} of {level.group} in the
                      labor force are out of work.
                    </strong>{' '}
                    {level.rate.geography} · {level.rate.periodLabel}
                  </p>
                </>
              ) : (
                <p className="scene-readout">
                  No published unemployment rate for this level.
                </p>
              )}
            </section>
            <section className="ladder__pay" aria-label="Weekly earnings">
              <p className="ladder__title">
                Median weekly earnings, before taxes
              </p>
              <ul className="ladder__bars">
                {paid.map((item) => (
                  <li
                    key={item.id}
                    className={item.id === level.id ? 'is-chosen' : undefined}
                    aria-current={item.id === level.id ? 'true' : undefined}
                  >
                    <span className="ladder__bar-label">{item.label}</span>
                    <span className="ladder__bar-track" aria-hidden="true">
                      <span
                        className="ladder__bar"
                        style={{ width: `${(item.pay.value / topPay) * 100}%` }}
                      />
                    </span>
                    <strong className="ladder__bar-value">
                      {formatStatisticValue(item.pay)}
                    </strong>
                  </li>
                ))}
              </ul>
              {paid[0] && (
                <p className="ladder__scale">
                  Bars start at $0. {paid[0].pay.geography} ·{' '}
                  {paid[0].pay.periodLabel}
                </p>
              )}
            </section>
            {note && <p className="scene-note">{note}</p>}
          </div>
        ) : (
          <div className="ladder">
            <p className="scene-readout" role="status">
              {unavailableMessage(live)}
            </p>
            {live.status === 'error' && (
              <button
                type="button"
                className="live-stats__retry"
                onClick={onRetryLive}
              >
                Retry
              </button>
            )}
            {note && <p className="scene-note">{note}</p>}
          </div>
        )
      }
      controls={
        levels.length > 1 ? (
          <ChoiceGroup
            label="Highest education"
            value={level.id}
            onChange={setLevelId}
            options={levels.map(({ id, label }) => ({ value: id, label }))}
          />
        ) : null
      }
    />
  )
}
