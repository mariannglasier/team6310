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
  return <EmploymentGame state={state} dispatch={dispatch} onReplay={replay} />
}
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
  expect(dispatch).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Submit application' }))
  expect(dispatch).toHaveBeenCalledExactlyOnceWith({
    type: 'apply',
    jobId: 'First job',
  })
})
it('separates selection and submission, reapplies the same day and reaches Day 30', async () => {
  const user = userEvent.setup()
  const replay = vi.fn()
  render(
    <MemoryRouter>
      <Game replay={replay} />
    </MemoryRouter>,
  )
  expect(screen.getAllByRole('button', { name: /^Choose / })).toHaveLength(2)
  expect(
    screen.getByRole('button', { name: 'Submit application' }),
  ).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Choose First job' }))
  expect(
    screen.getByRole('heading', { name: 'Find your next opportunity.' }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Submit application' }))
  expect(screen.getAllByRole('heading')[0]).toHaveTextContent(
    'Your application is in.',
  )
  expect(screen.getByText(/approved employment fact/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Start Day 1' }))
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.click(
    screen.getByRole('button', { name: /Make my current clothes work/ }),
  )
  await user.click(
    screen.getByRole('button', { name: 'Submit clothing decision' }),
  )
  expect(screen.getAllByRole('heading')[0]).toHaveTextContent(
    'Your interview result.',
  )
  await user.click(screen.getByRole('button', { name: 'Search open jobs' }))
  expect(screen.getByText('Day 2 of 30 · Reapply')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Choose Fallback job' }))
  await user.click(screen.getByRole('button', { name: 'Submit application' }))
  await user.click(screen.getByRole('button', { name: 'Continue to Day 3' }))
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.click(
    screen.getByRole('button', { name: /Make my current clothes work/ }),
  )
  await user.click(
    screen.getByRole('button', { name: 'Submit clothing decision' }),
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
    expect(
      screen.getByRole('heading', { name: 'Placeholder' }),
    ).toBeInTheDocument()
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
  expect(
    screen.queryByRole('heading', { name: 'Employment and financial history' }),
  ).toBeNull()
  await user.click(
    screen.getByRole('button', { name: 'Try again with CAC support' }),
  )
  expect(replay).toHaveBeenCalledWith(true)
}, 15000)

it('shows missing jobs as an actionable blocking state', () => {
  const state = createWalkthrough(persona, [], false, usdCents(6000))
  render(
    <MemoryRouter>
      <EmploymentGame state={state} dispatch={vi.fn()} onReplay={vi.fn()} />
    </MemoryRouter>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('No eligible jobs')
  expect(
    screen.getByRole('button', { name: 'Submit application' }),
  ).toBeDisabled()
})
