import { useState, type ReactNode } from 'react'
import {
  SetupContext,
  type CreatedPlaythrough,
  type EmploymentOverlay,
} from './setupContext'

export function SetupProvider({ children }: { children: ReactNode }) {
  const [selectedId, select] = useState<string | null>(null)
  const [createdPlaythrough, recordPlaythrough] =
    useState<CreatedPlaythrough | null>(null)
  const [employment, setEmployment] = useState<EmploymentOverlay | null>(null)
  const [supportForNext, setSupportForNext] = useState(false)
  function replay(support: boolean) {
    if (
      employment?.state.stage !== 'complete' &&
      employment?.state.stage !== 'ended'
    )
      return
    if (
      support &&
      (employment.state.stage !== 'complete' || employment.state.support)
    )
      return
    setEmployment(null)
    recordPlaythrough(null)
    select(null)
    setSupportForNext(support)
  }
  return (
    <SetupContext.Provider
      value={{
        selectedId,
        select,
        createdPlaythrough,
        recordPlaythrough,
        employment,
        setEmployment,
        supportForNext,
        replay,
      }}
    >
      {children}
    </SetupContext.Provider>
  )
}
