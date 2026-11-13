import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { BillSimulation } from './BillSimulation'
import { IndividualPage } from './SimulationPages'
import { AppLayout } from '../../layouts/AppLayout'
import { SetupProvider } from '../../state/SetupProvider'
import { getSupabaseClient } from '../../services/supabase'
import {
  loadBillSnapshot,
  submitBill,
  type BillSnapshot,
} from '../../services/billGameplay'
import { contentService } from '../../services/contentService'
import { loadPlaythrough } from '../../services/loadPlaythrough'
import { createIndividualPlaythrough } from '../../services/playthroughService'
import { loadScenario } from '../../services/scenarioContent'
import {
  restoreScenario,
  submitScenario,
  type ScenarioRunSnapshot,
} from '../../services/scenarioGameplay'
import type { LoadedPlaythrough } from '../../types/playthrough'
import { usdCents } from '../../types/domain'
import { localScenario } from '../../development/scenarioTestFixture'

vi.mock('../../services/supabase', () => ({ getSupabaseClient: vi.fn() }))
vi.mock('../../services/billGameplay', async (original) => ({
  ...(await original<typeof import('../../services/billGameplay')>()),
  loadBillSnapshot: vi.fn(),
  submitBill: vi.fn(),
}))
vi.mock('../../services/contentService', async (original) => ({
  ...(await original<typeof import('../../services/contentService')>()),
  contentService: { loadJobs: vi.fn(), loadHouseholds: vi.fn() },
}))
vi.mock('../../services/loadPlaythrough', () => ({ loadPlaythrough: vi.fn() }))
vi.mock('../../services/playthroughService', () => ({
  createIndividualPlaythrough: vi.fn(),
}))
vi.mock('../../services/scenarioContent', () => ({ loadScenario: vi.fn() }))
vi.mock('../../services/scenarioGameplay', () => ({
  restoreScenario: vi.fn(),
  submitScenario: vi.fn(),
}))
vi.mock('../../components/simulation/ScenarioFacts', () => ({
  ScenarioFacts: () => null,
}))

const showModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
)
const close = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
)
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() {
      this.setAttribute('open', '')
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      this.removeAttribute('open')
    },
  })
})
afterAll(() => {
  if (showModal)
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModal)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (close) Object.defineProperty(HTMLDialogElement.prototype, 'close', close)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const persona = {
  id: 'p',
  versionId: localScenario.versionId,
  name: 'Alex',
  description: '',
  startingBalance: usdCents(10000),
  hasEnglishSkills: false,
  hasComputerSkills: false,
}
const marker = {
  engine: 'employment-v1',
  schemaVersion: 1,
  stage: 'uninitialized',
  revision: 0,
  receipts: {},
}
const initialized = {
  ...marker,
  stage: 'board',
  revision: 1,
  prepared: false,
  hasEnglishSkills: false,
  hasComputerSkills: false,
  assistanceUsed: false,
  clothing: 'none',
  targetId: null,
  initialTargetId: null,
  hiredDay: null,
  weeklyIncome: '0.00',
  history: [],
  creditedDays: [],
  reason: null,
}
const locator = 'cac-employment-v1:owner:run'
const pendingKey = 'cac-employment-v1:owner:pending:run'
let databaseRun: LoadedPlaythrough
let billItems: BillSnapshot['items']
const rpc = vi.fn()
const signOut = vi.fn()
function snapshot(): BillSnapshot {
  return {
    run: databaseRun,
    items: billItems,
    paidTotal: usdCents(0),
    overdueTotal: usdCents(0),
    outstandingTotal: usdCents(billItems.length ? 1000 : 0),
    upcomingTotal: usdCents(0),
    scenarioIncome: usdCents(0),
    scenarioCharged: usdCents(0),
  }
}
function show(path = '/simulation') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SetupProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              path="/simulation"
              element={<BillSimulation initialRun={databaseRun} />}
            />
            <Route path="/simulation/individual" element={<IndividualPage />} />
            <Route path="/" element={<h1>Home</h1>} />
          </Route>
        </Routes>
      </SetupProvider>
    </MemoryRouter>,
  )
}
function commitEnd(args: {
  p_request_id: string
  p_revision: number
  p_action: object
}) {
  const document = databaseRun.employmentState as typeof marker
  const receipts = document.receipts as Record<string, unknown>
  if (receipts[args.p_request_id])
    return {
      data: { run: row(), receipt: receipts[args.p_request_id] },
      error: null,
    }
  const revision = document.revision + 1
  databaseRun = {
    ...databaseRun,
    status: 'ended',
    employmentState: {
      ...document,
      stage: 'ended',
      revision,
      reason: 'You ended the walkthrough.',
      receipts: {
        ...receipts,
        [args.p_request_id]: {
          action: args.p_action,
          expectedRevision: args.p_revision,
          revision,
          day: databaseRun.currentDay,
          change: '0',
          stage: 'ended',
        },
      },
    },
  }
  return { data: { run: row() }, error: null }
}
function row() {
  return {
    playthrough_id: databaseRun.id,
    owner_user_id: 'owner',
    persona_id: persona.id,
    version_id: persona.versionId,
    current_balance: (databaseRun.currentBalance! / 100).toFixed(2),
    current_day: databaseRun.currentDay,
    current_scenario_id: databaseRun.currentScenarioId,
    current_job_id: databaseRun.currentJobId,
    status: databaseRun.status,
    cac_support_enabledabled: databaseRun.supportEnabled,
    employment_state: databaseRun.employmentState,
  }
}
beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  localStorage.setItem(locator, 'run')
  databaseRun = {
    id: 'run',
    ownerUserId: 'owner',
    personaId: persona.id,
    versionId: persona.versionId,
    currentDay: 1,
    currentBalance: usdCents(10000),
    currentScenarioId: null,
    currentJobId: null,
    status: 'active',
    supportEnabled: null,
    sessionId: null,
    startedAt: null,
    employmentState: marker,
    persona,
  }
  billItems = []
  vi.mocked(getSupabaseClient).mockResolvedValue({
    rpc,
    auth: {
      signOut,
      getUser: async () => ({
        data: { user: { id: 'owner', is_anonymous: true } },
        error: null,
      }),
    },
  } as unknown as Awaited<ReturnType<typeof getSupabaseClient>>)
  rpc.mockImplementation(async (_name, args) => commitEnd(args))
  vi.mocked(loadBillSnapshot).mockImplementation(async () => snapshot())
  vi.mocked(loadPlaythrough).mockImplementation(async () => databaseRun)
  vi.mocked(contentService.loadJobs).mockResolvedValue([])
  vi.mocked(contentService.loadHouseholds).mockResolvedValue({
    versionId: persona.versionId,
    versionNumber: 1,
    personas: [persona],
  })
  vi.mocked(loadScenario).mockResolvedValue(localScenario)
  vi.mocked(restoreScenario).mockImplementation(async () => ({
    run: databaseRun,
    decision: null,
    responseText: null,
  }))
})
async function open() {
  const giveUp = await screen.findByRole('button', { name: 'Give Up' })
  await waitFor(() => expect(giveUp).toBeEnabled())
  await userEvent.click(giveUp)
  const dialog = screen.getByRole('dialog', { name: 'Give Up?' })
  expect(dialog).toHaveAccessibleDescription(
    'Are you sure you want to give up on this simulation?',
  )
  expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()
  return dialog
}
async function giveUp() {
  await userEvent.click(
    within(await open()).getByRole('button', { name: 'Give Up' }),
  )
  return screen.findByRole('heading', { name: 'Simulation ended early.' })
}
it('gives up before employment without initialization and restores/replays the terminal marker', async () => {
  const page = show()
  await screen.findByRole('button', { name: "See who's hiring" })
  expect(await giveUp()).toBeVisible()
  expect(rpc).toHaveBeenCalledExactlyOnceWith(
    'submit_employment_action',
    expect.objectContaining({ p_revision: 0, p_action: { type: 'end' } }),
  )
  const document = databaseRun.employmentState as Record<string, unknown>
  expect(Object.keys(document).sort()).toEqual([
    'engine',
    'reason',
    'receipts',
    'revision',
    'schemaVersion',
    'stage',
  ])
  expect(databaseRun.currentDay).toBe(1)
  expect(databaseRun.currentBalance).toBe(10000)
  expect(
    within(
      screen.getByRole('region', { name: 'Simulation results' }),
    ).getByText('Before Day 1'),
  ).toBeVisible()
  expect(
    within(
      screen.getByRole('region', { name: 'Simulation results' }),
    ).getByText('$100.00'),
  ).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Give Up' })).toBeNull()
  expect(
    screen.queryByRole('button', { name: 'Try again with CAC support' }),
  ).toBeNull()
  page.unmount()
  show()
  expect(
    await screen.findByRole('heading', { name: 'Simulation ended early.' }),
  ).toBeVisible()
  expect(
    within(
      screen.getByRole('region', { name: 'Simulation results' }),
    ).getByText('Before Day 1'),
  ).toBeVisible()
  await userEvent.click(
    screen.getByRole('button', { name: 'Replay from household selection' }),
  )
  expect(
    await screen.findByRole('heading', {
      name: 'Every household has a story.',
    }),
  ).toBeVisible()
  expect(localStorage.getItem(locator)).toBeNull()
  expect(createIndividualPlaythrough).not.toHaveBeenCalled()
  expect(signOut).not.toHaveBeenCalled()
})
it.each(['board', 'day'] as const)(
  'preserves initialized %s data, refresh, and terminal logo navigation',
  async (stage) => {
    databaseRun = {
      ...databaseRun,
      currentDay: stage === 'day' ? 4 : 1,
      supportEnabled: false,
      currentScenarioId: stage === 'day' ? localScenario.id : null,
      employmentState: { ...initialized, stage },
    }
    const before = structuredClone(databaseRun)
    const page = show()
    if (stage === 'day') await screen.findByText(localScenario.description)
    expect(await giveUp()).toBeVisible()
    expect(databaseRun.currentBalance).toBe(before.currentBalance)
    expect(databaseRun.currentDay).toBe(before.currentDay)
    const gameplayOnly = (value: unknown) =>
      Object.fromEntries(
        Object.entries(value as Record<string, unknown>).filter(
          ([key]) => !['stage', 'reason', 'revision', 'receipts'].includes(key),
        ),
      )
    const gameplay = gameplayOnly(databaseRun.employmentState)
    const oldGameplay = gameplayOnly(before.employmentState)
    expect(gameplay).toEqual(oldGameplay)
    expect(submitScenario).not.toHaveBeenCalled()
    page.unmount()
    show()
    await screen.findByRole('heading', { name: 'Simulation ended early.' })
    await userEvent.click(
      screen.getByRole('link', { name: 'CAC Poverty Simulation' }),
    )
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeVisible()
    expect(localStorage.getItem(locator)).toBeNull()
    expect(signOut).not.toHaveBeenCalled()
  },
)
it('preserves unresolved bills without paying, ignoring, or generating fees', async () => {
  databaseRun = {
    ...databaseRun,
    currentDay: 9,
    supportEnabled: false,
    employmentState: { ...initialized, stage: 'day' },
  }
  billItems = [
    {
      id: 'bill',
      name: 'Rent',
      dueDay: 9,
      principal: usdCents(1000),
      fee: usdCents(200),
      ignoredAt: null,
      paidAt: null,
      paymentBalanceAfter: null,
    },
  ]
  const before = structuredClone(billItems)
  show()
  await screen.findByRole('region', { name: 'Bills due today' })
  await giveUp()
  expect(billItems).toEqual(before)
  expect(submitBill).not.toHaveBeenCalled()
  expect(databaseRun.currentBalance).toBe(10000)
  expect(databaseRun.currentDay).toBe(9)
})
it('cancel leaves the run unchanged and sends no mutation', async () => {
  show()
  const before = structuredClone(databaseRun)
  const dialog = await open()
  expect(
    screen.getByRole('button', { name: "See who's hiring" }),
  ).toBeDisabled()
  await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(databaseRun).toEqual(before)
  expect(rpc).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Give Up' })).toHaveFocus()
})
it.each([false, true])(
  'recovers an interrupted end using the same receipt, initialized=%s',
  async (initializedRun) => {
    if (initializedRun)
      databaseRun = {
        ...databaseRun,
        supportEnabled: false,
        employmentState: initialized,
      }
    rpc
      .mockImplementationOnce(async (_name, args) => {
        commitEnd(args)
        return { data: null, error: { message: 'response lost' } }
      })
      .mockImplementation(async (_name, args) => commitEnd(args))
    const page = show()
    await giveUp()
    expect(localStorage.getItem(pendingKey)).not.toBeNull()
    page.unmount()
    show()
    await screen.findByRole('heading', { name: 'Simulation ended early.' })
    const replay = screen.getByRole('button', {
      name: 'Replay from household selection',
    })
    expect(replay).toBeDisabled()
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Reconcile pending submission',
      }),
    )
    await waitFor(() => expect(replay).toBeEnabled())
    expect(rpc).toHaveBeenCalledTimes(2)
    expect(rpc.mock.calls[1][1]).toEqual(rpc.mock.calls[0][1])
    expect(localStorage.getItem(pendingKey)).toBeNull()
    expect(databaseRun.currentBalance).toBe(10000)
  },
)
it.each(['pay', 'ignore'] as const)(
  'blocks Give Up while %s or financial reconciliation is pending',
  async (action) => {
    databaseRun = {
      ...databaseRun,
      currentDay: 9,
      supportEnabled: false,
      employmentState: { ...initialized, stage: 'day' },
    }
    billItems = [
      {
        id: 'bill',
        name: 'Rent',
        dueDay: 9,
        principal: usdCents(1000),
        fee: usdCents(200),
        ignoredAt: null,
        paidAt: null,
        paymentBalanceAfter: null,
      },
    ]
    const pending = deferred<BillSnapshot>()
    vi.mocked(submitBill).mockReturnValue(pending.promise)
    show()
    await userEvent.click(
      await screen.findByRole('button', {
        name: `${action === 'pay' ? 'Pay' : 'Ignore'} Rent`,
      }),
    )
    expect(screen.getByRole('button', { name: 'Give Up' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Give Up' }))
    expect(rpc).not.toHaveBeenCalled()
    await act(async () => pending.resolve(snapshot()))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Give Up' })).toBeEnabled(),
    )
  },
)
it('blocks Give Up through employment submission and the following financial refresh', async () => {
  const pending = deferred<{
    data: { run: ReturnType<typeof row> }
    error: null
  }>()
  const financial = deferred<BillSnapshot>()
  rpc.mockReturnValue(pending.promise)
  show()
  await userEvent.click(
    await screen.findByRole('button', { name: "See who's hiring" }),
  )
  expect(screen.getByRole('button', { name: 'Give Up' })).toBeDisabled()
  databaseRun = {
    ...databaseRun,
    supportEnabled: false,
    employmentState: initialized,
  }
  vi.mocked(loadBillSnapshot).mockReturnValueOnce(financial.promise)
  await act(async () => pending.resolve({ data: { run: row() }, error: null }))
  expect(screen.getByRole('button', { name: 'Give Up' })).toBeDisabled()
  expect(rpc).toHaveBeenCalledTimes(1)
  expect(rpc.mock.calls[0][1].p_action).toEqual({ type: 'initialize' })
  await act(async () => financial.resolve(snapshot()))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Give Up' })).toBeEnabled(),
  )
})
it('blocks Give Up while a scenario mutation or its outcome is uncertain', async () => {
  databaseRun = {
    ...databaseRun,
    currentDay: 4,
    currentScenarioId: localScenario.id,
    supportEnabled: false,
    employmentState: { ...initialized, stage: 'day' },
  }
  const pending = deferred<ScenarioRunSnapshot>()
  vi.mocked(submitScenario).mockReturnValue(pending.promise)
  show()
  await userEvent.click(
    await screen.findByRole('button', { name: /Decline assistance/ }),
  )
  await userEvent.click(screen.getByRole('button', { name: 'Submit decision' }))
  expect(screen.getByRole('button', { name: 'Give Up' })).toBeDisabled()
  vi.mocked(restoreScenario).mockRejectedValueOnce(new Error('offline'))
  await act(async () => pending.reject(new Error('response lost')))
  expect(screen.getByRole('button', { name: 'Give Up' })).toBeDisabled()
  vi.mocked(restoreScenario).mockResolvedValueOnce({
    run: databaseRun,
    decision: null,
    responseText: null,
  })
  await userEvent.click(
    screen.getByRole('button', { name: 'Reload saved decision' }),
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Give Up' })).toBeEnabled(),
  )
  expect(rpc).not.toHaveBeenCalled()
})
it('pauses automatic advancement while confirmation is open and resumes after cancellation', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    databaseRun = {
      ...databaseRun,
      currentDay: 10,
      supportEnabled: false,
      employmentState: { ...initialized, stage: 'income' },
    }
    rpc.mockImplementation(async (_name, args) => {
      expect(args.p_action).toEqual({ type: 'continue' })
      databaseRun = {
        ...databaseRun,
        employmentState: { ...initialized, stage: 'day', revision: 2 },
      }
      return { data: { run: row() }, error: null }
    })
    await act(async () => {
      show()
    })
    const button = screen.getByRole('button', { name: 'Give Up' })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    await act(async () => {
      vi.runOnlyPendingTimers()
    })
    expect(rpc).not.toHaveBeenCalled()
    expect(databaseRun.status).toBe('active')
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Cancel',
      }),
    )
    await act(async () => {
      vi.runOnlyPendingTimers()
    })
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(databaseRun.status).toBe('active')
  } finally {
    vi.useRealTimers()
  }
})
