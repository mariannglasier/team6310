import { useState } from 'react'
import { cacFigure } from './cacFacts'
import {
  RIDER_COUNT,
  RIDER_NEED_ORDER,
  ridersInNeed,
} from './dataExplorerLogic'
import {
  ChoiceGroup,
  ExplorerLayout,
  SceneDetails,
  type VizProps,
} from './ExplorerParts'
import { findShare, formatStatisticValue } from './explorerStatistics'
import type { LiveStatisticsState } from './useExplorerStatistics'

// The same measure is published for four places, so the riders can be
// re-marked to compare them. The bus holds 18 riders; each is marked to the
// nearest whole rider.
const PLACES = [
  { key: 'sandy_springs_child_poverty_rate', label: 'Sandy Springs' },
  { key: 'fulton_child_poverty_rate', label: 'Fulton County' },
  { key: 'dekalb_child_poverty_rate', label: 'DeKalb County' },
  { key: 'us_child_poverty_rate', label: 'United States' },
] as const

function mealsForKidsSupport(): string {
  const served = cacFigure('meals_for_kids.children')
  return served
    ? `CAC’s Meals for Kids served ${served.value} children in ${served.year}.`
    : 'CAC’s Meals for Kids provides summer meals to local children.'
}

function unavailableMessage(live: LiveStatisticsState) {
  if (live.status === 'loading')
    return 'Loading the latest published statistic for the riders…'
  if (live.status === 'error')
    return 'The statistic for the riders could not be loaded, so none are marked.'
  return 'No published statistic is available yet for children, so no riders are marked.'
}

export function YouthViz({
  category,
  mode,
  onModeChange,
  live,
  onRetryLive,
}: VizProps) {
  const [placeKey, setPlaceKey] = useState<string>(PLACES[0].key)
  const published = PLACES.filter((item) => findShare(live, item.key))
  const place = published.find((item) => item.key === placeKey) ?? published[0]
  const share = place ? findShare(live, place.key) : undefined
  const need = share ? ridersInNeed(share.value, 100) : null
  const slots = need === null ? [] : RIDER_NEED_ORDER.slice(0, need)
  const shareText = share
    ? `${formatStatisticValue(share)} of ${share.geography} children live below the poverty line (${share.periodLabel})`
    : null
  const impact = mode === 'impact'

  return (
    <ExplorerLayout
      category={category}
      mode={mode}
      onModeChange={onModeChange}
      live={live}
      onRetryLive={onRetryLive}
      sceneLabel="School bus and children boarding"
      scene={
        <>
          <svg
            className="youth-scene"
            viewBox="0 0 360 270"
            role="img"
            aria-label={
              impact
                ? `${RIDER_COUNT} children boarding a school bus. With support, all ${RIDER_COUNT} board on equal footing.`
                : need === null
                  ? `${RIDER_COUNT} children boarding a school bus. ${unavailableMessage(live)}`
                  : `${RIDER_COUNT} children boarding a school bus. ${need} of ${RIDER_COUNT} are marked: ${shareText}.`
            }
          >
            <rect className="youth-sky" x="0" y="0" width="360" height="270" />
            <rect
              className="youth-ground"
              x="0"
              y="238"
              width="360"
              height="32"
            />
            <g className="bus">
              <rect
                className="bus__body"
                x="18"
                y="18"
                width="324"
                height="84"
                rx="16"
              />
              {Array.from({ length: 7 }, (_, i) => (
                <rect
                  key={i}
                  className="bus__window"
                  x={34 + i * 40}
                  y="32"
                  width="30"
                  height="28"
                  rx="4"
                />
              ))}
              <rect
                className="bus__stripe"
                x="18"
                y="72"
                width="324"
                height="6"
              />
              <circle className="bus__wheel" cx="84" cy="104" r="14" />
              <circle className="bus__wheel" cx="276" cy="104" r="14" />
            </g>
            {Array.from({ length: RIDER_COUNT }, (_, index) => {
              const col = index % 9
              const row = Math.floor(index / 9)
              const x = 32 + col * 37
              const y = 148 + row * 48
              const marked = slots.includes(index)
              const showNeed = marked && !impact
              const supported = marked && impact
              return (
                <g key={index} className={`kid${showNeed ? ' kid--need' : ''}`}>
                  {showNeed && (
                    <>
                      <circle className="kid__ring" cx={x} cy={y + 11} r="21" />
                      <path
                        className="kid__marker"
                        d={`M${x} ${y - 20}l6 10h-12Z`}
                      />
                    </>
                  )}
                  <circle className="kid__head" cx={x} cy={y} r="7" />
                  <rect
                    className="kid__body"
                    x={x - 8}
                    y={y + 9}
                    width="16"
                    height="24"
                    rx="6"
                  />
                  {supported && (
                    <>
                      <circle
                        className="kid__badge"
                        cx={x + 9}
                        cy={y + 33}
                        r="7"
                      />
                      <path
                        className="kid__tick"
                        d={`m${x + 5.5} ${y + 33}l2.5 2.5 4-5`}
                      />
                    </>
                  )}
                </g>
              )
            })}
          </svg>
          <ul className="scene-legend" aria-label="Rider key">
            <li>
              <span className="key key--kid" aria-hidden="true" />
              Boarding as usual
            </li>
            {!impact && need !== null && (
              <li>
                <span className="key key--kid-need" aria-hidden="true" />
                Triangle and red ring: lives below the poverty line
              </li>
            )}
            {impact && (
              <li>
                <span className="key key--kid-support" aria-hidden="true" />
                Check: supported, on equal footing
              </li>
            )}
          </ul>
          <p className="scene-readout">
            <strong>
              {impact
                ? `All ${RIDER_COUNT} riders board on equal footing.`
                : need === null
                  ? unavailableMessage(live)
                  : `${need} of ${RIDER_COUNT} riders are marked${share ? ` (${formatStatisticValue(share)})` : ''}.`}
            </strong>{' '}
            {impact && mealsForKidsSupport()}
          </p>
          {shareText && (
            <SceneDetails summary="Where this number comes from">
              {shareText}. Riders are marked to the nearest whole rider.
            </SceneDetails>
          )}
          {need === null && live.status === 'error' && (
            <button
              type="button"
              className="live-stats__retry"
              onClick={onRetryLive}
            >
              Retry
            </button>
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
