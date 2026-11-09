import { beforeEach, expect, test, vi } from 'vitest'
import { groupSessionService } from './groupSessionService'
import { ensureParticipantSession } from './participantSession'
import { getSupabaseClient } from './supabase'
vi.mock('./participantSession', () => ({ ensureParticipantSession: vi.fn() }))
vi.mock('./supabase', () => ({ getSupabaseClient: vi.fn() }))
const rpc = vi.fn()
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getSupabaseClient).mockResolvedValue({ rpc } as unknown as Awaited<
    ReturnType<typeof getSupabaseClient>
  >)
})
test('verifies identity and normalizes the code before enrollment', async () => {
  rpc.mockResolvedValue({
    data: {
      sessionId: 'id',
      joinCode: 'ABC',
      status: 'open',
      currentScenarioId: null,
      createdAt: 'date',
      versionId: 'v',
      decisionDurationSeconds: 60,
      participantCount: 1,
      participantId: 'participant-id',
      isHost: false,
    },
    error: null,
  })
  await groupSessionService.join(' abc ')
  expect(ensureParticipantSession).toHaveBeenCalledTimes(2)
  expect(rpc).toHaveBeenCalledWith('join_group_session', { p_code: 'ABC' })
})
test('rejects malformed data and hides internal database errors', async () => {
  rpc
    .mockResolvedValueOnce({ data: {}, error: null })
    .mockResolvedValueOnce({ data: null, error: { message: 'internal SQL' } })
  await expect(groupSessionService.restore()).rejects.toThrow(
    'Session information is unavailable',
  )
  await expect(groupSessionService.create(90)).rejects.toThrow(
    'Unable to load the group session',
  )
})

test('sends the selected duration when creating a session', async () => {
  rpc.mockResolvedValue({
    data: {
      sessionId: 'id',
      joinCode: 'ABC',
      status: 'open',
      currentScenarioId: null,
      createdAt: 'date',
      versionId: 'v',
      decisionDurationSeconds: 120,
      participantCount: 0,
      participantId: null,
      isHost: true,
    },
    error: null,
  })
  await groupSessionService.create(120)
  expect(rpc).toHaveBeenCalledWith('configure_host_group_session', {
    p_create: true,
    p_decision_duration_seconds: 120,
    p_cac_support_enabled: false,
  })
})
test('returns null for no current host session and surfaces controlled enrollment errors', async () => {
  rpc.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({
    data: { error: 'Session unavailable.' },
    error: null,
  })
  expect(await groupSessionService.restore()).toBeNull()
  await expect(groupSessionService.join('bad')).rejects.toThrow(
    'Session unavailable.',
  )
})

test('retrieves and updates protected session progress', async () => {
  const state = {
    sessionId: 'session-id',
    joinCode: 'ABC',
    status: 'closed',
    currentScenarioId: 'scenario-id',
    createdAt: 'date',
    versionId: 'v',
    decisionDurationSeconds: 60,
    participantCount: 2,
    participantId: null,
    isHost: true,
    roundState: 'lobby',
    currentQuestionNumber: 0,
    totalQuestionCount: 0,
    roundDeadline: null,
    acceptingVotes: false,
    selectedChoiceId: null,
    voteCount: 0,
    question: null,
    householdId: null,
    householdName: null,
    ready: false,
    readyCount: 0,
    participants: null,
    roundType: 'scenario',
    currentDay: 0,
    totalDayCount: 30,
    selectedJobId: null,
    winningJobId: null,
    jobs: null,
  }
  rpc.mockResolvedValue({ data: state, error: null })

  expect(await groupSessionService.get('session-id')).toMatchObject(state)
  expect(rpc).toHaveBeenNthCalledWith(1, 'get_group_session_state', {
    p_session_id: 'session-id',
  })

  expect(
    await groupSessionService.update('session-id', 'closed', 'scenario-id'),
  ).toMatchObject(state)
  expect(rpc).toHaveBeenNthCalledWith(2, 'update_group_session_state', {
    p_session_id: 'session-id',
    p_status: 'closed',
    p_current_scenario_id: 'scenario-id',
  })
})

test('sends protected host controls and participant votes', async () => {
  rpc.mockResolvedValue({
    data: {
      sessionId: 'session-id',
      joinCode: 'ABC',
      status: 'open',
      currentScenarioId: null,
      createdAt: 'date',
      versionId: 'v',
      decisionDurationSeconds: 60,
      participantCount: 1,
      participantId: null,
      isHost: true,
    },
    error: null,
  })
  await groupSessionService.control('session-id', 'start')
  expect(rpc).toHaveBeenNthCalledWith(1, 'control_group_session', {
    p_session_id: 'session-id',
    p_action: 'start',
  })
  await groupSessionService.vote('session-id', 'choice-id')
  expect(rpc).toHaveBeenNthCalledWith(3, 'submit_group_vote', {
    p_session_id: 'session-id',
    p_choice_id: 'choice-id',
  })
  await groupSessionService.voteJob('session-id', 'job-id')
  expect(rpc).toHaveBeenNthCalledWith(5, 'submit_group_job_vote', {
    p_session_id: 'session-id',
    p_job_id: 'job-id',
  })
})

test('saves participant household selection and readiness', async () => {
  rpc.mockResolvedValue({
    data: {
      sessionId: 'session-id',
      joinCode: 'ABC',
      status: 'open',
      currentScenarioId: null,
      createdAt: 'date',
      versionId: 'v',
      decisionDurationSeconds: 60,
      participantCount: 1,
      participantId: 'participant-id',
      isHost: false,
    },
    error: null,
  })
  await groupSessionService.updateSetup('session-id', 'household-id', true)
  expect(rpc).toHaveBeenCalledWith('update_group_participant_setup', {
    p_session_id: 'session-id',
    p_persona_id: 'household-id',
    p_ready: true,
  })
})
