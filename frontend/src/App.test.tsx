import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import App from './App'

test('increments the counter when clicked', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getByRole('button', { name: /count is 0/i }))

  expect(
    screen.getByRole('button', { name: /count is 1/i }),
  ).toBeInTheDocument()
})
