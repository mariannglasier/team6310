import type { CmsExpenseInput } from '../../../services/cms'

export const expenseKey = (expense: CmsExpenseInput) =>
  expense.expense_id ?? expense.client_key!
export function chronologicalExpenses(expenses: readonly CmsExpenseInput[]) {
  const day = (expense: CmsExpenseInput) =>
    /^[0-9]+$/.test(String(expense.first_due_day)) &&
    Number(expense.first_due_day) > 0
      ? Number(expense.first_due_day)
      : Infinity
  return [...expenses].sort((a, b) => {
    const first = day(a),
      second = day(b)
    return (
      (first === second ? 0 : first - second) ||
      a.name.localeCompare(b.name, 'en') ||
      expenseKey(a).localeCompare(expenseKey(b), 'en')
    )
  })
}
