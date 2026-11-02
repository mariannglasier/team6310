import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import { ReviewPage } from './ReviewPage'
import { IndividualPage } from './SimulationPages'
import { EmploymentPage } from './EmploymentPage'
import {
  contentService,
  ContentUnavailableError,
} from '../../services/contentService'
import { simulationService } from '../../services/simulationService'
import { SetupProvider } from '../../state/SetupProvider'
import {
  usdCents,
  type Job,
  type PublishedHouseholds,
} from '../../types/domain'

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
  hasEnglishSkills: false,
  hasComputerSkills: false,
})
const households: PublishedHouseholds = {
  versionId: 'v1',
  versionNumber: 1,
  personas: [
    persona('p1', 'Alex', 'Finding His Footing', 35000),
    persona('p2', 'Jordan & Maya', 'A Parent Rebuilding', 85000),
  ],
}
const jobs: Job[] = ['Target job', 'Fallback job'].map((title, index) => ({
  id: `j${index}`,
  versionId: 'v1',
  title,
  socCode: '00-0000',
  description: null,
  hoursPerWeek: 40,
  medianHourlyWage: usdCents(1000),
  weeklyGrossIncome: usdCents(40000),
  wageYear: 2025,
  areaName: 'Test area',
  wageSourceUrl: 'https://www.bls.gov/',
  requirementsNote: null,
  needsEnglishSkills: false,
  needsComputerSkills: false,
}))

function Location() {
  return <span aria-label="Current path">{useLocation().pathname}</span>
}
const renderFlow = (path = '/simulation/individual') =>
  render(
    <SetupProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/simulation/individual" element={<IndividualPage />} />
          <Route path="/simulation/review" element={<ReviewPage />} />
          <Route path="/simulation/play" element={<EmploymentPage />} />
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
  vi.mocked(contentService.loadHouseholds).mockResolvedValue(households)
  vi.mocked(contentService.loadJobs).mockResolvedValue(jobs)
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
  expect(
    screen.getByText(/first walkthrough is without CAC support/),
  ).toBeInTheDocument()
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
  await user.click(
    await screen.findByRole('link', { name: 'Change household' }),
  )
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/simulation/individual',
  )
})

it('confirmation loads pinned jobs and starts a local walkthrough without creating a backend run', async () => {
  const user = userEvent.setup()
  const start = vi.spyOn(simulationService, 'start')
  renderFlow()
  await chooseCenter(user)
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  const confirm = await screen.findByRole('button', {
    name: 'Confirm selection',
  })
  expect(screen.getByRole('status')).toBeEmptyDOMElement()
  await user.click(confirm)
  expect(
    await screen.findByRole('group', { name: 'Job bulletin board' }),
  ).toBeInTheDocument()
  expect(contentService.loadJobs).toHaveBeenCalledWith('v1')
  expect(start).not.toHaveBeenCalled()
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/simulation/play',
  )
})

it.each([
  [[], /No approved jobs/],
  [
    jobs.map((job) => ({ ...job, needsEnglishSkills: null })),
    /at least two jobs/,
  ],
  [jobs.map((job) => ({ ...job, versionId: 'v2' })), /does not match/],
])(
  'does not start with missing or incompatible job content',
  async (catalog, message) => {
    vi.mocked(contentService.loadJobs).mockResolvedValue(catalog)
    const user = userEvent.setup()
    renderFlow()
    await chooseCenter(user)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(
      await screen.findByRole('button', { name: 'Confirm selection' }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(message)
    expect(screen.getByLabelText('Current path')).toHaveTextContent(
      '/simulation/review',
    )
  },
)

it('allows retry after a failed jobs request without fabricating a walkthrough', async () => {
  vi.mocked(contentService.loadJobs)
    .mockRejectedValueOnce(new ContentUnavailableError())
    .mockResolvedValueOnce(jobs)
  const user = userEvent.setup()
  renderFlow()
  await chooseCenter(user)
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.click(
    await screen.findByRole('button', { name: 'Confirm selection' }),
  )
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Unable to load households and jobs',
  )
  await user.click(screen.getByRole('button', { name: 'Confirm selection' }))
  expect(
    await screen.findByRole('group', { name: 'Job bulletin board' }),
  ).toBeInTheDocument()
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
