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
  await page.getByRole('button', { name: 'Start simulation' }).click()
  await expect(page).toHaveURL(/\/simulation$/)
  expect(inserts).toBe(1)
  await expect(page.locator('.finance-balance')).toHaveText('$350.00')
  await expect(page.getByText('Playthrough ID:', { exact: false })).toHaveCount(
    0,
  )
  await expect(page.getByText('Status: active')).toHaveCount(0)
  const expenses = page.getByRole('complementary', {
    name: 'Upcoming household expenses',
  })
  await expect(expenses.getByRole('listitem').first()).toContainText('Rent')
  await expect(expenses.getByRole('listitem').nth(1)).toContainText('Utilities')
  const widths: Record<string, number[]> = {
    desktop: [1440, 1366, 1151],
    tablet: [1150, 1024, 768, 761],
    mobile: [760, 600, 481],
    'narrow-mobile': [480, 390, 320],
  }
  for (const width of widths[testInfo.project.name]) {
    await page.setViewportSize({ width, height: 900 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    for (const selector of [
      '.finance-balance',
      '.finance-content',
      '.finance-sidebar',
      '.finance-right',
    ]) {
      const box = await page.locator(selector).boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)
    }
    await page.screenshot({
      path: testInfo.outputPath('financial-tracking-' + width + '.png'),
    })
  }
})
