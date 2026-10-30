import type { UsdCents } from './domain'

export interface HouseholdExpense {
  readonly id: string
  readonly name: string | null
  readonly amount: UsdCents | null
  readonly dueDay: number | null
  readonly paidAt: string | null
}
export type HouseholdExpenses =
  | {
      readonly source: 'occurrences'
      readonly items: readonly HouseholdExpense[]
    }
  | {
      readonly source: 'definitions'
      readonly items: readonly HouseholdExpense[]
    }
export type ExpenseState =
  | { readonly status: 'loading' }
  | { readonly status: 'unavailable' }
  | { readonly status: 'ready'; readonly data: HouseholdExpenses }
