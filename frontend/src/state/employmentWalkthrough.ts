import {
  usdCents,
  type Job,
  type Persona,
  type UsdCents,
} from '../types/domain'

// Local walkthrough state only. Never sent to protected simulation operations.
export type Stage =
  | 'board'
  | 'preparation-result'
  | 'application-result'
  | 'day'
  | 'interview'
  | 'interview-result'
  | 'reapply'
  | 'reapply-result'
  | 'income'
  | 'complete'
  | 'ended'
export type Clothing = 'purchase' | 'current' | 'cac' | 'owned'
export interface WalkthroughJob {
  readonly job: Job
}
export interface Entry {
  readonly day: number
  readonly text: string
  readonly change: UsdCents
}
export interface Walkthrough {
  readonly persona: Persona
  readonly jobs: readonly WalkthroughJob[]
  readonly support: boolean
  readonly clothingCost: UsdCents
  readonly stage: Stage
  readonly day: number
  readonly balance: UsdCents
  readonly prepared: boolean
  readonly hasEnglishSkills: boolean
  readonly hasComputerSkills: boolean
  readonly clothing: 'none' | 'purchased' | 'cac'
  readonly targetId: string | null
  readonly initialTargetId: string | null
  readonly hiredDay: number | null
  readonly weeklyIncome: UsdCents
  readonly assistanceUsed: boolean
  readonly history: readonly Entry[]
  readonly reason: string | null
}
export type Action =
  | { type: 'prepare' }
  | { type: 'apply'; jobId: string }
  | { type: 'interview'; choice: Clothing }
  | { type: 'continue' }
  | { type: 'end' }

// Qualification flags are content from Supabase, never inferred from wages,
// job titles, or household descriptions. Missing rules fail closed.
export function walkthroughJobs(
  jobs: readonly Job[],
): readonly WalkthroughJob[] {
  return jobs.map((job) => ({ job }))
}

export function qualifiesForJob(
  job: Job,
  skills: {
    hasEnglishSkills: boolean | null
    hasComputerSkills: boolean | null
  },
): boolean {
  if (
    typeof job.needsEnglishSkills !== 'boolean' ||
    typeof job.needsComputerSkills !== 'boolean' ||
    typeof skills.hasEnglishSkills !== 'boolean' ||
    typeof skills.hasComputerSkills !== 'boolean'
  )
    return false
  return (
    (!job.needsEnglishSkills || skills.hasEnglishSkills) &&
    (!job.needsComputerSkills || skills.hasComputerSkills)
  )
}

export function validateSkillsCatalog(
  persona: Persona,
  jobs: readonly Job[],
): string | null {
  if (
    typeof persona.hasEnglishSkills !== 'boolean' ||
    typeof persona.hasComputerSkills !== 'boolean'
  )
    return 'Set this household’s English and computer skills in Supabase before starting.'
  if (
    jobs.filter(
      (job) =>
        job.needsEnglishSkills === false && job.needsComputerSkills === false,
    ).length < 2
  )
    return 'The catalog must contain at least two jobs that require neither English nor computer skills.'
  return null
}

// Fixed $60 clothing price approved by the team on November 1, 2026.
export const PROFESSIONAL_CLOTHING_COST = usdCents(6000)

export function createWalkthrough(
  persona: Persona,
  jobs: readonly WalkthroughJob[],
  support: boolean,
  clothingCost: UsdCents,
): Walkthrough {
  if (
    clothingCost < 0 ||
    jobs.some(({ job }) => job.versionId !== persona.versionId) ||
    typeof persona.hasEnglishSkills !== 'boolean' ||
    typeof persona.hasComputerSkills !== 'boolean'
  )
    throw new Error('Invalid walkthrough content')
  return {
    persona,
    jobs,
    support,
    clothingCost,
    stage: 'board',
    day: 0,
    balance: persona.startingBalance,
    prepared: false,
    hasEnglishSkills: persona.hasEnglishSkills,
    hasComputerSkills: persona.hasComputerSkills,
    clothing: 'none',
    targetId: null,
    initialTargetId: null,
    hiredDay: null,
    weeklyIncome: usdCents(0),
    assistanceUsed: false,
    history: [],
    reason: null,
  }
}

export function availableJobs(state: Walkthrough) {
  return state.jobs.filter(
    (item) =>
      qualifiesForJob(item.job, state) &&
      (state.stage !== 'reapply' || item.job.id !== state.initialTargetId),
  )
}

