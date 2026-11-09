import type { Bill, BillSnapshot } from '../../services/billGameplay'
import { settlement } from '../../services/billGameplay'
import { formatUsd } from '../../lib/money'
import { Button } from '../ui/Button'
import { ExpenseRow } from './ExpenseRow'
import { ScenarioFacts } from './ScenarioFacts'

export type BillAction = (id: string, action: 'pay' | 'ignore') => void

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
      <h2>Your household bills</h2>
      <ul className="finance-upcoming">
        {due.map((bill) => (
          <BillRow key={bill.id} bill={bill} onAction={onAction} busy={busy} />
        ))}
      </ul>
      {resolved &&
        snapshot.run.versionId &&
        due.map((bill) => (
          <ScenarioFacts
            key={bill.id}
            runId={snapshot.run.id}
            scenarioId={`bill:${bill.id}`}
            versionId={snapshot.run.versionId!}
            supportEnabled={snapshot.run.supportEnabled === true}
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
