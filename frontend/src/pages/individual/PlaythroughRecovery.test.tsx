import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SetupProvider } from '../../state/SetupProvider'
import { getSupabaseClient } from '../../services/supabase'
import { loadPlaythrough } from '../../services/loadPlaythrough'
import { loadHouseholdExpenses } from '../../services/householdExpenses'
import { contentService } from '../../services/contentService'
import { createIndividualPlaythrough } from '../../services/playthroughService'
import { usdCents } from '../../types/domain'
import type { LoadedPlaythrough } from '../../types/playthrough'
import { SimulationPage } from './SimulationPage'
import { IndividualPage } from './SimulationPages'
import { ReviewPage } from './ReviewPage'

vi.mock('../../services/supabase', () => ({ getSupabaseClient: vi.fn() }))
vi.mock('../../services/loadPlaythrough', async (original) => ({
  ...(await original<typeof import('../../services/loadPlaythrough')>()),
  loadPlaythrough: vi.fn(),
}))
vi.mock('../../services/householdExpenses', () => ({
  loadHouseholdExpenses: vi.fn(),
}))
vi.mock('../../services/playthroughService', () => ({
  createIndividualPlaythrough: vi.fn(),
}))
vi.mock('../../services/contentService', async (original) => ({
  ...(await original<typeof import('../../services/contentService')>()),
  contentService: { loadHouseholds: vi.fn() },
}))

const locator = 'cac-employment-v1:owner:run'
const rpc = vi.fn()
const signOut = vi.fn()
const run: LoadedPlaythrough = {
  id: 'legacy-run',
  personaId: 'persona',
  versionId: 'edition',
  ownerUserId: 'owner',
  currentScenarioId: null,
  currentBalance: usdCents(35000),
  currentDay: 1,
  supportEnabled: null,
  status: 'active',
  startedAt: null,
  sessionId: null,
  currentJobId: null,
  employmentState: null,
  persona: {
    id: 'persona',
    versionId: 'edition',
    name: 'Alex',
    description: null,
  },
}
function renderFlow(path = '/simulation') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SetupProvider>
        <Routes>
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/simulation/individual" element={<IndividualPage />} />
          <Route path="/simulation/review" element={<ReviewPage />} />
        </Routes>
      </SetupProvider>
    </MemoryRouter>,
  )
}
beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  localStorage.setItem(locator, 'legacy-run')
  localStorage.setItem('sb-example-auth-token', 'existing-session')
  localStorage.setItem('cac-employment-v1:another:run', 'another-run')
  localStorage.setItem(
    'cac-employment-v1:owner:pending:legacy-run',
    'pending-receipt',
  )
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
  vi.mocked(loadPlaythrough).mockResolvedValue(run)
  vi.mocked(loadHouseholdExpenses).mockResolvedValue({
    source: 'definitions',
    items: [],
  })
  vi.mocked(contentService.loadHouseholds).mockResolvedValue({
    versionId: 'edition',
    versionNumber: 1,
    personas: [
      {
        id: 'persona',
        versionId: 'edition',
        name: 'Alex',
        description: 'A synthetic test household.',
        startingBalance: usdCents(35000),
      },
    ],
  })
})
afterEach(() => vi.restoreAllMocks())

it.each(['missing', 'legacy', 'unsupported'])(
  'recovers a %s run in the same session and creates nothing until Start simulation',
  async (kind) => {
    vi.mocked(loadPlaythrough).mockResolvedValue(
      kind === 'missing'
        ? null
        : {
            ...run,
            employmentState: kind === 'legacy' ? null : { schemaVersion: 99 },
          },
    )
    const user = userEvent.setup()
    const page = renderFlow()
    await user.click(
      await screen.findByRole('button', {
        name: 'Choose a household for a new run',
      }),
    )
    expect(
      await screen.findByRole('heading', {
        name: 'Every household has a story.',
      }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Start simulation' }),
    ).toBeDisabled()
    expect(localStorage.getItem(locator)).toBeNull()
    expect(localStorage.getItem('sb-example-auth-token')).toBe(
      'existing-session',
    )
    expect(localStorage.getItem('cac-employment-v1:another:run')).toBe(
      'another-run',
    )
    expect(
      localStorage.getItem('cac-employment-v1:owner:pending:legacy-run'),
    ).toBe('pending-receipt')
    expect(rpc).not.toHaveBeenCalled()
    expect(signOut).not.toHaveBeenCalled()
    expect(createIndividualPlaythrough).not.toHaveBeenCalled()

    // A refresh/remount must not restore the discarded locator and redirect back.
    page.unmount()
    renderFlow('/simulation/individual')
    await user.click(
      await screen.findByRole('button', { name: /^Choose Alex/ }),
    )
    expect(
      await screen.findByRole('button', { name: 'Start simulation' }),
    ).toBeEnabled()
    expect(createIndividualPlaythrough).not.toHaveBeenCalled()

    vi.mocked(createIndividualPlaythrough).mockResolvedValue('new-run')
    vi.mocked(loadPlaythrough).mockResolvedValue({
      ...run,
      id: 'new-run',
      employmentState: {
        engine: 'employment-v1',
        schemaVersion: 1,
        revision: 0,
        stage: 'uninitialized',
        receipts: {},
      },
    })
    await user.click(screen.getByRole('button', { name: 'Start simulation' }))
    expect(
      await screen.findByRole('button', {
        name: "See who's hiring",
      }),
    ).toBeEnabled()
    expect(createIndividualPlaythrough).toHaveBeenCalledExactlyOnceWith(
      'persona',
    )
    await waitFor(() => expect(localStorage.getItem(locator)).toBe('new-run'))
    expect(rpc).not.toHaveBeenCalled()
  },
)

it('keeps the old run and shows an error if browser storage cannot forget it', async () => {
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new Error('storage blocked')
  })
  renderFlow()
  await userEvent.click(
    await screen.findByRole('button', {
      name: 'Choose a household for a new run',
    }),
  )
  expect(
    await screen.findByText(/Unable to clear the saved run selection/),
  ).toBeVisible()
  expect(localStorage.getItem(locator)).toBe('legacy-run')
  expect(
    screen.queryByRole('heading', { name: 'Every household has a story.' }),
  ).not.toBeInTheDocument()
  expect(createIndividualPlaythrough).not.toHaveBeenCalled()
  expect(rpc).not.toHaveBeenCalled()
})

it('does not offer a replacement run for a transient loading failure', async () => {
  vi.mocked(loadPlaythrough).mockRejectedValue(new Error('network'))
  renderFlow()
  await screen.findByRole('alert')
  expect(
    screen.queryByRole('button', { name: 'Choose a household for a new run' }),
  ).not.toBeInTheDocument()
  expect(localStorage.getItem(locator)).toBe('legacy-run')
})
