import { beforeEach, expect, it, vi } from 'vitest'
import { loadBillSnapshot, submitBill } from './billGameplay'
import { getSupabaseClient } from './supabase'
import { participantId } from './employmentGameplay'
import type { LoadedPlaythrough } from '../types/playthrough'
vi.mock('./supabase', () => ({ getSupabaseClient: vi.fn() }))
vi.mock('./employmentGameplay', () => ({ participantId: vi.fn() }))
const expected = {
  id: 'run',
  personaId: 'persona',
  versionId: 'edition',
} as LoadedPlaythrough
const rpc = vi.fn()
const raw = () => ({
  run: {
    playthrough_id: 'run',
    persona_id: 'persona',
    version_id: 'edition',
    owner_user_id: 'owner',
    session_id: null,
    status: 'active',
    current_day: 2,
    current_balance: '50.00',
    current_scenario_id: null,
    current_job_id: null,
    cac_support_enabledabled: false,
    employment_state: { stage: 'day', revision: 1 },
  },
  bills: [
    {
      playthrough_expense_id: 'bill',
      playthrough_id: 'run',
      version_id: 'edition',
      name_snapshot: 'Fixture bill',
      description:
        'A car repair completed before the month has a bill due today.',
      due_day: 2,
      amount_due: '10.00',
      late_fee_amount: '2.00',
      ignored_at: null as string | null,
      paid_at: null as string | null,
      paid_day: null as number | null,
      paid_with_cac: false,
      payment_balance_after: null as string | null,
    },
  ],
  paid_total: '0.00',
  overdue_total: '0.00',
  outstanding_total: '10.00',
  upcoming_total: '0.00',
  scenario_income: '0.00',
  scenario_charged: '0.00',
})
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(participantId).mockResolvedValue('owner')
  vi.mocked(getSupabaseClient).mockResolvedValue({ rpc } as unknown as Awaited<
    ReturnType<typeof getSupabaseClient>
  >)
  rpc.mockResolvedValue({ data: raw(), error: null })
})
it('restores one exact financial snapshot without creating or submitting anything', async () => {
  const result = await loadBillSnapshot(expected)
  expect(result.run.currentBalance).toBe(5000)
  expect(result.items[0].principal).toBe(1000)
  expect(result.items[0].fee).toBe(200)
  expect(result.items[0].description).toBe(
    'A car repair completed before the month has a bill due today.',
  )
  expect(rpc).toHaveBeenCalledExactlyOnceWith('get_bill_snapshot', {
    p_run_id: 'run',
  })
})
it('sends only identifiers and restores commitment after Ignore', async () => {
  const value = raw()
  value.bills[0] = {
    ...value.bills[0],
    ignored_at: '2026-11-08T12:01:00Z',
  } as (typeof value.bills)[0]
  value.overdue_total = '12.00'
  value.outstanding_total = '12.00'
  rpc
    .mockResolvedValueOnce({ data: {}, error: null })
    .mockResolvedValueOnce({ data: value, error: null })
  const result = await submitBill(expected, 'bill', 'ignore')
  expect(result.overdueTotal).toBe(1200)
  expect(result.run.currentBalance).toBe(5000)
  expect(rpc).toHaveBeenNthCalledWith(1, 'ignore_bill', {
    p_run_id: 'run',
    p_occurrence_id: 'bill',
  })
  expect(rpc).toHaveBeenCalledTimes(2)
})
it('reports insufficient funds without calling any ending operation', async () => {
  rpc.mockResolvedValue({
    data: null,
    error: {
      code: 'P0001',
      message: 'Insufficient funds to pay this bill in full',
    },
  })
  await expect(submitBill(expected, 'bill', 'pay')).rejects.toThrow(
    'You can Ignore',
  )
  expect(rpc).toHaveBeenCalledExactlyOnceWith('pay_bill', {
    p_run_id: 'run',
    p_occurrence_id: 'bill',
  })
})

it('excludes CAC settlements and their late fees from household spending', async () => {
  const value = raw()
  value.run.cac_support_enabledabled = true
  value.bills = [
    {
      ...value.bills[0],
      ignored_at: '2026-11-08T12:01:00Z',
      paid_at: '2026-11-08T12:02:00Z',
      paid_day: 2,
      payment_balance_after: '50.00',
      paid_with_cac: true,
    },
  ]
  value.paid_total = '12.00'
  rpc
    .mockResolvedValueOnce({ data: {}, error: null })
    .mockResolvedValueOnce({ data: value, error: null })
  const result = await submitBill(expected, 'bill', 'cac')
  expect(rpc).toHaveBeenNthCalledWith(1, 'pay_bill_with_cac', {
    p_run_id: 'run',
    p_occurrence_id: 'bill',
  })
  expect(result.items[0].paidWithCac).toBe(true)
  expect(result.run.currentBalance).toBe(5000)
  expect(result.paidTotal).toBe(0)
})

it('restores an initialized empty schedule without falling back to definitions', async () => {
  const value = raw()
  value.bills = []
  value.outstanding_total = '0.00'
  rpc.mockResolvedValue({ data: value, error: null })
  const result = await loadBillSnapshot(expected)
  expect(result.items).toEqual([])
  expect(rpc).toHaveBeenCalledOnce()
})
it.each(['owner', 'edition', 'duplicate', 'money'])(
  'rejects malformed or mismatched %s data',
  async (kind) => {
    const value = raw()
    if (kind === 'owner') value.run.owner_user_id = 'other'
    if (kind === 'edition') value.bills[0].version_id = 'other'
    if (kind === 'duplicate') value.bills.push({ ...value.bills[0] })
    if (kind === 'money') value.bills[0].amount_due = '10.001'
    rpc.mockResolvedValue({ data: value, error: null })
    await expect(loadBillSnapshot(expected)).rejects.toThrow()
  },
)
