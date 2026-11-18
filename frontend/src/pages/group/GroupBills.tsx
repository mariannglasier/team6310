import { Button } from '../../components/ui/Button'
import type {
  BillChoice,
  GroupBill,
  GroupBillReceipt,
  GroupBillRound,
  GroupSession,
  GroupUpcomingBill,
} from '../../services/groupSessionService'
import { formatVoteTally } from './voteTally'

const dollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})
const money = (value: string | number) => dollars.format(Number(value))

function projectedBills(session: GroupSession): GroupUpcomingBill[] {
  if (session.upcomingBills) return session.upcomingBills
  const occurrences: GroupUpcomingBill[] = []
  for (const expense of session.sharedExpenses ?? []) {
    const interval = expense.repeatIntervalDays ?? 31
    if (
      !Number.isInteger(interval) ||
      interval <= 0 ||
      !Number.isInteger(expense.firstDueDay) ||
      expense.firstDueDay < 1
    )
      continue
    for (
      let day = expense.firstDueDay;
      day <= session.totalDayCount;
      day += interval
    ) {
      if (day >= session.currentDay) {
        occurrences.push({
          billId: `${expense.expenseId}:${day}`,
          name: expense.name,
          amount: expense.amount,
          dueDay: day,
        })
      }
    }
  }
  return occurrences
    .sort((a, b) => a.dueDay - b.dueDay || a.name.localeCompare(b.name))
    .slice(0, 3)
}

export function GroupUpcomingExpenses({ session }: { session: GroupSession }) {
  const upcoming = projectedBills(session)
  if (!upcoming.length) return null
  return (
    <div className="group-shared-expenses">
      <h3>Shared upcoming expenses</h3>
      <ul>
        {upcoming.map((expense) => (
          <li key={expense.billId}>
            <span>{expense.name}</span>
            <strong>{money(expense.amount)}</strong>
            <small>Day {expense.dueDay}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function GroupBillBallot({
  bill,
  acceptingVotes,
  onVote,
  currentDay,
}: {
  bill: GroupBillRound
  acceptingVotes: boolean
  onVote?: (choice: BillChoice) => void
  currentDay: number
}) {
  const overdue = bill.dueDay < currentDay
  return (
    <>
      <h1 id="page-heading">{bill.name}</h1>
      <p>
        Due Day {bill.dueDay} · {money(bill.total)} to pay in full
      </p>
      {overdue && (
        <p>
          {money(bill.principal)} bill + {money(bill.lateFee)} late fee
        </p>
      )}
      <div className="employment-choices">
        {(['pay', 'ignore'] as const).map((choice) => {
          const votes = choice === 'pay' ? bill.payVotes : bill.ignoreVotes
          const label = choice === 'pay' ? 'Pay bill' : 'Ignore bill'
          const selected = Boolean(onVote) && bill.selectedChoice === choice
          const optionLabel = (
            <>
              {label}
              {selected && (
                <span className="employment-selected"> · Selected</span>
              )}
            </>
          )
          return (
            <div className="employment-choice" key={choice}>
              {onVote && votes === null ? (
                <Button
                  variant="secondary"
                  className="group-vote-option"
                  disabled={!acceptingVotes}
                  aria-pressed={selected}
                  onClick={() => onVote(choice)}
                >
                  {optionLabel}
                </Button>
              ) : (
                <strong>{optionLabel}</strong>
              )}
              <span>
                {votes !== null
                  ? formatVoteTally(votes, bill.voteCount)
                  : choice === 'pay'
                    ? money(bill.total)
                    : overdue
                      ? 'Leave unpaid'
                      : `${money(bill.lateFee)} late fee`}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}

export function GroupBillResults({
  bills,
}: {
  bills: readonly GroupBillReceipt[]
}) {
  return (
    <>
      <h1 id="page-heading">Today’s bills are resolved.</h1>
      <ul>
        {bills.map((bill) => (
          <li key={bill.billId}>
            {bill.name} · {bill.paid ? 'Paid' : 'Unpaid'} · {money(bill.total)}
          </li>
        ))}
      </ul>
    </>
  )
}

export function GroupOverdueBills({
  bills,
  busy,
  onOpen,
}: {
  bills: readonly GroupBill[]
  busy: boolean
  onOpen: (billId: string) => void
}) {
  if (!bills.length) return null
  return (
    <section aria-label="Overdue bills">
      <h2>Overdue bills</h2>
      <ul>
        {bills.map((bill) => (
          <li key={bill.billId}>
            <span>
              {bill.name} · Day {bill.dueDay} · {money(bill.total)}{' '}
            </span>
            <Button
              variant="text"
              disabled={busy}
              aria-label={`Open vote for ${bill.name}, due Day ${bill.dueDay}`}
              onClick={() => onOpen(bill.billId)}
            >
              Open vote
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
