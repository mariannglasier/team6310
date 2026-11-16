import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { SetupProvider } from '../../state/SetupProvider'
import { useSetup } from '../../state/setupContext'
import { AppLayout } from '../../layouts/AppLayout'
import { EmploymentPanel } from './EmploymentPanel'
import { IndividualPage } from './SimulationPages'
import { loadPlaythrough } from '../../services/loadPlaythrough'
import { getSupabaseClient } from '../../services/supabase'
import { createIndividualPlaythrough } from '../../services/playthroughService'
import * as gameplay from '../../services/employmentGameplay'
import { contentService } from '../../services/contentService'
import { createWalkthrough } from '../../state/employmentWalkthrough'
import type { LoadedPlaythrough } from '../../types/playthrough'
import { usdCents } from '../../types/domain'

vi.mock('../../services/supabase', () => ({ getSupabaseClient: vi.fn() }))
vi.mock('../../services/loadPlaythrough', () => ({ loadPlaythrough: vi.fn() }))
vi.mock('../../services/playthroughService', () => ({
  createIndividualPlaythrough: vi.fn(),
}))
vi.mock('../../services/employmentGameplay', async (original) => ({
  ...(await original<typeof import('../../services/employmentGameplay')>()),
  employmentSnapshot: vi.fn(),
  hasPending: vi.fn(),
  submitEmployment: vi.fn(),
}))
vi.mock('../../components/simulation/ScenarioFacts', () => ({
  ScenarioFacts: () => null,
}))
vi.mock('../../services/contentService', async (original) => ({
  ...(await original<typeof import('../../services/contentService')>()),
  contentService: { loadHouseholds: vi.fn() },
}))
const persona = {
  id: 'persona',
  versionId: 'edition',
  name: 'Alex',
  description: '',
  startingBalance: usdCents(10000),
  hasEnglishSkills: false,
  hasComputerSkills: false,
}
const base = createWalkthrough(persona, [], false, usdCents(6000))
const locator = 'cac-employment-v1:owner:run'
const replayLocator = 'cac-employment-v1:owner:replay'
const rpc = vi.fn(),
  signOut = vi.fn()
let run: LoadedPlaythrough
function SelectedRun() {
  const setup = useSetup()
  return (
    <>
      <output aria-label="Selected run">
        {setup.createdPlaythrough?.id ?? 'none'}
      </output>
      <output aria-label="Replay source">{setup.replayOf ?? 'none'}</output>
      <output aria-label="Current path">{useLocation().pathname}</output>
      <button
        onClick={() =>
          setup.recordPlaythrough({ id: run.id, householdName: 'Alex' })
        }
      >
        Select existing run
      </button>
    </>
  )
}
function Gameplay() {
  const { createdPlaythrough } = useSetup()
  return createdPlaythrough ? (
    <EmploymentPanel run={run} onCommit={vi.fn()} />
  ) : null
}
function show(path = '/simulation') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SetupProvider>
        <SelectedRun />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<h1>Home</h1>} />
            <Route path="/simulation" element={<Gameplay />} />
            <Route path="/simulation/individual" element={<IndividualPage />} />
          </Route>
        </Routes>
      </SetupProvider>
    </MemoryRouter>,
  )
}
beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  localStorage.setItem(locator, 'run')
  localStorage.setItem('cac-employment-v1:another:run', 'other-run')
  localStorage.setItem('cac-employment-v1:another:replay', 'other-source')
  localStorage.setItem('cac-employment-v1:owner:pending:run', 'pending-receipt')
  localStorage.setItem('auth-session', 'preserved')
  run = {
    id: 'run',
    personaId: persona.id,
    versionId: persona.versionId,
    ownerUserId: 'owner',
    currentDay: 30,
    currentScenarioId: null,
    currentBalance: usdCents(10000),
    status: 'completed',
    sessionId: null,
    currentJobId: null,
    supportEnabled: false,
    startedAt: null,
    employmentState: {},
    persona,
  }
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
  vi.mocked(loadPlaythrough).mockImplementation(async () => run)
  vi.mocked(gameplay.hasPending).mockResolvedValue(false)
  vi.mocked(gameplay.employmentSnapshot).mockImplementation(async (r) => ({
    run: r,
    revision: 1,
    state: {
      ...base,
      day: r.currentDay!,
      stage:
        r.status === 'completed'
          ? 'complete'
          : r.status === 'ended'
            ? 'ended'
            : 'board',
    },
  }))
  vi.mocked(contentService.loadHouseholds).mockResolvedValue({
    versionId: 'edition',
    versionNumber: 1,
    personas: [persona],
  })
})
afterEach(() => vi.restoreAllMocks())
function expectPreservedRecords() {
  expect(localStorage.getItem('cac-employment-v1:another:run')).toBe(
    'other-run',
  )
  expect(localStorage.getItem('auth-session')).toBe('preserved')
  expect(localStorage.getItem('cac-employment-v1:another:replay')).toBe(
    'other-source',
  )
  expect(localStorage.getItem('cac-employment-v1:owner:pending:run')).toBe(
    'pending-receipt',
  )
  expect(rpc).not.toHaveBeenCalled()
  expect(signOut).not.toHaveBeenCalled()
  expect(gameplay.submitEmployment).not.toHaveBeenCalled()
}

