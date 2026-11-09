import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, test, vi } from 'vitest'
import App from '../../../App'
import { AdminContentError } from '../../../services/adminContent'
import type { AdminContent } from '../../../types/adminContent'
import { usdCents } from '../../../types/domain'

const service = vi.hoisted(() => ({
  loadAdminContent: vi.fn(),
  restoreStaffSession: vi.fn(),
  signOutStaff: vi.fn(),
}))
vi.mock('../../../services/adminContent', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../services/adminContent')>()),
  ...service,
}))
vi.mock('../../../services/staffAuth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../services/staffAuth')>()),
  restoreStaffSession: service.restoreStaffSession,
  signOutStaff: service.signOutStaff,
  onStaffSignedOut: () => () => {},
}))

const c = usdCents
const content: AdminContent = {
  editions: [
    {
      versionId: 'v1',
      versionNumber: 1,
      status: 'published',
      createdAt: '2026-10-27T07:00:00Z',
      publishedAt: '2026-10-27T08:00:00Z',
      changeSummary: 'First edition summary',
    },
    {
      versionId: 'v2',
      versionNumber: 2,
      status: 'published',
      createdAt: '2026-11-09T18:00:00Z',
      publishedAt: '2026-11-09T18:30:00Z',
      changeSummary: 'Second edition summary',
    },
  ],
  categories: [
    { id: 'cat-h', name: 'Housing & Utilities', description: null },
    { id: 'cat-f', name: 'cat-f', description: null },
  ],
  personas: [
    {
      id: 'p-alex-2',
      versionId: 'v2',
      name: 'Alex',
      description: 'Alex is looking for work.',
      startingBalance: c(35000),
      weeklyIncome: c(0),
      startingJobId: null,
      hasEnglishSkills: true,
      hasComputerSkills: false,
    },
    {
      id: 'p-sofia-2',
      versionId: 'v2',
      name: 'Sofia',
      description: null,
      startingBalance: c(120050),
      weeklyIncome: c(0),
      startingJobId: null,
      hasEnglishSkills: null,
      hasComputerSkills: null,
    },
    {
      id: 'p-alex-1',
      versionId: 'v1',
      name: 'Alex',
      description: 'Edition one Alex',
      startingBalance: c(10000),
      weeklyIncome: c(0),
      startingJobId: null,
      hasEnglishSkills: true,
      hasComputerSkills: true,
    },
  ],
  personaExpenses: [
    {
      id: 'e1',
      personaId: 'p-alex-2',
      versionId: 'v2',
      name: 'Rent',
      amount: c(80000),
      firstDueDay: 1,
      repeatIntervalDays: 30,
      lateFee: c(2500),
    },
  ],
  scenarios: [
    {
      id: 's-rent',
      versionId: 'v2',
      title: 'Rent is due',
      description: 'The landlord expects rent.',
      defaultDay: 1,
      categoryId: 'cat-h',
      personaId: 'p-alex-2',
      scheduleType: 'scheduled',
    },
    {
      id: 's-groceries',
      versionId: 'v2',
      title: 'Groceries running low',
      description: 'The fridge is nearly empty.',
      defaultDay: null,
      categoryId: 'cat-f',
      personaId: null,
      scheduleType: 'non_scheduled',
    },
    {
      id: 's-old',
      versionId: 'v1',
      title: 'Edition one scenario',
      description: null,
      defaultDay: 5,
      categoryId: 'cat-h',
      personaId: null,
      scheduleType: 'scheduled',
    },
  ],
  choices: [
    {
      id: 'c-pay',
      scenarioId: 's-rent',
      versionId: 'v2',
      text: 'Pay in full',
      balanceChange: c(-80000),
      responseText: 'Rent is paid.',
      nextScenarioId: null,
    },
    {
      id: 'c-help',
      scenarioId: 's-rent',
      versionId: 'v2',
      text: 'Ask for help',
      balanceChange: c(15025),
      responseText: null,
      nextScenarioId: 's-groceries',
    },
  ],
  supportEffects: [
    {
      id: 'se1',
      choiceId: 'c-help',
      versionId: 'v2',
      assistanceAmount: c(30000),
      responseText: 'CAC covers part of the rent.',
      explanation: 'Capped assistance.',
    },
  ],
  jobs: [
    {
      id: 'j-cashier',
      versionId: 'v2',
      socCode: '41-2011',
      title: 'Cashier',
      description: null,
      areaName: 'Atlanta-Sandy Springs-Roswell, GA',
      wageYear: 2025,
      medianHourlyWage: c(1439),
      hoursPerWeek: 35,
      weeklyGrossIncome: c(50365),
      entryEducation: null,
      relatedExperience: null,
      onJobTraining: null,
      requirements: { schedule: 'client_based', notes: 'Check training' },
      wageSourceUrl: 'https://www.bls.gov/oes/tables.htm',
      requirementsSourceUrl: null,
      reviewedAt: null,
      isApproved: true,
      isActive: true,
      needsEnglishSkills: true,
      needsComputerSkills: false,
    },
    {
      id: 'j-old',
      versionId: 'v1',
      socCode: '99-0000',
      title: 'Edition one job',
      description: null,
      areaName: null,
      wageYear: null,
      medianHourlyWage: null,
      hoursPerWeek: null,
      weeklyGrossIncome: null,
      entryEducation: null,
      relatedExperience: null,
      onJobTraining: null,
      requirements: {},
      wageSourceUrl: null,
      requirementsSourceUrl: null,
      reviewedAt: null,
      isApproved: true,
      isActive: true,
      needsEnglishSkills: null,
      needsComputerSkills: null,
    },
  ],
  statistics: [],
  scenarioStatistics: [],
  services: [
    {
      key: 'eviction_prevention',
      name: 'Eviction Prevention',
      confirmedAt: '2026-11-06T17:00:48Z',
    },
    { key: 'food_pantry', name: 'Food Pantry', confirmedAt: null },
  ],
  serviceFacts: [
    {
      id: 'f1',
      serviceKey: 'eviction_prevention',
      key: 'evictions_prevented',
      title: 'evictions prevented',
      value: 1108,
      unit: 'Number',
      reportingYear: 2025,
    },
    {
      id: 'f2',
      serviceKey: 'eviction_prevention',
      key: 'rent_paid',
      title: 'rent assistance paid',
      value: 250000,
      unit: 'Dollars',
      reportingYear: 2025,
    },
  ],
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <App />
    </MemoryRouter>,
  )
}
async function ready() {
  renderDashboard()
  return screen.findByRole('heading', { level: 1, name: 'Employee dashboard' })
}
function summary() {
  return within(screen.getByRole('region', { name: 'Content summary' }))
}

