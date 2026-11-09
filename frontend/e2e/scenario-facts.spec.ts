import { expect, test } from '@playwright/test'

for (const support of [false, true])
  test(`recap fact cards in ${support ? 'CAC' : 'regular'} mode`, async ({
    page,
  }, testInfo) => {
    const api = 'http://127.0.0.1:54321'
    const user = {
      id: 'owner',
      is_anonymous: true,
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2026-11-08T12:00:00Z',
    }
    const persona = {
      persona_id: 'persona',
      version_id: 'version',
      name: 'Alex',
      description: 'Synthetic visual fixture',
      general_starting_balance: 250,
      weekly_income: 0,
      starting_job_id: null,
    }
    const run = {
      playthrough_id: 'run',
      persona_id: 'persona',
      version_id: 'version',
      owner_user_id: 'owner',
      current_balance: 1772,
      current_day: 3,
      cac_support_enabledabled: support,
      status: 'active',
      current_job_id: 'job',
      current_scenario_id: null,
      started_at: null,
      session_id: null,
      employment_state: {
        engine: 'employment-v1',
        schemaVersion: 1,
        revision: 1,
        stage: 'day',
        receipts: {},
        prepared: false,
        hasEnglishSkills: false,
        hasComputerSkills: false,
        clothing: 'none',
        targetId: 'job',
        initialTargetId: 'first',
        hiredDay: 3,
        weeklyIncome: '400.00',
        assistanceUsed: false,
        history: [],
        creditedDays: [],
        reason: null,
      },
    }
    const bills = [
      {
        playthrough_expense_id: 'overdue',
        playthrough_id: 'run',
        version_id: 'version',
        name_snapshot: 'Rent',
        amount_due: 50,
        late_fee_amount: 5,
        due_day: 2,
        ignored_at: '2026-11-08T12:00:00Z',
        paid_at: null,
        paid_day: null,
        payment_balance_after: null,
      },
      {
        playthrough_expense_id: 'due',
        playthrough_id: 'run',
        version_id: 'version',
        name_snapshot: 'Utilities',
        amount_due: 20,
        late_fee_amount: 2,
        due_day: 3,
        ignored_at: '2026-11-08T12:00:00Z',
        paid_at: null,
        paid_day: null,
        payment_balance_after: null,
      },
      {
        playthrough_expense_id: 'future',
        playthrough_id: 'run',
        version_id: 'version',
        name_snapshot: 'Phone',
        amount_due: 10,
        late_fee_amount: 1,
        due_day: 9,
        ignored_at: null,
        paid_at: null,
        paid_day: null,
        payment_balance_after: null,
      },
    ]
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
      else if (url.includes('/rpc/start_individual_playthrough')) body = 'run'
      else if (url.includes('/rpc/get_bill_snapshot'))
        body = {
          run,
          bills,
          paid_total: 0,
          overdue_total: 55,
          outstanding_total: 75,
          upcoming_total: 10,
          scenario_income: 0,
          scenario_charged: 0,
        }
      else if (url.includes('/rpc/get_event_recap_facts'))
        body = [
          {
            scenario_id: 'scenario',
            version_id: 'version',
            fact_role: 'general',
            semantic_key: 'energy:cost',
            display_text:
              'Some households face difficult choices when energy bills arrive.',
            source_url: 'https://www.eia.gov/',
          },
          ...(support
            ? [
                {
                  scenario_id: 'scenario',
                  version_id: 'version',
                  fact_role: 'cac',
                  semantic_key: 'cac:housing',
                  display_text:
                    'CAC helps households maintain housing stability.',
                  source_url: 'https://www.ourcac.org/',
                },
              ]
            : []),
        ]
      else if (url.includes('/content_versions'))
        body = [{ version_id: 'version', version_number: 1 }]
      else if (url.includes('/playthroughs')) body = [run]
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
    await expect(
      page.getByText(
        'Some households face difficult choices when energy bills arrive.',
      ),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'CAC impact' })).toHaveCount(
      support ? 1 : 0,
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await expect(
      page.getByRole('link', { name: 'Source', exact: true }),
    ).toHaveCount(0)
    const balance = page.locator('.finance-balance')
    await expect(balance).toHaveText('$1,772.00')
    expect(
      await balance.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true)
    const factsBox = await page
      .getByLabel('Scenario facts', { exact: true })
      .boundingBox()
    const nextButton = await page
      .getByRole('button', { name: 'Continue to next day' })
      .boundingBox()
    expect(nextButton!.y).toBeGreaterThanOrEqual(factsBox!.y + factsBox!.height)
    await page.screenshot({
      path: testInfo.outputPath('recap-facts.png'),
      fullPage: true,
    })
  })
