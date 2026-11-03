import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { useSetup } from '../../state/setupContext'
import {
  employmentSnapshot,
  employmentRestoreMessage,
  submitEmployment,
  hasPending,
  type EmploymentAction,
  type CommittedEmployment,
} from '../../services/employmentGameplay'
import type { LoadedPlaythrough } from '../../types/playthrough'
import { paths } from '../../app/paths'
import { EmploymentGame } from './EmploymentGame'

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
        if (current) setError(employmentRestoreMessage(cause))
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
  return (
    <>
      {error && <p role="alert">{error}</p>}
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
      <fieldset disabled={pending || uncertain} className="employment-controls">
        {snapshot?.state ? (
          <EmploymentGame
            state={snapshot.state}
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
              <h2>Your employment walkthrough</h2>
              <p>
                Employment decisions and weekly pay will be saved to this
                playthrough. Other scenarios and bills remain placeholders.
              </p>
              <Button
                onClick={() => {
                  void send(
                    replayOf
                      ? { type: 'initialize', replayOf }
                      : { type: 'initialize' },
                  )
                }}
              >
                Start employment walkthrough
              </Button>
            </>
          )
        )}
      </fieldset>
    </>
  )
}
