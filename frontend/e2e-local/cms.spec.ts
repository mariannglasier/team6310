import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// Explicit private local fixture, never a hosted account. See docs/cms-stage1.md.
test('CMS draft creation, scenario persistence, reopening and mobile layout', async ({
  page,
}, testInfo) => {
  const path = process.env.CMS_BROWSER_FIXTURE
  test.skip(!path, 'Set CMS_BROWSER_FIXTURE to a private local staff fixture')
  const fixture = JSON.parse(readFileSync(path!, 'utf8'))
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (
      !['http://127.0.0.1:4175', 'http://127.0.0.1:55321'].includes(url.origin)
    )
      return route.abort()
    return route.continue()
  })
  await page.goto('/admin/login')
  await page.getByLabel(/^Work email/).fill(fixture.email)
  await page.getByLabel(/^Password/).fill(fixture.password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await page
    .getByRole('button', { name: 'Switch to Editor', exact: true })
    .click()
  const name = `CMS browser review ${Date.now()}`
  await page.getByRole('button', { name: 'Create new draft' }).click()
  await page.getByLabel(/^Draft name/).fill(name)
  await page.getByRole('button', { name: 'Create draft', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'New scenario', exact: true }).click()
  await page.getByLabel(/^Scenario title/).fill('A new household decision')
  await page
    .getByLabel(/^Scenario description/)
    .fill('A saved scenario description for interface review.')
  const category = page.getByRole('combobox', {
    name: 'Category',
    exact: true,
  })
  await category.selectOption({ index: 1 })
  await page.getByLabel(/^Persona applicability/).selectOption({ index: 1 })
  await page.getByLabel(/^Schedule type/).selectOption('scheduled')
  await page.getByLabel(/^Default day/).fill('11')
  await page.getByRole('button', { name: 'Add choice', exact: true }).click()
  const choiceCard = page.locator('.cms-choice').last()
  const up = await choiceCard
    .getByRole('button', { name: /Move choice .* up/ })
    .boundingBox()
  const remove = await choiceCard
    .getByRole('button', { name: /Remove choice/ })
    .boundingBox()
  expect(up!.x).toBeLessThan(remove!.x)
  await page.getByText('New choice', { exact: true }).click()
  expect(
    await choiceCard
      .getByRole('button', { name: /Move choice .* up/ })
      .boundingBox(),
  ).toEqual(up)
  expect(
    await choiceCard
      .getByRole('button', { name: /Remove choice/ })
      .boundingBox(),
  ).toEqual(remove)

  const scenarioForm = page.getByRole('form', {
    name: 'Scenario editor',
    exact: true,
  })
  await expect(scenarioForm.locator('.ui-required-legend')).toHaveText(
    '* is a required field',
  )
  await expect(
    scenarioForm.locator('.cms-save-status > :last-child'),
  ).toHaveClass('ui-required-legend')
  await expect(
    scenarioForm
      .locator('label')
      .filter({ hasText: 'Scenario title' })
      .locator('.ui-required-marker'),
  ).toHaveCSS('color', 'rgb(179, 38, 30)')
  expect(await scenarioForm.textContent()).not.toContain('(required)')
  await page.getByRole('button', { name: 'About Choices', exact: true }).click()
  await expect(page.getByRole('note')).toContainText(
    'Gameplay currently orders choices by ID',
  )
  await page.keyboard.press('Escape')
  await page.getByLabel(/^Choice 1 text/).fill('Pay the expense')
  await page.getByLabel(/^Choice 1 response/).fill('The expense is paid.')
  await page.getByLabel(/^Balance change \(USD\)/).fill('-5')
  const beforeHelp = await page
    .getByLabel(/^Scenario description/)
    .boundingBox()
  await page.getByRole('button', { name: 'About upfront_cost' }).click()
  expect(await page.getByLabel(/^Scenario description/).boundingBox()).toEqual(
    beforeHelp,
  )
  await page.getByRole('button', { name: 'About upfront_cost' }).press('Escape')
  await page.getByRole('button', { name: 'About upfront_cost' }).click()
  await expect(page.getByRole('note')).toContainText(
    'not an additional deduction',
  )
  await page.getByRole('button', { name: 'Add general fact' }).click()
  await page.getByText('General supporting copy', { exact: true }).click()
  await page
    .getByRole('button', { name: 'About general fact text', exact: true })
    .click()
  await expect(page.getByRole('note')).toContainText(
    'without unresolved {placeholders}',
  )
  await page.keyboard.press('Escape')
  await page
    .getByLabel(/^general fact text/, { exact: false })
    .fill('A supporting scenario fact.')
  await page
    .getByLabel(/^general source URL/, { exact: false })
    .fill('https://example.org/scenario-source')
  await page.getByLabel(/^general reporting period/).fill('2026')
  await page.getByText('General supporting copy', { exact: true }).click()
  await expect(
    page.getByLabel(/^general fact text/, { exact: false }),
  ).not.toBeVisible()
  await page.getByText('General supporting copy', { exact: true }).click()
  await expect(
    page.getByLabel(/^general fact text/, { exact: false }),
  ).toHaveValue('A supporting scenario fact.')
  const generalCard = page
    .locator('.cms-fact')
    .filter({ hasText: 'General supporting copy' })
  await expect(generalCard).toHaveCSS('background-color', 'rgb(220, 235, 249)')
  await page
    .getByRole('checkbox', { name: /Eligible for gameplay display/ })
    .check()
  await page.getByRole('button', { name: 'Add cac fact' }).click()
  await page.getByText('CAC impact supporting copy', { exact: true }).click()
  await page
    .getByRole('button', { name: 'About cac fact text', exact: true })
    .click()
  await expect(page.getByRole('note')).toContainText('CAC impact')
  await page.keyboard.press('Escape')
  await page.getByText('CAC impact supporting copy', { exact: true }).click()
  const cacCard = page
    .locator('.cms-fact')
    .filter({ hasText: 'CAC impact supporting copy' })
  await expect(cacCard).toHaveCSS('background-color', 'rgb(230, 234, 220)')
  await page.setViewportSize({ width: 390, height: 844 })
  const cacSummary = cacCard.locator('summary').first()
  await cacSummary.focus()
  await cacSummary.press('Enter')
  await expect(
    page.getByLabel(/^cac fact text/, { exact: false }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await cacSummary.press('Enter')
  await expect(
    page.getByLabel(/^cac fact text/, { exact: false }),
  ).not.toBeVisible()
  await page.setViewportSize({ width: 1280, height: 900 })

  await page
    .getByRole('checkbox', { name: /Eligible for gameplay display/ })
    .uncheck()
  await expect(cacCard).toHaveCSS('background-color', 'rgb(220, 235, 249)')
  await page.getByRole('button', { name: 'Remove cac scenario fact' }).click()
  await page.getByRole('button', { name: 'Remove fact', exact: true }).click()

  await expect(
    page.getByRole('checkbox', { name: /Eligible for gameplay display/ }),
  ).not.toBeChecked()
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click()
  await expect(
    page.getByText('Saved and reloaded from the database.'),
  ).toBeVisible()
  await page.reload()
  await page
    .getByRole('button', { name: 'Switch to Editor', exact: true })
    .click()
  await page.getByRole('button', { name, exact: true }).click()
  await page
    .getByRole('searchbox', { name: 'Search scenarios', exact: true })
    .fill('A new household decision')
  await page.getByRole('button', { name: /^A new household decision/ }).click()
  await page.getByText('General supporting copy', { exact: true }).click()
  await expect(page.getByLabel(/^Scenario description/)).toHaveValue(
    'A saved scenario description for interface review.',
  )
  await expect(
    page.getByLabel(/^general fact text/, { exact: false }),
  ).toHaveValue('A supporting scenario fact.')
  await expect(
    page.getByRole('checkbox', { name: /Eligible for gameplay display/ }),
  ).not.toBeChecked()
  await page
    .getByLabel(/^general fact text/, { exact: false })
    .fill('Edited supporting fact.')
  await page
    .getByRole('checkbox', { name: /Eligible for gameplay display/ })
    .check()
  await page.getByLabel(/^Scenario title/).fill('An edited household decision')
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click()
  await expect(
    page.getByText('Saved and reloaded from the database.'),
  ).toBeVisible()
  await page
    .getByRole('searchbox', { name: 'Search scenarios', exact: true })
    .fill('')
  await page.getByRole('button', { name: 'Switch to Viewer' }).click()
  await page.getByRole('button', { name: 'Switch to Editor' }).click()
  await expect(page.getByLabel(/^Scenario title/)).toHaveValue(
    'An edited household decision',
  )
  await page.reload()
  await page.getByRole('button', { name: 'Switch to Editor' }).click()
  await page.getByRole('button', { name, exact: true }).click()
  await page
    .getByRole('button', { name: /^An edited household decision/ })
    .click()
  await page.getByText('General supporting copy', { exact: true }).click()
  await expect(
    page.getByLabel(/^general fact text/, { exact: false }),
  ).toHaveValue('Edited supporting fact.')
  await expect(
    page.getByRole('checkbox', { name: /Eligible for gameplay display/ }),
  ).toBeChecked()
  await page
    .getByRole('button', { name: 'Remove general scenario fact' })
    .click()
  await expect(
    page.getByRole('dialog', { name: 'Remove scenario fact?' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Remove fact', exact: true }).click()
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click()
  await expect(
    page.getByText('Saved and reloaded from the database.'),
  ).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Switch to Editor' }).click()
  await page.getByRole('button', { name, exact: true }).click()
  await page
    .getByRole('button', { name: /^An edited household decision/ })
    .click()
  await expect(
    page.getByRole('button', { name: 'Add general fact' }),
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('cms-desktop.png'),
    fullPage: true,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  const choicesHelp = page.getByRole('button', {
    name: 'About Choices',
    exact: true,
  })
  await choicesHelp.scrollIntoViewIfNeeded()
  await choicesHelp.focus()
  await page.keyboard.press('Enter')
  const helpBox = await page.getByRole('note').boundingBox()
  expect(helpBox!.x).toBeGreaterThanOrEqual(0)
  expect(helpBox!.x + helpBox!.width).toBeLessThanOrEqual(390)
  await page.keyboard.press('Escape')

  await expect(page.getByLabel(/^Scenario description/)).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('cms-mobile.png'),
    fullPage: true,
  })
  await page
    .getByRole('button', {
      name: 'Delete scenario An edited household decision',
      exact: true,
    })
    .click()
  await expect(
    page.getByRole('dialog', { name: 'Delete scenario?' }),
  ).toContainText('An edited household decision')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByLabel(/^Scenario title/)).toHaveValue(
    'An edited household decision',
  )
  await page
    .getByRole('button', {
      name: 'Delete scenario An edited household decision',
      exact: true,
    })
    .click()
  await page
    .getByRole('button', { name: 'Delete scenario', exact: true })
    .click()
  await expect(page.getByText('Scenario deleted.')).toBeVisible()
  await expect(
    page.getByRole('button', {
      name: 'Delete scenario An edited household decision',
      exact: true,
    }),
  ).toHaveCount(0)
  await page
    .getByRole('button', { name: `Delete ${name}`, exact: true })
    .click()
  await expect(
    page.getByRole('dialog', { name: 'Delete draft?' }),
  ).toContainText(name)
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  await page
    .getByRole('button', { name: `Delete ${name}`, exact: true })
    .click()
  await page.getByRole('button', { name: 'Delete draft', exact: true }).click()
  await expect(page.getByText('Draft deleted.')).toBeVisible()
  await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0)
})
