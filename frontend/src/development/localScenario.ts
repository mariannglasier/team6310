import {
  usdCents,
  type Scenario,
  type CommittedDecision,
} from '../types/domain'
import type { LoadedPlaythrough } from '../types/playthrough'

// Synthetic presentation fixtures only. Never imported by database services.
export const localRun: LoadedPlaythrough = {
  id: 'local-scenario-preview',
  personaId: 'local-test-household',
  versionId: 'local-test-edition',
  ownerUserId: null,
  currentScenarioId: 'local-day4',
  currentBalance: usdCents(20000),
  currentDay: 4,
  supportEnabled: false,
  status: 'active',
  startedAt: null,
  sessionId: null,
  currentJobId: null,
  employmentState: null,
  persona: {
    id: 'local-test-household',
    versionId: 'local-test-edition',
    name: 'Local test household',
    description: 'Synthetic frontend fixture',
  },
}
export const localScenario: Scenario = {
  id: 'local-day4',
  versionId: 'local-test-edition',
  categoryId: 'local-test-category',
  title: 'A decision for today',
  description: 'Choose how your household responds to this test situation.',
  scheduleType: 'non_scheduled',
  choices: [
    {
      id: 'receive',
      text: 'Receive assistance',
      balanceChange: usdCents(2500),
      responseText: 'Your household received $25.',
    },
    {
      id: 'pay',
      text: 'Pay an unexpected fee',
      balanceChange: usdCents(-1500),
      responseText: 'Your household paid the $15 fee.',
    },
    {
      id: 'decline',
      text: 'Decline assistance',
      balanceChange: usdCents(0),
      responseText: 'You declined assistance. Your balance is unchanged.',
    },
  ].map((choice) => ({
    ...choice,
    scenarioId: 'local-day4',
    versionId: 'local-test-edition',
  })),
}
export interface ScenarioPresentationService {
  load(): Promise<Scenario | null>
  submit(choiceId: string): Promise<CommittedDecision>
}
// In-memory mock, recreated on refresh. No Auth, storage, or network operations.
export function createLocalScenarioService(): ScenarioPresentationService {
  let result: CommittedDecision | null = null
  return {
    async load() {
      return localScenario
    },
    async submit(choiceId) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      if (result) return result
      const choice = localScenario.choices.find((item) => item.id === choiceId)
      if (!choice) throw new Error('Choice unavailable')
      result = {
        scenarioId: localScenario.id,
        choiceId,
        balanceChangeApplied: choice.balanceChange,
        balanceAfter: usdCents(localRun.currentBalance! + choice.balanceChange),
      }
      return result
    },
  }
}
