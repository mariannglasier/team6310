import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, test, vi } from 'vitest'
import type {
  ExplorerCategorySummary,
  ExplorerStatistic,
} from '../../../services/explorerService'
import { DataExplorerPage } from './DataExplorerPage'

// The page reads published statistics; tests never touch the network.
const { loadCategories, loadStatistics } = vi.hoisted(() => ({
  loadCategories: vi.fn(),
  loadStatistics: vi.fn(),
}))
vi.mock('../../../services/explorerService', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../../services/explorerService')
  >()),
  loadExplorerCategories: loadCategories,
  loadExplorerStatistics: loadStatistics,
}))

beforeEach(() => {
  loadCategories.mockReset().mockResolvedValue([])
  loadStatistics.mockReset().mockResolvedValue([])
})

const foodStatistic: ExplorerStatistic = {
  key: 'atl_food_beverage_cpi_change',
  title: 'Food and beverage prices, year over year',
  description: 'How much more food costs than it did a year earlier.',
  contextNote: null,
  value: 3.6307,
  valueHigh: null,
  unit: 'percent_change',
  geography: 'Atlanta-Sandy Springs-Roswell, GA (metro area)',
  geographyCode: null,
  periodLabel: 'August 2026 compared with August 2025',
  sourceName: 'Federal Reserve Bank of St. Louis',
  sourceTitle: 'FRED Economic Data',
  sourceUrl: 'https://fred.stlouisfed.org/',
  lastCheckedAt: null,
  visualization: 'figure',
  visualizationConfig: {},
  isDerived: true,
  derivationNote: 'Latest divided by the prior year.',
  displayOrder: 1,
}

const withKey = (
  key: string,
  overrides: Partial<ExplorerStatistic> = {},
): ExplorerStatistic => ({
  ...foodStatistic,
  key,
  title: `Live ${key}`,
  description: `Description of ${key}.`,
  unit: 'percent',
  visualization: 'meter',
  isDerived: false,
  derivationNote: null,
  ...overrides,
})

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

const firstCacFigure: Record<string, string> = {
  Housing: '1,108',
  Food: '2,995',
  Employment: '610',
  Clothing: '2,152',
  Youth: '1,097',
  Finances: '590',
}

test.each(topics)(
  '%s tab shows CAC outcome facts with a source link and a CAC card',
  async (topic) => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: topic }))
    const panel = screen.getByRole('tabpanel')
    // With no published statistics the CAC outcomes are the only numbers.
    expect(
      await within(panel).findByRole('heading', {
        level: 3,
        name: 'CAC outcomes behind the scene',
      }),
    ).toBeInTheDocument()
    expect(
      within(panel).queryByRole('group', { name: 'Numbers behind the scene' }),
    ).toBeNull()
    expect(
      within(panel).getByText(firstCacFigure[topic], { selector: 'strong' }),
    ).toBeInTheDocument()
    // Every figure is a CAC outcome from the 2025 workbook.
    const items = panel.querySelectorAll('.scoreboard__item')
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(item).toHaveTextContent('CAC clients · 2025')
    }
    expect(panel.querySelector('.scoreboard__source')).toHaveTextContent(
      'Source: Community Assistance Center (opens in a new tab) — Program outcomes (CAC records)',
    )
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

test('housing windows are left unmarked until a renter statistic is published', async () => {
  const user = userEvent.setup()
  renderPage()
  const scene = await screen.findByRole('img', {
    name: /No published statistic is available yet for renter households/,
  })
  expect(scene.querySelectorAll('.win--neutral')).toHaveLength(20)
  expect(scene.querySelectorAll('.win--dark')).toHaveLength(0)
  expect(scene.querySelectorAll('.win--lit')).toHaveLength(0)
  expect(screen.queryByText(/Dark with an X/)).toBeNull()
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(screen.queryByText(/Lit with a check/)).toBeNull()
})

const sandySpringsRenters = () =>
  withKey('sandy_springs_renter_cost_burden', {
    value: 44.7,
    geography: 'Sandy Springs, GA (city)',
    periodLabel: '2020–2024 ACS 5-year estimate, margin of error ±4.1',
  })
