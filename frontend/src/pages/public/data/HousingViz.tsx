import { useState } from 'react'
import { facts } from './dataExplorerContent'
import {
  WINDOW_COUNT,
  WINDOW_DARK_ORDER,
  darkWindowCount,
  relitWindowCount,
} from './dataExplorerLogic'
import { ChoiceGroup, ExplorerLayout, type VizProps } from './ExplorerParts'

type Subject = 'rent' | 'utilities'
type Season = 'winter' | 'summer'

const seasonNotes: Record<Season, string> = {
  winter:
    'Winter: heating keeps a home safe on the coldest nights, and the bill climbs as the temperature falls.',
  summer:
    'Summer: cooling matters in Georgia heat, and the bill climbs as the temperature rises.',
}

export function HousingViz({ category, mode, onModeChange }: VizProps) {
  const [subject, setSubject] = useState<Subject>('rent')
  const [season, setSeason] = useState<Season>('winter')

  const fact = subject === 'rent' ? facts.rentBurden : facts.energyInsecurity
  const dark = darkWindowCount(fact.percent)
  const relit = mode === 'impact' ? relitWindowCount(dark) : 0
  const stat =
    subject === 'rent'
      ? 'about 1 in 2 renter households'
      : 'about 1 in 3 households'
  const summary =
    mode === 'impact'
      ? `${dark} of ${WINDOW_COUNT} windows are dark and ${relit} are lit again with support.`
      : `${dark} of ${WINDOW_COUNT} windows are dark.`

  const windows = Array.from({ length: WINDOW_COUNT }, (_, index) => {
    const rank = WINDOW_DARK_ORDER.indexOf(index)
    const isDark = rank < dark
    const isRelit = isDark && rank < relit
    return { index, isDark, isRelit }
  })

  return (
    <ExplorerLayout
      category={category}
      mode={mode}
      onModeChange={onModeChange}
      sceneLabel="Apartment building with windows"
      scene={
        <>
          <svg
            className={`housing-scene housing-scene--${subject === 'utilities' ? season : 'rent'}`}
            viewBox="0 0 360 300"
            role="img"
            aria-label={`Apartment building with ${WINDOW_COUNT} windows. ${summary}`}
          >
            <rect
              className="housing-sky"
              rx="14"
              x="0"
              y="0"
              width="360"
              height="300"
            />
            {subject === 'utilities' && season === 'summer' && (
              <g className="housing-sun">
                <circle cx="312" cy="46" r="22" />
                <path d="M312 8v10M312 74v10M274 46h10M340 46h10M285 19l7 7M332 66l7 7M339 19l-7 7M292 66l-7 7" />
              </g>
            )}
            {subject === 'utilities' && season === 'winter' && (
              <g className="housing-snow" aria-hidden="true">
                {[40, 90, 150, 230, 290, 330].map((x, i) => (
                  <circle
                    key={x}
                    cx={x}
                    cy={30 + ((i * 37) % 120)}
                    r={3}
                    style={{ animationDelay: `${i * 0.6}s` }}
                  />
                ))}
              </g>
            )}
            <rect
              className="housing-ground"
              x="0"
              y="262"
              width="360"
              height="38"
            />
            <rect
              className="housing-building"
              x="88"
              y="22"
              width="184"
              height="244"
              rx="6"
            />
            <rect
              className="housing-roof"
              x="80"
              y="14"
              width="200"
              height="12"
              rx="3"
            />
            {windows.map(({ index, isDark, isRelit }) => {
              const x = 106 + (index % 4) * 42
              const y = 36 + Math.floor(index / 4) * 40
              return (
                <g key={index}>
                  <rect
                    className={
                      isRelit
                        ? 'win win--relit'
                        : isDark
                          ? 'win win--dark'
                          : 'win win--lit'
                    }
                    x={x}
                    y={y}
                    width="30"
                    height="32"
                    rx="3"
                    style={{ animationDelay: `${(index % 7) * 0.35}s` }}
                  />
                  {isDark && !isRelit && (
                    <path
                      className="win__x"
                      d={`M${x + 6} ${y + 6}l18 20M${x + 24} ${y + 6}l-18 20`}
                    />
                  )}
                  {isRelit && (
                    <path
                      className="win__check"
                      d={`M${x + 7} ${y + 17}l6 6 11-13`}
                    />
                  )}
                </g>
              )
            })}
            <rect
              className="housing-door"
              x="165"
              y="234"
              width="30"
              height="32"
              rx="3"
            />
          </svg>
          <ul className="scene-legend" aria-label="Window key">
            <li>
              <span className="key key--lit" aria-hidden="true" />
              Lit: not under pressure
            </li>
            <li>
              <span className="key key--dark" aria-hidden="true" />
              Dark with an X: under pressure
            </li>
            {mode === 'impact' && (
              <li>
                <span className="key key--relit" aria-hidden="true" />
                Lit with a check: helped by support
              </li>
            )}
          </ul>
          <p className="scene-readout">
            <strong>{summary}</strong> Each window stands for 5 of every 100
            households. {fact.value} · {stat}.
          </p>
          {mode === 'impact' && (
            <p className="scene-note">
              Illustration of support at work, not a measured CAC result.
            </p>
          )}
        </>
      }
      controls={
        <>
          <ChoiceGroup
            label="What are we looking at?"
            value={subject}
            onChange={setSubject}
            options={[
              { value: 'rent', label: 'Rent' },
              { value: 'utilities', label: 'Utilities' },
            ]}
          />
          {subject === 'utilities' && (
            <ChoiceGroup
              label="Season"
              value={season}
              onChange={setSeason}
              options={[
                { value: 'winter', label: 'Winter' },
                { value: 'summer', label: 'Summer' },
              ]}
              hint={seasonNotes[season]}
            />
          )}
        </>
      }
    />
  )
}
