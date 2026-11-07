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
  const jobs: Job[] = [
    'First job',
    'Second job',
    'Office job',
    'Customer service representative',
    'Food preparation worker',
    'Retail sales associate',
    'Office administrative assistant',
    'Computer user support specialist',
  ].map((title, i) => ({
    id: `j${i}`,
    versionId: 'version',
    title,
    description:
      'Assist customers with purchases, answer questions, organize merchandise, and keep the work area clean. Work with coworkers and follow daily procedures throughout each shift.',
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
  }))
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
      body = jobs.map((job, i) => ({
        job_id: `j${i}`,
        version_id: 'version',
        title: job.title,
        description: job.description,
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
  await page.getByRole('button', { name: 'Start simulation' }).click()
  const setupPreview = async () => {
    await page.getByRole('button', { name: "See who's hiring" }).click()
    await expect(
      page.getByRole('heading', { name: 'Find your next opportunity.' }),
    ).toBeVisible()
  }
  const apply = async (title: string) => {
    await page
      .getByRole('button', { name: `Choose ${title}`, exact: true })
      .click()
    await page.getByRole('button', { name: 'Submit application' }).click()
  }
  await setupPreview()
  const checkBoardReadability = async (name: string) => {
    if (testInfo.project.name !== 'desktop') return
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport)
      const descriptions = page.locator('.employment-posting__description')
      await expect(descriptions).toHaveCount(jobs.length)
      for (const description of await descriptions.all()) {
        expect(
          await description.evaluate(
            (node) =>
              node.scrollHeight <= node.clientHeight + 1 &&
              node.scrollWidth <= node.clientWidth + 1,
          ),
        ).toBe(true)
      }
      await page
        .getByRole('button', { name: 'Submit application' })
        .scrollIntoViewIfNeeded()
      await page.screenshot({
        path: testInfo.outputPath(`${name}-${viewport.width}.png`),
      })
    }
    await page.setViewportSize({ width: 1366, height: 768 })
  }
  await checkBoardReadability('job-board')
  await expect(
    page.getByRole('button', { name: 'Choose Office job' }),
  ).toBeDisabled()
  await apply('First job')
  await page.getByRole('button', { name: 'Start Day 1' }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: /Buy professional clothes/ }).click()
  await expect(page.locator('.finance-balance')).toHaveText('$200.00')
  await page.getByRole('button', { name: 'Submit clothing decision' }).click()
  await expect(page.locator('.finance-balance')).toHaveText('$140.00')
  await page
    .getByRole('link', { name: 'CAC Poverty Simulation', exact: true })
    .click()
  await page.goBack()
  await expect(page.locator('.finance-balance')).toHaveText('$140.00')
  await page.reload()
  if (testInfo.project.name === 'desktop') {
    const action = await page
      .getByRole('button', { name: 'Search open jobs' })
      .boundingBox()
    expect(action!.y + action!.height).toBeLessThanOrEqual(768)
  }
  await page.getByRole('button', { name: 'Search open jobs' }).click()
  await expect(
    page.getByRole('heading', { level: 1, includeHidden: true }),
  ).toHaveText('Day 2 of 30')
  await expect(
    page.getByRole('button', { name: 'Choose First job' }),
  ).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Choose Office job' }),
  ).toBeDisabled()
  await apply('Second job')
  await page.getByRole('button', { name: 'Continue to Day 3' }).click()
  await expect(
    page.getByRole('button', { name: /Wear my professional clothes/ }),
  ).toBeEnabled()
  await page
    .getByRole('button', { name: /Wear my professional clothes/ })
    .click()
  await page.getByRole('button', { name: 'Submit clothing decision' }).click()
  await expect(page.locator('.finance-balance')).toHaveText('$140.00')
  await page.getByRole('button', { name: 'Continue to Day 4' }).click()
  await page.locator('.finance-timeline').scrollIntoViewIfNeeded()
  const paydayMarkers = page.getByRole('img', { name: /^Payday on Day/ })
  await expect(paydayMarkers).toHaveCount(3)
  for (const marker of await paydayMarkers.all()) {
    expect(
      await marker.evaluate((node) => {
        const circle = node.parentElement!.getBoundingClientRect()
        const icon = node.getBoundingClientRect()
        const text = document.createRange()
        text.selectNodeContents(node)
        const glyph = text.getBoundingClientRect()
        return (
          Math.abs(icon.x + icon.width / 2 - circle.x - circle.width / 2) <=
            1 &&
          Math.abs(icon.y + icon.height / 2 - circle.y - circle.height / 2) <=
            1 &&
          glyph.left >= circle.left &&
          glyph.right <= circle.right &&
          glyph.top >= circle.top &&
          glyph.bottom <= circle.bottom &&
          Number(getComputedStyle(node).opacity) === 1 &&
          getComputedStyle(node).color === 'rgb(255, 255, 255)' &&
          getComputedStyle(node.parentElement!).backgroundColor ===
            'rgb(181, 9, 53)' &&
          node.parentElement!.textContent?.trim() === '$'
        )
      }),
    ).toBe(true)
  }
  await page.screenshot({ path: testInfo.outputPath('payday-markers.png') })
  for (let day = 4; day <= 30; day++) {
    await expect(
      page.locator('.finance-timeline [aria-current="step"]'),
    ).toHaveText(String(day))
    if ([10, 17, 24].includes(day)) {
      await expect(
        page.getByText('+$400.00 received', { exact: true }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: /Continue to today/ }),
      ).toHaveCount(0)
    }
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
      range.selectNodeContents(node.querySelector('span') ?? node)
      return range.getClientRects().length
    }),
  ).toBe(1)
  await page.screenshot({
    path: testInfo.outputPath('employment-complete.png'),
  })
  await page.getByRole('button', { name: 'Try again with CAC support' }).click()
  await page.getByText('Choose this household').first().click()
  await page.getByRole('button', { name: 'Start simulation' }).click()
  await setupPreview()
  expect(inserts).toBe(2)
  await expect(page.locator('.employment-preparation p')).toHaveText(
    'The CAC offers a variety of adult education programs. English as a Second or Other Language classes or computer skills classes could help you be more qualified for jobs.',
  )
  await expect(page.locator('.employment-preparation summary')).toHaveCount(0)
  await checkBoardReadability('cac-preparation-board')
  await page
    .getByRole('button', { name: 'Join CAC Adult Education classes' })
    .click()
  await page.getByRole('button', { name: 'Return to job board' }).click()
  await checkBoardReadability('cac-job-board')
  await apply('Office job')
  await page.getByRole('button', { name: 'Start Day 1' }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page
    .getByRole('button', { name: /Use the CAC clothing closet/ })
    .click()
  await page.getByRole('button', { name: 'Submit clothing decision' }).click()
  await expect(
    page.getByRole('heading', { name: 'You got the Office job job.' }),
  ).toBeVisible()
  await expect(page.locator('.finance-balance')).toHaveText('$200.00')
  await page.getByRole('button', { name: 'Continue to Day 3' }).click()
  await expect(
    page.locator('.finance-timeline [aria-current="step"]'),
  ).toHaveText('3')
  await expect(page.getByRole('heading', { name: 'Placeholder' })).toBeVisible()
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
