import { createContext, useContext } from 'react'

// Temporary UI selection shared by the setup screens. It is not a run: choosing
// a household creates nothing, locks nothing, and changes no finances.
export interface SetupSelection {
  readonly selectedId: string | null
  readonly select: (personaId: string | null) => void
}

export const SetupContext = createContext<SetupSelection | null>(null)

export function useSetup(): SetupSelection {
  const value = useContext(SetupContext)
  if (!value) throw new Error('useSetup must be used inside SetupProvider')
  return value
}
