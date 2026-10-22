import { expect, test } from 'vitest'
import { initialSimulationState, simulationReducer } from './simulationState'
import { usdCents, type SimulationSnapshot } from '../types/domain'

// Synthetic test values only, never production content.
const snapshot: SimulationSnapshot = {
  runId: 'test-run',
  versionId: 'test-edition',
  personaId: 'test-persona',
  supportEnabled: true,
  assistanceUsed: false,
  balance: usdCents(10000),
  weeklyIncome: usdCents(0),
  progress: { stage: 'day', day: 1 },
  status: 'active',
  decisions: [],
  currentScenario: {
    id: 'test-scenario',
    versionId: 'test-edition',
    categoryId: 'test-category',
    title: 'Test',
    description: 'Test',
    scheduleType: 'non_scheduled',
    choices: [
      {
        id: 'test-choice',
        versionId: 'test-edition',
        scenarioId: 'test-scenario',
        text: 'Test choice',
        balanceChange: usdCents(-100),
        responseText: 'Test result',
      },
    ],
  },
}
function restored() {
  return simulationReducer(
    simulationReducer(initialSimulationState, {
      type: 'restore-started',
      requestId: 'one',
    }),
    { type: 'restored', requestId: 'one', snapshot },
  )
}
test('choice selection changes UI state only and rejects unknown choices', () => {
  const state = restored()
  const selected = simulationReducer(state, {
    type: 'choice-selected',
    choiceId: 'test-choice',
  })
  expect(selected.selectedChoiceId).toBe('test-choice')
  expect(selected.snapshot).toBe(snapshot)
  expect(selected.snapshot?.balance).toBe(10000)
  expect(selected.snapshot?.decisions).toHaveLength(0)
  expect(selected.snapshot?.assistanceUsed).toBe(false)
  expect(
    simulationReducer(selected, {
      type: 'choice-selected',
      choiceId: 'missing',
    }),
  ).toBe(selected)
  const ended = {
    ...selected,
    snapshot: { ...snapshot, status: 'ended-early' as const },
  }
  expect(
    simulationReducer(ended, { type: 'choice-selected', choiceId: null }),
  ).toBe(ended)
})
test('stale restore results are ignored and failed restoration preserves committed state', () => {
  const first = simulationReducer(restored(), {
    type: 'restore-started',
    requestId: 'two',
  })
  const second = simulationReducer(first, {
    type: 'restore-started',
    requestId: 'three',
  })
  expect(
    simulationReducer(second, {
      type: 'restored',
      requestId: 'two',
      snapshot: null,
    }),
  ).toBe(second)
  expect(
    simulationReducer(second, {
      type: 'restore-failed',
      requestId: 'two',
      message: 'Old error',
    }),
  ).toBe(second)
  const failed = simulationReducer(second, {
    type: 'restore-failed',
    requestId: 'three',
    message: 'Retry',
  })
  expect(failed.status).toBe('error')
  expect(failed.snapshot).toBe(snapshot)
  expect(
    simulationReducer(failed, {
      type: 'choice-selected',
      choiceId: 'test-choice',
    }),
  ).toBe(failed)
})
test('restoring clears temporary selection without applying financial effects', () => {
  const selected = simulationReducer(restored(), {
    type: 'choice-selected',
    choiceId: 'test-choice',
  })
  const loading = simulationReducer(selected, {
    type: 'restore-started',
    requestId: 'next',
  })
  const loaded = simulationReducer(loading, {
    type: 'restored',
    requestId: 'next',
    snapshot,
  })
  expect(loaded.selectedChoiceId).toBeNull()
  expect(loaded.snapshot).toBe(snapshot)
})
test('money read models require exact safe integer cents', () => {
  expect(usdCents(-101)).toBe(-101)
  for (const invalid of [0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    expect(() => usdCents(invalid)).toThrow()
})
