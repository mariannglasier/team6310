import type { ReactNode } from 'react'
import type { LoadedPlaythrough } from '../../types/playthrough'
import type {
  ExpenseState,
  HouseholdExpense,
} from '../../types/householdExpenses'
import { formatUsd } from '../../lib/money'
import { PersonaAvatar } from './PersonaAvatar'
import './financialTracking.css'

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4m8-4v4M4 10h16m-12 4h3m2 0h3" />
    </svg>
  )
}
function ExpenseList({
  items,
  definitions,
}: {
  items: readonly HouseholdExpense[]
  definitions: boolean
}) {
  const ordered = [...items].sort(
    (a, b) =>
      (a.dueDay ?? Infinity) - (b.dueDay ?? Infinity) ||
      a.id.localeCompare(b.id),
  )
  return (
    <ul className="finance-upcoming">
      {ordered.map((expense) => (
        <li key={expense.id}>
          <span className="finance-bill-icon">
            <CalendarIcon />
          </span>
          <div>
            <small>
              {expense.dueDay === null
                ? 'Due date unavailable'
                : `${definitions ? 'First due' : 'Due'} Day ${expense.dueDay}`}
            </small>
            <strong>{expense.name ?? 'Expense name unavailable'}</strong>
            <small>
              {definitions
                ? 'Payment status unavailable'
                : expense.paidAt
                  ? 'Paid'
                  : 'No payment recorded'}
            </small>
          </div>
          <span className="finance-expense-amount">
            {expense.amount === null
              ? 'Amount unavailable'
              : formatUsd(expense.amount)}
          </span>
        </li>
      ))}
    </ul>
  )
}

// Pure presentation: balance/day come directly from the existing loaded run.
export function FinancialTracking({
  run,
  expenses,
  children,
}: {
  run: LoadedPlaythrough
  expenses: ExpenseState
  children: ReactNode
}) {
  const unpaid =
    expenses.status === 'ready'
      ? expenses.data.items.filter((item) => !item.paidAt)
      : []
  const paid =
    expenses.status === 'ready'
      ? expenses.data.items.filter((item) => item.paidAt)
      : []
  const definitions =
    expenses.status === 'ready' && expenses.data.source === 'definitions'
  return (
    <div className="financial-tracking">
      <div className="finance-top" aria-live="polite">
        <strong>
          {run.currentDay === null
            ? 'Current day unavailable'
            : `Day ${run.currentDay} of 30`}
        </strong>
        <span>One choice at a time.</span>
        <span className="finance-mobile-balance">
          Current balance:{' '}
          {run.currentBalance === null
            ? 'Unavailable'
            : formatUsd(run.currentBalance)}
        </span>
      </div>
      <ol className="finance-timeline" aria-label="30-day month progress">
        {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => (
          <li
            key={day}
            aria-current={run.currentDay === day ? 'step' : undefined}
            className={
              run.currentDay !== null && day < run.currentDay
                ? 'finance-earlier'
                : undefined
            }
          >
            <span>{day}</span>
          </li>
        ))}
      </ol>
      <div className="finance-layout">
        <aside className="finance-sidebar" aria-label="Household and balance">
          <section className="finance-household">
            <span className="finance-label">Your household</span>
            {run.persona && (
              <div className="finance-avatar">
                <PersonaAvatar name={run.persona.name} />
              </div>
            )}
            <h2>{run.persona?.name ?? 'Household unavailable'}</h2>
            <small>Status: {run.status ?? 'Unavailable'}</small>
          </section>
          <section className="finance-money" aria-label="Current balance">
            <span className="finance-label">Current balance</span>
            <strong className="finance-balance" aria-live="polite">
              {run.currentBalance === null
                ? 'Unavailable'
                : formatUsd(run.currentBalance)}
            </strong>
            <dl className="finance-totals">
              <div>
                <dt>Starting balance</dt>
                <dd>Unavailable</dd>
              </div>
              <div>
                <dt>Total income received</dt>
                <dd>Unavailable</dd>
              </div>
              <div>
                <dt>Total expenses charged</dt>
                <dd>Unavailable</dd>
              </div>
            </dl>
          </section>
        </aside>
        <div className="finance-main">{children}</div>
        <aside
          className="finance-right"
          aria-label="Upcoming household expenses"
        >
          <h2>Coming up</h2>
          <p className="finance-subtitle">Upcoming scheduled expenses</p>
          {expenses.status === 'loading' && (
            <p role="status">Loading household expenses…</p>
          )}
          {expenses.status === 'unavailable' && (
            <p role="status">Household expenses are unavailable.</p>
          )}
          {expenses.status === 'ready' && (
            <>
              {definitions && (
                <p className="finance-source">
                  Household schedule · First due dates only. Individual expense
                  occurrences are not available.
                </p>
              )}
              {unpaid.length ? (
                <ExpenseList items={unpaid} definitions={definitions} />
              ) : (
                <p>
                  No{' '}
                  {definitions
                    ? 'household expense definitions'
                    : 'unpaid expense occurrences'}{' '}
                  are available.
                </p>
              )}
              {paid.length > 0 && (
                <>
                  <h3>Recorded payments</h3>
                  <ExpenseList items={paid} definitions={false} />
                </>
              )}
              <small>
                Shown for planning. Displaying an expense does not deduct money.
              </small>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
