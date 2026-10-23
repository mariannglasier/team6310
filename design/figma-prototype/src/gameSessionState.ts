import { gameChoices } from "./fixtures/gameChoices"
import { gameScenarios } from "./fixtures/gameScenarios"
import { sampleIncome, scheduledExpenses } from "./fixtures/gameExpenses"
import { householdFixtures } from "./householdFixtures"
import type { SupportId } from "./supportOptions"
import { jobOptions, PROFESSIONAL_CLOTHING_COST } from "./fixtures/employment"

export const SESSION_KEY = "cac-gameplay-v2"
export type EmploymentStage = "job-board" | "preparation-fact" | "first-interview" | "first-interview-result" | "reapply" | "reapply-result" | "followup-interview" | "followup-result"
export type Stage = EmploymentStage | "browsing" | "saving" | "consequence" | "advancing" | "day" | "charges" | "complete" | "error"
export type ClothingOwnership = "none" | "purchased" | "cac"
export type ClothingChoice = "purchase" | "current" | "cac" | "owned"
export type Transaction = {
  id: string
  day: number
  label: string
  amount: number
}
export type GameSession = {
  version: 2
  id: string
  householdId: string
  mode: SupportId
  startingBalance: number
  index: number
  stage: Stage
  selectedId: string | null
  ledger: Transaction[]
  advanceIds: string[]
  preparationCompleted: boolean
  initialTargetJobId: string | null
  targetJobId: string | null
  clothingOwnership: ClothingOwnership
  firstInterviewSucceeded: boolean | null
  jobObtainedDay: 2 | 3 | null
  errorAction?: "save" | "advance"
}

