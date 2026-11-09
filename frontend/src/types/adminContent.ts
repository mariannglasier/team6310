import type { UsdCents } from './domain'

// Read-only staff view models of stored simulation content. They mirror what is
// stored; nothing here is approved gameplay data or a financial calculation.
// Money is kept as integer cents and only formatted for display.

export interface AdminEdition {
  readonly versionId: string
  readonly versionNumber: number
  readonly status: string
  readonly createdAt: string | null
  readonly publishedAt: string | null
  readonly changeSummary: string | null
}

export interface AdminCategory {
  readonly id: string
  readonly name: string
  readonly description: string | null
}

export interface AdminPersona {
  readonly id: string
  readonly versionId: string | null
  readonly name: string
  readonly description: string | null
  readonly startingBalance: UsdCents | null
  readonly weeklyIncome: UsdCents | null
  readonly startingJobId: string | null
  readonly hasEnglishSkills: boolean | null
  readonly hasComputerSkills: boolean | null
}

export interface AdminPersonaExpense {
  readonly id: string
  readonly personaId: string
  readonly versionId: string | null
  readonly name: string
  readonly amount: UsdCents | null
  readonly firstDueDay: number | null
  readonly repeatIntervalDays: number | null
  readonly lateFee: UsdCents | null
}

export interface AdminScenario {
  readonly id: string
  readonly versionId: string | null
  readonly title: string
  readonly description: string | null
  readonly defaultDay: number | null
  readonly categoryId: string | null
  readonly personaId: string | null
  readonly scheduleType: string | null
}

export interface AdminChoice {
  readonly id: string
  readonly scenarioId: string
  readonly versionId: string | null
  readonly text: string | null
  readonly balanceChange: UsdCents | null
  readonly responseText: string | null
  readonly nextScenarioId: string | null
}

export interface AdminSupportEffect {
  readonly id: string
  readonly choiceId: string
  readonly versionId: string | null
  readonly assistanceAmount: UsdCents | null
  readonly responseText: string | null
  readonly explanation: string | null
}

export interface AdminJob {
  readonly id: string
  readonly versionId: string | null
  readonly socCode: string
  readonly title: string
  readonly description: string | null
  readonly areaName: string | null
  readonly wageYear: number | null
  readonly medianHourlyWage: UsdCents | null
  readonly hoursPerWeek: number | null
  readonly weeklyGrossIncome: UsdCents | null
  readonly entryEducation: string | null
  readonly relatedExperience: string | null
  readonly onJobTraining: string | null
  readonly requirements: Readonly<Record<string, string>>
  readonly wageSourceUrl: string | null
  readonly requirementsSourceUrl: string | null
  readonly reviewedAt: string | null
  readonly isApproved: boolean
  readonly isActive: boolean
  readonly needsEnglishSkills: boolean | null
  readonly needsComputerSkills: boolean | null
}

export interface AdminStatistic {
  readonly id: string
  readonly versionId: string | null
  readonly description: string
  readonly value: number | null
  readonly unit: string | null
  readonly geography: string | null
  readonly dataPeriod: string | null
  readonly sourceUrl: string | null
  readonly lastReviewedAt: string | null
}

export interface AdminScenarioStatistic {
  readonly scenarioId: string
  readonly statisticId: string
  readonly versionId: string | null
  readonly factRole: string | null
}

export interface AdminService {
  readonly key: string
  readonly name: string
  readonly confirmedAt: string | null
}

export interface AdminServiceFact {
  readonly id: string
  readonly serviceKey: string
  readonly key: string
  readonly title: string
  readonly value: number | null
  readonly unit: string | null
  readonly reportingYear: number | null
}

export interface AdminContent {
  readonly editions: readonly AdminEdition[]
  readonly categories: readonly AdminCategory[]
  readonly personas: readonly AdminPersona[]
  readonly personaExpenses: readonly AdminPersonaExpense[]
  readonly scenarios: readonly AdminScenario[]
  readonly choices: readonly AdminChoice[]
  readonly supportEffects: readonly AdminSupportEffect[]
  readonly jobs: readonly AdminJob[]
  readonly statistics: readonly AdminStatistic[]
  readonly scenarioStatistics: readonly AdminScenarioStatistic[]
  readonly services: readonly AdminService[]
  readonly serviceFacts: readonly AdminServiceFact[]
}
