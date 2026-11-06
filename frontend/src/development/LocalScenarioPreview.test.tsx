import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import LocalScenarioPreview from './LocalScenarioPreview'
import {
  createLocalScenarioService,
  localScenario,
  type ScenarioPresentationService,
} from './localScenario'

function show(overrides: Partial<ScenarioPresentationService> = {}) {
  const service = { ...createLocalScenarioService(), ...overrides }
  render(<LocalScenarioPreview service={service} />)
  return service
}
it('loads the scenario, displays all choices, and selection leaves the balance unchanged', async () => {
  const submit = vi.fn()
  show({ submit })
  expect(screen.getByText('Loading scenario…')).toHaveAttribute(
    'role',
    'status',
  )
  expect(
    await screen.findByRole('heading', { name: localScenario.title }),
  ).toBeVisible()
  expect(
    screen.getByRole('button', { name: /Pay an unexpected fee/ }),
  ).toBeVisible()
  expect(
    screen.getByRole('button', { name: /Decline assistance/ }),
  ).toBeVisible()
  const button = screen.getByRole('button', { name: /Receive assistance/ })
  await userEvent.click(button)
  expect(button).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByLabelText('Current balance $200.00')).toBeVisible()
  expect(submit).not.toHaveBeenCalled()
})
it.each([
  ['Receive assistance', '$225.00', 'Your household received $25.'],
  ['Pay an unexpected fee', '$185.00', 'Your household paid the $15 fee.'],
  [
    'Decline assistance',
    '$200.00',
    'You declined assistance. Your balance is unchanged.',
  ],
])(
  'shows the mock outcome for %s and prevents resubmission',
  async (label, balance, text) => {
    show()
    await userEvent.click(
      await screen.findByRole('button', { name: new RegExp(label) }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit decision' }),
    )
    expect(await screen.findByText(text)).toBeVisible()
    expect(screen.getByLabelText(`Current balance ${balance}`)).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Submit decision' }),
    ).toBeDisabled()
  },
)
it('disables controls while pending and waits for the result before changing money', async () => {
  let finish!: (
    value: Awaited<ReturnType<ScenarioPresentationService['submit']>>,
  ) => void
  const submit = vi.fn(
    () =>
      new Promise<Awaited<ReturnType<ScenarioPresentationService['submit']>>>(
        (resolve) => {
          finish = resolve
        },
      ),
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
  expect(
    screen.queryByRole('region', { name: 'Mock decision outcome' }),
  ).toBeNull()
  finish(await createLocalScenarioService().submit('receive'))
  expect(await screen.findByText('Your household received $25.')).toBeVisible()
})
it('preserves selection on failure and allows retry', async () => {
  const mock = createLocalScenarioService()
  const submit = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockImplementation(mock.submit)
  show({ submit })
  const choice = await screen.findByRole('button', {
    name: /Decline assistance/,
  })
  await userEvent.click(choice)
  await userEvent.click(screen.getByRole('button', { name: 'Submit decision' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Please retry')
  expect(choice).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByLabelText('Current balance $200.00')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: 'Submit decision' }))
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  expect(await screen.findByText(/You declined assistance/)).toBeVisible()
})
it('handles missing choices', async () => {
  show({ load: async () => ({ ...localScenario, choices: [] }) })
  expect(
    await screen.findByText('Choices are unavailable for this scenario.'),
  ).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Submit decision' })).toBeNull()
})
it('handles a missing scenario', async () => {
  show({ load: async () => null })
  expect(await screen.findByText('Scenario unavailable.')).toBeVisible()
})
it('handles scenario loading failure', async () => {
  show({
    load: async () => {
      throw new Error('offline')
    },
  })
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load the scenario',
  )
})
