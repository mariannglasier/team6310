import { expect, it } from 'vitest'
import {
  loadLocalScenario,
  LOCAL_SCENARIO_ID,
  LOCAL_VERSION_ID,
} from './loadLocalScenario'

// Explicit opt-in: uses the real centralized frontend client and local publishable key.
it.skipIf(import.meta.env.VITE_RUN_LOCAL_SCENARIO !== '1')(
  'retrieves the local published scenario and choices through real Supabase',
  async () => {
    const scenario = await loadLocalScenario()
    expect(scenario).toMatchObject({
      id: LOCAL_SCENARIO_ID,
      versionId: LOCAL_VERSION_ID,
      title: '[LOCAL TEST] A decision for Day 4',
    })
    expect(scenario?.choices.map((choice) => choice.balanceChange)).toEqual([
      2500, -1500, 0,
    ])
    expect(scenario?.choices.map((choice) => choice.responseText)).toEqual([
      'Your household received $25.00.',
      'Your household paid $15.00.',
      'Your balance is unchanged.',
    ])
    expect(
      scenario?.choices.every(
        (choice) =>
          choice.versionId === LOCAL_VERSION_ID &&
          choice.scenarioId === LOCAL_SCENARIO_ID,
      ),
    ).toBe(true)
  },
)
