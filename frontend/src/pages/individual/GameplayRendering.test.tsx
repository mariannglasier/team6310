import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import { BillSimulation } from './BillSimulation'
import { EmploymentPanel } from './EmploymentPanel'
import { SetupProvider } from '../../state/SetupProvider'
import {
  loadBillSnapshot,
  submitBill,
  type BillSnapshot,
} from '../../services/billGameplay'
import {
  employmentSnapshot,
  hasPending,
  rememberedRun,
  submitEmployment,
  type CommittedEmployment,
} from '../../services/employmentGameplay'
import { loadScenario } from '../../services/scenarioContent'
import {
  restoreScenario,
  submitScenario,
  type ScenarioRunSnapshot,
} from '../../services/scenarioGameplay'
import {
  loadScenarioFacts,
  type ScenarioFact,
} from '../../services/scenarioFacts'
import { createWalkthrough } from '../../state/employmentWalkthrough'
import { localScenario } from '../../development/scenarioTestFixture'
import type { LoadedPlaythrough } from '../../types/playthrough'
import { usdCents } from '../../types/domain'

vi.mock('../../services/billGameplay', async (original) => ({
  ...(await original<typeof import('../../services/billGameplay')>()),
  loadBillSnapshot: vi.fn(),
  submitBill: vi.fn(),
}))
vi.mock('../../services/employmentGameplay', async (original) => ({
  ...(await original<typeof import('../../services/employmentGameplay')>()),
  employmentSnapshot: vi.fn(),
  hasPending: vi.fn(),
  rememberedRun: vi.fn(),
  submitEmployment: vi.fn(),
}))
vi.mock('../../services/scenarioContent', () => ({ loadScenario: vi.fn() }))
vi.mock('../../services/scenarioGameplay', () => ({
  restoreScenario: vi.fn(),
  submitScenario: vi.fn(),
}))
vi.mock('../../services/scenarioFacts', () => ({ loadScenarioFacts: vi.fn() }))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
const base = createWalkthrough(
  {
    id: 'persona',
    versionId: localScenario.versionId,
    name: 'Alex',
    description: '',
    startingBalance: usdCents(10000),
    hasEnglishSkills: false,
    hasComputerSkills: false,
  },
  [],
  false,
  usdCents(6000),
)
const run: LoadedPlaythrough = {
  id: 'run',
  personaId: 'persona',
  versionId: localScenario.versionId,
  ownerUserId: 'owner',
  currentDay: 4,
  currentScenarioId: localScenario.id,
  currentBalance: usdCents(10000),
  status: 'active',
  sessionId: null,
  currentJobId: null,
  supportEnabled: false,
  startedAt: null,
  employmentState: { stage: 'day', revision: 1 },
  persona: {
    id: 'persona',
    versionId: localScenario.versionId,
    name: 'Alex',
    description: '',
  },
}
function employment(r: LoadedPlaythrough): CommittedEmployment {
  const document = r.employmentState as {
    stage: 'day' | 'income'
    revision: number
  }
  return {
    run: r,
    revision: document.revision,
    state: {
      ...base,
      stage: document.stage,
      day: r.currentDay!,
      balance: r.currentBalance!,
      hiredDay: 3,
    },
  }
}
function bills(r = run): BillSnapshot {
  return {
    run: r,
    items: [],
    paidTotal: usdCents(0),
    overdueTotal: usdCents(0),
    outstandingTotal: usdCents(0),
    upcomingTotal: usdCents(0),
    scenarioIncome: usdCents(0),
    scenarioCharged: usdCents(0),
  }
}
function scheduledBills(r: LoadedPlaythrough): BillSnapshot {
  return {
    ...bills(r),
    items: [
      {
        id: 'due',
        name: 'Scheduled bill',
        principal: usdCents(1000),
        fee: usdCents(200),
        dueDay: r.currentDay!,
        paidAt: null,
        ignoredAt: null,
        paymentBalanceAfter: null,
      },
    ],
  }
}
function show(initialRun = run) {
  return render(
    <MemoryRouter>
      <SetupProvider>
        <BillSimulation initialRun={initialRun} />
      </SetupProvider>
    </MemoryRouter>,
  )
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(rememberedRun).mockResolvedValue(null)
  vi.mocked(hasPending).mockResolvedValue(false)
  vi.mocked(employmentSnapshot).mockImplementation(async (r) => employment(r))
  vi.mocked(loadBillSnapshot).mockResolvedValue(bills())
  vi.mocked(loadScenario).mockResolvedValue(localScenario)
  vi.mocked(restoreScenario).mockResolvedValue({
    run,
    decision: null,
    responseText: null,
  })
  vi.mocked(loadScenarioFacts).mockResolvedValue([])
})

