import { loadBillSnapshot } from '../../services/billGameplay'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import { ReviewPage } from './ReviewPage'
import { IndividualPage } from './SimulationPages'
import { contentService } from '../../services/contentService'
import { createIndividualPlaythrough } from '../../services/playthroughService'
import { SimulationPage } from './SimulationPage'
import { loadPlaythrough } from '../../services/loadPlaythrough'

vi.mock('../../services/billGameplay', async (original) => ({
  ...(await original<typeof import('../../services/billGameplay')>()),
  loadBillSnapshot: vi.fn(),
}))

vi.mock('../../services/loadPlaythrough', () => ({ loadPlaythrough: vi.fn() }))

vi.mock('../../services/playthroughService', () => ({
  createIndividualPlaythrough: vi.fn(),
}))
import { SetupProvider } from '../../state/SetupProvider'
import { usdCents, type PublishedHouseholds } from '../../types/domain'

vi.mock('../../services/contentService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/contentService')>()),
  contentService: { loadHouseholds: vi.fn(), loadJobs: vi.fn() },
}))

const persona = (id: string, name: string, tagline: string, cents: number) => ({
  id,
  versionId: 'v1',
  name,
  description: `${name} — ${tagline}. Age 30; single. ${name} is looking for work.`,
  startingBalance: usdCents(cents),
})
const households: PublishedHouseholds = {
  versionId: 'v1',
  versionNumber: 1,
  personas: [
    persona('p1', 'Alex', 'Finding His Footing', 35000),
    persona('p2', 'Jordan & Maya', 'A Parent Rebuilding', 85000),
  ],
}

function Location() {
  const navigate = useNavigate()
  return (
    <>
      <span aria-label="Current path">{useLocation().pathname}</span>
      <button onClick={() => navigate('/simulation/review')}>
        Revisit Review
      </button>
      <button onClick={() => navigate('/simulation/individual')}>
        Revisit Household
      </button>
    </>
  )
}
const renderFlow = (path = '/simulation/individual') =>
  render(
    <SetupProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/simulation/individual" element={<IndividualPage />} />
          <Route path="/simulation/review" element={<ReviewPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
        </Routes>
        <Location />
      </MemoryRouter>
    </SetupProvider>,
  )
const chooseCenter = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    within(
      (await screen.findAllByRole('group', { name: /1 of 2/ }))[0],
    ).getByText('Choose this household'),
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(loadBillSnapshot).mockImplementation(async (run) => ({
    run,
    items: [],
    paidTotal: usdCents(0),
    overdueTotal: usdCents(0),
    outstandingTotal: usdCents(0),
    upcomingTotal: usdCents(0),
    scenarioIncome: usdCents(0),
    scenarioCharged: usdCents(0),
  }))
  vi.mocked(loadPlaythrough).mockImplementation(async (id) => ({
    id,
    personaId: 'p1',
    versionId: 'v1',
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
    persona: { id: 'p1', versionId: 'v1', name: 'Alex', description: null },
  }))
  vi.mocked(contentService.loadHouseholds).mockResolvedValue(households)
})

it('redirects legacy Review bookmarks to household selection without creating a run', async () => {
  renderFlow('/simulation/review')
  expect(
    await screen.findByRole('heading', {
      name: 'Every household has a story.',
    }),
  ).toBeVisible()
  expect(createIndividualPlaythrough).not.toHaveBeenCalled()
})

it('starts directly, prevents duplicate creation, and locks an active run on return', async () => {
  const user = userEvent.setup()
  let complete!: (id: string) => void
  vi.mocked(createIndividualPlaythrough).mockReturnValue(
    new Promise((resolve) => {
      complete = resolve
    }),
  )
  renderFlow()
  await chooseCenter(user)
  expect(createIndividualPlaythrough).not.toHaveBeenCalled()
  await user.dblClick(screen.getByRole('button', { name: 'Start simulation' }))
  expect(createIndividualPlaythrough).toHaveBeenCalledExactlyOnceWith('p1')
  expect(
    screen.getByRole('button', { name: 'Start simulation' }),
  ).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Choose Alex' })).toBeDisabled()
  complete('created-run')
  expect(await screen.findByText('Day 1 of 30')).toBeInTheDocument()
  expect(screen.queryByText(/Playthrough ID:/)).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Revisit Review' }))
  expect(await screen.findByText('Day 1 of 30')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Revisit Household' }))
  expect(await screen.findByText('Day 1 of 30')).toBeInTheDocument()
  expect(createIndividualPlaythrough).toHaveBeenCalledOnce()
})

it('preserves selection after a creation error and allows explicit retry', async () => {
  const user = userEvent.setup()
  vi.mocked(createIndividualPlaythrough)
    .mockRejectedValueOnce(new Error('Creation failed'))
    .mockResolvedValueOnce('retry-run')
  renderFlow()
  await chooseCenter(user)
  await user.click(screen.getByRole('button', { name: 'Start simulation' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Creation failed')
  expect(screen.getByRole('button', { name: 'Choose Alex' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await user.click(screen.getByRole('button', { name: 'Start simulation' }))
  expect(await screen.findByText('Day 1 of 30')).toBeInTheDocument()
  expect(createIndividualPlaythrough).toHaveBeenCalledTimes(2)
})
