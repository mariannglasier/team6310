import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  forgetRun,
  rememberRun,
  rememberedRun,
} from '../services/employmentGameplay'
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
  const locatorGeneration = useRef(0)
  useEffect(() => {
    let active = true
    const generation = locatorGeneration.current
    void rememberedRun()
      .then((id) => {
        if (active && id && generation === locatorGeneration.current)
          recordPlaythrough((current) => current ?? { id, householdName: '' })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  const saveReceipt = (receipt: CreatedPlaythrough) => {
    locatorGeneration.current += 1
    recordPlaythrough(receipt)
    void rememberRun(receipt.id).catch(() => {})
  }
  const [supportForNext, setSupportForNext] = useState(false)
  async function leavePlaythrough() {
    locatorGeneration.current += 1
    if (createdPlaythrough) await forgetRun(createdPlaythrough.id)
    recordPlaythrough(null)
    setEmployment(null)
    setReplayOf(undefined)
    setSupportForNext(false)
    select(null)
  }
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
        leavePlaythrough,
      }}
    >
      {children}
    </SetupContext.Provider>
  )
}
