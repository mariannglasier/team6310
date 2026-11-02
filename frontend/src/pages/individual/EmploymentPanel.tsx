import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { useSetup } from '../../state/setupContext'
import { loadEmploymentPreview } from '../../services/employmentContent'
import { walkthroughReducer } from '../../state/employmentWalkthrough'
import type { LoadedPlaythrough } from '../../types/playthrough'
import { paths } from '../../app/paths'
import { EmploymentGame } from './EmploymentGame'

export function EmploymentPanel({ run }: { run: LoadedPlaythrough }) {
  const { employment, setEmployment, supportForNext, replay } = useSetup()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const state = employment?.runId === run.id ? employment.state : null
  async function start() {
    if (pending) return
    setPending(true)
    setError('')
    try {
      const initial = await loadEmploymentPreview(run, supportForNext)
      setEmployment({ runId: run.id, state: initial })
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to load employment content. Please retry.',
      )
    } finally {
      setPending(false)
    }
  }
  if (state)
    return (
      <EmploymentGame
        state={state}
        dispatch={(action) =>
          setEmployment((current) =>
            current?.runId === run.id
              ? { ...current, state: walkthroughReducer(current.state, action) }
              : current,
          )
        }
        onReplay={(support) => {
          replay(support)
          navigate(paths.individual)
        }}
      />
    )
  return (
    <>
      <h2>Your employment walkthrough</h2>
      <p>
        Explore job applications, interviews and weekly pay using this saved
        household and balance. Other daily scenarios and bills are not
        implemented.
      </p>
      <p>
        Gameplay changes are provisional and are not saved to Supabase.
        Refreshing discards local progress. Navigating within this application
        retains it.
      </p>
      {(supportForNext || run.supportEnabled === true) && (
        <p>CAC support is available for this local walkthrough only.</p>
      )}
      {error && <p role="alert">{error}</p>}
      <Button
        loading={pending}
        onClick={() => {
          void start()
        }}
      >
        {error ? 'Retry employment content' : 'Start employment walkthrough'}
      </Button>
    </>
  )
}