const unitedStatesRenters = () =>
  withKey('us_renter_cost_burden', {
    value: 51.8,
    geography: 'United States',
    periodLabel: '2025 ACS 1-year estimate',
  })

test('housing windows come from the published renter cost burden and relight only in CAC mode', async () => {
  const user = userEvent.setup()
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'housing' ? [sandySpringsRenters()] : [],
  )
  renderPage()
  expect(
    await screen.findByRole('img', { name: /9 of 20 windows are dark\./ }),
  ).toBeInTheDocument()
  // The exact value is shown beside the rounded picture.
  expect(screen.getByText(/Published value: 44\.7%/)).toBeInTheDocument()
  expect(
    screen.getByText(/Each window stands for 5 of every 100 households/),
  ).toHaveTextContent('Sandy Springs, GA (city) · 2020–2024 ACS 5-year')
  // One published place needs no switch, and nothing about seasons remains.
  expect(screen.queryByRole('group', { name: 'Compare places' })).toBeNull()
  expect(screen.queryByRole('group', { name: 'Season' })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(
    screen.getByRole('img', {
      name: /9 of 20 windows are dark and 4 are lit again/,
    }),
  ).toBeInTheDocument()
})

test('housing compares places on the same 20 windows', async () => {
  const user = userEvent.setup()
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'housing' ? [sandySpringsRenters(), unitedStatesRenters()] : [],
  )
  renderPage()
  const places = await screen.findByRole('group', { name: 'Compare places' })
  expect(within(places).getAllByRole('button')).toHaveLength(2)
  expect(
    screen.getByRole('img', { name: /9 of 20 windows are dark\./ }),
  ).toBeInTheDocument()
  await user.click(
    within(places).getByRole('button', { name: 'United States' }),
  )
  const scene = screen.getByRole('img', { name: /10 of 20 windows are dark\./ })
  expect(scene.querySelectorAll('.win--dark')).toHaveLength(10)
  expect(screen.getByText(/Published value: 51\.8%/)).toBeInTheDocument()
})

test('housing windows follow 0%, 50% and 100% exactly', async () => {
  for (const [value, dark] of [
    [0, 0],
    [50, 10],
    [100, 20],
  ] as const) {
    loadStatistics.mockImplementation(async (key: string) =>
      key === 'housing'
        ? [withKey('sandy_springs_renter_cost_burden', { value })]
        : [],
    )
    const { unmount } = renderPage()
    const scene = await screen.findByRole('img', {
      name: new RegExp(`${dark} of 20 windows are dark\\.`),
    })
    expect(scene.querySelectorAll('.win--dark')).toHaveLength(dark)
    unmount()
  }
})

const usGroceries = () =>
  withKey('us_food_at_home_price_change', {
    unit: 'percent_change',
    value: 1.8,
    visualization: 'figure',
    geography: 'United States',
    periodLabel: 'September 2026 compared with September 2025',
  })

test('the basket costs what it did last year until a published price change is applied', async () => {
  const user = userEvent.setup()
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'food' ? [usGroceries(), foodStatistic] : [],
  )
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Food' }))
  const scene = within(
    await screen.findByRole('region', { name: /Sample grocery basket/ }),
  )
  expect(
    scene.getByText('The same basket costs the same as last year.'),
  ).toBeInTheDocument()
  expect(scene.getAllByText('$500')).toHaveLength(2)
  // No slider and no way to remove items: only published changes apply.
  expect(screen.queryByRole('slider')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Check out' })).toBeNull()

  await user.click(
    screen.getByRole('button', { name: '+1.8% · U.S. groceries' }),
  )
  expect(scene.getByText('The same basket costs $9 more.')).toBeInTheDocument()
  expect(scene.getByText('$509')).toBeInTheDocument()
  expect(
    scene.getByText(
      'United States · September 2026 compared with September 2025',
    ),
  ).toBeInTheDocument()
})

test('price presets come only from published price changes', async () => {
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'food' ? [usGroceries(), foodStatistic] : [],
  )
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Food' }))
  expect(
    await screen.findByRole('button', { name: '+1.8% · U.S. groceries' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: '+3.6% · Atlanta area food' }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /example/ })).toBeNull()
})

