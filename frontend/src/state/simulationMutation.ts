import { createContext, useContext } from 'react'

export type MutationSource = 'employment' | 'scenario' | 'financial'
export interface SimulationMutation {
  busy: boolean
  begin: (reconcile?: boolean) => boolean
  finish: () => void
  uncertain: (source: MutationSource, value: boolean) => void
}

// Standalone panels retain their existing local guards. The individual layout
// supplies one synchronous gate for all mutations and confirmation dialogs.
export const SimulationMutationContext = createContext<SimulationMutation>({
  busy: false,
  begin: () => true,
  finish: () => {},
  uncertain: () => {},
})
export const useSimulationMutation = () => useContext(SimulationMutationContext)
