import { toJob, toPersona } from '../services/contentService'
import type { Job, Persona } from '../types/domain'
import {
  createWalkthrough,
  PROFESSIONAL_CLOTHING_COST,
  walkthroughJobs,
  walkthroughReducer,
  type Action,
  type Walkthrough,
} from './employmentWalkthrough'

export interface WalkthroughSession {
  readonly id: string
  readonly initial: Walkthrough
  readonly actions: readonly Action[]
}
const KEY = 'cac-employment-preview-v2'

export function newSession(
  persona: Persona,
  jobs: readonly Job[],
  support: boolean,
): WalkthroughSession {
  return {
    id: crypto.randomUUID(),
    initial: createWalkthrough(
      persona,
      walkthroughJobs(jobs),
      support,
      PROFESSIONAL_CLOTHING_COST,
    ),
    actions: [],
  }
}
export function sessionState(session: WalkthroughSession): Walkthrough {
  return session.actions.reduce(walkthroughReducer, session.initial)
}
export function appendAction(
  session: WalkthroughSession,
  action: Action,
): WalkthroughSession {
  const state = sessionState(session)
  return walkthroughReducer(state, action) === state
    ? session
    : { ...session, actions: [...session.actions, action] }
}

// Replayable logs avoid reapplying pay on refresh. This local preview is never
// a source of authoritative backend finances or authorization.
export function saveSession(session: WalkthroughSession): boolean {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session))
    return true
  } catch {
    return false
  }
}
export function clearSession() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* Storage may be unavailable. */
  }
}

function validateJob(job: Job): Job {
  return toJob({
    job_id: job.id,
    version_id: job.versionId,
    soc_code: job.socCode,
    title: job.title,
    description: job.description,
    hours_per_week: job.hoursPerWeek,
    median_hourly_wage: (job.medianHourlyWage / 100).toFixed(2),
    weekly_gross_income: (job.weeklyGrossIncome / 100).toFixed(2),
    wage_year: job.wageYear,
    area_name: job.areaName,
    wage_source_url: job.wageSourceUrl,
    simulation_requirements: { notes: job.requirementsNote },
    needs_english_skills: job.needsEnglishSkills,
    needs_computer_skills: job.needsComputerSkills,
  })
}
export function restoreSession(): WalkthroughSession | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as WalkthroughSession
    if (
      typeof saved.id !== 'string' ||
      !saved.id ||
      !Array.isArray(saved.actions) ||
      saved.actions.length > 200
    )
      return null
    const initial = saved.initial
    if (typeof initial.support !== 'boolean' || !Array.isArray(initial.jobs))
      return null
    if (!Number.isSafeInteger(initial.clothingCost) || initial.clothingCost < 0)
      return null
    const p = initial.persona
    if (!Number.isSafeInteger(p.startingBalance) || p.startingBalance < 0)
      return null
    const persona = toPersona({
      persona_id: p.id,
      version_id: p.versionId,
      name: p.name,
      description: p.description,
      general_starting_balance: (p.startingBalance / 100).toFixed(2),
      weekly_income: 0,
      starting_job_id: null,
      has_english_skills: p.hasEnglishSkills,
      has_computer_skills: p.hasComputerSkills,
    })
    const jobs = initial.jobs.map(({ job }) => {
      if (
        !Number.isSafeInteger(job.medianHourlyWage) ||
        !Number.isSafeInteger(job.weeklyGrossIncome) ||
        job.medianHourlyWage < 0 ||
        job.weeklyGrossIncome < 0
      )
        throw new Error('Invalid saved wage')
      return validateJob(job)
    })
    const restored: WalkthroughSession = {
      id: saved.id,
      initial: createWalkthrough(
        persona,
        walkthroughJobs(jobs),
        initial.support,
        initial.clothingCost,
      ),
      actions: saved.actions,
    }
    for (const action of restored.actions) {
      if (
        !action ||
        !['prepare', 'apply', 'interview', 'continue', 'end'].includes(
          action.type,
        )
      )
        return null
      if (action.type === 'apply' && typeof action.jobId !== 'string')
        return null
      if (
        action.type === 'interview' &&
        !['purchase', 'current', 'cac', 'owned'].includes(action.choice)
      )
        return null
    }
    sessionState(restored)
    return restored
  } catch {
    return null
  }
}

export function archiveSession(session: WalkthroughSession) {
  try {
    sessionStorage.setItem(
      `${KEY}:history:${session.id}`,
      JSON.stringify(session),
    )
  } catch {
    /* Local storage can be unavailable; gameplay can continue in memory. */
  }
}
