import { getSupabaseClient } from './supabase'
import { parseUsdCents } from './contentService'
import { participantId } from './employmentGameplay'
import type { LoadedPlaythrough } from '../types/playthrough'
import { usdCents, type UsdCents } from '../types/domain'

export interface Bill {
  id: string
  name: string
  principal: UsdCents
  fee: UsdCents
  dueDay: number
  ignoredAt: string | null
  paidAt: string | null
  paymentBalanceAfter: UsdCents | null
}
export interface BillSnapshot {
  run: LoadedPlaythrough
  items: readonly Bill[]
  paidTotal: UsdCents
  overdueTotal: UsdCents
  outstandingTotal: UsdCents
  upcomingTotal: UsdCents
  scenarioIncome: UsdCents
  scenarioCharged: UsdCents
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid saved bill data')
  return value as Record<string, unknown>
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error('Invalid saved bill text')
  return value
}
function timestamp(value: unknown): string | null {
  if (value === null) return null
  const result = text(value)
  if (!Number.isFinite(Date.parse(result)))
    throw new Error('Invalid bill timestamp')
  return result
}
function money(value: unknown): UsdCents {
  const result = parseUsdCents(value, 'bill amount')
  if (result < 0) throw new Error('Invalid negative bill amount')
  return result
}
export function settlement(bill: Bill): UsdCents {
  return usdCents(bill.principal + (bill.ignoredAt ? bill.fee : 0))
}
export async function loadBillSnapshot(
  expected: LoadedPlaythrough,
): Promise<BillSnapshot> {
  const owner = await participantId()
  const client = await getSupabaseClient()
  const { data, error } = await client.rpc('get_bill_snapshot', {
    p_run_id: expected.id,
  })
  if (error || !data)
    throw new Error(
      'Unable to restore saved bills. Retry to load your progress.',
    )
  const value = object(data)
  const r = object(value.run)
  if (
    r.playthrough_id !== expected.id ||
    r.owner_user_id !== owner ||
    r.persona_id !== expected.personaId ||
    r.version_id !== expected.versionId ||
    r.session_id !== null ||
    !['active', 'ended', 'completed'].includes(String(r.status)) ||
    !Number.isInteger(r.current_day) ||
    Number(r.current_day) < 1 ||
    Number(r.current_day) > 30 ||
    (r.cac_support_enabledabled !== null &&
      typeof r.cac_support_enabledabled !== 'boolean') ||
    !Array.isArray(value.bills)
  )
    throw new Error('Unexpected saved bill snapshot')
  const ids = new Set<string>()
  const items = value.bills.map((item: unknown): Bill => {
    const b = object(item)
    const id = text(b.playthrough_expense_id)
    if (
      ids.has(id) ||
      b.playthrough_id !== expected.id ||
      b.version_id !== expected.versionId ||
      !Number.isInteger(b.due_day) ||
      Number(b.due_day) < 1 ||
      Number(b.due_day) > 30
    )
      throw new Error('Unexpected saved bill occurrence')
    ids.add(id)
    const paidAt = timestamp(b.paid_at)
    const ignoredAt = timestamp(b.ignored_at)
    if (
      paidAt &&
      (!Number.isInteger(b.paid_day) ||
        Number(b.paid_day) < Number(b.due_day) ||
        Number(b.paid_day) > 30 ||
        b.payment_balance_after === null)
    )
      throw new Error('Invalid bill payment')
    if (!paidAt && (b.paid_day !== null || b.payment_balance_after !== null))
      throw new Error('Invalid bill payment')
    return {
      id,
      name: text(b.name_snapshot),
      principal: money(b.amount_due),
      fee: money(b.late_fee_amount),
      dueDay: Number(b.due_day),
      ignoredAt,
      paidAt,
      paymentBalanceAfter: paidAt ? money(b.payment_balance_after) : null,
    }
  })
  return {
    run: {
      ...expected,
      currentBalance: money(r.current_balance),
      currentDay: Number(r.current_day),
      status: String(r.status),
      currentScenarioId:
        r.current_scenario_id === null ? null : text(r.current_scenario_id),
      currentJobId: r.current_job_id === null ? null : text(r.current_job_id),
      supportEnabled: r.cac_support_enabledabled as boolean | null,
      employmentState: r.employment_state,
    },
    items,
    paidTotal: money(value.paid_total),
    overdueTotal: money(value.overdue_total),
    outstandingTotal: money(value.outstanding_total),
    upcomingTotal: money(value.upcoming_total),
    scenarioIncome: money(value.scenario_income),
    scenarioCharged: money(value.scenario_charged),
  }
}
export async function submitBill(
  run: LoadedPlaythrough,
  id: string,
  action: 'pay' | 'ignore',
) {
  const client = await getSupabaseClient()
  const { error } = await client.rpc(
    action === 'pay' ? 'pay_bill' : 'ignore_bill',
    {
      p_run_id: run.id,
      p_occurrence_id: id,
    },
  )
  if (error) {
    if (error.code === 'P0001' && error.message.includes('Insufficient funds'))
      throw new Error(
        'There is not enough money to pay this bill in full. You can Ignore it for now.',
      )
    throw new Error(
      'Payment or Ignore was not confirmed. Reload saved bills before retrying.',
    )
  }
  return loadBillSnapshot(run)
}
