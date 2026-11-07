import { beforeEach, expect, it, vi } from 'vitest'
import { loadHouseholdExpenses } from './householdExpenses'
import { getSupabaseClient } from './supabase'
import type { LoadedPlaythrough } from '../types/playthrough'
vi.mock('./supabase', () => ({ getSupabaseClient: vi.fn() }))
const run = {
  id: 'run',
  personaId: 'household',
  versionId: 'pinned',
} as LoadedPlaythrough
let data: Record<string, { data: unknown[] | null; error: unknown }>
let calls: Record<string, unknown[][]>
beforeEach(() => {
  vi.resetAllMocks()
  data = {
    persona_expenses: {
      data: [
        {
          expense_id: 'rent',
          name: 'Rent',
          amount: '500.00',
          first_due_day: 4,
        },
      ],
      error: null,
    },
    playthrough_expenses: { data: [], error: null },
  }
  calls = {}
  vi.mocked(getSupabaseClient).mockResolvedValue({
    from: (table: string) => {
      calls[table] = []
      const query = {
        select: () => query,
        eq: (...args: unknown[]) => {
          calls[table].push(args)
          return query
        },
        then: (resolve: (result: unknown) => void) =>
          Promise.resolve(data[table]).then(resolve),
      }
      return query
    },
  } as unknown as Awaited<ReturnType<typeof getSupabaseClient>>)
})
it('reads the household schedule from the pinned edition without generating occurrences', async () => {
  await expect(loadHouseholdExpenses(run)).resolves.toEqual({
    source: 'definitions',
    items: [
      { id: 'rent', name: 'Rent', amount: 50000, dueDay: 4, paidAt: null },
    ],
  })
  expect(calls.persona_expenses).toEqual([
    ['persona_id', 'household'],
    ['version_id', 'pinned'],
  ])
  expect(calls.playthrough_expenses).toEqual([
    ['playthrough_id', 'run'],
    ['version_id', 'pinned'],
  ])
})
it('uses actual occurrence amounts and payment records instead of definition amounts', async () => {
  data.playthrough_expenses.data = [
    {
      playthrough_expense_id: 'bill',
      expense_id: 'rent',
      amount_due: '420.25',
      due_day: 12,
      paid_at: '2026-10-30T12:00:00Z',
    },
  ]
  await expect(loadHouseholdExpenses(run)).resolves.toMatchObject({
    source: 'occurrences',
    items: [
      {
        name: 'Rent',
        amount: 42025,
        dueDay: 12,
        paidAt: '2026-10-30T12:00:00Z',
      },
    ],
  })
})
it('preserves missing values and does not invent a name for unmatched occurrences', async () => {
  data.playthrough_expenses.data = [
    {
      playthrough_expense_id: 'bill',
      expense_id: 'unknown',
      amount_due: null,
      due_day: null,
      paid_at: null,
    },
  ]
  await expect(loadHouseholdExpenses(run)).resolves.toMatchObject({
    items: [{ name: null, amount: null, dueDay: null, paidAt: null }],
  })
})
it.each(['persona_expenses', 'playthrough_expenses'])(
  'rejects unavailable %s instead of showing mock data',
  async (table) => {
    data[table] = { data: null, error: new Error('read failed') }
    await expect(loadHouseholdExpenses(run)).rejects.toThrow('read failed')
  },
)
it('does not fetch an unspecified edition', async () => {
  await expect(
    loadHouseholdExpenses({ ...run, versionId: null }),
  ).resolves.toBeNull()
  expect(getSupabaseClient).not.toHaveBeenCalled()
})
