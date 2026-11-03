import { useEffect, useState, type ReactNode } from 'react'
import { rememberRun, rememberedRun } from '../services/employmentGameplay'
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
  const [replayOf, setReplayOf] = useState<string | undefined>()
  useEffect(() => {
    let active = true
    void rememberedRun()
      .then((id) => {
        if (active && id)
          recordPlaythrough((current) => current ?? { id, householdName: '' })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  const saveReceipt = (receipt: CreatedPlaythrough) => {
    recordPlaythrough(receipt)
    void rememberRun(receipt.id).catch(() => {})
  }
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
    setReplayOf(support ? employment.runId : undefined)
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
        recordPlaythrough: saveReceipt,
        replayOf,
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
