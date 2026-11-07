import { describe, expect, it } from 'vitest'
import { usdCents, type Job, type Persona } from '../types/domain'
import {
  availableJobs,
  clothingOptions,
  createWalkthrough,
  walkthroughReducer as act,
  type Clothing,
  type Walkthrough,
  qualifiesForJob,
  validateSkillsCatalog,
} from './employmentWalkthrough'

const persona: Persona = {
  id: 'p',
  versionId: 'v1',
  name: 'Test household',
  description: 'Test only',
  startingBalance: usdCents(10000),
  hasEnglishSkills: false,
  hasComputerSkills: false,
}
const job = (id: string): Job => ({
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
})
const jobs = ['first', 'fallback', 'prepared-only'].map((id) => ({
  job: {
    ...job(id),
    needsEnglishSkills: id === 'prepared-only',
    needsComputerSkills: id === 'prepared-only',
  },
}))
const start = (support = false) =>
  createWalkthrough(persona, jobs, support, usdCents(6000))
function interview(support: boolean, preparation: boolean, choice: Clothing) {
  let state = start(support)
  if (preparation) {
    state = act(state, { type: 'prepare' })
    state = act(state, { type: 'continue' })
  }
  state = act(state, { type: 'apply', jobId: 'first' })
  state = act(state, { type: 'continue' })
  state = act(state, { type: 'continue' })
  return act(state, { type: 'interview', choice })
}
function fallback(state: Walkthrough, choice: Clothing) {
  state = act(state, { type: 'continue' })
  expect(state.day).toBe(2)
  expect(state.stage).toBe('reapply')
  state = act(state, { type: 'apply', jobId: 'fallback' })
  expect(state.day).toBe(2)
  state = act(state, { type: 'continue' })
  expect(state.day).toBe(2)
  state = act(state, { type: 'continue' })
  expect(state.stage).toBe('interview')
  return act(state, { type: 'interview', choice })
}

