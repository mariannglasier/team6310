import { useEffect, useRef, useState, type ReactNode } from "react"
import HouseholdSelection from "./HouseholdSelection"
import SetupSupport from "./SetupSupport"
import SetupReview from "./SetupReview"
import SimulationHeader from "./SimulationHeader"
import SimulationFooter from "./SimulationFooter"
import { HomeNavigationContext } from "./HomeLink"
import { NavigationContext } from "./NavigationContext"
import SetupIcon from "./SetupIcon"
import GameSession from "./GameSession"
import {
  GameButton,
  GameHeading,
  GameInput,
  GameSelect,
} from "./GamePrimitives"
import { gameScenarios } from "./fixtures/gameScenarios"
import * as service from "./groupSessionService"
import "./setup.css"
import "./setup-flow.css"
import "./game-session.css"
import "./group-session.css"

function getIdentity() {
  const key = "cac-group-participant-identity"
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}
export function hasGroupView() {
  try {
    const state = service.retrieveState()
    const view = state.view
    return (
      view?.role === "participant" &&
      state.sessions.some(
        (s) =>
          s.id === view.sessionId &&
          s.participants.some((p) => p.id === view.participantId),
      )
    )
  } catch {
    return false
  }
}
function initialState(): service.GroupState {
  try {
    return service.retrieveState()
  } catch {
    return { version: 1, sessions: [], view: null }
  }
}
function Badge({ status }: { status: service.ParticipantStatus }) {
  return (
    <span className={`group-status group-status--${status.replace(/ /g, "-")}`}>
      {["ready", "ready to advance", "completed"].includes(status) && (
        <SetupIcon kind="check" />
      )}
      {status === "setup"
        ? "Choosing setup"
        : status[0].toUpperCase() + status.slice(1)}
    </span>
  )
}
function GroupFrame({
  children,
  left,
  right,
  onHome,
  onLearn,
  toolbar,
}: {
  children: ReactNode
  left?: ReactNode
  right?: ReactNode
  toolbar?: ReactNode
  onHome: () => void
  onLearn: () => void
}) {
  return (
    <div className="setup-site setup-site--simulation gameplay-site group-site">
      <SimulationHeader
        contentId="group-content"
        onNavigate={(item) => {
          if (item === "Learn") onLearn()
        }}
      />
      <main id="group-content" className="group-main game-session">
        <div className="group-layout">
          <aside className="group-side group-side--left">{left}</aside>
          <section className="group-stage">{children}</section>
          <aside className="group-side group-side--right">{right}</aside>
        </div>
        {toolbar}
      </main>
      <SimulationFooter />
    </div>
  )
}

