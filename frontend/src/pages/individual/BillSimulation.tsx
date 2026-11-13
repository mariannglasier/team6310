import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import type { LoadedPlaythrough } from '../../types/playthrough'
import {
  loadBillSnapshot,
  submitBill,
  settlement,
  type BillSnapshot,
} from '../../services/billGameplay'
import {
  employmentSnapshot,
  MissingEmploymentMarkerError,
  UnsupportedEmploymentDocumentError,
  type CommittedEmployment,
  submitEmployment,
  hasPending,
} from '../../services/employmentGameplay'
import { FinancialTracking } from '../../components/simulation/FinancialTracking'
import { EmploymentPanel } from './EmploymentPanel'
import { Button } from '../../components/ui/Button'
import { PlaythroughRecovery } from './PlaythroughRecovery'
import { Dialog } from '../../components/ui/Dialog'
import { SimulationResult } from '../../components/simulation/SimulationResult'
import {
  SimulationMutationContext,
  type MutationSource,
} from '../../state/simulationMutation'
import { useSetup } from '../../state/setupContext'
import { paths } from '../../app/paths'

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
  const [recoverable, setRecoverable] = useState(false)
  const [confirmation, setConfirmation] = useState(false)
  const [ending, setEnding] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [pendingRequest, setPendingRequest] = useState(false)
  const [unresolved, setUnresolved] = useState(false)
  const { replay } = useSetup()
  const navigate = useNavigate()
  const busy = useRef(false)
  const endingRef = useRef(false)
  const loadingRef = useRef(true)
  const focusResult = useCallback((node: HTMLHeadingElement | null) => {
    if (node) {
      node.focus({ preventScroll: true })
      document.title = 'Simulation ended early. | CAC Poverty Simulation'
    }
  }, [])
  const uncertainties = useRef({
    employment: false,
    scenario: false,
    financial: false,
  })
  const markUncertain = useCallback(
    (source: MutationSource, value: boolean) => {
      uncertainties.current[source] = value
      setUnresolved(Object.values(uncertainties.current).some(Boolean))
    },
    [],
  )
  const begin = useCallback((reconcile = false) => {
    if (
      busy.current ||
      loadingRef.current ||
      (!reconcile && Object.values(uncertainties.current).some(Boolean))
    )
      return false
    busy.current = true
    setMutating(true)
    return true
  }, [])
  const finish = useCallback(() => {
    busy.current = false
    setMutating(false)
  }, [])
  const generation = useRef(0)
  async function accept(bills: BillSnapshot, sequence: number) {
    const employment = await employmentSnapshot(bills.run)
    const pending = await hasPending(bills.run.id)
    if (sequence === generation.current) {
      setSaved({ bills, employment })
      setPendingRequest(pending)
      markUncertain('employment', pending)
    }
  }
  async function refresh(run: LoadedPlaythrough) {
    const sequence = ++generation.current
    setLoading(true)
    loadingRef.current = true
    setError('')
    setRecoverable(false)
    try {
      await accept(await loadBillSnapshot(run), sequence)
      if (sequence === generation.current) {
        setUncertain(false)
        markUncertain('financial', false)
      }
    } catch (cause) {
      if (sequence === generation.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to load saved bills.',
        )
        setUncertain(true)
        markUncertain('financial', true)
        setRecoverable(
          cause instanceof MissingEmploymentMarkerError ||
            cause instanceof UnsupportedEmploymentDocumentError,
        )
      }
    } finally {
      if (sequence === generation.current) {
        setLoading(false)
        loadingRef.current = false
      }
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
    if (!saved || !begin()) return
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
        markUncertain('financial', true)
      }
    } finally {
      if (sequence === generation.current) setLoading(false)
      finish()
    }
  }
  async function end(retry = false) {
    if (!saved || endingRef.current) return
    if (
      !retry &&
      (loadingRef.current || Object.values(uncertainties.current).some(Boolean))
    )
      return
    if (retry && !begin(true)) return
    endingRef.current = true
    setEnding(true)
    setError('')
    try {
      const value = await submitEmployment(
        saved.bills.run,
        saved.employment.revision,
        { type: 'end' },
        retry,
      )
      await refresh(value.run)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to confirm Give Up. Reconcile your saved progress before continuing.',
      )
      // Retain the existing persisted request and recover the authoritative run.
      // If the response was lost, its receipt is reconciled using the same ID.
      await refresh(saved.bills.run)
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to confirm Give Up. Reconcile your saved progress before continuing.',
      )
    } finally {
      setConfirmation(false)
      setEnding(false)
      endingRef.current = false
      finish()
    }
  }
  async function replayBeforeEmployment() {
    if (!saved || !begin()) return
    try {
      await replay(false, saved.bills.run)
      navigate(paths.individual)
    } catch {
      setError(
        'Unable to prepare replay. Check browser storage and try Replay again.',
      )
    } finally {
      finish()
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
    <SimulationMutationContext.Provider
      value={{
        busy: mutating || loading,
        begin,
        finish,
        uncertain: markUncertain,
      }}
    >
      <FinancialTracking
        run={run}
        expenses={expenseState}
        bills={saved?.bills}
        employment={saved?.employment.state ?? undefined}
        onBillAction={(id, type) => void action(id, type)}
        billBusy={loading || unresolved || mutating}
        layoutAction={
          run.status === 'active' && run.sessionId === null ? (
            <Button
              disabled={!saved || loading || unresolved || mutating}
              onClick={() => {
                if (begin()) setConfirmation(true)
              }}
            >
              Give Up
            </Button>
          ) : undefined
        }
        pregame={
          saved
            ? !saved.employment.state || saved.employment.state.day === 0
            : false
        }
      >
        {error && <p role="alert">{error}</p>}
        {recoverable && <PlaythroughRecovery />}
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
        {pendingRequest && saved?.employment.beforeEmploymentEnded && (
          <Button disabled={loading || ending} onClick={() => void end(true)}>
            Reconcile pending submission
          </Button>
        )}
        {!saved ? (
          <p role="status">
            {loading
              ? 'Loading your bills and progress…'
              : 'Your saved bills could not be loaded. Use Reload saved bills to retry.'}
          </p>
        ) : saved.employment.beforeEmploymentEnded ? (
          <section className="employment-game" aria-label="Simulation results">
            <h2 tabIndex={-1} ref={focusResult}>
              Simulation ended early.
            </h2>
            <p>Before Day 1</p>
            <fieldset
              className="employment-controls"
              disabled={mutating || loading || unresolved}
            >
              <SimulationResult
                reason="You ended the walkthrough."
                balance={saved.bills.run.currentBalance!}
                onReplay={() => void replayBeforeEmployment()}
              />
            </fieldset>
          </section>
        ) : (
          <EmploymentPanel
            run={run}
            bills={saved.bills}
            billBusy={loading || uncertain}
            onBillAction={(id, type) => void action(id, type)}
            onCommit={(snapshot) => {
              return refresh(snapshot.run)
            }}
          />
        )}
      </FinancialTracking>
      <Dialog
        open={confirmation}
        title="Give Up?"
        description="Are you sure you want to give up on this simulation?"
        dismissLabel="Cancel"
        dismissDisabled={ending}
        onDismiss={() => {
          if (!ending) {
            setConfirmation(false)
            finish()
          }
        }}
      >
        <Button
          loading={ending}
          disabled={loading || unresolved}
          onClick={() => void end()}
        >
          Give Up
        </Button>
      </Dialog>
    </SimulationMutationContext.Provider>
  )
}
