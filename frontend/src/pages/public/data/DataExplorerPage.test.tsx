import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { expect, test } from 'vitest'
import { DataExplorerPage } from './DataExplorerPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <DataExplorerPage />
    </MemoryRouter>,
  )
}

const topics = [
  'Housing',
  'Food',
  'Employment',
  'Clothing',
  'Youth',
  'Finances',
]

test('shows the six topics as tabs with Housing selected first', () => {
  renderPage()
  expect(
    screen.getByRole('heading', { level: 1, name: 'Explore our community' }),
  ).toBeInTheDocument()
  const tabs = screen.getAllByRole('tab')
  expect(tabs.map((tab) => tab.textContent)).toEqual(topics)
  expect(screen.getByRole('tab', { name: 'Housing' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(
    screen.getByRole('heading', { level: 2, name: 'Keep the lights on' }),
  ).toBeInTheDocument()
})

test('arrow, Home and End keys move between tabs and focus follows', async () => {
  const user = userEvent.setup()
  renderPage()
  screen.getByRole('tab', { name: 'Housing' }).focus()
  await user.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: 'Food' })).toHaveFocus()
  expect(screen.getByRole('tab', { name: 'Food' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await user.keyboard('{End}')
  expect(screen.getByRole('tab', { name: 'Finances' })).toHaveFocus()
  await user.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: 'Housing' })).toHaveFocus()
  await user.keyboard('{ArrowLeft}')
  expect(screen.getByRole('tab', { name: 'Finances' })).toHaveFocus()
})

test.each(topics)(
  '%s tab shows facts with source links and a CAC card',
  async (topic) => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: topic }))
    const panel = screen.getByRole('tabpanel')
    expect(
      within(panel).getByRole('heading', {
        level: 3,
        name: 'Facts behind the scene',
      }),
    ).toBeInTheDocument()
    const links = within(panel).getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    }
    // Every mode toggles without error and keeps the CAC card.
    await user.click(
      within(panel).getByRole('button', { name: 'See CAC impact' }),
    )
    expect(
      within(panel).getByRole('button', { name: 'See CAC impact' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      within(panel).getByText(/Learn more at ourcac\.org/),
    ).toBeInTheDocument()
  },
)

test('the chosen mode stays when switching topics', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  await user.click(screen.getByRole('tab', { name: 'Youth' }))
  expect(
    screen.getByRole('button', { name: 'See CAC impact' }),
  ).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('status')).toHaveTextContent(
    'With support, every rider boards on equal footing.',
  )
})

