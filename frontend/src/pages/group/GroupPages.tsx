import { useEffect, useState, type ReactNode } from 'react'
import { PageSection } from '../../components/ui/PageSection'
import { Button, ButtonLink } from '../../components/ui/Button'
import { SelectField, TextField } from '../../components/ui/FormFields'
import { paths } from '../../app/paths'
import { HouseholdCarousel } from '../../components/simulation/HouseholdCarousel'
import { PersonaAvatar } from '../../components/simulation/PersonaAvatar'
import { avatarTone } from '../../components/simulation/avatars'
import { useHouseholds } from '../../hooks/useHouseholds'
import '../../components/simulation/financialTracking.css'
import '../../components/simulation/employment.css'
import {
  groupSessionService,
  type DecisionDuration,
  type GroupSession,
} from '../../services/groupSessionService'
import './group.css'

const weeklyPay = (value: number | string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value))

function VotingCountdown({ session }: { session: GroupSession }) {
  const deadline = session.roundDeadline
  if (session.roundState !== 'voting' || !deadline) return null
  return <ActiveVotingCountdown key={deadline} deadline={deadline} />
}

function ActiveVotingCountdown({ deadline }: { deadline: string }) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    deadline
      ? Math.max(0, Math.ceil((Date.parse(deadline) - Date.now()) / 1000))
      : 0,
  )

  useEffect(() => {
    const update = () =>
      setRemainingSeconds(
        Math.max(0, Math.ceil((Date.parse(deadline) - Date.now()) / 1000)),
      )
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [deadline])

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const time = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div
      className={`group-countdown${remainingSeconds === 0 ? ' group-countdown--ended' : ''}`}
      role="timer"
      aria-live={remainingSeconds <= 10 ? 'polite' : 'off'}
      aria-label={
        remainingSeconds === 0
          ? 'Voting time has ended'
          : `${remainingSeconds} seconds remaining to vote`
      }
    >
      <span>
        {remainingSeconds === 0 ? 'Voting time ended' : 'Time to vote'}
      </span>
      <strong aria-hidden="true">{time}</strong>
    </div>
  )
}