test('with nothing published the only preset is last year’s prices', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Food' }))
  const group = screen.getByRole('group', {
    name: 'Apply a published price change',
  })
  expect(within(group).getAllByRole('button')).toHaveLength(1)
  expect(
    within(group).getByRole('button', { name: 'Last year’s prices' }),
  ).toBeInTheDocument()
})

test('CAC impact on Food cites the CAC households figure and changes no price', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Food' }))
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(
    screen.getByText('CAC food assistance served 2,995 households in 2025.'),
  ).toBeInTheDocument()
})

const educationStatistics = () =>
  [
    ['us_unemployment_less_than_high_school', 5.8],
    ['us_unemployment_high_school_graduates', 3.8],
    ['us_unemployment_bachelors_degree', 2.6],
    ...[
      ['us_weekly_earnings_less_than_high_school', 819],
      ['us_weekly_earnings_high_school_graduates', 993],
      ['us_weekly_earnings_bachelors_degree', 1752],
    ].map(([key, value]) => [key, value]),
  ].map(([key, value]) =>
    withKey(String(key), {
      value: Number(value),
      unit: String(key).includes('earnings') ? 'usd' : 'percent',
      visualization: String(key).includes('earnings') ? 'figure' : 'meter',
      geography: 'United States',
      periodLabel: 'October 2026',
    }),
  )

test('education levels show a published unemployment rate and weekly earnings side by side', async () => {
  const user = userEvent.setup()
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'employment' ? educationStatistics() : [],
  )
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Employment' }))
  const scene = within(
    await screen.findByRole('region', { name: /Education, unemployment/ }),
  )
  expect(
    scene.getByText(
      /5\.8% of adults without a high school diploma in the labor force are out of work\./,
    ),
  ).toBeInTheDocument()
  expect(
    scene.getByRole('img', { name: /5\.8% shown as 5\.8 of 100 icons filled/ }),
  ).toBeInTheDocument()
  // Earnings for every level stay visible so they can be compared.
  const bars = scene.getAllByRole('listitem')
  expect(bars.map((item) => item.textContent)).toEqual([
    'No high school diploma$819',
    'High school diploma$993',
    'Bachelor’s degree or higher$1,752',
  ])
  expect(bars[0]).toHaveAttribute('aria-current', 'true')

  await user.click(
    screen.getByRole('button', { name: 'Bachelor’s degree or higher' }),
  )
  expect(
    scene.getByText(
      /2\.6% of adults with a bachelor’s degree or higher in the labor force are out of work\./,
    ),
  ).toBeInTheDocument()
  expect(scene.getAllByRole('listitem')[2]).toHaveAttribute(
    'aria-current',
    'true',
  )
})

test('with no education statistics published Employment says so instead of inventing figures', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Employment' }))
  expect(
    await screen.findByText(
      'No published statistics are available yet for education and work.',
    ),
  ).toBeInTheDocument()
  expect(screen.queryByRole('group', { name: 'Highest education' })).toBeNull()
})

test('CAC impact on Employment cites CAC adult education figures', async () => {
  const user = userEvent.setup()
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'employment' ? educationStatistics() : [],
  )
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Employment' }))
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(
    screen.getByText(
      /521 students in English classes and 42 in computer classes/,
    ),
  ).toBeInTheDocument()
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
})

test('the school bus marks no riders until a child poverty statistic is published', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Youth' }))
  const bus = await screen.findByRole('img', {
    name: /No published statistic is available yet for children/,
  })
  expect(bus.querySelectorAll('.kid--need')).toHaveLength(0)
  expect(screen.queryByText(/Triangle and red ring/)).toBeNull()
  expect(screen.queryByText(/1 in 6|hunger/)).toBeNull()
})

const childPoverty = () => [
  withKey('sandy_springs_child_poverty_rate', {
    value: 10.1,
    geography: 'Sandy Springs, GA (city)',
    periodLabel: '2020–2024 ACS 5-year estimate',
  }),
  withKey('fulton_child_poverty_rate', {
    value: 12.8,
    geography: 'Fulton County, GA',
    periodLabel: '2024',
  }),
  withKey('dekalb_child_poverty_rate', {
    value: 16.6,
    geography: 'DeKalb County, GA',
    periodLabel: '2024',
  }),
]

