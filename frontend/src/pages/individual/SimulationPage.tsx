import { useEffect, useState } from 'react'
import { ButtonLink } from '../../components/ui/Button'
import { paths } from '../../app/paths'
import { useSetup } from '../../state/setupContext'
import {
  loadPlaythrough,
  PlaythroughLoadError,
} from '../../services/loadPlaythrough'
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
      <p role="alert">
        This playthrough is missing or is not accessible with your participant
        session.
      </p>
    )
  const run = state.playthrough
  return (
    <FinancialTracking run={run} expenses={state.expenses}>
      <h2>Your simulation</h2>
      <p>Gameplay is not available yet.</p>
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
  const { createdPlaythrough } = useSetup()
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
          <ButtonLink to={paths.individual}>Choose a household</ButtonLink>
        </>
      )}
    </section>
  )
}
