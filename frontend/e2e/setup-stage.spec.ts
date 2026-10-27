import { expect, test, type Page } from '@playwright/test'

const api = 'http://127.0.0.1:54321'
const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
}
const persona = (
  id: string,
  name: string,
  tagline: string,
  balance: number,
) => ({
  persona_id: id,
  version_id: 'version-1',
  name,
  description: `${name} — ${tagline}. Age 30; single, no dependents. ${name} lives in a shared apartment and is looking for employment and has limited money to fall back on. What you will need to consider: rent, transportation, groceries, everyday expenses, job-search costs, and how qualifications can affect opportunities. Starts unemployed.`,
  general_starting_balance: balance,
  weekly_income: 0,
  starting_job_id: null,
})

// Serves approved households locally so layout checks do not depend on a
// deployed database.
async function mockHouseholds(page: Page) {
  await page.route(`${api}/**`, (route) => {
    const request = route.request()
    if (request.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers: cors })
    const url = request.url()
    const body = url.includes('/content_versions')
      ? [{ version_id: 'version-1', version_number: 1 }]
      : url.includes('/personas')
        ? [
            persona('p1', 'Alex', 'Finding His Footing', 350),
            persona('p2', 'Jordan & Maya', 'A Parent Rebuilding', 850),
            persona('p3', 'Patricia', 'Starting Over', 1200),
            persona('p4', 'Sofia', 'Years of Experience', 600),
          ]
        : []
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: cors,
      body: JSON.stringify(body),
    })
  })
}

test('simulation pages show the scenic stage between the header and footer', async ({
  page,
}) => {
  await mockHouseholds(page)
  for (const path of ['/simulation/individual', '/simulation/results']) {
    await page.goto(path)
    await page.evaluate(() => document.fonts.ready)
    const layout = await page.evaluate(() => {
      const box = (selector: string) =>
        document.querySelector(selector)!.getBoundingClientRect()
      const background = (selector: string) =>
        getComputedStyle(document.querySelector(selector)!).backgroundImage
      return {
        header: box('header'),
        main: box('main'),
        panel: box('.stage__panel'),
        footer: box('footer'),
        mainImage: background('main'),
        headerImage: background('header'),
        footerImage: background('footer'),
        panelBackground: getComputedStyle(
          document.querySelector('.stage__panel')!,
        ).backgroundColor,
        overflowX: document.documentElement.scrollWidth - innerWidth,
        viewport: innerHeight,
      }
    })
    expect(layout.mainImage).toContain('scenic-simulation-background')
    expect(layout.headerImage).toBe('none')
    expect(layout.footerImage).toBe('none')
    expect(layout.header.bottom).toBeLessThanOrEqual(layout.main.top + 0.5)
    expect(layout.main.bottom).toBeLessThanOrEqual(layout.footer.top + 0.5)
    // The stage ends at the bottom of the first screen; the footer is below it.
    expect(layout.main.bottom).toBeLessThanOrEqual(layout.viewport + 0.5)
    // The white panel is inset so the scenery shows around it.
    expect(layout.panel.left).toBeGreaterThan(layout.main.left)
    expect(layout.panel.right).toBeLessThan(layout.main.right)
    expect(layout.panel.top).toBeGreaterThan(layout.main.top)
    expect(layout.panel.bottom).toBeLessThan(layout.main.bottom)
    expect(layout.panelBackground).toBe('rgb(255, 255, 255)')
    expect(layout.overflowX).toBeLessThanOrEqual(0)
  }
})

test('household and review fit the screen on desktop and tablet and stay inside it on phones', async ({
  page,
}, testInfo) => {
  await mockHouseholds(page)
  await page.goto('/simulation/individual')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.household-card').first()).toBeVisible()

  const fit = () =>
    page.evaluate(() => {
      const panel = document.querySelector('.stage__panel') as HTMLElement
      return {
        panelOverflow: panel.scrollHeight - panel.clientHeight,
        overflowX: document.documentElement.scrollWidth - innerWidth,
        bottom: document.querySelector('main')!.getBoundingClientRect().bottom,
        viewport: innerHeight,
      }
    })
  const roomy = ['desktop', 'tablet'].includes(testInfo.project.name)

  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS(
    'text-align',
    'center',
  )
  await page.waitForTimeout(400)
  let measured = await fit()
  expect(measured.overflowX).toBeLessThanOrEqual(0)
  expect(measured.bottom).toBeLessThanOrEqual(measured.viewport + 0.5)
  await page.screenshot({ path: testInfo.outputPath('household.png') })
  if (roomy)
    await expect
      .poll(async () => (await fit()).panelOverflow, { timeout: 5000 })
      .toBeLessThanOrEqual(2)

  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  await page.locator('.is-center .household-choice').click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page).toHaveURL(/\/simulation\/review$/)
  await expect(
    page.getByRole('heading', { name: 'Review your setup.' }),
  ).toBeFocused()
  await expect(page.getByText('CAC support')).toHaveCount(0)
  await expect(page.getByText('$350.00')).toBeVisible()
  await page.waitForTimeout(400)
  measured = await fit()
  expect(measured.overflowX).toBeLessThanOrEqual(0)
  expect(measured.bottom).toBeLessThanOrEqual(measured.viewport + 0.5)
  if (roomy)
    await expect
      .poll(async () => (await fit()).panelOverflow, { timeout: 5000 })
      .toBeLessThanOrEqual(2)
  await page.screenshot({ path: testInfo.outputPath('review.png') })

  await page.getByRole('link', { name: 'Change household' }).click()
  await expect(page).toHaveURL(/\/simulation\/individual$/)
  await expect(page.getByRole('radio', { name: /Alex/ })).toBeChecked()
})
