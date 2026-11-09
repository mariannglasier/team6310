import type { ReactNode } from 'react'
import type { Walkthrough } from '../../state/employmentWalkthrough'
import type { LoadedPlaythrough } from '../../types/playthrough'
import type {
  ExpenseState,
  HouseholdExpense,
} from '../../types/householdExpenses'
import { formatUsd } from '../../lib/money'
import { PersonaAvatar } from './PersonaAvatar'
import { BalanceDisplay } from './BalanceDisplay'
import { usdCents, type UsdCents } from '../../types/domain'
import './financialTracking.css'
import type { BillSnapshot } from '../../services/billGameplay'
import { OverdueBills, type BillAction } from './BillControls'
import { ExpenseRow } from './ExpenseRow'

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
        <ExpenseRow
          key={expense.id}
          name={expense.name ?? 'Expense name unavailable'}
          amount={expense.amount}
          dueLabel={
            expense.dueDay === null
              ? 'Due date unavailable'
              : `${definitions ? 'First due' : 'Due'} Day ${expense.dueDay}`
          }
          detail={
            <small>
              {definitions
                ? 'Payment status unavailable'
                : expense.paidAt
                  ? 'Paid'
                  : 'No payment recorded'}
            </small>
          }
        />
      ))}
    </ul>
  )
}

// Pure presentation: retains confirmed run values alongside any explicit local overlay.
export function FinancialTracking({
  run,
  expenses,
  children,
  preview,
  employment,
  pregame = false,
  scenarioChanges = [],
  bills,
  onBillAction,
  billBusy = false,
}: {
  run: LoadedPlaythrough
  expenses: ExpenseState
  children: ReactNode
  scenarioChanges?: readonly UsdCents[] | null
  bills?: BillSnapshot | null
  onBillAction?: BillAction
  billBusy?: boolean
  pregame?: boolean
  preview?: Walkthrough
  employment?: Walkthrough
}) {
  const committed =
    employment?.balance === run.currentBalance ? employment : undefined
  const displayDay = committed?.day ?? preview?.day ?? run.currentDay
  const displayBalance =
    committed?.balance ?? preview?.balance ?? run.currentBalance
  const history = committed?.history
  const income =
    history && (bills || scenarioChanges)
      ? usdCents(
          history.reduce((sum, entry) => sum + Math.max(0, entry.change), 0) +
            (bills
              ? bills.scenarioIncome
              : scenarioChanges!.reduce(
                  (sum, change) => sum + Math.max(0, change),
                  0,
                )),
        )
      : null
  const charged =
    history && (bills || scenarioChanges)
      ? usdCents(
          history.reduce((sum, entry) => sum + Math.max(0, -entry.change), 0) +
            (bills
              ? bills.scenarioCharged
              : scenarioChanges!.reduce(
                  (sum, change) => sum + Math.max(0, -change),
                  0,
                )) +
            (bills?.paidTotal ?? 0),
        )
      : null
  const starting =
    committed && income !== null && charged !== null
      ? usdCents(committed.balance - income + charged)
      : null
  const lastPay = history?.findLast((entry) => entry.change > 0)
  const employed =
    committed?.hiredDay !== null && committed?.hiredDay !== undefined
  const job = employed
    ? committed.jobs.find((item) => item.job.id === committed.targetId)?.job
    : undefined
  const support = committed?.support ?? run.supportEnabled
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
    <div
      className={`financial-tracking${preview || run.employmentState ? ' financial-tracking--preview' : ''}`}
    >
      <div className="sr-only" aria-live="polite">
        <div>
          <h1 id="page-heading" tabIndex={-1}>
            {pregame || preview?.day === 0
              ? 'Before Day 1'
              : displayDay === null
                ? 'Current day unavailable'
                : `Day ${displayDay} of 30`}
          </h1>
        </div>
      </div>
      <ol className="finance-timeline" aria-label="30-day month progress">
        {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => {
          const payday =
            committed?.hiredDay != null &&
            day > (displayDay ?? 0) &&
            day > committed.hiredDay &&
            (day - committed.hiredDay) % 7 === 0
          return (
            <li
              key={day}
              aria-current={displayDay === day ? 'step' : undefined}
              className={
                displayDay !== null && day < displayDay
                  ? 'finance-earlier'
                  : undefined
              }
            >
              <span className={payday ? 'finance-payday-circle' : undefined}>
                {payday ? (
                  <i
                    className="finance-payday"
                    role="img"
                    aria-label={`Payday on Day ${day}`}
                  >
                    $
                  </i>
                ) : (
                  day
                )}
              </span>
            </li>
          )
        })}
      </ol>
      <div className="finance-layout">
        <aside className="finance-sidebar" aria-label="Household and balance">
          <section className="finance-household">
            <span className="finance-label">Your household</span>
            <div className="finance-household-profile">
              {run.persona && (
                <div className="finance-avatar">
                  <PersonaAvatar name={run.persona.name} />
                </div>
              )}
              <h2>{run.persona?.name ?? 'Household unavailable'}</h2>
            </div>
            <small>
              Employment:{' '}
              {committed
                ? employed
                  ? (job?.title ?? 'Job unavailable')
                  : 'Not employed'
                : 'Unavailable'}
            </small>
            <small className="finance-profile-detail">
              Weekly income:{' '}
              {committed ? formatUsd(committed.weeklyIncome) : 'Unavailable'}
            </small>
            <small className="finance-profile-detail">
              CAC enrollment status:{' '}
              {support === null
                ? 'Unavailable'
                : support
                  ? 'client of the CAC'
                  : 'not a client'}
            </small>
          </section>
          <section className="finance-money" aria-label="Current balance">
            <span className="finance-label">
              {preview ? 'Provisional balance · not saved' : 'Current balance'}
            </span>
            <BalanceDisplay
              key={run.id}
              balance={displayBalance}
              incomeKey={
                lastPay && lastPay.day === committed?.day
                  ? `${run.id}:${lastPay.day}`
                  : undefined
              }
              income={committed?.weeklyIncome ?? usdCents(0)}
            />
            {preview && (
              <p className="finance-confirmed">
                Server-confirmed balance:{' '}
                {run.currentBalance === null
                  ? 'Unavailable'
                  : formatUsd(run.currentBalance)}
                . Day {run.currentDay ?? 'unavailable'}. Gameplay progress is
                local only.
              </p>
            )}
            <dl className="finance-totals">
              <div>
                <dt>Starting balance</dt>
                <dd>
                  {starting === null ? 'Unavailable' : formatUsd(starting)}
                </dd>
              </div>
              <div>
                <dt>Total income received</dt>
                <dd>{income === null ? 'Unavailable' : formatUsd(income)}</dd>
              </div>
              <div>
                <dt>Total expenses charged</dt>
                <dd>{charged === null ? 'Unavailable' : formatUsd(charged)}</dd>
              </div>
            </dl>
          </section>
        </aside>
        <div className="finance-main stage__panel">
          <div className="finance-content">{children}</div>
        </div>
        <aside
          className="finance-right"
          aria-label="Upcoming household expenses"
        >
          {bills && onBillAction && (
            <OverdueBills
              snapshot={bills}
              onAction={onBillAction}
              busy={billBusy}
            />
          )}
          <section>
            <h2>Coming up</h2>
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
                    Household schedule · First due dates only. Individual
                    expense occurrences are not available.
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
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
