import { expect, it, vi } from 'vitest'
import { usdCents, type Job, type Persona } from '../types/domain'
import {
  appendAction,
  archiveSession,
  newSession,
  restoreSession,
  saveSession,
  sessionState,
} from './walkthroughSession'

const persona: Persona = {
  id: 'p',
  versionId: 'v1',
  name: 'Test household',
  description: 'Test',
  startingBalance: usdCents(10000),
  hasEnglishSkills: false,
  hasComputerSkills: false,
}
const jobs: Job[] = ['target', 'fallback'].map((id) => ({
  id,
  versionId: 'v1',
  title: id,
  description: null,
  socCode: '00-0000',
  hoursPerWeek: 40,
  medianHourlyWage: usdCents(100),
  weeklyGrossIncome: usdCents(4000),
  wageYear: 2025,
  areaName: 'Test',
  wageSourceUrl: 'https://www.bls.gov/',
  requirementsNote: null,
  needsEnglishSkills: false,
  needsComputerSkills: false,
}))

it('restores the same pinned content, clothing charge, income and recap without double effects', () => {
  let session = newSession(persona, jobs, true)
  session = appendAction(session, { type: 'prepare' })
  session = appendAction(session, { type: 'continue' })
  session = appendAction(session, { type: 'apply', jobId: 'target' })
  session = appendAction(session, { type: 'continue' })
  session = appendAction(session, { type: 'continue' })
  session = appendAction(session, { type: 'interview', choice: 'purchase' })
  while (sessionState(session).day < 9)
    session = appendAction(session, { type: 'continue' })
  const paid = sessionState(session)
  expect(paid.stage).toBe('income')
  expect(paid.balance).toBe(8000)
  expect(saveSession(session)).toBe(true)
  expect(sessionState(restoreSession()!)).toEqual(paid)
  expect(sessionState(restoreSession()!).balance).toBe(8000)
  archiveSession(session)
  const replay = newSession(persona, jobs, false)
  expect(replay.id).not.toBe(session.id)
  expect(sessionState(replay).balance).toBe(10000)
  expect(sessionState(replay).history).toEqual([])
  expect(
    sessionStorage.getItem(`cac-employment-preview-v2:history:${session.id}`),
  ).not.toBeNull()
})

it.each([
  'invalid json',
  JSON.stringify({ id: 'x', actions: [] }),
  JSON.stringify({
    id: 'x',
    actions: new Array(201).fill({ type: 'continue' }),
  }),
])('handles malformed local storage', (raw) => {
  sessionStorage.setItem('cac-employment-preview-v2', raw)
  expect(restoreSession()).toBeNull()
})

it('rejects invalid saved actions, mismatched editions and fractional cents', () => {
  const session = newSession(persona, jobs, false)
  const bad = [
    { ...session, actions: [{ type: 'invent-money' }] },
    {
      ...session,
      initial: {
        ...session.initial,
        persona: { ...persona, versionId: 'wrong' },
      },
    },
    {
      ...session,
      initial: {
        ...session.initial,
        jobs: [
          {
            ...session.initial.jobs[0],
            job: { ...jobs[0], weeklyGrossIncome: 1.5 },
          },
        ],
      },
    },
  ]
  for (const saved of bad) {
    sessionStorage.setItem('cac-employment-preview-v2', JSON.stringify(saved))
    expect(restoreSession()).toBeNull()
  }
})

it('reports unavailable browser storage without crashing gameplay', () => {
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota')
  })
  try {
    expect(saveSession(newSession(persona, jobs, false))).toBe(false)
  } finally {
    spy.mockRestore()
  }
})
