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
it('selects without changing money and offers Continue only after commit', async () => {
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
  expect(onCommit).not.toHaveBeenCalled()
  expect(
    screen.queryByRole('button', { name: 'Continue simulation' }),
  ).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Submit decision' }))
  expect(await screen.findByText('Saved result')).toBeVisible()
  expect(onContinue).not.toHaveBeenCalled()
  await userEvent.click(
    screen.getByRole('button', { name: 'Continue simulation' }),
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
  expect(await screen.findByText('Decision recorded')).toBeVisible()
  expect(submit).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Submit decision' })).toBeDisabled()
})
it('blocks advancement when required content fails to load', async () => {
  load.mockRejectedValue(new Error('offline'))
  render(<ScenarioPanel run={run} onCommit={vi.fn()} onContinue={vi.fn()} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load')
  expect(
    screen.queryByRole('button', { name: 'Continue simulation' }),
  ).toBeNull()
})
