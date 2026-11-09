import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { BillSimulation } from './BillSimulation'
import { SetupProvider } from '../../state/SetupProvider'
import {
  loadBillSnapshot,
  submitBill,
  type BillSnapshot,
} from '../../services/billGameplay'
import {
  employmentSnapshot,
  hasPending,
} from '../../services/employmentGameplay'
import { createWalkthrough } from '../../state/employmentWalkthrough'
import { usdCents } from '../../types/domain'
import type { LoadedPlaythrough } from '../../types/playthrough'
vi.mock('../../services/billGameplay', async (original) => ({
  ...(await original<typeof import('../../services/billGameplay')>()),
  loadBillSnapshot: vi.fn(),
  submitBill: vi.fn(),
}))
vi.mock('../../services/employmentGameplay', async (original) => ({
  ...(await original<typeof import('../../services/employmentGameplay')>()),
  employmentSnapshot: vi.fn(),
  hasPending: vi.fn(),
}))
const base = createWalkthrough(
  {
    id: 'p',
    versionId: 'v',
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
const run = {
  id: 'run',
  personaId: 'p',
  versionId: 'v',
  ownerUserId: 'owner',
  currentDay: 3,
  currentBalance: usdCents(10000),
  currentScenarioId: null,
  currentJobId: null,
  status: 'active',
  sessionId: null,
  supportEnabled: false,
  startedAt: null,
  employmentState: { revision: 1, stage: 'day' },
  persona: { id: 'p', versionId: 'v', name: 'Alex', description: '' },
} as LoadedPlaythrough
const fresh: BillSnapshot = {
  run,
  items: [
    {
      id: 'bill',
      name: 'Fixture bill',
      dueDay: 3,
      principal: usdCents(1000),
      fee: usdCents(200),
      paidAt: null,
      ignoredAt: null,
      paymentBalanceAfter: null,
    },
  ],
  paidTotal: usdCents(0),
  overdueTotal: usdCents(0),
  outstandingTotal: usdCents(1000),
  upcomingTotal: usdCents(0),
  scenarioIncome: usdCents(0),
  scenarioCharged: usdCents(0),
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(hasPending).mockResolvedValue(false)
  vi.mocked(employmentSnapshot).mockImplementation(async (r) => ({
    run: r,
    revision: 1,
    state: {
      ...base,
      day: r.currentDay!,
      balance: r.currentBalance!,
      hiredDay: 3,
      stage: r.status === 'completed' ? 'complete' : 'day',
    },
  }))
  vi.mocked(loadBillSnapshot).mockResolvedValue(fresh)
})
function show() {
  return render(
    <MemoryRouter>
      <SetupProvider>
        <BillSimulation initialRun={run} />
      </SetupProvider>
    </MemoryRouter>,
  )
}
it('reconciles a lost payment response and restores a saved receipt on remount without another deduction', async () => {
  const paid = {
    ...fresh,
    run: { ...run, currentBalance: usdCents(9000) },
    paidTotal: usdCents(1000),
    outstandingTotal: usdCents(0),
    items: [
      {
        ...fresh.items[0],
        paidAt: '2026-11-08',
        paymentBalanceAfter: usdCents(9000),
      },
    ],
  }
  const view = show()
  const pay = await screen.findByRole('button', { name: 'Pay Fixture bill' })
  vi.mocked(submitBill).mockRejectedValueOnce(
    new Error('Submission not confirmed'),
  )
  vi.mocked(loadBillSnapshot).mockResolvedValue(paid)
  await userEvent.click(pay)
  expect(await screen.findByText('Paid $10.00')).toBeInTheDocument()
  expect(screen.getByText('$90.00')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Continue to next day' }),
  ).toBeEnabled()
  view.unmount()
  show()
  expect(await screen.findByText('Paid $10.00')).toBeInTheDocument()
  expect(submitBill).toHaveBeenCalledOnce()
})
it('reports Day 30 unpaid obligations while preserving remaining cash', async () => {
  vi.mocked(loadBillSnapshot).mockResolvedValue({
    ...fresh,
    run: {
      ...run,
      currentDay: 30,
      status: 'completed',
      employmentState: { stage: 'complete', revision: 1 },
    },
    overdueTotal: usdCents(1200),
    outstandingTotal: usdCents(1200),
    items: [{ ...fresh.items[0], ignoredAt: '2026-11-08' }],
  })
  show()
  expect(
    await screen.findByRole('region', {
      name: 'Unpaid obligations at completion',
    }),
  ).toHaveTextContent('$12.00, including late fees.')
  expect(
    screen.getByText(/Further consequences could occur/),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Pay Fixture bill' }),
  ).toBeDisabled()
  expect(submitBill).not.toHaveBeenCalled()
})
