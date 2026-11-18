import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { usdCents } from '../../types/domain'
import { loadResultComparisons } from '../../services/resultComparisons'
import { SimulationResult } from './SimulationResult'

vi.mock('../../services/resultComparisons')

it('offers both replay paths and shows percentages only where available', async () => {
  vi.mocked(loadResultComparisons).mockResolvedValueOnce([
    {
      category: 'Food',
      question: 'How will you get groceries?',
      answer: 'Shop for groceries',
      responses: 5,
      options: [{ id: 'shop', label: 'Shop for groceries', percent: 80 }],
    },
    {
      category: 'Transportation',
      question: 'How will you get to work?',
      answer: 'Take the bus',
      responses: null,
      options: [],
    },
  ])
  const replay = vi.fn()
  render(
    <SimulationResult
      runId="run"
      balance={usdCents(33500)}
      reason={null}
      onReplay={replay}
    />,
  )
  const user = userEvent.setup()
  await user.click(
    screen.getByRole('button', { name: 'Play with CAC assistance' }),
  )
  await user.click(
    screen.getByRole('button', { name: 'Replay from household selection' }),
  )
  expect(replay.mock.calls).toEqual([[true], [false]])
  const [food, transportation] = await screen.findAllByRole('article')
  expect(within(food!).getByText('80%')).toBeInTheDocument()
  expect(within(transportation!).getByText('Take the bus')).toBeInTheDocument()
  expect(
    within(transportation!).getByText(/Insufficient responses/),
  ).toBeInTheDocument()
  expect(within(transportation!).queryByRole('progressbar')).toBeNull()
})
