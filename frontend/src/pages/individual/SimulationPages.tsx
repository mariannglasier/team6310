import { Navigate, useNavigate } from 'react-router'
import { HouseholdCarousel } from '../../components/simulation/HouseholdCarousel'
import { PlaceholderPage } from '../../components/PlaceholderPage'
import { Button, ButtonLink } from '../../components/ui/Button'
import { PageSection } from '../../components/ui/PageSection'
import { SetupProgress } from '../../components/ui/SetupProgress'
import { useFitScale } from '../../hooks/useFitScale'
import { useHouseholds } from '../../hooks/useHouseholds'
import { paths } from '../../app/paths'
import { useSetup } from '../../state/setupContext'

// Household choices come from approved published content. Selecting one is
// temporary UI state: it creates no run, locks nothing, and changes no finances.
// Jobs are not chosen here; employment decisions start on Day 1.
function HouseholdChoices({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (personaId: string) => void
}) {
  const { state, retry } = useHouseholds()
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
  const { selectedId, select, createdPlaythrough } = useSetup()
  const navigate = useNavigate()
  const [fitTarget, fitStyle] = useFitScale<HTMLDivElement>()
  if (createdPlaythrough) return <Navigate to={paths.simulation} replace />
  return (
    <div ref={fitTarget} style={fitStyle} className="household-page">
      <PageSection
        title="Every household has a story."
        eyebrow="Individual simulation"
        leading={<SetupProgress step={1} />}
      >
        <p className="household-page__intro">
          Choose the household whose finances you will manage for 30 days.
          Choosing a household does not start the simulation, and you can review
          your setup before it is locked.
        </p>
        <HouseholdChoices selectedId={selectedId} onSelect={select} />
        <div className="household-actions">
          <ButtonLink to={paths.home} variant="secondary">
            Back
          </ButtonLink>
          <Button
            disabled={selectedId === null}
            onClick={() => navigate(paths.review)}
          >
            Continue
          </Button>
        </div>
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
