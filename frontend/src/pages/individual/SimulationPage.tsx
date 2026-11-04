import { useEffect, useState } from 'react'
import { Button, ButtonLink } from '../../components/ui/Button'
import { paths } from '../../app/paths'
import { useSetup } from '../../state/setupContext'
import {
  loadPlaythrough,
  PlaythroughLoadError,
} from '../../services/loadPlaythrough'
import { findOwnedRuns } from '../../services/employmentGameplay'
import { EmploymentPanel } from './EmploymentPanel'
import { PlaythroughRecovery } from './PlaythroughRecovery'
import { FinancialTracking } from '../../components/simulation/FinancialTracking'
import { loadHouseholdExpenses } from '../../services/householdExpenses'
import type { ExpenseState } from '../../types/householdExpenses'
import type { LoadedPlaythrough } from '../../types/playthrough'

type LoadState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error' }
  | { status: 'ready'; playthrough: LoadedPlaythrough; expenses: ExpenseState }

function RecordedPlaythrough({ id }: { id: string }) {
  const { setEmployment } = useSetup()
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
        setState({
          status: 'ready',
          playthrough,
          expenses: { status: 'loading' },
        })
        try {
          const data = await loadHouseholdExpenses(playthrough)
          if (current)
            setState({
              status: 'ready',
              playthrough,
              expenses: data
                ? { status: 'ready', data }
                : { status: 'unavailable' },
            })
        } catch {
          if (current)
            setState({
              status: 'ready',
              playthrough,
              expenses: { status: 'unavailable' },
            })
        }
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
  const run = state.playthrough
  return (
    <FinancialTracking
      run={run}
      expenses={state.expenses}
      pregame={['board', 'preparation-result', 'application-result'].includes(
        String((run.employmentState as { stage?: string } | null)?.stage),
      )}
    >
      <EmploymentPanel
        run={run}
        onCommit={(snapshot) => {
          setState((current) =>
            current.status === 'ready'
              ? { ...current, playthrough: snapshot.run }
              : current,
          )
          setEmployment(
            snapshot.state ? { runId: run.id, state: snapshot.state } : null,
          )
        }}
      />
      {!run.persona && (
        <p role="alert">
          Household information for this content version is unavailable.
        </p>
      )}
      <p className="finance-run-id">Playthrough ID: {run.id}</p>
    </FinancialTracking>
  )
}

export function SimulationPage() {
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
