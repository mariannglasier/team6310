import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { FinancialTracking } from './FinancialTracking'
import type { LoadedPlaythrough } from '../../types/playthrough'
import type { ExpenseState } from '../../types/householdExpenses'
import { usdCents } from '../../types/domain'
const run = {
  id: 'run',
  currentBalance: usdCents(35000),
  currentDay: 2,
  status: 'active',
  persona: { name: 'Alex' },
} as LoadedPlaythrough
const expenses: ExpenseState = {
  status: 'ready',
  data: {
    source: 'definitions',
    items: [
      {
        id: 'late',
        name: 'Utilities',
        amount: usdCents(7500),
        dueDay: 14,
        paidAt: null,
      },
      { id: 'unknown', name: null, amount: null, dueDay: null, paidAt: null },
      {
        id: 'early',
        name: 'Rent',
        amount: usdCents(50000),
        dueDay: 4,
        paidAt: null,
      },
    ],
  },
}
it('renders balance/day and sorts definitions without claiming generated or paid occurrences', () => {
  render(
    <FinancialTracking run={run} expenses={expenses}>
      Placeholder
    </FinancialTracking>,
  )
  expect(screen.getByText('$350.00')).toBeInTheDocument()
  expect(screen.getByText('Day 2 of 30')).toBeInTheDocument()
  const list = within(
    screen.getByRole('complementary', { name: 'Upcoming household expenses' }),
  ).getByRole('list')
  const rows = within(list).getAllByRole('listitem')
  expect(rows[0]).toHaveTextContent(
    'First due Day 4RentPayment status unavailable$500.00',
  )
  expect(rows[1]).toHaveTextContent('Day 14Utilities')
  expect(rows[2]).toHaveTextContent('Due date unavailable')
  expect(
    screen.getByText(/Individual expense occurrences are not available/),
  ).toBeInTheDocument()
  expect(screen.queryByText(/^Paid$/)).not.toBeInTheDocument()
})
it('updates directly from changed run and expense props without retaining old finances', () => {
  const { rerender } = render(
    <FinancialTracking run={run} expenses={expenses}>
      Placeholder
    </FinancialTracking>,
  )
  rerender(
    <FinancialTracking
      run={{ ...run, currentBalance: usdCents(20000), currentDay: 4 }}
      expenses={{
        status: 'ready',
        data: {
          source: 'occurrences',
          items: [
            {
              id: 'bill',
              name: 'Rent',
              amount: usdCents(50000),
              dueDay: 4,
              paidAt: '2026-10-30',
            },
          ],
        },
      }}
    >
      Placeholder
    </FinancialTracking>,
  )
  expect(screen.queryByText('$350.00')).not.toBeInTheDocument()
  expect(screen.getByText('$200.00')).toBeInTheDocument()
  expect(screen.getByText('Day 4 of 30')).toBeInTheDocument()
  expect(screen.getByText('Paid')).toBeInTheDocument()
  expect(screen.queryByText(/First due/)).not.toBeInTheDocument()
  expect(screen.queryByText(/Household schedule/)).not.toBeInTheDocument()
})
it('shows missing and failed expense data without substituting mock values', () => {
  render(
    <FinancialTracking
      run={{ ...run, currentBalance: null, currentDay: null, persona: null }}
      expenses={{ status: 'unavailable' }}
    >
      Placeholder
    </FinancialTracking>,
  )
  expect(screen.getByText('Current day unavailable')).toBeInTheDocument()
  expect(screen.getByText('Household unavailable')).toBeInTheDocument()
  expect(
    screen.getByText('Household expenses are unavailable.'),
  ).toBeInTheDocument()
  expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
})
it('handles an empty saved schedule distinctly from a request failure', () => {
  render(
    <FinancialTracking
      run={run}
      expenses={{ status: 'ready', data: { source: 'definitions', items: [] } }}
    >
      Placeholder
    </FinancialTracking>,
  )
  expect(
    screen.getByText('No household expense definitions are available.'),
  ).toBeInTheDocument()
})
