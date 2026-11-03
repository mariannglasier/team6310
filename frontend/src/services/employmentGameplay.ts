import { getSupabaseClient } from './supabase'
import { contentService, parseUsdCents } from './contentService'
import type { LoadedPlaythrough } from '../types/playthrough'
import type { Walkthrough, Action } from '../state/employmentWalkthrough'

export type EmploymentAction =
  Action | { type: 'initialize'; replayOf?: string }
export interface CommittedEmployment {
  run: LoadedPlaythrough
  state: Walkthrough | null
  revision: number
}
const stages = [
  'uninitialized',
  'board',
  'preparation-result',
  'application-result',
  'day',
  'interview',
  'interview-result',
  'reapply',
  'reapply-result',
  'income',
  'complete',
  'ended',
]
// A null document cannot prove whether a run is newly created or legacy.
// Only the deployed server trigger can stamp eligibility for initialization.
export class MissingEmploymentMarkerError extends Error {
  constructor() {
    super(
      'This playthrough has no server employment initialization marker and cannot safely start gameplay. If it was just created, ask the facilitator to verify the Phase 2 backend deployment. This run is unchanged; do not create another run to retry.',
    )
    this.name = 'MissingEmploymentMarkerError'
  }
}
export class UnsupportedEmploymentDocumentError extends Error {
  constructor(
    message = 'This playthrough uses an unsupported employment document. It has not been changed.',
  ) {
    super(message)
    this.name = 'UnsupportedEmploymentDocumentError'
  }
}
export function employmentRestoreMessage(error: unknown): string {
  if (
    error instanceof MissingEmploymentMarkerError ||
    error instanceof UnsupportedEmploymentDocumentError
  )
    return error.message
  return 'Unable to load saved employment gameplay. Check your connection and browser storage, then reload. No gameplay changes were submitted.'
}
export function documentState(value: unknown): Record<string, unknown> {
  if (value === null) throw new MissingEmploymentMarkerError()
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new UnsupportedEmploymentDocumentError(
      'Legacy or unsupported employment state. This run has not been changed.',
    )
  const s = value as Record<string, unknown>
  if (
    s.engine !== 'employment-v1' ||
    s.schemaVersion !== 1 ||
    !Number.isSafeInteger(s.revision) ||
    Number(s.revision) < 0 ||
    !stages.includes(String(s.stage)) ||
    !s.receipts ||
    typeof s.receipts !== 'object' ||
    Array.isArray(s.receipts)
  )
    throw new UnsupportedEmploymentDocumentError(
      'Unsupported employment document. This run has not been changed.',
    )
  if (
    Object.keys(s).some(
      (k) =>
        ![
          'engine',
          'schemaVersion',
          'revision',
          'stage',
          'receipts',
          'prepared',
          'hasEnglishSkills',
          'hasComputerSkills',
          'clothing',
          'targetId',
          'initialTargetId',
          'hiredDay',
          'weeklyIncome',
          'assistanceUsed',
          'history',
          'creditedDays',
          'reason',
        ].includes(k),
    )
  )
    throw new UnsupportedEmploymentDocumentError(
      'Unfamiliar employment document',
    )
  if (s.stage !== 'uninitialized') {
    for (const k of [
      'prepared',
      'hasEnglishSkills',
      'hasComputerSkills',
      'assistanceUsed',
    ])
      if (typeof s[k] !== 'boolean')
        throw new UnsupportedEmploymentDocumentError(
          'Invalid employment document',
        )
    if (
      !['none', 'purchased', 'cac'].includes(String(s.clothing)) ||
      !Array.isArray(s.history) ||
      !Array.isArray(s.creditedDays) ||
      (s.hiredDay !== null &&
        (!Number.isInteger(s.hiredDay) ||
          Number(s.hiredDay) < 2 ||
          Number(s.hiredDay) > 3))
    )
      throw new UnsupportedEmploymentDocumentError(
        'Invalid employment document',
      )
    for (const k of ['targetId', 'initialTargetId', 'reason'])
      if (s[k] !== null && typeof s[k] !== 'string')
        throw new UnsupportedEmploymentDocumentError(
          'Invalid employment document',
        )
    parseUsdCents(s.weeklyIncome, 'weeklyIncome')
  }
  return s
}
export async function employmentSnapshot(
  run: LoadedPlaythrough,
): Promise<CommittedEmployment> {
  const s = documentState(run.employmentState)
  if (s.stage === 'uninitialized') {
    if (
      s.revision !== 0 ||
      Object.keys(s.receipts as object).length !== 0 ||
      run.currentDay !== 1 ||
      run.status !== 'active' ||
      run.currentJobId !== null ||
      run.currentScenarioId !== null ||
      run.sessionId !== null ||
      run.supportEnabled !== null ||
      run.currentBalance === null ||
      !run.versionId ||
      !run.persona
    ) {
      throw new UnsupportedEmploymentDocumentError(
        'This playthrough is not eligible for employment initialization. Existing progress has not been changed.',
      )
    }
    return { run, state: null, revision: 0 }
  }
  if (
    !run.persona ||
    !run.versionId ||
    run.currentBalance === null ||
    run.currentDay === null ||
    run.supportEnabled === null
  )
    throw new UnsupportedEmploymentDocumentError('Incomplete saved run')
  if (
    !Number.isInteger(run.currentDay) ||
    run.currentDay < 1 ||
    run.currentDay > 30 ||
    (s.stage === 'complete' &&
      (run.status !== 'completed' || run.currentDay !== 30)) ||
    (s.stage === 'ended' && run.status !== 'ended')
  )
    throw new UnsupportedEmploymentDocumentError('Inconsistent saved progress')
  const jobs = await contentService.loadJobs(run.versionId)
  if (jobs.some((j) => j.versionId !== run.versionId))
    throw new UnsupportedEmploymentDocumentError('Wrong job edition')
  const pregame =
    ['board', 'preparation-result', 'application-result'].includes(
      String(s.stage),
    ) && run.currentDay === 1
  const state: Walkthrough = {
    persona: {
      ...run.persona,
      description: run.persona.description ?? '',
      startingBalance: run.currentBalance,
    },
    jobs: jobs.map((job) => ({ job })),
    support: run.supportEnabled,
    clothingCost: parseUsdCents('60.00', 'clothing'),
    stage: s.stage as Walkthrough['stage'],
    day: pregame ? 0 : run.currentDay,
    balance: run.currentBalance,
    prepared: s.prepared as boolean,
    hasEnglishSkills: s.hasEnglishSkills as boolean,
    hasComputerSkills: s.hasComputerSkills as boolean,
    clothing: s.clothing as Walkthrough['clothing'],
    targetId: s.targetId as string | null,
    initialTargetId: s.initialTargetId as string | null,
    hiredDay: s.hiredDay as number | null,
    weeklyIncome: parseUsdCents(s.weeklyIncome, 'weeklyIncome'),
    assistanceUsed: s.assistanceUsed as boolean,
    reason: s.reason as string | null,
    history: (s.history as Record<string, unknown>[]).map((e) => {
      if (!e || !Number.isInteger(e.day) || typeof e.text !== 'string')
        throw new UnsupportedEmploymentDocumentError('Invalid saved history')
      return {
        day: Number(e.day),
        text: e.text,
        change: parseUsdCents(e.change, 'change'),
      }
    }),
  }
  return { run, state, revision: Number(s.revision) }
}
export async function participantId() {
  const client = await getSupabaseClient()
  const { data, error } = await client.auth.getUser()
  if (error || !data.user || data.user.is_anonymous !== true)
    throw new Error('Existing participant session required')
  return data.user.id
}
const key = (owner: string, suffix: string) =>
  `cac-employment-v1:${owner}:${suffix}`
