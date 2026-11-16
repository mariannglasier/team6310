import { expect, test } from '@playwright/test'

test('Give Up placement, cancellation, fresh termination, refresh, and replay', async ({
  page,
}, testInfo) => {
  const api = 'http://127.0.0.1:54321'
  const user = {
    id: 'owner',
    is_anonymous: true,
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2026-11-12T00:00:00Z',
  }
  const persona = {
    persona_id: 'persona',
    version_id: 'edition',
    name: 'Alex',
    description: 'A synthetic test household.',
    general_starting_balance: 200,
    has_english_skills: false,
    has_computer_skills: false,
  }
  let creates = 0
  let ends = 0
  let initializes = 0
  let status = 'active'
  let document: Record<string, unknown> = {
    engine: 'employment-v1',
    schemaVersion: 1,
    stage: 'uninitialized',
    revision: 0,
    receipts: {},
  }
  const row = () => ({
    playthrough_id: 'run',
    persona_id: 'persona',
    version_id: 'edition',
    owner_user_id: 'owner',
    current_balance: 200,
    current_day: 1,
    current_job_id: null,
    current_scenario_id: null,
    cac_support_enabledabled: null,
    employment_state: document,
    status,
    session_id: null,
    started_at: '2026-11-12T00:00:00Z',
  })
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
      creates++
      body = 'run'
    } else if (url.includes('/rpc/get_bill_snapshot'))
      body = {
        run: row(),
        bills: [
          {
            playthrough_expense_id: 'bill',
            playthrough_id: 'run',
            version_id: 'edition',
            name_snapshot: 'Scheduled rent',
            amount_due: 50,
            late_fee_amount: 10,
            due_day: 9,
            ignored_at: null,
            paid_at: null,
            paid_day: null,
            payment_balance_after: null,
          },
        ],
        paid_total: 0,
        overdue_total: 0,
        outstanding_total: 0,
        upcoming_total: 50,
        scenario_income: 0,
        scenario_charged: 0,
      }
    else if (url.includes('/rpc/submit_employment_action')) {
      const args = route.request().postDataJSON()
      if (args.p_action.type === 'initialize') initializes++
      expect(args.p_action).toEqual({ type: 'end' })
      expect(args.p_revision).toBe(0)
      ends++
      status = 'ended'
      document = {
        ...document,
        stage: 'ended',
        revision: 1,
        reason: 'You ended the walkthrough.',
        receipts: {
          [args.p_request_id]: {
            action: { type: 'end' },
            expectedRevision: 0,
            revision: 1,
            day: 1,
            change: '0',
            stage: 'ended',
          },
        },
      }
      body = { run: row() }
    } else if (url.includes('/content_versions'))
      body = [{ version_id: 'edition', version_number: 1 }]
    else if (url.includes('/personas')) body = [persona]
    else if (url.includes('/playthroughs')) body = [row()]
    await route.fulfill({
      status: 200,
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  })
  await page.goto('/simulation/individual')
  await page.getByRole('button', { name: /^Choose Alex/ }).click()
  await page.getByRole('button', { name: 'Start simulation' }).click()
  await expect(
    page.getByRole('button', { name: "See who's hiring" }),
  ).toBeVisible()
  const giveUp = page.getByRole('button', { name: 'Give Up', exact: true })
  await expect(giveUp).toBeEnabled()
  await expect(giveUp).toHaveClass(/ui-button--primary/)
  const action = (await giveUp.boundingBox())!
  const sidebar = (await page.locator('.finance-sidebar').boundingBox())!
  const main = (await page.locator('.finance-main').boundingBox())!
  const right = (await page.locator('.finance-right').boundingBox())!
  if (page.viewportSize()!.width > 760) {
    expect(Math.abs(action.x - sidebar.x)).toBeLessThan(2)
    expect(action.y).toBeGreaterThanOrEqual(sidebar.y + sidebar.height)
    expect(action.x + action.width).toBeLessThanOrEqual(main.x)
  } else {
    expect(action.y).toBeGreaterThanOrEqual(main.y + main.height)
    expect(action.y).toBeGreaterThanOrEqual(right.y + right.height)
  }
  await page.screenshot({
    path: testInfo.outputPath('give-up-active.png'),
    fullPage: true,
  })
  await giveUp.click()
  const dialog = page.getByRole('dialog', { name: 'Give Up?' })
  await expect(dialog).toHaveAccessibleDescription(
    'Are you sure you want to give up on this simulation?',
  )
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.screenshot({
    path: testInfo.outputPath('give-up-confirmation.png'),
    fullPage: true,
  })
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(giveUp).toBeFocused()
  expect(ends).toBe(0)
  expect(status).toBe('active')
  await giveUp.click()
  await dialog.getByRole('button', { name: 'Give Up', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Simulation ended early.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Simulation results' }),
  ).toContainText('Before Day 1')
  expect(ends).toBe(1)
  expect(initializes).toBe(0)
  expect(Object.keys(document).sort()).toEqual([
    'engine',
    'reason',
    'receipts',
    'revision',
    'schemaVersion',
    'stage',
  ])
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Simulation ended early.' }),
  ).toBeVisible()
  expect(ends).toBe(1)
  await expect(
    page.getByRole('button', { name: 'Replay from household selection' }),
  ).toBeEnabled()
  await expect(
    page.getByRole('region', { name: 'Simulation results' }),
  ).toHaveCSS('opacity', '1')
  await page.screenshot({
    path: testInfo.outputPath('give-up-result.png'),
    fullPage: true,
  })
  await page
    .getByRole('button', { name: 'Replay from household selection' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Every household has a story.' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Every household has a story.' }),
  ).toBeVisible()
  expect(creates).toBe(1)
  expect(
    await page.evaluate(() =>
      localStorage.getItem('cac-employment-v1:owner:run'),
    ),
  ).toBeNull()
})
