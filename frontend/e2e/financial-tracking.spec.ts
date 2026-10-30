import { expect, test } from '@playwright/test'

test('financial panels follow the approved layout and stay readable at every viewport', async ({
  page,
}, testInfo) => {
  const api = 'http://127.0.0.1:54321'
  const user = {
    id: 'owner',
    is_anonymous: true,
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2026-10-30T12:00:00Z',
  }
  const persona = {
    persona_id: 'persona',
    version_id: 'version',
    name: 'Alex',
    description: 'Alex — Finding His Footing. Looking for work.',
    general_starting_balance: 350,
    weekly_income: 0,
    starting_job_id: null,
  }
  let inserts = 0
  await page.route(`${api}/**`, async (route) => {
    const url = route.request().url()
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
    }
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers })
    let body: unknown = []
    if (url.includes('/auth/v1/signup')) {
      const payload = Buffer.from(
        JSON.stringify({
          sub: 'owner',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64url')
      body = {
        access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`,
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user,
      }
    } else if (url.includes('/auth/v1/user')) body = user
    else if (url.includes('/rpc/start_individual_playthrough')) {
      body = 'run'
      inserts++
    } else if (url.includes('/content_versions'))
      body = [{ version_id: 'version', version_number: 1 }]
    else if (url.includes('/playthrough_expenses')) body = []
    else if (url.includes('/persona_expenses')) {
      expect(url).toContain('persona_id=eq.persona')
      expect(url).toContain('version_id=eq.version')
      body = [
        {
          expense_id: 'utilities',
          name: 'Utilities',
          amount: 75,
          first_due_day: 14,
        },
        { expense_id: 'rent', name: 'Rent', amount: 500, first_due_day: 4 },
      ]
    } else if (url.includes('/playthroughs'))
      body = [
        {
          playthrough_id: 'run',
          persona_id: 'persona',
          version_id: 'version',
          owner_user_id: 'owner',
          current_scenario_id: null,
          current_balance: 350,
          current_day: 2,
          cac_support_enabledabled: null,
          status: 'active',
          started_at: null,
          session_id: null,
          current_job_id: null,
          employment_state: null,
        },
      ]
    else if (url.includes('/personas')) body = [persona]
    await route.fulfill({
      status: 200,
      headers,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
  await page.goto('/simulation/individual')
  await page.getByText('Choose this household').first().click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Confirm selection' }).click()
  await expect(page).toHaveURL(/\/simulation$/)
  await expect(page.getByText('$350.00', { exact: true })).toBeVisible()
  await expect(page.getByText('Day 2 of 30')).toBeVisible()
  const expenses = page.getByRole('complementary', {
    name: 'Upcoming household expenses',
  })
  await expect(expenses.getByRole('listitem').first()).toContainText('Rent')
  await expect(expenses.getByRole('listitem').nth(1)).toContainText('Utilities')
  await expenses.scrollIntoViewIfNeeded()
  await expect(expenses.getByText('$500.00')).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(0)
  const boxes = await page.evaluate(() => {
    const box = (selector: string) => {
      const r = document.querySelector(selector)!.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width }
    }
    return {
      left: box('.finance-sidebar'),
      main: box('.finance-main'),
      right: box('.finance-right'),
    }
  })
  if (testInfo.project.name === 'desktop') {
    expect(boxes.left.x).toBeLessThan(boxes.main.x)
    expect(boxes.main.x).toBeLessThan(boxes.right.x)
  } else if (testInfo.project.name === 'tablet') {
    expect(boxes.left.x).toBeLessThan(boxes.main.x)
    expect(Math.abs(boxes.main.x - boxes.right.x)).toBeLessThan(2)
  } else {
    expect(Math.abs(boxes.left.x - boxes.right.x)).toBeLessThan(2)
    expect(boxes.right.y).toBeGreaterThan(boxes.left.y)
  }
  expect(inserts).toBe(1)
  await page.screenshot({ path: testInfo.outputPath('financial-tracking.png') })
})
