import { Link } from 'react-router'
import { ButtonLink } from '../../components/ui/Button'
import { PageSection } from '../../components/ui/PageSection'
import { paths } from '../../app/paths'
import pantryPhoto from '../../assets/foodpantry2.png'
import { landingContent as copy } from './landingContent'
import './LandingPage.css'

function StepIcon({ kind }: { kind: 'house' | 'receipt' | 'chart' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'house' ? (
        <>
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
          <path d="M9 21v-8h6v8" />
        </>
      ) : kind === 'receipt' ? (
        <>
          <path d="M5 3h14v18l-3-2-4 2-4-2-3 2Z" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </>
      ) : (
        <>
          <path d="M3 3v18h18" />
          <path d="M7 17v-5h3v5ZM13 17V8h3v9ZM19 17V4h3v13Z" />
        </>
      )}
    </svg>
  )
}

export function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="landing-hero__copy">
          <PageSection title={copy.headline} eyebrow={copy.eyebrow}>
            <p className="landing-introduction">{copy.introduction}</p>
            <p className="landing-context">{copy.context}</p>
            <div
              className="landing-actions"
              aria-label="Explore the simulation and CAC"
            >
              <ButtonLink to={paths.individual} variant="primary">
                Start simulation <span aria-hidden="true">→</span>
              </ButtonLink>
              <ButtonLink to={paths.join}>Join a group</ButtonLink>
            </div>
            <Link className="landing-host-link" to={paths.host}>
              Host a group
            </Link>
          </PageSection>
        </div>
        <div className="landing-photo">
          <img
            src={pantryPhoto}
            width="1120"
            height="840"
            fetchPriority="high"
            alt="People sorting fresh produce into bins at a food pantry."
          />
        </div>
      </div>
      <section className="landing-how" aria-labelledby="how-heading">
        <div className="landing-section-heading">
          <h2 id="how-heading">How the simulation works</h2>
        </div>
        <div className="landing-steps">
          {copy.steps.map((step) => (
            <article className="landing-step" key={step.icon}>
              <span className="landing-step__icon" aria-hidden="true">
                <StepIcon kind={step.icon} />
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
