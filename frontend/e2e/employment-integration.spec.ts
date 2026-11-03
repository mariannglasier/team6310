import {
  createWalkthrough,
  walkthroughJobs,
  walkthroughReducer,
  type Walkthrough,
} from '../src/state/employmentWalkthrough'
import { usdCents, type Job } from '../src/types/domain'
import { expect, test } from '@playwright/test'

test('integrated employment keeps saved finances and supports a full local month and CAC replay', async ({
  page,
}, testInfo) => {
  test.setTimeout(60000)
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
    has_english_skills: false,
    has_computer_skills: false,
  }
  const jobs: Job[] = ['First job', 'Second job', 'Office job'].map(
    (title, i) => ({
      id: `j${i}`,
      versionId: 'version',
      title,
      description: 'Test posting',
      socCode: '00-0000',
      hoursPerWeek: 40,
      medianHourlyWage: usdCents(1000),
      weeklyGrossIncome: usdCents(40000),
      wageYear: 2025,
      areaName: 'Test',
      wageSourceUrl: 'https://www.bls.gov/',
      requirementsNote: null,
      needsEnglishSkills: i === 2,
      needsComputerSkills: i === 2,
    }),
  )
  let gameplay: Walkthrough | null = null
  let doc: Record<string, unknown> = {
    engine: 'employment-v1',
    schemaVersion: 1,
    revision: 0,
    stage: 'uninitialized',
    receipts: {},
  }
  let revision = 0
  let inserts = 0
  const savedRow = () => ({
    playthrough_id: `run-${inserts}`,
    persona_id: 'persona',
    version_id: 'version',
    owner_user_id: 'owner',
    current_balance: gameplay ? gameplay.balance / 100 : 200,
    current_day: gameplay ? Math.max(1, gameplay.day) : 1,
    cac_support_enabledabled: gameplay?.support ?? null,
    status:
      gameplay?.stage === 'complete'
        ? 'completed'
        : gameplay?.stage === 'ended'
          ? 'ended'
          : 'active',
    current_job_id: gameplay?.hiredDay ? gameplay.targetId : null,
    employment_state: doc,
    current_scenario_id: null,
    started_at: null,
    session_id: null,
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
      expect(route.request().postDataJSON()).toEqual({
        p_persona_id: 'persona',
      })
      body = `run-${inserts + 1}`
      inserts++
      gameplay = null
      revision = 0
      doc = {
        engine: 'employment-v1',
        schemaVersion: 1,
        revision: 0,
        stage: 'uninitialized',
        receipts: {},
      }
    } else if (url.includes('/rpc/submit_employment_action')) {
      const payload = route.request().postDataJSON()
      if (payload.p_action.type === 'initialize')
        gameplay = createWalkthrough(
          {
            id: 'persona',
            versionId: 'version',
            name: 'Alex',
            description: 'Test',
            startingBalance: usdCents(20000),
            hasEnglishSkills: false,
            hasComputerSkills: false,
          },
          walkthroughJobs(jobs),
          !!payload.p_action.replayOf,
          usdCents(6000),
        )
      else if (gameplay)
        gameplay = walkthroughReducer(gameplay, payload.p_action)
      revision++
      if (!gameplay) throw new Error('No server state')
      doc = {
        stage: gameplay.stage,
        prepared: gameplay.prepared,
        hasEnglishSkills: gameplay.hasEnglishSkills,
        hasComputerSkills: gameplay.hasComputerSkills,
        clothing: gameplay.clothing,
        targetId: gameplay.targetId,
        initialTargetId: gameplay.initialTargetId,
        hiredDay: gameplay.hiredDay,
        assistanceUsed: gameplay.assistanceUsed,
        reason: gameplay.reason,
        engine: 'employment-v1',
        schemaVersion: 1,
        revision,
        receipts: {},
        weeklyIncome: (gameplay.weeklyIncome / 100).toFixed(2),
        creditedDays: [],
        history: gameplay.history.map((e) => ({
          ...e,
          change: (e.change / 100).toFixed(2),
        })),
      }
      body = { run: savedRow(), receipt: { revision } }
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
    } else if (url.includes('/playthroughs')) body = [savedRow()]
    else if (url.includes('/jobs'))
      body = ['First job', 'Second job', 'Office job'].map((title, i) => ({
        job_id: `j${i}`,
        version_id: 'version',
        title,
        description: 'Test posting',
        soc_code: '00-0000',
        hours_per_week: 40,
        median_hourly_wage: 10,
        weekly_gross_income: 400,
        wage_year: 2025,
        area_name: 'Test',
        wage_source_url: 'https://www.bls.gov/',
        needs_english_skills: i === 2,
        needs_computer_skills: i === 2,
      }))
    else if (url.includes('/personas')) body = [persona]
    if (url.includes('/rest/v1/') && !url.includes('/rpc/'))
      expect(route.request().method()).toBe('GET')
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
  const setupPreview = async () => {
    await page
      .getByRole('button', { name: 'Start employment walkthrough' })
      .click()
    await expect(page.getByText('Before Day 1', { exact: true })).toBeVisible()
  }
  const apply = async (title: string) => {
    await page
      .getByRole('radio', { name: `Choose ${title}`, exact: true })
      .check()
    await page.getByRole('button', { name: 'Submit application' }).click()
  }
  await setupPreview()
  await expect(
    page.getByRole('radio', { name: 'Choose Office job' }),
  ).toBeDisabled()
  await apply('First job')
  await page.getByRole('button', { name: 'Start Day 1' }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('radio', { name: /Buy professional clothes/ }).check()
  await expect(page.locator('.finance-balance')).toHaveText('$200.00')
  await page.getByRole('button', { name: 'Submit clothing decision' }).click()
  await expect(page.locator('.finance-balance')).toHaveText('$140.00')
  await page
    .getByRole('link', { name: 'CAC Poverty Simulation', exact: true })
    .click()
  await page.goBack()
  await expect(page.locator('.finance-balance')).toHaveText('$140.00')
  await page.reload()
  await page.getByRole('button', { name: 'Reapply today' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Day 2 of 30',
  )
  await apply('Second job')
  await page.getByRole('button', { name: 'Continue Day 2' }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByRole('radio')).toHaveCount(1)
  await page
    .getByRole('radio', { name: /Wear my professional clothes/ })
    .check()
  await page.getByRole('button', { name: 'Submit clothing decision' }).click()
  await expect(page.locator('.finance-balance')).toHaveText('$140.00')
  await page.getByRole('button', { name: 'Continue Day 3' }).click()
  for (let day = 3; day <= 30; day++) {
    if ([10, 17, 24].includes(day))
      await page
        .getByRole('button', { name: 'Continue to today’s scenarios' })
        .click()
    await page
      .getByRole('button', {
        name: day === 30 ? 'Finish Day 30' : 'Next',
        exact: true,
      })
      .click()
  }
  await expect(
    page.getByRole('heading', { name: 'You reached Day 30.' }),
  ).toBeVisible()
  await expect(page.locator('.finance-balance')).toHaveText('$1,340.00')
  await expect(
    page.getByRole('complementary', { name: 'Upcoming household expenses' }),
  ).toContainText('Rent')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect(
    await page.locator('.finance-balance').evaluate((node) => {
      const range = document.createRange()
      range.selectNodeContents(node)
      return range.getClientRects().length
    }),
  ).toBe(1)
  await page.screenshot({
    path: testInfo.outputPath('employment-complete.png'),
  })
  await page.getByRole('button', { name: 'Try again with CAC support' }).click()
  await page.getByText('Choose this household').first().click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm selection' }).click()
  await setupPreview()
  expect(inserts).toBe(2)
  await page.getByRole('button', { name: 'Complete CAC preparation' }).click()
  await page.getByRole('button', { name: 'Return to job board' }).click()
  await apply('Office job')
  await page.getByRole('button', { name: 'Start Day 1' }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('radio', { name: /Use the CAC clothing closet/ }).check()
  await page.getByRole('button', { name: 'Submit clothing decision' }).click()
  await expect(
    page.getByRole('heading', { name: 'You got the Office job job.' }),
  ).toBeVisible()
  await expect(page.locator('.finance-balance')).toHaveText('$200.00')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.getByRole('button', { name: 'End walkthrough' }).click()
  await expect(
    page.getByRole('heading', { name: 'Your walkthrough ended early.' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Your walkthrough ended early.' }),
  ).toBeVisible()
  expect(inserts).toBe(2)
})
