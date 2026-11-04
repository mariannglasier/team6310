import { Navigate, useNavigate } from 'react-router'
import { HouseholdCarousel } from '../../components/simulation/HouseholdCarousel'
import { PlaceholderPage } from '../../components/PlaceholderPage'
import { Button, ButtonLink } from '../../components/ui/Button'
import { PageSection } from '../../components/ui/PageSection'
import { useRef, useState } from 'react'
import { createIndividualPlaythrough } from '../../services/playthroughService'
import { useFitScale } from '../../hooks/useFitScale'
import { useHouseholds } from '../../hooks/useHouseholds'
import { paths } from '../../app/paths'
import { useSetup } from '../../state/setupContext'

// Household choices come from approved published content. Selecting one is
// temporary UI state: it creates no run, locks nothing, and changes no finances.
// Jobs are chosen in the pre-game stage after the run is created.
function HouseholdChoices({
  state,
  retry,
  selectedId,
  onSelect,
}: {
  state: ReturnType<typeof useHouseholds>['state']
  retry: () => void
  selectedId: string | null
  onSelect: (personaId: string) => void
}) {
  if (state.status === 'loading')
    return <p aria-live="polite">Loading households…</p>
  if (state.status === 'error')
    return (
      <div>
        <p role="alert">{state.message}</p>
        <Button variant="secondary" onClick={retry}>
          Retry loading households
        </Button>
      </div>
    )
  if (state.status === 'empty')
    return <p>No households have been published yet.</p>
  return (
    <HouseholdCarousel
      personas={state.households.personas}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  )
}

export function IndividualPage() {
  const { selectedId, select, createdPlaythrough, recordPlaythrough } =
    useSetup()
  const { state, retry } = useHouseholds()
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [fitTarget, fitStyle] = useFitScale<HTMLDivElement>()
  const persona =
    state.status === 'ready'
      ? state.households.personas.find((item) => item.id === selectedId)
      : undefined
  async function start() {
    if (!persona || busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      const id = await createIndividualPlaythrough(persona.id)
      recordPlaythrough({ id, householdName: persona.name })
      navigate(paths.simulation, { replace: true })
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to create your playthrough. Please retry.',
      )
      busy.current = false
      setPending(false)
    }
  }
  if (createdPlaythrough) return <Navigate to={paths.simulation} replace />
  return (
    <div ref={fitTarget} style={fitStyle} className="household-page">
      <PageSection title="Every household has a story.">
        <p className="household-page__intro">
          Choose the household whose finances you will manage for 30 days. Start
          simulation confirms your selection and begins your job search.
        </p>
        <fieldset disabled={pending} className="employment-controls">
          <HouseholdChoices
            state={state}
            retry={retry}
            selectedId={selectedId}
            onSelect={select}
          />
          {error && <p role="alert">{error}</p>}
          <div className="household-actions">
            {!pending && (
              <ButtonLink to={paths.home} variant="secondary">
                Back
              </ButtonLink>
            )}
            <Button
              disabled={!persona}
              loading={pending}
              onClick={() => {
                void start()
              }}
            >
              Start simulation
            </Button>
          </div>
        </fieldset>
      </PageSection>
    </div>
  )
}
export function ResultsPage() {
  return (
    <PlaceholderPage title="Simulation results">
      <p>
        No run results are loaded. Results and summaries will be implemented in
        a later story.
      </p>
    </PlaceholderPage>
  )
}
