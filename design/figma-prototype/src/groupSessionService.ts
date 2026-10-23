import {
  advanceSession,
  createGameSession,
  getGameChoices,
  saveChoice,
  type GameSession,
} from "./gameSessionState"
import { gameScenarios } from "./fixtures/gameScenarios"
import { householdFixtures } from "./householdFixtures"
import type { SupportId } from "./supportOptions"

export const GROUP_KEY = "cac-group-prototype-v1"
export const CONTENT_VERSION = "approved-sample-month-v2"
export type ParticipantStatus = "setup" | "ready" | "deciding" | "saving" | "reviewing outcome" | "ready to advance" | "timed out" | "disconnected" | "completed"
export type Participant = {
  id: string
  alias: string
  sample: boolean
  setupStep: "household" | "support" | "review"
  householdId: string | null
  supportId: SupportId | null
  status: ParticipantStatus
  game: GameSession | null
  deadline: number | null
  saveAt?: number
  advanceAt?: number
  previousStatus?: ParticipantStatus
}
export type GroupSession = {
  id: string
  hostDocumentId?: string
  code: string
  contentVersion: string
  phase: "lobby" | "active" | "ended"
  duration: number
  participants: Participant[]
}
export type GroupView = {
  sessionId: string
  role: "host" | "participant"
  participantId?: string
}
export type GroupState = {
  version: 1
  sessions: GroupSession[]
  view: GroupView | null
}
const empty = (): GroupState => ({ version: 1, sessions: [], view: null })
const hostDocumentId = crypto.randomUUID()
let documentInitialized = false
let closeCurrentDocument = false

