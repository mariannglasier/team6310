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
vi.mock('../../services/playthroughService', () => ({
  createIndividualPlaythrough: vi.fn().mockResolvedValue('new-run'),
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
          <Route path="/simulation" element={<p>Job search</p>} />
        </Routes>
        <Location />
      </MemoryRouter>
    </SetupProvider>,
  )
const radios = () =>
  screen.getAllByRole('button', { hidden: true, name: /^Choose / })

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
  expect(
    radios().some((radio) => radio.getAttribute('aria-pressed') === 'true'),
  ).toBe(false)
  expect(screen.getByText('$350.00')).toBeInTheDocument()
  expect(screen.getByText('$850.00', { selector: 'b' })).toBeInTheDocument()
  // Job selection belongs to Day 1, not this page.
  expect(contentService.loadJobs).not.toHaveBeenCalled()
  expect(screen.queryByText(/Fast Food/)).not.toBeInTheDocument()
  expect(screen.queryByText(/Prepare participant session/)).toBeNull()
  expect(ensureParticipantSession).not.toHaveBeenCalled()
  expect(screen.queryByRole('radio')).toBeNull()
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
  const next = screen.getByRole('button', { name: 'Start simulation' })
  expect(next).toBeDisabled()
  await user.click(screen.getByRole('button', { name: /^Choose Alex/ }))
  expect(screen.getByRole('button', { name: /^Choose Alex/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(next).toBeEnabled()
  expect(screen.queryByText(/CAC support/)).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/',
  )
  await user.click(next)
  expect(screen.getByLabelText('Current path')).toHaveTextContent('/simulation')
})

it('moves between households with arrows, dots, and keyboard while keeping focus', async () => {
  const user = userEvent.setup()
  renderPage()
  await screen.findByText('Finding His Footing')
  expect(screen.getByRole('button', { name: /^Choose Alex/ })).toBeEnabled()
  await user.click(screen.getByRole('button', { name: 'Show next household' }))
  expect(screen.getByRole('button', { name: /^Choose Jordan/ })).toBeEnabled()
  expect(
    radios().filter((radio) => (radio as HTMLButtonElement).tabIndex === 0),
  ).toHaveLength(1)

  await user.click(screen.getByRole('button', { name: 'Show Sofia' }))
  const sofia = screen.getByRole('button', { name: /^Choose Sofia/ })
  expect(sofia).toBeEnabled()
  sofia.focus()
  await user.keyboard('{ArrowRight}')
  // Wraps to the first household and the new radio keeps keyboard focus.
  const alex = screen.getByRole('button', { name: /^Choose Alex/ })
  expect(alex).toBeEnabled()
  expect(alex).toHaveFocus()
  await user.keyboard('{ArrowLeft}')
  expect(screen.getByRole('button', { name: /^Choose Sofia/ })).toHaveFocus()
  // Moving never selects.
  expect(
    radios().some((radio) => radio.getAttribute('aria-pressed') === 'true'),
  ).toBe(false)
})

it('selects a household that was brought to the center by clicking its neighbour', async () => {
  const user = userEvent.setup()
  renderPage()
  const jordan = (await screen.findAllByText('Jordan & Maya'))[0]
  await user.click(jordan)
  expect(screen.getByRole('button', { name: /^Choose Jordan/ })).toBeEnabled()
  expect(
    radios().some((radio) => radio.getAttribute('aria-pressed') === 'true'),
  ).toBe(false)
  await user.click(screen.getByRole('button', { name: /^Choose Jordan/ }))
  const selected = screen.getByRole('button', { name: /^Choose Jordan/ })
  expect(selected).toHaveAttribute('aria-pressed', 'true')
  expect(within(selected).getByText('Selected')).toBeInTheDocument()
})

it('shows a safe error with retry when households cannot load', async () => {
  vi.mocked(contentService.loadHouseholds)
    .mockRejectedValueOnce(new ContentUnavailableError())
    .mockResolvedValueOnce(households)
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load households and jobs',
  )
  expect(
    screen.getByRole('button', { name: 'Start simulation' }),
  ).toBeDisabled()
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
