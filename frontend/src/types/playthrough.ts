import type { UsdCents } from './domain'

// Read-only copy of recorded state, not a gameplay or synchronization contract.
export interface LoadedPlaythrough {
  readonly id: string
  readonly personaId: string
  readonly versionId: string | null
  readonly ownerUserId: string | null
  readonly currentScenarioId: string | null
  readonly currentBalance: UsdCents | null
  readonly currentDay: number | null
  readonly supportEnabled: boolean | null
  readonly status: string | null
  readonly startedAt: string | null
  readonly sessionId: string | null
  readonly currentJobId: string | null
  // Opaque database value: no employment structure or semantics are defined here.
  readonly employmentState: unknown
  readonly persona: {
    readonly id: string
    readonly versionId: string
    readonly name: string
    readonly description: string | null
  } | null
}
