import { useState } from 'react'
import { externalLinks } from '../../../app/externalLinks'
import { cacFigure } from './cacFacts'
import {
  ChoiceGroup,
  ExplorerIcon,
  ExplorerLayout,
  type VizProps,
} from './ExplorerParts'
import { findShare, formatStatisticValue } from './explorerStatistics'
import { PercentPictogram } from './StatisticVisuals'
import type { LiveStatisticsState } from './useExplorerStatistics'

// Two published national measures of household money. Each is drawn as a share
// of 100, and the exact value and what it measures stay in text.
const MEASURES = [
  {
    key: 'us_personal_saving_rate',
    label: 'Saving',
    heading: 'Out of every $100 of after-tax income',
    icon: 'dot',
    sentence: (value: string) =>
      `${value} of after-tax income is set aside instead of spent.`,
  },
  {
    key: 'us_consumer_loan_delinquency_rate',
    label: 'Late payments',
    heading: 'Out of every 100 consumer loans',
    icon: 'dot',
    sentence: (value: string) =>
      `${value} of consumer loans at U.S. commercial banks are behind on payments.`,
  },
] as const

function unavailableMessage(live: LiveStatisticsState) {
  if (live.status === 'loading')
    return 'Loading the latest published statistics for household money…'
  if (live.status === 'error')
    return 'The statistics for household money could not be loaded.'
  return 'No published statistics are available yet for household money.'
}

function taxHelpNote(): string | null {
  const returns = cacFigure('vita.federal_returns_prepared')
  return returns
    ? `CAC’s Volunteer Income Tax Assistance prepared ${returns.value} federal tax returns in ${returns.year}.`
    : null
}

export function FinanceViz({
  category,
  mode,
  onModeChange,
  live,
  onRetryLive,
}: VizProps) {
  const [measureKey, setMeasureKey] = useState<string>(MEASURES[0].key)
  const measures = MEASURES.flatMap((measure) => {
    const statistic = findShare(live, measure.key)
    return statistic ? [{ ...measure, statistic }] : []
  })
  const chosen = measures.find((item) => item.key === measureKey) ?? measures[0]
  const note = mode === 'impact' ? taxHelpNote() : null

  return (
    <ExplorerLayout
      category={category}
      mode={mode}
      onModeChange={onModeChange}
      live={live}
      onRetryLive={onRetryLive}
      sceneLabel="Household money as a share of 100"
      scene={
        <div className="money">
          {chosen ? (
            <>
              <p className="ladder__title">{chosen.heading}</p>
              <PercentPictogram
                percent={chosen.statistic.value}
                total={100}
                icon={chosen.icon}
                dense
                valueText={formatStatisticValue(chosen.statistic)}
              />
              <p className="scene-readout">
                <strong>
                  {chosen.sentence(formatStatisticValue(chosen.statistic))}
                </strong>{' '}
                {chosen.statistic.geography} · {chosen.statistic.periodLabel}
              </p>
            </>
          ) : (
            <>
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
            </>
          )}
          {note && <p className="scene-note">{note}</p>}
        </div>
      }
      controls={
        <>
          {measures.length > 1 && chosen && (
            <ChoiceGroup
              label="Measure"
              value={chosen.key}
              onChange={setMeasureKey}
              options={measures.map(({ key, label }) => ({
                value: key,
                label,
              }))}
            />
          )}
          <a
            className="ui-button ui-button--primary explorer-cta"
            href={externalLinks.learn}
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore CAC financial education
            <ExplorerIcon kind="arrow" size={18} />
            <span className="explorer-sr"> (opens in a new tab)</span>
          </a>
        </>
      }
    />
  )
}
