import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { PersonaAvatar } from '../../components/simulation/PersonaAvatar'
import { avatarTone } from '../../components/simulation/avatars'
import { splitDescription } from '../../components/simulation/householdText'
import { Button, ButtonLink } from '../../components/ui/Button'
import { PageSection } from '../../components/ui/PageSection'
import { SetupProgress } from '../../components/ui/SetupProgress'
import { useFitScale } from '../../hooks/useFitScale'
import { useHouseholds } from '../../hooks/useHouseholds'
import { formatUsd } from '../../lib/money'
import { paths } from '../../app/paths'
import { useSetup } from '../../state/setupContext'
import type { Persona } from '../../types/domain'
import { contentService } from '../../services/contentService'
import { validateSkillsCatalog } from '../../state/employmentWalkthrough'
import '../../components/simulation/household.css'
import './review.css'

function ReviewSummary({ persona }: { persona: Persona }) {
  const { tagline, body } = splitDescription(persona.name, persona.description)
  return (
    <div className="review-grid">
      <section className="review-profile" aria-labelledby="review-household">
        <div
          className={`household-photo household-photo--${avatarTone(persona.name)}`}
        >
          <span className="review-profile__badge">Household selected</span>
          <PersonaAvatar name={persona.name} />
        </div>
        <div className="review-profile__body">
          <div className="review-heading">
            <div>
              <span className="review-label">Playing as</span>
              <h2 id="review-household">{persona.name}</h2>
              {tagline && <p className="household-tagline">{tagline}</p>}
            </div>
            <Link className="review-change" to={paths.individual}>
              Change <span className="sr-only">household</span>
            </Link>
          </div>
          <div className="review-budget">
            <span className="review-label">Available starting balance</span>
            <strong>{formatUsd(persona.startingBalance)}</strong>
          </div>
          <p className="review-story">{body}</p>
        </div>
      </section>
      <section className="review-next" aria-labelledby="review-next-title">
        <span className="review-label">What happens next</span>
        <h2 id="review-next-title">Your first day starts with a choice.</h2>
        <p>
          Balance everyday needs and consider unexpected costs over 30 days.
        </p>
        <p className="review-next__meta">
          Before Day 1 · Job selection and preparation
        </p>
      </section>
    </div>
  )
}

// This creates a local preview only, not a protected Supabase playthrough.
export function ReviewPage() {
  const { selectedId, walkthrough, startPreview, supportForNext } = useSetup()
  const navigate = useNavigate()
  const { state, retry } = useHouseholds()
  const [notice, setNotice] = useState('')
  const [starting, setStarting] = useState(false)
  const [fitTarget, fitStyle] = useFitScale<HTMLDivElement>()
  if (walkthrough) return <Navigate to={paths.play} replace />
  if (selectedId === null) return <Navigate to={paths.individual} replace />

  const persona =
    state.status === 'ready'
      ? state.households.personas.find((item) => item.id === selectedId)
      : undefined

  async function confirm() {
    if (!persona || starting) return
    setStarting(true)
    setNotice('Loading jobs for your household’s content edition…')
    try {
      const jobs = await contentService.loadJobs(persona.versionId)
      if (!jobs.length)
        throw new Error(
          'No approved jobs are available for this household’s content edition.',
        )
      if (jobs.some((job) => job.versionId !== persona.versionId))
        throw new Error(
          'Job content does not match your household’s edition. Please retry.',
        )
      const skillsError = validateSkillsCatalog(persona, jobs)
      if (skillsError) throw new Error(skillsError)
      startPreview(persona, jobs)
      navigate(paths.play)
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Unable to load jobs. Please retry.',
      )
    } finally {
      setStarting(false)
    }
  }

  let content
  if (state.status === 'loading')
    content = <p aria-live="polite">Loading your household…</p>
  else if (state.status === 'error')
    content = (
      <div className="review-message">
        <p role="alert">{state.message}</p>
        <Button variant="secondary" onClick={retry}>
          Retry loading households
        </Button>
      </div>
    )
  else if (!persona)
    content = (
      <p className="review-message">
        The selected household is no longer available. Choose a household again.
      </p>
    )
  else content = <ReviewSummary persona={persona} />

  return (
    <div
      ref={fitTarget}
      style={fitStyle}
      className="household-page review-page"
    >
      <PageSection
        title="Review your setup."
        eyebrow="Final step · Ready when you are"
        leading={<SetupProgress step={2} />}
      >
        <p className="household-page__intro">
          Your household. One month of choices.
        </p>
        {content}
        <p className="employment-notice">
          Local 30-day walkthrough · Employment decisions are simulated; other
          scenarios are placeholders. Progress is saved in this browser tab.{' '}
          {supportForNext
            ? 'CAC support is enabled for this replay.'
            : 'Your first walkthrough is without CAC support.'}
        </p>
        <p className="household-page__status" role="status">
          {notice}
        </p>
        <div className="household-actions">
          <ButtonLink to={paths.individual} variant="secondary">
            Back
          </ButtonLink>
          <Button
            disabled={!persona}
            loading={starting}
            onClick={() => {
              void confirm()
            }}
          >
            Confirm selection
          </Button>
        </div>
      </PageSection>
    </div>
  )
}
