import type { ReactNode } from 'react'
import { formatUsd } from '../../lib/money'
import type { UsdCents } from '../../types/domain'

// Shared Coming Up presentation, including its existing calendar graphic.
export function ExpenseRow({
  name,
  dueLabel,
  amount,
  detail,
  actions,
  iconActions,
  variant,
}: {
  name: string
  dueLabel: string
  amount: UsdCents | null
  detail?: ReactNode
  actions?: ReactNode
  iconActions?: ReactNode
  variant?: 'due' | 'overdue'
}) {
  return (
    <li
      className={`finance-expense-row${variant ? ` finance-expense--${variant}` : ''}`}
    >
      <span className="finance-expense-leading">
        {variant !== 'overdue' && (
          <span className="finance-bill-icon">
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
          </span>
        )}
        {iconActions}
      </span>
      <div className="finance-expense-details">
        {variant !== 'overdue' && <small>{dueLabel}</small>}
        <strong>{name}</strong>
        {detail}
      </div>
      <span className="finance-expense-amount">
        {amount === null ? 'Amount unavailable' : formatUsd(amount)}
      </span>
      {actions && <div className="bill-actions">{actions}</div>}
    </li>
  )
}
