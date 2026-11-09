import { useState } from 'react'
import { externalLinks } from '../../../app/externalLinks'
import {
  BUDGET_ESSENTIALS_CENTS,
  BUDGET_INCOME_CENTS,
  BUDGET_STEP_CENTS,
  EMPTY_ALLOCATION,
  adjustAllocation,
  planBudget,
  usd,
  type Allocation,
} from './dataExplorerLogic'
import {
  ChoiceGroup,
  ExplorerIcon,
  ExplorerLayout,
  RangeField,
  type VizProps,
} from './ExplorerParts'

type View = 'budget' | 'tax'

const allocationRows: { key: keyof Allocation; label: string }[] = [
  { key: 'save', label: 'Save' },
  { key: 'bills', label: 'Pay bills' },
  { key: 'setAside', label: 'Set aside' },
]

const taxSteps = [
  'Gather income forms such as a W-2 or 1099',
  'Check which credits you may qualify for',
  'File with free help',
]

function Jar({
  label,
  cents,
  tone,
  gap,
}: {
  label: string
  cents: number
  tone: string
  gap?: number
}) {
  const coins = Math.min(8, Math.round(cents / BUDGET_STEP_CENTS))
  return (
    <g className={`jar jar--${tone}`}>
      <rect className="jar__lid" x="14" y="6" width="68" height="14" rx="5" />
      <rect
        className="jar__glass"
        x="8"
        y="22"
        width="80"
        height="104"
        rx="14"
      />
      {Array.from({ length: coins }, (_, i) => (
        <ellipse
          key={i}
          className="jar__coin"
          cx="48"
          cy={116 - i * 11}
          rx="26"
          ry="6"
        />
      ))}
      <rect
        className="jar__label"
        x="22"
        y="64"
        width="52"
        height="22"
        rx="3"
      />
      <text x="48" y="79" textAnchor="middle" className="jar__text">
        {label}
      </text>
      {gap !== undefined && gap > 0 && (
        <g className="jar__gap">
          <rect x="-4" y="-34" width="104" height="26" rx="13" />
          <text x="48" y="-16" textAnchor="middle">
            {usd(gap)} gap
          </text>
        </g>
      )}
    </g>
  )
}

