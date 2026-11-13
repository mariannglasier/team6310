import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  forgetRun,
  rememberRun,
  rememberedRun,
  rememberedReplay,
  rememberReplay,
  isBeforeEmploymentEnd,
} from '../services/employmentGameplay'
import type { LoadedPlaythrough } from '../types/playthrough'
import { loadPlaythrough } from '../services/loadPlaythrough'
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
  const [supportForNext, setSupportForNext] = useState(false)
  const [setupRestoring, setSetupRestoring] = useState(true)
  const locatorGeneration = useRef(0)
  const selectedRun = useRef<CreatedPlaythrough | null>(null)
  const restoration = useRef<Promise<void>>(Promise.resolve())
  const locatorWrite = useRef<Promise<void>>(Promise.resolve())
  const cleanupBusy = useRef(false)
  useEffect(() => {
    let active = true
    const generation = locatorGeneration.current
    restoration.current = Promise.all([rememberedRun(), rememberedReplay()])
      .then(([id, previous]) => {
        if (active && generation === locatorGeneration.current) {
          if (id && !selectedRun.current) {
            selectedRun.current = { id, householdName: '' }
            recordPlaythrough(selectedRun.current)
          }
          setReplayOf(previous)
          setSupportForNext(Boolean(previous))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setSetupRestoring(false)
      })
    return () => {
      active = false
    }
  }, [])
  const saveReceipt = (receipt: CreatedPlaythrough) => {
    locatorGeneration.current += 1
    selectedRun.current = receipt
    recordPlaythrough(receipt)
    locatorWrite.current = locatorWrite.current
      .then(() => rememberRun(receipt.id))
      .catch(() => {})
  }
  async function leavePlaythrough(nextReplayOf?: string) {
    if (cleanupBusy.current)
      throw new Error(
        'Playthrough cleanup is already in progress. Please retry.',
      )
    cleanupBusy.current = true
    try {
      const generation = ++locatorGeneration.current
      const id = selectedRun.current?.id
      // A delayed save must finish before removing its matching locator.
      await locatorWrite.current
      if (generation !== locatorGeneration.current)
        throw new Error('The selected playthrough changed. Please retry.')
      if (id) await forgetRun(id)
      await rememberReplay(nextReplayOf)
      if (generation !== locatorGeneration.current)
        throw new Error('The selected playthrough changed. Please retry.')
      selectedRun.current = null
      recordPlaythrough(null)
      setEmployment(null)
      setReplayOf(nextReplayOf)
      setSupportForNext(Boolean(nextReplayOf))
      setSetupRestoring(false)
      select(null)
    } finally {
      cleanupBusy.current = false
    }
  }
  async function prepareHomeNavigation() {
    await restoration.current
    const id = selectedRun.current?.id
    if (!id) return
    const saved = await loadPlaythrough(id)
    if (selectedRun.current?.id !== id)
      throw new Error('The selected playthrough changed. Please retry.')
    if (saved?.status === 'completed' || saved?.status === 'ended') {
      await leavePlaythrough()
    } else if (saved?.status !== 'active') {
      throw new Error('Unable to verify saved progress. Please retry.')
    }
  }
  async function replay(support: boolean, terminalRun?: LoadedPlaythrough) {
    if (
      !support &&
      terminalRun?.id === selectedRun.current?.id &&
      terminalRun?.status === 'ended' &&
      isBeforeEmploymentEnd(terminalRun.employmentState)
    ) {
      await leavePlaythrough()
      return
    }
    if (
      employment?.state.stage !== 'complete' &&
      employment?.state.stage !== 'ended'
    )
      throw new Error('Only a finished playthrough can be replayed.')
    if (
      support &&
      (employment.state.stage !== 'complete' || employment.state.support)
    )
      throw new Error('This playthrough is not eligible for CAC replay.')
    await leavePlaythrough(support ? employment.runId : undefined)
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
        prepareHomeNavigation,
        setupRestoring,
      }}
    >
      {children}
    </SetupContext.Provider>
  )
}
