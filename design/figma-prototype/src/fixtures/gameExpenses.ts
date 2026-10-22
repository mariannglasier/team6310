// This shortened client prototype handles expenses through explicit decisions.
export const scheduledExpenses: {
  id: string
  day: number
  label: string
  amount: number
}[] = []

// Display-only reminders. Decisions, not this list, apply any charge.
export const upcomingExpenses = [
  { id: "utilities-30", day: 30, label: "Utility bill", amount: -45 },
]

export const sampleIncome: typeof scheduledExpenses = []