export function createGameSession(
  householdId: string,
  mode: SupportId,
  showJobPlaceholder = true,
): GameSession {
  return {
    version: 2,
    id: crypto.randomUUID(),
    householdId,
    mode,
    startingBalance: householdFixtures.find((h) => h.id === householdId)!
      .startingBalance,
    index: 0,
    stage: showJobPlaceholder ? "job-board" : "browsing",
    selectedId: null,
    ledger: [],
    advanceIds: [],
    preparationCompleted: false,
    initialTargetJobId: null,
    targetJobId: null,
    clothingOwnership: "none",
    firstInterviewSucceeded: null,
    jobObtainedDay: null,
  }
}
export function isEmploymentStage(stage: Stage): stage is EmploymentStage {
  return [
    "job-board",
    "preparation-fact",
    "first-interview",
    "first-interview-result",
    "reapply",
    "reapply-result",
    "followup-interview",
    "followup-result",
  ].includes(stage)
}
export function startCacPreparation(state: GameSession): GameSession {
  if (state.mode !== "with-cac" || state.stage !== "job-board")
    throw new Error("CAC preparation is not available.")
  return {
    ...state,
    stage: "preparation-fact",
    preparationCompleted: true,
  }
}
export function returnToJobBoard(state: GameSession): GameSession {
  if (state.stage !== "preparation-fact")
    throw new Error("Preparation has not been completed.")
  return { ...state, stage: "job-board" }
}
export function selectTargetJob(
  state: GameSession,
  jobId: string,
): GameSession {
  const job = jobOptions.find((option) => option.id === jobId)
  const qualified = state.preparationCompleted
    ? job?.qualifiedAfterPreparation
    : job?.qualifiedInitially
  if (!job || !qualified)
    throw new Error("This job is not currently available.")
  if (state.stage === "reapply") {
    if (job.id === state.initialTargetJobId || !job.lowerRequirement)
      throw new Error("Choose a different lower-requirement job.")
    return { ...state, targetJobId: job.id, stage: "reapply-result" }
  }
  if (state.stage !== "job-board")
    throw new Error("The job board is not available.")
  return {
    ...state,
    initialTargetJobId: job.id,
    targetJobId: job.id,
    stage: "first-interview",
  }
}
export function chooseInterviewClothing(
  state: GameSession,
  choice: ClothingChoice,
): GameSession {
  if (state.stage !== "first-interview" && state.stage !== "followup-interview")
    throw new Error("There is no active interview.")
  if (choice === "cac" && state.mode !== "with-cac")
    throw new Error("CAC clothing is not available.")
  if (choice === "owned" && state.clothingOwnership === "none")
    throw new Error("Professional clothing is not owned.")

  const day = state.stage === "first-interview" ? 2 : 3
  const alreadyOwned = state.clothingOwnership !== "none"
  const ownership =
    choice === "purchase"
      ? "purchased"
      : choice === "cac"
        ? "cac"
        : state.clothingOwnership
  const clothingCharge =
    choice === "purchase" && !alreadyOwned
      ? {
          id: "employment:professional-clothing",
          day,
          label: "Professional interview clothing",
          amount: -PROFESSIONAL_CLOTHING_COST,
        }
      : null
  const ledger =
    clothingCharge &&
    !state.ledger.some((entry) => entry.id === clothingCharge.id)
      ? [...state.ledger, clothingCharge]
      : state.ledger

  if (state.stage === "followup-interview")
    return {
      ...state,
      stage: "followup-result",
      clothingOwnership: ownership,
      ledger,
      jobObtainedDay: 3,
    }

  const succeeded =
    state.preparationCompleted &&
    (choice === "purchase" || choice === "cac" || choice === "owned")
  return {
    ...state,
    stage: "first-interview-result",
    clothingOwnership: ownership,
    ledger,
    firstInterviewSucceeded: succeeded,
    jobObtainedDay: succeeded ? 2 : null,
  }
}
export function continueEmployment(state: GameSession): GameSession {
  if (state.stage === "first-interview-result")
    return {
      ...state,
      stage: state.firstInterviewSucceeded ? "browsing" : "reapply",
    }
  if (state.stage === "reapply-result")
    return { ...state, stage: "followup-interview" }
  if (state.stage === "followup-result") return { ...state, stage: "browsing" }
  throw new Error("There is no employment result to continue.")
}
export function getGameChoices(state: GameSession) {
  return gameChoices[gameScenarios[state.index].id].filter(
    (c) => !c.supportOnly || state.mode === "with-cac",
  )
}
export function getTotals(state: GameSession) {
  const income = state.ledger.reduce((n, t) => n + Math.max(0, t.amount), 0)
  const expenses = state.ledger.reduce((n, t) => n - Math.min(0, t.amount), 0)
  return {
    income,
    expenses,
    balance: state.startingBalance + income - expenses,
  }
}
export function saveChoice(state: GameSession): GameSession {
  const choice = getGameChoices(state).find((c) => c.id === state.selectedId)
  if (!choice) throw new Error("Choose an option before saving.")
  const scenario = gameScenarios[state.index]
  const id = `decision:${scenario.id}`
  const decisionDay =
    scenario.id === "groceries" && state.jobObtainedDay
      ? state.jobObtainedDay
      : scenario.day
  return {
    ...state,
    stage: "consequence",
    errorAction: undefined,
    ledger: state.ledger.some((t) => t.id === id)
      ? state.ledger
      : [
          ...state.ledger,
          {
            id,
            day: decisionDay,
            label: choice.category,
            amount: choice.amount,
          },
        ],
  }
}
export function advanceSession(state: GameSession): GameSession {
  if (state.index === gameScenarios.length - 1)
    return { ...state, stage: "complete" }
  const index = state.index + 1
  const day = gameScenarios[index].day
  const due = [...scheduledExpenses, ...sampleIncome].filter(
    (t) => t.day <= day && !state.ledger.some((entry) => entry.id === t.id),
  )
  return {
    ...state,
    index,
    stage:
      day !== gameScenarios[state.index].day
        ? "day"
        : due.length
          ? "charges"
          : "browsing",
    selectedId: null,
    ledger: [...state.ledger, ...due],
    advanceIds: due.map((t) => t.id),
    errorAction: undefined,
  }
}
export function persistSession(state: GameSession) {
  // One snapshot contains both the stage and ledger: never persist them separately.
  localStorage.setItem(SESSION_KEY, JSON.stringify(state))
}
export function readSession(): GameSession | null {
  try {
    const state = JSON.parse(
      localStorage.getItem(SESSION_KEY) || "null",
    ) as GameSession | null
    if (
      !state ||
      state.version !== 2 ||
      !householdFixtures.some((h) => h.id === state.householdId) ||
      !["with-cac", "without-cac"].includes(state.mode) ||
      !Number.isInteger(state.index) ||
      !gameScenarios[state.index] ||
      !Array.isArray(state.ledger) ||
      !Array.isArray(state.advanceIds) ||
      !state.ledger.every(
        (t) => typeof t.id === "string" && Number.isFinite(t.amount),
      ) ||
      ![
        "job",
        "job-board",
        "preparation-fact",
        "first-interview",
        "first-interview-result",
        "reapply",
        "reapply-result",
        "followup-interview",
        "followup-result",
        "browsing",
        "saving",
        "consequence",
        "advancing",
        "day",
        "charges",
        "complete",
        "error",
      ].includes(state.stage)
    )
      return null
    const migrated: GameSession = {
      ...state,
      stage: state.stage as string === "job" ? "job-board" : state.stage,
      preparationCompleted: state.preparationCompleted ?? false,
      initialTargetJobId: state.initialTargetJobId ?? null,
      targetJobId: state.targetJobId ?? null,
      clothingOwnership: state.clothingOwnership ?? "none",
      firstInterviewSucceeded: state.firstInterviewSucceeded ?? null,
      jobObtainedDay: state.jobObtainedDay ?? null,
    }
    if (migrated.stage === "saving" || migrated.stage === "advancing")
      return {
        ...migrated,
        stage: "error",
        errorAction: migrated.stage === "saving" ? "save" : "advance",
      }
    return migrated
  } catch {
    return null
  }
}
