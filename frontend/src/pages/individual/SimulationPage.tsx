import { lazy, Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button, ButtonLink } from '../../components/ui/Button'
import { paths } from '../../app/paths'
import { useSetup } from '../../state/setupContext'
import {
  loadPlaythrough,
  PlaythroughLoadError,
} from '../../services/loadPlaythrough'
import { findOwnedRuns } from '../../services/employmentGameplay'
import { PlaythroughRecovery } from './PlaythroughRecovery'
import type { LoadedPlaythrough } from '../../types/playthrough'
import { BillSimulation } from './BillSimulation'

type LoadState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error' }
  | { status: 'ready'; playthrough: LoadedPlaythrough }

function RecordedPlaythrough({ id }: { id: string }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  useEffect(() => {
    let current = true
    loadPlaythrough(id).then(
      async (playthrough) => {
        if (!current) return
        if (!playthrough) {
          setState({ status: 'unavailable' })
          return
        }
        setState({ status: 'ready', playthrough })
      },
      () => {
        if (current) setState({ status: 'error' })
      },
    )
    return () => {
      current = false
    }
  }, [id])
  if (state.status === 'loading')
    return <p role="status">Loading your playthrough…</p>
  if (state.status === 'error')
    return <p role="alert">{new PlaythroughLoadError().message}</p>
  if (state.status === 'unavailable')
    return (
      <>
        <p role="alert">
          This playthrough is missing or is not accessible with your participant
          session.
        </p>
        <PlaythroughRecovery />
      </>
    )
  return <BillSimulation initialRun={state.playthrough} />
}

const LocalScenarioPreview = import.meta.env.DEV
  ? lazy(() => import('../../development/LocalScenarioPreview'))
  : null

export function SimulationPage() {
  const [params] = useSearchParams()
  if (LocalScenarioPreview && params.get('localScenario') === 'day4') {
    return (
      <Suspense fallback={<p role="status">Loading local preview…</p>}>
        <LocalScenarioPreview />
      </Suspense>
    )
  }
  return <SavedSimulationPage />
}

function SavedSimulationPage() {
  const { createdPlaythrough, recordPlaythrough } = useSetup()
  const [runs, setRuns] = useState<Awaited<ReturnType<typeof findOwnedRuns>>>(
    [],
  )
  const [recoveryError, setRecoveryError] = useState('')
  return (
    <section className="simulation-page" aria-label="Individual simulation">
      {createdPlaythrough ? (
        <RecordedPlaythrough
          key={createdPlaythrough.id}
          id={createdPlaythrough.id}
        />
      ) : (
        <>
          <p>
            No newly created playthrough is available in this browser session.
          </p>
          <Button
            onClick={() => {
              void findOwnedRuns().then(setRuns, () =>
                setRecoveryError(
                  'Unable to recover saved runs. No replacement was created.',
                ),
              )
            }}
          >
            Find saved playthroughs
          </Button>
          {recoveryError && <p role="alert">{recoveryError}</p>}
          {runs.map((run) => (
            <Button
              key={run.playthrough_id}
              onClick={() =>
                recordPlaythrough({ id: run.playthrough_id, householdName: '' })
              }
            >
              Resume {run.playthrough_id} · Day {run.current_day ?? 'unknown'} ·{' '}
              {run.status ?? 'unknown'}
            </Button>
          ))}
          <ButtonLink to={paths.individual}>Choose a household</ButtonLink>
        </>
      )}
    </section>
  )
}
