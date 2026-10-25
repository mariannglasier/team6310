import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { IntegrationTestPage } from './IntegrationTestPage'
import { ensureParticipantSession } from '../../services/participantSession'
import { insertIntegrationTest } from '../../services/integrationTest'

vi.mock('../../services/participantSession', () => ({
  ensureParticipantSession: vi.fn(),
}))
vi.mock('../../services/integrationTest', () => ({
  insertIntegrationTest: vi.fn(),
}))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(ensureParticipantSession).mockResolvedValue()
})

it('requires session preparation and reports success only after insert completion', async () => {
  const user = userEvent.setup()
  let finish!: (id: string) => void
  vi.mocked(insertIntegrationTest).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  render(<IntegrationTestPage />)
  await user.type(screen.getByRole('textbox'), 'test')
  const insert = screen.getByRole('button', { name: 'Insert test row' })
  expect(insert).toBeDisabled()
  expect(insertIntegrationTest).not.toHaveBeenCalled()
  await user.click(
    screen.getByRole('button', { name: 'Prepare participant session' }),
  )
  await user.click(insert)
  expect(insert).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('Inserting')
  expect(insertIntegrationTest).toHaveBeenCalledExactlyOnceWith('test')
  finish('row-id')
  expect(
    await screen.findByText(/created successfully.*row-id/),
  ).toBeInTheDocument()
})

it('keeps submission disabled when session preparation fails', async () => {
  vi.mocked(ensureParticipantSession).mockRejectedValue(
    new Error('private detail'),
  )
  render(<IntegrationTestPage />)
  await userEvent.click(
    screen.getByRole('button', { name: 'Prepare participant session' }),
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to prepare')
  expect(screen.getByRole('button', { name: 'Insert test row' })).toBeDisabled()
  expect(insertIntegrationTest).not.toHaveBeenCalled()
})

it('shows a safe insert error and requires session preparation again', async () => {
  vi.mocked(insertIntegrationTest).mockRejectedValue(
    new Error('private detail'),
  )
  render(<IntegrationTestPage />)
  await userEvent.click(
    screen.getByRole('button', { name: 'Prepare participant session' }),
  )
  await userEvent.type(screen.getByRole('textbox'), 'test')
  await userEvent.click(screen.getByRole('button', { name: 'Insert test row' }))
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Insert could not be confirmed',
  )
  expect(screen.getByRole('alert')).not.toHaveTextContent('private detail')
  expect(screen.getByRole('button', { name: 'Insert test row' })).toBeDisabled()
})
