import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import { EmploymentPanel } from './EmploymentPanel'
import { SetupProvider } from '../../state/SetupProvider'
import {
  createWalkthrough,
  type Walkthrough,
} from '../../state/employmentWalkthrough'
import {
  employmentSnapshot,
  submitEmployment,
  hasPending,
  type CommittedEmployment,
} from '../../services/employmentGameplay'
import type { LoadedPlaythrough } from '../../types/playthrough'
import { usdCents } from '../../types/domain'
import type { BillSnapshot } from '../../services/billGameplay'

vi.mock('../../services/employmentGameplay', async (original) => ({
  ...(await original<typeof import('../../services/employmentGameplay')>()),
  employmentSnapshot: vi.fn(),
  submitEmployment: vi.fn(),
  hasPending: vi.fn(),
  rememberedRun: vi.fn().mockResolvedValue(null),
}))
const base = createWalkthrough(
  {
    id: 'p',
    versionId: 'v',
    name: 'Alex',
    description: '',
    startingBalance: usdCents(20000),
    hasEnglishSkills: false,
    hasComputerSkills: false,
  },
  [],
  false,
  usdCents(6000),
)
const run: LoadedPlaythrough = {
  id: 'run',
  personaId: 'p',
  versionId: 'v',
  ownerUserId: 'owner',
  currentScenarioId: null,
  currentBalance: usdCents(60000),
  currentDay: 10,
  supportEnabled: false,
  status: 'active',
  startedAt: null,
  sessionId: null,
  currentJobId: null,
  employmentState: {},
  persona: { id: 'p', versionId: 'v', name: 'Alex', description: '' },
}
const snapshot = (state: Walkthrough, revision = 1): CommittedEmployment => ({
  run: { ...run, currentDay: state.day, currentBalance: state.balance },
  state,
  revision,
})
const commit = vi.fn()
function show(state: Walkthrough) {
  vi.mocked(employmentSnapshot).mockResolvedValue(snapshot(state))
  render(
    <MemoryRouter>
      <SetupProvider>
        <EmploymentPanel run={run} onCommit={commit} />
      </SetupProvider>
    </MemoryRouter>,
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(hasPending).mockResolvedValue(false)
})

it('opens the end screen for an unaffordable scenario and lets the player replay', async () => {
  vi.mocked(employmentSnapshot).mockResolvedValue({
    ...snapshot({
      ...base,
      stage: 'ended',
      day: 7,
      reason: 'Your household could not afford this choice.',
    }),
    run: {
      ...run,
      status: 'ended',
      currentDay: 7,
      currentScenarioId: 'unaffordable',
    },
  })
  render(
    <MemoryRouter initialEntries={['/simulation']}>
      <SetupProvider>
        <Routes>
          <Route
            path="/simulation"
            element={
              <EmploymentPanel
                run={{ ...run, status: 'ended' }}
                onCommit={commit}
              />
            }
          />
          <Route
            path="/simulation/individual"
            element={<h1>Choose your household</h1>}
          />
        </Routes>
      </SetupProvider>
    </MemoryRouter>,
  )
  expect(
    await screen.findByRole('heading', { name: 'Simulation ended early.' }),
  ).toBeVisible()
  expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute(
    'href',
    '/',
  )
  expect(screen.queryByText('Opening your results…')).toBeNull()
  await userEvent.click(
    screen.getByRole('button', { name: 'Replay from household selection' }),
  )
  expect(
    await screen.findByRole('heading', { name: 'Choose your household' }),
  ).toBeVisible()
  expect(submitEmployment).not.toHaveBeenCalled()
})

it('keeps pending decisions quiet and prevents duplicate submission before showing the committed next screen', async () => {
  let finish!: (value: CommittedEmployment) => void
  vi.mocked(submitEmployment).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  show({ ...base, stage: 'day', day: 1 })
  const next = await screen.findByRole('button', { name: 'Next' })
  await userEvent.click(next)
  expect(next).toBeDisabled()
  expect(next.closest('fieldset')).toHaveAttribute('aria-busy', 'true')
  expect(screen.queryByText(/Saving your decision/)).toBeNull()
  await userEvent.click(next)
  expect(submitEmployment).toHaveBeenCalledOnce()
  expect(commit).not.toHaveBeenCalled()
  await act(async () => {
    finish(snapshot({ ...base, stage: 'interview', day: 2 }, 2))
  })
  expect(
    await screen.findByRole('heading', {
      name: 'What will you wear to the interview?',
    }),
  ).toBeInTheDocument()
  expect(
    screen
      .getByRole('group', { name: 'Interview clothing' })
      .closest('fieldset'),
  ).toHaveAttribute('aria-busy', 'false')
})

