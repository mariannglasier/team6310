import { ensureParticipantSession } from './participantSession'
import { getSupabaseClient } from './supabase'

export interface GroupSession {
  sessionId: string
  joinCode: string
  status: 'open' | 'closed'
  currentScenarioId: string | null
  createdAt: string
  versionId: string
  decisionDurationSeconds: DecisionDuration
  participantCount: number
  participantId: string | null
  isHost: boolean
  roundState: 'lobby' | 'voting' | 'results' | 'completed'
  currentQuestionNumber: number
  totalQuestionCount: number
  roundDeadline: string | null
  acceptingVotes: boolean
  selectedChoiceId: string | null
  voteCount: number
  question: GroupQuestion | null
  householdId: string | null
  householdName: string | null
  ready: boolean
  readyCount: number
  participants: GroupParticipant[] | null
  roundType: 'preparation' | 'job' | 'clothing' | 'scenario'
  currentDay: number
  totalDayCount: 30
  selectedJobId: string | null
  winningJobId: string | null
  jobs: GroupJob[] | null
  cacSupportEnabled: boolean
  sharedHouseholdId: string | null
  sharedHouseholdName: string | null
  sharedBalance: number | string | null
  employmentStage:
    | 'household'
    | 'preparation'
    | 'job'
    | 'clothing'
    | 'interview-result'
    | 'complete'
  employmentAttempt: 1 | 2
  employmentPrepared: boolean
  clothingChoice: 'purchase' | 'current' | 'cac' | 'owned' | null
  interviewHired: boolean | null
  weeklyIncome: number | string
  selectedEmploymentOption: string | null
  employmentOptions: GroupEmploymentOption[] | null
  householdVotes: GroupHouseholdVote[] | null
  sharedExpenses: GroupSharedExpense[] | null
}
export interface GroupEmploymentOption {
  optionId: string
  text: string
  cost?: number | string
  voteCount: number | null
}
export interface GroupHouseholdVote {
  householdId: string
  householdName: string
  voteCount: number
}
export interface GroupSharedExpense {
  expenseId: string
  name: string
  amount: number | string
  firstDueDay: number
  repeatIntervalDays: number | null
}
export interface GroupJob {
  jobId: string
  title: string
  description: string | null
  hoursPerWeek: number
  weeklyGrossIncome: number | string
  voteCount: number | null
}
export interface GroupParticipant {
  participantId: string
  alias: string
  householdId: string | null
  householdName: string | null
  ready: boolean
}
export interface GroupQuestion {
  scenarioId: string
  title: string
  description: string
  choices: Array<{ choiceId: string; text: string; voteCount: number | null }>
}
export type DecisionDuration = 30 | 60 | 90 | 120
async function request(
  name:
    | 'configure_host_group_session'
    | 'join_group_session'
    | 'get_group_session_state'
    | 'update_group_session_state'
    | 'control_group_session'
    | 'submit_group_vote'
    | 'submit_group_job_vote'
    | 'submit_group_employment_vote'
    | 'update_group_participant_setup',
  args: Record<string, unknown>,
): Promise<GroupSession | null> {
  await ensureParticipantSession()
  const client = await getSupabaseClient()
  const { data, error } = await client.rpc(name, args)
  if (error) throw new Error('Unable to load the group session. Please retry.')
  if (data === null) return null
  if (typeof data !== 'object' || Array.isArray(data))
    throw new Error('Session information is unavailable. Please retry.')
  if (typeof data.error === 'string') throw new Error(data.error)
  if (
    !['sessionId', 'joinCode', 'createdAt', 'versionId'].every(
      (key) => typeof data[key] === 'string',
    ) ||
    !['open', 'closed'].includes(data.status as string) ||
    !(
      data.currentScenarioId === null ||
      typeof data.currentScenarioId === 'string'
    ) ||
    !(data.participantId === null || typeof data.participantId === 'string') ||
    typeof data.isHost !== 'boolean' ||
    ![30, 60, 90, 120].includes(data.decisionDurationSeconds as number) ||
    !Number.isSafeInteger(data.participantCount) ||
    (data.participantCount as number) < 0
  )
    throw new Error('Session information is unavailable. Please retry.')
  const question = data.question
  if (
    question !== undefined &&
    question !== null &&
    (typeof question !== 'object' ||
      Array.isArray(question) ||
      typeof question.scenarioId !== 'string' ||
      typeof question.title !== 'string' ||
      typeof question.description !== 'string' ||
      !Array.isArray(question.choices))
  )
    throw new Error('Session information is unavailable. Please retry.')
  return {
    ...data,
    roundState: data.roundState ?? 'lobby',
    currentQuestionNumber: data.currentQuestionNumber ?? 0,
    totalQuestionCount: data.totalQuestionCount ?? 0,
    roundDeadline: data.roundDeadline ?? null,
    acceptingVotes: data.acceptingVotes ?? false,
    selectedChoiceId: data.selectedChoiceId ?? null,
    voteCount: data.voteCount ?? 0,
    question: question ?? null,
    householdId: data.householdId ?? null,
    householdName: data.householdName ?? null,
    ready: data.ready ?? false,
    readyCount: data.readyCount ?? 0,
    participants: data.participants ?? null,
    roundType: data.roundType ?? 'scenario',
    currentDay: data.currentDay ?? data.currentQuestionNumber ?? 0,
    totalDayCount: 30,
    selectedJobId: data.selectedJobId ?? null,
    winningJobId: data.winningJobId ?? null,
    jobs: data.jobs ?? null,
    cacSupportEnabled: data.cacSupportEnabled ?? false,
    sharedHouseholdId: data.sharedHouseholdId ?? null,
    sharedHouseholdName: data.sharedHouseholdName ?? null,
    sharedBalance: data.sharedBalance ?? null,
    employmentStage: data.employmentStage ?? 'household',
    employmentAttempt: data.employmentAttempt ?? 1,
    employmentPrepared: data.employmentPrepared ?? false,
    clothingChoice: data.clothingChoice ?? null,
    interviewHired: data.interviewHired ?? null,
    weeklyIncome: data.weeklyIncome ?? 0,
    selectedEmploymentOption: data.selectedEmploymentOption ?? null,
    employmentOptions: data.employmentOptions ?? null,
    householdVotes: data.householdVotes ?? null,
    sharedExpenses: data.sharedExpenses ?? null,
  } as unknown as GroupSession
}
async function configure(
  create: boolean,
  decisionDurationSeconds: DecisionDuration,
  cacSupportEnabled: boolean,
) {
  const session = await request('configure_host_group_session', {
    p_create: create,
    p_decision_duration_seconds: decisionDurationSeconds,
    p_cac_support_enabled: cacSupportEnabled,
  })
  return session
    ? request('get_group_session_state', { p_session_id: session.sessionId })
    : null
}
export const groupSessionService = {
  restore: () => configure(false, 60, false),
  create: (
    decisionDurationSeconds: DecisionDuration,
    cacSupportEnabled = false,
  ) => configure(true, decisionDurationSeconds, cacSupportEnabled),
  join: async (code: string) => {
    const session = await request('join_group_session', {
      p_code: code.trim().toUpperCase(),
    })
    return session
      ? request('get_group_session_state', { p_session_id: session.sessionId })
      : null
  },
  get: (sessionId: string) =>
    request('get_group_session_state', { p_session_id: sessionId }),
  update: (
    sessionId: string,
    status: GroupSession['status'],
    currentScenarioId: string | null,
  ) =>
    request('update_group_session_state', {
      p_session_id: sessionId,
      p_status: status,
      p_current_scenario_id: currentScenarioId,
    }),
  control: async (
    sessionId: string,
    action: 'start' | 'end_voting' | 'next' | 'close',
  ) => {
    const session = await request('control_group_session', {
      p_session_id: sessionId,
      p_action: action,
    })
    return session
      ? request('get_group_session_state', { p_session_id: sessionId })
      : null
  },
  vote: async (sessionId: string, choiceId: string) => {
    const session = await request('submit_group_vote', {
      p_session_id: sessionId,
      p_choice_id: choiceId,
    })
    return session
      ? request('get_group_session_state', { p_session_id: sessionId })
      : null
  },
  voteJob: async (sessionId: string, jobId: string) => {
    const session = await request('submit_group_job_vote', {
      p_session_id: sessionId,
      p_job_id: jobId,
    })
    return session
      ? request('get_group_session_state', { p_session_id: sessionId })
      : null
  },
  voteEmployment: async (sessionId: string, optionId: string) => {
    const session = await request('submit_group_employment_vote', {
      p_session_id: sessionId,
      p_option_id: optionId,
    })
    return session
      ? request('get_group_session_state', { p_session_id: sessionId })
      : null
  },
  updateSetup: (
    sessionId: string,
    householdId: string | null,
    ready: boolean,
  ) =>
    request('update_group_participant_setup', {
      p_session_id: sessionId,
      p_persona_id: householdId,
      p_ready: ready,
    }),
}