export default function GroupFlow({
  entry,
  onHome,
  onLearn,
  onDonate,
}: {
  entry: "host" | "join" | "current"
  onHome: () => void
  onLearn: (returnToGroup: boolean) => void
  onDonate: (returnToGroup: boolean) => void
}) {
  const [state, setState] = useState(initialState)
  const [form, setForm] = useState<"host" | "join" | null>(() =>
    entry === "current" ? null : entry,
  )
  const [duration, setDuration] = useState(60)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [missingSession, setMissingSession] = useState(false)
  const [showSavedResults, setShowSavedResults] = useState(false)
  const [recoveryError, setRecoveryError] = useState("")
  const [copied, setCopied] = useState(false)
  const [exitDestination, setExitDestination] =
    useState<"end" | "home" | "learn" | "donate" | null>(null)
  const exitTrigger = useRef<HTMLElement | null>(null)
  const [now, setNow] = useState(Date.now())
  const dialog = useRef<HTMLDialogElement>(null)
  const missingDialog = useRef<HTMLDialogElement>(null)
  const codeInput = useRef<HTMLInputElement>(null)
  const view = state.view
  const session = state.sessions.find((s) => s.id === view?.sessionId)
  const participant = session?.participants.find(
    (p) => p.id === view?.participantId,
  )
  const context = `${form}-${showSavedResults}-${view?.role}-${session?.phase}-${participant?.setupStep}-${participant?.status}`
  function run(action: () => service.GroupState) {
    try {
      const next = action()
      setState(next)
      setError("")
      return next
    } catch (reason) {
      if (reason instanceof service.SessionNotFoundError) {
        setForm("join")
        setMissingSession(true)
        setError("")
        return null
      }
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save. Check browser storage and retry.",
      )
      return null
    }
  }
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
      try {
        setState(service.retrieveState())
        setRecoveryError("")
      } catch {
        setRecoveryError(
          "Progress could not be retrieved or saved. Check browser storage and retry; no new financial changes are confirmed.",
        )
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    const main = document.querySelector<HTMLElement>("main")
    if (main) {
      main.tabIndex = -1
      main.focus({ preventScroll: true })
    }
  }, [context])
  useEffect(() => {
    if (exitDestination) dialog.current?.showModal()
    else dialog.current?.close()
  }, [exitDestination])
  useEffect(() => {
    if (
      !form &&
      view?.role === "participant" &&
      session?.phase === "ended" &&
      !showSavedResults
    ) {
      setForm("join")
      setMissingSession(true)
    }
  }, [form, view?.role, session?.phase, showSavedResults])
  useEffect(() => {
    if (missingSession && form === "join") missingDialog.current?.showModal()
    else missingDialog.current?.close()
  }, [missingSession, form])
  const navigate = (
    destination: "home" | "learn" | "donate",
    endedOwnedSession = false,
  ) => {
    if (destination === "home") onHome()
    else if (destination === "donate")
      onDonate(!endedOwnedSession && view?.role === "participant")
    else onLearn(!endedOwnedSession && view?.role === "participant")
  }
  const requestExit = (destination: "end" | "home" | "learn" | "donate") => {
    try {
      if (destination === "end" || service.ownsOpenSession()) {
        exitTrigger.current = (document.activeElement as HTMLElement | null)
        setExitDestination(destination)
      } else navigate(destination)
    } catch {
      setError(
        "Could not read browser storage. Retry before leaving the group.",
      )
    }
  }
  const home = () => requestExit("home")
  const learn = () => requestExit("learn")
  const switchHost = () => {
    if (session)
      run(() => service.setView({ sessionId: session.id, role: "host" }))
  }
  const demoTools = session && (
    <details className="group-demo-tools">
      <summary>Prototype controls · simulated session events</summary>
      <p>
        Single-browser demonstration only. No real cross-device synchronization.
        Sample participants use separate fixture setup; your own choices are
        never simulated.
      </p>
      <div className="group-demo-actions">
        {view?.role === "host" ? (
          <>
            {session.phase === "lobby" && (
              <>
                <GameButton
                  variant="text"
                  onClick={() =>
                    run(() => service.simulateEvent(session.id, "join"))
                  }
                >
                  Simulate 4 arrivals
                </GameButton>
                <GameButton
                  variant="text"
                  onClick={() =>
                    run(() => service.simulateEvent(session.id, "ready"))
                  }
                >
                  Finish sample setups
                </GameButton>
              </>
            )}
            {session.phase === "active" && (
              <>
                <GameButton
                  variant="text"
                  onClick={() =>
                    run(() => service.simulateEvent(session.id, "decisions"))
                  }
                >
                  Simulate next sample event
                </GameButton>
                <GameButton
                  variant="text"
                  onClick={() =>
                    run(() => service.simulateEvent(session.id, "disconnect"))
                  }
                >
                  Toggle sample connection
                </GameButton>
              </>
            )}
            <GameButton
              variant="text"
              onClick={() => {
                setCode(session.code)
                setForm("join")
              }}
            >
              Join as a participant
            </GameButton>
          </>
        ) : (
          <GameButton variant="text" onClick={switchHost}>
            Switch to simulated host
          </GameButton>
        )}
      </div>
      <p>
        Sample events alternate a saved choice, outcome readiness, and
        transaction-notice acknowledgement. They never advance participants; use
        the individual host action.
      </p>
    </details>
  )
  const prototypeNote = (
    <p className="group-prototype-note">
      Prototype · Simulated session · This browser only
    </p>
  )
  const errorNotice = (error || recoveryError) && (
    <div role="alert" className="play-error">
      {error || recoveryError}
    </div>
  )

  function renderContent() {
    if (form)
      return (
        <GroupFrame
          onHome={home}
          onLearn={learn}
          left={
            <>
              <span className="setup-flow__label">A shared experience</span>
              <GameHeading>
                Different choices.
                <br />
                Room to reflect.
              </GameHeading>
              <p>Explore the same month, at each household’s own pace.</p>
            </>
          }
          right={
            <>
              <GameHeading>Before you begin</GameHeading>
              <ol className="group-steps">
                <li>
                  <strong>Bring people together</strong>
                  <p>
                    Share a code. No names or personal financial information
                    needed.
                  </p>
                </li>
                <li>
                  <strong>Choose a perspective</strong>
                  <p>
                    Each participant chooses a household and CAC support
                    setting.
                  </p>
                </li>
                <li>
                  <strong>Make space to reflect</strong>
                  <p>
                    The host advances participants individually, after each
                    outcome.
                  </p>
                </li>
              </ol>
            </>
          }
        >
          <span className="group-emblem">
            <SetupIcon kind="support" />
          </span>
          <span className="setup-flow__eyebrow">
            {form === "host" ? "Host a group" : "Join a group"}
          </span>
          <GameHeading level={1}>
            {form === "host"
              ? "Make room for conversation."
              : "Play with a group!"}
          </GameHeading>
          <p className="play-description">
            {form === "host"
              ? "Create a session, invite your group, and guide the experience one choice at a time."
              : "Enter the code shared by your host. You’ll choose your own household and support settings next."}
          </p>
          <form
            className="group-form"
            onSubmit={(event) => {
              event.preventDefault()
              const next = run(() =>
                form === "host"
                  ? service.createSession(duration)
                  : service.joinSession(code, getIdentity()),
              )
              if (next) {
                setShowSavedResults(false)
                setForm(null)
              }
            }}
          >
            {form === "host" ? (
              <label>
                Decision duration
                <GameSelect
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                >
                  <option value={30}>30 seconds per decision</option>
                  <option value={60}>60 seconds per decision</option>
                  <option value={90}>90 seconds per decision</option>
                  <option value={120}>2 minutes per decision</option>
                </GameSelect>
              </label>
            ) : (
              <label>
                Session code
                <GameInput
                  ref={codeInput}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="Enter CAC code"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase())
                  }
                  aria-invalid={Boolean(error)}
                  aria-describedby="group-join-help"
                />
              </label>
            )}
            {form === "host" ? (
              <div className="group-callout">
                <strong>Readiness assumption · configurable</strong>
                <p>
                  This prototype requires all joined participants to be ready
                  before the host starts. No participant limit is assumed. The
                  timer applies only to decisions, not outcome reading.
                </p>
              </div>
            ) : (
              <p id="group-join-help" className="play-hint">
                Codes work only for sessions created in this browser. An
                existing participant can rejoin without creating a duplicate.
              </p>
            )}
            {errorNotice}
            <GameButton type="submit">
              {form === "host" ? "Create group session" : "Join session"} →
            </GameButton>
          </form>
          {form === "join" && (
            <dialog
              ref={missingDialog}
              className="group-end-dialog"
              aria-labelledby="missing-session-title"
              aria-describedby="missing-session-description"
              onCancel={() => setMissingSession(false)}
              onClose={() => {
                setMissingSession(false)
                codeInput.current?.focus()
                codeInput.current?.select()
              }}
            >
              <GameHeading id="missing-session-title">
                Session does not exist.
              </GameHeading>
              <p id="missing-session-description">
                Check the session code with your host and try again. Sessions
                ended by the host are no longer available to join.
              </p>
              <div className="group-dialog-actions">
                <GameButton autoFocus onClick={() => setMissingSession(false)}>
                  Close
                </GameButton>
              </div>
            </dialog>
          )}
          {form === "join" &&
            view?.role === "participant" &&
            session?.phase === "ended" &&
            participant?.game && (
              <GameButton
                variant="text"
                onClick={() => {
                  setMissingSession(false)
                  setShowSavedResults(true)
                  setForm(null)
                }}
              >
                View your saved progress
              </GameButton>
            )}
          {!(form === "join" && session) && session?.phase !== "ended" && (
            <GameButton
              variant="text"
              onClick={() => {
                if (session) setForm(null)
                else home()
              }}
            >
              {session ? "Return to session" : "Back to Play"}
            </GameButton>
          )}
          {form === "join" && !session && (
            <details className="group-details">
              <summary>Need a sample session?</summary>
              <p>
                Create a local sample lobby, then join with the generated code.
              </p>
              <GameButton
                variant="text"
                onClick={() => {
                  const next = run(() => service.createSession(60))
                  const s = next?.sessions.find(
                    (s) => s.id === next.view?.sessionId,
                  )
                  if (s) {
                    setCode(s.code)
                    run(() => service.simulateEvent(s.id, "join"))
                  }
                }}
              >
                Create sample lobby
              </GameButton>
            </details>
          )}
          {prototypeNote}
        </GroupFrame>
      )

    if (!session || !view)
      return (
        <GroupFrame onHome={home} onLearn={learn}>
          <GameHeading level={1}>Find your group.</GameHeading>
          <p>
            No active group view was found. Create or join a session to
            continue.
          </p>
          {errorNotice}
          <GameButton onClick={() => setForm("join")}>Join a group</GameButton>
          <GameButton variant="text" onClick={() => setForm("host")}>
            Host a group
          </GameButton>
        </GroupFrame>
      )

    if (view.role === "participant" && participant) {
      const p = participant
      const update = (value: Parameters<typeof service.updateSetup>[2]) =>
        run(() => service.updateSetup(session.id, p.id, value))
      const setupBar = (
        <div className="group-setup-bar">
          <span className="group-badge">
            Group mode · {session.code} · {p.alias}
          </span>
          <span>Settings lock when gameplay starts.</span>
          <GameButton variant="text" onClick={switchHost}>
            Prototype: host view
          </GameButton>
        </div>
      )
      if (session.phase === "lobby" && p.status !== "ready") {
        return (
          <div className="setup-site--simulation game-session group-participant-shell">
            {setupBar}
            {errorNotice}
            {p.setupStep === "household" ? (
              <HouseholdSelection
                selectedHouseholdId={p.householdId}
                onSelect={(householdId) => update({ householdId })}
                onBack={() => setForm("join")}
                onContinue={() => update({ setupStep: "support" })}
              />
            ) : p.setupStep === "support" ? (
              <SetupSupport
                selectedHouseholdId={p.householdId}
                selectedSupportId={p.supportId}
                onSelect={(supportId) => update({ supportId })}
                onBack={() => update({ setupStep: "household" })}
                onContinue={() => update({ setupStep: "review" })}
              />
            ) : (
              <SetupReview
                group
                selectedHouseholdId={p.householdId}
                selectedSupportId={p.supportId}
                onBack={() => update({ setupStep: "support" })}
                onEditHousehold={() => update({ setupStep: "household" })}
                onStart={() => run(() => service.markReady(session.id, p.id))}
              />
            )}
          </div>
        )
      }
      if (session.phase !== "lobby" && p.game)
        return (
          <div className="setup-site--simulation game-session group-participant-shell">
            <div className="group-setup-bar">
              {prototypeNote}
              <GameButton variant="text" onClick={switchHost}>
                Prototype: host view
              </GameButton>
              <GameButton variant="text" onClick={home}>
                Return to Play
              </GameButton>
            </div>
            {errorNotice}
            <GameSession
              householdId={p.householdId!}
              supportId={p.supportId!}
              onReview={home}
              group={{
                game: p.game,
                code: session.code,
                status: p.status,
                seconds: Math.max(
                  0,
                  Math.ceil(((p.deadline ?? now) - now) / 1000),
                ),
                ended: session.phase === "ended",
                onSubmit: (id) =>
                  run(() => service.submitChoice(session.id, p.id, id)),
                onReady: () =>
                  run(() => service.markReadyToAdvance(session.id, p.id)),
                onDismissCharges: () =>
                  run(() => service.acknowledgeCharges(session.id, p.id)),
                onLearn: learn,
              }}
            />
          </div>
        )
      return (
        <GroupFrame
          onHome={home}
          onLearn={learn}
          toolbar={demoTools}
          left={
            <>
              <span className="setup-flow__label">Your group</span>
              <GameHeading>{session.code}</GameHeading>
              <p>{p.alias}</p>
            </>
          }
          right={
            <>
              <GameHeading>A little time to settle in.</GameHeading>
              <p>
                There’s no single right answer. Make space for your household’s
                needs, then reflect on the trade-offs.
              </p>
            </>
          }
        >
          <span className="group-emblem">
            <SetupIcon kind="check" />
          </span>
          <span className="setup-flow__eyebrow">Setup confirmed</span>
          <GameHeading level={1}>You’re ready. Take a breath.</GameHeading>
          <p className="play-description" role="status">
            Waiting for your host to start the group session.
          </p>
          <p>
            Household and support settings become locked when gameplay starts.
          </p>
          {session.phase === "lobby" && (
            <GameButton
              variant="text"
              onClick={() => update({ setupStep: "review" })}
            >
              Review or change setup
            </GameButton>
          )}
          {errorNotice}
          {prototypeNote}
        </GroupFrame>
      )
    }

    const ready = session.participants.filter(
      (p) => p.status === "ready",
    ).length
    const readyAdvance = session.participants.filter(
      (p) => p.status === "ready to advance",
    ).length
    const completed = session.participants.filter(
      (p) => p.status === "completed",
    ).length
    const lobby = session.phase === "lobby"
    const ended = session.phase === "ended"
    return (
      <GroupFrame
        onHome={home}
        onLearn={learn}
        toolbar={demoTools}
        left={
          <>
            <span className="setup-flow__label">
              {lobby ? "Group session" : "Session overview"}
            </span>
            <div className="group-stat">
              <span className="group-stat-icon">
                <SetupIcon kind="support" />
              </span>
              <p>
                <strong>{session.participants.length}</strong>participants
                joined
              </p>
            </div>
            <div className="group-stat">
              <span className="group-stat-icon group-stat-icon--green">
                <SetupIcon kind="check" />
              </span>
              <p>
                <strong>{lobby ? ready : readyAdvance}</strong>
                {lobby ? "ready to begin" : "ready to advance"}
              </p>
            </div>
            {!lobby && (
              <div className="group-stat">
                <span className="group-stat-icon">
                  <SetupIcon kind="flag" />
                </span>
                <p>
                  <strong>{completed}</strong>completed
                </p>
              </div>
            )}
          </>
        }
        right={
          lobby ? (
            <>
              <GameHeading>Before you begin</GameHeading>
              <ol className="group-steps">
                <li>
                  <strong>Join using code</strong>
                  <p>Participants enter the code from Join a group.</p>
                </li>
                <li>
                  <strong>Choose household and CAC support</strong>
                  <p>Each participant makes their own selections.</p>
                </li>
                <li>
                  <strong>Review and wait for host</strong>
                  <p>Once everyone is ready, start the session.</p>
                </li>
              </ol>
              <div className="group-side-divider">
                <GameHeading>Timed decisions</GameHeading>
                <p>
                  <strong>{session.duration} seconds</strong> per decision, set
                  in session configuration.
                </p>
                <small>Outcome reading is not timed.</small>
              </div>
            </>
          ) : (
            <>
              <div className="group-side-divider">
                <GameHeading>Debrief prompts</GameHeading>
                <ul>
                  <li>Which trade-off was hardest?</li>
                  <li>How did support affect your options?</li>
                  <li>What might make daily life more manageable?</li>
                </ul>
              </div>
            </>
          )
        }
      >
        <span className="group-badge">
          <SetupIcon kind="support" />
          {lobby ? "Host lobby" : "Host view"} · {session.code}
        </span>
        <GameHeading level={1}>
          {lobby
            ? "Bring your group together."
            : ended
              ? "Space for reflection."
              : "Guide the experience."}
        </GameHeading>
        <p className="play-description">
          {lobby
            ? "Participants enter this code from Join a group."
            : ended
              ? "Session ended by host. Each participant can view a summary of their own completed progress."
              : "Advance participants individually after they finish reviewing their outcome."}
        </p>
        {lobby && (
          <div className="group-code">
            <div>
              <span className="setup-flow__label">Session code</span>
              <strong>{session.code}</strong>
            </div>
            <GameButton
              variant="text"
              className="group-outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(session.code)
                  setCopied(true)
                } catch {
                  setError(
                    "Copy unavailable. Select and copy the session code manually.",
                  )
                }
              }}
            >
              {copied ? "Code copied" : "Copy code"}
              <SetupIcon kind="calendar" />
            </GameButton>
            <span className="sr-only" role="status">
              {copied ? "Session code copied" : ""}
            </span>
          </div>
        )}
        <GameHeading level={2}>
          {lobby
            ? `Participants (${session.participants.length})`
            : "Participant progress"}
        </GameHeading>
        {!session.participants.length ? (
          <div className="group-empty">
            <SetupIcon kind="support" />
            <p>Your lobby is open.</p>
            <small>
              Share the code, or use the prototype controls below to simulate
              arrivals.
            </small>
          </div>
        ) : (
          <div
            className="group-roster"
            role="table"
            aria-label={lobby ? "Lobby participants" : "Participant progress"}
          >
            <div
              className={`group-row group-row--head${
                lobby ? " group-row--lobby" : ""
              }`}
              role="row"
            >
              <span role="columnheader">Participant</span>
              {!lobby && <span role="columnheader">Day</span>}
              <span role="columnheader">Status</span>
              {!lobby && <span role="columnheader">Action</span>}
            </div>
            {session.participants.map((p, index) => (
              <div
                className={`group-row${lobby ? " group-row--lobby" : ""}`}
                key={p.id}
                role="row"
              >
                <div role="cell" className="group-alias">
                  <span className={`group-person group-person--${index % 3}`}>
                    <SetupIcon kind="independent" />
                  </span>
                  <span>
                    <strong>{p.alias}</strong>
                    {p.sample && <small>Simulated participant</small>}
                  </span>
                </div>
                {!lobby && (
                  <span role="cell">
                    {p.game
                      ? `Day ${gameScenarios[p.game.index].day}`
                      : "Not started"}
                  </span>
                )}
                <div role="cell">
                  {ended && p.status !== "completed" ? (
                    <span className="group-status">Play stopped</span>
                  ) : (
                    <Badge status={p.status} />
                  )}
                  {lobby && p.status === "setup" && (
                    <small>
                      {p.setupStep === "household"
                        ? "Choosing household"
                        : p.setupStep === "support"
                          ? "Choosing CAC support"
                          : "Final review"}
                    </small>
                  )}
                </div>
                {!lobby && (
                  <div role="cell">
                    <GameButton
                      disabled={
                        ended ||
                        p.status !== "ready to advance" ||
                        Boolean(p.advanceAt)
                      }
                      className="group-advance"
                      aria-label={`Advance ${p.alias}`}
                      onClick={() =>
                        run(() => service.advanceParticipant(session.id, p.id))
                      }
                    >
                      {ended
                        ? "Session ended"
                        : p.advanceAt
                          ? "Advancing…"
                          : p.status === "ready to advance"
                            ? "Advance participant →"
                            : p.status === "completed"
                              ? "Own recap available"
                              : "Waiting"}
                    </GameButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {errorNotice}
        {lobby ? (
          <>
            <GameButton
              className="group-start"
              disabled={
                !session.participants.length ||
                ready !== session.participants.length
              }
              onClick={() => run(() => service.startSession(session.id))}
            >
              Start group session →
            </GameButton>
            <p className="group-assumption">
              Configurable assumption: all joined participants must be ready to
              start. No participant limit is assumed.
            </p>
          </>
        ) : (
          <p className="play-hint">
            Participants who finish can view their own recap while others
            continue. The host sees progress only, never private financial
            details.
          </p>
        )}
        {!lobby &&
          !ended &&
          session.participants.some((p) => p.status === "timed out") && (
            <div className="group-callout">
              <strong>Timeout resolution is an unresolved product rule.</strong>
              <p>
                No choice, penalty, or automatic advancement is applied. The
                host may end the session; a timeout-resolution policy requires
                product approval.
              </p>
            </div>
          )}
        <div className="group-stage-footer">
          <GameButton variant="text" onClick={home}>
            Return to Play
          </GameButton>
          {!ended ? (
            <GameButton
              variant="text"
              className="group-outline"
              onClick={() => requestExit("end")}
            >
              {lobby ? "Close lobby" : "End session early"}
            </GameButton>
          ) : (
            <GameButton onClick={learn}>Community learning →</GameButton>
          )}
        </div>
        {prototypeNote}
      </GroupFrame>
    )
  }
  return (
    <NavigationContext.Provider
      value={{
        activePage: null,
        navigate: (item) => requestExit(item === "Learn" ? "learn" : "donate"),
      }}
    >
      <HomeNavigationContext.Provider value={home}>
        {renderContent()}
        <div className="setup-site setup-site--simulation game-session group-dialog-scope">
          <dialog
            ref={dialog}
            className="group-end-dialog"
            aria-labelledby="group-end-title"
            aria-describedby="group-end-description"
            onCancel={() => setExitDestination(null)}
            onClose={() => {
              setExitDestination(null)
              exitTrigger.current?.focus()
            }}
          >
            <GameHeading id="group-end-title">
              {exitDestination === "learn"
                ? "End this session and explore learning?"
                : exitDestination === "donate"
                  ? "End this session and explore giving?"
                  : exitDestination === "home"
                    ? "End this session and return to Play?"
                    : "End this session for everyone?"}
            </GameHeading>
            <p id="group-end-description">
              This stops play, new choices, and timers for every participant.
              Already-saved decisions, financial changes, and personal results
              are preserved. Leaving ends the session for everyone; it cannot be
              resumed.
            </p>
            {errorNotice}
            <div className="group-dialog-actions">
              <GameButton
                variant="text"
                autoFocus
                onClick={() => setExitDestination(null)}
              >
                Keep session open
              </GameButton>
              <GameButton
                onClick={() => {
                  const destination = exitDestination
                  if (!destination) return
                  const next = run(() =>
                    destination === "end" && session
                      ? service.endSession(session.id)
                      : service.endHostedSessions(),
                  )
                  if (!next) return
                  setExitDestination(null)
                  if (destination !== "end") navigate(destination, true)
                }}
              >
                {exitDestination === "end"
                  ? "End for everyone"
                  : "End session and leave"}
              </GameButton>
            </div>
          </dialog>
        </div>
      </HomeNavigationContext.Provider>
    </NavigationContext.Provider>
  )
}
