import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { DecisionRecap } from './DecisionRecap'
import { usdCents } from '../../types/domain'
it('uses the committed signed change and balance in its receipt', () => {
  render(
    <DecisionRecap
      title="Groceries"
      day={3}
      description="Your groceries are ready."
      receipt={{
        choice: 'Buy groceries',
        change: usdCents(-6000),
        balanceAfter: usdCents(94000),
      }}
    />,
  )
  const receipt = screen.getByLabelText('Decision receipt')
  expect(within(receipt).getByText('-$60.00')).toBeVisible()
  expect(within(receipt).getByText('$940.00')).toBeVisible()
  expect(screen.getByText('Charged to your balance')).toBeVisible()
})
it('keeps unpaid debt separate from cash deductions', () => {
  render(
    <DecisionRecap
      title="Rent"
      day={6}
      receipt={{
        choice: 'Ignore the bill for now',
        change: usdCents(0),
        outstanding: usdCents(81899),
      }}
    />,
  )
  expect(screen.getByText('No change to your balance')).toBeVisible()
  expect(
    within(screen.getByLabelText('Decision receipt')).getByText('STILL OWED'),
  ).toBeVisible()
  expect(screen.queryByText('-$818.99')).toBeNull()
})
