import { existsSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

for (const width of [1280, 320]) {
  test(`real local employment ${width}px: committed recaps, lost response, completion, CAC replay and participant isolation`, async ({
    page,
    browser,
  }) => {
    test.setTimeout(120000)
    page.setDefaultTimeout(10000)
    await page.setViewportSize({ width, height: 900 })
    test.skip(
      !existsSync('/tmp/team6310-phase2-verification/fixture.json'),
      'Run the local schema/API verifier first',
    )
    const forbidden: string[] = []
    await page.route('**/*', (route) => {
      const origin = new URL(route.request().url()).origin
      if (
        !['http://127.0.0.1:4175', 'http://127.0.0.1:55321'].includes(origin)
      ) {
        forbidden.push(origin)
        return route.abort()
      }
      return route.continue()
    })
    const setup = async (p: Page) => {
      await p.goto('/simulation/individual')
      await p.getByText('Choose this household').first().click()
      await p.getByRole('button', { name: 'Continue', exact: true }).click()
      await p.getByRole('button', { name: 'Confirm selection' }).click()
      await expect(
        p.getByRole('button', { name: 'Start employment walkthrough' }),
      ).toBeVisible()
    }
    const apply = async (title: string) => {
      await page
        .getByRole('radio', { name: `Choose ${title}`, exact: true })
        .check()
      await page.getByRole('button', { name: 'Submit application' }).click()
    }
    const restore = async (heading: string) => {
      await expect(
        page.getByRole('heading', { name: heading, exact: true }),
      ).toBeVisible()
      await page.reload()
      await expect(
        page.getByRole('heading', { name: heading, exact: true }),
      ).toBeVisible()
    }
    await setup(page)
    const id = (await page.locator('.finance-run-id').textContent())!.match(
      /[a-f0-9-]{36}/,
    )![0]
    await page
      .getByRole('button', { name: 'Start employment walkthrough' })
      .click()
    await apply('Local first job')
    await restore('Your application is in.')
    await page.getByRole('button', { name: 'Start Day 1' }).click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.getByRole('radio', { name: /Buy professional clothes/ }).check()
    await expect(page.locator('.finance-balance')).toHaveText('$200.00')
    // Forward to the real backend, allow commitment, then drop only the response.
    await page.route(
      '**/rpc/submit_employment_action',
      async (route) => {
        await route.fetch()
        await route.abort()
      },
      { times: 1 },
    )
    await page.getByRole('button', { name: 'Submit clothing decision' }).click()
    await expect(
      page.getByRole('button', { name: 'Reconcile pending submission' }),
    ).toBeVisible()
    await page.reload()
    await page
      .getByRole('button', { name: 'Reconcile pending submission' })
      .click()
    await expect(page.locator('.finance-balance')).toHaveText('$140.00')
    await page.getByRole('button', { name: 'Reapply today' }).click()
    await apply('Local fallback job')
    await restore('Your follow-up application is in.')
    await page.getByRole('button', { name: 'Continue Day 2' }).click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page
      .getByRole('radio', { name: /Wear my professional clothes/ })
      .check()
    await page.getByRole('button', { name: 'Submit clothing decision' }).click()
    await restore('Your interview result.')
    await expect(page.locator('.finance-balance')).toHaveText('$140.00')
    await page.getByRole('button', { name: 'Continue Day 3' }).click()
    for (let day = 3; day <= 30; day++) {
      if ([10, 17, 24].includes(day)) {
        await restore('Your weekly pay has arrived.')
        await page
          .getByRole('button', { name: 'Continue to today’s scenarios' })
          .click()
      }
      await page
        .getByRole('button', {
          name: day === 30 ? 'Finish Day 30' : 'Next',
          exact: true,
        })
        .click()
    }
    await restore('You reached Day 30.')
    await expect(page.locator('.finance-balance')).toHaveText('$1,340.00')
    await expect(
      page.getByRole('complementary', { name: 'Upcoming household expenses' }),
    ).toContainText('Local rent')
    await page
      .getByRole('button', { name: 'Try again with CAC support' })
      .click()
    await page.getByText('Choose this household').first().click()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await page.getByRole('button', { name: 'Confirm selection' }).click()
    await page
      .getByRole('button', { name: 'Start employment walkthrough' })
      .click()
    await page.getByRole('button', { name: 'Complete CAC preparation' }).click()
    await restore('Your preparation is complete.')
    await page.getByRole('button', { name: 'Return to job board' }).click()
    await apply('Local office job')
    await page.getByRole('button', { name: 'Start Day 1' }).click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page
      .getByRole('radio', { name: /Use the CAC clothing closet/ })
      .check()
    await page.getByRole('button', { name: 'Submit clothing decision' }).click()
    await expect(page.getByText(/First payday: Day 9/)).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'End walkthrough' }),
    ).toHaveCount(0)
    await restore('Your interview result.')
    const context = await browser.newContext()
    const second = await context.newPage()
    await setup(second)
    await second.evaluate((foreignId) => {
      const authKey = Object.keys(localStorage).find((k) =>
        k.endsWith('-auth-token'),
      )!
      const owner = JSON.parse(localStorage.getItem(authKey)!).user.id
      localStorage.setItem(`cac-employment-v1:${owner}:run`, foreignId)
    }, id)
    await second.reload()
    await expect(second.getByRole('alert')).toContainText(
      'missing or is not accessible',
    )
    await context.close()
    expect(forbidden).toEqual([])
  })
}
