import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { ScenarioPanel } from './ScenarioPanel'
import { localScenario } from '../../development/scenarioTestFixture'
import type { LoadedPlaythrough } from '../../types/playthrough'
import { usdCents } from '../../types/domain'
const { load, restore, submit } = vi.hoisted(() => ({
  load: vi.fn(),
  restore: vi.fn(),
  submit: vi.fn(),
}))
vi.mock('../../services/scenarioContent', () => ({ loadScenario: load }))
vi.mock('../../services/scenarioGameplay', () => ({
  restoreScenario: restore,
  submitScenario: submit,
}))
vi.mock('./ScenarioFacts', () => ({
  ScenarioFacts: () => <aside aria-label="Scenario facts">Saved facts</aside>,
}))
const run = {
  id: 'run',
  currentScenarioId: 'scenario',
  versionId: 'v',
  currentBalance: usdCents(20000),
  status: 'active',
} as LoadedPlaythrough
beforeEach(() => {
  vi.clearAllMocks()
  load.mockResolvedValue(localScenario)
  restore.mockResolvedValue({ run, decision: null, responseText: null })
})
it('shows scenario choices from the highest upfront cost to the lowest', async () => {
  const options = [
    { id: 'free', text: 'Pack with what you have', cost: 0, change: 0 },
    { id: 'pack', text: 'Buy ingredients', cost: 0, change: -2600 },
    { id: 'buy', text: 'Buy lunch out', cost: 5500, change: 1000 },
  ]
  load.mockResolvedValue({
    ...localScenario,
    choices: options.map(({ id, text, cost, change }) => ({
      ...localScenario.choices[0],
      id,
      text,
      upfrontCost: usdCents(cost),
      balanceChange: usdCents(change),
      requiresCac: false,
    })),
  })
  render(<ScenarioPanel run={run} onCommit={vi.fn()} onContinue={vi.fn()} />)
  const choices = await screen.findAllByRole('button')
  expect(choices).toHaveLength(3)
  expect(choices[0]).toHaveTextContent('Buy lunch out')
  expect(choices[1]).toHaveTextContent('Buy ingredients')
  expect(choices[2]).toHaveTextContent('Pack with what you have')
})
it('blocks duplicate clicks while a decision is saving and shows no optimistic receipt', async () => {
  let finish!: (value: unknown) => void
  submit.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  render(<ScenarioPanel run={run} onCommit={vi.fn()} onContinue={vi.fn()} />)
  const choice = await screen.findByRole('button', {
    name: /Receive assistance/,
  })
  await userEvent.dblClick(choice)
  expect(submit).toHaveBeenCalledOnce()
  expect(screen.queryByLabelText('Decision receipt')).toBeNull()
  finish({
    run,
    decision: {
      choiceId: 'receive',
      balanceAfter: usdCents(22500),
      balanceChangeApplied: usdCents(2500),
    },
    responseText: 'Saved',
  })
  expect(await screen.findByLabelText('Decision receipt')).toBeVisible()
})
it('commits on choice activation and opens a receipt and facts before Continue', async () => {
  const onCommit = vi.fn(),
    onContinue = vi.fn()
  submit.mockResolvedValue({
    run: { ...run, currentBalance: usdCents(22500) },
    decision: {
      choiceId: 'receive',
      balanceAfter: usdCents(22500),
      balanceChangeApplied: usdCents(2500),
    },
    responseText: 'Saved result',
  })
  render(
    <ScenarioPanel run={run} onCommit={onCommit} onContinue={onContinue} />,
  )
  await userEvent.click(
    await screen.findByRole('button', { name: /Receive assistance/ }),
  )
  expect(onCommit).toHaveBeenCalledOnce()
  expect(
    await screen.findByRole('button', { name: 'Continue to next day' }),
  ).toBeVisible()
  expect(screen.queryByText('Decision recorded')).toBeNull()
  expect(screen.getByText('Saved result')).toBeVisible()
  expect(screen.getByLabelText('Decision receipt')).toBeVisible()
  expect(screen.getByLabelText('Scenario facts')).toBeVisible()
  expect(
    screen
      .getByLabelText('Scenario facts')
      .compareDocumentPosition(
        screen.getByRole('button', { name: 'Continue to next day' }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(screen.queryByText(/Balance change:|Balance after:/)).toBeNull()
  expect(onContinue).not.toHaveBeenCalled()
  await userEvent.click(
    screen.getByRole('button', { name: 'Continue to next day' }),
  )
  expect(onContinue).toHaveBeenCalledOnce()
})
it('restores a read-only recap without submitting again', async () => {
  restore.mockResolvedValue({
    run,
    decision: {
      choiceId: 'decline',
      balanceAfter: usdCents(20000),
      balanceChangeApplied: usdCents(0),
    },
    responseText: 'Unchanged',
  })
  render(<ScenarioPanel run={run} onCommit={vi.fn()} onContinue={vi.fn()} />)
  expect(
    await screen.findByRole('button', { name: 'Continue to next day' }),
  ).toBeVisible()
  expect(submit).not.toHaveBeenCalled()
  expect(screen.queryByRole('button', { name: 'Submit decision' })).toBeNull()
})
it('blocks advancement when required content fails to load', async () => {
  load.mockRejectedValue(new Error('offline'))
  render(<ScenarioPanel run={run} onCommit={vi.fn()} onContinue={vi.fn()} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load')
  expect(
    screen.queryByRole('button', { name: 'Continue to next day' }),
  ).toBeNull()
})

it('hides CAC-only choices in regular mode', async () => {
  load.mockResolvedValue({
    ...localScenario,
    choices: localScenario.choices.map((choice) => ({
      ...choice,
      requiresCac: choice.id === 'receive',
    })),
  })
  render(<ScenarioPanel run={run} onCommit={vi.fn()} onContinue={vi.fn()} />)
  expect(
    await screen.findByRole('button', { name: /Decline assistance/ }),
  ).toBeVisible()
  expect(
    screen.queryByRole('button', { name: /Receive assistance/ }),
  ).toBeNull()
})

it('shows only the initial tax fee without revealing the refund', async () => {
  load.mockResolvedValue({
    ...localScenario,
    choices: [
      {
        ...localScenario.choices[0],
        text: 'Pay for tax preparation',
        balanceChange: usdCents(90100),
        upfrontCost: usdCents(9900),
      },
    ],
  })
  render(<ScenarioPanel run={run} onCommit={vi.fn()} onContinue={vi.fn()} />)
  expect(await screen.findByText('Initial expense: $99.00')).toBeVisible()
  expect(screen.queryByText(/901|1,000/)).toBeNull()
})

it('does not reveal the VITA refund before submitting', async () => {
  const supportedRun = { ...run, supportEnabled: true }
  restore.mockResolvedValue({
    run: supportedRun,
    decision: null,
    responseText: null,
  })
  load.mockResolvedValue({
    ...localScenario,
    choices: [
      {
        ...localScenario.choices[0],
        text: 'Get free tax preparation through VITA',
        requiresCac: true,
        balanceChange: usdCents(100000),
        upfrontCost: usdCents(0),
      },
    ],
  })
  render(
    <ScenarioPanel
      run={supportedRun}
      onCommit={vi.fn()}
      onContinue={vi.fn()}
    />,
  )
  expect(await screen.findByText('Initial expense: $0.00')).toBeVisible()
  expect(screen.queryByText(/1,000/)).toBeNull()
})