export function clothingOptions(state: Walkthrough): readonly Clothing[] {
  return state.clothing !== 'none'
    ? ['owned']
    : state.support
      ? ['purchase', 'current', 'cac']
      : ['purchase', 'current']
}

function record(
  state: Walkthrough,
  text: string,
  change = usdCents(0),
): Walkthrough {
  return {
    ...state,
    balance: usdCents(state.balance + change),
    history: [...state.history, { day: state.day, text, change }],
  }
}

function enterDay(state: Walkthrough, day: number): Walkthrough {
  const next = { ...state, day, stage: 'day' as const }
  if (
    state.hiredDay !== null &&
    day > state.hiredDay &&
    (day - state.hiredDay) % 7 === 0
  ) {
    return {
      ...record(next, 'Weekly pay received', state.weeklyIncome),
      stage: 'income',
    }
  }
  return day === 2 || (day === 3 && state.hiredDay === null)
    ? { ...next, stage: 'interview' }
    : next
}

export function walkthroughReducer(
  state: Walkthrough,
  action: Action,
): Walkthrough {
  if (state.stage === 'complete' || state.stage === 'ended') return state
  if (action.type === 'end')
    return { ...state, stage: 'ended', reason: 'You ended the walkthrough.' }
  if (action.type === 'prepare') {
    if (state.stage !== 'board' || !state.support || state.prepared)
      return state
    return {
      ...record(state, 'Completed simulated CAC preparation'),
      prepared: true,
      hasEnglishSkills: true,
      hasComputerSkills: true,
      assistanceUsed: true,
      stage: 'preparation-result',
    }
  }
  if (action.type === 'apply') {
    if (state.stage !== 'board' && state.stage !== 'reapply') return state
    const job = availableJobs(state).find(
      (item) => item.job.id === action.jobId,
    )
    if (!job) return state
    // Keep another eligible job available after the scripted first failure.
    if (
      state.stage === 'board' &&
      !state.jobs.some(
        (item) =>
          qualifiesForJob(item.job, state) && item.job.id !== job.job.id,
      )
    )
      return state
    return {
      ...record(state, `Applied for ${job.job.title}`),
      targetId: job.job.id,
      initialTargetId: state.initialTargetId ?? job.job.id,
      stage: state.stage === 'board' ? 'application-result' : 'reapply-result',
    }
  }
  if (action.type === 'interview') {
    if (
      state.stage !== 'interview' ||
      !clothingOptions(state).includes(action.choice)
    )
      return state
    const job = state.jobs.find((item) => item.job.id === state.targetId)?.job
    if (!job) return state
    const cost = action.choice === 'purchase' ? state.clothingCost : usdCents(0)
    if (cost > state.balance)
      return {
        ...state,
        stage: 'ended',
        reason:
          'You could not afford the selected professional clothing. No purchase was charged.',
      }
    const clothing =
      action.choice === 'purchase'
        ? 'purchased'
        : action.choice === 'cac'
          ? 'cac'
          : state.clothing
    const hired = state.day === 3 || (state.prepared && clothing !== 'none')
    const next = record(
      state,
      action.choice === 'purchase'
        ? 'Purchased professional clothing'
        : action.choice === 'cac'
          ? 'Received CAC professional clothing'
          : action.choice === 'owned'
            ? 'Reused professional clothing'
            : 'Made current clothes work',
      usdCents(-cost),
    )
    return {
      ...record(
        next,
        hired
          ? `Hired as ${job.title}`
          : 'First interview did not lead to an offer',
      ),
      clothing,
      hiredDay: hired ? state.day : null,
      weeklyIncome: hired ? job.weeklyGrossIncome : usdCents(0),
      assistanceUsed: state.assistanceUsed || action.choice === 'cac',
      stage: 'interview-result',
    }
  }
  switch (state.stage) {
    case 'preparation-result':
      return { ...state, stage: 'board' }
    case 'application-result':
      return enterDay(state, 1)
    case 'interview-result':
      return { ...state, stage: state.hiredDay === null ? 'reapply' : 'day' }
    case 'reapply-result':
      return { ...state, stage: 'day' }
    case 'income':
      return { ...state, stage: 'day' }
    case 'day':
      return state.day === 30
        ? { ...state, stage: 'complete' }
        : enterDay(state, state.day + 1)
    default:
      return state
  }
}
