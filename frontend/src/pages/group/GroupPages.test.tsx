import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, test, vi } from 'vitest'
import { HostPage, JoinPage } from './GroupPages'
import { groupSessionService } from '../../services/groupSessionService'
import type { GroupSession } from '../../services/groupSessionService'
vi.mock('../../services/groupSessionService', () => ({
  groupSessionService: {
    restore: vi.fn(),
    create: vi.fn(),
    join: vi.fn(),
    get: vi.fn(),
    control: vi.fn(),
    vote: vi.fn(),
    voteJob: vi.fn(),
    voteEmployment: vi.fn(),
    updateSetup: vi.fn(),
    review: vi.fn(),
  },
}))
const session: GroupSession = {
  sessionId: 'session',
  joinCode: 'ABCD1234EF56',
  status: 'open',
  currentScenarioId: null,
  createdAt: '2026-11-09T15:00:00Z',
  versionId: 'edition',
  decisionDurationSeconds: 90 as const,
  participantCount: 0,
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
  participants: [],
  roundType: 'scenario',
  currentDay: 0,
  totalDayCount: 30,
  selectedJobId: null,
  winningJobId: null,
  jobs: null,
  cacSupportEnabled: false,
  sharedHouseholdId: null,
  sharedHouseholdName: null,
  sharedBalance: null,
  employmentStage: 'household',
  employmentAttempt: 1,
  employmentPrepared: false,
  clothingChoice: null,
  interviewHired: null,
  weeklyIncome: 0,
  selectedEmploymentOption: null,
  employmentOptions: null,
  householdVotes: [],
  sharedExpenses: null,
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(groupSessionService.review).mockResolvedValue([])
  vi.mocked(groupSessionService.restore).mockResolvedValue(null)
})

const endedSession: GroupSession = {
  ...session,
  status: 'closed',
  roundState: 'completed',
  currentDay: 8,
  sharedBalance: 123.45,
}

test.each([true, false])(
  'host replays with assistance %s in a fresh session',
  async (assistance) => {
    const user = userEvent.setup()
    vi.mocked(groupSessionService.restore).mockResolvedValue(endedSession)
    vi.mocked(groupSessionService.create).mockResolvedValue({
      ...session,
      sessionId: 'new-session',
      joinCode: 'NEWCODE123456',
    })
    render(
      <MemoryRouter>
        <HostPage />
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('heading', { name: 'Every choice has a story.' }),
    ).toBeInTheDocument()
    expect(screen.getByText('8 of 30')).toBeInTheDocument()
    expect(screen.getByText('$123.45')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', {
        name: assistance
          ? 'Replay with CAC assistance'
          : 'Replay without CAC assistance',
      }),
    )
    expect(groupSessionService.create).toHaveBeenCalledWith(90, assistance)
    expect(await screen.findByText('NEWCODE123456')).toBeInTheDocument()
  },
)

test('failed replay preserves the ending and permits retry', async () => {
  const user = userEvent.setup()
  vi.mocked(groupSessionService.restore).mockResolvedValue(endedSession)
  vi.mocked(groupSessionService.create).mockRejectedValue(new Error('offline'))
  render(
    <MemoryRouter>
      <HostPage />
    </MemoryRouter>,
  )
  await user.click(
    await screen.findByRole('button', { name: 'Replay with CAC assistance' }),
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Your results are still saved',
  )
  expect(screen.getByText('$123.45')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Replay with CAC assistance' }),
  ).toBeEnabled()
})

test('participant reviews saved tallies and their own vote, then joins again', async () => {
  const user = userEvent.setup()
  vi.mocked(groupSessionService.join).mockResolvedValue({
    ...endedSession,
    isHost: false,
    participantId: 'member',
  })
  vi.mocked(groupSessionService.review).mockResolvedValue([
    {
      day: 3,
      scenarioId: 'q',
      title: 'Groceries',
      selectedChoiceId: 'a',
      choices: [
        { choiceId: 'a', text: 'Buy groceries', voteCount: 2 },
        { choiceId: 'b', text: 'Wait', voteCount: 1 },
      ],
    },
  ])
  render(
    <MemoryRouter>
      <JoinPage />
    </MemoryRouter>,
  )
  await user.type(screen.getByLabelText(/Session code/), session.joinCode)
  await user.click(screen.getByRole('button', { name: /Join session/ }))
  await user.click(await screen.findByText('Day 3 · Groceries'))
  expect(screen.getByText('2 votes')).toBeVisible()
  expect(screen.getByText('1 vote')).toBeVisible()
  expect(screen.getByText(/Your vote/)).toBeVisible()
  expect(
    screen.queryByRole('button', { name: 'Replay with CAC assistance' }),
  ).toBeNull()
  await user.click(
    screen.getByRole('button', { name: 'Join another group session' }),
  )
  expect(screen.getByLabelText(/Session code/)).toHaveValue('')
})

