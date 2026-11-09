import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { FinancialTracking } from './FinancialTracking'
import type { LoadedPlaythrough } from '../../types/playthrough'
import type { ExpenseState } from '../../types/householdExpenses'
import { usdCents } from '../../types/domain'
import { createWalkthrough } from '../../state/employmentWalkthrough'
import type { BillSnapshot } from '../../services/billGameplay'
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
it('derives exact totals and future paydays from the committed history without counting projected bills', () => {
  const employment = {
    ...createWalkthrough(
      {
        id: 'p',
        versionId: 'v',
        name: 'Alex',
        description: '',
        startingBalance: usdCents(35000),
        hasEnglishSkills: false,
        hasComputerSkills: false,
      },
      [],
      false,
      usdCents(6000),
    ),
    day: 17,
    hiredDay: 3,
    balance: usdCents(109000),
    weeklyIncome: usdCents(40000),
    history: [
      { day: 2, text: 'Clothes', change: usdCents(-6000) },
      { day: 10, text: 'Pay', change: usdCents(40000) },
      { day: 17, text: 'Pay', change: usdCents(40000) },
    ],
  }
  render(
    <FinancialTracking
      run={{ ...run, currentBalance: employment.balance, currentDay: 17 }}
      expenses={expenses}
      employment={employment}
    >
      Today's scenario
    </FinancialTracking>,
  )
  const totals = screen.getByRole('complementary', {
    name: 'Household and balance',
  })
  expect(within(totals).getByText('$350.00')).toBeInTheDocument()
  expect(within(totals).getByText('$800.00')).toBeInTheDocument()
  expect(within(totals).getByText('$60.00')).toBeInTheDocument()
  expect(screen.getAllByRole('img', { name: /^Payday on Day/ })).toHaveLength(1)
  expect(
    screen.getByLabelText('Payday on Day 24').parentElement,
  ).toHaveTextContent(/^\$$/)
  expect(
    screen.getByText(/CAC enrollment status: not a client/),
  ).toBeInTheDocument()
})
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

it('counts settled bills once in cash flow and keeps unpaid obligations out of cash deductions', () => {
  const employment = {
    ...createWalkthrough(
      {
        id: 'p',
        versionId: 'v',
        name: 'Alex',
        description: '',
        startingBalance: usdCents(35000),
        hasEnglishSkills: false,
        hasComputerSkills: false,
      },
      [],
      false,
      usdCents(6000),
    ),
    balance: usdCents(44000),
    history: [{ day: 9, text: 'Pay', change: usdCents(20000) }],
  }
  const bills = {
    paidTotal: usdCents(10500),
    outstandingTotal: usdCents(5000),
    scenarioIncome: usdCents(0),
    scenarioCharged: usdCents(500),
  } as BillSnapshot
  render(
    <FinancialTracking
      run={{ ...run, currentBalance: employment.balance }}
      employment={employment}
      bills={bills}
      expenses={{ status: 'ready', data: { source: 'occurrences', items: [] } }}
    >
      Decision
    </FinancialTracking>,
  )
  const sidebar = screen.getByRole('complementary', {
    name: 'Household and balance',
  })
  expect(within(sidebar).getByText('$440.00')).toBeInTheDocument()
  expect(within(sidebar).getByText('$350.00')).toBeInTheDocument()
  expect(within(sidebar).getByText('$110.00')).toBeInTheDocument()
  expect(within(sidebar).queryByText('$50.00')).not.toBeInTheDocument()
  expect(screen.queryByText('Unpaid obligations')).not.toBeInTheDocument()
  expect(
    screen.queryByText('Upcoming scheduled expenses'),
  ).not.toBeInTheDocument()
  expect(screen.queryByText(/Shown for planning/)).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Coming up' })).toBeInTheDocument()
})
