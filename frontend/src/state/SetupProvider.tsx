import { useMemo, useState, type ReactNode } from 'react'
import { SetupContext, type CreatedPlaythrough } from './setupContext'

export function SetupProvider({ children }: { children: ReactNode }) {
  const [selectedId, select] = useState<string | null>(null)
  const [createdPlaythrough, recordPlaythrough] =
    useState<CreatedPlaythrough | null>(null)
  const value = useMemo(
    () => ({ selectedId, select, createdPlaythrough, recordPlaythrough }),
    [selectedId, createdPlaythrough],
  )
  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>
}