test('school bus riders are marked from the published child poverty share and equalized with support', async () => {
  const user = userEvent.setup()
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'youth' ? [childPoverty()[0]] : [],
  )
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Youth' }))
  const bus = await screen.findByRole('img', {
    name: /2 of 18 are marked: 10\.1% of Sandy Springs, GA \(city\) children live below the poverty line/,
  })
  expect(bus.querySelectorAll('.kid--need')).toHaveLength(2)
  expect(
    screen.getByText(/Riders are marked to the nearest whole rider/),
  ).toBeInTheDocument()
  expect(screen.queryByRole('group', { name: 'Season' })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  const equal = screen.getByRole('img', {
    name: /all 18 board on equal footing/,
  })
  expect(equal.querySelectorAll('.kid__badge')).toHaveLength(2)
})

test('the bus compares published places and re-marks the riders for each', async () => {
  const user = userEvent.setup()
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'youth' ? childPoverty() : [],
  )
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Youth' }))
  const places = await screen.findByRole('group', { name: 'Compare places' })
  expect(
    within(places)
      .getAllByRole('button')
      .map((button) => button.textContent),
  ).toEqual(['Sandy Springs', 'Fulton County', 'DeKalb County'])
  await user.click(
    within(places).getByRole('button', { name: 'DeKalb County' }),
  )
  const bus = screen.getByRole('img', {
    name: /3 of 18 are marked: 16\.6% of DeKalb County, GA children/,
  })
  expect(bus.querySelectorAll('.kid--need')).toHaveLength(3)
  expect(
    screen.getByText(/3 of 18 riders are marked \(16\.6%\)/),
  ).toBeInTheDocument()
})

test('summer support cites the CAC Meals for Kids figure, not a made-up count', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Youth' }))
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(
    screen.getByText(/CAC’s Meals for Kids served 1,097 children in 2025\./),
  ).toBeInTheDocument()
  expect(screen.queryByText(/over 660|660\+/)).toBeNull()
})

const householdMoney = () => [
  withKey('us_personal_saving_rate', {
    value: 3.8,
    geography: 'United States',
    periodLabel: 'September 2026',
  }),
  withKey('us_consumer_loan_delinquency_rate', {
    value: 2.62,
    geography: 'United States (commercial banks)',
    periodLabel: 'Second quarter 2026',
    visualizationConfig: { decimals: 2 },
  }),
]

test('finances draws each published measure as a share of 100 with its exact value', async () => {
  const user = userEvent.setup()
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'finances' ? householdMoney() : [],
  )
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Finances' }))
  const scene = within(
    await screen.findByRole('region', { name: /Household money/ }),
  )
  expect(
    scene.getByText('3.8% of after-tax income is set aside instead of spent.'),
  ).toBeInTheDocument()
  expect(
    scene.getByRole('img', { name: '3.8% shown as 3.8 of 100 icons filled' }),
  ).toBeInTheDocument()
  expect(scene.getByText(/United States · September 2026/)).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Late payments' }))
  expect(
    scene.getByText(
      '2.62% of consumer loans at U.S. commercial banks are behind on payments.',
    ),
  ).toBeInTheDocument()
  expect(
    scene.getByRole('img', { name: '2.62% shown as 2.62 of 100 icons filled' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: /Explore CAC financial education/ }),
  ).toHaveAttribute('href', 'https://ourcac.org/')
})

test('finances pictograms are empty at 0% and full at 100%', async () => {
  const user = userEvent.setup()
  for (const [value, filled] of [
    [0, '0'],
    [100, '100'],
  ] as const) {
    loadStatistics.mockImplementation(async (key: string) =>
      key === 'finances' ? [withKey('us_personal_saving_rate', { value })] : [],
    )
    const { unmount } = renderPage()
    await user.click(screen.getByRole('tab', { name: 'Finances' }))
    expect(
      await screen.findByRole('img', {
        name: new RegExp(`shown as ${filled} of 100 icons filled`),
      }),
    ).toBeInTheDocument()
    unmount()
  }
})