test('review failure offers retry and keeps replay available', async () => {
  const user = userEvent.setup()
  vi.mocked(groupSessionService.restore).mockResolvedValue(endedSession)
  vi.mocked(groupSessionService.review)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce([])
  render(
    <MemoryRouter>
      <HostPage />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load saved choices',
  )
  await user.click(
    screen.getByRole('button', { name: 'Retry loading choices' }),
  )
  expect(
    await screen.findByText('No scenario votes were recorded.'),
  ).toBeInTheDocument()
})
test('creates a committed session and copies its code', async () => {
  const user = userEvent.setup()
  vi.mocked(groupSessionService.create).mockResolvedValue(session)
  render(
    <MemoryRouter>
      <HostPage />
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { name: 'Make room for conversation.' })
  await user.selectOptions(screen.getByLabelText('Decision duration'), '90')
  await user.selectOptions(screen.getByLabelText('CAC support'), 'with')
  await user.click(screen.getByRole('button', { name: /Create group session/ }))
  expect(groupSessionService.create).toHaveBeenCalledWith(90, true)
  expect(await screen.findByText(session.joinCode)).toBeInTheDocument()
  expect(screen.getByText('90 seconds')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Copy code' }))
  expect(await navigator.clipboard.readText()).toBe(session.joinCode)
})
test('restores without creating another session', async () => {
  vi.mocked(groupSessionService.restore).mockResolvedValue(session)
  render(
    <MemoryRouter>
      <HostPage />
    </MemoryRouter>,
  )
  expect(await screen.findByText(session.joinCode)).toBeInTheDocument()
  expect(groupSessionService.create).not.toHaveBeenCalled()
})
test('restoration failure offers recovery without a code', async () => {
  vi.mocked(groupSessionService.restore).mockRejectedValueOnce(
    new Error('offline'),
  )
  render(
    <MemoryRouter>
      <HostPage />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to restore',
  )
  expect(screen.queryByText(session.joinCode)).toBeNull()
  expect(
    screen.getByRole('button', { name: 'Retry restoration' }),
  ).toBeEnabled()
})
test('join errors permit retry and success waits for the database', async () => {
  const user = userEvent.setup()
  vi.mocked(groupSessionService.join)
    .mockRejectedValueOnce(new Error('Session unavailable.'))
    .mockResolvedValueOnce({
      ...session,
      ready: true,
      householdId: 'household-id',
      householdName: 'Sample household',
    })
  render(
    <MemoryRouter>
      <JoinPage />
    </MemoryRouter>,
  )
  expect(
    screen.getByRole('heading', { name: 'Play with a group!' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('heading', {
      name: /Different choices.*Room to reflect/,
    }),
  ).toBeInTheDocument()
  await user.type(
    screen.getByLabelText(/Session code/),
    session.joinCode.toLowerCase(),
  )
  expect(screen.getByLabelText(/Session code/)).toHaveValue(session.joinCode)
  await user.click(screen.getByRole('button', { name: /Join session/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Session unavailable.',
  )
  await user.click(screen.getByRole('button', { name: /Join session/ }))
  expect(
    await screen.findByRole('heading', { name: 'You’re in. Take a breath.' }),
  ).toBeInTheDocument()
  expect(screen.getByText('90 seconds')).toBeInTheDocument()
})

test('shows the shared voting countdown to the host', async () => {
  vi.mocked(groupSessionService.restore).mockResolvedValue({
    ...session,
    participantCount: 2,
    roundState: 'voting',
    roundType: 'job',
    roundDeadline: new Date(Date.now() + 90_000).toISOString(),
    acceptingVotes: true,
    jobs: [],
  })

  render(
    <MemoryRouter>
      <HostPage />
    </MemoryRouter>,
  )

  expect(await screen.findByRole('timer')).toHaveTextContent('1:30')
  expect(screen.getByRole('timer')).toHaveAccessibleName(
    '90 seconds remaining to vote',
  )
})

test('shows when the participant voting timer has ended', async () => {
  vi.mocked(groupSessionService.join).mockResolvedValue({
    ...session,
    isHost: false,
    participantId: 'participant',
    participantCount: 2,
    roundState: 'voting',
    roundType: 'job',
    roundDeadline: new Date(Date.now() - 30_000).toISOString(),
    acceptingVotes: false,
    jobs: [],
  })
  const user = userEvent.setup()

  render(
    <MemoryRouter>
      <JoinPage />
    </MemoryRouter>,
  )
  await user.type(screen.getByLabelText(/Session code/), session.joinCode)
  await user.click(screen.getByRole('button', { name: /Join session/ }))

  expect(await screen.findByRole('timer')).toHaveTextContent(
    'Voting time ended',
  )
  expect(screen.getByRole('timer')).toHaveAccessibleName(
    'Voting time has ended',
  )
})

test('shows the shared interview clothing vote to the host', async () => {
  vi.mocked(groupSessionService.restore).mockResolvedValue({
    ...session,
    participantCount: 3,
    sharedHouseholdName: 'Patricia',
    sharedBalance: 1200,
    cacSupportEnabled: true,
    roundState: 'voting',
    roundType: 'clothing',
    employmentStage: 'clothing',
    roundDeadline: new Date(Date.now() + 60_000).toISOString(),
    acceptingVotes: true,
    employmentOptions: [
      {
        optionId: 'purchase',
        text: 'Buy professional clothes',
        cost: 60,
        voteCount: null,
      },
      {
        optionId: 'cac',
        text: 'Use the CAC clothing closet',
        cost: 0,
        voteCount: null,
      },
    ],
  })

  render(
    <MemoryRouter>
      <HostPage />
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole('heading', {
      name: 'What will the household wear?',
    }),
  ).toBeInTheDocument()
  expect(screen.getByText('Buy professional clothes')).toBeInTheDocument()
  expect(screen.getByText('Use the CAC clothing closet')).toBeInTheDocument()
  expect(screen.getByText('$1,200.00')).toBeInTheDocument()
})
