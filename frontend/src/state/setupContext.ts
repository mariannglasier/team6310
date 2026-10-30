import { createContext, useContext } from 'react'

// Creation receipt only; this is not a synchronized simulation snapshot.
export interface CreatedPlaythrough {
  readonly id: string
  readonly householdName: string
}

export interface SetupSelection {
  readonly createdPlaythrough: CreatedPlaythrough | null
  readonly recordPlaythrough: (playthrough: CreatedPlaythrough) => void
  readonly selectedId: string | null
  readonly select: (personaId: string | null) => void
}

export const SetupContext = createContext<SetupSelection | null>(null)

export function useSetup(): SetupSelection {
  const value = useContext(SetupContext)
  if (!value) throw new Error('useSetup must be used inside SetupProvider')
  return value
}
