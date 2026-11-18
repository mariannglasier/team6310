import { expect, test, type Page } from '@playwright/test'

const topics = [
  'Housing',
  'Food',
  'Employment',
  'Clothing',
  'Youth',
  'Finances',
]

const api = 'http://127.0.0.1:54321'

function statisticRow(
  key: string,
  value: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    statistic_key: key,
    title: `Published ${key}`,
    description: 'What the published statistic measures.',
    context_note: null,
    value,
    value_high: null,
    unit: 'percent',
    geography: 'Sandy Springs, GA (city)',
    geography_code: null,
    period_label: '2020–2024 ACS 5-year estimate, margin of error ±1.0',
    source_name: 'U.S. Census Bureau',
    source_title: 'American Community Survey',
    source_url: 'https://www.census.gov/',
    last_checked_at: null,
    visualization_type: 'meter',
    visualization_config: {},
    is_derived: false,
    derivation_note: null,
    display_order: 1,
    ...overrides,
  }
}

// Published statistics, so the scenes are checked in their data-backed state.
const published: Record<string, unknown[]> = {
  housing: [statisticRow('sandy_springs_renter_cost_burden', 44.7)],
  food: [
    statisticRow('us_food_at_home_price_change', 1.8, {
      unit: 'percent_change',
      visualization_type: 'figure',
      geography: 'United States',
    }),
  ],
  employment: [
    statisticRow('sandy_springs_poverty_rate', 8.5),
    statisticRow('us_unemployment_less_than_high_school', 5.8, {
      geography: 'United States',
      period_label: 'October 2026',
    }),
    statisticRow('us_unemployment_high_school_graduates', 3.8, {
      geography: 'United States',
      period_label: 'October 2026',
    }),
    statisticRow('us_weekly_earnings_less_than_high_school', 819, {
      unit: 'usd',
      visualization_type: 'figure',
      geography: 'United States',
      period_label: 'Third quarter 2026',
    }),
    statisticRow('us_weekly_earnings_high_school_graduates', 993, {
      unit: 'usd',
      visualization_type: 'figure',
      geography: 'United States',
      period_label: 'Third quarter 2026',
    }),
  ],
  finances: [
    statisticRow('us_personal_saving_rate', 3.8, {
      geography: 'United States',
      period_label: 'September 2026',
    }),
    statisticRow('us_consumer_loan_delinquency_rate', 2.62, {
      geography: 'United States (commercial banks)',
      period_label: 'Second quarter 2026',
      visualization_config: { decimals: 2 },
    }),
  ],
  youth: [
    statisticRow('sandy_springs_child_poverty_rate', 10.1),
    statisticRow('fulton_child_poverty_rate', 12.8, {
      geography: 'Fulton County, GA',
    }),
  ],
}

async function mockExplorerApi(page: Page) {
  await page.route(`${api}/**`, async (route) => {
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
    }
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers })
    const url = route.request().url()
    let body: unknown = []
    if (url.includes('/rpc/get_explorer_category_statistics')) {
      const args = route.request().postDataJSON() as { p_category_key: string }
      body = published[args.p_category_key] ?? []
    } else if (url.includes('/auth/v1/signup')) {
      const payload = Buffer.from(
        JSON.stringify({
          sub: 'visitor',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64url')
      body = {
        access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`,
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'visitor',
          is_anonymous: true,
          aud: 'authenticated',
          role: 'authenticated',
          created_at: '2026-11-12T00:00:00Z',
        },
      }
    }
    return route.fulfill({
      status: 200,
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  })
}

test('Explore Data topics fit the viewport in both modes without console errors', async ({
  page,
}) => {
  await mockExplorerApi(page)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/data')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Explore our community',
  )
  for (const topic of topics) {
    await page.getByRole('tab', { name: topic }).click()
    for (const mode of ['Explore challenges', 'See CAC impact']) {
      await page.getByRole('button', { name: mode }).click()
      const layout = await page.evaluate(() => {
        const panel = document.querySelector<HTMLElement>('.stage__panel')!
        const bounds = panel.getBoundingClientRect()
        return {
          pageOverflow:
            document.documentElement.scrollWidth > window.innerWidth,
          panelOverflow: panel.scrollWidth > panel.clientWidth,
          escaping: [...panel.querySelectorAll('*')]
            .filter((element) => !element.closest('.belt'))
            .filter((element) => {
              const box = element.getBoundingClientRect()
              return (
                box.width > 0 &&
                (box.right > bounds.right + 1 || box.left < bounds.left - 1)
              )
            }).length,
        }
      })
      expect(layout, `${topic} / ${mode}`).toEqual({
        pageOverflow: false,
        panelOverflow: false,
        escaping: 0,
      })
    }
  }
  expect(errors).toEqual([])
})

test('Explore Data tabs work from the keyboard', async ({ page }) => {
  await mockExplorerApi(page)
  await page.goto('/data')
  await page.getByRole('tab', { name: 'Housing' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Food' })).toBeFocused()
  await expect(
    page.getByRole('heading', { level: 2, name: 'Stretch a grocery budget' }),
  ).toBeVisible()
})
