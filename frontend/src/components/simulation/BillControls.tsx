import type { Bill, BillSnapshot } from '../../services/billGameplay'
import { useState, useRef, useEffect } from 'react'
import { RadioGroup } from '../ui/RadioGroup'
import { scenarioDescription } from '../../lib/gameplayText'
import { settlement } from '../../services/billGameplay'
import { formatUsd } from '../../lib/money'
import { Button } from '../ui/Button'
import { ExpenseRow } from './ExpenseRow'
import { ScenarioFacts } from './ScenarioFacts'
import { DecisionRecap } from './DecisionRecap'
import { usdCents } from '../../types/domain'

export type BillAction = (id: string, action: 'pay' | 'ignore') => void

function BillDecision({
  bill,
  snapshot,
  onAction,
  busy,
}: {
  bill: Bill
  snapshot: BillSnapshot
  onAction: BillAction
  busy: boolean
}) {
  const [selected, select] = useState<'pay' | 'ignore' | null>(null)
  const sending = useRef(false)
  const wasBusy = useRef(false)
  useEffect(() => {
    if (wasBusy.current && !busy) sending.current = false
    wasBusy.current = busy
  }, [busy])
  const resolved = Boolean(bill.paidAt || bill.ignoredAt)
  return (
    <article className="bill-decision" aria-label={bill.name}>
      <DecisionRecap
        title={bill.name}
        description={
          bill.description
            ? scenarioDescription(
                bill.description,
                snapshot.run.supportEnabled === true,
              )
            : undefined
        }
        day={bill.dueDay}
        receipt={
          resolved
            ? {
                choice: bill.paidAt
                  ? 'Pay the bill'
                  : 'Ignore the bill for now',
                change: bill.paidAt ? usdCents(-settlement(bill)) : usdCents(0),
                balanceAfter: bill.paymentBalanceAfter ?? undefined,
                outstanding:
                  bill.ignoredAt && !bill.paidAt ? settlement(bill) : undefined,
              }
            : undefined
        }
      />
      {!resolved && (
        <p className="bill-decision__due">
          Due Day {bill.dueDay} · {formatUsd(settlement(bill))}
        </p>
      )}
      {!resolved ? (
        <fieldset
          className="employment-controls scenario-choice-controls"
          disabled={busy}
          aria-busy={busy}
        >
          <RadioGroup
            label="Your decision"
            name={`bill-${bill.id}`}
            value={selected}
            onChange={(value) => {
              if (!busy && !sending.current) {
                sending.current = true
                select(value as 'pay' | 'ignore')
                onAction(bill.id, value as 'pay' | 'ignore')
              }
            }}
            options={[
              {
                value: 'pay',
                label: 'Pay the bill',
                description: `Pay ${formatUsd(settlement(bill))} now.`,
                ariaLabel: `Pay ${bill.name}`,
              },
              {
                value: 'ignore',
                label: 'Ignore the bill for now',
                description:
                  bill.fee > 0
                    ? `A late fee of ${formatUsd(bill.fee)} will be added to what you owe.`
                    : 'The bill will remain unpaid.',
                ariaLabel: `Ignore ${bill.name}`,
              },
            ]}
          />
        </fieldset>
      ) : (
        <>
          {snapshot.run.versionId && (
            <ScenarioFacts
              runId={snapshot.run.id}
              scenarioId={`bill:${bill.id}`}
              versionId={snapshot.run.versionId}
              supportEnabled={snapshot.run.supportEnabled === true}
            />
          )}
        </>
      )}
    </article>
  )
}

function BillRow({
  bill,
  onAction,
  busy,
  overdue = false,
}: {
  bill: Bill
  onAction: BillAction
  busy: boolean
  overdue?: boolean
}) {
  const pay = (
    <Button
      disabled={busy}
      aria-label={`Pay ${bill.name}`}
      onClick={() => onAction(bill.id, 'pay')}
    >
      Pay
    </Button>
  )
  const controls = (
    <>
      {pay}
      {!overdue && (
        <Button
          disabled={busy}
          variant="secondary"
          aria-label={`Ignore ${bill.name}`}
          onClick={() => onAction(bill.id, 'ignore')}
        >
          Ignore
        </Button>
      )}
    </>
  )
  const resolved = bill.paidAt || (bill.ignoredAt && !overdue)
  const detail = (
    <>
      {bill.ignoredAt && <small>Late fee: {formatUsd(bill.fee)}</small>}
      {!overdue &&
        (bill.paidAt ? (
          <p role="status">Paid {formatUsd(settlement(bill))}</p>
        ) : bill.ignoredAt ? (
          <p role="status">
            Ignored · {formatUsd(settlement(bill))} outstanding
          </p>
        ) : (
          <small>Ignoring adds a late fee of {formatUsd(bill.fee)}.</small>
        ))}
    </>
  )
  return (
    <ExpenseRow
      name={bill.name}
      dueLabel={`Due Day ${bill.dueDay}`}
      amount={settlement(bill)}
      variant={overdue ? 'overdue' : 'due'}
      detail={detail}
      iconActions={overdue && !resolved ? pay : undefined}
      actions={!overdue && !resolved ? controls : undefined}
    />
  )
}

export function DueBillsPanel({
  snapshot,
  onAction,
  busy,
  onContinue,
}: {
  snapshot: BillSnapshot
  onAction: BillAction
  busy: boolean
  onContinue: () => void
}) {
  const due = snapshot.items.filter((b) => b.dueDay === snapshot.run.currentDay)
  const resolved = due.every((b) => b.paidAt || b.ignoredAt)
  return (
    <section aria-label="Bills due today">
      {due.map((bill) => (
        <BillDecision
          key={bill.id}
          bill={bill}
          snapshot={snapshot}
          onAction={onAction}
          busy={busy}
        />
      ))}
      <div className="scenario-continue">
        {' '}
        <Button disabled={busy || !resolved} onClick={onContinue}>
          {snapshot.run.currentDay === 30
            ? 'Finish Day 30'
            : 'Continue to next day'}
        </Button>
      </div>
    </section>
  )
}

export function OverdueBills({
  snapshot,
  onAction,
  busy,
}: {
  snapshot: BillSnapshot
  onAction: BillAction
  busy: boolean
}) {
  const overdue = snapshot.items.filter((b) => b.ignoredAt && !b.paidAt)
  if (!overdue.length) return null
  const active =
    snapshot.run.status === 'active' &&
    (snapshot.run.employmentState as { stage?: string })?.stage === 'day'
  return (
    <section className="finance-overdue" aria-label="Overdue">
      <h2>Overdue</h2>
      <p>
        Total outstanding: <strong>{formatUsd(snapshot.overdueTotal)}</strong>
      </p>
      <ul className="finance-upcoming">
        {overdue.map((bill) => (
          <BillRow
            key={bill.id}
            bill={bill}
            onAction={onAction}
            busy={busy || !active}
            overdue
          />
        ))}
      </ul>
    </section>
  )
}
