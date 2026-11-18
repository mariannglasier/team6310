import { useState } from 'react'
import {
  WINDOW_COUNT,
  WINDOW_DARK_ORDER,
  darkWindowCount,
  relitWindowCount,
} from './dataExplorerLogic'
import {
  ChoiceGroup,
  ExplorerLayout,
  SceneDetails,
  type VizProps,
} from './ExplorerParts'
import { findShare, formatStatisticValue } from './explorerStatistics'
import type { LiveStatisticsState } from './useExplorerStatistics'

// The windows are drawn only from a published renter cost burden. The same
// measure is published for Sandy Springs and for the United States, so the
// player can compare the two on the same 20 windows.
const PLACES = [
  { key: 'sandy_springs_renter_cost_burden', label: 'Sandy Springs' },
  { key: 'us_renter_cost_burden', label: 'United States' },
] as const

function unavailableMessage(live: LiveStatisticsState) {
  if (live.status === 'loading')
    return 'Loading the latest published statistic for the windows…'
  if (live.status === 'error')
    return 'The statistic for the windows could not be loaded, so they are not marked.'
  return 'No published statistic is available yet for renter households, so the windows are not marked.'
}

export function HousingViz({
  category,
  mode,
  onModeChange,
  live,
  onRetryLive,
}: VizProps) {
  const [placeKey, setPlaceKey] = useState<string>(PLACES[0].key)

  // Without a published share the windows stay unmarked rather than showing a
  // made-up figure.
  const published = PLACES.filter((place) => findShare(live, place.key))
  const place = published.find((item) => item.key === placeKey) ?? published[0]
  const share = place ? findShare(live, place.key) : undefined
  const dark = share ? darkWindowCount(share.value) : null
  const relit = dark !== null && mode === 'impact' ? relitWindowCount(dark) : 0
  const summary =
    dark === null
      ? unavailableMessage(live)
      : mode === 'impact'
        ? `${dark} of ${WINDOW_COUNT} windows are dark and ${relit} are lit again with support.`
        : `${dark} of ${WINDOW_COUNT} windows are dark.`

  const windows = Array.from({ length: WINDOW_COUNT }, (_, index) => {
    const rank = WINDOW_DARK_ORDER.indexOf(index)
    const isDark = dark !== null && rank < dark
    const isRelit = isDark && rank < relit
    return { index, isDark, isRelit }
  })

  return (
    <ExplorerLayout
      category={category}
      mode={mode}
      onModeChange={onModeChange}
      live={live}
      onRetryLive={onRetryLive}
      sceneLabel="Apartment building with windows"
      scene={
        <>
          <svg
            className="housing-scene"
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
                          : dark === null
                            ? 'win win--neutral'
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
            {dark === null ? (
              <li>
                <span className="key key--neutral" aria-hidden="true" />
                Grey: no published statistic to mark
              </li>
            ) : (
              <>
                <li>
                  <span className="key key--lit" aria-hidden="true" />
                  Lit: not under pressure
                </li>
                <li>
                  <span className="key key--dark" aria-hidden="true" />
                  Dark with an X: under pressure
                </li>
              </>
            )}
            {mode === 'impact' && dark !== null && (
              <li>
                <span className="key key--relit" aria-hidden="true" />
                Lit with a check: helped by support
              </li>
            )}
          </ul>
          <p className="scene-readout">
            <strong>{summary}</strong>
            {share && <> Published value: {formatStatisticValue(share)}.</>}
          </p>
          {share && (
            <SceneDetails>
              Each window stands for 5 of every 100 households, rounded to the
              nearest window. {share.geography} · {share.periodLabel}.
            </SceneDetails>
          )}
          {dark === null && live.status === 'error' && (
            <button
              type="button"
              className="live-stats__retry"
              onClick={onRetryLive}
            >
              Retry
            </button>
          )}
          {mode === 'impact' && dark !== null && (
            <p className="scene-note">
              Illustration of support at work, not a measured CAC result.
            </p>
          )}
        </>
      }
      controls={
        published.length > 1 ? (
          <ChoiceGroup
            label="Compare places"
            value={place.key}
            onChange={setPlaceKey}
            options={published.map(({ key, label }) => ({ value: key, label }))}
          />
        ) : null
      }
    />
  )
}
