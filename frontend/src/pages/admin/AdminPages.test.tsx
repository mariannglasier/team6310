import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { beforeEach, expect, test, vi } from 'vitest'
import App from '../../App'
import { StaffAuthError } from '../../services/staffAuth'

const service = vi.hoisted(() => ({
  restoreStaffSession: vi.fn(),
  signInStaff: vi.fn(),
  signOutStaff: vi.fn(),
  onStaffSignedOut: vi.fn(),
}))
vi.mock('../../services/staffAuth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/staffAuth')>()),
  ...service,
}))

const adminContent = vi.hoisted(() => ({ loadAdminContent: vi.fn() }))
vi.mock('../../services/adminContent', () => adminContent)
const emptyContent = {
  editions: [],
  categories: [],
  personas: [],
  personaExpenses: [],
  scenarios: [],
  choices: [],
  supportEffects: [],
  jobs: [],
  statistics: [],
  scenarioStatistics: [],
  services: [],
  serviceFacts: [],
}

function Path() {
  return <output aria-label="Current path">{useLocation().pathname}</output>
}
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Path />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  adminContent.loadAdminContent.mockResolvedValue(emptyContent)
  service.restoreStaffSession.mockResolvedValue(null)
  service.onStaffSignedOut.mockReturnValue(() => {})
  service.signOutStaff.mockResolvedValue(undefined)
})

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  email = 'staff@ourcac.org',
  password = 'correct horse',
) {
  if (email) await user.type(screen.getByLabelText(/Work email/), email)
  if (password) await user.type(screen.getByLabelText(/Password/), password)
  await user.click(screen.getByRole('button', { name: 'Sign In' }))
}

test('login form has labeled fields, a masked password, and a way back', async () => {
  renderAt('/admin/login')
  expect(
    await screen.findByRole('heading', { name: 'Employee sign-in' }),
  ).toBeInTheDocument()
  expect(screen.getByLabelText(/Work email/)).toHaveAttribute('type', 'email')
  expect(screen.getByLabelText(/Password/)).toHaveAttribute('type', 'password')
  expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Back to main site' }),
  ).toHaveAttribute('href', '/')
  expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument()
})

test('authorized staff sign in and land on the dashboard', async () => {
  const user = userEvent.setup()
  service.signInStaff.mockResolvedValue({ email: 'staff@ourcac.org' })
  renderAt('/admin/dashboard')
  await screen.findByRole('heading', { name: 'Employee sign-in' })
  await fillAndSubmit(user)
  expect(service.signInStaff).toHaveBeenCalledExactlyOnceWith(
    'staff@ourcac.org',
    'correct horse',
  )
  expect(
    await screen.findByRole('heading', { name: 'Employee dashboard' }),
  ).toBeInTheDocument()
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/admin/dashboard',
  )
  expect(screen.getByText('staff@ourcac.org')).toBeInTheDocument()
})

test('wrong credentials show a readable error, clear the password, and stay out of the dashboard', async () => {
  const user = userEvent.setup()
  service.signInStaff.mockRejectedValue(
    new StaffAuthError('invalid_credentials'),
  )
  renderAt('/admin/login')
  await screen.findByRole('heading', { name: 'Employee sign-in' })
  await fillAndSubmit(user)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'The work email or password is incorrect.',
  )
  expect(screen.getByLabelText(/Password/)).toHaveValue('')
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/admin/login',
  )
  expect(
    screen.queryByRole('heading', { name: 'Employee dashboard' }),
  ).not.toBeInTheDocument()
})

test('valid credentials without staff authorization are denied', async () => {
  const user = userEvent.setup()
  service.signInStaff.mockRejectedValue(new StaffAuthError('not_authorized'))
  renderAt('/admin/login')
  await screen.findByRole('heading', { name: 'Employee sign-in' })
  await fillAndSubmit(user)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'This account does not have CAC staff access.',
  )
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/admin/login',
  )
})

test('an unexpected failure shows the generic unavailable message only', async () => {
  const user = userEvent.setup()
  service.signInStaff.mockRejectedValue(new Error('raw SQL detail'))
  renderAt('/admin/login')
  await screen.findByRole('heading', { name: 'Employee sign-in' })
  await fillAndSubmit(user)
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Sign-in is unavailable right now.')
  expect(alert).not.toHaveTextContent('raw SQL')
})