export function FinanceViz({ category, mode, onModeChange }: VizProps) {
  const [view, setView] = useState<View>('budget')
  const [emergency, setEmergency] = useState(20_000)
  const [allocation, setAllocation] = useState<Allocation>(EMPTY_ALLOCATION)
  const [steps, setSteps] = useState<ReadonlySet<number>>(new Set())

  const plan = planBudget(emergency, allocation)
  const covered = plan.gapCents === 0 && emergency > 0
  const impact = mode === 'impact'

  function nudge(key: keyof Allocation, delta: number) {
    setAllocation((current) => adjustAllocation(current, key, delta))
  }
  function toggleStep(index: number) {
    const next = new Set(steps)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSteps(next)
  }

  return (
    <ExplorerLayout
      category={category}
      mode={mode}
      onModeChange={onModeChange}
      sceneLabel={
        view === 'budget' ? 'Budget jars and emergency cost' : 'Tax checklist'
      }
      scene={
        view === 'budget' ? (
          <div className="finance-scene">
            <dl className="finance-summary">
              <div>
                <dt>Income</dt>
                <dd>{usd(BUDGET_INCOME_CENTS)}</dd>
              </div>
              <div>
                <dt>Essentials</dt>
                <dd>{usd(BUDGET_ESSENTIALS_CENTS)}</dd>
              </div>
              <div className="is-highlight">
                <dt>Left to plan</dt>
                <dd>{usd(plan.unallocatedCents)}</dd>
              </div>
            </dl>
            <svg
              className="jars"
              viewBox="0 -44 420 190"
              role="img"
              aria-label={`Jars: ${usd(allocation.bills)} toward bills, ${usd(allocation.setAside)} set aside, ${usd(allocation.save)} in emergency savings. Emergency cost ${usd(emergency)}. ${covered ? 'The emergency is covered.' : `${usd(plan.gapCents)} still needed.`}`}
            >
              <g transform="translate(6 0)">
                <Jar label="Bills" cents={allocation.bills} tone="bills" />
              </g>
              <g transform="translate(116 0)">
                <Jar
                  label="Set aside"
                  cents={allocation.setAside}
                  tone="aside"
                />
              </g>
              <g transform="translate(226 0)">
                <Jar
                  label="Emergency"
                  cents={allocation.save}
                  tone="emergency"
                  gap={plan.gapCents}
                />
              </g>
              <g className="receipt" transform="translate(334 8)">
                <path d="M0 0h72v108l-12-8-12 8-12-8-12 8-12-8-12 8Z" />
                <text x="36" y="34" textAnchor="middle">
                  Unexpected
                </text>
                <text x="36" y="50" textAnchor="middle">
                  cost
                </text>
                <text
                  x="36"
                  y="82"
                  textAnchor="middle"
                  className="receipt__amount"
                >
                  {usd(emergency)}
                </text>
              </g>
            </svg>
            <p className="scene-readout" role="status">
              <strong>
                {covered
                  ? 'The emergency is covered.'
                  : emergency === 0
                    ? 'No unexpected cost to cover.'
                    : `${usd(plan.gapCents)} still needed for the emergency.`}
              </strong>{' '}
              {usd(allocation.save)} saved · {usd(allocation.bills)} toward
              bills · {usd(allocation.setAside)} set aside
            </p>
            {impact && (
              <p className="scene-note">
                With coaching, the same plan is made before the surprise
                arrives.
              </p>
            )}
          </div>
        ) : (
          <div className="finance-scene">
            <ol className="tax-steps">
              {taxSteps.map((text, index) => (
                <li key={text}>
                  <button
                    type="button"
                    className="tax-step"
                    aria-pressed={steps.has(index)}
                    onClick={() => toggleStep(index)}
                  >
                    <span className="tax-step__box" aria-hidden="true">
                      {steps.has(index) && (
                        <ExplorerIcon kind="check" size={16} />
                      )}
                    </span>
                    {text}
                  </button>
                </li>
              ))}
            </ol>
            <div className="job-scene__meter" aria-hidden="true">
              <span
                style={{ width: `${(steps.size / taxSteps.length) * 100}%` }}
              />
            </div>
            <p className="scene-readout" role="status">
              <strong>
                {steps.size} of {taxSteps.length} steps ready.
              </strong>{' '}
              {impact
                ? 'Free preparation support from CAC can help with each step.'
                : 'Tick each step as you go.'}
            </p>
          </div>
        )
      }
      controls={
        <>
          <ChoiceGroup
            label="Workbench"
            value={view}
            onChange={setView}
            options={[
              { value: 'budget', label: 'Budgeting' },
              { value: 'tax', label: 'Tax preparation' },
            ]}
          />
          {view === 'budget' ? (
            <>
              <RangeField
                label="Emergency cost"
                value={emergency}
                min={0}
                max={50_000}
                step={BUDGET_STEP_CENTS}
                display={usd(emergency)}
                onChange={setEmergency}
                minLabel="$0"
                maxLabel="$500"
              />
              <div className="allocate">
                <p className="choice-group__label">
                  Allocate your {usd(plan.leftCents)}
                </p>
                {allocationRows.map(({ key, label }) => (
                  <div className="allocate__row" key={key}>
                    <span id={`allocate-${key}`}>{label}</span>
                    <button
                      type="button"
                      className="allocate__step"
                      aria-label={`Decrease ${label}`}
                      disabled={allocation[key] === 0}
                      onClick={() => nudge(key, -BUDGET_STEP_CENTS)}
                    >
                      −
                    </button>
                    <output aria-labelledby={`allocate-${key}`}>
                      {usd(allocation[key])}
                    </output>
                    <button
                      type="button"
                      className="allocate__step"
                      aria-label={`Increase ${label}`}
                      disabled={plan.unallocatedCents < BUDGET_STEP_CENTS}
                      onClick={() => nudge(key, BUDGET_STEP_CENTS)}
                    >
                      +
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="ui-button ui-button--secondary"
                  onClick={() => setAllocation(EMPTY_ALLOCATION)}
                >
                  Clear allocations
                </button>
              </div>
            </>
          ) : null}
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
