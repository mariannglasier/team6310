import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { LoadedPlaythrough } from '../../types/playthrough'
import {
  loadBillSnapshot,
  submitBill,
  settlement,
  type BillSnapshot,
} from '../../services/billGameplay'
import {
  employmentSnapshot,
  type CommittedEmployment,
} from '../../services/employmentGameplay'
import { FinancialTracking } from '../../components/simulation/FinancialTracking'
import { EmploymentPanel } from './EmploymentPanel'
import { Button } from '../../components/ui/Button'

export function BillSimulation({
  initialRun,
}: {
  initialRun: LoadedPlaythrough
}) {
  const [saved, setSaved] = useState<{
    bills: BillSnapshot
    employment: CommittedEmployment
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const [employmentBusy, setEmploymentBusy] = useState(false)
  const busy = useRef(false)
  const generation = useRef(0)
  async function accept(bills: BillSnapshot, sequence: number) {
    const employment = await employmentSnapshot(bills.run)
    if (sequence === generation.current) setSaved({ bills, employment })
  }
  async function refresh(run: LoadedPlaythrough) {
    const sequence = ++generation.current
    setLoading(true)
    setError('')
    try {
      await accept(await loadBillSnapshot(run), sequence)
      if (sequence === generation.current) setUncertain(false)
    } catch (cause) {
      if (sequence === generation.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to load saved bills.',
        )
        setUncertain(true)
      }
    } finally {
      if (sequence === generation.current) setLoading(false)
    }
  }
  const restoreInitial = useEffectEvent(() => {
    void refresh(initialRun)
  })
  const invalidate = useEffectEvent(() => {
    generation.current++
  })
  useEffect(() => {
    restoreInitial()
    return () => {
      invalidate()
    }
    // The run locator is fixed for this mounted simulation. Committed refreshes
    // are explicitly requested after operations, never inferred from cash alone.
  }, [initialRun.id])
  async function action(id: string, action: 'pay' | 'ignore') {
    if (!saved || busy.current || loading || uncertain || employmentBusy) return
    busy.current = true
    const sequence = ++generation.current
    setLoading(true)
    setError('')
    try {
      await accept(await submitBill(saved.bills.run, id, action), sequence)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to confirm bill action.',
      )
      try {
        await accept(await loadBillSnapshot(saved.bills.run), sequence)
      } catch {
        setUncertain(true)
      }
    } finally {
      if (sequence === generation.current) setLoading(false)
      busy.current = false
    }
  }
  const run = saved?.bills.run ?? initialRun
  const expenseState = saved
    ? {
        status: 'ready' as const,
        data: {
          source: 'occurrences' as const,
          items: saved.bills.items
            .filter(
              (b) => b.paidAt || b.dueDay > (saved.employment.state?.day ?? 0),
            )
            .map((b) => ({
              id: b.id,
              name: b.name,
              amount: b.paidAt ? settlement(b) : b.principal,
              dueDay: b.dueDay,
              paidAt: b.paidAt,
            })),
        },
      }
    : { status: 'loading' as const }
  return (
    <FinancialTracking
      run={run}
      expenses={expenseState}
      bills={saved?.bills}
      employment={saved?.employment.state ?? undefined}
      onBillAction={(id, type) => void action(id, type)}
      billBusy={loading || uncertain || employmentBusy}
      pregame={!saved?.employment.state || saved.employment.state.day === 0}
    >
      {error && <p role="alert">{error}</p>}
      {uncertain && (
        <Button
          disabled={loading}
          onClick={() => {
            setError('')
            void refresh(run)
          }}
        >
          Reload saved bills
        </Button>
      )}
      {!saved ? (
        <p role="status">
          {loading
            ? 'Loading your bills and progress…'
            : 'Your saved bills could not be loaded. Use Reload saved bills to retry.'}
        </p>
      ) : (
        <EmploymentPanel
          run={run}
          bills={saved.bills}
          billBusy={loading || uncertain}
          onBillAction={(id, type) => void action(id, type)}
          onPendingChange={setEmploymentBusy}
          onCommit={(snapshot) => {
            void refresh(snapshot.run)
          }}
        />
      )}
    </FinancialTracking>
  )
}