// Rendering consumes the same owned-run/snapshot contract for both identities;
// Auth/RLS are mocked here and remain covered by the identity service suites.
it.each(['anonymous', 'staff'])(
  'restores %s bill days without a placeholder, including after remount',
  async (identity) => {
    const restoredRun = {
      ...run,
      ownerUserId: `${identity}-owner`,
      currentScenarioId: null,
    }
    const first = deferred<BillSnapshot>()
    vi.mocked(loadBillSnapshot).mockReturnValueOnce(first.promise)
    const view = show(restoredRun)
    expect(screen.getByText('Loading your bills and progress…')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    await act(async () => first.resolve(scheduledBills(restoredRun)))
    expect(
      await screen.findByRole('region', { name: 'Bills due today' }),
    ).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    view.unmount()
    const refreshed = deferred<BillSnapshot>()
    vi.mocked(loadBillSnapshot).mockReturnValueOnce(refreshed.promise)
    show(restoredRun)
    expect(screen.getByText('Loading your bills and progress…')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    await act(async () => refreshed.resolve(scheduledBills(restoredRun)))
    expect(
      await screen.findByRole('region', { name: 'Bills due today' }),
    ).toBeVisible()
    expect(loadScenario).not.toHaveBeenCalled()
    expect(submitEmployment).not.toHaveBeenCalled()
  },
)
it.each(['anonymous', 'staff'])(
  'allows the %s fallback only after a successful empty bill snapshot',
  async (identity) => {
    const restoredRun = {
      ...run,
      ownerUserId: `${identity}-owner`,
      currentScenarioId: null,
    }
    const financial = deferred<BillSnapshot>()
    vi.mocked(loadBillSnapshot).mockReturnValue(financial.promise)
    show(restoredRun)
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    await act(async () => financial.resolve(bills(restoredRun)))
    expect(await screen.findByRole('button', { name: 'Next' })).toBeVisible()
    expect(loadScenario).not.toHaveBeenCalled()
  },
)
it('preserves a bill loading error and retries without showing the fallback', async () => {
  const restoredRun = { ...run, currentScenarioId: null }
  vi.mocked(loadBillSnapshot).mockRejectedValueOnce(
    new Error('Bill service unavailable'),
  )
  show(restoredRun)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Bill service unavailable',
  )
  expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  const retry = deferred<BillSnapshot>()
  vi.mocked(loadBillSnapshot).mockReturnValueOnce(retry.promise)
  await userEvent.click(
    screen.getByRole('button', { name: 'Reload saved bills' }),
  )
  expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  await act(async () => retry.resolve(scheduledBills(restoredRun)))
  expect(
    await screen.findByRole('region', { name: 'Bills due today' }),
  ).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
})
it.each([undefined, null])(
  'does not treat a missing bill snapshot (%s) as an empty schedule',
  async (missing) => {
    const restoredRun = { ...run, currentScenarioId: null }
    render(
      <MemoryRouter>
        <SetupProvider>
          <EmploymentPanel
            run={restoredRun}
            bills={missing}
            onCommit={vi.fn()}
          />
        </SetupProvider>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Loading…')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  },
)
it('withdraws fallback eligibility while an existing empty snapshot is refreshing', async () => {
  const restoredRun = { ...run, currentScenarioId: null }
  const empty = bills(restoredRun)
  const renderPanel = (billBusy: boolean) => (
    <MemoryRouter>
      <SetupProvider>
        <EmploymentPanel
          run={restoredRun}
          bills={empty}
          billBusy={billBusy}
          onCommit={vi.fn()}
        />
      </SetupProvider>
    </MemoryRouter>
  )
  const view = render(renderPanel(false))
  expect(await screen.findByRole('button', { name: 'Next' })).toBeVisible()
  view.rerender(renderPanel(true))
  expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  expect(screen.getByText('Loading…')).toBeVisible()
  view.rerender(renderPanel(false))
  expect(await screen.findByRole('button', { name: 'Next' })).toBeVisible()
})
it('shows a real scenario instead of the fallback once an empty bill schedule is known', async () => {
  const financial = deferred<BillSnapshot>()
  vi.mocked(loadBillSnapshot).mockReturnValue(financial.promise)
  show()
  expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  await act(async () => financial.resolve(bills()))
  expect(await screen.findByText(localScenario.description)).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
})

it('keeps the scenario description mounted while committed finances and secondary facts load independently', async () => {
  const payment = deferred<ScenarioRunSnapshot>()
  const financial = deferred<BillSnapshot>()
  const facts = deferred<ScenarioFact[]>()
  vi.mocked(submitScenario).mockReturnValue(payment.promise)
  vi.mocked(loadScenarioFacts).mockReturnValue(facts.promise)
  show()
  const description = await screen.findByText(localScenario.description)
  const panel = screen.getByRole('region', { name: 'Ordinary scenario' })
  expect(loadScenarioFacts).not.toHaveBeenCalled()
  await userEvent.click(
    screen.getByRole('button', { name: /Receive assistance/ }),
  )
  expect(submitScenario).toHaveBeenCalledOnce()
  expect(description).toBeInTheDocument()
  const committedRun = { ...run, currentBalance: usdCents(12500) }
  vi.mocked(loadBillSnapshot).mockReturnValue(financial.promise)
  await act(async () =>
    payment.resolve({
      run: committedRun,
      decision: {
        scenarioId: localScenario.id,
        choiceId: 'receive',
        balanceAfter: usdCents(12500),
        balanceChangeApplied: usdCents(2500),
      },
      responseText: 'Committed result',
    }),
  )
  await waitFor(() => expect(loadScenarioFacts).toHaveBeenCalledOnce())
  expect(screen.getByText(localScenario.description)).toBe(description)
  expect(screen.getByRole('region', { name: 'Ordinary scenario' })).toBe(panel)
  expect(screen.queryByText('Loading…')).toBeNull()
  expect(
    screen.getByRole('button', { name: 'Continue to next day' }),
  ).toBeDisabled()
  await act(async () =>
    financial.resolve({
      ...bills(committedRun),
      scenarioIncome: usdCents(2500),
    }),
  )
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Continue to next day' }),
    ).toBeEnabled(),
  )
  expect(screen.getByText(localScenario.description)).toBe(description)
  expect(screen.queryByText('About this decision')).toBeNull()
  await act(async () =>
    facts.resolve([
      {
        role: 'general',
        semanticKey: 'context',
        text: 'Additional decision context',
        sourceUrl: 'https://example.com',
        copyKind: 'context',
      },
    ]),
  )
  expect(await screen.findByText('Additional decision context')).toBeVisible()
  expect(screen.getByText(localScenario.description)).toBe(description)
  expect(loadScenario).toHaveBeenCalledOnce()
  expect(restoreScenario).toHaveBeenCalledOnce()
  expect(submitScenario).toHaveBeenCalledOnce()
})

it('resolves an income transition to a bill day without rendering a scenario placeholder', async () => {
  const incomeRun = {
    ...run,
    currentDay: 10,
    currentScenarioId: null,
    employmentState: { stage: 'income', revision: 1 },
  }
  const currentBills = {
    ...bills(incomeRun),
    items: [
      {
        id: 'due',
        name: 'Scheduled bill',
        principal: usdCents(1000),
        fee: usdCents(200),
        dueDay: 10,
        paidAt: null,
        ignoredAt: null,
        paymentBalanceAfter: null,
      },
    ],
  }
  const advance = deferred<CommittedEmployment>()
  const financial = deferred<BillSnapshot>()
  vi.mocked(loadBillSnapshot).mockResolvedValue(currentBills)
  vi.mocked(submitEmployment).mockReturnValue(advance.promise)
  show(incomeRun)
  await waitFor(() => expect(submitEmployment).toHaveBeenCalledOnce())
  expect(screen.getByText('Loading…')).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  const billRun = {
    ...incomeRun,
    employmentState: { stage: 'day', revision: 2 },
  }
  vi.mocked(loadBillSnapshot).mockReturnValue(financial.promise)
  await act(async () => advance.resolve(employment(billRun)))
  expect(screen.getByRole('region', { name: 'Bills due today' })).toBeVisible()
  expect(
    screen.getByRole('button', { name: 'Pay Scheduled bill' }),
  ).toBeDisabled()
  expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  await act(async () => financial.resolve({ ...currentBills, run: billRun }))
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Pay Scheduled bill' }),
    ).toBeEnabled(),
  )
  expect(
    screen.getByRole('button', { name: 'Continue to next day' }),
  ).toBeDisabled()
  expect(loadScenario).not.toHaveBeenCalled()
  expect(submitEmployment).toHaveBeenCalledOnce()
})

