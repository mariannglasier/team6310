import { createElement, useEffect, useRef, useState } from "react"
import HouseholdAvatar from "./HouseholdAvatar"
import { householdFixtures } from "./householdFixtures"
import SimulationHeader from "./SimulationHeader"
import SimulationFooter from "./SimulationFooter"
import SetupIcon from "./SetupIcon"
import {
  advanceSession,
  createGameSession,
  getGameChoices,
  getTotals,
  isEmploymentStage,
  persistSession,
  readSession,
  saveChoice,
  type GameSession as Session,
} from "./gameSessionState"
import { gameScenarios } from "./fixtures/gameScenarios"
import { upcomingExpenses } from "./fixtures/gameExpenses"
import { gameImages } from "./fixtures/gameImages"
import { GameButton, GameHeading } from "./GamePrimitives"
import { supportOptions, type SupportId } from "./supportOptions"
import type { ParticipantStatus } from "./groupSessionService"
import EmploymentSequence from "./EmploymentSequence"
import "./setup.css"
import "./setup-flow.css"
import "./game-session.css"

const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
const change = (amount: number) =>
  `${amount < 0 ? "−" : amount > 0 ? "+" : ""}${money(Math.abs(amount))}`
const pause = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms))

export type GroupGameplay = {
  game: Session
  code: string
  status: ParticipantStatus
  seconds: number
  ended: boolean
  onSubmit: (id: string) => void
  onReady: () => void
  onDismissCharges: () => void
  onLearn: () => void
}

export function GroupResults({
  game,
  ended,
  onLearn,
}: {
  game: Session
  ended: boolean
  onLearn: () => void
}) {
  const totals = getTotals(game)
  const decisions = game.ledger.filter((t) => t.id.startsWith("decision:"))
  const completed = game.stage === "complete"
  return (
    <>
      <span className="setup-flow__eyebrow">
        {completed
          ? "All 30 days complete"
          : ended
            ? "Session ended by host"
            : "Your progress"}
      </span>
      <GameHeading level={2}>Every choice has a story.</GameHeading>
      <p className="play-description">
        {completed
          ? "You finished your sample month. Others may still be playing; your own results are available now."
          : `Play stopped on day ${gameScenarios[game.index].day}. This summary includes only committed decisions and financial changes. Unplayed days and unsaved choices are not complete.`}
      </p>
      {completed && ended && (
        <p>
          The host has now ended the group session. Your completed month is
          preserved.
        </p>
      )}
      <div className="play-impact">
        <span>{completed ? "Closing balance" : "Balance so far"}</span>
        <strong>{money(totals.balance)}</strong>
      </div>
      <dl className="group-results-totals">
        <div>
          <dt>Decisions saved</dt>
          <dd>
            {decisions.length} of {gameScenarios.length}
          </dd>
        </div>
        <div>
          <dt>Income received</dt>
          <dd>{money(totals.income)}</dd>
        </div>
        <div>
          <dt>Expenses charged</dt>
          <dd>{money(totals.expenses)}</dd>
        </div>
      </dl>
      <details className="group-details">
        <summary>Your committed decisions</summary>
        {decisions.length ? (
          <ul>
            {decisions.map((t) => (
              <li key={t.id}>
                Day {t.day} · {t.label} · {change(t.amount)}
              </li>
            ))}
          </ul>
        ) : (
          <p>No decisions were saved.</p>
        )}
      </details>
      <GameHeading level={3}>A moment to reflect</GameHeading>
      <ul>
        <li>Which trade-off asked the most of your household?</li>
        <li>How did community support change your options?</li>
        <li>What would you like your community to understand?</li>
      </ul>
      <GameButton onClick={onLearn}>Explore community learning →</GameButton>
    </>
  )
}