beforeEach(() => {
  vi.resetAllMocks()
  service.loadAdminContent.mockResolvedValue(content)
  service.restoreStaffSession.mockResolvedValue({ email: 'staff@ourcac.org' })
  service.signOutStaff.mockResolvedValue(undefined)
})

test('shows the newest published edition with its summary and counts', async () => {
  await ready()
  expect(await screen.findByText('Second edition summary')).toBeInTheDocument()
  expect(screen.getByText(/Newest published edition/)).toBeInTheDocument()
  expect(summary().getByText('Scenarios').closest('button')).toHaveTextContent(
    '1 scheduled · 1 non-scheduled',
  )
  expect(summary().getByText('Personas').closest('button')).toHaveTextContent(
    '2',
  )
  expect(
    summary().getByText('CAC services').closest('button'),
  ).toHaveTextContent('2 facts')
  expect(screen.getByRole('tab', { name: /Scenarios/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('switching edition rescopes every tab to that edition', async () => {
  const user = userEvent.setup()
  await ready()
  await user.selectOptions(
    await screen.findByLabelText('Edition'),
    'Edition 1 (published)',
  )
  expect(screen.getByText('First edition summary')).toBeInTheDocument()
  expect(screen.queryByText('Second edition summary')).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Edition one scenario/ }),
  ).toBeInTheDocument()
  expect(screen.queryByText('Rent is due')).not.toBeInTheDocument()
  await user.click(screen.getByRole('tab', { name: /Jobs/ }))
  expect(
    screen.getByRole('article', { name: 'Job Edition one job' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('article', { name: 'Job Cashier' }),
  ).not.toBeInTheDocument()
})

test('scenario detail shows choices with signed amounts, CAC support, and next scenario', async () => {
  const user = userEvent.setup()
  await ready()
  await user.click(await screen.findByRole('button', { name: /Rent is due/ }))
  const detail = within(
    screen.getByRole('article', { name: 'Scenario Rent is due' }),
  )
  expect(detail.getByText('The landlord expects rent.')).toBeInTheDocument()
  expect(detail.getByText('Pay in full')).toBeInTheDocument()
  expect(detail.getByText('−$800.00')).toBeInTheDocument()
  expect(detail.getByText('+$150.25')).toBeInTheDocument()
  expect(detail.getByText('Rent is paid.')).toBeInTheDocument()
  expect(detail.getByText('CAC support')).toBeInTheDocument()
  expect(detail.getByText('$300.00')).toBeInTheDocument()
  expect(detail.getByText('CAC covers part of the rent.')).toBeInTheDocument()
  expect(detail.getByText('Groceries running low')).toBeInTheDocument()
  expect(detail.getByText('Scheduled')).toBeInTheDocument()
  expect(detail.getByText('Day 1')).toBeInTheDocument()
  expect(
    detail.getByText('No statistics are linked to this scenario.'),
  ).toBeInTheDocument()
  expect(detail.getByText('s-rent')).toBeInTheDocument()
})

test('scenario list filters by search, category, and schedule', async () => {
  const user = userEvent.setup()
  await ready()
  await screen.findByRole('button', { name: /Rent is due/ })
  expect(
    screen.getByText('Showing 2 of 2 scenarios', { exact: false }),
  ).toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('Category'), 'cat-f')
  expect(
    screen.getByText('Showing 1 of 2 scenarios', { exact: false }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Rent is due/ })).toBeNull()
  await user.selectOptions(screen.getByLabelText('Category'), 'all')
  await user.selectOptions(screen.getByLabelText('Schedule'), 'Scheduled')
  expect(screen.queryByRole('button', { name: /Groceries/ })).toBeNull()
  await user.type(screen.getByLabelText('Search scenarios'), 'zzz-nothing')
  expect(
    screen.getByText('No scenarios match these filters.'),
  ).toBeInTheDocument()
})

test('personas show balances, skills, and scheduled expenses or an empty note', async () => {
  const user = userEvent.setup()
  await ready()
  await user.click(await screen.findByRole('tab', { name: /Personas/ }))
  const alex = within(screen.getByRole('article', { name: 'Persona Alex' }))
  expect(alex.getByText('$350.00')).toBeInTheDocument()
  expect(alex.getByText('Alex is looking for work.')).toBeInTheDocument()
  expect(alex.getByText('1 linked scenario')).toBeInTheDocument()
  expect(
    alex.getByRole('row', { name: /Rent \$800.00 Day 1 Every 30 days/ }),
  ).toBeInTheDocument()
  const sofia = within(screen.getByRole('article', { name: 'Persona Sofia' }))
  expect(sofia.getByText('$1,200.50')).toBeInTheDocument()
  expect(sofia.getByText('No description stored.')).toBeInTheDocument()
  expect(
    sofia.getByText('No scheduled expenses are stored for this persona.'),
  ).toBeInTheDocument()
  expect(sofia.getAllByText('Unknown')).toHaveLength(2)
})

test('jobs show wages, requirements, status, and a safe source link', async () => {
  const user = userEvent.setup()
  await ready()
  await user.click(await screen.findByRole('tab', { name: /Jobs/ }))
  const job = within(screen.getByRole('article', { name: 'Job Cashier' }))
  expect(job.getByText('$503.65')).toBeInTheDocument()
  expect(job.getByText('$14.39')).toBeInTheDocument()
  expect(job.getByText('SOC 41-2011')).toBeInTheDocument()
  expect(job.getByText('Approved')).toBeInTheDocument()
  expect(job.getByText('Active')).toBeInTheDocument()
  expect(job.getByText('Client based')).toBeInTheDocument()
  expect(job.getByText('Check training')).toBeInTheDocument()
  const link = job.getByRole('link', { name: /Open wage source/ })
  expect(link).toHaveAttribute('href', 'https://www.bls.gov/oes/tables.htm')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  expect(job.queryByRole('link', { name: /requirements source/ })).toBeNull()
  await user.type(screen.getByLabelText('Search jobs'), 'nothing here')
  expect(screen.getByText('No jobs match this search.')).toBeInTheDocument()
})

test('statistics tab shows clear empty states when nothing is stored', async () => {
  const user = userEvent.setup()
  await ready()
  await user.click(await screen.findByRole('tab', { name: /Statistics/ }))
  expect(
    screen.getByText('No statistics are stored for this edition yet.'),
  ).toBeInTheDocument()
  expect(
    screen.getByText('No statistics are linked to scenarios yet.'),
  ).toBeInTheDocument()
  expect(screen.getByText('0 / 2')).toBeInTheDocument()
})

test('statistics and scenario links render when stored', async () => {
  const user = userEvent.setup()
  service.loadAdminContent.mockResolvedValue({
    ...content,
    statistics: [
      {
        id: 'st1',
        versionId: 'v2',
        description: 'Median rent in Sandy Springs',
        value: 1850,
        unit: 'Dollars',
        geography: 'Sandy Springs, GA',
        dataPeriod: '2024',
        sourceUrl: 'https://example.org/source',
        lastReviewedAt: '2026-11-01T12:00:00Z',
      },
    ],
    scenarioStatistics: [
      {
        scenarioId: 's-rent',
        statisticId: 'st1',
        versionId: 'v2',
        factRole: 'general',
      },
    ],
  })
  await ready()
  await user.click(await screen.findByRole('tab', { name: /Statistics/ }))
  const [row] = screen.getAllByRole('row', {
    name: /Median rent in Sandy Springs/,
  })
  expect(within(row).getByText('$1,850')).toBeInTheDocument()
  expect(within(row).getByText('Sandy Springs, GA')).toBeInTheDocument()
  expect(
    within(row).getByRole('link', { name: /Open source/ }),
  ).toHaveAttribute('href', 'https://example.org/source')
  expect(screen.getByText('1 / 2')).toBeInTheDocument()
  await user.click(screen.getByRole('tab', { name: /Scenarios/ }))
  await user.click(screen.getByRole('button', { name: /Rent is due/ }))
  const detail = within(
    screen.getByRole('article', { name: 'Scenario Rent is due' }),
  )
  expect(detail.getByText('general')).toBeInTheDocument()
  expect(detail.getByText('Median rent in Sandy Springs')).toBeInTheDocument()
})

test('CAC service facts expand to show values and units, and search filters', async () => {
  const user = userEvent.setup()
  await ready()
  await user.click(
    await screen.findByRole('tab', { name: /CAC Service Facts/ }),
  )
  expect(screen.getByText(/shared across editions/)).toBeInTheDocument()
  await user.click(screen.getByText('Eviction Prevention'))
  const table = screen.getByRole('table')
  expect(within(table).getByText('evictions prevented')).toBeInTheDocument()
  expect(within(table).getByText('1,108')).toBeInTheDocument()
  expect(within(table).getByText('$250,000')).toBeInTheDocument()
  await user.click(screen.getByText('Food Pantry'))
  expect(
    screen.getByText('No facts are stored for this service.'),
  ).toBeInTheDocument()
  await user.type(screen.getByLabelText('Search services and facts'), 'pantry')
  expect(screen.queryByText('Eviction Prevention')).toBeNull()
  expect(screen.getByText('Food Pantry')).toBeInTheDocument()
})

test('tabs are keyboard operable and summary cards open their tab', async () => {
  const user = userEvent.setup()
  await ready()
  const scenarios = await screen.findByRole('tab', { name: /Scenarios/ })
  scenarios.focus()
  await user.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: /Personas/ })).toHaveFocus()
  expect(screen.getByRole('tab', { name: /Personas/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(screen.getByRole('tab', { name: /Scenarios/ })).toHaveAttribute(
    'tabindex',
    '-1',
  )
  await user.keyboard('{End}')
  expect(screen.getByRole('tab', { name: /CAC Service Facts/ })).toHaveFocus()
  await user.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: /Scenarios/ })).toHaveFocus()
  await user.click(
    within(screen.getByRole('region', { name: 'Content summary' })).getByText(
      'Jobs',
    ),
  )
  expect(screen.getByRole('tab', { name: /Jobs/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(screen.getByText('Viewing')).toBeInTheDocument()
})

test('shows a loading state, then a retryable error when content cannot load', async () => {
  const user = userEvent.setup()
  service.loadAdminContent
    .mockRejectedValueOnce(new AdminContentError())
    .mockResolvedValue(content)
  renderDashboard()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load the stored content right now. Please try again.',
  )
  await user.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('Second edition summary')).toBeInTheDocument()
  expect(service.loadAdminContent).toHaveBeenCalledTimes(2)
})

test('the dashboard is read-only: it offers no edit, save, or delete controls', async () => {
  await ready()
  await screen.findByText('Second edition summary')
  for (const name of [/edit/i, /save/i, /delete/i, /publish/i, /approve/i])
    expect(screen.queryByRole('button', { name })).toBeNull()
})

test('Sign Out is still available from the dashboard', async () => {
  const user = userEvent.setup()
  await ready()
  await user.click(screen.getByRole('button', { name: 'Sign Out' }))
  expect(
    await screen.findByRole('heading', { name: 'Employee sign-in' }),
  ).toBeInTheDocument()
})
