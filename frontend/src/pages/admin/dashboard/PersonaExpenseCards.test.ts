import { expect, test } from 'vitest'
import { chronologicalExpenses } from './personaExpenses'
import type { CmsExpenseInput } from '../../../services/cms'
const base: CmsExpenseInput = {
  expense_id: 'a',
  persona_id: 'p',
  version_id: 'v',
  name: 'Rent',
  amount: '1',
  late_fee_amount: '0',
  first_due_day: 6,
  repeat_interval_days: null,
}
test('expense order is chronological, then name, then stable identity; invalid new days sort last', () => {
  const input: CmsExpenseInput[] = [
    base,
    { ...base, expense_id: 'z', name: 'Alpha' },
    { ...base, expense_id: 'b' },
    { ...base, expense_id: 'early', first_due_day: 2 },
    {
      ...base,
      expense_id: null,
      client_key: 'new',
      name: '',
      first_due_day: '',
    },
  ]
  expect(
    chronologicalExpenses(input).map((e) => e.expense_id ?? e.client_key),
  ).toEqual(['early', 'z', 'a', 'b', 'new'])
  expect(input[0]).toBe(base)
})
