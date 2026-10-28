import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import { ReviewPage } from './ReviewPage'
import { IndividualPage } from './SimulationPages'
import {
  contentService,
  ContentUnavailableError,
} from '../../services/contentService'
import { simulationService } from '../../services/simulationService'
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
  return <span aria-label="Current path">{useLocation().pathname}</span>
}
const renderFlow = (path = '/simulation/individual') =>
  render(
    <SetupProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/simulation/individual" element={<IndividualPage />} />
          <Route path="/simulation/review" element={<ReviewPage />} />
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
  await user.click(await screen.findByRole('link', { name: 'Household' }))
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/simulation/individual',
  )
})

it('confirming reports that no run exists yet and does not call the backend', async () => {
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
  expect(screen.getByRole('status')).toHaveTextContent(
    /not available yet. No simulation run has been created/,
  )
  expect(start).not.toHaveBeenCalled()
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/simulation/review',
  )
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
    'Unable to load approved content',
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