it.each(['CAC Poverty Simulation', 'Return to landing page'])(
  'preserves an active run through %s and refresh',
  async (logo) => {
    run = { ...run, status: 'active', currentDay: 1 }
    const page = show()
    await waitFor(() =>
      expect(screen.getByLabelText('Selected run')).toHaveTextContent('run'),
    )
    await userEvent.click(screen.getByRole('link', { name: logo }))
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeVisible()
    expect(screen.getByLabelText('Selected run')).toHaveTextContent('run')
    expect(localStorage.getItem(locator)).toBe('run')
    page.unmount()
    show('/simulation/individual')
    await waitFor(() =>
      expect(screen.getByLabelText('Current path')).toHaveTextContent(
        '/simulation',
      ),
    )
    expect(screen.getByLabelText('Selected run')).toHaveTextContent('run')
    expectPreservedRecords()
  },
)
it.each([
  ['completed', 'CAC Poverty Simulation'],
  ['ended', 'CAC Poverty Simulation'],
  ['completed', 'Return to landing page'],
  ['ended', 'Return to landing page'],
])(
  'cleans a %s run through %s before navigating home',
  async (status, logo) => {
    run = { ...run, status }
    const page = show()
    await waitFor(() =>
      expect(screen.getByLabelText('Selected run')).toHaveTextContent('run'),
    )
    expect(screen.queryByRole('link', { name: 'Return home' })).toBeNull()
    await userEvent.click(screen.getByRole('link', { name: logo }))
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeVisible()
    expect(screen.getByLabelText('Selected run')).toHaveTextContent('none')
    expect(localStorage.getItem(locator)).toBeNull()
    page.unmount()
    show('/simulation/individual')
    expect(
      await screen.findByRole('heading', {
        name: 'Every household has a story.',
      }),
    ).toBeVisible()
    expect(screen.getByLabelText('Selected run')).toHaveTextContent('none')
    expect(createIndividualPlaythrough).not.toHaveBeenCalled()
    expectPreservedRecords()
  },
)
it('keeps the terminal run selected on cleanup failure and allows retry with either logo', async () => {
  show()
  await screen.findByRole('button', { name: 'Replay from household selection' })
  const removal = vi
    .spyOn(Storage.prototype, 'removeItem')
    .mockImplementationOnce(() => {
      throw new Error('blocked')
    })
  await userEvent.click(
    screen.getByRole('link', { name: 'CAC Poverty Simulation' }),
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Try the CAC logo again',
  )
  expect(screen.getByLabelText('Current path')).toHaveTextContent('/simulation')
  expect(screen.getByLabelText('Selected run')).toHaveTextContent('run')
  expect(localStorage.getItem(locator)).toBe('run')
  removal.mockRestore()
  await userEvent.click(
    screen.getByRole('link', { name: 'Return to landing page' }),
  )
  expect(await screen.findByRole('heading', { name: 'Home' })).toBeVisible()
  expectPreservedRecords()
})
it('does not navigate until status verification and cleanup complete', async () => {
  let resolve!: (value: LoadedPlaythrough) => void
  vi.mocked(loadPlaythrough).mockReturnValue(
    new Promise((done) => {
      resolve = done
    }),
  )
  show()
  await screen.findByRole('button', { name: 'Replay from household selection' })
  await userEvent.click(
    screen.getByRole('link', { name: 'CAC Poverty Simulation' }),
  )
  expect(screen.getByLabelText('Current path')).toHaveTextContent('/simulation')
  expect(localStorage.getItem(locator)).toBe('run')
  await act(async () => resolve(run))
  expect(await screen.findByRole('heading', { name: 'Home' })).toBeVisible()
  expect(localStorage.getItem(locator)).toBeNull()
})
it.each([false, true])(
  'clears the old locator and preserves CAC replay=%s across refresh until confirmation',
  async (support) => {
    const page = show()
    await userEvent.click(
      await screen.findByRole('button', {
        name: support
          ? 'Try again with CAC support'
          : 'Replay from household selection',
      }),
    )
    expect(
      await screen.findByRole('heading', {
        name: 'Every household has a story.',
      }),
    ).toBeVisible()
    expect(localStorage.getItem(locator)).toBeNull()
    expect(localStorage.getItem(replayLocator)).toBe(support ? 'run' : null)
    expect(createIndividualPlaythrough).not.toHaveBeenCalled()
    page.unmount()
    show('/simulation/individual')
    await waitFor(() =>
      expect(screen.getByLabelText('Replay source')).toHaveTextContent(
        support ? 'run' : 'none',
      ),
    )
    expect(screen.getByLabelText('Selected run')).toHaveTextContent('none')
    await userEvent.click(
      await screen.findByRole('button', { name: /^Choose Alex/ }),
    )
    expect(createIndividualPlaythrough).not.toHaveBeenCalled()
    vi.mocked(createIndividualPlaythrough).mockResolvedValue('new-run')
    await userEvent.click(
      screen.getByRole('button', { name: 'Start simulation' }),
    )
    expect(createIndividualPlaythrough).toHaveBeenCalledExactlyOnceWith(
      'persona',
    )
    expectPreservedRecords()
  },
)
it('invalidates pending restoration when replay clears a selected run', async () => {
  let restore!: (id: string) => void
  vi.spyOn(gameplay, 'rememberedRun').mockReturnValue(
    new Promise((done) => {
      restore = done
    }),
  )
  show()
  await userEvent.click(
    screen.getByRole('button', { name: 'Select existing run' }),
  )
  await userEvent.click(
    await screen.findByRole('button', {
      name: 'Replay from household selection',
    }),
  )
  expect(
    await screen.findByRole('heading', {
      name: 'Every household has a story.',
    }),
  ).toBeVisible()
  await act(async () => restore('run'))
  expect(screen.getByLabelText('Selected run')).toHaveTextContent('none')
  expect(localStorage.getItem(locator)).toBeNull()
  expect(createIndividualPlaythrough).not.toHaveBeenCalled()
})
it('preserves the terminal screen when replay cleanup fails', async () => {
  show()
  const replay = await screen.findByRole('button', {
    name: 'Replay from household selection',
  })
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  await userEvent.click(replay)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to prepare replay',
  )
  expect(screen.getByLabelText('Current path')).toHaveTextContent('/simulation')
  expect(screen.getByLabelText('Selected run')).toHaveTextContent('run')
  expect(localStorage.getItem(locator)).toBe('run')
  expectPreservedRecords()
})
it('waits for a pending locator save before removing the old selection', async () => {
  let finishSave!: () => void
  vi.spyOn(gameplay, 'rememberRun').mockImplementation(
    (id) =>
      new Promise<void>((done) => {
        finishSave = () => {
          localStorage.setItem(locator, id)
          done()
        }
      }),
  )
  show()
  await screen.findByRole('button', { name: 'Replay from household selection' })
  await userEvent.click(
    screen.getByRole('button', { name: 'Select existing run' }),
  )
  await userEvent.click(
    screen.getByRole('link', { name: 'CAC Poverty Simulation' }),
  )
  expect(screen.getByLabelText('Current path')).toHaveTextContent('/simulation')
  await act(async () => finishSave())
  expect(await screen.findByRole('heading', { name: 'Home' })).toBeVisible()
  expect(localStorage.getItem(locator)).toBeNull()
})
it('preserves navigation and selection when the saved status cannot be verified', async () => {
  vi.mocked(loadPlaythrough).mockRejectedValue(new Error('offline'))
  show()
  await screen.findByRole('button', { name: 'Replay from household selection' })
  await userEvent.click(
    screen.getByRole('link', { name: 'CAC Poverty Simulation' }),
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to return home',
  )
  expect(screen.getByLabelText('Current path')).toHaveTextContent('/simulation')
  expect(screen.getByLabelText('Selected run')).toHaveTextContent('run')
  expect(localStorage.getItem(locator)).toBe('run')
  expectPreservedRecords()
})
it('waits for pending restoration before deciding whether home navigation needs cleanup', async () => {
  let finishRestore!: (id: string) => void
  vi.spyOn(gameplay, 'rememberedRun').mockReturnValue(
    new Promise((done) => {
      finishRestore = done
    }),
  )
  show()
  await userEvent.click(
    screen.getByRole('link', { name: 'CAC Poverty Simulation' }),
  )
  expect(screen.getByLabelText('Current path')).toHaveTextContent('/simulation')
  await act(async () => finishRestore('run'))
  expect(await screen.findByRole('heading', { name: 'Home' })).toBeVisible()
  expect(localStorage.getItem(locator)).toBeNull()
  expect(screen.getByLabelText('Selected run')).toHaveTextContent('none')
})
it('waits for replay intent restoration before allowing household confirmation', async () => {
  localStorage.removeItem(locator)
  let finishRestore!: (id: string) => void
  vi.spyOn(gameplay, 'rememberedReplay').mockReturnValue(
    new Promise((done) => {
      finishRestore = done
    }),
  )
  show('/simulation/individual')
  const household = await screen.findByRole('button', { name: /^Choose Alex/ })
  expect(household).toBeDisabled()
  expect(
    screen.getByRole('button', { name: 'Start simulation' }),
  ).toBeDisabled()
  await act(async () => finishRestore('run'))
  expect(screen.getByLabelText('Replay source')).toHaveTextContent('run')
  expect(household).toBeEnabled()
  expect(createIndividualPlaythrough).not.toHaveBeenCalled()
})