test('empty fields are flagged without calling Auth', async () => {
  const user = userEvent.setup()
  renderAt('/admin/login')
  await screen.findByRole('heading', { name: 'Employee sign-in' })
  await user.click(screen.getByRole('button', { name: 'Sign In' }))
  expect(screen.getByText('Enter your work email.')).toBeInTheDocument()
  expect(screen.getByText('Enter your password.')).toBeInTheDocument()
  expect(service.signInStaff).not.toHaveBeenCalled()
})

test('submits with the keyboard Enter key', async () => {
  const user = userEvent.setup()
  service.signInStaff.mockResolvedValue({ email: 'staff@ourcac.org' })
  renderAt('/admin/login')
  await screen.findByRole('heading', { name: 'Employee sign-in' })
  await user.type(screen.getByLabelText(/Work email/), 'staff@ourcac.org')
  await user.type(screen.getByLabelText(/Password/), 'pw{Enter}')
  expect(service.signInStaff).toHaveBeenCalledOnce()
})

test('an existing verified staff session opens the dashboard after refresh', async () => {
  service.restoreStaffSession.mockResolvedValue({ email: 'staff@ourcac.org' })
  renderAt('/admin/dashboard')
  expect(
    await screen.findByRole('heading', { name: 'Employee dashboard' }),
  ).toBeInTheDocument()
})

test('visiting the login page with a staff session goes to the dashboard', async () => {
  service.restoreStaffSession.mockResolvedValue({ email: 'staff@ourcac.org' })
  renderAt('/admin/login')
  expect(
    await screen.findByRole('heading', { name: 'Employee dashboard' }),
  ).toBeInTheDocument()
})

test('a failed session check fails closed to sign-in', async () => {
  service.restoreStaffSession.mockRejectedValue(
    new StaffAuthError('unavailable'),
  )
  renderAt('/admin/dashboard')
  expect(
    await screen.findByRole('heading', { name: 'Employee sign-in' }),
  ).toBeInTheDocument()
})

test('the dashboard shows a checking state, not protected content, while access is verified', async () => {
  let resolve: (value: null) => void = () => {}
  service.restoreStaffSession.mockReturnValue(
    new Promise((r) => {
      resolve = r
    }),
  )
  renderAt('/admin/dashboard')
  expect(
    await screen.findByRole('heading', { name: 'Checking staff access' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('heading', { name: 'Employee dashboard' }),
  ).not.toBeInTheDocument()
  expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument()
  resolve(null)
  expect(
    await screen.findByRole('heading', { name: 'Employee sign-in' }),
  ).toBeInTheDocument()
})

test('Sign Out ends the session and returns to sign-in', async () => {
  const user = userEvent.setup()
  service.restoreStaffSession.mockResolvedValue({ email: 'staff@ourcac.org' })
  renderAt('/admin/dashboard')
  await screen.findByRole('heading', { name: 'Employee dashboard' })
  await user.click(screen.getByRole('button', { name: 'Sign Out' }))
  expect(service.signOutStaff).toHaveBeenCalledOnce()
  expect(
    await screen.findByRole('heading', { name: 'Employee sign-in' }),
  ).toBeInTheDocument()
  expect(screen.getByLabelText('Current path')).toHaveTextContent(
    '/admin/login',
  )
})

test('a sign-out in another tab closes the dashboard', async () => {
  let notify: () => void = () => {}
  service.onStaffSignedOut.mockImplementation((cb: () => void) => {
    notify = cb
    return () => {}
  })
  service.restoreStaffSession.mockResolvedValue({ email: 'staff@ourcac.org' })
  renderAt('/admin/dashboard')
  await screen.findByRole('heading', { name: 'Employee dashboard' })
  notify()
  expect(
    await screen.findByRole('heading', { name: 'Employee sign-in' }),
  ).toBeInTheDocument()
})

test('public pages never contact staff Auth', async () => {
  renderAt('/')
  await screen.findByRole('banner')
  expect(service.restoreStaffSession).not.toHaveBeenCalled()
})
