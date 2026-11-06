import {
  usdCents,
  type Scenario,
  type CommittedDecision,
} from '../types/domain'
import {
  loadLocalScenario,
  LOCAL_SCENARIO_ID,
  LOCAL_VERSION_ID,
} from './loadLocalScenario'
import type { LoadedPlaythrough } from '../types/playthrough'

// In-memory preview shell only; scenario/choice content comes from local Supabase.
export const localRun: LoadedPlaythrough = {
  id: 'local-scenario-preview',
  personaId: 'cfe33068-d657-482f-b770-ef3918a87e03',
  versionId: LOCAL_VERSION_ID,
  ownerUserId: null,
  currentScenarioId: LOCAL_SCENARIO_ID,
  currentBalance: usdCents(20000),
  currentDay: 4,
  supportEnabled: false,
  status: 'active',
  startedAt: null,
  sessionId: null,
  currentJobId: null,
  employmentState: null,
  persona: {
    id: 'cfe33068-d657-482f-b770-ef3918a87e03',
    versionId: LOCAL_VERSION_ID,
    name: '[LOCAL TEST] Alex',
    description: 'Synthetic frontend fixture',
  },
}
export interface ScenarioPresentationService {
  load(): Promise<Scenario | null>
  submit(choiceId: string): Promise<CommittedDecision>
}
// Retrieval uses local Supabase. Submission is in-memory only and resets on refresh.
export function createLocalScenarioService(
  load: () => Promise<Scenario | null> = loadLocalScenario,
): ScenarioPresentationService {
  let scenario: Scenario | null = null
  let result: CommittedDecision | null = null
  return {
    async load() {
      scenario = await load()
      return scenario
    },
    async submit(choiceId) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      if (result) return result
      const choice = scenario?.choices.find((item) => item.id === choiceId)
      if (!choice) throw new Error('Choice unavailable')
      result = {
        scenarioId: scenario!.id,
        choiceId,
        balanceChangeApplied: choice.balanceChange,
        balanceAfter: usdCents(localRun.currentBalance! + choice.balanceChange),
      }
      return result
    },
  }
}
