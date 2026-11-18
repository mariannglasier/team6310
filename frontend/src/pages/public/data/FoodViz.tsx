import { useState } from 'react'
import { cacFigure } from './cacFacts'
import {
  GROCERY_ITEMS,
  basketCents,
  priceAfterIncrease,
  pricePresets,
  usd,
} from './dataExplorerLogic'
import { ChoiceGroup, ExplorerLayout, type VizProps } from './ExplorerParts'
import { findStatistic, formatStatisticValue } from './explorerStatistics'

// Published 12-month price changes the player can apply to the basket, in
// this order. Nothing else changes the prices.
const PRICE_CHANGE_KEYS = [
  'us_food_at_home_price_change',
  'atl_food_beverage_cpi_change',
]

// Short names for the price-change chips; the full place and period appear
// once a chip is chosen.
const PRICE_CHANGE_NAMES: Readonly<Record<string, string>> = {
  us_food_at_home_price_change: 'U.S. groceries',
  atl_food_beverage_cpi_change: 'Atlanta area food',
}

function pantryNote(): string | null {
  const served = cacFigure('food.households')
  return served
    ? `CAC food assistance served ${served.value} households in ${served.year}.`
    : null
}

export function FoodViz({
  category,
  mode,
  onModeChange,
  live,
  onRetryLive,
}: VizProps) {
  const [tenths, setTenths] = useState(0)
  const presets = pricePresets(
    PRICE_CHANGE_KEYS.flatMap((key) => {
      const statistic = findStatistic(live, key)
      return statistic && statistic.unit === 'percent_change'
        ? [
            {
              percent: statistic.value,
              label: `${formatStatisticValue(statistic)} · ${PRICE_CHANGE_NAMES[key] ?? statistic.geography}`,
              detail: `${statistic.geography} · ${statistic.periodLabel}`,
            },
          ]
        : []
    }),
  )
  const active = presets.find((preset) => preset.value === tenths) ?? presets[0]

  const lastYear = basketCents(0)
  const now = basketCents(active.value)
  const extra = now - lastYear
  const pantry = mode === 'impact' ? pantryNote() : null

  return (
    <ExplorerLayout
      category={category}
      mode={mode}
      onModeChange={onModeChange}
      live={live}
      onRetryLive={onRetryLive}
      sceneLabel="Sample grocery basket repriced by a published price change"
      scene={
        <div className="food-scene">
          <ul className="basket" aria-label="Sample grocery basket">
            {GROCERY_ITEMS.map((item) => (
              <li className="basket__item" key={item.id}>
                <span className="basket__name">{item.label}</span>
                <span className="basket__price">
                  {usd(priceAfterIncrease(item.cents, active.value))}
                  {active.value > 0 && <small> was {usd(item.cents)}</small>}
                </span>
              </li>
            ))}
          </ul>
          <div className="basket-compare">
            <div className="basket-compare__row">
              <span className="basket-compare__label">Last year</span>
              <span className="basket-compare__track" aria-hidden="true">
                <span
                  className="basket-compare__bar"
                  style={{ width: `${(lastYear / now) * 100}%` }}
                />
              </span>
              <strong className="basket-compare__value">{usd(lastYear)}</strong>
            </div>
            <div className="basket-compare__row">
              <span className="basket-compare__label">With the change</span>
              <span className="basket-compare__track" aria-hidden="true">
                <span
                  className="basket-compare__bar basket-compare__bar--now"
                  style={{ width: '100%' }}
                />
              </span>
              <strong className="basket-compare__value">{usd(now)}</strong>
            </div>
            <p className="scene-readout" role="status">
              <strong>
                {extra > 0
                  ? `The same basket costs ${usd(extra)} more.`
                  : 'The same basket costs the same as last year.'}
              </strong>{' '}
              {active.detail}
            </p>
            {pantry && <p className="scene-note">{pantry}</p>}
          </div>
        </div>
      }
      controls={
        <ChoiceGroup
          label="Apply a published price change"
          value={active.value}
          onChange={setTenths}
          options={presets}
        />
      }
    />
  )
}
