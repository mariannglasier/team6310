import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test('Persona details use shared drafts, preserve expenses, save/reopen, and protect unsaved and stale edits', async ({
  page,
}, testInfo) => {
  const path = process.env.CMS_BROWSER_FIXTURE
  test.skip(!path, 'Set CMS_BROWSER_FIXTURE to a private local staff fixture')
  const fixture = JSON.parse(readFileSync(path!, 'utf8'))
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    return ['http://127.0.0.1:4175', 'http://127.0.0.1:55321'].includes(
      url.origin,
    )
      ? route.continue()
      : route.abort()
  })
  await page.goto('/admin/login')
  await page.getByLabel('Work email').fill(fixture.email)
  await page.getByLabel('Password').fill(fixture.password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await page
    .getByRole('button', { name: 'Switch to Editor', exact: true })
    .click()
  const name = `Persona browser ${Date.now()}`
  let draft: string | undefined
  let auth: Record<string, string> | undefined
  try {
    await page
      .getByRole('button', { name: 'Create new draft', exact: true })
      .click()
    await page.getByLabel('Draft name', { exact: false }).fill(name)
    const created = page.waitForResponse((r) =>
      r.url().endsWith('/rpc/cms_read_draft'),
    )
    await page
      .getByRole('button', { name: 'Create draft', exact: true })
      .click()
    const initial = await (await created).json()
    draft = initial.workspace.version_id
    const requestHeaders = (await created).request().headers()
    auth = {
      apikey: requestHeaders.apikey,
      authorization: requestHeaders.authorization,
    }
    const sourceBefore = await page.request.get(
      `http://127.0.0.1:55321/rest/v1/personas?version_id=eq.${initial.workspace.source_version}&select=*`,
      { headers: auth },
    )
    expect(sourceBefore.ok()).toBeTruthy()
    const sourcePersonas = await sourceBefore.json()
    await page.getByRole('tab', { name: /^Personas/ }).click()
    const library = page.getByRole('region', {
      name: 'Persona library',
      exact: true,
    })
    const original = initial.personas[0]
    expect(original).toBeTruthy()
    await library
      .getByRole('button', {
        name: `${original.name} Starting balance`,
        exact: false,
      })
      .click()
    const current = page.getByLabel('Persona name', { exact: false })
    await expect(current).toHaveValue(original.name)
    await expect(page.getByText('Weekly income · Read-only')).toBeVisible()
    await expect(
      page.getByRole('textbox', { name: /Weekly income|Starting job/ }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', {
        name: /Add expense|Remove expense|Delete expense/,
      }),
    ).toHaveCount(0)
    const editedName = `${original.name} CMS review`
    await current.fill(editedName)
    await page
      .getByLabel('Persona description')
      .fill('An explicitly authored persona description.')
    await page
      .getByLabel('Starting balance (USD)', { exact: false })
      .fill('321.09')
    await page
      .getByLabel('English skills', { exact: false })
      .selectOption('yes')
    await page
      .getByLabel('Computer skills', { exact: false })
      .selectOption('no')
    await page.getByRole('button', { name: 'New persona', exact: true }).click()
    await expect(
      page.getByRole('dialog', { name: 'Discard unsaved changes?' }),
    ).toBeVisible()
    await page
      .getByRole('button', { name: 'Keep editing', exact: true })
      .click()
    await expect(current).toHaveValue(editedName)
    await page.getByRole('tab', { name: /^Scenarios/ }).click()
    await page
      .getByRole('button', { name: 'Keep editing', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Switch to Viewer', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Switch to Editor', exact: true })
      .click()
    await expect(current).toHaveValue(editedName)
    const savedRead = page.waitForResponse((r) =>
      r.url().endsWith('/rpc/cms_read_draft'),
    )
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(
      page.getByText('Saved and reloaded from the database.'),
    ).toBeVisible()
    const savedContent = await (await savedRead).json()
    expect(
      savedContent.personas.find(
        (p: { persona_id: string }) => p.persona_id === original.persona_id,
      ).general_starting_balance,
    ).toBe(321.09)
    expect(savedContent.expenses).toEqual(initial.expenses)
    await page.screenshot({
      path: testInfo.outputPath('persona-desktop.png'),
      fullPage: true,
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByLabel('Persona description')).toBeVisible()
    await page.screenshot({
      path: testInfo.outputPath('persona-mobile.png'),
      fullPage: true,
    })
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter(
          (e) =>
            e.getBoundingClientRect().right > innerWidth &&
            getComputedStyle(e).display !== 'none',
        )
        .slice(0, 15)
        .map((e) => `${e.tagName}.${e.className}`),
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      overflow.join(', '),
    ).toBe(true)
    await page
      .getByRole('button', { name: 'Switch to Viewer', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Switch to Editor', exact: true })
      .click()
    await expect(current).toHaveValue(editedName)
    const ids = await page
      .locator('[id]')
      .evaluateAll((nodes) => nodes.map((n) => n.id))
    expect(new Set(ids).size).toBe(ids.length)
    await page.reload()
    await page
      .getByRole('button', { name: 'Switch to Editor', exact: true })
      .click()
    await page.getByRole('button', { name, exact: true }).click()
    await page.getByRole('tab', { name: /^Personas/ }).click()
    await library
      .getByRole('button', {
        name: `${editedName} Starting balance`,
        exact: false,
      })
      .click()
    await expect(current).toHaveValue(editedName)
    await expect(page.getByLabel('Persona description')).toHaveValue(
      'An explicitly authored persona description.',
    )
    await expect(
      page.getByLabel('Starting balance (USD)', { exact: false }),
    ).toHaveValue('321.09')

    // A new persona has no invented balance/skills or automatically generated content.
    await page.getByRole('button', { name: 'New persona', exact: true }).click()
    await expect(
      page.getByLabel('Starting balance (USD)', { exact: false }),
    ).toHaveValue('')
    await expect(
      page.getByLabel('English skills', { exact: false }),
    ).toHaveValue('')
    const newName = `New household ${Date.now()}`
    await current.fill(newName)
    await page
      .getByLabel('Persona description')
      .fill('Author-provided new household.')
    await page
      .getByLabel('Starting balance (USD)', { exact: false })
      .fill('150.25')
    await page.getByLabel('English skills', { exact: false }).selectOption('no')
    await page
      .getByLabel('Computer skills', { exact: false })
      .selectOption('yes')
    // Commit succeeds but the following read is interrupted; retry must not create a duplicate.
    await page.route(
      'http://127.0.0.1:55321/rest/v1/rpc/cms_read_draft',
      (route) => route.abort(),
      { times: 1 },
    )
    const attempted = page.waitForRequest((r) =>
      r.url().endsWith('/rpc/cms_save_persona_bundle'),
    )
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    const originalRequest = (await attempted).postDataJSON()
    await expect(page.getByRole('alert')).toContainText(
      'save may have completed',
    )
    await expect(current).toHaveValue(newName)
    await expect(current).toBeDisabled()
    const retried = page.waitForRequest((r) =>
      r.url().endsWith('/rpc/cms_save_persona_bundle'),
    )
    const newRead = page.waitForResponse((r) =>
      r.url().endsWith('/rpc/cms_read_draft'),
    )
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(
      page.getByText('Saved and reloaded from the database.'),
    ).toBeVisible()
    expect((await retried).postDataJSON()).toEqual(originalRequest)
    const createdContent = await (await newRead).json()
    expect(
      createdContent.personas.filter(
        (p: { name: string }) => p.name === newName,
      ),
    ).toHaveLength(1)
    const newPersona = createdContent.personas.find(
      (p: { name: string }) => p.name === newName,
    )
    expect(newPersona.persona_id).toMatch(/^[a-f0-9-]{36}$/)
    expect(newPersona.weekly_income).toBe(0)
    expect(newPersona.starting_job_id).toBeNull()
    expect(
      createdContent.expenses.filter(
        (e: { persona_id: string }) => e.persona_id === newPersona.persona_id,
      ),
    ).toEqual([])
    expect(createdContent.scenarios).toEqual(initial.scenarios)

    // Simulate another staff save through the real protected endpoint, not table writes.
    const external = await page.request.post(
      'http://127.0.0.1:55321/rest/v1/rpc/cms_save_persona_bundle',
      {
        headers: auth,
        data: {
          p_version: draft,
          p_revision: createdContent.workspace.revision,
          p_request: crypto.randomUUID(),
          p_persona: newPersona.persona_id,
          p_fields: { description: 'Saved from another editor.' },
          p_expenses: [],
        },
      },
    )
    expect(external.ok()).toBeTruthy()
    await page.getByLabel('Persona description').fill('My unsaved local edit.')
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(page.getByRole('alert')).toContainText(
      'This draft changed. Reload the draft',
    )
    await expect(page.getByLabel('Persona description')).toHaveValue(
      'My unsaved local edit.',
    )
    await page
      .getByRole('button', { name: 'Reload draft', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Discard changes', exact: true })
      .click()
    await library
      .getByRole('button', {
        name: `${newName} Starting balance`,
        exact: false,
      })
      .click()
    await expect(page.getByLabel('Persona description')).toHaveValue(
      'Saved from another editor.',
    )
    await page
      .getByRole('button', { name: 'Back to persona library', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Select a persona', exact: true }),
    ).toBeVisible()
    // Keyboard tab switching reuses AdminTabs.
    await page.getByRole('tab', { name: /^Personas/ }).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByRole('tab', { name: /^Scenarios/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const sourceAfter = await page.request.get(
      `http://127.0.0.1:55321/rest/v1/personas?version_id=eq.${initial.workspace.source_version}&select=*`,
      { headers: auth },
    )
    expect(await sourceAfter.json()).toEqual(sourcePersonas)
  } finally {
    if (draft && auth) {
      const response = await page.request.post(
        'http://127.0.0.1:55321/rest/v1/rpc/cms_read_draft',
        { headers: auth, data: { p_version: draft } },
      )
      if (response.ok()) {
        const loaded = await response.json()
        const deleted = await page.request.post(
          'http://127.0.0.1:55321/rest/v1/rpc/cms_delete_draft',
          {
            headers: auth,
            data: { p_version: draft, p_revision: loaded.workspace.revision },
          },
        )
        expect(deleted.ok()).toBeTruthy()
      }
    }
  }
})
