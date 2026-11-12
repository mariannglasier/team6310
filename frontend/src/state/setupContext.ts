import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { Walkthrough } from './employmentWalkthrough'

export interface EmploymentOverlay {
  readonly runId: string
  readonly state: Walkthrough
}

// Creation receipt only; this is not a synchronized simulation snapshot.
export interface CreatedPlaythrough {
  readonly id: string
  readonly householdName: string
}

export interface SetupSelection {
  readonly setupRestoring: boolean
  readonly replayOf?: string
  readonly employment: EmploymentOverlay | null
  readonly setEmployment: Dispatch<SetStateAction<EmploymentOverlay | null>>
  readonly supportForNext: boolean
  readonly replay: (support: boolean) => Promise<void>
  readonly prepareHomeNavigation: () => Promise<void>
  readonly leavePlaythrough: () => Promise<void>
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
