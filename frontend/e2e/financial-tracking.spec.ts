import { readFileSync } from 'node:fs'
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

  await expect(page.getByText('Your playthrough has been loaded.')).toHaveCount(
    0,
  )
  await expect(
    page.getByRole('heading', { name: 'Individual simulation' }),
  ).toHaveCount(0)
  // Compare the actual layout against a minimal shell rendered with the source
  // Figma CSS, including both sides of every gameplay breakpoint.
  const reference = await page.context().newPage()
  const sourceCss = readFileSync(
    new URL(
      '../../design/figma-prototype/src/game-session.css',
      import.meta.url,
    ),
    'utf8',
  )
  const themeCss = readFileSync(
    new URL('../../design/figma-prototype/src/setup-flow.css', import.meta.url),
    'utf8',
  )
  await reference.setContent(`<style>*{box-sizing:border-box}body{margin:0}.setup-flow{--setup-heading-size:48px}${themeCss}${sourceCss}</style>
    <main class="setup-main game-session setup-flow">
      <div class="play-top"><h1>Day 2 of 30</h1></div>
      <ol class="play-timeline">${Array.from({ length: 30 }, (_, i) => `<li><span>${i + 1}</span></li>`).join('')}</ol>
      <div class="play-layout">
        <aside class="play-sidebar"><div class="play-household"><span class="setup-mini-avatar"></span><h2>Alex</h2></div><div class="play-status"><strong>$350.00</strong></div></aside>
        <div class="play-main"><div class="play-box"><div class="play-content">Placeholder</div></div></div>
        <aside class="play-right"><section>Upcoming expenses</section></aside>
      </div>
    </main>`)
  const widths: Record<string, number[]> = {
    desktop: [1440, 1151],
    tablet: [1150, 1024, 768, 761],
    mobile: [760, 600, 481],
    'narrow-mobile': [480, 390, 320],
  }
  for (const width of widths[testInfo.project.name]) {
    await page.setViewportSize({ width, height: 1000 })
    await reference.setViewportSize({ width, height: 1000 })
    const actual = await page.evaluate(() => {
      const style = (s: string) => getComputedStyle(document.querySelector(s)!)
      const box = (s: string) => {
        const r = document.querySelector(s)!.getBoundingClientRect()
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom }
      }
      const panel = document.querySelector('.stage__panel')!
      return {
        columns: style('.finance-layout').gridTemplateColumns,
        gap: style('.finance-layout').gap,
        timelineColumns: style('.finance-timeline').gridTemplateColumns,
        timelineGap: style('.finance-timeline').rowGap,
        circle: style('.finance-timeline span').width,
        padding: style('.finance-content').padding,
        sidebarPadding: style('.finance-sidebar').padding,
        upcomingColumns: style('.finance-right').gridTemplateColumns,
        left: box('.finance-sidebar'),
        main: box('.stage__panel'),
        right: box('.finance-right'),
        top: box('.finance-top'),
        timeline: box('.finance-timeline'),
        overflow: document.documentElement.scrollWidth - innerWidth,
        nested: [
          ...document.querySelectorAll('.simulation-page, .simulation-page *'),
        ].filter((el) =>
          ['auto', 'scroll'].includes(getComputedStyle(el).overflowY),
        ).length,
        panelOverflow: getComputedStyle(panel).overflowY,
        descendants:
          panel.contains(document.querySelector('.finance-sidebar')) ||
          panel.contains(document.querySelector('.finance-right')) ||
          panel.contains(document.querySelector('.finance-top')) ||
          panel.contains(document.querySelector('.finance-timeline')),
      }
    })
    const expected = await reference.evaluate(() => {
      const style = (s: string) => getComputedStyle(document.querySelector(s)!)
      return {
        columns: style('.play-layout').gridTemplateColumns,
        gap: style('.play-layout').gap,
        timelineColumns: style('.play-timeline').gridTemplateColumns,
        timelineGap: style('.play-timeline').rowGap,
        circle: style('.play-timeline span').width,
        padding: style('.play-content').padding,
        sidebarPadding: style('.play-sidebar').padding,
        upcomingColumns: style('.play-right').gridTemplateColumns,
      }
    })
    for (const key of Object.keys(expected) as (keyof typeof expected)[])
      expect(actual[key], `${width}px ${key}`).toBe(expected[key])
    expect(
      actual.overflow,
      `${width}px horizontal overflow`,
    ).toBeLessThanOrEqual(0)
    expect(actual.nested, `${width}px nested scrolling`).toBe(0)
    expect(actual.panelOverflow).toBe('visible')
    expect(actual.descendants).toBe(false)
    expect(actual.top.bottom).toBeLessThanOrEqual(actual.timeline.y)
    expect(actual.timeline.bottom).toBeLessThanOrEqual(actual.left.y)
    if (width > 1150) {
      expect(actual.left.right).toBeLessThanOrEqual(actual.main.x)
      expect(actual.main.right).toBeLessThanOrEqual(actual.right.x)
    } else if (width > 760) {
      expect(actual.left.right).toBeLessThanOrEqual(actual.main.x)
      expect(actual.right.y).toBeGreaterThanOrEqual(actual.main.bottom)
      expect(actual.main.x).toBe(actual.right.x)
    } else {
      expect(actual.left.bottom).toBeLessThanOrEqual(actual.main.y)
      expect(actual.main.bottom).toBeLessThanOrEqual(actual.right.y)
      expect(actual.main.x).toBe(actual.right.x)
    }
    await page.getByText('$350.00', { exact: true }).scrollIntoViewIfNeeded()
    await expect(page.getByText('$350.00', { exact: true })).toBeVisible()
    await expenses.scrollIntoViewIfNeeded()
    await expect(expenses.getByText('$500.00')).toBeVisible()
    await page.screenshot({
      path: testInfo.outputPath(`financial-tracking-${width}.png`),
      fullPage: true,
    })
  }
  // Long future stage content must extend the page rather than create a scroller.
  await page.locator('.finance-content').evaluate((element) => {
    const content = document.createElement('div')
    content.style.height = '1800px'
    content.textContent = 'Long stage content for layout verification'
    element.append(content)
  })
  const naturalFlow = await page.evaluate(() => {
    const panel = document.querySelector('.stage__panel')!
    return {
      height: panel.clientHeight,
      scrollHeight: panel.scrollHeight,
      documentHeight: document.documentElement.scrollHeight,
      viewport: innerHeight,
    }
  })
  expect(naturalFlow.height).toBeGreaterThanOrEqual(1800)
  expect(naturalFlow.scrollHeight - naturalFlow.height).toBeLessThanOrEqual(1)
  expect(naturalFlow.documentHeight).toBeGreaterThan(naturalFlow.viewport)
  await reference.close()
  expect(inserts).toBe(1)
})