describe('opening employment sequence', () => {
  it.each([
    ['Alex', true, false, 6],
    ['Jordan', true, false, 6],
    ['Patricia', false, false, 3],
    ['Sofia', false, true, 3],
  ] as const)(
    'uses %s’s approved starting skills without other qualifications',
    (name, hasEnglishSkills, hasComputerSkills, count) => {
      const catalog = [
        'free-1',
        'free-2',
        'free-3',
        'english-1',
        'english-2',
        'english-3',
        'both-1',
        'both-2',
      ].map((id) => ({
        job: {
          ...job(id),
          needsEnglishSkills: !id.startsWith('free'),
          needsComputerSkills: id.startsWith('both'),
        },
      }))
      const state = createWalkthrough(
        { ...persona, name, hasEnglishSkills, hasComputerSkills },
        catalog,
        true,
        usdCents(6000),
      )
      expect(availableJobs(state)).toHaveLength(count)
      const prepared = act(state, { type: 'prepare' })
      expect(availableJobs(prepared)).toHaveLength(8)
      expect(state.persona.hasEnglishSkills).toBe(hasEnglishSkills)
      expect(state.persona.hasComputerSkills).toBe(hasComputerSkills)
    },
  )
  it.each(
    [false, true].flatMap((english) =>
      [false, true].flatMap((computer) =>
        [false, true].flatMap((needsEnglish) =>
          [false, true].map(
            (needsComputer) =>
              [english, computer, needsEnglish, needsComputer] as const,
          ),
        ),
      ),
    ),
  )(
    'English=%s computer=%s needs English=%s computer=%s',
    (
      hasEnglishSkills,
      hasComputerSkills,
      needsEnglishSkills,
      needsComputerSkills,
    ) => {
      expect(
        qualifiesForJob(
          { ...job('test'), needsEnglishSkills, needsComputerSkills },
          { hasEnglishSkills, hasComputerSkills },
        ),
      ).toBe(
        (!needsEnglishSkills || hasEnglishSkills) &&
          (!needsComputerSkills || hasComputerSkills),
      )
    },
  )
  it('requires two jobs needing neither skill and rejects unknown household skills', () => {
    expect(
      validateSkillsCatalog(
        persona,
        jobs.map((item) => item.job),
      ),
    ).toBeNull()
    expect(validateSkillsCatalog(persona, [job('only')])).toMatch(
      /at least two jobs/,
    )
    expect(
      validateSkillsCatalog(persona, [
        job('one'),
        { ...job('unknown'), needsEnglishSkills: null },
      ]),
    ).toMatch(/at least two jobs/)
    expect(
      validateSkillsCatalog({ ...persona, hasEnglishSkills: null }, [
        job('a'),
        job('b'),
      ]),
    ).toMatch(/household/)
    expect(
      qualifiesForJob({ ...job('unknown'), needsEnglishSkills: null }, persona),
    ).toBe(false)
  })
  it('reapplication offers every other eligible job, including skill-requiring jobs', () => {
    let state = act(start(true), { type: 'prepare' })
    expect(state.persona.hasEnglishSkills).toBe(false)
    expect(state.hasEnglishSkills).toBe(true)
    expect(state.hasComputerSkills).toBe(true)
    state = act(state, { type: 'continue' })
    state = act(state, { type: 'apply', jobId: 'first' })
    state = act(act(state, { type: 'continue' }), { type: 'continue' })
    state = act(state, { type: 'interview', choice: 'current' })
    state = act(state, { type: 'continue' })
    expect(availableJobs(state).map((item) => item.job.id)).toEqual([
      'fallback',
      'prepared-only',
    ])
    expect(act(state, { type: 'apply', jobId: 'first' })).toBe(state)
    const applied = act(state, { type: 'apply', jobId: 'prepared-only' })
    expect(applied.targetId).toBe('prepared-only')
    expect(applied.day).toBe(2)
  })
  it.each([
    [true, true, 'purchase', 2],
    [true, true, 'cac', 2],
    [true, true, 'current', null],
    [true, false, 'purchase', null],
    [true, false, 'cac', null],
    [true, false, 'current', null],
    [false, false, 'purchase', null],
    [false, false, 'current', null],
  ] as const)(
    'support=%s preparation=%s clothing=%s hires on %s',
    (support, prepared, choice, expected) => {
      expect(interview(support, prepared, choice).hiredDay).toBe(expected)
    },
  )
  it('does not grant preparation or assistance merely by enabling CAC', () => {
    const state = start(true)
    expect(state.prepared).toBe(false)
    expect(state.assistanceUsed).toBe(false)
    expect(availableJobs(state).map((item) => item.job.id)).not.toContain(
      'prepared-only',
    )
    expect(act(state, { type: 'prepare' }).prepared).toBe(true)
    expect(act(start(false), { type: 'prepare' }).prepared).toBe(false)
  })
  it('reapplies on Day 2 and reuses purchased clothing without another charge', () => {
    const first = interview(false, false, 'purchase')
    expect(first.balance).toBe(4000)
    expect(clothingOptions(first)).toEqual(['owned'])
    const hired = fallback(first, 'owned')
    expect(hired.balance).toBe(4000)
    expect(hired.hiredDay).toBe(3)
  })
  it.each(['current', 'purchase', 'cac'] as const)(
    'Day 3 hires with %s without a preparation gate',
    (choice) => {
      expect(fallback(interview(true, false, 'current'), choice).hiredDay).toBe(
        3,
      )
    },
  )
  it('ends an unaffordable purchase without a deduction or hiring', () => {
    let state = { ...start(), balance: usdCents(5999) }
    state = act(state, { type: 'apply', jobId: 'first' })
    state = act(act(state, { type: 'continue' }), { type: 'continue' })
    state = act(state, { type: 'interview', choice: 'purchase' })
    expect(state.stage).toBe('ended')
    expect(state.balance).toBe(5999)
    expect(state.hiredDay).toBeNull()
    expect(state.history.some((entry) => entry.change !== 0)).toBe(false)
  })
  it('rejects stale submissions, unavailable choices, wrong editions and invalid targets', () => {
    const state = start()
    expect(act(state, { type: 'apply', jobId: 'prepared-only' })).toBe(state)
    expect(act(state, { type: 'interview', choice: 'cac' })).toBe(state)
    const applied = act(state, { type: 'apply', jobId: 'first' })
    expect(act(applied, { type: 'apply', jobId: 'first' })).toBe(applied)
    expect(() =>
      createWalkthrough(
        persona,
        [{ ...jobs[0], job: { ...job('bad'), versionId: 'v2' } }],
        false,
        usdCents(0),
      ),
    ).toThrow()
    const hired = interview(true, true, 'cac')
    expect(act(hired, { type: 'interview', choice: 'purchase' })).toBe(hired)
  })
  it.each([2, 3])(
    'pays seven days after a Day %s hire and completes only after Day 30',
    (hiredDay) => {
      let state =
        hiredDay === 2
          ? interview(true, true, 'cac')
          : fallback(interview(false, false, 'current'), 'current')
      expect(state.balance).toBe(persona.startingBalance)
      let count = 0
      const days: number[] = []
      while (state.stage !== 'complete' && count++ < 80) {
        if (state.stage === 'income') days.push(state.day)
        state = act(state, { type: 'continue' })
      }
      expect(state.day).toBe(30)
      expect(state.stage).toBe('complete')
      expect(days).toEqual(hiredDay === 2 ? [9, 16, 23, 30] : [10, 17, 24])
      expect(state.balance).toBe(10000 + days.length * 4000)
      expect(act(state, { type: 'continue' })).toBe(state)
      const replay = start()
      expect(replay.day).toBe(0)
      expect(replay.history).toEqual([])
      expect(replay.weeklyIncome).toBe(0)
    },
  )
})
