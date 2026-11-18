import { useReducer } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { expect, it, vi } from 'vitest'
import { EmploymentGame } from './EmploymentGame'
import {
  createWalkthrough,
  walkthroughReducer,
  type WalkthroughJob,
} from '../../state/employmentWalkthrough'
import { usdCents, type Persona } from '../../types/domain'
import { employmentSnapshot } from '../../services/employmentGameplay'
import { contentService } from '../../services/contentService'
import hostedDocument from '../../services/fixtures/hostedEmploymentDocument.json'

const persona: Persona = {
  id: 'p1',
  versionId: 'v1',
  name: 'Test household',
  description: 'Test',
  startingBalance: usdCents(10000),
  hasEnglishSkills: false,
  hasComputerSkills: false,
}
const jobs: WalkthroughJob[] = ['First job', 'Fallback job'].map((title) => ({
  job: {
    id: title,
    versionId: 'v1',
    socCode: '00-0000',
    title,
    description: null,
    hoursPerWeek: 40,
    medianHourlyWage: usdCents(100),
    weeklyGrossIncome: usdCents(4000),
    wageYear: 2025,
    areaName: 'Test area',
    wageSourceUrl: 'https://www.bls.gov/',
    requirementsNote: 'Test requirements',
    needsEnglishSkills: false,
    needsComputerSkills: false,
  },
}))
function Game({ replay }: { replay: (support: boolean) => void }) {
  const [state, dispatch] = useReducer(
    walkthroughReducer,
    createWalkthrough(persona, jobs, false, usdCents(6000)),
  )
  return (
    <>
      {/* This reducer-only harness acknowledges income without a bill service. */}
      {state.stage === 'income' && (
        <button onClick={() => dispatch({ type: 'continue' })}>Next</button>
      )}
      <EmploymentGame
        state={state}
        dispatch={dispatch}
        onReplay={replay}
        recapFacts={<aside>Employment context from the saved edition</aside>}
        allowPlaceholder={state.stage === 'day'}
      />
    </>
  )
}
it('uses the current day instead of a slogan in the browser tab', () => {
  const state = {
    ...createWalkthrough(persona, jobs, false, usdCents(6000)),
    stage: 'day' as const,
    day: 8,
  }
  render(<EmploymentGame state={state} dispatch={vi.fn()} onReplay={vi.fn()} />)
  expect(document.title).toBe('Day 8 | CAC Poverty Simulation')
  expect(document.title).not.toMatch(/one day at a time/i)
})
it('keeps unqualified jobs disabled and submits an eligible job from the keyboard', async () => {
  const user = userEvent.setup()
  const dispatch = vi.fn()
  const state = createWalkthrough(
    persona,
    [
      ...jobs,
      {
        job: {
          ...jobs[0].job,
          id: 'locked',
          title: 'Locked job',
          needsEnglishSkills: true,
        },
      },
    ],
    false,
    usdCents(6000),
  )
  render(
    <MemoryRouter>
      <EmploymentGame state={state} dispatch={dispatch} onReplay={vi.fn()} />
    </MemoryRouter>,
  )
  const locked = screen.getByRole('button', { name: 'Choose Locked job' })
  expect(locked).toBeDisabled()
  await user.click(locked)
  expect(dispatch).not.toHaveBeenCalled()
  screen.getByRole('button', { name: 'Choose First job' }).focus()
  await user.keyboard(' ')
  expect(dispatch).toHaveBeenCalledExactlyOnceWith({
    type: 'apply',
    jobId: 'First job',
  })
})
it('commits choices on activation, reapplies the same day and reaches Day 30', async () => {
  const user = userEvent.setup()
  const replay = vi.fn()
  render(
    <MemoryRouter>
      <Game replay={replay} />
    </MemoryRouter>,
  )
  expect(screen.getAllByRole('button', { name: /^Choose / })).toHaveLength(2)
  expect(screen.queryByRole('button', { name: 'End walkthrough' })).toBeNull()
  expect(
    screen.queryByRole('button', { name: 'Submit application' }),
  ).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Choose First job' }))
  expect(screen.getAllByRole('heading')[0]).toHaveTextContent(
    'Your application is in.',
  )
  expect(
    screen.getByText(/Employment context from the saved edition/),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Start Day 1' }))
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.click(
    screen.getByRole('button', { name: /Make my current clothes work/ }),
  )
  expect(screen.getAllByRole('heading')[0]).toHaveTextContent(
    'Your interview result.',
  )
  await user.click(screen.getByRole('button', { name: 'Search open jobs' }))
  expect(screen.getByText('Day 2 of 30 · Reapply')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Choose Fallback job' }))
  await user.click(screen.getByRole('button', { name: 'Continue to Day 3' }))
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.click(
    screen.getByRole('button', { name: /Make my current clothes work/ }),
  )
  expect(screen.getByText('Weekly pay: $40.00.')).toBeInTheDocument()
  expect(screen.queryByText(/First payday:/)).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Continue to Day 4' }))
  for (let day = 3; day <= 30; day++) {
    if ([10, 17, 24].includes(day)) {
      expect(screen.getAllByRole('heading')[0]).toHaveTextContent(
        'Your weekly pay has arrived.',
      )
      await user.click(screen.getByRole('button', { name: 'Next' }))
    }
    expect(screen.getByText('No more decisions today.')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', {
        name: day === 30 ? 'Finish Day 30' : 'Next',
      }),
    )
  }
  expect(screen.getAllByRole('heading')[0]).toHaveTextContent(
    'You reached Day 30.',
  )
  expect(screen.getByText('$220.00')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Return home' })).toBeNull()
  expect(
    screen.queryByRole('heading', { name: 'Employment and financial history' }),
  ).toBeNull()
  expect(
    screen.getByRole('button', { name: 'Play with CAC assistance' }),
  ).toBeEnabled()
  await user.click(
    screen.getByRole('button', { name: 'Replay from household selection' }),
  )
  expect(replay).toHaveBeenCalledWith(false)
}, 15000)

it('shows only a small loading status while a day transition is pending', () => {
  const state = {
    ...createWalkthrough(persona, jobs, false, usdCents(6000)),
    stage: 'day' as const,
    day: 8,
  }
  render(
    <EmploymentGame
      state={state}
      dispatch={vi.fn()}
      onReplay={vi.fn()}
      allowPlaceholder
      loading
    />,
  )
  expect(screen.getByRole('status')).toHaveTextContent('Loading…')
  expect(screen.queryByText('Placeholder')).toBeNull()
  expect(screen.queryByText(/have not been implemented/)).toBeNull()
  expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
})
it('shows missing jobs as an actionable blocking state', () => {
  const state = createWalkthrough(persona, [], false, usdCents(6000))
  render(
    <MemoryRouter>
      <EmploymentGame state={state} dispatch={vi.fn()} onReplay={vi.fn()} />
    </MemoryRouter>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('No eligible jobs')
  expect(
    screen.queryByRole('button', { name: 'Submit application' }),
  ).toBeNull()
})

it.each(['day', 'income'] as const)(
  'does not default to a placeholder during an unresolved %s stage',
  (stage) => {
    render(
      <MemoryRouter>
        <EmploymentGame
          state={{
            ...createWalkthrough(persona, jobs, false, usdCents(6000)),
            stage,
            day: 4,
          }}
          dispatch={vi.fn()}
          onReplay={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    expect(screen.queryByRole('heading', { name: 'Placeholder' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  },
)

it('displays the restored clothing price and uses exact cents for a purchase', async () => {
  const loadJobs = vi
    .spyOn(contentService, 'loadJobs')
    .mockResolvedValue(jobs.map(({ job }) => job))
  try {
    const snapshot = await employmentSnapshot({
      id: 'run',
      ownerUserId: 'owner',
      personaId: persona.id,
      versionId: persona.versionId,
      persona,
      currentDay: 2,
      currentBalance: usdCents(10000),
      currentScenarioId: null,
      currentJobId: null,
      sessionId: null,
      supportEnabled: false,
      status: 'active',
      startedAt: null,
      employmentState: {
        ...hostedDocument,
        stage: 'interview',
        targetId: jobs[0].job.id,
        initialTargetId: jobs[0].job.id,
        clothingCost: '83.27',
      },
    })
    if (!snapshot.state) throw new Error('Expected restored employment')
    const dispatch = vi.fn()
    render(
      <MemoryRouter>
        <EmploymentGame
          state={snapshot.state}
          dispatch={dispatch}
          onReplay={vi.fn()}
        />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', {
        name: /Buy professional clothes.*\$83\.27/,
      }),
    )
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'interview',
      choice: 'purchase',
    })
    const result = walkthroughReducer(snapshot.state, dispatch.mock.calls[0][0])
    expect(result.balance).toBe(1673)
    expect(result.history).toEqual(
      expect.arrayContaining([expect.objectContaining({ change: -8327 })]),
    )
    const insufficient = walkthroughReducer(
      { ...snapshot.state, balance: usdCents(8326) },
      { type: 'interview', choice: 'purchase' },
    )
    expect(insufficient.stage).toBe('ended')
    expect(insufficient.balance).toBe(8326)
  } finally {
    loadJobs.mockRestore()
  }
})
