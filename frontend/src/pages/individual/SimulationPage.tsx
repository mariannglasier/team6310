import { useEffect, useState } from 'react'
import { PageSection } from '../../components/ui/PageSection'
import { ButtonLink } from '../../components/ui/Button'
import { paths } from '../../app/paths'
import { useSetup } from '../../state/setupContext'
import {
  loadPlaythrough,
  PlaythroughLoadError,
} from '../../services/loadPlaythrough'
import { formatUsd } from '../../lib/money'
import type { LoadedPlaythrough } from '../../types/playthrough'

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
      (playthrough) => {
        if (current)
          setState(
            playthrough
              ? { status: 'ready', playthrough }
              : { status: 'unavailable' },
          )
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
    <>
      <p role="status">Your playthrough has been loaded.</p>
      <dl>
        <dt>Household</dt>
        <dd>{run.persona?.name ?? 'Unavailable'}</dd>
        <dt>Current balance</dt>
        <dd>
          {run.currentBalance === null
            ? 'Unavailable'
            : formatUsd(run.currentBalance)}
        </dd>
        <dt>Current day</dt>
        <dd>{run.currentDay ?? 'Unavailable'}</dd>
        <dt>Status</dt>
        <dd>{run.status ?? 'Unavailable'}</dd>
      </dl>
      {!run.persona && (
        <p role="alert">
          Household information for this content version is unavailable.
        </p>
      )}
      <p>Playthrough ID: {run.id}</p>
      <p>Gameplay is not available yet.</p>
    </>
  )
}

export function SimulationPage() {
  const { createdPlaythrough } = useSetup()
  return (
    <PageSection title="Individual simulation">
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
    </PageSection>
  )
}
