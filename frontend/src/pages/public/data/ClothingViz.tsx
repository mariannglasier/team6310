import { useState } from 'react'
import { BELT_GARMENTS, type GarmentKind } from './dataExplorerLogic'
import {
  ChoiceGroup,
  ExplorerIcon,
  ExplorerLayout,
  type VizProps,
} from './ExplorerParts'

type Moment = 'interview' | 'school' | 'cold' | 'restart'

const moments: Record<
  Moment,
  { label: string; text: string; featured: readonly GarmentKind[] }
> = {
  interview: {
    label: 'Job interview',
    text: 'A neat, professional outfit is often expected for an interview, and buying one can strain a tight budget.',
    featured: ['shirt', 'dress', 'pants', 'shoe'],
  },
  school: {
    label: 'School days',
    text: 'Children outgrow clothes quickly and need what fits for class, gym, and the playground.',
    featured: ['shirt', 'pants', 'shoe'],
  },
  cold: {
    label: 'Cold weather',
    text: 'A winter coat, gloves, and warm layers all cost money at once when the temperature drops.',
    featured: ['coat'],
  },
  restart: {
    label: 'Starting over',
    text: 'After a move or an emergency, families may leave with only what they can carry.',
    featured: ['shirt', 'coat', 'dress', 'pants', 'shoe'],
  },
}

const shapes: Record<GarmentKind, string> = {
  shirt: 'M14 6 5 12l4 8 4-2v24h14V18l4 2 4-8-9-6c-2 3-10 3-12 0Z',
  coat: 'M13 5 4 12l2 22h6v10h16V34h6l2-22-9-7-7 8Z M20 13v31',
  dress: 'M15 5h4l1 4 1-4h4l-1 13 8 26H8l8-26Z',
  pants: 'M11 6h18l3 38H22l-2-24-2 24H8Z',
  shoe: 'M6 26h12l4 5c8 0 14 3 14 7v3H6Z',
}

function Garment({
  kind,
  featured,
  filled,
}: {
  kind: GarmentKind
  featured: boolean
  filled: boolean
}) {
  return (
    <svg
      className={`garment${featured ? ' is-featured' : ''}${filled ? ' is-filled' : ''}`}
      viewBox="0 0 40 60"
      width="64"
      height="96"
      aria-hidden="true"
      focusable="false"
    >
      <path className="garment__hook" d="M20 0v6m-5-4a5 5 0 1 1 5 5" />
      <g transform="translate(0 10)">
        <path className="garment__shape" d={shapes[kind]} />
        {filled && featured && (
          <circle className="garment__badge" cx="31" cy="38" r="6" />
        )}
        {filled && featured && (
          <path className="garment__tick" d="m28 38 2.5 2.5 4-5" />
        )}
      </g>
    </svg>
  )
}

export function ClothingViz({ category, mode, onModeChange }: VizProps) {
  const [moment, setMoment] = useState<Moment>('interview')
  const [paused, setPaused] = useState(false)
  const selected = moments[moment]
  const filled = mode === 'impact'

  return (
    <ExplorerLayout
      category={category}
      mode={mode}
      onModeChange={onModeChange}
      sceneLabel="Clothing conveyor belt"
      scene={
        <div className="clothing-scene">
          <div
            className="belt"
            role="img"
            aria-label={`Clothes on a moving rail. ${selected.label}: ${selected.text}`}
          >
            <div className={`belt__track${paused ? ' is-paused' : ''}`}>
              {[0, 1].map((copy) => (
                <div className="belt__set" key={copy} aria-hidden="true">
                  {BELT_GARMENTS.map((kind, index) => (
                    <Garment
                      key={`${copy}-${index}`}
                      kind={kind}
                      featured={selected.featured.includes(kind)}
                      filled={filled}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="belt__rail" aria-hidden="true" />
          </div>
          <div className="clothing-moment" aria-live="polite">
            <p className="clothing-moment__label">{selected.label}</p>
            <p>{selected.text}</p>
          </div>
          <button
            type="button"
            className="ui-button ui-button--secondary clothing-pause"
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >
            {paused ? 'Play the belt' : 'Pause the belt'}
          </button>
          <ul className="scene-legend" aria-label="Hanger key">
            <li>
              <span className="key key--hanger-empty" aria-hidden="true" />
              Outline: still needed
            </li>
            {filled && (
              <li>
                <span className="key key--hanger-filled" aria-hidden="true">
                  <ExplorerIcon kind="check" size={12} />
                </span>
                Filled with a check: given through the clothing closet
              </li>
            )}
          </ul>
        </div>
      }
      controls={
        <ChoiceGroup
          label="Choose a moment"
          value={moment}
          onChange={setMoment}
          options={(Object.keys(moments) as Moment[]).map((key) => ({
            value: key,
            label: moments[key].label,
          }))}
        />
      }
    />
  )
}
