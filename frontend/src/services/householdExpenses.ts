import { getSupabaseClient } from './supabase'
import { parseUsdCents } from './contentService'
import type { LoadedPlaythrough } from '../types/playthrough'
import type { HouseholdExpenses } from '../types/householdExpenses'

function day(value: unknown): number | null {
  if (value === null) return null
  if (typeof value !== 'number' || !Number.isInteger(value))
    throw new Error('Invalid expense day')
  return value
}
function label(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string') throw new Error('Invalid expense text')
  return value.trim() || null
}

// Reads only. Definitions are not expanded into recurring occurrences or payments.
// Called after the existing owned-playthrough loader verifies the participant.
export async function loadHouseholdExpenses(
  run: LoadedPlaythrough,
): Promise<HouseholdExpenses | null> {
  if (run.versionId === null) return null
  const client = await getSupabaseClient()
  const definitions = await client
    .from('persona_expenses')
    .select('expense_id,name,amount,first_due_day')
    .eq('persona_id', run.personaId)
    .eq('version_id', run.versionId)
  if (definitions.error) throw definitions.error
  const occurrences = await client
    .from('playthrough_expenses')
    .select('playthrough_expense_id,expense_id,due_day,amount_due,paid_at')
    .eq('playthrough_id', run.id)
    .eq('version_id', run.versionId)
  if (occurrences.error) throw occurrences.error
  const names = new Map(
    (definitions.data ?? []).map((row) => [row.expense_id, label(row.name)]),
  )
  if (occurrences.data?.length)
    return {
      source: 'occurrences',
      items: occurrences.data.map((row) => ({
        id: row.playthrough_expense_id,
        name: names.get(row.expense_id) ?? null,
        amount:
          row.amount_due === null
            ? null
            : parseUsdCents(row.amount_due, 'amount_due'),
        dueDay: day(row.due_day),
        paidAt: label(row.paid_at),
      })),
    }
  return {
    source: 'definitions',
    items: (definitions.data ?? []).map((row) => ({
      id: row.expense_id,
      name: label(row.name),
      amount: row.amount === null ? null : parseUsdCents(row.amount, 'amount'),
      dueDay: day(row.first_due_day),
      paidAt: null,
    })),
  }
}