function GroupJobBoard({
  session,
  onVote,
  busy = false,
}: {
  session: GroupSession
  onVote?: (jobId: string) => void
  busy?: boolean
}) {
  return (
    <div className="employment-board" role="group" aria-label="Available jobs">
      <div className="employment-board__postings">
        {session.jobs?.map((job) => (
          <button
            type="button"
            key={job.jobId}
            className="employment-posting"
            aria-pressed={session.selectedJobId === job.jobId}
            disabled={
              !onVote ||
              !session.acceptingVotes ||
              busy ||
              (session.employmentAttempt === 2 &&
                session.winningJobId === job.jobId)
            }
            onClick={() => onVote?.(job.jobId)}
          >
            <span className="employment-posting__pin" aria-hidden="true" />
            <span className="employment-posting__status">
              {session.roundState === 'results'
                ? `${job.voteCount ?? 0} votes`
                : session.employmentAttempt === 2 &&
                    session.winningJobId === job.jobId
                  ? 'Already interviewed'
                  : session.selectedJobId === job.jobId
                    ? 'Selected'
                    : 'Now hiring'}
            </span>
            <strong className="employment-posting__title">{job.title}</strong>
            <strong className="employment-posting__income">
              {weeklyPay(job.weeklyGrossIncome)} / week
            </strong>
            <span>{job.hoursPerWeek} hours per week</span>
            {job.description && (
              <span className="employment-posting__description">
                {job.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function GroupEmploymentOptions({
  session,
  onVote,
  busy = false,
}: {
  session: GroupSession
  onVote?: (optionId: string) => void
  busy?: boolean
}) {
  return (
    <div
      className="employment-choices"
      role="group"
      aria-label="Group decision"
    >
      {session.employmentOptions?.map((option) => (
        <button
          type="button"
          className="employment-choice"
          key={option.optionId}
          aria-pressed={session.selectedEmploymentOption === option.optionId}
          disabled={!onVote || !session.acceptingVotes || busy}
          onClick={() => onVote?.(option.optionId)}
        >
          <strong>
            {option.text}
            {session.selectedEmploymentOption === option.optionId &&
              session.roundState === 'voting' && (
                <span className="employment-selected"> · Selected</span>
              )}
          </strong>
          <span>
            {session.roundState === 'results'
              ? `${option.voteCount ?? 0} votes`
              : Number(option.cost ?? 0) > 0
                ? weeklyPay(option.cost ?? 0)
                : 'No cost'}
          </span>
        </button>
      ))}
    </div>
  )
}

function GroupEmploymentRound({
  session,
  busy = false,
  onJobVote,
  onEmploymentVote,
}: {
  session: GroupSession
  busy?: boolean
  onJobVote?: (jobId: string) => void
  onEmploymentVote?: (optionId: string) => void
}) {
  if (session.employmentStage === 'interview-result') {
    return (
      <div className="employment-result" role="status">
        <h1 id="page-heading">
          {session.interviewHired
            ? 'The group got the job.'
            : 'The interview did not lead to an offer.'}
        </h1>
        <p>
          {session.interviewHired
            ? 'The household is ready to begin earning the selected job’s weekly pay.'
            : 'The group will vote on a different opportunity for the follow-up interview.'}
        </p>
      </div>
    )
  }
  if (session.roundType === 'preparation') {
    return (
      <>
        <h1 id="page-heading">Prepare for the job search.</h1>
        <p className="group-lead">
          Vote whether the household will join CAC Adult Education classes.
        </p>
        <GroupEmploymentOptions
          session={session}
          busy={busy}
          onVote={onEmploymentVote}
        />
      </>
    )
  }
  if (session.roundType === 'clothing') {
    return (
      <>
        <h1 id="page-heading">What will the household wear?</h1>
        <p className="group-lead">
          Vote on the shared clothing decision before the interview.
        </p>
        <GroupEmploymentOptions
          session={session}
          busy={busy}
          onVote={onEmploymentVote}
        />
      </>
    )
  }
  return (
    <>
      <h1 id="page-heading">
        {session.employmentAttempt === 1
          ? 'Find your next opportunity.'
          : 'Apply for a different opportunity.'}
      </h1>
      <p className="group-lead">
        Participants vote on which job the household should apply for.
      </p>
      <GroupJobBoard session={session} busy={busy} onVote={onJobVote} />
    </>
  )
}

function GroupScenarioShell({
  session,
  role,
  children,
}: {
  session: GroupSession
  role: 'host' | 'participant'
  children: ReactNode
}) {
  return (
    <div className="group-scenario-stage">
      <div className="financial-tracking group-scenario-tracking">
        <ol className="finance-timeline" aria-label="Group question progress">
          {Array.from({ length: 30 }, (_, index) => index + 1).map(
            (question) => (
              <li
                key={question}
                aria-current={
                  session.currentDay === question ? 'step' : undefined
                }
                className={
                  question < session.currentDay ? 'finance-earlier' : undefined
                }
              >
                <span>{question}</span>
              </li>
            ),
          )}
        </ol>
        <div className="finance-layout">
          <aside className="finance-sidebar" aria-label="Group session profile">
            <section className="finance-household">
              <span className="finance-label">
                {role === 'host' ? 'Facilitator view' : 'Your household'}
              </span>
              <div className="finance-household-profile">
                {role === 'participant' && session.householdName && (
                  <div
                    className="finance-avatar"
                    style={{
                      backgroundColor: avatarTone(session.householdName),
                    }}
                  >
                    <PersonaAvatar
                      name={session.householdName}
                      variant="profile"
                    />
                  </div>
                )}
                <h2>
                  {role === 'host'
                    ? 'Group session'
                    : (session.sharedHouseholdName ??
                      session.householdName ??
                      'Household vote')}
                </h2>
              </div>
              <small>Session code: {session.joinCode}</small>
              <small className="finance-profile-detail">
                {session.roundType === 'job'
                  ? 'Before Day 1 · Job board'
                  : session.roundType === 'preparation'
                    ? 'Before Day 1 · CAC preparation'
                    : session.roundType === 'clothing'
                      ? 'Before Day 1 · Interview'
                      : `Day ${session.currentDay} of 30`}
              </small>
            </section>
            <section className="finance-money">
              <span className="finance-label">Shared balance</span>
              <strong className="group-vote-total">
                {session.sharedBalance === null
                  ? 'Pending vote'
                  : weeklyPay(session.sharedBalance)}
              </strong>
              <span>
                {session.cacSupportEnabled
                  ? 'Playing with CAC support'
                  : 'Playing without CAC support'}
              </span>
            </section>
          </aside>
          <main className="finance-main stage__panel">
            <div className="finance-content">{children}</div>
          </main>
          <aside className="finance-right" aria-label="Group session details">
            <section>
              <h2>Group session</h2>
              <p className="finance-subtitle">
                {session.roundState === 'voting'
                  ? 'Voting is open'
                  : session.roundState === 'results'
                    ? 'Voting results'
                    : 'Session complete'}
              </p>
              <VotingCountdown session={session} />
              <dl className="group-session-details">
                <div>
                  <dt>Participants</dt>
                  <dd>{session.participantCount}</dd>
                </div>
                <div>
                  <dt>Decision time</dt>
                  <dd>{session.decisionDurationSeconds} seconds</dd>
                </div>
                <div>
                  <dt>Votes received</dt>
                  <dd>
                    {session.voteCount}/{session.participantCount}
                  </dd>
                </div>
              </dl>
              {!!session.sharedExpenses?.length && (
                <div className="group-shared-expenses">
                  <h3>Shared upcoming expenses</h3>
                  <ul>
                    {session.sharedExpenses.slice(0, 3).map((expense) => (
                      <li key={expense.expenseId}>
                        <span>{expense.name}</span>
                        <strong>{weeklyPay(expense.amount)}</strong>
                        <small>Day {expense.firstDueDay}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <small>
                {role === 'host'
                  ? 'End voting to reveal results, then advance when the group is ready.'
                  : 'Your facilitator controls when the group moves to the next question.'}
              </small>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

export function HostPage() {
  const [session, setSession] = useState<GroupSession | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [duration, setDuration] = useState<DecisionDuration>(60)
  const [cacSupport, setCacSupport] = useState(false)
  useEffect(() => {
    let active = true
    groupSessionService
      .restore()
      .then((value) => {
        if (active) setSession(value)
      })
      .catch(() => {
        if (active) setError('Unable to restore your session. Please retry.')
      })
      .finally(() => {
        if (active) setBusy(false)
      })
    return () => {
      active = false
    }
  }, [])
  async function load(create: boolean) {
    setBusy(true)
    setError('')
    setNotice('')
    setSession(null)
    try {
      setSession(
        await (create
          ? groupSessionService.create(duration, cacSupport)
          : groupSessionService.restore()),
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to load session. Please retry.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function copy() {
    if (!session) return
    try {
      await navigator.clipboard.writeText(session.joinCode)
      setNotice('Join code copied.')
    } catch {
      setNotice('Copy unavailable. Select the code above and copy it manually.')
    }
  }
  const sessionId = session?.sessionId
  useEffect(() => {
    if (!sessionId) return
    const timer = window.setInterval(() => {
      void groupSessionService.get(sessionId).then((value) => {
        if (value) setSession(value)
      })
    }, 2000)
    return () => window.clearInterval(timer)
  }, [sessionId])
  async function control(action: 'start' | 'end_voting' | 'next' | 'close') {
    if (!session || busy) return
    setBusy(true)
    setError('')
    try {
      setSession(await groupSessionService.control(session.sessionId, action))
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to update the session.',
      )
    } finally {
      setBusy(false)
    }
  }
  if (busy) {
    return (
      <PageSection title="Host a Group" eyebrow="Facilitator">
        <p role="status">Loading session…</p>
      </PageSection>
    )
  }

  if (!session) {
    return (
      <section className="group-page" aria-labelledby="page-heading">
        <div className="group-setup-grid">
          <aside className="group-guide" aria-labelledby="group-guide-heading">
            <p className="group-kicker">Facilitator guide</p>
            <h2 id="group-guide-heading">How group play works</h2>
            <ol className="group-steps">
              <li>
                <strong>Share one session code</strong>
                <p>Participants use the code to join this group.</p>
              </li>
              <li>
                <strong>Choose a perspective</strong>
                <p>Each participant chooses their own household and support.</p>
              </li>
              <li>
                <strong>Make space to reflect</strong>
                <p>Advance after everyone has reviewed their outcome.</p>
              </li>
            </ol>
          </aside>
          <div className="group-card group-card--setup">
            <span className="group-emblem" aria-hidden="true">
              ✦
            </span>
            <p className="group-kicker">Host a group</p>
            <h1 id="page-heading" tabIndex={-1}>
              Make room for conversation.
            </h1>
            <p className="group-lead">
              Create a session, invite your group, and guide the experience one
              choice at a time.
            </p>
            <form
              className="group-form"
              onSubmit={(event) => {
                event.preventDefault()
                void load(true)
              }}
            >
              <SelectField
                label="Decision duration"
                value={duration}
                onChange={(event) =>
                  setDuration(Number(event.target.value) as DecisionDuration)
                }
              >
                <option value={30}>30 seconds per decision</option>
                <option value={60}>60 seconds per decision</option>
                <option value={90}>90 seconds per decision</option>
                <option value={120}>2 minutes per decision</option>
              </SelectField>
              <SelectField
                label="CAC support"
                value={cacSupport ? 'with' : 'without'}
                onChange={(event) =>
                  setCacSupport(event.target.value === 'with')
                }
              >
                <option value="without">Play without CAC support</option>
                <option value="with">Play with CAC support</option>
              </SelectField>
              <div className="group-callout">
                <strong>Readiness assumption</strong>
                <p>
                  All joined participants must be ready before the facilitator
                  starts. The timer applies to decisions, not outcome reading.
                </p>
              </div>
              {error && <p role="alert">{error}</p>}
              <Button type="submit" loading={busy} fullWidth>
                Create group session →
              </Button>
            </form>
            <div className="group-actions">
              {error && (
                <Button variant="secondary" onClick={() => load(false)}>
                  Retry restoration
                </Button>
              )}
              <ButtonLink to={paths.home} variant="text">
                Back to home
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (session.roundState !== 'lobby') {
    const question = session.question
    return (
      <GroupScenarioShell session={session} role="host">
        <section
          className="group-scenario-content"
          aria-labelledby="page-heading"
        >
          <span className="group-badge">
            Host · {session.joinCode} · {session.voteCount}/
            {session.participantCount} voted
          </span>
          {session.roundState === 'completed' ? (
            <>
              <h1 id="page-heading">Group session complete</h1>
              <p>Voting has ended for this session.</p>
            </>
          ) : (
            <>
              <p className="placeholder-label">
                {session.roundType !== 'scenario'
                  ? 'Before Day 1 · Employment'
                  : `Day ${session.currentDay} of 30`}
              </p>
              {session.roundType !== 'scenario' ? (
                <GroupEmploymentRound session={session} />
              ) : (
                <>
                  <h1 id="page-heading">{question?.title}</h1>
                  <p className="group-lead">{question?.description}</p>
                  <div className="group-vote-options group-decision-cards">
                    {question?.choices.map((choice) => (
                      <div
                        className="employment-choice group-result"
                        key={choice.choiceId}
                      >
                        <strong>{choice.text}</strong>
                        {choice.voteCount !== null && (
                          <span>{choice.voteCount} votes</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {session.roundState === 'voting' && !session.acceptingVotes && (
                <p role="status">
                  The decision timer has ended. Close voting to show results.
                </p>
              )}
            </>
          )}
          {error && <p role="alert">{error}</p>}
          <div className="employment-actions group-scenario-actions">
            {session.roundState === 'voting' && (
              <Button loading={busy} onClick={() => control('end_voting')}>
                End voting
              </Button>
            )}
            {session.roundState === 'results' && (
              <Button loading={busy} onClick={() => control('next')}>
                {session.roundType === 'job'
                  ? 'Continue to clothing decision'
                  : session.roundType === 'preparation'
                    ? 'Continue to job board'
                    : session.roundType === 'clothing'
                      ? session.employmentStage === 'interview-result'
                        ? session.interviewHired
                          ? 'Start Day 1'
                          : 'Search open jobs'
                        : 'Show interview result'
                      : session.currentDay === 30
                        ? 'Finish month'
                        : `Continue to Day ${session.currentDay + 1}`}
              </Button>
            )}
            {session.roundState !== 'completed' && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => control('close')}
              >
                End group session
              </Button>
            )}
          </div>
        </section>
      </GroupScenarioShell>
    )
  }

  return (
    <section className="group-page" aria-labelledby="page-heading">
      <div className="group-lobby-grid">
        <aside className="group-lobby-stat" aria-label="Session summary">
          <p className="group-kicker">Group session</p>
          <div className="group-stat">
            <span aria-hidden="true">◎</span>
            <p>
              <strong>{session.participantCount}</strong> participants joined
            </p>
          </div>
          <div className="group-stat">
            <span aria-hidden="true">✓</span>
            <p>
              <strong>{session.readyCount}</strong> ready to begin
            </p>
          </div>
        </aside>
        <div className="group-card group-card--lobby">
          <span className="group-badge">Host lobby · {session.joinCode}</span>
          <h1 id="page-heading" tabIndex={-1}>
            Bring your group together.
          </h1>
          <p className="group-lead">
            Participants enter this code from Join a Group.
          </p>
          <div className="group-code">
            <div>
              <span>Session code</span>
              <strong>{session.joinCode}</strong>
            </div>
            <Button variant="text" onClick={copy}>
              {notice === 'Join code copied.' ? 'Code copied' : 'Copy code'}
            </Button>
          </div>
          <span className="sr-only" role="status">
            {notice}
          </span>
          <h2>Participants ({session.participantCount})</h2>
          {!session.participants?.length ? (
            <div className="group-empty">
              <span aria-hidden="true">◎</span>
              <p>Your lobby is open.</p>
              <small>Share the session code to invite participants.</small>
            </div>
          ) : (
            <div
              className="group-roster"
              role="table"
              aria-label="Lobby participants"
            >
              <div className="group-row group-row--head" role="row">
                <span role="columnheader">Participant</span>
                <span role="columnheader">Household</span>
                <span role="columnheader">Status</span>
              </div>
              {session.participants.map((participant) => (
                <div
                  className="group-row"
                  role="row"
                  key={participant.participantId}
                >
                  <strong role="cell">{participant.alias}</strong>
                  <span role="cell">
                    {participant.householdName ?? 'Choosing household'}
                  </span>
                  <span
                    role="cell"
                    className={participant.ready ? 'group-status--ready' : ''}
                  >
                    {participant.ready ? 'Ready' : 'Setting up'}
                  </span>
                </div>
              ))}
            </div>
          )}
          {!!session.householdVotes?.length && (
            <div
              className="group-household-tallies"
              aria-label="Household votes"
            >
              <h2>Household vote</h2>
              {session.householdVotes.map((household) => (
                <p key={household.householdId}>
                  <span>{household.householdName}</span>
                  <strong>{household.voteCount} votes</strong>
                </p>
              ))}
            </div>
          )}
          <div className="group-actions group-actions--lobby">
            <Button
              disabled={
                busy ||
                session.participantCount === 0 ||
                session.readyCount !== session.participantCount
              }
              loading={busy}
              onClick={() => control('start')}
            >
              Start session
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => load(false)}
            >
              Refresh session
            </Button>
            <ButtonLink to={paths.home} variant="text">
              Back to home
            </ButtonLink>
          </div>
        </div>
        <aside className="group-before" aria-labelledby="before-heading">
          <h2 id="before-heading">Before you begin</h2>
          <ol className="group-steps group-steps--compact">
            <li>
              <strong>Join using code</strong>
            </li>
            <li>
              <strong>Choose a household</strong>
            </li>
            <li>
              <strong>Review and wait for host</strong>
            </li>
          </ol>
          <div className="group-timing">
            <h2>Timed decisions</h2>
            <p>
              <strong>{session.decisionDurationSeconds} seconds</strong> per
              decision.
            </p>
            <small>Outcome reading is not timed.</small>
            <p>
              <strong>
                {session.cacSupportEnabled
                  ? 'With CAC support'
                  : 'Without CAC support'}
              </strong>
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
export function JoinPage() {
  const [code, setCode] = useState('')
  const [session, setSession] = useState<GroupSession | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { state: households, retry: retryHouseholds } = useHouseholds()
  async function join() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      setSession(await groupSessionService.join(code))
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to join. Please retry.',
      )
    } finally {
      setBusy(false)
    }
  }
  const sessionId = session?.sessionId
  useEffect(() => {
    if (!sessionId) return
    const timer = window.setInterval(() => {
      void groupSessionService.get(sessionId).then((value) => {
        if (value) setSession(value)
      })
    }, 2000)
    return () => window.clearInterval(timer)
  }, [sessionId])
  async function vote(choiceId: string) {
    if (!session || busy) return
    setBusy(true)
    setError('')
    try {
      setSession(await groupSessionService.vote(session.sessionId, choiceId))
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to record your vote.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function voteJob(jobId: string) {
    if (!session || busy) return
    setBusy(true)
    setError('')
    try {
      setSession(await groupSessionService.voteJob(session.sessionId, jobId))
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to record your job vote.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function voteEmployment(optionId: string) {
    if (!session || busy) return
    setBusy(true)
    setError('')
    try {
      setSession(
        await groupSessionService.voteEmployment(session.sessionId, optionId),
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to record the employment vote.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function updateSetup(householdId: string | null, ready: boolean) {
    if (!session || busy) return
    setBusy(true)
    setError('')
    try {
      setSession(
        await groupSessionService.updateSetup(
          session.sessionId,
          householdId,
          ready,
        ),
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to save your setup.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (session) {
    if (session.roundState !== 'lobby') {
      return (
        <GroupScenarioShell session={session} role="participant">
          <section
            className="group-scenario-content"
            aria-labelledby="page-heading"
          >
            <span className="group-badge">Session {session.joinCode}</span>
            {session.roundState === 'completed' ? (
              <>
                <h1 id="page-heading">Session complete</h1>
                <p>Thanks for taking part in the group discussion.</p>
              </>
            ) : (
              <>
                <p className="placeholder-label">
                  {session.roundType !== 'scenario'
                    ? 'Before Day 1 · Employment'
                    : `Day ${session.currentDay} of 30`}
                </p>
                {session.roundType !== 'scenario' ? (
                  <GroupEmploymentRound
                    session={session}
                    busy={busy}
                    onJobVote={(jobId) => void voteJob(jobId)}
                    onEmploymentVote={(optionId) =>
                      void voteEmployment(optionId)
                    }
                  />
                ) : (
                  <>
                    <h1 id="page-heading">{session.question?.title}</h1>
                    <p className="group-lead">
                      {session.question?.description}
                    </p>
                    <div className="group-vote-options group-decision-cards">
                      {session.question?.choices.map((choice) => (
                        <button
                          type="button"
                          className="employment-choice group-vote-option"
                          key={choice.choiceId}
                          aria-pressed={
                            session.selectedChoiceId === choice.choiceId
                          }
                          disabled={!session.acceptingVotes || busy}
                          onClick={() => void vote(choice.choiceId)}
                        >
                          <strong>
                            {choice.text}
                            {session.selectedChoiceId === choice.choiceId && (
                              <span className="employment-selected">
                                {' '}
                                · Selected
                              </span>
                            )}
                          </strong>
                          {choice.voteCount !== null && (
                            <span>{choice.voteCount} votes</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {session.roundState === 'voting' && (
                  <p role="status">
                    {session.acceptingVotes
                      ? session.roundType !== 'scenario'
                        ? session.selectedJobId ||
                          session.selectedEmploymentOption
                          ? 'Vote recorded. You can change it until voting ends.'
                          : 'Choose the group’s preferred option.'
                        : session.selectedChoiceId
                          ? 'Vote recorded. You can change it until voting ends.'
                          : 'Choose your preferred option.'
                      : 'Voting has ended. Waiting for the facilitator.'}
                  </p>
                )}
                {session.roundState === 'results' && (
                  <p role="status">
                    Results are in. Waiting for the next question.
                  </p>
                )}
              </>
            )}
            {error && <p role="alert">{error}</p>}
          </section>
        </GroupScenarioShell>
      )
    }
    if (!session.ready) {
      return (
        <section className="group-page" aria-labelledby="page-heading">
          <div className="group-card group-card--household">
            <span className="group-badge">Group mode · {session.joinCode}</span>
            <p className="group-kicker">Vote for a household</p>
            <h1 id="page-heading">Every household has a story.</h1>
            <p className="group-lead">
              Choose the household you want the entire group to play. The
              household with the most votes becomes the shared household.
            </p>
            {households.status === 'loading' && <p>Loading households…</p>}
            {households.status === 'error' && (
              <div>
                <p role="alert">{households.message}</p>
                <Button variant="secondary" onClick={retryHouseholds}>
                  Retry loading households
                </Button>
              </div>
            )}
            {households.status === 'empty' && (
              <p>No households have been published yet.</p>
            )}
            {households.status === 'ready' && (
              <HouseholdCarousel
                personas={households.households.personas}
                selectedId={session.householdId}
                onSelect={(id) => void updateSetup(id, false)}
              />
            )}
            {error && <p role="alert">{error}</p>}
            <div className="group-actions">
              <Button
                loading={busy}
                disabled={!session.householdId}
                onClick={() => void updateSetup(session.householdId, true)}
              >
                I’m ready →
              </Button>
            </div>
          </div>
        </section>
      )
    }
    return (
      <section className="group-page" aria-labelledby="page-heading">
        <div className="group-confirmation-grid">
          <aside className="group-confirmation-side">
            <p className="group-kicker">Your group</p>
            <h2>{session.joinCode}</h2>
          </aside>
          <div className="group-card group-card--confirmation" role="status">
            <span
              className="group-emblem group-emblem--ready"
              aria-hidden="true"
            >
              ✓
            </span>
            <p className="group-kicker">Session joined</p>
            <h1 id="page-heading" tabIndex={-1}>
              You’re in. Take a breath.
            </h1>
            <p className="group-lead">
              Waiting for your facilitator to continue the group session.
            </p>
            <p>
              <strong>{session.householdName}</strong> selected. Your household
              locks when gameplay starts.
            </p>
            <div className="group-joined-details">
              <p>
                <span>Session code</span>
                <strong>{session.joinCode}</strong>
              </p>
              <p>
                <span>Decision time</span>
                <strong>{session.decisionDurationSeconds} seconds</strong>
              </p>
            </div>
            <ButtonLink to={paths.home} variant="text">
              Back to home
            </ButtonLink>
            <Button
              variant="text"
              onClick={() => void updateSetup(session.householdId, false)}
            >
              Review or change household
            </Button>
          </div>
          <aside className="group-confirmation-side">
            <h2>A little time to settle in.</h2>
            <p>
              There’s no single right answer. Make space for your household’s
              needs, then reflect on the trade-offs.
            </p>
          </aside>
        </div>
      </section>
    )
  }

  return (
    <section className="group-page" aria-labelledby="page-heading">
      <div className="group-entry-grid">
        <aside className="group-entry-side" aria-labelledby="shared-heading">
          <p className="group-kicker">A shared experience</p>
          <h2 id="shared-heading">
            Different choices.
            <br />
            Room to reflect.
          </h2>
          <p>Explore the same month, at each household’s own pace.</p>
        </aside>
        <div className="group-card group-card--join">
          <span className="group-emblem" aria-hidden="true">
            ✦
          </span>
          <p className="group-kicker">Join a group</p>
          <h1 id="page-heading" tabIndex={-1}>
            Play with a group!
          </h1>
          <p className="group-lead">
            Enter the code shared by your facilitator. You’ll choose your own
            household and support settings next.
          </p>
          <form
            className="group-form"
            onSubmit={(event) => {
              event.preventDefault()
              void join()
            }}
          >
            <TextField
              label="Session code"
              hint="Enter the 12-character code shown by your facilitator."
              value={code}
              required
              maxLength={12}
              placeholder="Enter CAC code"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'group-join-error' : undefined}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
            {error && (
              <p
                id="group-join-error"
                className="group-form-alert"
                role="alert"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              loading={busy}
              disabled={!code.trim()}
              fullWidth
            >
              Join session →
            </Button>
          </form>
          <div className="group-actions">
            <ButtonLink to={paths.home} variant="text">
              Back to home
            </ButtonLink>
          </div>
        </div>
        <aside
          className="group-entry-side"
          aria-labelledby="join-before-heading"
        >
          <h2 id="join-before-heading">Before you begin</h2>
          <ol className="group-steps">
            <li>
              <strong>Bring people together</strong>
              <p>Use the code shared by your facilitator.</p>
            </li>
            <li>
              <strong>Choose a perspective</strong>
              <p>Choose a household and CAC support setting.</p>
            </li>
            <li>
              <strong>Make space to reflect</strong>
              <p>Your facilitator guides the group after each outcome.</p>
            </li>
          </ol>
        </aside>
      </div>
    </section>
  )
}
