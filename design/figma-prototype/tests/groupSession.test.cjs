const { test, beforeEach, afterEach } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const ts = require("typescript")
require.extensions[".ts"] = (module, filename) => {
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    filename,
  )
}
const api = require("../src/groupSessionService.ts")
const game = require("../src/gameSessionState.ts")
const { gameScenarios } = require("../src/fixtures/gameScenarios.ts")
let storage, clock
const realNow = Date.now
beforeEach(() => {
  storage = new Map()
  clock = 100000
  Date.now = () => clock
  global.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  }
})
afterEach(() => {
  Date.now = realNow
})
function current(state = api.retrieveState()) {
  return state.sessions[0]
}
function lobby() {
  return current(api.createSession(60))
}
function join(s, id = "person-a") {
  return api.joinSession(s.code, id)
}
function ready(s, id = "person-a") {
  join(s, id)
  api.updateSetup(s.id, id, {
    householdId: "jordan-maya",
    supportId: "without-cac",
    setupStep: "review",
  })
  return api.markReady(s.id, id)
}
function started(ids = ["person-a"]) {
  const s = lobby()
  for (const id of ids) ready(s, id)
  return current(api.startSession(s.id))
}
function p(s, id = "person-a") {
  return s.participants.find((p) => p.id === id)
}
function save(s, id = "person-a") {
  const person = p(current(), id)
  api.submitChoice(s.id, id, game.getGameChoices(person.game)[0].id)
  clock += 651
  return current(api.retrieveState())
}
test("generated codes, empty lobby, and no automatically selected participant setup", () => {
  const s = lobby()
  assert.match(s.code, /^CAC[A-Z0-9]{5}$/)
  assert.equal(s.participants.length, 0)
  assert.throws(() => api.startSession(s.id), /All joined/)
  const person = p(current(join(s)))
  assert.equal(person.householdId, null)
  assert.equal(person.supportId, null)
  assert.throws(() => api.markReady(s.id, person.id), /Choose a household/)
  assert.equal(storage.has(game.SESSION_KEY), false)
})
test("invalid, unknown, and ended sessions use the not-found state; active sessions remain closed to new joins", () => {
  assert.throws(() => api.joinSession("bad", "x"), api.SessionNotFoundError)
  assert.throws(() => api.joinSession("CAC000", "x"), api.SessionNotFoundError)
  const s = started()
  assert.throws(() => api.joinSession(s.code, "new"), /Session closed/)
  assert.equal(current(join(s)).participants.length, 1)
  api.endSession(s.id)
  assert.throws(() => api.joinSession(s.code, "new"), api.SessionNotFoundError)
  assert.equal(current(join(s)).participants.length, 1)
})
test("start requires every joined participant; setup is locked only at start", () => {
  const s = lobby()
  ready(s)
  join(s, "person-b")
  assert.throws(() => api.startSession(s.id), /All joined/)
  ready(s, "person-b")
  api.startSession(s.id)
  assert.equal(p(current()).deadline, clock + 60000)
  assert.throws(
    () => api.updateSetup(s.id, "person-a", { supportId: "with-cac" }),
    /locked/,
  )
})
test("saved choices stop the timer and outcome reading never times out", () => {
  let s = started()
  s = save(s)
  assert.equal(p(s).status, "reviewing outcome")
  assert.equal(p(s).deadline, null)
  assert.equal(p(s).game.stage, "consequence")
  clock += 600000
  s = current()
  assert.equal(p(s).status, "reviewing outcome")
  assert.equal(p(s).game.ledger.length, 1)
  assert.throws(
    () => api.submitChoice(s.id, "person-a", "weekly-shop"),
    /no longer open/,
  )
})
test("same-document participant recovery restores an accepted save without duplicate charges", () => {
  const s = started()
  api.submitChoice(s.id, "person-a", "weekly-shop")
  const pending = p(current())
  assert.equal(pending.status, "saving")
  assert.equal(pending.game.selectedId, "weekly-shop")
  assert.equal(pending.game.ledger.length, 0)
  assert.equal(pending.deadline, clock + 60000)
  clock += 651
  const saved = p(current())
  assert.equal(saved.game.stage, "consequence")
  assert.equal(game.getTotals(saved.game).balance, 440)
  assert.deepEqual(p(current()).game.ledger, saved.game.ledger)
})
test("timeout changes no choice, outcome, or money and cannot be advanced", () => {
  const s = started()
  clock += 60001
  const person = p(current())
  assert.equal(person.status, "timed out")
  assert.equal(person.game.selectedId, null)
  assert.equal(person.game.ledger.length, 0)
  assert.equal(game.getTotals(person.game).balance, 500)
  assert.throws(
    () => api.submitChoice(s.id, person.id, "weekly-shop"),
    /no longer open/,
  )
  assert.throws(() => api.advanceParticipant(s.id, person.id), /not ready/)
})
test("accepted save before deadline survives processing across expiry, not a timeout", () => {
  const s = started()
  clock += 59999
  api.submitChoice(s.id, "person-a", "weekly-shop")
  clock += 700
  assert.equal(p(current()).status, "reviewing outcome")
  assert.equal(p(current()).game.ledger.length, 1)
})
test("ready does not advance; host advances exactly one participant with duplicate protection", () => {
  let s = started(["person-a", "person-b"])
  s = save(s)
  const before = structuredClone(p(s, "person-b"))
  api.markReadyToAdvance(s.id, "person-a")
  assert.equal(p(current()).game.index, 0)
  api.advanceParticipant(s.id, "person-a")
  assert.throws(() => api.advanceParticipant(s.id, "person-a"), /not ready/)
  clock += 351
  s = current()
  assert.equal(p(s).game.index, 1)
  assert.equal(p(s).status, "deciding")
  assert.deepEqual(p(s, "person-b"), before)
  assert.throws(() => api.advanceParticipant(s.id, "person-a"), /not ready/)
})
test("scheduled charges are applied once; decision timer waits for notice acknowledgement", () => {
  let s = started()
  for (let i = 0; i < 2; i++) {
    s = save(s)
    api.markReadyToAdvance(s.id, "person-a")
    api.advanceParticipant(s.id, "person-a")
    clock += 351
    s = current()
  }
  assert.equal(p(s).game.stage, "charges")
  assert.equal(p(s).deadline, null)
  assert.equal(p(s).game.ledger.filter((t) => t.id === "utilities-8").length, 1)
  const ledger = p(s).game.ledger
  clock += 600000
  s = current(api.acknowledgeCharges(s.id, "person-a"))
  assert.equal(p(s).status, "deciding")
  assert.equal(p(s).deadline, clock + 60000)
  assert.deepEqual(p(s).game.ledger, ledger)
})
test("same-document advance recovery retains its original deadline, not a new window", () => {
  let s = started()
  s = save(s)
  api.markReadyToAdvance(s.id, "person-a")
  api.advanceParticipant(s.id, "person-a")
  const expectedDeadline = clock + 350 + 60000
  clock += 70000
  s = current()
  assert.equal(p(s).game.index, 1)
  assert.equal(p(s).deadline, expectedDeadline)
  assert.equal(p(s).status, "timed out")
  assert.equal(p(s).game.selectedId, null)
  assert.equal(p(s).game.ledger.length, 1)
})
test("early ending preserves committed changes and cancels pending choices and advancements", () => {
  let s = started(["person-a", "person-b"])
  s = save(s)
  const ledger = p(s).game.ledger
  api.markReadyToAdvance(s.id, "person-a")
  api.advanceParticipant(s.id, "person-a")
  api.submitChoice(s.id, "person-b", "weekly-shop")
  api.endSession(s.id)
  clock += 100000
  s = current()
  assert.equal(s.phase, "ended")
  assert.deepEqual(p(s).game.ledger, ledger)
  assert.equal(p(s).game.index, 0)
  assert.equal(p(s, "person-b").game.ledger.length, 0)
  for (const person of s.participants) {
    assert.equal(person.deadline, null)
    assert.equal(person.advanceAt, undefined)
    assert.equal(person.saveAt, undefined)
  }
  assert.throws(
    () => api.submitChoice(s.id, "person-a", "weekly-shop"),
    /not open/,
  )
  assert.throws(() => api.advanceParticipant(s.id, "person-a"), /not open/)
})
test("finishing day 30 makes only that participant complete; results and finances reconcile", () => {
  let s = started(["person-a", "person-b"])
  for (let i = 0; i < gameScenarios.length; i++) {
    s = save(s)
    api.markReadyToAdvance(s.id, "person-a")
    if (i !== gameScenarios.length - 1) {
      api.advanceParticipant(s.id, "person-a")
      clock += 351
      s = current()
      if (p(s).game.stage === "charges")
        api.acknowledgeCharges(s.id, "person-a")
    }
  }
  s = current()
  assert.equal(p(s).status, "completed")
  assert.equal(p(s).game.stage, "complete")
  assert.equal(p(s, "person-b").game.index, 0)
  assert.equal(s.phase, "active")
  assert.equal(
    p(s).game.ledger.filter((t) => t.id.startsWith("decision:")).length,
    7,
  )
  assert.deepEqual(game.getTotals(p(s).game), {
    income: 600,
    expenses: 450,
    balance: 650,
  })
})
test("storage failure never publishes a confirmed financial change", () => {
  const s = started()
  api.submitChoice(s.id, "person-a", "weekly-shop")
  clock += 651
  const setItem = localStorage.setItem
  localStorage.setItem = () => {
    throw new Error("Storage blocked")
  }
  assert.throws(() => api.retrieveState(), /Storage blocked/)
  const persisted = JSON.parse(storage.get(api.GROUP_KEY))
  assert.equal(p(current(persisted)).game.ledger.length, 0)
  assert.equal(p(current(persisted)).status, "saving")
  localStorage.setItem = setItem
  assert.equal(p(current()).game.ledger.length, 1)
})
test("reconnect keeps the real deadline, stage, saved choice, and identity", () => {
  const s = started()
  api.simulateEvent(s.id, "join") // no arrivals once active
  assert.equal(current().participants.length, 1)
  const state = api.retrieveState()
  p(current(state)).previousStatus = "deciding"
  p(current(state)).status = "disconnected"
  localStorage.setItem(api.GROUP_KEY, JSON.stringify(state))
  const deadline = p(current()).deadline
  clock += 1000
  join(s)
  assert.equal(p(current()).status, "deciding")
  assert.equal(p(current()).deadline, deadline)
  save(s)
  const saved = p(current()).game
  join(s)
  assert.deepEqual(p(current()).game, saved)
})
test("content versions remain pinned and mismatched sessions cannot be joined", () => {
  const s = lobby()
  const state = api.retrieveState()
  current(state).contentVersion = "unavailable-version"
  localStorage.setItem(api.GROUP_KEY, JSON.stringify(state))
  assert.throws(() => join(s), /content is unavailable/)
})

