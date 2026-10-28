import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import { IndividualPage } from './SimulationPages'
import { SetupProvider } from '../../state/SetupProvider'
import {
  contentService,
  ContentUnavailableError,
} from '../../services/contentService'
import { ensureParticipantSession } from '../../services/participantSession'
import { usdCents, type PublishedHouseholds } from '../../types/domain'

vi.mock('../../services/contentService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/contentService')>()),
  contentService: { loadHouseholds: vi.fn(), loadJobs: vi.fn() },
}))
vi.mock('../../services/participantSession', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../services/participantSession')
  >()),
  ensureParticipantSession: vi.fn(),
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
    persona('p3', 'Patricia', 'Starting Over', 120000),
    persona('p4', 'Sofia', 'Years of Experience', 60000),
  ],
}

function Location() {
  return <span aria-label="Current path">{useLocation().pathname}</span>
}
const renderPage = () =>
  render(
    <SetupProvider>
      <MemoryRouter initialEntries={['/simulation/individual']}>
        <Routes>
          <Route path="/simulation/individual" element={<IndividualPage />} />
          <Route path="/simulation/review" element={<p>Review page</p>} />
        </Routes>
        <Location />
      </MemoryRouter>
    </SetupProvider>,
  )
const radios = () => screen.getAllByRole('radio', { hidden: true })

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(contentService.loadHouseholds).mockResolvedValue(households)
})

it('shows approved households with no default selection and no jobs, without starting a run', async () => {
  renderPage()
  expect(
    screen.getByRole('heading', { name: 'Every household has a story.' }),
  ).toBeInTheDocument()
  expect(await screen.findByText('Finding His Footing')).toBeInTheDocument()
  expect(radios()).toHaveLength(4)
  expect(radios().some((radio) => (radio as HTMLInputElement).checked)).toBe(
    false,
  )
  expect(screen.getByText('$350.00')).toBeInTheDocument()
  expect(screen.getByText('$850.00', { selector: 'b' })).toBeInTheDocument()
  // Job selection belongs to Day 1, not this page.
  expect(contentService.loadJobs).not.toHaveBeenCalled()
  expect(screen.queryByText(/Fast Food/)).not.toBeInTheDocument()
  expect(screen.queryByText(/Prepare participant session/)).toBeNull()
  expect(ensureParticipantSession).not.toHaveBeenCalled()
  expect(screen.getByRole('list', { name: 'Setup step 1 of 2' })).toBeVisible()
})

it('renders an illustrated avatar for each household', async () => {
  const { container } = renderPage()
  await screen.findByText('Finding His Footing')
  for (const key of ['alex', 'jordan', 'patricia', 'sofia'])
    expect(container.querySelector(`.persona-avatar--${key}`)).not.toBeNull()
  expect(container.querySelector('.persona-avatar--generic')).toBeNull()
  // Decorative artwork is hidden from assistive technology.
  expect(
    container.querySelector('.persona-avatar')?.getAttribute('aria-hidden'),
  ).toBe('true')
})

it('keeps Continue disabled until a household is chosen, then opens Review without a support step', async () => {
  const user = userEvent.setup()
  renderPage()
  await screen.findByText('Finding His Footing')
  const next = screen.getByRole('button', { name: 'Continue' })
  expect(next).toBeDisabled()
  await user.click(screen.getByRole('radio', { name: /Alex/ }))
  expect(screen.getByRole('radio', { name: /Alex/ })).toBeChecked()
  expect(next).toBeEnabled()
  expect(screen.queryByText(/CAC support/)).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/',
  )
  await user.click(next)
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/simulation/review',
  )
  expect(screen.getByText('Review page')).toBeInTheDocument()
})

it('moves between households with arrows, dots, and keyboard while keeping focus', async () => {
  const user = userEvent.setup()
  renderPage()
  await screen.findByText('Finding His Footing')
  expect(screen.getByRole('radio', { name: /Alex/ })).toBeEnabled()
  await user.click(screen.getByRole('button', { name: 'Show next household' }))
  expect(screen.getByRole('radio', { name: /Jordan/ })).toBeEnabled()
  expect(
    radios().filter((radio) => !(radio as HTMLInputElement).disabled),
  ).toHaveLength(1)

  await user.click(screen.getByRole('button', { name: 'Show Sofia' }))
  const sofia = screen.getByRole('radio', { name: /Sofia/ })
  expect(sofia).toBeEnabled()
  sofia.focus()
  await user.keyboard('{ArrowRight}')
  // Wraps to the first household and the new radio keeps keyboard focus.
  const alex = screen.getByRole('radio', { name: /Alex/ })
  expect(alex).toBeEnabled()
  expect(alex).toHaveFocus()
  await user.keyboard('{ArrowLeft}')
  expect(screen.getByRole('radio', { name: /Sofia/ })).toHaveFocus()
  // Moving never selects.
  expect(radios().some((radio) => (radio as HTMLInputElement).checked)).toBe(
    false,
  )
})

it('selects a household that was brought to the center by clicking its neighbour', async () => {
  const user = userEvent.setup()
  renderPage()
  const jordan = (await screen.findAllByText('Jordan & Maya'))[0]
  await user.click(jordan)
  expect(screen.getByRole('radio', { name: /Jordan/ })).toBeEnabled()
  expect(radios().some((radio) => (radio as HTMLInputElement).checked)).toBe(
    false,
  )
  await user.click(screen.getByRole('radio', { name: /Jordan/ }))
  const selected = screen.getByRole('radio', { name: /Jordan/ })
  expect(selected).toBeChecked()
  expect(
    within(selected.closest('label') as HTMLElement).getByText('Selected'),
  ).toBeInTheDocument()
})

it('shows a safe error with retry when households cannot load', async () => {
  vi.mocked(contentService.loadHouseholds)
    .mockRejectedValueOnce(new ContentUnavailableError())
    .mockResolvedValueOnce(households)
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load approved content',
  )
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  await userEvent.click(
    screen.getByRole('button', { name: 'Retry loading households' }),
  )
  expect(await screen.findByText('Finding His Footing')).toBeInTheDocument()
})

it('explains when nothing has been published', async () => {
  vi.mocked(contentService.loadHouseholds).mockResolvedValue(null)
  renderPage()
  expect(
    await screen.findByText(/No households have been published yet/),
  ).toBeInTheDocument()
})
