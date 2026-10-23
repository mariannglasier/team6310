import { useCallback, useReducer, useRef } from 'react'
import {
  simulationService,
  ServiceUnavailableError,
  type SimulationService,
} from '../services/simulationService'
import {
  initialSimulationState,
  simulationReducer,
} from '../state/simulationState'

// No automatic requests: a future feature explicitly requests restoration.
export function useSimulation(service: SimulationService = simulationService) {
  const [state, dispatch] = useReducer(
    simulationReducer,
    initialSimulationState,
  )
  const sequence = useRef(0)
  const restore = useCallback(async () => {
    const requestId = String(++sequence.current)
    dispatch({ type: 'restore-started', requestId })
    try {
      const snapshot = await service.restore()
      dispatch({ type: 'restored', requestId, snapshot })
    } catch (error) {
      dispatch({
        type: 'restore-failed',
        requestId,
        message:
          error instanceof ServiceUnavailableError
            ? error.message
            : 'Unable to restore the simulation. Please retry.',
      })
    }
  }, [service])
  const selectChoice = useCallback(
    (choiceId: string | null) =>
      dispatch({ type: 'choice-selected', choiceId }),
    [],
  )
  return { state, restore, selectChoice }
}
