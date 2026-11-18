import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, expect, test, vi } from 'vitest'
import { HostPage, JoinPage } from './GroupPages'
import { GroupUpcomingExpenses } from './GroupBills'
import { GroupRoundDebrief } from './GroupRoundDebrief'
import { groupSessionService } from '../../services/groupSessionService'
import type { GroupSession } from '../../services/groupSessionService'
import { loadScenarioFacts } from '../../services/scenarioFacts'
vi.mock('../../services/scenarioFacts', () => ({ loadScenarioFacts: vi.fn() }))
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
    controlBill: vi.fn(),
    voteBill: vi.fn(),
  },
}))
const session: GroupSession = {
  sessionId: 'session',
  joinCode: 'K7M4',
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
  sessionStorage.removeItem('cac.group.participant-session')
  vi.resetAllMocks()
  vi.mocked(loadScenarioFacts).mockResolvedValue([])
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

test('explains unanswered votes and gives a discussion prompt when no one votes', () => {
  render(
    <GroupRoundDebrief
      session={{ ...session, roundState: 'results', participantCount: 3 }}
    />,
  )
  expect(screen.getByText('0 of 3 answered · 3 unanswered')).toBeVisible()
  expect(screen.getByText('No votes were cast.')).toBeVisible()
  expect(
    screen.getByText('What trade-offs in this situation shaped your choice?'),
  ).toBeVisible()
})

test('the facilitator sees both sides of a tie, a linked fact, and controls advancement', async () => {
  const user = userEvent.setup()
  const fact = 'This household decision has a verified local fact.'
  vi.mocked(groupSessionService.restore).mockResolvedValue({
    ...session,
    currentDay: 1,
    roundState: 'results',
    participantCount: 3,
    voteCount: 2,
    question: {
      scenarioId: 'q',
      title: 'Groceries',
      description: 'Plan your groceries.',
      choices: [
        { choiceId: 'buy', text: 'Buy groceries', voteCount: 1 },
        { choiceId: 'wait', text: 'Wait', voteCount: 1 },
      ],
    },
    roundFacts: [
      {
        role: 'general',
        text: fact,
        sourceUrl: 'https://example.com/fact',
        copyKind: 'fact',
      },
    ],
  })
  render(
    <MemoryRouter>
      <HostPage />
    </MemoryRouter>,
  )
  expect(await screen.findByText(fact)).toBeVisible()
  expect(screen.getAllByText('1 vote (50%)')).toHaveLength(2)
  expect(screen.getByText('2 of 3 answered · 1 unanswered')).toBeVisible()
  expect(
    screen.getByText('Percentages are based on 2 votes cast.'),
  ).toBeVisible()
  expect(groupSessionService.control).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Continue to Day 2' }))
  expect(groupSessionService.control).toHaveBeenCalledWith(
    session.sessionId,
    'next',
  )
})

test('shows the next three dated occurrences and drops expired recurring bills', () => {
  const expenseSession: GroupSession = {
    ...session,
    currentDay: 9,
    sharedExpenses: [
      {
        expenseId: 'rent',
        name: 'Rent',
        amount: 500,
        firstDueDay: 4,
        repeatIntervalDays: null,
      },
      {
        expenseId: 'bus',
        name: 'Bus pass',
        amount: 10,
        firstDueDay: 2,
        repeatIntervalDays: 7,
      },
      {
        expenseId: 'phone',
        name: 'Phone bill',
        amount: 15,
        firstDueDay: 12,
        repeatIntervalDays: null,
      },
    ],
  }
  const { rerender } = render(
    <GroupUpcomingExpenses session={expenseSession} />,
  )
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
  expect(
    screen.getAllByRole('listitem').map((item) => item.textContent),
  ).toEqual([
    'Bus pass$10.00Day 9',
    'Phone bill$15.00Day 12',
    'Bus pass$10.00Day 16',
  ])
  rerender(
    <GroupUpcomingExpenses session={{ ...expenseSession, currentDay: 13 }} />,
  )
  expect(
    screen.getAllByRole('listitem').map((item) => item.textContent),
  ).toEqual([
    'Bus pass$10.00Day 16',
    'Bus pass$10.00Day 23',
    'Bus pass$10.00Day 30',
  ])
  rerender(
    <GroupUpcomingExpenses session={{ ...expenseSession, currentDay: 24 }} />,
  )
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
  rerender(
    <GroupUpcomingExpenses
      session={{ ...expenseSession, upcomingBills: [] }}
    />,
  )
  expect(screen.queryByText('Shared upcoming expenses')).toBeNull()
})

const dueBill = {
  billId: 'rent',
  name: 'Rent',
  dueDay: 7,
  principal: 500,
  lateFee: 20,
  total: 500,
  round: 3,
  payVotes: null,
  ignoreVotes: null,
  selectedChoice: null,
  voteCount: 0,
}

test('shows the Day 11 repair bill in place of the ordinary expense card', async () => {
  const user = userEvent.setup()
  vi.mocked(groupSessionService.join).mockResolvedValue({
    ...session,
    isHost: false,
    participantId: 'member',
    currentDay: 11,
    roundState: 'voting',
    isBillDay: true,
    activeBill: { ...dueBill, name: 'The repair bill', dueDay: 11 },
    acceptingVotes: true,
    question: {
      scenarioId: 'ordinary-expense',
      title: 'Unexpected expense',
      description: 'An unexpected expense came up.',
      choices: [],
    },
  })
  render(
    <MemoryRouter>
      <JoinPage />
    </MemoryRouter>,
  )
  await user.type(screen.getByLabelText(/Session code/), session.joinCode)
  await user.click(screen.getByRole('button', { name: /Join session/ }))
  expect(
    await screen.findByRole('heading', { name: 'The repair bill' }),
  ).toBeVisible()
  expect(screen.getByRole('button', { name: 'Pay bill' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Ignore bill' })).toBeVisible()
  expect(
    screen.queryByRole('heading', { name: 'Unexpected expense' }),
  ).toBeNull()
  expect(screen.queryByRole('button', { name: 'End bill voting' })).toBeNull()
  expect(
    screen.queryByRole('button', { name: 'Confirm bill decision' }),
  ).toBeNull()
  expect(screen.queryByRole('button', { name: 'End group session' })).toBeNull()
})

test.each(['INVAL1D', 'C7Q2'])(
  'keeps the join form open when the API rejects %s',
  async (code) => {
    const user = userEvent.setup()
    vi.mocked(groupSessionService.join).mockRejectedValue(
      new Error('Session unavailable. Check with your facilitator.'),
    )
    render(
      <MemoryRouter>
        <JoinPage />
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText(/Session code/), code)
    await user.click(screen.getByRole('button', { name: /Join session/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Session unavailable.',
    )
    expect(screen.getByLabelText(/Session code/)).toHaveValue(code)
  },
)

test('shows the paycheck and lets an enrolled participant vote on the due bill', async () => {
  const user = userEvent.setup()
  const billSession: GroupSession = {
    ...session,
    isHost: false,
    participantId: 'member',
    currentDay: 7,
    lastPayday: 7,
    weeklyIncome: 300,
    sharedBalance: 800,
    roundState: 'voting',
    isBillDay: true,
    activeBill: dueBill,
    acceptingVotes: true,
  }
  vi.mocked(groupSessionService.join).mockResolvedValue(billSession)
  vi.mocked(groupSessionService.voteBill).mockResolvedValue({
    ...billSession,
    activeBill: { ...dueBill, selectedChoice: 'pay', voteCount: 1 },
  })
  render(
    <MemoryRouter>
      <JoinPage />
    </MemoryRouter>,
  )
  await user.type(screen.getByLabelText(/Session code/), session.joinCode)
  await user.click(screen.getByRole('button', { name: /Join session/ }))
  expect(await screen.findByText('Paycheck deposited: $300.00')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Pay bill' }))
  expect(groupSessionService.voteBill).toHaveBeenCalledWith(
    session.sessionId,
    'rent',
    3,
    'pay',
  )
  expect(
    await screen.findByRole('button', {
      name: /Pay bill.*Selected/,
      pressed: true,
    }),
  ).toBeVisible()
  vi.mocked(groupSessionService.voteBill).mockResolvedValueOnce({
    ...billSession,
    activeBill: { ...dueBill, selectedChoice: 'ignore', voteCount: 1 },
  })
  await user.click(screen.getByRole('button', { name: 'Ignore bill' }))
  expect(
    await screen.findByRole('button', {
      name: /Ignore bill.*Selected/,
      pressed: true,
    }),
  ).toBeVisible()
  expect(
    screen.getByRole('button', { name: 'Pay bill', pressed: false }),
  ).toBeVisible()
  expect(screen.getByText('$800.00')).toBeVisible()
})

test('the facilitator can confirm a winning bill vote and see the resulting balance', async () => {
  const user = userEvent.setup()
  const billSession: GroupSession = {
    ...session,
    currentDay: 7,
    sharedBalance: 800,
    roundState: 'results',
    isBillDay: true,
    billVoteRound: 3,
    activeBill: { ...dueBill, payVotes: 1, ignoreVotes: 0, voteCount: 1 },
  }
  vi.mocked(groupSessionService.restore).mockResolvedValue(billSession)
  vi.mocked(groupSessionService.controlBill).mockResolvedValue({
    ...billSession,
    activeBill: null,
    sharedBalance: 300,
    resolvedBills: [{ billId: 'rent', name: 'Rent', paid: true, total: 500 }],
  })
  render(
    <MemoryRouter>
      <HostPage />
    </MemoryRouter>,
  )
  expect(await screen.findByText('1 vote (100%)')).toBeVisible()
  await user.click(
    screen.getByRole('button', { name: 'Confirm bill decision' }),
  )
  expect(groupSessionService.controlBill).toHaveBeenCalledWith(
    session.sessionId,
    'rent',
    3,
    'confirm',
  )
  expect(await screen.findByText('Rent · Paid · $500.00')).toBeVisible()
  expect(screen.getByText('$300.00')).toBeVisible()
  expect(
    screen.getByRole('button', { name: 'Continue to Day 8' }),
  ).toBeVisible()
})

test.each([
  [0, 'At least one participant must join before you can start.'],
  [
    1,
    'Wait for every participant to choose a household and mark themselves ready.',
  ],
])(
  'explains why start is disabled with %i participants',
  async (count, reason) => {
    vi.mocked(groupSessionService.restore).mockResolvedValue({
      ...session,
      participantCount: count,
    })
    render(
      <MemoryRouter>
        <HostPage />
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('button', { name: 'Start session' }),
    ).toBeDisabled()
    expect(screen.getByText(reason)).toBeVisible()
  },
)

test('shows a rejected start in the lobby and can retry into voting', async () => {
  const user = userEvent.setup()
  const ready = { ...session, participantCount: 1, readyCount: 1 }
  const message =
    'A complete 30-day scenario set is unavailable for the winning household.'
  vi.mocked(groupSessionService.restore).mockResolvedValue(ready)
  vi.mocked(groupSessionService.control)
    .mockRejectedValueOnce(new Error(message))
    .mockResolvedValueOnce({
      ...ready,
      roundState: 'voting',
      roundType: 'job',
      acceptingVotes: true,
    })
  render(
    <MemoryRouter>
      <HostPage />
    </MemoryRouter>,
  )
  await user.click(await screen.findByRole('button', { name: 'Start session' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(message)
  await user.click(screen.getByRole('button', { name: 'Start session' }))
  expect(
    await screen.findByRole('button', { name: 'End voting' }),
  ).toBeVisible()
  expect(groupSessionService.control).toHaveBeenLastCalledWith(
    session.sessionId,
    'start',
  )
})

test('leaving the lobby closes the session before returning home', async () => {
  const user = userEvent.setup()
  vi.mocked(groupSessionService.restore).mockResolvedValue(session)
  vi.mocked(groupSessionService.control).mockResolvedValue({
    ...endedSession,
    endedByHost: true,
  })
  render(
    <MemoryRouter initialEntries={['/group/host']}>
      <Routes>
        <Route path="/group/host" element={<HostPage />} />
        <Route path="/" element={<h1>Home</h1>} />
      </Routes>
    </MemoryRouter>,
  )
  await user.click(await screen.findByRole('button', { name: 'Back to home' }))
  expect(await screen.findByRole('heading', { name: 'Home' })).toBeVisible()
  expect(groupSessionService.control).toHaveBeenCalledExactlyOnceWith(
    session.sessionId,
    'close',
  )
})

test('hosting from the landing page replaces an unfinished session', async () => {
  const user = userEvent.setup()
  vi.mocked(groupSessionService.restore).mockResolvedValue({
    ...session,
    roundState: 'results',
    currentDay: 30,
  })
  vi.mocked(groupSessionService.control).mockResolvedValue({
    ...endedSession,
    endedByHost: true,
  })
  vi.mocked(groupSessionService.create).mockResolvedValue({
    ...session,
    sessionId: 'fresh-session',
    joinCode: 'M7Q2',
  })
  render(
    <MemoryRouter initialEntries={['/group/host?new=1']}>
      <HostPage />
    </MemoryRouter>,
  )
  await user.click(
    await screen.findByRole('button', { name: /Create group session/ }),
  )
  expect(groupSessionService.control).toHaveBeenCalledWith(
    session.sessionId,
    'close',
  )
  expect(await screen.findByText('M7Q2')).toBeVisible()
})

test('a facilitator exit returns an enrolled player to the empty join form', async () => {
  const user = userEvent.setup()
  const member = { ...session, isHost: false, participantId: 'member' }
  vi.mocked(groupSessionService.join).mockResolvedValue(member)
  vi.mocked(groupSessionService.get).mockResolvedValue({
    ...member,
    status: 'closed',
    roundState: 'completed',
    endedByHost: true,
  })
  render(
    <MemoryRouter>
      <JoinPage />
    </MemoryRouter>,
  )
  await user.type(screen.getByLabelText(/Session code/), session.joinCode)
  await user.click(screen.getByRole('button', { name: /Join session/ }))
  expect(
    await screen.findByText(
      'Your facilitator ended the group session.',
      {},
      { timeout: 3500 },
    ),
  ).toBeVisible()
  expect(screen.getByLabelText(/Session code/)).toHaveValue('')
})

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
        {
          choiceId: 'a',
          text: 'Buy groceries',
          voteCount: 2,
          balanceChange: -42.5,
        },
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
  expect(screen.getByText('2 votes (66.7%)')).toBeVisible()
  expect(screen.getByText('Cost $42.50')).toBeVisible()
  expect(screen.getByText('1 vote (33.3%)')).toBeVisible()
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

test.each(['host', 'participant'] as const)(
  'shows scenario facts under the vote results for the %s',
  async (viewer) => {
    const result: GroupSession = {
      ...session,
      isHost: viewer === 'host',
      participantId: viewer === 'participant' ? 'participant' : null,
      cacSupportEnabled: true,
      roundState: 'results',
      currentDay: 4,
      voteCount: 2,
      question: {
        scenarioId: 'scenario',
        title: 'Plan your lunches',
        description: 'Decide how to handle lunch.',
        choices: [{ choiceId: 'choice', text: 'Pack lunch', voteCount: 2 }],
      },
    }
    vi.mocked(loadScenarioFacts).mockResolvedValue([
      {
        role: 'cac',
        semanticKey: 'food',
        text: 'CAC helped 610 students.',
        sourceUrl: 'https://ourcac.org/',
      },
    ])
    vi.mocked(groupSessionService.restore).mockResolvedValue(result)
    vi.mocked(groupSessionService.join).mockResolvedValue(result)
    render(
      <MemoryRouter>
        {viewer === 'host' ? <HostPage /> : <JoinPage />}
      </MemoryRouter>,
    )
    if (viewer === 'participant') {
      const user = userEvent.setup()
      await user.type(screen.getByLabelText(/Session code/), session.joinCode)
      await user.click(screen.getByRole('button', { name: /Join session/ }))
    }
    const fact = await screen.findByText('610 students')
    expect(
      screen.getByText('2 votes (100%)').compareDocumentPosition(fact) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(loadScenarioFacts).toHaveBeenCalledWith(
      'session',
      'scenario',
      'edition',
      true,
      'group',
    )
  },
)

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

test.each(['voting', 'results', 'empty results'] as const)(
  'shows the shared interview clothing vote to the host during %s',
  async (stage) => {
    const voting = stage === 'voting'
    const hasVotes = stage === 'results'
    vi.mocked(groupSessionService.restore).mockResolvedValue({
      ...session,
      participantCount: 4,
      voteCount: hasVotes ? 3 : 0,
      sharedHouseholdName: 'Patricia',
      sharedBalance: 1200,
      cacSupportEnabled: true,
      roundState: voting ? 'voting' : 'results',
      roundType: 'clothing',
      employmentStage: 'clothing',
      roundDeadline: new Date(Date.now() + 60_000).toISOString(),
      acceptingVotes: voting,
      employmentOptions: [
        {
          optionId: 'purchase',
          text: 'Buy professional clothes',
          cost: 60,
          voteCount: voting ? null : hasVotes ? 2 : 0,
        },
        {
          optionId: 'cac',
          text: 'Legacy interview clothing label',
          cost: 0,
          voteCount: voting ? null : hasVotes ? 1 : 0,
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
    expect(
      screen.getByText("Find interview clothes at CAC's Canopy Thrift"),
    ).toBeInTheDocument()
    expect(screen.getByText('$1,200.00')).toBeInTheDocument()
    if (hasVotes) {
      expect(screen.getByText('2 votes (66.7%)')).toBeVisible()
      expect(screen.getByText('1 vote (33.3%)')).toBeVisible()
    } else if (!voting) {
      expect(screen.getAllByText('0 votes (0%)')).toHaveLength(2)
    }
  },
)
