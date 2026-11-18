import { formatUsd } from '../../lib/money'
import { usdCents, type UsdCents } from '../../types/domain'
import './decisionRecap.css'
import { useEffect, useRef } from 'react'

export function DecisionRecap({
  title,
  description,
  day,
  receipt,
  outcome,
}: {
  title: string
  description?: string
  day: number
  receipt?: {
    choice: string
    change: UsdCents
    balanceAfter?: UsdCents
    outstanding?: UsdCents
  }
  outcome?: string | null
}) {
  const amount = receipt?.change ?? usdCents(0)
  const heading = useRef<HTMLHeadingElement>(null)
  const saved = Boolean(receipt)
  useEffect(() => {
    if (saved) heading.current?.focus({ preventScroll: true })
  }, [saved])
  const label =
    amount < 0
      ? 'Charged to your balance'
      : amount > 0
        ? 'Added to your balance'
        : 'No change to your balance'
  return (
    <div
      className={`decision-summary${receipt ? ' decision-summary--saved' : ''}`}
    >
      <div className="decision-summary__story">
        {receipt && (
          <p className="decision-summary__eyebrow">Your decision · Day {day}</p>
        )}
        <h2 ref={heading} tabIndex={saved ? -1 : undefined}>
          {title}
        </h2>
        {description && <p>{description}</p>}
        {receipt && (
          <>
            {outcome && <p className="decision-summary__outcome">{outcome}</p>}
            <div className="decision-summary__change">
              <strong>
                {amount > 0 ? '+' : ''}
                {formatUsd(amount)}
              </strong>
              <span>{label}</span>
            </div>
          </>
        )}
      </div>
      {receipt && (
        <aside className="decision-receipt" aria-label="Decision receipt">
          <svg
            aria-hidden="true"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
          >
            <path d="M39 14H13a5 5 0 0 1 0-10h25v7M8 10v28a5 5 0 0 0 5 5h27V14M40 23H29v11h11M33 28h2" />
          </svg>
          <h3>Receipt</h3>
          <p>Day {day}</p>
          <p className="decision-receipt__choice">{receipt.choice}</p>
          <dl>
            <div>
              <dt>
                {amount < 0
                  ? 'CHARGED'
                  : amount > 0
                    ? 'CREDITED'
                    : 'CASH CHANGE'}
              </dt>
              <dd>
                {amount > 0 ? '+' : ''}
                {formatUsd(amount)}
              </dd>
            </div>
            {receipt.outstanding !== undefined && (
              <div>
                <dt>STILL OWED</dt>
                <dd>{formatUsd(receipt.outstanding)}</dd>
              </div>
            )}
            {receipt.balanceAfter !== undefined && (
              <div className="decision-receipt__balance">
                <dt>BALANCE AFTER</dt>
                <dd>{formatUsd(receipt.balanceAfter)}</dd>
              </div>
            )}
          </dl>
          <span className="decision-receipt__saved">Decision saved</span>
        </aside>
      )}
    </div>
  )
}
