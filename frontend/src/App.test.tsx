import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { expect, test } from 'vitest'
import App from './App'

function HistoryControls() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <>
      <output aria-label="Current path">{pathname}</output>
      <button onClick={() => navigate(-1)}>History back</button>
      <button onClick={() => navigate(1)}>History forward</button>
    </>
  )
}
function renderRoute(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <HistoryControls />
    </MemoryRouter>,
  )
}

test('legacy introduction URL redirects to the individual placeholder without the removed screen', () => {
  renderRoute('/simulation/introduction')
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/simulation/individual',
  )
  expect(
    screen.getByRole('heading', { name: 'Individual simulation' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByText(/introduction and mode selection experience/i),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('list', { name: /Setup step/ }),
  ).not.toBeInTheDocument()
})
test.each([
  ['/', 'Financial hardship can happen to anyone. How would you respond?'],
  ['/learn', 'Learn About CAC'],
  ['/donate', 'Donate'],
  ['/simulation/introduction', 'Individual simulation'],
  ['/simulation/individual', 'Individual simulation'],
  ['/dev/integration-test', 'Temporary Supabase integration test'],
  ['/simulation/results', 'Simulation results'],
  ['/group/host', 'Host a Group'],
  ['/group/join', 'Join a Group'],
  ['/admin/login', 'Employee sign-in'],
  ['/unknown/path', 'Page not found'],
])('loads %s directly', (path, heading) => {
  renderRoute(path)
  expect(
    screen.getByRole('heading', { level: 1, name: heading }),
  ).toBeInTheDocument()
  expect(document.title).toBe(`${heading} | CAC Poverty Simulation`)
})
test('Play navigation and browser history restore pages and move focus', async () => {
  const user = userEvent.setup()
  renderRoute()
  await user.click(
    within(screen.getByRole('main')).getByRole('link', {
      name: 'Start simulation',
    }),
  )
  expect(
    screen.getByRole('heading', { name: 'Individual simulation' }),
  ).toHaveFocus()
  await user.click(screen.getByRole('button', { name: 'History back' }))
  expect(
    screen.getByRole('heading', {
      name: 'Financial hardship can happen to anyone. How would you respond?',
    }),
  ).toHaveFocus()
  await user.click(screen.getByRole('button', { name: 'History forward' }))
  expect(
    screen.getByRole('heading', { name: 'Individual simulation' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'Individual simulation' }),
  ).toBeInTheDocument()
})
test.each([
  ['Learn About CAC', 'https://ourcac.org/'],
  ['Donate', 'https://ourcac.org/donate-online/'],
])(
  'landing %s action links to the approved external destination',
  (label, href) => {
    renderRoute()
    expect(
      within(screen.getByRole('navigation')).getByRole('link', { name: label }),
    ).toHaveAttribute('href', href)
    expect(
      within(screen.getByRole('navigation')).getByRole('link', { name: label }),
    ).toHaveAttribute('href', href)
  },
)
test.each([
  ['Host a group', 'Host a Group'],
  ['Join a group', 'Join a Group'],
])('mode navigation opens %s', async (label, heading) => {
  const user = userEvent.setup()
  renderRoute()
  await user.click(screen.getByRole('link', { name: label }))
  expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
})
test('admin dashboard fails closed, including with untrusted browser role flags', () => {
  localStorage.setItem('role', 'staff')
  try {
    renderRoute('/admin/dashboard')
    expect(
      screen.getByRole('heading', { name: 'Employee sign-in' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Current path')).toHaveTextContent(
      '/admin/login',
    )
    expect(
      screen.queryByRole('heading', { name: 'Employee dashboard' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  } finally {
    localStorage.removeItem('role')
  }
})
test('keyboard navigation reaches the skip link and page navigation', async () => {
  const user = userEvent.setup()
  renderRoute()
  await user.tab()
  expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
  await user.tab()
  expect(
    screen.getByRole('link', { name: 'CAC Poverty Simulation' }),
  ).toHaveFocus()
  await user.tab()
  expect(
    within(screen.getByRole('navigation')).getByRole('link', {
      name: 'Learn About CAC',
    }),
  ).toHaveFocus()
  await user.tab()
  await user.tab()
  await user.tab()
  expect(
    within(screen.getByRole('main')).getByRole('link', {
      name: 'Start simulation',
    }),
  ).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(
    screen.getByRole('heading', { name: 'Individual simulation' }),
  ).toHaveFocus()
})

test('landing header and hero reflect the revised actions and photo', () => {
  renderRoute()
  const nav = within(screen.getByRole('navigation'))
  expect(nav.getAllByRole('link').map((link) => link.textContent)).toEqual([
    'Learn About CAC',
    'Explore Data',
    'Donate',
  ])
  expect(nav.getByRole('link', { name: 'Explore Data' })).toHaveAttribute(
    'href',
    '/data',
  )
  expect(
    screen.getByRole('img', { name: /sorting fresh produce/ }),
  ).toHaveAttribute('src', expect.stringContaining('foodpantry2'))
  expect(screen.queryByText('Your month at a glance')).not.toBeInTheDocument()
  expect(
    screen.queryByText(/Fictional households\. An exercise/),
  ).not.toBeInTheDocument()
  expect(document.querySelector('figcaption')).toBeNull()
  expect(document.querySelectorAll('.landing-step__icon svg')).toHaveLength(3)
})

test('footer provides the CAC logo, contact links, and unavailable future resources', () => {
  renderRoute()
  const footer = within(screen.getByRole('contentinfo'))
  expect(
    footer.getByRole('link', { name: 'Return to landing page' }),
  ).toHaveAttribute('href', '/')
  expect(
    footer.getByRole('img', { name: 'Community Assistance Center' }),
  ).toBeInTheDocument()
  expect(
    footer.getByText('Helping neighbors in Sandy Springs and Dunwoody.'),
  ).toBeInTheDocument()
  expect(footer.getByRole('link', { name: '(770) 552-4889' })).toHaveAttribute(
    'href',
    'tel:+17705524889',
  )
  expect(footer.getByRole('link', { name: 'info@ourcac.org' })).toHaveAttribute(
    'href',
    'mailto:info@ourcac.org',
  )
  for (const label of [/Privacy/, /Sources/]) {
    const resource = footer.getByRole('link', { name: label })
    expect(resource).toHaveAttribute('aria-disabled', 'true')
    expect(resource).not.toHaveAttribute('href')
  }
  expect(footer.getByText('Tax ID #: 58-1825565')).toBeInTheDocument()
})

test.each([
  '/simulation/individual',
  '/group/host',
  '/group/join',
  '/simulation/results',
  '/admin/login',
  '/missing-page',
])(
  'shared footer on %s includes the same content and navigates home',
  async (path) => {
    const user = userEvent.setup()
    renderRoute(path)
    const footer = within(screen.getByRole('contentinfo'))
    expect(
      footer.getByRole('heading', { name: 'Contact CAC' }),
    ).toBeInTheDocument()
    expect(
      footer.getByRole('heading', { name: 'Resources' }),
    ).toBeInTheDocument()
    expect(
      footer.getByText('Helping neighbors in Sandy Springs and Dunwoody.'),
    ).toBeInTheDocument()
    expect(footer.getByText('Tax ID #: 58-1825565')).toBeInTheDocument()
    expect(
      footer.getByRole('link', { name: 'info@ourcac.org' }),
    ).toHaveAttribute('href', 'mailto:info@ourcac.org')
    await user.click(
      footer.getByRole('link', { name: 'Return to landing page' }),
    )
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/')
  },
)

test.each([
  '/simulation/individual',
  '/group/host',
  '/group/join',
  '/simulation/results',
  '/admin/login',
  '/missing-page',
])(
  'shared header on %s keeps the landing navigation and logo home link',
  async (path) => {
    const user = userEvent.setup()
    renderRoute(path)
    const header = within(screen.getByRole('banner'))
    expect(header.getAllByRole('link').map((link) => link.textContent)).toEqual(
      ['', 'Learn About CAC', 'Explore Data', 'Donate'],
    )
    expect(
      header.getByRole('img', { name: 'Community Assistance Center' }),
    ).toBeInTheDocument()
    expect(
      header.getByRole('link', { name: 'Learn About CAC' }),
    ).toHaveAttribute('href', 'https://ourcac.org/')
    expect(header.getByRole('link', { name: 'Donate' })).toHaveAttribute(
      'href',
      'https://ourcac.org/donate-online/',
    )
    await user.click(
      header.getByRole('link', { name: 'CAC Poverty Simulation' }),
    )
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/')
    expect(
      screen.getByRole('link', { name: 'Return to landing page' }),
    ).toHaveAttribute('href', '/')
  },
)