export async function rememberRun(id: string) {
  localStorage.setItem(key(await participantId(), 'run'), id)
}
export async function rememberedRun() {
  return localStorage.getItem(key(await participantId(), 'run'))
}
export async function submitEmployment(
  run: LoadedPlaythrough,
  revision: number,
  action: EmploymentAction,
  retry = false,
): Promise<CommittedEmployment> {
  const owner = await participantId()
  const pendingKey = key(owner, `pending:${run.id}`)
  const saved = localStorage.getItem(pendingKey)
  if (saved && !retry)
    throw new Error(
      'A previous submission is uncertain. Reconcile it before continuing.',
    )
  const request = saved
    ? JSON.parse(saved)
    : { id: crypto.randomUUID(), revision, action }
  localStorage.setItem(pendingKey, JSON.stringify(request))
  const client = await getSupabaseClient()
  const { data, error } = await client.rpc('submit_employment_action', {
    p_run_id: run.id,
    p_request_id: request.id,
    p_revision: request.revision,
    p_action: request.action,
  })
  if (error?.code === 'P0001') {
    localStorage.removeItem(pendingKey)
    throw new Error(
      'Action rejected by the server. Refresh to load saved progress before retrying.',
    )
  }
  if (error || !data?.run)
    throw new Error(
      'Submission is not confirmed. Retry reconciliation before continuing.',
    )
  const row = data.run
  if (
    row.playthrough_id !== run.id ||
    row.owner_user_id !== owner ||
    row.version_id !== run.versionId ||
    row.persona_id !== run.personaId
  )
    throw new Error('Unexpected committed run')
  const committed = {
    ...run,
    employmentState: row.employment_state,
    currentBalance: parseUsdCents(row.current_balance, 'balance'),
    currentDay: row.current_day,
    currentJobId: row.current_job_id,
    supportEnabled: row.cac_support_enabledabled,
    status: row.status,
  }
  const snapshot = await employmentSnapshot(committed)
  localStorage.removeItem(pendingKey)
  return snapshot
}
export async function hasPending(id: string) {
  return (
    localStorage.getItem(key(await participantId(), `pending:${id}`)) !== null
  )
}

export async function findOwnedRuns() {
  const owner = await participantId()
  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('playthroughs')
    .select('playthrough_id,status,current_day')
    .eq('owner_user_id', owner)
    .order('started_at', { ascending: false })
    .limit(20)
  if (error)
    throw new Error(
      'Unable to list saved playthroughs. No replacement was created.',
    )
  return (data ?? []) as {
    playthrough_id: string
    status: string | null
    current_day: number | null
  }[]
}
