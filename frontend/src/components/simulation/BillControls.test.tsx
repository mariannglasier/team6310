import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { DueBillsPanel, OverdueBills } from './BillControls'
import { usdCents } from '../../types/domain'
import type { Bill, BillSnapshot } from '../../services/billGameplay'
const bill: Bill = {
  id: 'rent',
  name: 'Fixture rent',
  principal: usdCents(10000),
  fee: usdCents(500),
  dueDay: 2,
  ignoredAt: null,
  paidAt: null,
  paymentBalanceAfter: null,
}
const snapshot: BillSnapshot = {
  run: {
    id: 'run',
    personaId: 'p',
    versionId: 'v',
    ownerUserId: 'owner',
    currentDay: 2,
    currentBalance: usdCents(10000),
    status: 'active',
    employmentState: { stage: 'day' },
    currentScenarioId: null,
    currentJobId: null,
    sessionId: null,
    startedAt: null,
    supportEnabled: false,
    persona: null,
  },
  items: [bill, { ...bill, id: 'utility', name: 'Fixture utility' }],
  overdueTotal: usdCents(0),
  paidTotal: usdCents(0),
  outstandingTotal: usdCents(20000),
  upcomingTotal: usdCents(0),
  scenarioIncome: usdCents(0),
  scenarioCharged: usdCents(0),
}
it('keeps simultaneous bills independent and prevents departure before each is resolved', async () => {
  const action = vi.fn(),
    next = vi.fn()
  const { rerender } = render(
    <DueBillsPanel
      snapshot={snapshot}
      onAction={action}
      busy={false}
      onContinue={next}
    />,
  )
  await userEvent.click(
    screen.getByRole('button', { name: 'Ignore Fixture rent' }),
  )
  expect(action).toHaveBeenCalledWith('rent', 'ignore')
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  rerender(
    <DueBillsPanel
      snapshot={{
        ...snapshot,
        items: [{ ...bill, ignoredAt: '2026-11-08' }, snapshot.items[1]],
      }}
      onAction={action}
      busy={false}
      onContinue={next}
    />,
  )
  expect(screen.getByRole('status')).toHaveTextContent('$105.00 outstanding')
  await userEvent.click(
    screen.getByRole('button', { name: 'Pay Fixture utility' }),
  )
  expect(action).toHaveBeenLastCalledWith('utility', 'pay')
  rerender(
    <DueBillsPanel
      snapshot={{
        ...snapshot,
        items: [
          { ...bill, ignoredAt: '2026-11-08' },
          { ...snapshot.items[1], paidAt: '2026-11-08' },
        ],
      }}
      onAction={action}
      busy={false}
      onContinue={next}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
  expect(next).toHaveBeenCalledOnce()
})
it('shows full overdue settlements and disables payment outside the playable day stage', () => {
  const overdue = {
    ...snapshot,
    items: [{ ...bill, ignoredAt: '2026-11-08' }],
    overdueTotal: usdCents(10500),
  }
  const { rerender } = render(
    <OverdueBills snapshot={overdue} onAction={vi.fn()} busy={false} />,
  )
  expect(screen.getByText('Late fee: $5.00')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Pay Fixture rent' })).toBeEnabled()
  rerender(
    <OverdueBills
      snapshot={{ ...overdue, run: { ...overdue.run, status: 'completed' } }}
      onAction={vi.fn()}
      busy={false}
    />,
  )
  expect(
    within(screen.getByRole('region', { name: 'Overdue' })).getByRole('button'),
  ).toBeDisabled()
  expect(
    screen.queryByRole('button', { name: /Ignore/ }),
  ).not.toBeInTheDocument()
})

it('hides the entire Overdue section when no unpaid ignored bills remain', () => {
  const { rerender } = render(
    <OverdueBills snapshot={snapshot} onAction={vi.fn()} busy={false} />,
  )
  expect(
    screen.queryByRole('region', { name: 'Overdue' }),
  ).not.toBeInTheDocument()
  rerender(
    <OverdueBills
      snapshot={{ ...snapshot, items: [{ ...bill, ignoredAt: '2026-11-08' }] }}
      onAction={vi.fn()}
      busy={false}
    />,
  )
  const section = screen.getByRole('region', { name: 'Overdue' })
  expect(
    within(section).getByRole('heading', { name: 'Overdue' }),
  ).toBeInTheDocument()
  expect(section.querySelector('.finance-bill-icon svg')).toBeInTheDocument()
  expect(section.querySelector('.finance-expense-amount')).toHaveTextContent(
    '$105.00',
  )
  expect(
    within(section).queryByText(
      /No payment recorded|Payment status|Recorded payments/,
    ),
  ).not.toBeInTheDocument()
  rerender(
    <OverdueBills
      snapshot={{
        ...snapshot,
        items: [{ ...bill, ignoredAt: '2026-11-08', paidAt: '2026-11-09' }],
      }}
      onAction={vi.fn()}
      busy={false}
    />,
  )
  expect(
    screen.queryByRole('region', { name: 'Overdue' }),
  ).not.toBeInTheDocument()
})

it('supports keyboard payment and prevents repeated activation while saving', async () => {
  const action = vi.fn(),
    user = userEvent.setup()
  const { rerender } = render(
    <DueBillsPanel
      snapshot={snapshot}
      onAction={action}
      busy={false}
      onContinue={vi.fn()}
    />,
  )
  await user.tab()
  expect(screen.getByRole('button', { name: 'Pay Fixture rent' })).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(action).toHaveBeenCalledExactlyOnceWith('rent', 'pay')
  rerender(
    <DueBillsPanel
      snapshot={snapshot}
      onAction={action}
      busy={true}
      onContinue={vi.fn()}
    />,
  )
  await user.keyboard('{Enter}')
  expect(action).toHaveBeenCalledOnce()
})
