import { expect, test } from '@playwright/test'

for (const width of [1280, 320]) {
  test(`local persistent scenario ${width}px survives reload and lost response`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.route('**/*', (route) => {
      const origin = new URL(route.request().url()).origin
      return ['http://127.0.0.1:4175', 'http://127.0.0.1:55321'].includes(
        origin,
      )
        ? route.continue()
        : route.abort()
    })
    let submissions = 0
    await page.route(
      '**/rest/v1/rpc/submit_scenario_decision',
      async (route) => {
        submissions++
        await route.fetch() // Server commits; browser loses only the response.
        await route.abort()
      },
    )
    await page.goto('/simulation?localScenario=day4')
    await page.getByRole('button', { name: 'Start local scenario run' }).click()
    await expect(
      page.getByLabel('Current balance $200.00', { exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: /Gain \$25.00/ }).click()
    await expect(
      page.getByLabel('Current balance $200.00', { exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Submit decision' }).click()
    await expect(
      page.getByText('Decision recorded', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByLabel('Current balance $225.00', { exact: true }),
    ).toBeVisible()
    await page.reload()
    await expect(
      page.getByText('Decision recorded', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Submit decision' }),
    ).toBeDisabled()
    await expect(
      page.getByText('Your household received $25.00.', { exact: true }),
    ).toBeVisible()
    expect(submissions).toBe(1)
  })
}
