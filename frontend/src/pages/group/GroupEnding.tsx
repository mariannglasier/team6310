import { useEffect, useState } from 'react'
import {
  Button,
  ButtonLink,
  ExternalButtonLink,
} from '../../components/ui/Button'
import { paths } from '../../app/paths'
import { externalLinks } from '../../app/externalLinks'
import {
  groupSessionService,
  type GroupDecisionReview,
  type GroupSession,
} from '../../services/groupSessionService'

export function GroupEnding({
  session,
  onReplay,
  busy = false,
  onJoinAgain,
}: {
  session: GroupSession
  onReplay?: (withAssistance: boolean) => Promise<void>
  busy?: boolean
  onJoinAgain?: () => void
}) {
  const [review, setReview] = useState<GroupDecisionReview[] | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    groupSessionService
      .review(session.sessionId)
      .then((value) => {
        if (active) {
          setReview(value)
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('Unable to load saved choices. Please retry.')
      })
    return () => {
      active = false
    }
  }, [session.sessionId, attempt])
  return (
    <section className="group-page" aria-labelledby="page-heading">
      <div className="group-card group-ending" aria-busy={busy}>
        <span className="group-badge">
          Group session ended · {session.joinCode}
        </span>
        <h1 id="page-heading" tabIndex={-1}>
          Every choice has a story.
        </h1>
        <p className="group-lead">
          Take a moment to look back at the choices your group made and the
          perspectives you shared.
        </p>
        <dl className="group-ending-totals">
          <div>
            <dt>Household balance</dt>
            <dd>
              {session.sharedBalance === null
                ? 'Unavailable'
                : new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(Number(session.sharedBalance))}
            </dd>
          </div>
          <div>
            <dt>Day reached</dt>
            <dd>{session.currentDay} of 30</dd>
          </div>
          <div>
            <dt>CAC assistance</dt>
            <dd>
              {session.cacSupportEnabled ? 'Available' : 'Without assistance'}
            </dd>
          </div>
        </dl>
        <h2>Review the group’s choices</h2>
        {error ? (
          <div>
            <p role="alert">{error}</p>
            <Button variant="secondary" onClick={() => setAttempt(attempt + 1)}>
              Retry loading choices
            </Button>
          </div>
        ) : review === null ? (
          <p role="status">Loading saved choices…</p>
        ) : review.length === 0 ? (
          <p>No scenario votes were recorded.</p>
        ) : (
          review.map((decision) => (
            <details
              className="group-ending-decision"
              key={decision.scenarioId}
            >
              <summary>
                Day {decision.day} · {decision.title}
              </summary>
              <ul>
                {decision.choices.map((choice) => (
                  <li key={choice.choiceId}>
                    <span>
                      {choice.text}
                      {decision.selectedChoiceId === choice.choiceId && (
                        <strong> · Your vote</strong>
                      )}
                    </span>
                    <strong>
                      {choice.voteCount}{' '}
                      {choice.voteCount === 1 ? 'vote' : 'votes'}
                    </strong>
                  </li>
                ))}
              </ul>
              {!session.isHost && !decision.selectedChoiceId && (
                <p>You did not vote on this situation.</p>
              )}
            </details>
          ))
        )}
        <div className="group-ending-reflection">
          <h2>A moment to reflect</h2>
          <ul>
            <li>Which trade-off asked the most of your household?</li>
            <li>Where did your group’s perspectives differ?</li>
            <li>How might community support change your options?</li>
          </ul>
        </div>
        <h2>Turn understanding into action.</h2>
        <div className="group-actions">
          <ExternalButtonLink href={externalLinks.donate}>
            Donate to CAC
          </ExternalButtonLink>
          <ExternalButtonLink href={externalLinks.learn} variant="secondary">
            Learn about CAC
          </ExternalButtonLink>
          <ButtonLink to={paths.data} variant="secondary">
            Explore community data
          </ButtonLink>
        </div>
        <div className="group-ending-replay">
          <h2>Play again. Explore another perspective.</h2>
          {onReplay ? (
            <>
              <p>
                Create a fresh group session, then share its new code so
                everyone can join and vote for a household again.
              </p>
              <div className="group-actions">
                <Button disabled={busy} onClick={() => void onReplay(true)}>
                  Replay with CAC assistance
                </Button>
                <Button
                  disabled={busy}
                  variant="secondary"
                  onClick={() => void onReplay(false)}
                >
                  Replay without CAC assistance
                </Button>
              </div>
            </>
          ) : (
            <>
              <p>
                Your facilitator can start a new group session with or without
                CAC assistance. Join using the new session code.
              </p>
              <Button variant="secondary" onClick={onJoinAgain}>
                Join another group session
              </Button>
            </>
          )}
        </div>
        <ButtonLink to={paths.home} variant="text">
          Return home
        </ButtonLink>
      </div>
    </section>
  )
}