test('finances says so when no measure is published and keeps the CAC link', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Finances' }))
  expect(
    await screen.findByText(
      'No published statistics are available yet for household money.',
    ),
  ).toBeInTheDocument()
  expect(screen.queryByRole('group', { name: 'Measure' })).toBeNull()
  expect(
    screen.getByRole('link', { name: /Explore CAC financial education/ }),
  ).toBeInTheDocument()
})

test('CAC impact on Finances cites CAC tax return preparation', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Finances' }))
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(
    screen.getByText(/prepared 590 federal tax returns in 2025/),
  ).toBeInTheDocument()
})

const zoomStatistics = (key: string) =>
  ({
    sandy_springs_poverty_rate: withKey(key, {
      value: 8.7,
      geography: 'Sandy Springs, GA (city)',
      periodLabel: '2021–2025 ACS 5-year estimate',
    }),
    sandy_springs_child_poverty_rate: withKey(key, {
      value: 10.1,
      geography: 'Sandy Springs, GA (city)',
      periodLabel: '2021–2025 ACS 5-year estimate',
    }),
    fulton_child_poverty_rate: withKey(key, {
      value: 12.8,
      geography: 'Fulton County, GA',
      periodLabel: '2024 SAIPE estimate',
    }),
    dekalb_child_poverty_rate: withKey(key, {
      value: 16.6,
      geography: 'DeKalb County, GA',
      periodLabel: '2024 SAIPE estimate',
    }),
    us_poverty_rate: withKey(key, {
      value: 11.8,
      geography: 'United States',
      periodLabel: '2025 ACS 1-year estimate',
    }),
    us_child_poverty_rate: withKey(key, {
      value: 14.8,
      geography: 'United States',
      periodLabel: '2025 ACS 1-year estimate',
    }),
  })[key]!

test('the zoom-out section is hidden when no poverty statistic is published', async () => {
  renderPage()
  await screen.findByRole('tablist')
  expect(screen.queryByRole('heading', { name: /Zoom out/ })).toBeNull()
  expect(screen.queryByText(/13\.7%|11\.1%/)).toBeNull()
})

test('the zoom-out section shows only published statistics, each with its own population', async () => {
  loadStatistics.mockImplementation(async (key: string) => {
    if (key === 'employment')
      return [
        zoomStatistics('sandy_springs_poverty_rate'),
        zoomStatistics('us_poverty_rate'),
      ]
    if (key === 'youth')
      return [
        zoomStatistics('sandy_springs_child_poverty_rate'),
        zoomStatistics('fulton_child_poverty_rate'),
        zoomStatistics('us_child_poverty_rate'),
      ]
    return []
  })
  renderPage()
  const section = (
    await screen.findByRole('heading', {
      name: 'Zoom out: poverty at different scales',
    })
  ).closest('details')!
  expect(section).not.toHaveAttribute('open')
  const cards = within(section).getAllByRole('listitem')
  // Dekalb is not published, so it is not shown; order follows the page.
  expect(cards).toHaveLength(5)
  expect(
    cards.map((card) => card.querySelector('strong')?.textContent),
  ).toEqual(['8.7%', '11.8%', '10.1%', '12.8%', '14.8%'])
  expect(
    within(section).getAllByText(/United States · 2025 ACS 1-year estimate/, {
      selector: 'p',
    }),
  ).toHaveLength(2)
  expect(within(section).queryByText('16.6%')).toBeNull()
  expect(
    within(section).getByText(/Fulton County, GA · 2024 SAIPE estimate/),
  ).toBeInTheDocument()
})

test('the zoom-out section stays hidden when statistics cannot be loaded', async () => {
  loadStatistics.mockRejectedValue(new Error('offline'))
  renderPage()
  await screen.findByRole('alert')
  expect(screen.queryByRole('heading', { name: /Zoom out/ })).toBeNull()
})

test('each topic shows its approved category name and short description', async () => {
  const user = userEvent.setup()
  renderPage()
  expect(screen.getByText('Housing & Utility Security')).toBeInTheDocument()
  expect(
    screen.getByText(
      'Rent and utility bills arrive whether or not the money does.',
    ),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('tab', { name: 'Finances' }))
  expect(
    screen.getByText('Financial Literacy & Tax Credits'),
  ).toBeInTheDocument()
  expect(
    screen.getByText('Saving and borrowing show how tight household money is.'),
  ).toBeInTheDocument()
  expect(screen.getByRole('tabpanel')).toHaveAccessibleDescription(
    'Saving and borrowing show how tight household money is.',
  )
})

