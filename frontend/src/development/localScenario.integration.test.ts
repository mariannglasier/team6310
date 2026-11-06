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

it.skipIf(import.meta.env.VITE_RUN_LOCAL_SCENARIO !== '1')(
  'persists through the real frontend service and restores after service recreation',
  async () => {
    if (import.meta.env.VITE_SUPABASE_URL !== 'http://127.0.0.1:55321')
      throw new Error('Local only')
    const { getSupabaseClient } = await import('../services/supabase')
    const { createLocalScenarioService } = await import('./localScenario')
    const client = await getSupabaseClient()
    const { data, error } = await client.auth.signInAnonymously()
    expect(error).toBeNull()
    expect(data.user?.is_anonymous).toBe(true)
    const service = createLocalScenarioService()
    const content = await service.load()
    expect(await service.restore()).toBeNull()
    const opened = await service.open()
    expect(opened.run.currentBalance).toBe(20000)
    const committed = await service.submit(content!.choices[0].id)
    expect(committed.run.currentBalance).toBe(22500)
    expect(committed.decision?.balanceChangeApplied).toBe(2500)
    const restoredService = createLocalScenarioService()
    await restoredService.load()
    const restored = await restoredService.restore()
    expect(restored).toEqual(committed)
    expect(
      (await restoredService.submit(content!.choices[0].id)).decision,
    ).toEqual(committed.decision)
    expect(restored?.run.employmentState).toBeNull()
    expect(restored?.run.currentDay).toBe(4)
  },
)
