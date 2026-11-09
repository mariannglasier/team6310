import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import LocalScenarioPreview from './LocalScenarioPreview'
import { localScenario } from './scenarioTestFixture'
import type {
  ScenarioPresentationService,
  ScenarioRunSnapshot,
} from './localScenario'
import { usdCents } from '../types/domain'

const initial: ScenarioRunSnapshot = {
  run: {
    id: 'run',
    personaId: 'p',
    ownerUserId: 'owner',
    versionId: 'v',
    currentScenarioId: localScenario.id,
    currentBalance: usdCents(20000),
    currentDay: 4,
    status: 'active',
    startedAt: null,
    sessionId: null,
    currentJobId: null,
    supportEnabled: false,
    employmentState: null,
    persona: {
      id: 'p',
      versionId: 'v',
      name: '[LOCAL TEST] Alex',
      description: '',
    },
  },
  decision: null,
  responseText: null,
}
function outcome(index = 0): ScenarioRunSnapshot {
  const choice = localScenario.choices[index]
  const balance = usdCents(20000 + choice.balanceChange)
  return {
    run: { ...initial.run, currentBalance: balance },
    responseText: choice.responseText,
    decision: {
      scenarioId: localScenario.id,
      choiceId: choice.id,
      balanceChangeApplied: choice.balanceChange,
      balanceAfter: balance,
    },
  }
}
function show(overrides: Partial<ScenarioPresentationService> = {}) {
  const service: ScenarioPresentationService = {
    load: async () => localScenario,
    restore: async () => initial,
    open: async () => initial,
    submit: vi.fn().mockResolvedValue(outcome()),
    ...overrides,
  }
  render(<LocalScenarioPreview service={service} />)
  return service
}
it('loads content and selects without changing confirmed money', async () => {
  const service = show()
  expect(screen.getByText('Loading scenario…')).toBeVisible()
  const choice = await screen.findByRole('button', {
    name: /Receive assistance/,
  })
  await userEvent.click(choice)
  expect(choice).toHaveAttribute('aria-pressed', 'true')
  expect(service.submit).not.toHaveBeenCalled()
  expect(screen.getByLabelText('Current balance $200.00')).toBeVisible()
})
it.each([0, 1, 2])(
  'shows committed outcome %i and locks selection',
  async (index) => {
    show({ submit: async () => outcome(index) })
    await userEvent.click(
      await screen.findByRole('button', {
        name: new RegExp(localScenario.choices[index].text),
      }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit decision' }),
    )
    expect(
      await screen.findByText(localScenario.choices[index].responseText),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Submit decision' }),
    ).toBeDisabled()
  },
)
it('keeps pending controls disabled until commitment', async () => {
  let finish!: (value: ScenarioRunSnapshot) => void
  const submit = vi.fn(
    () =>
      new Promise<ScenarioRunSnapshot>((resolve) => {
        finish = resolve
      }),
  )
  show({ submit })
  await userEvent.click(
    await screen.findByRole('button', { name: /Receive assistance/ }),
  )
  const button = screen.getByRole('button', { name: 'Submit decision' })
  await userEvent.click(button)
  await userEvent.click(button)
  expect(submit).toHaveBeenCalledOnce()
  expect(button.closest('fieldset')).toHaveAttribute('aria-busy', 'true')
  expect(screen.getByLabelText('Current balance $200.00')).toBeVisible()
  finish(outcome())
  expect(await screen.findByText('Decision recorded')).toBeVisible()
})
it('restores a completed decision on remount without submission', async () => {
  const submit = vi.fn()
  show({ restore: async () => outcome(1), submit })
  expect(
    await screen.findByText('Your household paid the $15 fee.'),
  ).toBeVisible()
  expect(screen.getByLabelText('Current balance $185.00')).toBeVisible()
  expect(submit).not.toHaveBeenCalled()
})
it('reconciles a lost response by restoring committed state', async () => {
  const restore = vi
    .fn()
    .mockResolvedValueOnce(initial)
    .mockResolvedValue(outcome())
  show({
    restore,
    submit: async () => {
      throw new Error('lost response')
    },
  })
  await userEvent.click(
    await screen.findByRole('button', { name: /Receive assistance/ }),
  )
  await userEvent.click(screen.getByRole('button', { name: 'Submit decision' }))
  expect(await screen.findByText('Decision recorded')).toBeVisible()
  expect(restore).toHaveBeenCalledTimes(2)
})
it('allows safe retry after failure and preserves selection', async () => {
  const submit = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue(outcome())
  show({ submit })
  await userEvent.click(
    await screen.findByRole('button', { name: /Receive assistance/ }),
  )
  await userEvent.click(screen.getByRole('button', { name: 'Submit decision' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to confirm',
  )
  await userEvent.click(screen.getByRole('button', { name: 'Submit decision' }))
  expect(await screen.findByText('Decision recorded')).toBeVisible()
})
it('requires explicit start rather than automatically creating a run', async () => {
  const open = vi.fn().mockResolvedValue(initial)
  show({ restore: async () => null, open })
  const start = await screen.findByRole('button', {
    name: 'Start local scenario run',
  })
  expect(open).not.toHaveBeenCalled()
  await userEvent.click(start)
  await waitFor(() => expect(open).toHaveBeenCalledOnce())
  expect(
    await screen.findByRole('button', { name: /Receive assistance/ }),
  ).toBeVisible()
})
it('handles missing choices', async () => {
  show({ load: async () => ({ ...localScenario, choices: [] }) })
  expect(
    await screen.findByText('Choices are unavailable for this scenario.'),
  ).toBeVisible()
})
it('handles missing scenario', async () => {
  show({ load: async () => null })
  expect(await screen.findByText('Scenario unavailable.')).toBeVisible()
})
it('handles read failure', async () => {
  show({
    load: async () => {
      throw new Error('offline')
    },
  })
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load the local scenario',
  )
})
