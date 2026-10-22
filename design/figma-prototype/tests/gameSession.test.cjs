const { test, beforeEach } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const ts = require("typescript")

// The repository has no test runner dependency. Use its installed TS compiler
// to load the pure state/fixture modules with Node's built-in test runner.
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
const {
  createGameSession,
  getGameChoices,
  getTotals,
  saveChoice,
  advanceSession,
  persistSession,
  readSession,
  SESSION_KEY,
  startCacPreparation,
  returnToJobBoard,
  selectTargetJob,
  chooseInterviewClothing,
  continueEmployment,
} = require("../src/gameSessionState.ts")
const { gameScenarios } = require("../src/fixtures/gameScenarios.ts")
const {
  jobOptions,
  PROFESSIONAL_CLOTHING_COST,
} = require("../src/fixtures/employment.ts")
let storage
beforeEach(() => {
  storage = new Map()
  global.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  }
})
const choose = (state, id) =>
  saveChoice({ ...state, selectedId: id || getGameChoices(state)[0].id })

test("opening balance is not received income; upcoming expenses are not charged", () => {
  assert.deepEqual(getTotals(createGameSession("jordan-maya", "without-cac")), {
    balance: 500,
    income: 0,
    expenses: 0,
  })
})
test("the opening board has two qualified jobs and CAC preparation unlocks more", () => {
  const without = createGameSession("jordan-maya", "without-cac")
  const initiallyQualified = jobOptions.filter((job) => job.qualifiedInitially)
  assert.ok(initiallyQualified.length >= 2)
  assert.ok(initiallyQualified.some((job) => job.id === "dishwasher"))
  assert.throws(() => selectTargetJob(without, "office-assistant"))
  assert.throws(() => startCacPreparation(without))

  let withCac = createGameSession("jordan-maya", "with-cac")
  withCac = startCacPreparation(withCac)
  assert.equal(withCac.stage, "preparation-fact")
  assert.equal(withCac.preparationCompleted, true)
  withCac = returnToJobBoard(withCac)
  withCac = selectTargetJob(withCac, "office-assistant")
  assert.equal(withCac.initialTargetJobId, "office-assistant")
  assert.equal(withCac.targetJobId, "office-assistant")
  assert.equal(withCac.stage, "first-interview")
})
test("only CAC preparation plus professional clothing wins the first interview", () => {
  let prepared = createGameSession("alex", "with-cac")
  prepared = returnToJobBoard(startCacPreparation(prepared))
  prepared = selectTargetJob(prepared, "front-desk-assistant")
  const purchased = chooseInterviewClothing(prepared, "purchase")
  assert.equal(purchased.firstInterviewSucceeded, true)
  assert.equal(purchased.jobObtainedDay, 2)
  assert.equal(purchased.clothingOwnership, "purchased")
  assert.equal(getTotals(purchased).expenses, PROFESSIONAL_CLOTHING_COST)
  assert.equal(continueEmployment(purchased).stage, "browsing")

  const currentClothes = chooseInterviewClothing(prepared, "current")
  assert.equal(currentClothes.firstInterviewSucceeded, false)
  assert.equal(continueEmployment(currentClothes).stage, "reapply")

  let noPreparation = createGameSession("alex", "without-cac")
  noPreparation = selectTargetJob(noPreparation, "dishwasher")
  noPreparation = chooseInterviewClothing(noPreparation, "purchase")
  assert.equal(noPreparation.firstInterviewSucceeded, false)
  assert.equal(continueEmployment(noPreparation).stage, "reapply")
})
test("failure preserves reapplication result before a guaranteed Day 3 job", () => {
  let state = createGameSession("patricia", "with-cac")
  state = selectTargetJob(state, "dishwasher")
  state = chooseInterviewClothing(state, "current")
  state = continueEmployment(state)
  assert.equal(state.stage, "reapply")
  assert.throws(() => selectTargetJob(state, "dishwasher"))
  assert.throws(() => selectTargetJob(state, "office-assistant"))

  state = selectTargetJob(state, "custodial-assistant")
  assert.equal(state.stage, "reapply-result")
  assert.equal(state.targetJobId, "custodial-assistant")
  state = continueEmployment(state)
  assert.equal(state.stage, "followup-interview")
  state = chooseInterviewClothing(state, "current")
  assert.equal(state.stage, "followup-result")
  assert.equal(state.jobObtainedDay, 3)
  state = continueEmployment(state)
  assert.equal(state.stage, "browsing")
  state = choose(state, "essentials")
  assert.equal(
    state.ledger.find((entry) => entry.id === "decision:groceries").day,
    3,
  )
})
test("owned professional clothing is retained and never charged twice", () => {
  let state = createGameSession("jordan-maya", "without-cac")
  state = selectTargetJob(state, "dishwasher")
  state = chooseInterviewClothing(state, "purchase")
  state = continueEmployment(state)
  state = selectTargetJob(state, "custodial-assistant")
  state = continueEmployment(state)
  state = chooseInterviewClothing(state, "owned")
  assert.equal(
    state.ledger.filter(
      (entry) => entry.id === "employment:professional-clothing",
    ).length,
    1,
  )
  assert.equal(getTotals(state).expenses, PROFESSIONAL_CLOTHING_COST)
})
test("confirmed choice calculations, stable IDs, and repeat-save protection", () => {
  const state = choose(
    createGameSession("jordan-maya", "without-cac"),
    "weekly-shop",
  )
  assert.deepEqual(getTotals(state), { balance: 440, income: 0, expenses: 60 })
  assert.deepEqual(saveChoice(state), state)
  assert.equal(state.stage, "consequence")
})
test("the shortened month contains only explicit grocery and utility decisions", () => {
  let state = choose(
    createGameSession("jordan-maya", "without-cac"),
    "weekly-shop",
  )
  state = advanceSession(state)
  assert.equal(state.index, 1)
  assert.equal(state.advanceIds.length, 0)
  state = choose(state, "pay-utilities")
  assert.deepEqual(getTotals(state), { balance: 395, income: 0, expenses: 105 })
  assert.equal(advanceSession(state).stage, "complete")
})
test("support-only choices are conditional; unavailable choice is rejected", () => {
  const without = createGameSession("alex", "without-cac")
  assert.ok(!getGameChoices(without).some((c) => c.supportOnly))
  assert.ok(
    getGameChoices({ ...without, mode: "with-cac" }).some((c) => c.supportOnly),
  )
  assert.throws(() => choose(without, "food-support"))

  const utilityWithout = { ...without, index: 1 }
  const utilityWith = { ...utilityWithout, mode: "with-cac" }
  assert.deepEqual(
    getGameChoices(utilityWithout).map((choice) => choice.id),
    ["pay-utilities"],
  )
  assert.deepEqual(
    getGameChoices(utilityWith).map((choice) => choice.id),
    ["pay-utilities", "utility-assistance"],
  )
})
test("refresh retains consequence, decision, charge explanation, and financial ledger", () => {
  for (const stage of [
    "job-board",
    "browsing",
    "consequence",
    "charges",
    "day",
    "complete",
  ]) {
    const state = {
      ...choose(createGameSession("patricia", "with-cac"), "food-support"),
      stage,
    }
    persistSession(state)
    assert.deepEqual(readSession(), JSON.parse(JSON.stringify(state)))
    assert.equal(getTotals(readSession()).balance, 400)
  }
})
test("interrupted saving and advancing restore retryable errors without processing", () => {
  for (const stage of ["saving", "advancing"]) {
    const state = {
      ...createGameSession("alex", "without-cac"),
      stage,
      selectedId: "essentials",
    }
    persistSession(state)
    const restored = readSession()
    assert.equal(restored.stage, "error")
    assert.equal(restored.errorAction, stage === "saving" ? "save" : "advance")
    assert.equal(restored.selectedId, "essentials")
    assert.equal(restored.ledger.length, 0)
  }
})
test("failed storage writes do not mutate or confirm the original state", () => {
  const state = {
    ...createGameSession("alex", "without-cac"),
    selectedId: "essentials",
    stage: "saving",
  }
  localStorage.setItem = () => {
    throw new Error("Storage unavailable")
  }
  assert.throws(() => persistSession(saveChoice(state)))
  assert.equal(state.ledger.length, 0)
  assert.equal(state.stage, "saving")
  assert.equal(state.selectedId, "essentials")
})
test("full month balances reconcile for every household and support mode", () => {
  for (const household of ["jordan-maya", "alex", "patricia"]) {
    for (const mode of ["with-cac", "without-cac"]) {
      let state = createGameSession(household, mode)
      for (let i = 0; i < gameScenarios.length; i++) {
        state = advanceSession(choose(state))
      }
      assert.equal(state.stage, "complete")
      assert.equal(getTotals(state).income, 0)
      assert.equal(getTotals(state).expenses, 105)
      assert.equal(
        new Set(state.ledger.map((t) => t.id)).size,
        state.ledger.length,
      )
      assert.equal(getTotals(state).balance, state.startingBalance - 105)
    }
  }
})
test("invalid persisted data is ignored safely", () => {
  storage.set(SESSION_KEY, "{broken")
  assert.equal(readSession(), null)
  storage.set(SESSION_KEY, JSON.stringify({ version: 2, index: 999 }))
  assert.equal(readSession(), null)
})
