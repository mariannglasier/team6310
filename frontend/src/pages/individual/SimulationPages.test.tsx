import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { IndividualPage } from './SimulationPages'
import { ensureParticipantSession } from '../../services/participantSession'

vi.mock('../../services/participantSession', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../services/participantSession')
  >()),
  ensureParticipantSession: vi.fn(),
}))

beforeEach(() => vi.resetAllMocks())

it('starts only on interaction, shows loading and success, and does not restart on render', async () => {
  let finish!: () => void
  vi.mocked(ensureParticipantSession).mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve
    }),
  )
  const view = render(<IndividualPage />)
  expect(ensureParticipantSession).not.toHaveBeenCalled()
  await userEvent.click(
    screen.getByRole('button', { name: 'Prepare participant session' }),
  )
  expect(screen.getByRole('button')).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('Preparing')
  finish()
  expect(
    await screen.findByText(/Participant session is ready/),
  ).toBeInTheDocument()
  view.rerender(<IndividualPage />)
  expect(ensureParticipantSession).toHaveBeenCalledTimes(1)
})

it('shows a safe error and allows retry', async () => {
  vi.mocked(ensureParticipantSession)
    .mockRejectedValueOnce(new Error('private detail'))
    .mockResolvedValueOnce()
  render(<IndividualPage />)
  await userEvent.click(screen.getByRole('button'))
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to prepare')
  expect(screen.getByRole('alert')).not.toHaveTextContent('private detail')
  await userEvent.click(screen.getByRole('button'))
  expect(
    await screen.findByText(/Participant session is ready/),
  ).toBeInTheDocument()
})