function newDocument() {
  delete require.cache[require.resolve("../src/groupSessionService.ts")]
  return require("../src/groupSessionService.ts")
}
test("beforeunload ownership inspection never writes or recovers pending operations", () => {
  const s = started()
  api.submitChoice(s.id, "person-a", "weekly-shop")
  clock += 1000
  const before = storage.get(api.GROUP_KEY)
  const setItem = localStorage.setItem
  localStorage.setItem = () => { throw new Error("No writes allowed") }
  assert.equal(api.ownsOpenSession(), true)
  const next = newDocument()
  assert.equal(next.ownsOpenSession(), false)
  assert.equal(storage.get(api.GROUP_KEY), before)
  localStorage.setItem = setItem
})
test("document initialization is idempotent and records current host ownership", () => {
  const s = lobby()
  assert.ok(s.hostDocumentId)
  api.initializeGroupDocument()
  api.initializeGroupDocument()
  assert.equal(current().phase, "lobby")
  assert.equal(api.ownsOpenSession(), true)
})
test("new documents close previous and legacy lobbies and clear host restoration", () => {
  const s = lobby()
  const state = api.retrieveState()
  state.sessions.push({ ...s, id: "legacy", code: "CACLEGACY", hostDocumentId: undefined })
  localStorage.setItem(api.GROUP_KEY, JSON.stringify(state))
  localStorage.setItem(game.SESSION_KEY, "untouched individual snapshot")
  const next = newDocument()
  next.initializeGroupDocument()
  const closed = next.retrieveState()
  assert.ok(closed.sessions.every((s) => s.phase === "ended"))
  assert.equal(closed.view, null)
  assert.equal(next.ownsOpenSession(), false)
  assert.equal(storage.get(game.SESSION_KEY), "untouched individual snapshot")
  assert.throws(() => next.setView({ sessionId: s.id, role: "host" }), /ended/)
  const fresh = next.createSession(60)
  next.initializeGroupDocument()
  assert.equal(fresh.sessions.at(-1).phase, "lobby")
  assert.notEqual(fresh.sessions.at(-1).hostDocumentId, s.hostDocumentId)
})
test("startup closure precedes overdue saves and advances, preserving participant access", () => {
  let s = started(["person-a", "person-b"])
  s = save(s)
  const committed = structuredClone(p(current()).game)
  api.markReadyToAdvance(s.id, "person-a")
  api.advanceParticipant(s.id, "person-a")
  api.submitChoice(s.id, "person-b", "weekly-shop")
  localStorage.setItem("cac-group-participant-identity", "person-b")
  clock += 100000
  const next = newDocument()
  // retrieveState must initialize even if main's explicit initialization is skipped.
  const closed = next.retrieveState()
  s = current(closed)
  assert.equal(s.phase, "ended")
  assert.deepEqual(p(s).game, committed)
  assert.equal(p(s, "person-b").game.ledger.length, 0)
  assert.equal(closed.view.role, "participant")
  assert.equal(closed.view.participantId, "person-b")
  assert.equal(storage.get("cac-group-participant-identity"), "person-b")
  for (const person of s.participants) {
    assert.equal(person.deadline, null)
    assert.equal(person.saveAt, undefined)
    assert.equal(person.advanceAt, undefined)
  }
  assert.throws(() => next.joinSession(s.code, "new"), next.SessionNotFoundError)
  assert.equal(next.joinSession(s.code, "person-a").view.participantId, "person-a")
  assert.equal(current(next.retrieveState()).phase, "ended")
})
test("lifecycle ending works from the simulated participant role and is repeatable", () => {
  let s = started()
  s = save(s)
  const committed = structuredClone(p(current()).game)
  assert.equal(api.retrieveState().view.role, "participant")
  assert.equal(api.ownsOpenSession(), true)
  api.endHostedSessions()
  api.endHostedSessions()
  api.endSession(s.id)
  assert.equal(api.ownsOpenSession(), false)
  assert.deepEqual(p(current()).game, committed)
  assert.equal(api.retrieveState().view.participantId, "person-a")
})
test("completed personal recaps survive repeated lifecycle ending", () => {
  const s = started()
  const state = api.retrieveState()
  p(current(state)).status = "completed"
  p(current(state)).game.stage = "complete"
  localStorage.setItem(api.GROUP_KEY, JSON.stringify(state))
  const recap = structuredClone(p(current()).game)
  api.endHostedSessions()
  api.endHostedSessions()
  assert.equal(p(current()).status, "completed")
  assert.deepEqual(p(current()).game, recap)
  assert.equal(api.joinSession(s.code, "person-a").view.participantId, "person-a")
})
test("failed startup persistence blocks recovery and host restoration until retry", () => {
  const s = started()
  api.submitChoice(s.id, "person-a", "weekly-shop")
  api.setView({ sessionId: s.id, role: "host" })
  clock += 1000
  const next = newDocument()
  const before = storage.get(api.GROUP_KEY)
  const setItem = localStorage.setItem
  localStorage.setItem = () => { throw new Error("Storage blocked") }
  assert.throws(() => next.initializeGroupDocument(), /Storage blocked/)
  assert.throws(() => next.retrieveState(), /Storage blocked/)
  assert.throws(() => next.createSession(60), /Storage blocked/)
  assert.equal(storage.get(api.GROUP_KEY), before)
  localStorage.setItem = setItem
  next.initializeGroupDocument()
  const closed = next.retrieveState()
  assert.equal(closed.view, null)
  assert.equal(current(closed).phase, "ended")
  assert.equal(p(current(closed)).game.ledger.length, 0)
})
test("failed explicit and lifecycle endings preserve stored host view and allow retry", () => {
  const s = started()
  api.setView({ sessionId: s.id, role: "host" })
  const before = storage.get(api.GROUP_KEY)
  const setItem = localStorage.setItem
  localStorage.setItem = () => { throw new Error("Storage blocked") }
  assert.throws(() => api.endSession(s.id), /Storage blocked/)
  assert.throws(() => api.endHostedSessions(), /Storage blocked/)
  assert.equal(storage.get(api.GROUP_KEY), before)
  localStorage.setItem = setItem
  const closed = api.endHostedSessions()
  assert.equal(closed.view, null)
  assert.equal(current(closed).phase, "ended")
})
test("failed pagehide closure blocks cached-page recovery until persistence succeeds", () => {
  const s = started()
  api.submitChoice(s.id, "person-a", "weekly-shop")
  clock += 1000
  const before = storage.get(api.GROUP_KEY)
  const setItem = localStorage.setItem
  localStorage.setItem = () => { throw new Error("Storage blocked") }
  assert.throws(() => api.endGroupDocument(), /Storage blocked/)
  assert.throws(() => api.retrieveState(), /Storage blocked/)
  assert.equal(storage.get(api.GROUP_KEY), before)
  localStorage.setItem = setItem
  const closed = api.retrieveState()
  assert.equal(current(closed).phase, "ended")
  assert.equal(p(current(closed)).game.ledger.length, 0)
  api.endGroupDocument()
  assert.equal(current().phase, "ended")
  assert.equal(api.createSession(60).sessions.at(-1).phase, "lobby")
})
