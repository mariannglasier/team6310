// Frontend read models, not generated database rows or finalized API contracts.
// IDs and version IDs remain opaque; every content/run snapshot pins an edition.
declare const centsBrand: unique symbol
export type UsdCents = number & { readonly [centsBrand]: 'USD cents' }
export function usdCents(value: number): UsdCents {
  if (!Number.isSafeInteger(value))
    throw new Error('USD cents must be a safe integer')
  return value as UsdCents
}
export interface EditionRecord {
  readonly id: string
  readonly versionId: string
}
export interface Persona extends EditionRecord {
  readonly name: string
  readonly description: string
  readonly startingBalance: UsdCents
}
// Read model of an approved, active job in a published edition. Weekly income is
// the database's generated value (round(median hourly wage x hours, 2)); the client
// never recomputes it and never treats a job as hired without a protected operation.
export interface Job extends EditionRecord {
  readonly socCode: string
  readonly title: string
  readonly description: string | null
  readonly hoursPerWeek: number
  readonly medianHourlyWage: UsdCents
  readonly weeklyGrossIncome: UsdCents
  readonly wageYear: number
  readonly areaName: string
  readonly wageSourceUrl: string
  // CAC-authored free-text note from simulation_requirements, if present.
  readonly requirementsNote: string | null
}
export interface Statistic extends EditionRecord {
  readonly description: string
  readonly value: number
  readonly unit: string | null
  readonly category: string | null
  readonly displayText: string | null
  readonly visualizationType: string | null
  readonly visualizationConfig: Readonly<Record<string, unknown>>
  readonly geography: string | null
  readonly dataPeriod: string | null
  readonly sourceUrl: string | null
}
export interface ScenarioStatistic extends Statistic {
  readonly factRole: 'general' | 'cac'
}
// The newest published edition and its approved households (personas).
export interface PublishedHouseholds {
  readonly versionId: string
  readonly versionNumber: number
  readonly personas: readonly Persona[]
}
export interface Scenario extends EditionRecord {
  readonly categoryId: string
  readonly title: string
  readonly description: string
  readonly scheduleType: 'scheduled' | 'non_scheduled'
  readonly choices: readonly Choice[]
}
export interface Choice extends EditionRecord {
  readonly scenarioId: string
  readonly text: string
  readonly balanceChange: UsdCents
  readonly responseText: string
}
export type SimulationProgress =
  | { readonly stage: 'pre-game' }
  | { readonly stage: 'day'; readonly day: number }
export interface CommittedDecision {
  readonly scenarioId: string
  readonly choiceId: string
  readonly balanceChangeApplied: UsdCents
  readonly balanceAfter: UsdCents
}
export interface SimulationSnapshot {
  readonly runId: string
  readonly versionId: string
  readonly personaId: string
  readonly supportEnabled: boolean
  readonly assistanceUsed: boolean
  readonly balance: UsdCents
  readonly weeklyIncome: UsdCents
  readonly progress: SimulationProgress
  readonly currentScenario: Scenario | null
  readonly decisions: readonly CommittedDecision[]
  // Frontend presentation status; map from the future validated API response.
  readonly status: 'active' | 'completed' | 'ended-early'
}
export interface SimulationResult {
  readonly runId: string
  readonly versionId: string
  readonly personaId: string
  readonly outcome: 'completed' | 'ended-early'
  readonly progress: SimulationProgress
  readonly endingBalance: UsdCents
  readonly supportEnabled: boolean
  readonly assistanceUsed: boolean
  readonly decisions: readonly CommittedDecision[]
}
