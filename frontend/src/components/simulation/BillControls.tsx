import type { Bill, BillSnapshot } from '../../services/billGameplay'
import { settlement } from '../../services/billGameplay'
import { formatUsd } from '../../lib/money'
import { Button } from '../ui/Button'

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
  return (
    <li className="bill-row">
      <h3>{bill.name}</h3>
      <p>
        Due Day {bill.dueDay} · {formatUsd(bill.principal)}
      </p>
      {bill.ignoredAt && <p>Late fee: {formatUsd(bill.fee)}</p>}
      {bill.paidAt ? (
        <p role="status">Paid {formatUsd(settlement(bill))}</p>
      ) : bill.ignoredAt && !overdue ? (
        <p role="status">Ignored · {formatUsd(settlement(bill))} outstanding</p>
      ) : (
        <>
          <p>Total to pay: {formatUsd(settlement(bill))}</p>
          {!overdue && (
            <p>Ignoring adds a late fee of {formatUsd(bill.fee)}.</p>
          )}
          <div className="bill-actions">
            <Button
              disabled={busy}
              aria-label={`Pay ${bill.name}`}
              onClick={() => onAction(bill.id, 'pay')}
            >
              Pay
            </Button>
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
          </div>
        </>
      )}
    </li>
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
      <ul className="bill-list">
        {due.map((bill) => (
          <BillRow key={bill.id} bill={bill} onAction={onAction} busy={busy} />
        ))}
      </ul>
      <Button disabled={busy || !resolved} onClick={onContinue}>
        {snapshot.run.currentDay === 30 ? 'Finish Day 30' : 'Continue'}
      </Button>
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
  const active =
    snapshot.run.status === 'active' &&
    (snapshot.run.employmentState as { stage?: string })?.stage === 'day'
  return (
    <section aria-label="Overdue bills">
      <h2>Overdue bills</h2>
      <p>
        Total outstanding: <strong>{formatUsd(snapshot.overdueTotal)}</strong>
      </p>
      {overdue.length ? (
        <ul className="bill-list">
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
      ) : (
        <p>No overdue bills.</p>
      )}
    </section>
  )
}