test('category wording from the database replaces the built-in copy', async () => {
  const published: ExplorerCategorySummary[] = [
    {
      key: 'housing',
      name: 'Housing and Utilities (staff wording)',
      shortLabel: 'Housing',
      description: 'Staff-approved housing description.',
      iconKey: 'house',
      displayOrder: 1,
      visualizationType: 'housing_windows',
      statisticCount: 0,
    },
  ]
  loadCategories.mockResolvedValue(published)
  renderPage()
  expect(
    await screen.findByText('Staff-approved housing description.'),
  ).toBeInTheDocument()
  expect(
    screen.getByText('Housing and Utilities (staff wording)'),
  ).toBeInTheDocument()
  // Tabs and scenes are unchanged.
  expect(screen.getAllByRole('tab')).toHaveLength(6)
})

test('the page still works when the database cannot be reached', async () => {
  loadCategories.mockRejectedValue(new Error('offline'))
  renderPage()
  expect(
    await screen.findByText(
      'Rent and utility bills arrive whether or not the money does.',
    ),
  ).toBeInTheDocument()
  expect(screen.getAllByRole('tab')).toHaveLength(6)
})

test('published statistics appear in their topic with value, source, and calculation', async () => {
  const user = userEvent.setup()
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'food' ? [foodStatistic] : [],
  )
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Food' }))
  const heading = await screen.findByRole('heading', {
    level: 3,
    name: 'Latest published statistics',
  })
  const section = heading.closest('section')!
  expect(
    within(section).getByText('+3.6%', { selector: 'strong' }),
  ).toBeInTheDocument()
  expect(
    within(section).getByText(
      /Atlanta-Sandy Springs-Roswell, GA \(metro area\) · August 2026 compared with August 2025/,
    ),
  ).toBeInTheDocument()
  expect(within(section).getByText(/How it is calculated:/)).toBeInTheDocument()
  expect(
    within(section).getByRole('link', {
      name: /Federal Reserve Bank of St\. Louis/,
    }),
  ).toHaveAttribute('href', 'https://fred.stlouisfed.org/')
  // The CAC outcomes stay one click away, and statistics do not leak into
  // other topics.
  await user.click(screen.getByRole('button', { name: 'CAC outcomes' }))
  expect(
    screen.getByRole('heading', {
      level: 3,
      name: 'CAC outcomes behind the scene',
    }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('tab', { name: 'Housing' }))
  expect(screen.queryByText('Latest published statistics')).toBeNull()
})

