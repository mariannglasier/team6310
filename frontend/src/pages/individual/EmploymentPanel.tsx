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
import { PlaythroughRecovery } from './PlaythroughRecovery'

export function EmploymentPanel({
  run,
  onCommit,
}: {
  run: LoadedPlaythrough
  onCommit: (snapshot: CommittedEmployment) => void
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
    if (!snapshot || busy.current) return
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
    if (!state || pending || uncertain || error) return
    if (
      state.stage === 'income' ||
      (state.stage === 'day' &&
        (state.day === 2 || (state.day === 3 && state.hiredDay === 3)))
    ) {
      const timer = window.setTimeout(() => advanceAutomatically(), 0)
      return () => window.clearTimeout(timer)
    }
  }, [snapshot, pending, uncertain, error])
  const state = snapshot?.state
  const skipInterviewDay =
    state?.stage === 'day' &&
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
      {pending && <p role="status">Saving your decision…</p>}
      <fieldset
        disabled={pending || uncertain || automatic}
        className="employment-controls"
      >
        {skipInterviewDay ? (
          <p role="status">Opening Day {state.day + 1}…</p>
        ) : snapshot?.state ? (
          <EmploymentGame
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
            <>
              <h2>It's time to start your job search</h2>
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
            </>
          )
        )}
      </fieldset>
    </>
  )
}
