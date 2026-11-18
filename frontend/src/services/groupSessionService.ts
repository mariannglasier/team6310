import { ensureParticipantSession } from './participantSession'
import { getSupabaseClient } from './supabase'

export interface GroupSession {
  roundFacts?: GroupRoundFact[]
  sessionId: string
  joinCode: string
  status: 'open' | 'closed'
  endedByHost?: boolean
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
  lastPayday?: number | null
  activeBill?: GroupBillRound | null
  isBillDay?: boolean
  overdueBills?: GroupBill[]
  billVoteRound?: number
  unpaidBillTotal?: number | string
  resolvedBills?: GroupBillReceipt[]
  selectedEmploymentOption: string | null
  employmentOptions: GroupEmploymentOption[] | null
  householdVotes: GroupHouseholdVote[] | null
  sharedExpenses: GroupSharedExpense[] | null
  upcomingBills?: GroupUpcomingBill[]
}
export interface GroupRoundFact {
  role: 'general' | 'cac'
  text: string
  sourceUrl: string
  copyKind: 'fact' | 'context'
}
export interface GroupBill {
  billId: string
  name: string
  dueDay: number
  principal: number | string
  lateFee: number | string
  total: number | string
}
export type BillChoice = 'pay' | 'ignore'
export interface GroupBillReceipt {
  billId: string
  name: string
  paid: boolean
  total: number | string
}
export type BillAction = 'end_voting' | 'confirm' | 'reopen' | 'open_overdue'
export interface GroupBillRound extends GroupBill {
  round: number
  payVotes: number | null
  ignoreVotes: number | null
  voteCount: number
  selectedChoice: BillChoice | null
}
export interface GroupDecisionReview {
  day: number
  scenarioId: string
  title: string
  selectedChoiceId: string | null
  choices: Array<GroupChoice & { voteCount: number }>
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
export interface GroupUpcomingBill {
  billId: string
  name: string
  amount: number | string
  dueDay: number
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
  choices: GroupChoice[]
}
export interface GroupChoice {
  choiceId: string
  text: string
  voteCount: number | null
  balanceChange?: number | string | null
  upfrontCost?: number | string | null
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
    | 'vote_group_bill'
    | 'control_group_bill'
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
  const currentQuestion = (question ?? null) as GroupQuestion | null
  if (
    currentQuestion?.choices.some((choice) => choice.upfrontCost === undefined)
  ) {
    const { data: prices, error: priceError } = await client
      .from('choices')
      .select('choice_id,balance_change,upfront_cost')
      .eq('version_id', data.versionId)
      .eq('scenario_id', currentQuestion.scenarioId)
      .in(
        'choice_id',
        currentQuestion.choices.map((choice) => choice.choiceId),
      )
    if (!priceError && prices) {
      const byId = new Map(prices.map((price) => [price.choice_id, price]))
      currentQuestion.choices = currentQuestion.choices.map((choice) => {
        const price = byId.get(choice.choiceId)
        return price
          ? {
              ...choice,
              balanceChange:
                choice.balanceChange === undefined
                  ? price.balance_change
                  : choice.balanceChange,
              upfrontCost:
                choice.upfrontCost === undefined
                  ? price.upfront_cost
                  : choice.upfrontCost,
            }
          : choice
      })
    }
  }
  return {
    ...data,
    endedByHost: data.endedByHost === true,
    roundState: data.roundState ?? 'lobby',
    currentQuestionNumber: data.currentQuestionNumber ?? 0,
    totalQuestionCount: data.totalQuestionCount ?? 0,
    roundDeadline: data.roundDeadline ?? null,
    acceptingVotes: data.acceptingVotes ?? false,
    selectedChoiceId: data.selectedChoiceId ?? null,
    voteCount: data.voteCount ?? 0,
    question: currentQuestion,
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
    lastPayday: data.lastPayday ?? null,
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
  review: async (sessionId: string): Promise<GroupDecisionReview[]> => {
    await ensureParticipantSession()
    const client = await getSupabaseClient()
    const { data, error } = await client.rpc('get_group_session_review', {
      p_session_id: sessionId,
    })
    if (
      error ||
      !Array.isArray(data) ||
      !data.every(
        (row) =>
          row &&
          typeof row === 'object' &&
          Number.isSafeInteger(row.day) &&
          row.day > 0 &&
          row.day <= 30 &&
          typeof row.scenarioId === 'string' &&
          typeof row.title === 'string' &&
          (row.selectedChoiceId === null ||
            typeof row.selectedChoiceId === 'string') &&
          Array.isArray(row.choices) &&
          row.choices.every(
            (choice: Record<string, unknown>) =>
              choice &&
              typeof choice.choiceId === 'string' &&
              typeof choice.text === 'string' &&
              Number.isSafeInteger(choice.voteCount) &&
              (choice.voteCount as number) >= 0,
          ),
      )
    )
      throw new Error('Unable to load saved choices. Please retry.')
    return data as GroupDecisionReview[]
  },
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
  control: (
    sessionId: string,
    action: 'start' | 'end_voting' | 'next' | 'close',
  ) =>
    request('control_group_session', {
      p_session_id: sessionId,
      p_action: action,
    }),
  controlBill: (
    sessionId: string,
    billId: string,
    round: number,
    action: BillAction,
  ) =>
    request('control_group_bill', {
      p_session_id: sessionId,
      p_bill_id: billId,
      p_round: round,
      p_action: action,
    }),
  voteBill: (
    sessionId: string,
    billId: string,
    round: number,
    choice: BillChoice,
  ) =>
    request('vote_group_bill', {
      p_session_id: sessionId,
      p_bill_id: billId,
      p_round: round,
      p_choice: choice,
    }),
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
