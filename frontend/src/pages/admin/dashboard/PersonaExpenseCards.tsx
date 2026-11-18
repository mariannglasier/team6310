import { FieldInfo } from '../../../components/ui/FieldInfo'
import { DeleteControl } from '../../../components/ui/DeleteControl'
import { TextField, SelectField } from '../../../components/ui/FormFields'
import type { CmsExpenseInput } from '../../../services/cms'

import { expenseKey, chronologicalExpenses } from './personaExpenses'

// Presentation only: all state and persistence belong to the enclosing Persona form.
export function PersonaExpenseCards({
  expenses,
  onChange,
  onRemove,
  linked,
}: {
  expenses: CmsExpenseInput[]
  onChange: (expenses: CmsExpenseInput[]) => void
  onRemove: (expense: CmsExpenseInput) => void
  linked: ReadonlySet<string>
}) {
  const update = (key: string, patch: Partial<CmsExpenseInput>) =>
    onChange(
      expenses.map((e) => (expenseKey(e) === key ? { ...e, ...patch } : e)),
    )
  return (
    <>
      {chronologicalExpenses(expenses).map((expense) => {
        const key = expenseKey(expense)
        const label = expense.name || 'New expense'
        return (
          <article
            className="admin-card cms-expense"
            key={key}
            data-expense-key={key}
          >
            <DeleteControl
              className="cms-expense-remove"
              label={`Remove expense ${label}`}
              onClick={() => onRemove(expense)}
            />
            <details
              onInvalidCapture={(e) => {
                e.currentTarget.open = true
              }}
            >
              <summary>
                <strong>{label}</strong>{' '}
                <span className="admin-muted">
                  {expense.amount === ''
                    ? 'Amount not set'
                    : `$${expense.amount}`}{' '}
                  ·{' '}
                  {expense.first_due_day === ''
                    ? 'Day not set'
                    : `Day ${expense.first_due_day}`}{' '}
                  ·{' '}
                  {expense.repeat_interval_days === null
                    ? 'One time'
                    : expense.repeat_interval_days === ''
                      ? 'Repeat interval not set'
                      : `Every ${expense.repeat_interval_days} days`}
                  {expense.late_fee_amount !== ''
                    ? ` · Late fee $${expense.late_fee_amount}`
                    : ' · Late fee not set'}
                </span>
              </summary>
              <div className="cms-editor-fields">
                <TextField
                  label="Expense name"
                  value={expense.name}
                  required
                  onChange={(e) => update(key, { name: e.target.value })}
                />
                <div className="cms-inline">
                  <TextField
                    label="Expense amount (USD)"
                    labelAction={
                      <FieldInfo
                        label="Expense amount (USD)"
                        text="Principal charged per occurrence, not a monthly total. Enter a nonnegative exact USD amount with at most two decimal places. It is not deducted when the definition is saved."
                      />
                    }
                    inputMode="decimal"
                    required
                    value={expense.amount}
                    onChange={(e) => update(key, { amount: e.target.value })}
                  />
                  <TextField
                    label="Fixed late fee (USD)"
                    labelAction={
                      <FieldInfo
                        label="Fixed late fee (USD)"
                        text="In individual gameplay, a fixed fee is incurred once for an occurrence when the player chooses Ignore. Ignore does not immediately deduct cash; later full settlement includes principal plus the incurred fee. Enter an explicit amount, including zero when appropriate. This is not a percentage or recurring interest."
                      />
                    }
                    inputMode="decimal"
                    required
                    value={expense.late_fee_amount}
                    onChange={(e) =>
                      update(key, { late_fee_amount: e.target.value })
                    }
                  />
                  <TextField
                    label="First due day"
                    labelAction={
                      <FieldInfo
                        label="First due day"
                        text="The simulation day of the first occurrence. For a repeating expense, subsequent occurrences are spaced from this day by the repeat interval. Days 1–32767 are accepted; a first day after 30 generates no occurrences in the 30-day run."
                      />
                    }
                    type="number"
                    min="1"
                    max="32767"
                    step="1"
                    required
                    value={expense.first_due_day}
                    onChange={(e) =>
                      update(key, { first_due_day: e.target.value })
                    }
                  />
                </div>
                <div className="cms-inline">
                  <SelectField
                    label="Expense recurrence"
                    labelAction={
                      <FieldInfo
                        label="Expense recurrence"
                        text="One time creates a single occurrence on the first due day, stored with a NULL repeat interval. Repeating creates occurrences starting on that day and spaced by the positive repeat interval, through Day 30."
                      />
                    }
                    value={
                      expense.repeat_interval_days === null ? 'once' : 'repeat'
                    }
                    onChange={(e) =>
                      update(key, {
                        repeat_interval_days:
                          e.target.value === 'once' ? null : '',
                      })
                    }
                  >
                    <option value="once">One time</option>
                    <option value="repeat">Repeating</option>
                  </SelectField>
                  {expense.repeat_interval_days !== null && (
                    <TextField
                      label="Repeat interval (days)"
                      labelAction={
                        <FieldInfo
                          label="Repeat interval (days)"
                          text="The number of days between successive occurrences, not the first due date. Enter a positive whole number from 1 to 32767. For example, first due day 3 and interval 7 gives days 3, 10, 17 and 24; occurrences after Day 30 are omitted."
                        />
                      }
                      type="number"
                      min="1"
                      max="32767"
                      step="1"
                      required
                      value={expense.repeat_interval_days}
                      onChange={(e) =>
                        update(key, { repeat_interval_days: e.target.value })
                      }
                    />
                  )}
                </div>
                {Number(expense.first_due_day) > 30 && (
                  <p className="admin-muted">
                    No occurrences within Days 1–30.
                  </p>
                )}
                {expense.expense_id && linked.has(expense.expense_id) && (
                  <p className="admin-muted">
                    Linked to a bill recap. The reference is preserved; this
                    expense cannot be removed while linked.
                  </p>
                )}
              </div>
            </details>
          </article>
        )
      })}
      {!expenses.length && (
        <p>No scheduled expenses are stored for this persona.</p>
      )}
    </>
  )
}