test('a statistics failure shows Retry and leaves the rest of the topic usable', async () => {
  const user = userEvent.setup()
  let foodCalls = 0
  loadStatistics.mockImplementation(async (key: string) => {
    if (key !== 'food') return []
    foodCalls += 1
    if (foodCalls === 1) throw new Error('down')
    return [foodStatistic]
  })
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Food' }))
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent(
    'Live statistics could not be loaded right now.',
  )
  // The CAC outcomes and the interactive scene are still there.
  expect(
    screen.getByRole('group', { name: 'Apply a published price change' }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'CAC outcomes' }))
  expect(
    screen.getByRole('heading', {
      level: 3,
      name: 'CAC outcomes behind the scene',
    }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Community data' }))
  await user.click(
    within(screen.getByRole('alert')).getByRole('button', { name: 'Retry' }),
  )
  expect(
    await screen.findByText('+3.6%', { selector: 'strong' }),
  ).toBeInTheDocument()
})

test('selecting a topic requests only that topic and returning to another topic works by keyboard', async () => {
  const user = userEvent.setup()
  renderPage()
  screen.getByRole('tab', { name: 'Housing' }).focus()
  await user.keyboard('{ArrowRight}')
  await user.keyboard('{ArrowLeft}')
  expect(screen.getByRole('tab', { name: 'Housing' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  const requested = loadStatistics.mock.calls.map((call) => call[0])
  expect(requested).toContain('food')
  expect(requested.filter((key) => key === 'clothing')).toHaveLength(0)
})

test('the numbers follow the view, and a choice made there is kept', async () => {
  const user = userEvent.setup()
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'food' ? [foodStatistic] : [],
  )
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Food' }))
  const community = { level: 3, name: 'Latest published statistics' }
  const cac = { level: 3, name: 'CAC outcomes behind the scene' }
  expect(await screen.findByRole('heading', community)).toBeInTheDocument()
  expect(screen.queryByRole('heading', cac)).toBeNull()
  expect(
    screen.getByRole('button', { name: 'Community data' }),
  ).toHaveAttribute('aria-pressed', 'true')

  // The impact view brings up CAC's outcomes.
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(screen.getByRole('heading', cac)).toBeInTheDocument()
  expect(screen.queryByRole('heading', community)).toBeNull()

  // Choosing a set explicitly overrides the view and is kept.
  await user.click(screen.getByRole('button', { name: 'Community data' }))
  expect(screen.getByRole('heading', community)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Explore challenges' }))
  await user.click(screen.getByRole('button', { name: 'See CAC impact' }))
  expect(screen.getByRole('heading', community)).toBeInTheDocument()
})

test('statistics show three at a time and Previous and Next reach every one', async () => {
  const user = userEvent.setup()
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'housing'
      ? ['a', 'b', 'c', 'd'].map((letter) => withKey(`stat_${letter}`))
      : [],
  )
  renderPage()
  expect(await screen.findByText('Live stat_a')).toBeInTheDocument()
  expect(screen.getByText('Live stat_c')).toBeInTheDocument()
  expect(screen.queryByText('Live stat_d')).toBeNull()
  expect(screen.getByText('1–3 of 4')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Previous numbers' }),
  ).toBeDisabled()

  await user.click(screen.getByRole('button', { name: 'Next numbers' }))
  expect(screen.getByText('Live stat_d')).toBeInTheDocument()
  expect(screen.queryByText('Live stat_a')).toBeNull()
  expect(screen.getByText('4–4 of 4')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Next numbers' })).toBeDisabled()

  await user.click(screen.getByRole('button', { name: 'Previous numbers' }))
  expect(screen.getByText('Live stat_a')).toBeInTheDocument()
})

test('three or fewer statistics need no paging controls', async () => {
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'housing' ? [withKey('only_one')] : [],
  )
  renderPage()
  expect(await screen.findByText('Live only_one')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Next numbers' })).toBeNull()
})

test('the details behind a statistic are available but tucked away', async () => {
  loadStatistics.mockImplementation(async (key: string) =>
    key === 'food' ? [foodStatistic] : [],
  )
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByRole('tab', { name: 'Food' }))
  const more = (await screen.findByText('About this number')).closest(
    'details',
  )!
  expect(more).not.toHaveAttribute('open')
  expect(more).toHaveTextContent(foodStatistic.description)
  expect(more).toHaveTextContent('Federal Reserve Bank of St. Louis')
})

test('Next opens the following topic, focuses its stop, and marks visited topics', async () => {
  const user = userEvent.setup()
  renderPage()
  const housing = screen.getByRole('tab', { name: 'Housing' })
  expect(housing).not.toHaveAttribute('data-visited')

  await user.click(screen.getByRole('button', { name: 'Next: Food' }))
  expect(screen.getByRole('tab', { name: 'Food' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(screen.getByRole('tab', { name: 'Food' })).toHaveFocus()
  expect(housing).toHaveAttribute('data-visited', 'true')
  expect(
    screen.getByRole('button', { name: 'Next: Employment' }),
  ).toBeInTheDocument()

  // The last topic offers a way back to the start instead of a dead end.
  await user.click(screen.getByRole('tab', { name: 'Finances' }))
  await user.click(screen.getByRole('button', { name: 'Back to Housing' }))
  expect(screen.getByRole('tab', { name: 'Housing' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(screen.queryByRole('button', { name: /^Next:/ })).not.toBeNull()
})

test('the view switch and topic path keep their accessible roles', () => {
  renderPage()
  expect(screen.getByRole('tablist', { name: 'Topics' })).toBeInTheDocument()
  expect(screen.getByRole('group', { name: 'View' })).toHaveAttribute(
    'data-mode',
    'challenge',
  )
})
