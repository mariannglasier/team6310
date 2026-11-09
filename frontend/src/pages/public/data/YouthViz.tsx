import { useState } from 'react'
import {
  NEED_RIDER_SLOTS,
  RIDER_COUNT,
  ridersInNeed,
} from './dataExplorerLogic'
import { ChoiceGroup, ExplorerLayout, type VizProps } from './ExplorerParts'

type Season = 'summer' | 'fall' | 'winter'

const seasons: Record<
  Season,
  { label: string; need: string; support: string }
> = {
  summer: {
    label: 'Summer',
    need: 'School is out, and so are school breakfasts and lunches.',
    support:
      'CAC’s Meals for Kids provides summer meals to over 660 local families in the Sandy Springs and Dunwoody area.',
  },
  fall: {
    label: 'Fall',
    need: 'Back to school means backpacks, notebooks, and supplies all at once.',
    support:
      'CAC provides access to clothing and essential items for neighbors facing financial hardship.',
  },
  winter: {
    label: 'Winter',
    need: 'Coats, warm clothes, and holiday gifts add up as the weather turns cold.',
    support:
      'CAC provides food assistance and access to clothing and essential items for neighbors facing financial hardship.',
  },
}

export function YouthViz({ category, mode, onModeChange }: VizProps) {
  const [season, setSeason] = useState<Season>('summer')
  const need = ridersInNeed(1, 6)
  const slots = NEED_RIDER_SLOTS.slice(0, need)
  const impact = mode === 'impact'
  const copy = seasons[season]

  return (
    <ExplorerLayout
      category={category}
      mode={mode}
      onModeChange={onModeChange}
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
                : `${RIDER_COUNT} children boarding a school bus. ${need} of ${RIDER_COUNT} are marked: 1 in 6 may face hunger.`
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
            {!impact && (
              <li>
                <span className="key key--kid-need" aria-hidden="true" />
                Triangle and red ring: may go without (1 in 6)
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
                : `${need} of ${RIDER_COUNT} riders are marked.`}
            </strong>{' '}
            {copy.label}: {impact ? copy.support : copy.need}
          </p>
        </>
      }
      controls={
        <ChoiceGroup
          label="Season"
          value={season}
          onChange={setSeason}
          options={(Object.keys(seasons) as Season[]).map((key) => ({
            value: key,
            label: seasons[key].label,
          }))}
        />
      }
    />
  )
}