it.each([
  { day: 2, hiredDay: 2, stage: 'day' as const, nextDay: 3 },
  { day: 3, hiredDay: 3, stage: 'day' as const, nextDay: 4 },
  { day: 10, hiredDay: 3, stage: 'income' as const, nextDay: 10 },
])(
  'automatically acknowledges $stage on Day $day with the protected action',
  async ({ day, hiredDay, stage, nextDay }) => {
    const state = { ...base, day, hiredDay, stage }
    const next = snapshot({ ...state, stage: 'day', day: nextDay }, 2)
    vi.mocked(submitEmployment).mockResolvedValue(next)
    show(state)
    await waitFor(() => expect(commit).toHaveBeenCalledWith(next))
    expect(submitEmployment).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ id: 'run' }),
      1,
      { type: 'continue' },
      false,
    )
    expect(
      screen.queryByRole('button', { name: /Continue to today/ }),
    ).toBeNull()
  },
)

it('stops an uncertain automatic submission and reconciles it explicitly without another credit', async () => {
  const state = {
    ...base,
    stage: 'income' as const,
    day: 10,
    hiredDay: 3,
    balance: usdCents(60000),
    weeklyIncome: usdCents(40000),
  }
  const next = snapshot({ ...state, stage: 'day' }, 2)
  vi.mocked(hasPending).mockResolvedValueOnce(false).mockResolvedValue(true)
  vi.mocked(submitEmployment)
    .mockRejectedValueOnce(new Error('Submission is not confirmed'))
    .mockResolvedValueOnce(next)
  show(state)
  const retry = await screen.findByRole('button', {
    name: 'Reconcile pending submission',
  })
  expect(screen.getByText("Opening today's content…")).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  expect(commit).not.toHaveBeenCalled()
  await userEvent.click(retry)
  await waitFor(() => expect(commit).toHaveBeenCalledExactlyOnceWith(next))
  expect(submitEmployment).toHaveBeenCalledTimes(2)
  expect(submitEmployment).toHaveBeenLastCalledWith(
    expect.objectContaining({ id: 'run' }),
    1,
    { type: 'continue' },
    true,
  )
  expect(next.state?.balance).toBe(60000)
})

it.each([2, 3])(
  'presents Day %i bills after employment instead of automatically leaving',
  async (day) => {
    const state = { ...base, stage: 'day' as const, day, hiredDay: day }
    const saved = snapshot(state)
    const billRun = {
      ...saved.run,
      employmentState: { revision: 1 },
    }
    vi.mocked(employmentSnapshot).mockResolvedValue({ ...saved, run: billRun })
    const onAction = vi.fn()
    const bills = {
      run: billRun,
      paidTotal: usdCents(0),
      overdueTotal: usdCents(0),
      outstandingTotal: usdCents(100),
      upcomingTotal: usdCents(0),
      scenarioIncome: usdCents(0),
      scenarioCharged: usdCents(0),
      items: [
        {
          id: 'bill',
          name: 'Fixture bill',
          principal: usdCents(100),
          fee: usdCents(50),
          dueDay: day,
          paidAt: null,
          ignoredAt: null,
          paymentBalanceAfter: null,
        },
      ],
    } as BillSnapshot
    render(
      <MemoryRouter>
        <SetupProvider>
          <EmploymentPanel
            run={billRun}
            bills={bills}
            onBillAction={onAction}
            onCommit={commit}
          />
        </SetupProvider>
      </MemoryRouter>,
    )
    const pay = await screen.findByRole('button', { name: 'Pay Fixture bill' })
    await userEvent.click(pay)
    expect(onAction).toHaveBeenCalledWith('bill', 'pay')
    expect(submitEmployment).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Continue to next day' }),
    ).toBeDisabled()
  },
)
