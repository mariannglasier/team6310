import { loadHouseholdExpenses } from '../../services/householdExpenses'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import { SimulationPage } from './SimulationPage'
import { SetupContext, type CreatedPlaythrough } from '../../state/setupContext'
import { loadPlaythrough } from '../../services/loadPlaythrough'
import { usdCents } from '../../types/domain'
import type { LoadedPlaythrough } from '../../types/playthrough'

vi.mock('../../services/householdExpenses', () => ({
  loadHouseholdExpenses: vi.fn(),
}))

vi.mock('../../services/loadPlaythrough', async (original) => ({
  ...(await original<typeof import('../../services/loadPlaythrough')>()),
  loadPlaythrough: vi.fn(),
}))
const loaded: LoadedPlaythrough = {
  id: 'run',
  personaId: 'persona',
  versionId: 'version',
  ownerUserId: 'owner',
  currentScenarioId: null,
  currentBalance: usdCents(35025),
  currentDay: 1,
  supportEnabled: null,
  status: 'active',
  startedAt: null,
  sessionId: null,
  currentJobId: null,
  employmentState: null,
  persona: {
    id: 'persona',
    versionId: 'version',
    name: 'Saved household',
    description: null,
  },
}
function renderPage(
  receipt: CreatedPlaythrough | null = {
    id: 'run',
    householdName: 'Temporary name',
  },
) {
  return render(
    <MemoryRouter>
      <SetupContext.Provider
        value={{
          selectedId: 'persona',
          select: vi.fn(),
          createdPlaythrough: receipt,
          recordPlaythrough: vi.fn(),
        }}
      >
        <SimulationPage />
      </SetupContext.Provider>
    </MemoryRouter>,
  )
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(loadHouseholdExpenses).mockResolvedValue({
    source: 'definitions',
    items: [],
  })
  vi.mocked(loadPlaythrough).mockResolvedValue(loaded)
})
it('shows loading then the saved household, exact balance, day, and status', async () => {
  renderPage()
  expect(screen.getByRole('status')).toHaveTextContent(
    'Loading your playthrough',
  )
  expect(await screen.findByText('Saved household')).toBeInTheDocument()
  expect(screen.getByText('$350.25')).toBeInTheDocument()
  expect(screen.getByText('1')).toBeInTheDocument()
  expect(screen.getByText('Status: active')).toBeInTheDocument()
  expect(screen.queryByText('Temporary name')).not.toBeInTheDocument()
  expect(loadPlaythrough).toHaveBeenCalledExactlyOnceWith('run')
})
it('shows missing or inaccessible records without another request', async () => {
  vi.mocked(loadPlaythrough).mockResolvedValue(null)
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'missing or is not accessible',
  )
  expect(loadPlaythrough).toHaveBeenCalledOnce()
})
it('shows safe request failures without retrying', async () => {
  vi.mocked(loadPlaythrough).mockRejectedValue(new Error('private detail'))
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load your playthrough',
  )
  expect(screen.queryByText('private detail')).not.toBeInTheDocument()
  expect(loadPlaythrough).toHaveBeenCalledOnce()
})
it('renders null display fields as unavailable, not zero or a default stage', async () => {
  vi.mocked(loadPlaythrough).mockResolvedValue({
    ...loaded,
    persona: null,
    currentBalance: null,
    currentDay: null,
    status: null,
  })
  renderPage()
  expect(await screen.findByText('Current day unavailable')).toBeInTheDocument()
  expect(screen.getByText('Household unavailable')).toBeInTheDocument()
  expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent(
    'this content version is unavailable',
  )
})
it('makes no request without the retained UUID', () => {
  renderPage(null)
  expect(screen.getByText(/No newly created playthrough/)).toBeInTheDocument()
  expect(loadPlaythrough).not.toHaveBeenCalled()
})
