import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { useSetup } from '../../state/setupContext'
import {
  employmentSnapshot,
  employmentRestoreMessage,
  submitEmployment,
  hasPending,
  MissingEmploymentMarkerError,
  UnsupportedEmploymentDocumentError,
  type EmploymentAction,
  type CommittedEmployment,
} from '../../services/employmentGameplay'
import type { LoadedPlaythrough } from '../../types/playthrough'
import { paths } from '../../app/paths'
import { EmploymentGame } from './EmploymentGame'
import { ScenarioPanel } from '../../components/simulation/ScenarioPanel'
import { ScenarioFacts } from '../../components/simulation/ScenarioFacts'
import { PlaythroughRecovery } from './PlaythroughRecovery'
import type { BillSnapshot } from '../../services/billGameplay'
import {
  DueBillsPanel,
  type BillAction,
} from '../../components/simulation/BillControls'
import { formatUsd } from '../../lib/money'

export function EmploymentPanel({
  run,
  onCommit,
  bills,
  billBusy = false,
  onBillAction,
  onPendingChange,
}: {
  run: LoadedPlaythrough
  onCommit: (snapshot: CommittedEmployment) => void
  bills?: BillSnapshot | null
  billBusy?: boolean
  onBillAction?: BillAction
  onPendingChange?: (pending: boolean) => void
}) {
  const { replay, replayOf, setEmployment } = useSetup()
  const navigate = useNavigate()
  const [snapshot, setSnapshot] = useState<CommittedEmployment | null>(null)
  const [error, setError] = useState('')
  const [recoverable, setRecoverable] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  useEffect(() => {
    onPendingChange?.(pending)
  }, [pending, onPendingChange])
  const billsReady =
    !bills ||
    Boolean(
      bills &&
      snapshot &&
      bills.run.currentDay === snapshot.run.currentDay &&
      bills.run.currentBalance === snapshot.run.currentBalance &&
      (bills.run.employmentState as { revision?: number })?.revision ===
        snapshot.revision,
    )
  const dueToday =
    bills?.items.some((b) => b.dueDay === snapshot?.run.currentDay) ?? false
  useEffect(() => {
    let current = true
    Promise.all([employmentSnapshot(run), hasPending(run.id)]).then(
      ([s, p]) => {
        if (current) {
          setSnapshot(s)
          setEmployment(s.state ? { runId: run.id, state: s.state } : null)
          setUncertain(p)
        }
      },
      (cause) => {
        if (current) {
          setError(employmentRestoreMessage(cause))
          setRecoverable(
            cause instanceof MissingEmploymentMarkerError ||
              cause instanceof UnsupportedEmploymentDocumentError,
          )
        }
      },
    )
    return () => {
      current = false
    }
  }, [run, setEmployment])
  async function send(action: EmploymentAction, retry = false) {
    if (!snapshot || busy.current || billBusy) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      const s = await submitEmployment(
        snapshot.run,
        snapshot.revision,
        action,
        retry,
      )
      setSnapshot(s)
      onCommit(s)
      setUncertain(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Submission failed')
      setUncertain(await hasPending(run.id).catch(() => true))
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  const advanceAutomatically = useEffectEvent(() => {
    void send({ type: 'continue' })
  })
  useEffect(() => {
    const state = snapshot?.state
    if (!state || pending || uncertain || error || billBusy) return
    if (
      state.stage === 'income' ||
      (state.stage === 'day' &&
        billsReady &&
        !dueToday &&
        (state.day === 2 || (state.day === 3 && state.hiredDay === 3)))
    ) {
      const timer = window.setTimeout(() => advanceAutomatically(), 0)
      return () => window.clearTimeout(timer)
    }
  }, [snapshot, pending, uncertain, error, billBusy, billsReady, dueToday])
  const state = snapshot?.state
  const skipInterviewDay =
    state?.stage === 'day' &&
    billsReady &&
    !dueToday &&
    (state.day === 2 || (state.day === 3 && state.hiredDay === 3))
  const automatic = skipInterviewDay || state?.stage === 'income'
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {recoverable && <PlaythroughRecovery />}
      {uncertain && (
        <Button
          loading={pending}
          onClick={() => {
            void send({ type: 'continue' }, true)
          }}
        >
          Reconcile pending submission
        </Button>
      )}
      <fieldset
        disabled={
          pending ||
          uncertain ||
          automatic ||
          billBusy ||
          (state?.stage === 'day' && !billsReady)
        }
        aria-busy={pending || automatic}
        className="employment-controls"
      >
        {state?.stage === 'day' && !billsReady ? (
          <p role="status">Loading saved bills…</p>
        ) : skipInterviewDay ? (
          <p className="sr-only" role="status">
            Opening Day {state.day + 1}…
          </p>
        ) : state?.stage === 'day' && bills && dueToday && onBillAction ? (
          <DueBillsPanel
            snapshot={bills}
            onAction={onBillAction}
            busy={pending || billBusy}
            onContinue={() => void send({ type: 'continue' })}
          />
        ) : snapshot?.state &&
          snapshot.state.stage === 'day' &&
          snapshot.run.currentScenarioId ? (
          <ScenarioPanel
            key={`${snapshot.run.id}:${snapshot.run.currentScenarioId}`}
            run={snapshot.run}
            onCommit={(run) => {
              void employmentSnapshot(run).then(
                (value) => {
                  setSnapshot(value)
                  onCommit(value)
                },
                () =>
                  setError(
                    'Unable to restore saved progress. Reload to retry.',
                  ),
              )
            }}
            onContinue={() => void send({ type: 'continue' })}
          />
        ) : snapshot?.state ? (
          <EmploymentGame
            recapFacts={
              snapshot.run.versionId ? (
                <ScenarioFacts
                  runId={snapshot.run.id}
                  scenarioId={
                    snapshot.state.stage === 'reapply-result'
                      ? 'D003'
                      : snapshot.state.stage === 'interview-result'
                        ? snapshot.state.day === 3
                          ? 'D004'
                          : 'D002'
                        : 'D001'
                  }
                  versionId={snapshot.run.versionId}
                  supportEnabled={snapshot.run.supportEnabled === true}
                />
              ) : undefined
            }
            state={
              snapshot.state.stage === 'income'
                ? { ...snapshot.state, stage: 'day' }
                : snapshot.state
            }
            dispatch={(a) => {
              void send(a)
            }}
            onReplay={(support) => {
              replay(support)
              navigate(paths.individual)
            }}
          />
        ) : (
          snapshot && (
            <div className="employment-intro">
              <h2>It's time to start your job search!</h2>
              <Button
                onClick={() => {
                  void send(
                    replayOf
                      ? { type: 'initialize', replayOf }
                      : { type: 'initialize' },
                  )
                }}
              >
                See who's hiring
              </Button>
            </div>
          )
        )}
        {state?.stage === 'complete' && bills && (
          <section aria-label="Unpaid obligations at completion">
            <h2>Unpaid obligations</h2>
            <p>{formatUsd(bills.outstandingTotal)}, including late fees.</p>
            {bills.outstandingTotal > 0 && (
              <p>
                These bills remain unpaid. Further consequences could occur
                beyond this month.
              </p>
            )}
          </section>
        )}
      </fieldset>
    </>
  )
}
