import type { SimulationSnapshot } from '../types/domain'

export interface SimulationState {
  readonly status: 'idle' | 'loading' | 'ready' | 'error'
  readonly snapshot: SimulationSnapshot | null
  readonly selectedChoiceId: string | null
  readonly requestId: string | null
  readonly error: string | null
}
export const initialSimulationState: SimulationState = {
  status: 'idle',
  snapshot: null,
  selectedChoiceId: null,
  requestId: null,
  error: null,
}
export type SimulationAction =
  | { type: 'restore-started'; requestId: string }
  | { type: 'restored'; requestId: string; snapshot: SimulationSnapshot | null }
  | { type: 'restore-failed'; requestId: string; message: string }
  | { type: 'choice-selected'; choiceId: string | null }

// This reducer holds UI selections and trusted service snapshots only. It never
// calculates balances, increments the day, or records a submitted response.
export function simulationReducer(
  state: SimulationState,
  action: SimulationAction,
): SimulationState {
  switch (action.type) {
    case 'restore-started':
      return {
        ...state,
        status: 'loading',
        requestId: action.requestId,
        error: null,
      }
    case 'restored':
      if (state.requestId !== action.requestId) return state
      return {
        status: 'ready',
        snapshot: action.snapshot,
        selectedChoiceId: null,
        requestId: null,
        error: null,
      }
    case 'restore-failed':
      if (state.requestId !== action.requestId) return state
      return {
        ...state,
        status: 'error',
        requestId: null,
        error: action.message,
      }
    case 'choice-selected': {
      if (state.status !== 'ready' || state.snapshot?.status !== 'active')
        return state
      if (
        action.choiceId !== null &&
        !state.snapshot.currentScenario?.choices.some(
          (choice) => choice.id === action.choiceId,
        )
      )
        return state
      return { ...state, selectedChoiceId: action.choiceId }
    }
  }
}