it.each(['bill', 'scenario'] as const)(
  'waits for the new snapshot before rendering a %s day',
  async (contentType) => {
    const previousRun = { ...run, currentDay: 5, currentScenarioId: null }
    const next = deferred<CommittedEmployment>()
    const financial = deferred<BillSnapshot>()
    const scenario = deferred<Awaited<ReturnType<typeof loadScenario>>>()
    vi.mocked(loadBillSnapshot).mockResolvedValue(bills(previousRun))
    vi.mocked(submitEmployment).mockReturnValue(next.promise)
    show(previousRun)
    await userEvent.click(await screen.findByRole('button', { name: 'Next' }))
    vi.mocked(loadBillSnapshot).mockReturnValue(financial.promise)
    vi.mocked(loadScenario).mockReturnValue(scenario.promise)
    const nextRun = {
      ...run,
      currentDay: 6,
      currentScenarioId: contentType === 'scenario' ? localScenario.id : null,
      employmentState: { stage: 'day', revision: 2 },
    }
    await act(async () => next.resolve(employment(nextRun)))
    expect(screen.getByText('Loading…')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Bills due today' })).toBeNull()
    if (contentType === 'bill') {
      await act(async () =>
        financial.resolve({
          ...bills(nextRun),
          items: [
            {
              id: 'due',
              name: 'Scheduled bill',
              principal: usdCents(1000),
              fee: usdCents(200),
              dueDay: 6,
              paidAt: null,
              ignoredAt: null,
              paymentBalanceAfter: null,
            },
          ],
        }),
      )
      expect(
        await screen.findByRole('region', { name: 'Bills due today' }),
      ).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
      expect(
        screen.getByRole('button', { name: 'Continue to next day' }),
      ).toBeDisabled()
      expect(loadScenario).not.toHaveBeenCalled()
      return
    }
    await act(async () => financial.resolve(bills(nextRun)))
    expect(await screen.findByText('Loading…')).toBeVisible()
    expect(screen.queryByRole('region', { name: 'Bills due today' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    await act(async () => scenario.resolve(localScenario))
    expect(await screen.findByText(localScenario.description)).toBeVisible()
    expect(submitEmployment).toHaveBeenCalledOnce()
  },
)

it('updates an overdue payment and financial indicators without remounting the unchanged scenario', async () => {
  const overdue = {
    ...bills(),
    overdueTotal: usdCents(1200),
    outstandingTotal: usdCents(1200),
    items: [
      {
        id: 'overdue',
        name: 'Earlier bill',
        principal: usdCents(1000),
        fee: usdCents(200),
        dueDay: 1,
        ignoredAt: '2026-11-08',
        paidAt: null,
        paymentBalanceAfter: null,
      },
    ],
  }
  vi.mocked(loadBillSnapshot).mockResolvedValue(overdue)
  const payment = deferred<BillSnapshot>()
  vi.mocked(submitBill).mockReturnValue(payment.promise)
  show()
  const description = await screen.findByText(localScenario.description)
  const panel = screen.getByRole('region', { name: 'Ordinary scenario' })
  const choice = screen.getByRole('button', { name: /Decline assistance/ })
  const pay = screen.getByRole('button', { name: 'Pay Earlier bill' })
  await userEvent.click(pay)
  expect(pay).toBeDisabled()
  expect(choice).toBeDisabled()
  await userEvent.click(pay)
  expect(submitBill).toHaveBeenCalledOnce()
  await act(async () =>
    payment.resolve({
      ...overdue,
      run: { ...run, currentBalance: usdCents(8800) },
      overdueTotal: usdCents(0),
      outstandingTotal: usdCents(0),
      paidTotal: usdCents(1200),
      items: [
        {
          ...overdue.items[0],
          paidAt: '2026-11-09',
          paymentBalanceAfter: usdCents(8800),
        },
      ],
    }),
  )
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: /Decline assistance/ }),
    ).toBeEnabled(),
  )
  expect(screen.getByText(localScenario.description)).toBe(description)
  expect(screen.getByRole('region', { name: 'Ordinary scenario' })).toBe(panel)
  expect(screen.getByRole('button', { name: /Decline assistance/ })).toBe(
    choice,
  )
  expect(choice).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByText('$88.00')).toBeVisible()
  expect(screen.getByText('Recorded payments')).toBeVisible()
  expect(screen.getByText('Paid')).toBeVisible()
  expect(screen.queryByRole('region', { name: 'Overdue' })).toBeNull()
  expect(
    screen.getByText('Total expenses charged').nextElementSibling,
  ).toHaveTextContent('$12.00')
  expect(loadScenario).toHaveBeenCalledOnce()
  expect(restoreScenario).toHaveBeenCalledOnce()
  expect(submitScenario).not.toHaveBeenCalled()
})
