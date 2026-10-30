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
import {
  contentService,
  ContentUnavailableError,
} from '../../services/contentService'
import { createIndividualPlaythrough } from '../../services/playthroughService'
import { SimulationPage } from './SimulationPage'
import { loadPlaythrough } from '../../services/loadPlaythrough'

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

it('returns to household selection when nothing has been chosen', async () => {
  renderFlow('/simulation/review')
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/simulation/individual',
  )
  expect(
    screen.getByRole('heading', { name: 'Every household has a story.' }),
  ).toBeInTheDocument()
})

it('summarizes the chosen household and starting money without a support step', async () => {
  const user = userEvent.setup()
  renderFlow()
  await chooseCenter(user)
  await user.click(screen.getByRole('button', { name: 'Continue' }))

  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/simulation/review',
  )
  expect(
    screen.getByRole('heading', { level: 1, name: 'Review your setup.' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('list', { name: 'Setup step 2 of 2' }),
  ).toBeInTheDocument()
  const profile = within(await screen.findByRole('region', { name: 'Alex' }))
  expect(profile.getByText('Finding His Footing')).toBeInTheDocument()
  expect(profile.getByText('Available starting balance')).toBeInTheDocument()
  expect(profile.getByText('$350.00')).toBeInTheDocument()
  expect(profile.getByText(/Alex is looking for work/)).toBeInTheDocument()
  expect(screen.getByText('Household selected')).toBeInTheDocument()
  expect(
    screen.getByRole('heading', {
      name: 'Your first day starts with a choice.',
    }),
  ).toBeInTheDocument()
  expect(screen.queryByText(/CAC support/)).not.toBeInTheDocument()
})

it('lets the player change the household and keeps the selection', async () => {
  const user = userEvent.setup()
  renderFlow()
  await chooseCenter(user)
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.click(
    await screen.findByRole('link', { name: 'Change household' }),
  )

  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/simulation/individual',
  )
  expect(await screen.findByRole('radio', { name: /Alex/ })).toBeChecked()
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.click(await screen.findByRole('link', { name: 'Back' }))
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/simulation/individual',
  )
})

it('creates the selected household, retains its ID, and opens the placeholder', async () => {
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
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  expect(createIndividualPlaythrough).not.toHaveBeenCalled()
  await user.dblClick(
    await screen.findByRole('button', { name: 'Confirm selection' }),
  )
  expect(createIndividualPlaythrough).toHaveBeenCalledExactlyOnceWith('p1')
  expect(
    screen.getByRole('button', { name: 'Creating playthrough…' }),
  ).toBeDisabled()
  expect(
    screen.queryByText(/Your playthrough was created/),
  ).not.toBeInTheDocument()
  complete('created-run-id')
  expect(
    await screen.findByText('Your playthrough has been loaded.'),
  ).toBeInTheDocument()
  expect(screen.getByText('Playthrough ID: created-run-id')).toBeInTheDocument()
  expect(screen.getByLabelText('Current path')).toHaveTextContent('/simulation')
  await user.click(screen.getByRole('button', { name: 'Revisit Review' }))
  expect(
    await screen.findByText('Your playthrough has been loaded.'),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Revisit Household' }))
  expect(
    await screen.findByText('Playthrough ID: created-run-id'),
  ).toBeInTheDocument()
  expect(createIndividualPlaythrough).toHaveBeenCalledOnce()
})

it('preserves the household after failure and allows retry', async () => {
  const user = userEvent.setup()
  vi.mocked(createIndividualPlaythrough)
    .mockRejectedValueOnce(new Error('Unable to confirm creation.'))
    .mockResolvedValueOnce('retry-run-id')
  renderFlow()
  await chooseCenter(user)
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.click(
    await screen.findByRole('button', { name: 'Confirm selection' }),
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to confirm creation.',
  )
  expect(screen.getByRole('region', { name: 'Alex' })).toBeInTheDocument()
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/simulation/review',
  )
  await user.click(screen.getByRole('button', { name: 'Confirm selection' }))
  expect(
    await screen.findByText('Your playthrough has been loaded.'),
  ).toBeInTheDocument()
  expect(createIndividualPlaythrough).toHaveBeenNthCalledWith(2, 'p1')
})

it('does not claim creation on direct entry to the placeholder', () => {
  renderFlow('/simulation')
  expect(screen.getByText(/No newly created playthrough/)).toBeInTheDocument()
  expect(createIndividualPlaythrough).not.toHaveBeenCalled()
})

it('shows a safe error with retry when households cannot load on Review', async () => {
  const user = userEvent.setup()
  renderFlow()
  await chooseCenter(user)
  vi.mocked(contentService.loadHouseholds)
    .mockRejectedValueOnce(new ContentUnavailableError())
    .mockResolvedValueOnce(households)
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load households and jobs',
  )
  expect(
    screen.getByRole('button', { name: 'Confirm selection' }),
  ).toBeDisabled()
  await user.click(
    screen.getByRole('button', { name: 'Retry loading households' }),
  )
  expect(
    await screen.findByRole('region', { name: 'Alex' }),
  ).toBeInTheDocument()
})

it('explains when the selected household is no longer published', async () => {
  const user = userEvent.setup()
  renderFlow()
  await chooseCenter(user)
  vi.mocked(contentService.loadHouseholds).mockResolvedValue({
    ...households,
    personas: [households.personas[1]],
  })
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  expect(
    await screen.findByText(/selected household is no longer available/),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Confirm selection' }),
  ).toBeDisabled()
})
