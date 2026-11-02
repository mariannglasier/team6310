import { useMemo, useState, type ReactNode } from 'react'
import { SetupContext } from './setupContext'
import {
  appendAction,
  archiveSession,
  clearSession,
  newSession,
  restoreSession,
  saveSession,
  sessionState,
} from './walkthroughSession'
import type { Job, Persona } from '../types/domain'
import type { Action } from './employmentWalkthrough'

export function SetupProvider({ children }: { children: ReactNode }) {
  const [selectedId, select] = useState<string | null>(null)
  const [session, setSession] = useState(restoreSession)
  const [supportForNext, setSupportForNext] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const walkthrough = useMemo(
    () => (session ? sessionState(session) : null),
    [session],
  )
  const startPreview = (persona: Persona, jobs: readonly Job[]) => {
    if (session) archiveSession(session)
    const next = newSession(persona, jobs, supportForNext)
    setStorageAvailable(saveSession(next))
    setSession(next)
  }
  const dispatchPreview = (action: Action) => {
    if (!session) return
    const next = appendAction(session, action)
    if (next === session) return
    setStorageAvailable(saveSession(next))
    setSession(next)
  }
  const resetPreview = (support: boolean) => {
    if (support && walkthrough?.stage !== 'complete') return
    if (session) archiveSession(session)
    setSupportForNext(support)
    clearSession()
    setSession(null)
    select(null)
  }
  return (
    <SetupContext.Provider
      value={{
        selectedId,
        select,
        walkthrough,
        supportForNext,
        storageAvailable,
        startPreview,
        dispatchPreview,
        resetPreview,
      }}
    >
      {children}
    </SetupContext.Provider>
  )
}