test('housing windows relight only in CAC mode and utilities offer seasons', async () => {
  const user = userEvent.setup()
  renderPage()
  expect(
    screen.getByRole('img', { name: /10 of 20 windows are dark\./ }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('group', { name: 'Season' })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Utilities' }))
  expect(
    screen.getByRole('img', { name: /7 of 20 windows are dark\./ }),
  ).toBeInTheDocument()
  expect(screen.getByRole('group', { name: 'Season' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(
    screen.getByRole('img', {
      name: /7 of 20 windows are dark and 3 are lit again/,
    }),
  ).toBeInTheDocument()
})

test('grocery cart starts over budget, selecting items does not spend, checkout drains once valid', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Food' }))
  expect(
    screen.getByText('Over budget by $34. Remove items to check out.'),
  ).toBeInTheDocument()
  const checkout = screen.getByRole('button', { name: 'Check out' })
  expect(checkout).toBeDisabled()
  // Removing an item only changes the cart total until checkout.
  await user.click(
    screen.getByRole('button', { name: /Snacks and lunch items/ }),
  )
  expect(
    screen.getByText('Within budget. Ready to check out.'),
  ).toBeInTheDocument()
  expect(screen.getByText('Grocery budget')).toBeInTheDocument()
  expect(
    screen.getByRole('img', { name: 'Budget jar 100 percent full' }),
  ).toBeInTheDocument()
  await user.click(checkout)
  expect(
    screen.getByText(/Checked out: \$491\.28 spent, \$8\.72 left\./),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Check out' })).toBeDisabled()
  // Changing the cart afterwards resets the checkout.
  await user.click(
    screen.getByRole('button', { name: /Snacks and lunch items/ }),
  )
  expect(screen.getByText(/Over budget by/)).toBeInTheDocument()
})

test('CAC impact restores removed grocery items from the pantry at no cost', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Food' }))
  await user.click(screen.getByRole('button', { name: /Chicken and protein/ }))
  expect(screen.getByText('Left behind')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(screen.getByText('From the CAC pantry')).toBeInTheDocument()
  expect(screen.getByText('Covered by the pantry shelf')).toBeInTheDocument()
})

test('job board closes postings with reasons and CAC classes open more', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Employment' }))
  expect(screen.getByText(/4 of 12/)).toBeInTheDocument()
  expect(
    screen.getAllByText(/Closed: needs strong English, needs computer skills/)
      .length,
  ).toBeGreaterThan(0)
  await user.click(screen.getByRole('button', { name: 'Diploma or GED' }))
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(screen.getByText(/10 of 12/)).toBeInTheDocument()
  expect(screen.getByText(/up from 4 before classes/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /“Very well”/ })).toBeDisabled()
})

test('clothing belt can be paused and hangers fill in CAC mode', async () => {
  const user = userEvent.setup()
  const { container } = renderPage()
  await user.click(screen.getByRole('tab', { name: 'Clothing' }))
  const pause = screen.getByRole('button', { name: 'Pause the belt' })
  await user.click(pause)
  expect(screen.getByRole('button', { name: 'Play the belt' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(container.querySelector('.belt__track.is-paused')).not.toBeNull()
  expect(container.querySelector('.garment.is-filled')).toBeNull()
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(container.querySelector('.garment.is-filled')).not.toBeNull()
  expect(screen.getByText('Coming soon')).toBeInTheDocument()
})

test('school bus marks one in six riders and equalizes them with support', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Youth' }))
  expect(
    screen.getByRole('img', {
      name: /3 of 18 are marked: 1 in 6 may face hunger/,
    }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Winter' }))
  expect(
    screen.getByText(/Coats, warm clothes, and holiday gifts/),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(
    screen.getByRole('img', { name: /all 18 board on equal footing/ }),
  ).toBeInTheDocument()
})

test('budget workbench shows the gap and only savings close it', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Finances' }))
  expect(screen.getByText('$200 gap')).toBeInTheDocument()
  expect(screen.getByText('Left to plan').nextSibling).toHaveTextContent('$150')
  const increaseSave = screen.getByRole('button', { name: 'Increase Save' })
  for (let i = 0; i < 6; i++) await user.click(increaseSave)
  expect(screen.getByText('$50 gap')).toBeInTheDocument()
  expect(screen.getByText('Left to plan').nextSibling).toHaveTextContent('$0')
  expect(increaseSave).toBeDisabled()
  expect(
    screen.getByRole('button', { name: 'Increase Pay bills' }),
  ).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Clear allocations' }))
  expect(screen.getByText('$200 gap')).toBeInTheDocument()
})

test('tax preparation view tracks checklist steps', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Finances' }))
  await user.click(screen.getByRole('button', { name: 'Tax preparation' }))
  expect(screen.getByText(/0 of 3 steps ready/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /Gather income forms/ }))
  expect(screen.getByText(/1 of 3 steps ready/)).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: /Explore CAC financial education/ }),
  ).toHaveAttribute('href', 'https://ourcac.org/')
})

test('zoom-out poverty figures are labeled with their own populations', () => {
  renderPage()
  const section = screen.getByRole('region', { name: /Zoom out/ })
  expect(within(section).getByText('8.5%')).toBeInTheDocument()
  expect(
    within(section).getByText(/Sandy Springs, GA · ACS 5-year estimate/),
  ).toBeInTheDocument()
  expect(within(section).getByText('11.1%')).toBeInTheDocument()
  expect(within(section).getByText('13.7%')).toBeInTheDocument()
})