function loadCommitted(): GroupState {
  const value = localStorage.getItem(GROUP_KEY)
  if (!value) return empty()
  const parsed = JSON.parse(value) as GroupState
  if (parsed.version !== 1 || !Array.isArray(parsed.sessions))
    throw new Error(
      "This saved prototype is unavailable. Browser data may be from another version.",
    )
  return parsed
}
function load(): GroupState {
  initializeGroupDocument()
  return loadCommitted()
}
function write(state: GroupState) {
  // Publish a single snapshot only after the storage write succeeds.
  localStorage.setItem(GROUP_KEY, JSON.stringify(state))
  return state
}
function closeSession(session: GroupSession) {
  session.phase = "ended"
  for (const p of session.participants) {
    p.deadline = null
    p.saveAt = undefined
    p.advanceAt = undefined
  }
}
function closeMatchingSessions(
  state: GroupState,
  matches: (session: GroupSession) => boolean,
) {
  let changed = false
  for (const session of state.sessions) {
    if (session.phase !== "ended" && matches(session)) {
      closeSession(session)
      changed = true
    }
  }
  if (
    state.view?.role === "host" &&
    state.sessions.some((s) => s.id === state.view?.sessionId && s.phase === "ended")
  ) {
    state.view = null
    changed = true
  }
  return changed ? write(state) : state
}
export function initializeGroupDocument() {
  if (documentInitialized) return
  // Read committed data before recovery can finish an abandoned save/advance.
  closeMatchingSessions(
    loadCommitted(),
    (s) => closeCurrentDocument || s.hostDocumentId !== hostDocumentId,
  )
  documentInitialized = true
  closeCurrentDocument = false
}
export function endGroupDocument() {
  // Retain the closure gate if pagehide persistence fails and this page is cached.
  closeCurrentDocument = true
  documentInitialized = false
  initializeGroupDocument()
}
export function ownsOpenSession() {
  // Used by beforeunload: inspection must never initialize, recover, or write.
  return loadCommitted().sessions.some(
    (s) => s.hostDocumentId === hostDocumentId && s.phase !== "ended",
  )
}
export function endHostedSessions() {
  return closeMatchingSessions(load(), (s) => s.hostDocumentId === hostDocumentId)
}
function sessionIn(state: GroupState, id: string) {
  const session = state.sessions.find((s) => s.id === id)
  if (!session)
    throw new Error("Session unavailable. Ask your host to check the code.")
  if (session.contentVersion !== CONTENT_VERSION)
    throw new Error("Session content is unavailable in this prototype version.")
  return session
}
function personIn(session: GroupSession, id: string) {
  const person = session.participants.find((p) => p.id === id)
  if (!person)
    throw new Error("Participant unavailable. Rejoin with your session code.")
  return person
}
function active(session: GroupSession) {
  if (session.phase !== "active")
    throw new Error("This session is not open for gameplay.")
}
function beginDecision(p: Participant, duration: number, now: number) {
  p.status = "deciding"
  p.deadline = now + duration * 1000
}
function finishAdvance(p: Participant, duration: number, now: number) {
  if (!p.game) return
  p.game = advanceSession(p.game)
  p.advanceAt = undefined
  p.deadline = null
  if (p.game.stage === "complete") p.status = "completed"
  else if (p.game.stage === "day" && !p.game.advanceIds.length) {
    // Keep the existing scenario schedule; days without decisions are not new content.
    p.game.stage = "browsing"
    beginDecision(p, duration, now)
  } else {
    p.game.stage = "charges"
    p.status = "reviewing outcome"
  }
}
export function retrieveState(now = Date.now()): GroupState {
  const state = load()
  let changed = false
  for (const session of state.sessions) {
    if (session.phase !== "active") continue
    for (const p of session.participants) {
      if (p.status === "saving" && p.saveAt && p.saveAt <= now && p.game) {
        p.game = saveChoice(p.game)
        p.status = "reviewing outcome"
        p.deadline = null
        p.saveAt = undefined
        changed = true
      }
      if (p.advanceAt && p.advanceAt <= now) {
        // Recovery must not grant a fresh decision window after an offline advance.
        finishAdvance(p, session.duration, p.advanceAt)
        changed = true
      }
      const deciding =
        p.status === "deciding" ||
        (p.status === "disconnected" && p.previousStatus === "deciding")
      if (deciding && p.deadline !== null && p.deadline <= now) {
        if (p.status === "disconnected") p.previousStatus = "timed out"
        else p.status = "timed out"
        changed = true
      }
    }
  }
  return changed ? write(state) : state
}
export function createSession(duration: number) {
  if (!Number.isInteger(duration) || duration < 1)
    throw new Error("Choose a valid decision duration.")
  const state = load()
  let code: string
  do {
    code = `CAC${crypto.randomUUID().replace(/-/g, "").slice(0, 5).toUpperCase()}`
  } while (state.sessions.some((s) => s.code === code))
  const session: GroupSession = {
    id: crypto.randomUUID(),
    hostDocumentId,
    code,
    duration,
    phase: "lobby",
    contentVersion: CONTENT_VERSION,
    participants: [],
  }
  state.sessions.push(session)
  state.view = { sessionId: session.id, role: "host" }
  return write(state)
}
export function setView(view: GroupView | null) {
  const state = load()
  if (view) {
    const session = sessionIn(state, view.sessionId)
    if (view.role === "host" &&
        (session.phase === "ended" || session.hostDocumentId !== hostDocumentId))
      throw new Error("This host session has ended. Create a new session from Play.")
  }
  state.view = view
  return write(state)
}
export class SessionNotFoundError extends Error {
  constructor() {
    super(
      "Session does not exist. Check the code with your host and try again.",
    )
    this.name = "SessionNotFoundError"
  }
}
export function joinSession(code: string, identity: string) {
  const normalized = code.trim().toUpperCase()
  if (!/^CAC[A-Z0-9]{3,8}$/.test(normalized)) throw new SessionNotFoundError()
  const state = retrieveState()
  const session = state.sessions.find((s) => s.code === normalized)
  if (!session) throw new SessionNotFoundError()
  sessionIn(state, session.id)
  const existing = session.participants.find((p) => p.id === identity)
  if (!existing && session.phase === "ended") throw new SessionNotFoundError()
  if (!existing && session.phase !== "lobby")
    throw new Error(
      "Session closed. This session is no longer accepting participants.",
    )
  if (!existing) {
    session.participants.push({
      id: identity,
      alias: `Participant ${String(session.participants.length + 1).padStart(2, "0")}`,
      sample: false,
      setupStep: "household",
      householdId: null,
      supportId: null,
      status: "setup",
      game: null,
      deadline: null,
    })
  } else if (existing.status === "disconnected") {
    existing.status = existing.previousStatus || "deciding"
    existing.previousStatus = undefined
  }
  state.view = {
    role: "participant",
    sessionId: session.id,
    participantId: identity,
  }
  return write(state)
}
function updatePerson(
  sessionId: string,
  participantId: string,
  action: (p: Participant, s: GroupSession) => void,
) {
  const state = retrieveState()
  const session = sessionIn(state, sessionId)
  action(personIn(session, participantId), session)
  return write(state)
}
export function updateSetup(
  sessionId: string,
  participantId: string,
  setup: Partial<Pick<Participant, "householdId" | "supportId" | "setupStep">>,
) {
  return updatePerson(sessionId, participantId, (p, s) => {
    if (s.phase !== "lobby")
      throw new Error(
        "Household and support settings are locked after gameplay starts.",
      )
    Object.assign(p, setup)
    p.status = "setup"
  })
}
export function markReady(sessionId: string, participantId: string) {
  return updatePerson(sessionId, participantId, (p, s) => {
    if (
      s.phase !== "lobby" ||
      !householdFixtures.some((h) => h.id === p.householdId) ||
      !["with-cac", "without-cac"].includes(p.supportId || "")
    )
      throw new Error(
        "Choose a household and CAC support setting before confirming.",
      )
    p.status = "ready"
  })
}
export function startSession(sessionId: string, now = Date.now()) {
  const state = load()
  const s = sessionIn(state, sessionId)
  if (
    s.phase !== "lobby" ||
    !s.participants.length ||
    s.participants.some((p) => p.status !== "ready")
  )
    throw new Error("All joined participants must be ready before starting.")
  s.phase = "active"
  for (const p of s.participants) {
    p.game = createGameSession(p.householdId!, p.supportId!, false)
    beginDecision(p, s.duration, now)
  }
  return write(state)
}
export function submitChoice(
  sessionId: string,
  participantId: string,
  choiceId: string,
  now = Date.now(),
) {
  return updatePerson(sessionId, participantId, (p, s) => {
    active(s)
    if (
      p.status !== "deciding" ||
      !p.game ||
      p.deadline === null ||
      now >= p.deadline
    )
      throw new Error("This decision is no longer open. Wait for your host.")
    if (!getGameChoices(p.game).some((c) => c.id === choiceId))
      throw new Error("This choice is unavailable.")
    p.status = "saving"
    p.game = { ...p.game, stage: "saving", selectedId: choiceId }
    p.saveAt = now + 650
  })
}
export function markReadyToAdvance(sessionId: string, participantId: string) {
  return updatePerson(sessionId, participantId, (p, s) => {
    active(s)
    if (p.status !== "reviewing outcome" || p.game?.stage !== "consequence")
      throw new Error("Review a saved outcome first.")
    p.status =
      p.game.index === gameScenarios.length - 1
        ? "completed"
        : "ready to advance"
    if (p.status === "completed") p.game.stage = "complete"
  })
}
export function advanceParticipant(
  sessionId: string,
  participantId: string,
  now = Date.now(),
) {
  return updatePerson(sessionId, participantId, (p, s) => {
    active(s)
    if (p.status !== "ready to advance" || p.advanceAt)
      throw new Error("This participant is not ready to advance.")
    p.advanceAt = now + 350
  })
}
export function acknowledgeCharges(
  sessionId: string,
  participantId: string,
  now = Date.now(),
) {
  return updatePerson(sessionId, participantId, (p, s) => {
    active(s)
    if (p.game?.stage !== "charges")
      throw new Error("No scheduled transaction notice to acknowledge.")
    p.game = { ...p.game, stage: "browsing", advanceIds: [] }
    beginDecision(p, s.duration, now)
  })
}
export function endSession(sessionId: string) {
  // Do not resolve an in-flight save here. Only already committed ledger entries survive.
  const state = load()
  const s = sessionIn(state, sessionId)
  closeSession(s)
  return write(state)
}
export function simulateEvent(
  sessionId: string,
  event: "join" | "ready" | "decisions" | "disconnect",
  now = Date.now(),
) {
  const state = retrieveState()
  const s = sessionIn(state, sessionId)
  if (s.phase === "ended") throw new Error("This session has ended.")
  if (event === "join" && s.phase === "lobby") {
    // Sample data is deliberately separate from real participant setup.
    for (let i = 0; i < 4; i++) {
      s.participants.push({
        id: crypto.randomUUID(),
        alias: `Participant ${String(s.participants.length + 1).padStart(2, "0")}`,
        sample: true,
        setupStep: i < 2 ? "review" : "household",
        householdId:
          i < 2 ? householdFixtures[i % householdFixtures.length].id : null,
        supportId: i < 2 ? "with-cac" : null,
        status: i < 2 ? "ready" : "setup",
        game: null,
        deadline: null,
      })
    }
  }
  if (event === "ready" && s.phase === "lobby") {
    s.participants
      .filter((p) => p.sample)
      .forEach((p, i) => {
        p.householdId = householdFixtures[i % householdFixtures.length].id
        p.supportId = i % 2 ? "without-cac" : "with-cac"
        p.setupStep = "review"
        p.status = "ready"
      })
  }
  if (event === "decisions" && s.phase === "active") {
    for (const p of s.participants.filter((p) => p.sample)) {
      if (p.status === "deciding" && p.game && p.deadline && now < p.deadline) {
        p.game = saveChoice({
          ...p.game,
          selectedId: getGameChoices(p.game)[0].id,
        })
        p.status = "reviewing outcome"
        p.deadline = null
      } else if (
        p.status === "reviewing outcome" &&
        p.game?.stage === "consequence"
      ) {
        p.status =
          p.game.index === gameScenarios.length - 1
            ? "completed"
            : "ready to advance"
        if (p.status === "completed") p.game.stage = "complete"
      } else if (p.game?.stage === "charges") {
        p.game.stage = "browsing"
        p.game.advanceIds = []
        beginDecision(p, s.duration, now)
      }
    }
  }
  if (event === "disconnect" && s.phase === "active") {
    const p = s.participants.find((p) => p.sample && p.status !== "completed")
    if (p) {
      if (p.status === "disconnected") {
        p.status = p.previousStatus || "deciding"
        p.previousStatus = undefined
      } else if (p.status !== "saving" && !p.advanceAt) {
        p.previousStatus = p.status
        p.status = "disconnected"
      }
    }
  }
  return write(state)
}