function AnimatedBalance({
  value,
  reduced,
}: {
  value: number
  reduced: boolean
}) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)
  useEffect(() => {
    const from = previous.current
    previous.current = value
    if (reduced) {
      setDisplay(value)
      return
    }
    let frame: number
    const start = performance.now()
    const tick = (now: number) => {
      const fraction = Math.min((now - start) / 320, 1)
      setDisplay(Math.round(from + (value - from) * fraction))
      if (fraction < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, reduced])
  return (
    <>
      <span aria-hidden="true">{money(display)}</span>
      <span className="sr-only">{money(value)}</span>
    </>
  )
}

export default function GameSession({
  householdId,
  supportId,
  onReview,
  onLearn,
  onReplayMode,
  group,
}: {
  householdId: string
  supportId: SupportId
  onReview: () => void
  onLearn?: () => void
  onReplayMode?: (mode: SupportId) => void
  group?: GroupGameplay
}) {
  const household = householdFixtures.find((h) => h.id === householdId)!
  const [localSession, setSession] = useState<Session>(() => {
    if (group) return group.game
    const saved = readSession()
    return saved?.householdId === householdId && saved.mode === supportId
      ? saved
      : createGameSession(householdId, supportId)
  })
  const session = group?.game ?? localSession
  const support = supportOptions.find((s) => s.id === session.mode)!
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  const [exiting, setExiting] = useState(false)
  const [entering, setEntering] = useState(true)
  const [endPrompt, setEndPrompt] = useState(false)
  const [endError, setEndError] = useState(false)
  const endButton = useRef<HTMLButtonElement>(null)
  const lock = useRef(false)
  const content = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)
  const scenario = gameScenarios[session.index]
  const employmentStage = isEmploymentStage(session.stage)
  const displayDay = employmentStage
    ? ["job-board", "preparation-fact"].includes(session.stage)
      ? 0
      : ["followup-interview", "followup-result"].includes(session.stage)
        ? 3
        : 2
    : scenario.id === "groceries" && session.jobObtainedDay
      ? session.jobObtainedDay
      : scenario.day
  const choices = getGameChoices(session)
  const chosen = choices.find((c) => c.id === session.selectedId)
  const totals = getTotals(session)
  const upcoming = upcomingExpenses.filter(
    () => !session.ledger.some((entry) => entry.id === "decision:utilities"),
  )
  const busy =
    session.stage === "saving" || session.stage === "advancing" || exiting
  const decision =
    ["browsing", "saving"].includes(session.stage) ||
    (session.stage === "error" && session.errorAction !== "advance")
  const image = gameImages[scenario.id]

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  useEffect(() => {
    if (group) return
    if (readSession()?.id === session.id) return
    try {
      persistSession(session)
    } catch {
      // Let the player choose before showing a retryable decision-save error.
      setEndError(true)
    }
    // Initial persistence only; subsequent writes must succeed before UI confirmation.
  }, [])
  useEffect(() => {
    if (!endPrompt) return
    const background = [
      ...document.querySelectorAll<HTMLElement>(
        "#game-content > :not(.play-end-overlay), .cac-header, .gameplay-site > .cac-footer, .gameplay-site > .cac-footer-notice",
      ),
    ]
    background.forEach((element) => {
      element.inert = true
    })
    return () => {
      background.forEach((element) => {
        element.inert = false
      })
      endButton.current?.focus({ preventScroll: true })
    }
  }, [endPrompt])
  useEffect(() => {
    setEntering(true)
    const timer = window.setTimeout(
      () => setEntering(false),
      reduced ? 0 : decision ? 520 : 300,
    )
    if (firstRender.current) firstRender.current = false
    else if (session.stage !== "saving" && session.stage !== "advancing")
      content.current?.focus({ preventScroll: true })
    return () => window.clearTimeout(timer)
  }, [session.index, session.stage, reduced, decision])
  useEffect(() => {
    if (group) return
    if (session.stage !== "day") return
    let exitTimer: number
    const timer = window.setTimeout(
      () => {
        setExiting(true)
        exitTimer = window.setTimeout(
          () => {
            const next: Session = {
              ...session,
              stage: session.advanceIds.length ? "charges" : "browsing",
            }
            try {
              persistSession(next)
              setSession(next)
            } catch {
              // The already-persisted day/ledger is safe to show and retry on refresh.
              setSession({ ...session, stage: "charges" })
            }
            setExiting(false)
          },
          reduced ? 0 : 240,
        )
      },
      reduced ? 0 : 1000,
    )
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(exitTimer)
    }
  }, [session, reduced])

  async function commit(kind: "save" | "advance", id?: string) {
    if (group) {
      if (kind === "save" && id) group.onSubmit(id)
      else if (kind === "advance") group.onReady()
      return
    }
    if (lock.current || entering || busy) return
    lock.current = true
    setEndError(false)
    const selected = { ...session, selectedId: id || session.selectedId }
    const pending: Session = {
      ...selected,
      stage: kind === "save" ? "saving" : "advancing",
      errorAction: kind,
    }
    try {
      persistSession(pending)
      setSession(pending)
      if (kind === "save") await pause(650)
      const next =
        kind === "save" ? saveChoice(selected) : advanceSession(selected)
      // Financial state is confirmed only once the complete snapshot is written.
      persistSession(next)
      setExiting(true)
      await pause(reduced ? 0 : 240)
      setSession(next)
    } catch {
      const failed: Session = { ...selected, stage: "error", errorAction: kind }
      try {
        persistSession(failed)
      } catch {
        /* Retain the selected choice in memory. */
      }
      setSession(failed)
    } finally {
      setExiting(false)
      lock.current = false
    }
  }
  async function dismissCharges() {
    if (group) {
      group.onDismissCharges()
      return
    }
    if (lock.current || entering) return
    lock.current = true
    setEndError(false)
    setExiting(true)
    await pause(reduced ? 0 : 240)
    const next: Session = { ...session, stage: "browsing", advanceIds: [] }
    try {
      persistSession(next)
      setSession(next)
    } catch {
      setEndError(true)
    }
    setExiting(false)
    lock.current = false
  }
  function updateEmployment(next: Session) {
    try {
      persistSession(next)
      setSession(next)
    } catch {
      setEndError(true)
    }
  }
  function replay(mode: SupportId) {
    const next = createGameSession(householdId, mode)
    try {
      persistSession(next)
      onReplayMode?.(mode)
      setSession(next)
    } catch {
      setEndError(true)
    }
  }

  return (
    <div
      className={`setup-site setup-site--simulation gameplay-site${
        group ? " group-gameplay" : ""
      }`}
    >
      <SimulationHeader contentId="game-content" />
      <main
        id="game-content"
        className="setup-main setup-main--simulation setup-flow game-session"
      >
        <div className="play-top">
          <div>
            <GameHeading level={1}>
              {displayDay === 0 ? "Before Day 1" : `Day ${displayDay} of 30`}
            </GameHeading>
            <span className="play-top-caption">One choice at a time.</span>
          </div>
          {group && (
            <span className="group-badge">Group mode · {group.code}</span>
          )}
        </div>
        <ol className="play-timeline" aria-label="30-day month progress">
          {Array.from({ length: 30 }, (_, index) => {
            const day = index + 1
            const completed = day < displayDay || session.stage === "complete"
            return (
              <li
                key={day}
                className={
                  completed && !(group?.ended && day > scenario.day)
                    ? "is-complete"
                    : day === displayDay
                      ? "is-current"
                      : ""
                }
                aria-current={
                  !completed && day === displayDay ? "step" : undefined
                }
              >
                <span>{day}</span>
                <span className="sr-only">
                  {completed
                    ? group && session.stage !== "complete"
                      ? " — earlier in the month"
                      : " — completed"
                    : day === displayDay
                      ? " — current day"
                      : " — ahead"}
                </span>
              </li>
            )
          })}
        </ol>
        <div className="play-layout">
          <aside
            className="play-sidebar"
            aria-label="Household and month overview"
          >
            <section className="play-panel play-household-panel">
              <span className="setup-flow__label">Your household</span>
              <div className="play-household">
                <span
                  className={`setup-mini-avatar household-photo--${household.photoTone}`}
                >
                  <HouseholdAvatar householdId={household.id} />
                </span>
                <div>
                  <GameHeading>{household.name}</GameHeading>
                  <p>{household.composition}</p>
                </div>
              </div>
              <p>{household.incomeDescription}</p>
              <div className="play-mode">
                <SetupIcon
                  kind={session.mode === "with-cac" ? "support" : "independent"}
                />
                <strong>{support.label}</strong>
              </div>
              <small>Household and support mode are fixed during play.</small>
            </section>
            <section className="play-panel play-money-panel">
              <div className="play-status">
                <span className="setup-flow__label">Current balance</span>
                <strong aria-live="polite">
                  <AnimatedBalance value={totals.balance} reduced={reduced} />
                </strong>
              </div>
              <dl className="play-totals">
                <div>
                  <dt>Starting balance</dt>
                  <dd>{money(session.startingBalance)}</dd>
                </div>
                <div>
                  <dt>Total income received</dt>
                  <dd>{money(totals.income)}</dd>
                </div>
                <div>
                  <dt>Total expenses charged</dt>
                  <dd>{money(totals.expenses)}</dd>
                </div>
              </dl>
            </section>
          </aside>
          <div className="play-main">
            <section
              className="play-box"
              aria-label="Current simulation stage"
              aria-busy={busy}
            >
              <div className="play-box-bar">
                <span>
                  {group ? "YOUR GROUP EXPERIENCE" : "YOUR SIMULATION"}
                </span>
                {group && (
                  <span
                    className="group-timer"
                    role="timer"
                    aria-label={
                      group.ended || group.status !== "deciding"
                        ? "Decision timer stopped"
                        : `Decision time remaining: ${group.seconds} seconds`
                    }
                  >
                    <SetupIcon kind="calendar" />
                    {group.status === "deciding" && !group.ended
                      ? `Time remaining ${Math.floor(group.seconds / 60)}:${String(group.seconds % 60).padStart(2, "0")}`
                      : group.status === "saving" && !group.ended
                        ? "Saving decision…"
                        : "Decision timer stopped"}
                  </span>
                )}
              </div>
              <div
                ref={content}
                tabIndex={-1}
                className={`play-content${exiting ? " is-exiting" : ""}`}
                key={`${session.index}-${
                  decision
                    ? "decision"
                    : session.stage === "advancing" ||
                        (session.stage === "error" &&
                          session.errorAction === "advance")
                      ? "consequence"
                      : session.stage
                }`}
              >
                {employmentStage && !group ? (
                  <EmploymentSequence
                    session={session}
                    onChange={updateEmployment}
                  />
                ) : group?.ended || session.stage === "complete" ? (
                  group ? (
                    <GroupResults
                      game={session}
                      ended={group.ended}
                      onLearn={group.onLearn}
                    />
                  ) : (
                    <div className="play-finish">
                      <span className="play-confirmed">
                        <SetupIcon kind="check" />
                        Sample month complete
                      </span>
                      <GameHeading level={2}>
                        {totals.balance >= 0
                          ? "You made it through the month."
                          : "You reached the end of the month."}
                      </GameHeading>
                      <p className="play-description">
                        You navigated real trade-offs with a closing balance of{" "}
                        <strong>{money(totals.balance)}</strong>. A balance
                        cannot capture all the time, energy, and care behind
                        those decisions.
                      </p>
                      <div className="play-finish-heading">
                        <span className="setup-flow__eyebrow">
                          What comes next
                        </span>
                        <GameHeading level={3}>
                          Turn understanding into action.
                        </GameHeading>
                      </div>
                      <div className="play-action-grid">
                        <section>
                          <span>01</span>
                          <GameHeading level={3}>Support CAC</GameHeading>
                          <p>
                            Help neighbors access essential assistance and
                            pathways toward stability.
                          </p>
                          {createElement(
                            "a",
                            {
                              className: "setup-continue",
                              href: "https://ourcac.org/donate-online/",
                            },
                            "Donate to CAC",
                          )}
                        </section>
                        <section>
                          <span>02</span>
                          <GameHeading level={3}>Learn more</GameHeading>
                          <p>
                            Visit Community Assistance Center to learn about
                            services and impact.
                          </p>
                          {createElement(
                            "a",
                            {
                              className: "setup-continue",
                              href: "https://ourcac.org/",
                            },
                            "Visit CAC Site",
                          )}
                        </section>
                        <section>
                          <span>03</span>
                          <GameHeading level={3}>Explore the data</GameHeading>
                          <p>
                            Compare this outcome with players, groups, and
                            real-life data.
                          </p>
                          <GameButton onClick={onLearn}>
                            View Data Visualization
                          </GameButton>
                        </section>
                      </div>
                      <div className="play-replay-actions">
                        <GameButton onClick={() => replay(session.mode)}>
                          Replay Same Scenario
                        </GameButton>
                        <GameButton
                          variant="text"
                          onClick={() =>
                            replay(
                              session.mode === "with-cac"
                                ? "without-cac"
                                : "with-cac",
                            )
                          }
                        >
                          {session.mode === "with-cac"
                            ? "Replay Without CAC Assistance"
                            : "Replay With CAC Assistance"}
                        </GameButton>
                        <GameButton variant="text" onClick={onReview}>
                          Return Home
                        </GameButton>
                      </div>
                    </div>
                  )
                ) : group?.status === "timed out" ? (
                  <div role="status">
                    <span className="setup-flow__eyebrow">
                      Decision window closed
                    </span>
                    <GameHeading level={2}>
                      Time expired—waiting for host.
                    </GameHeading>
                    <p className="play-description">
                      No choice was saved. No outcome or financial penalty has
                      been applied.
                    </p>
                    <p className="play-hint">
                      Unresolved product rule: how a host resolves a timeout has
                      not been defined. This prototype does not choose or
                      advance for you.
                    </p>
                  </div>
                ) : decision ? (
                  <>
                    <div className="play-intro">
                      <span className="setup-flow__eyebrow">
                        {scenario.category}
                      </span>
                      <GameHeading level={2}>{scenario.title}</GameHeading>
                      <p className="play-description">{scenario.description}</p>
                    </div>
                    {image && (
                      <img
                        className="play-scenario-image"
                        src={image.src}
                        alt={image.alt}
                      />
                    )}
                    <div
                      className="play-choices"
                      role="group"
                      aria-label="Choose your next step"
                    >
                      {choices.map((choice) => (
                        <GameButton
                          key={choice.id}
                          variant="choice"
                          className={
                            session.selectedId === choice.id
                              ? "is-selected"
                              : ""
                          }
                          disabled={
                            busy || entering || session.stage === "error"
                          }
                          aria-pressed={session.selectedId === choice.id}
                          onClick={() => commit("save", choice.id)}
                        >
                          <span className="play-choice-copy">
                            <strong>{choice.title}</strong>
                            <span>{choice.description}</span>
                          </span>
                          <strong className="play-choice-cost">
                            {choice.amount === 0
                              ? "No cost"
                              : money(-choice.amount)}
                          </strong>
                          <span
                            className="play-choice-arrow"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </GameButton>
                      ))}
                    </div>
                    {session.stage === "saving" ? (
                      <p className="play-saving" role="status">
                        <span className="play-saving-dot" />
                        Saving your decision…
                      </p>
                    ) : (
                      session.stage !== "error" && (
                        <p className="play-hint">
                          Choose an option to commit. There’s no single right
                          answer.
                        </p>
                      )
                    )}
                  </>
                ) : session.stage === "day" ? (
                  <div className="play-interlude" role="status">
                    <SetupIcon kind="calendar" />
                    <span className="setup-flow__eyebrow">
                      A little further into your month
                    </span>
                    <GameHeading level={2}>Day {scenario.day}</GameHeading>
                    <p>A new day. A new set of priorities.</p>
                  </div>
                ) : session.stage === "charges" ? (
                  <>
                    <span className="setup-flow__eyebrow">
                      Your budget, brought up to date
                    </span>
                    <GameHeading level={2}>Life keeps moving.</GameHeading>
                    <p className="play-description">
                      These scheduled transactions have been applied once as you
                      moved to Day {displayDay}.
                    </p>
                    <ul className="play-transactions play-receipt">
                      {session.ledger
                        .filter((t) => session.advanceIds.includes(t.id))
                        .map((t) => (
                          <li key={t.id}>
                            <span>
                              {t.label}
                              <small>
                                Day {t.day} ·{" "}
                                {t.amount < 0 ? "Charged" : "Received"}
                              </small>
                            </span>
                            <strong>{change(t.amount)}</strong>
                          </li>
                        ))}
                    </ul>
                    <p className="play-hint">
                      Your balance and totals already include these
                      transactions.
                    </p>
                    <div className="play-actions">
                      <GameButton
                        disabled={entering || exiting}
                        onClick={dismissCharges}
                      >
                        Continue your month <span aria-hidden="true">›</span>
                      </GameButton>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="play-outcome">
                      <div>
                        <span className="setup-flow__eyebrow">
                          {scenario.category}
                        </span>
                        <GameHeading level={2}>{chosen?.title}</GameHeading>
                        <p className="play-description">{chosen?.outcome}</p>
                        <div
                          className={`play-impact${
                            chosen?.amount ? " play-impact--charged" : ""
                          }`}
                        >
                          <strong>{change(chosen?.amount || 0)}</strong>
                          <small>
                            {chosen?.amount
                              ? "Charged to your balance"
                              : "No change to your balance"}
                          </small>
                        </div>
                      </div>
                      <aside
                        className="play-receipt"
                        aria-label="Your choice summary"
                      >
                        <SetupIcon kind="wallet" />
                        <strong>{chosen?.category}</strong>
                        <small>Day {displayDay}</small>
                        <p>{chosen?.title}</p>
                        <div className="play-receipt-total">
                          <span>{chosen?.amount ? "CHARGED" : "CHANGE"}</span>
                          <strong>{change(chosen?.amount || 0)}</strong>
                        </div>
                      </aside>
                    </div>
                    {scenario.outcomeFacts && (
                      <section
                        className="play-facts"
                        aria-label="Community facts connected to this decision"
                      >
                        {scenario.outcomeFacts
                          .filter(
                            (fact) =>
                              !fact.supportOnly || session.mode === "with-cac",
                          )
                          .map((fact) => (
                            <article
                              key={fact.label}
                              className={
                                fact.supportOnly ? "play-fact--cac" : undefined
                              }
                            >
                              <span className="setup-flow__label">
                                {fact.label}
                              </span>
                              <strong>{fact.value}</strong>
                              <p>{fact.detail}</p>
                            </article>
                          ))}
                      </section>
                    )}
                    {scenario.comparison && (
                      <section className="play-comparison">
                        <span className="setup-flow__label">
                          For comparison · Approved context
                        </span>
                        <p>{scenario.comparison.text}</p>
                        <small>
                          Source: {scenario.comparison.source} · Date:{" "}
                          {scenario.comparison.date} · Geography:{" "}
                          {scenario.comparison.geography} · Unit:{" "}
                          {scenario.comparison.unit}
                        </small>
                      </section>
                    )}
                    <div className="play-actions">
                      {group && (
                        <span>
                          {group.status === "ready to advance"
                            ? "Waiting for your host"
                            : "Read your outcome. Your decision timer is stopped."}
                        </span>
                      )}
                      <GameButton
                        disabled={
                          busy ||
                          entering ||
                          session.stage === "error" ||
                          group?.status === "ready to advance"
                        }
                        onClick={() => commit("advance")}
                      >
                        {group
                          ? group.status === "ready to advance"
                            ? "Waiting for your host"
                            : "Ready to continue"
                          : session.stage === "advancing"
                            ? "Moving ahead…"
                            : "Continue your month"}
                        <span aria-hidden="true">›</span>
                      </GameButton>
                    </div>
                  </>
                )}
                {session.stage === "error" && (
                  <div className="play-error" role="alert">
                    <strong>We couldn’t save your progress.</strong>
                    <p>
                      Your choice is still here. No new transaction has been
                      confirmed. Check that browser storage is available, then
                      retry.
                    </p>
                    <GameButton
                      disabled={entering || busy}
                      onClick={() => commit(session.errorAction || "save")}
                    >
                      Retry
                    </GameButton>
                  </div>
                )}
                {endError && (
                  <p className="play-error" role="alert">
                    Browser storage isn’t available. Your current progress is
                    still on this screen. Please try again.
                  </p>
                )}
              </div>
            </section>
            {group && (
              <p className="group-game-note">
                {group.ended
                  ? "The session is closed. Your committed progress is preserved; no further choices or timers are running."
                  : session.stage === "complete"
                    ? "Your sample month is complete. Your own results remain available while others continue."
                    : "After your choice, review the outcome and wait for the host to advance you. Household and support settings are locked."}
              </p>
            )}
          </div>
          <aside
            className="play-right"
            aria-label="Upcoming expenses and contextual assistance"
          >
            <section className="play-panel">
              <GameHeading>
                {group?.ended ? "Not charged" : "Coming up"}
              </GameHeading>
              <span className="setup-flow__label">
                Upcoming scheduled expenses
              </span>
              {upcoming.length ? (
                <ul className="play-upcoming">
                  {upcoming.map((expense) => (
                    <li key={expense.id}>
                      <span
                        className={`play-bill-icon play-bill-icon--${expense.id.split("-")[0]}`}
                      >
                        <SetupIcon
                          kind={
                            expense.id.startsWith("housing")
                              ? "support"
                              : "calendar"
                          }
                        />
                      </span>
                      <div>
                        <small>Day {expense.day}</small>
                        <strong>{expense.label}</strong>
                      </div>
                      <span>{money(-expense.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="play-none">No scheduled expenses remaining.</p>
              )}
              <small>
                {group?.ended
                  ? "Unplayed scheduled expenses were not applied."
                  : "Not yet charged. Not included in your expenses."}
              </small>
            </section>
            {!employmentStage &&
              session.mode === "with-cac" &&
              scenario.assistance && (
                <section
                  className="play-assistance"
                  aria-label="Contextual CAC assistance"
                >
                  <SetupIcon kind="support" />
                  <div>
                    <GameHeading level={3}>CAC assistance</GameHeading>
                    <p>{scenario.assistance}</p>
                    {scenario.id !== "groceries" && (
                      <small>An option to consider · Sample support</small>
                    )}
                  </div>
                </section>
              )}
          </aside>
        </div>
        {!group && session.stage !== "complete" && (
          <GameButton
            ref={endButton}
            variant="text"
            className="play-end-button text-(--surface)! bg-(--error)!"
            disabled={busy}
            onClick={() => setEndPrompt(true)}
          >
            End simulation
          </GameButton>
        )}
        {endPrompt && (
          <div className="play-end-overlay">
            <section
              className="play-end-prompt"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="end-title"
              aria-describedby="end-description"
              onKeyDown={(event) => {
                if (event.key === "Escape") setEndPrompt(false)
                if (event.key === "Tab") {
                  const buttons =
                    event.currentTarget.querySelectorAll<HTMLButtonElement>(
                      "button",
                    )
                  const first = buttons[0]
                  const last = buttons[buttons.length - 1]
                  if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault()
                    last.focus()
                  } else if (
                    !event.shiftKey &&
                    document.activeElement === last
                  ) {
                    event.preventDefault()
                    first.focus()
                  }
                }
              }}
            >
              <GameHeading id="end-title">End this simulation?</GameHeading>
              <p id="end-description">
                This will clear this sample month’s progress and return you to
                the landing page. Your household and support selections will
                remain.
              </p>
              <div className="play-end-actions">
                <GameButton
                  autoFocus
                  variant="text"
                  onClick={() => setEndPrompt(false)}
                >
                  Keep playing
                </GameButton>
                <GameButton
                  onClick={() => {
                    try {
                      localStorage.removeItem("cac-gameplay-v2")
                      onReview()
                    } catch {
                      setEndError(true)
                      setEndPrompt(false)
                    }
                  }}
                >
                  End simulation
                </GameButton>
              </div>
            </section>
          </div>
        )}
      </main>
      <SimulationFooter />
    </div>
  )
}
