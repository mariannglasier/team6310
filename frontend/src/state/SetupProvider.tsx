import { useMemo, useState, type ReactNode } from 'react'
import { SetupContext } from './setupContext'

export function SetupProvider({ children }: { children: ReactNode }) {
  const [selectedId, select] = useState<string | null>(null)
  const value = useMemo(() => ({ selectedId, select }), [selectedId])
  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>
}
