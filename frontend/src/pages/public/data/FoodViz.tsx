import { useState } from 'react'
import {
  GROCERY_BUDGET_CENTS,
  GROCERY_ITEMS,
  formatTenths,
  priceAfterIncrease,
  summarizeCart,
  usd,
} from './dataExplorerLogic'
import {
  ChoiceGroup,
  ExplorerIcon,
  ExplorerLayout,
  RangeField,
  type VizProps,
} from './ExplorerParts'

const presets = [
  { value: 0, label: 'Last year’s prices' },
  { value: 50, label: '+5.0% (U.S. 2023)' },
  { value: 68, label: '+6.8% (example)' },
  { value: 114, label: '+11.4% (U.S. 2022)' },
]

export function FoodViz({ category, mode, onModeChange }: VizProps) {
  const [tenths, setTenths] = useState(68)
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set())
  const [checkedKey, setCheckedKey] = useState<string | null>(null)

  const stateKey = `${mode}:${tenths}:${[...removed].sort().join(',')}`
  const checkedOut = checkedKey === stateKey
  const cart = summarizeCart(removed, tenths)
  const overBudget = cart.overByCents > 0
  const jarLevel = checkedOut
    ? Math.max(0, cart.remainingCents) / GROCERY_BUDGET_CENTS
    : 1
  const pantry = mode === 'impact'

  function toggle(id: string) {
    const next = new Set(removed)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setRemoved(next)
  }

  return (
    <ExplorerLayout
      category={category}
      mode={mode}
      onModeChange={onModeChange}
      sceneLabel="Grocery cart and budget jar"
      scene={
        <div className="food-scene">
          <ul className="cart-grid" aria-label="Grocery cart">
            {GROCERY_ITEMS.map((item) => {
              const isRemoved = removed.has(item.id)
              const price = priceAfterIncrease(item.cents, tenths)
              const status = !isRemoved
                ? 'In cart'
                : pantry
                  ? 'From the CAC pantry'
                  : 'Left behind'
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`cart-item${isRemoved ? (pantry ? ' is-pantry' : ' is-removed') : ''}`}
                    aria-pressed={!isRemoved}
                    onClick={() => toggle(item.id)}
                  >
                    <span className="cart-item__name">{item.label}</span>
                    <span className="cart-item__price">
                      {pantry && isRemoved ? usd(0) : usd(price)}
                      {tenths > 0 && !(pantry && isRemoved) && (
                        <small> was {usd(item.cents)}</small>
                      )}
                    </span>
                    <span className="cart-item__status">
                      {!isRemoved && <ExplorerIcon kind="check" size={14} />}
                      {status}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="budget-jar">
            <svg
              viewBox="0 0 120 170"
              role="img"
              aria-label={`Budget jar ${Math.round(jarLevel * 100)} percent full`}
            >
              <rect
                className="jar-lid"
                x="26"
                y="6"
                width="68"
                height="16"
                rx="5"
              />
              <clipPath id="jar-clip">
                <rect x="18" y="26" width="84" height="132" rx="14" />
              </clipPath>
              <g clipPath="url(#jar-clip)">
                <rect
                  className="jar-glass"
                  x="18"
                  y="26"
                  width="84"
                  height="132"
                />
                <rect
                  className="jar-fill"
                  x="18"
                  y="26"
                  width="84"
                  height="132"
                  style={{ transform: `scaleY(${jarLevel})` }}
                />
              </g>
              <rect
                className="jar-outline"
                x="18"
                y="26"
                width="84"
                height="132"
                rx="14"
              />
              <text x="60" y="98" textAnchor="middle" className="jar-text">
                {usd(
                  checkedOut
                    ? Math.max(0, cart.remainingCents)
                    : GROCERY_BUDGET_CENTS,
                )}
              </text>
            </svg>
            <p className="budget-jar__label">
              {checkedOut ? 'Left in your budget' : 'Grocery budget'}
            </p>
          </div>
        </div>
      }
      controls={
        <>
          <RangeField
            label="Grocery price change"
            value={tenths}
            min={0}
            max={150}
            step={1}
            display={`+${formatTenths(tenths)}`}
            onChange={setTenths}
            minLabel="0%"
            maxLabel="15%"
          />
          <ChoiceGroup
            label="Try a price change"
            value={tenths}
            onChange={setTenths}
            options={presets}
          />
          <dl className="cart-totals">
            <div>
              <dt>Same cart now costs</dt>
              <dd>{usd(cart.fullCents)}</dd>
            </div>
            <div>
              <dt>{pantry ? 'You pay' : 'Your cart total'}</dt>
              <dd>{usd(cart.payCents)}</dd>
            </div>
            <div>
              <dt>Budget</dt>
              <dd>{usd(GROCERY_BUDGET_CENTS)}</dd>
            </div>
            {pantry && cart.removedCount > 0 && (
              <div>
                <dt>Covered by the pantry shelf</dt>
                <dd>{usd(cart.pantryCents)}</dd>
              </div>
            )}
          </dl>
          <p
            className={`cart-status${overBudget ? ' is-over' : ''}`}
            role="status"
          >
            {checkedOut
              ? `Checked out: ${usd(cart.payCents)} spent, ${usd(Math.max(0, cart.remainingCents))} left.`
              : overBudget
                ? `Over budget by ${usd(cart.overByCents)}. Remove items to check out.`
                : 'Within budget. Ready to check out.'}
          </p>
          <div className="explorer-actions">
            <button
              type="button"
              className="ui-button ui-button--primary"
              disabled={overBudget || checkedOut}
              onClick={() => setCheckedKey(stateKey)}
            >
              Check out
            </button>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              onClick={() => {
                setRemoved(new Set())
                setCheckedKey(null)
              }}
            >
              Reset cart
            </button>
          </div>
        </>
      }
    />
  )
}
