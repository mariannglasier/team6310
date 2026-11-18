import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'

// Trusted fixture setup only, fixed isolated container; the interface uses real RPCs.
function sql(statement: string) {
  return execFileSync(
    'docker',
    [
      '--host',
      'unix:///var/run/docker.sock',
      'exec',
      '-i',
      'supabase_db_team6310-phase2-verification',
      'psql',
      '-U',
      'postgres',
      '-XAtq',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: statement, encoding: 'utf8' },
  )
}

test('publication review permits optional incomplete content, confirms/retries, reopens immutable results and recovers from latest', async ({
  page,
}, info) => {
  test.setTimeout(120000)
  const path = process.env.CMS_BROWSER_FIXTURE
  test.skip(!path, 'Set the existing private local staff fixture')
  const fixture = JSON.parse(readFileSync(path!, 'utf8'))
  const { resolve } = await import('node:path')
  const source = sql(
    readFileSync(
      resolve('../supabase/tests/fixtures/cms-publication-source.sql'),
      'utf8',
      // Intentionally omit optional reporting periods so the warning review has
      // real actionable findings; ineligibility itself is no longer a warning.
    ).replace(
      "'2026',false,jsonb_build_object",
      'NULL,false,jsonb_build_object',
    ) + '\nSELECT pg_temp.publication_source();',
  )
    .trim()
    .split('\n')
    .at(-1)!
  const editions = [source]
  let auth: Record<string, string> | undefined
  const tag = Date.now()
  const oldName = `Old publication ${tag}`,
    newName = `Publish target ${tag}`
  try {
    await page.route('**/*', (route) =>
      ['http://127.0.0.1:4175', 'http://127.0.0.1:55321'].includes(
        new URL(route.request().url()).origin,
      )
        ? route.continue()
        : route.abort(),
    )
    await page.goto('/admin/login')
    await page.getByLabel(/^Work email/).fill(fixture.email)
    await page.getByLabel(/^Password/).fill(fixture.password)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page
      .getByRole('button', { name: 'Switch to Editor', exact: true })
      .click()
    async function create(name: string) {
      await page
        .getByRole('button', { name: 'Create new draft', exact: true })
        .click()
      await page.getByLabel(/^Published source edition/).selectOption(source)
      await page.getByLabel(/^Draft name/).fill(name)
      const loaded = page.waitForResponse((r) =>
        r.url().endsWith('/rpc/cms_read_draft'),
      )
      await page
        .getByRole('button', { name: 'Create draft', exact: true })
        .click()
      const response = await loaded,
        content = await response.json()
      editions.push(content.workspace.version_id)
      const headers = response.request().headers()
      auth = { apikey: headers.apikey, authorization: headers.authorization }
      return content
    }
    const old = await create(oldName)
    await page
      .getByRole('button', { name: 'New scenario', exact: true })
      .click()
    await page.getByLabel(/^Scenario title/).fill('Incomplete placeholder')
    await expect(
      page.getByRole('button', { name: 'Review publication', exact: true }),
    ).toBeDisabled()
    await page
      .getByLabel(/^Scenario description/)
      .fill('Draft deliberately has no choices or facts')
    const category = await page
      .getByRole('combobox', { name: /^Category/ })
      .locator('option')
      .evaluateAll(
        (options) =>
          (options as HTMLOptionElement[]).find((o) => o.value)?.value,
      )
    await page
      .getByRole('combobox', { name: /^Category/ })
      .selectOption(category!)
    await page
      .getByLabel(/^Persona applicability/)
      .selectOption(old.personas[0].persona_id)
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(
      page.getByText('Saved and reloaded from the database.'),
    ).toBeVisible()
    await page
      .getByRole('button', { name: 'Review publication', exact: true })
      .click()
    await expect(
      page.getByRole('dialog', { name: 'Publication review' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Continue to confirmation' }),
    ).toBeEnabled()
    await page.getByText(/^Warnings \(/).click()
    await expect(
      page.getByText('No choice is available without CAC support', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      page.getByText('SCN-ANSWER-AVAILABLE', { exact: true }),
    ).toHaveCount(0)
    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await page
      .getByRole('button', {
        name: 'Delete scenario Incomplete placeholder',
        exact: true,
      })
      .click()
    await page
      .getByRole('button', { name: 'Delete scenario', exact: true })
      .click()
    await expect(page.getByText('Scenario deleted.')).toBeVisible()
    const scenarioLibrary = page.getByRole('region', {
      name: 'Scenario library',
      exact: true,
    })
    await scenarioLibrary.getByRole('button', { name: /^Ordinary 01/ }).click()
    await page
      .getByLabel(/^Scenario description/)
      .fill('Old saved change, never merged automatically')
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(
      page.getByText('Saved and reloaded from the database.'),
    ).toBeVisible()
    const externalSave = await page.request.post(
      'http://127.0.0.1:55321/rest/v1/rpc/cms_save_job',
      {
        headers: auth,
        data: {
          p_version: old.workspace.version_id,
          p_revision: 3,
          p_request: randomUUID(),
          p_job: old.jobs[0].job_id,
          p_fields: { description: 'Saved in another browser' },
        },
      },
    )
    expect(externalSave.ok()).toBeTruthy()
    await page
      .getByRole('button', { name: 'Review publication', exact: true })
      .click()
    await expect(
      page
        .getByRole('dialog', { name: 'Publication review' })
        .getByRole('alert'),
    ).toContainText('Reload draft')
    await expect(
      page.getByRole('button', { name: 'Continue to confirmation' }),
    ).toBeDisabled()
    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await page
      .getByRole('button', { name: 'Reload draft', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Review publication', exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Continue to confirmation' }),
    ).toBeEnabled()
    await page.getByRole('button', { name: 'Close', exact: true }).click()
    const target = await create(newName)
    const jobChange = async (revision: number, active: boolean) => {
      const response = await page.request.post(
        'http://127.0.0.1:55321/rest/v1/rpc/cms_save_job',
        {
          headers: auth,
          data: {
            p_version: target.workspace.version_id,
            p_revision: revision,
            p_request: randomUUID(),
            p_job: target.jobs[0].job_id,
            p_fields: { is_active: active },
          },
        },
      )
      expect(response.ok()).toBeTruthy()
    }
    await jobChange(0, false)
    await page
      .getByRole('button', { name: 'Reload draft', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Review publication', exact: true })
      .click()
    await expect(
      page.getByText('At least two starting jobs are needed', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Continue to confirmation' }),
    ).toBeDisabled()
    expect(
      await page
        .locator('.cms-publication-category--blocker')
        .evaluate((e) => getComputedStyle(e).color),
    ).toBe('rgb(143, 30, 24)')
    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await jobChange(1, true)
    await page
      .getByRole('button', { name: 'Reload draft', exact: true })
      .click()

    await page
      .getByRole('button', { name: 'Review publication', exact: true })
      .click()
    await expect(page.getByText('Blockers (0)')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Continue to confirmation' }),
    ).toBeEnabled()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByText(/^Warnings \(/).click()
    const finding = page
      .locator('.cms-publication-finding')
      .filter({
        has: page.getByText('Fact source details may be incomplete', {
          exact: true,
        }),
      })
      .first()
    await expect(
      finding.locator('.cms-publication-explanation'),
    ).not.toBeVisible()
    await finding.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(finding.locator('.cms-publication-explanation')).toBeVisible()
    await expect(
      page
        .locator('.cms-publication-finding')
        .nth(1)
        .locator('.cms-publication-explanation'),
    ).not.toBeVisible()
    const geometry = await finding.evaluate((element) => {
      const parent = element.closest('.cms-publication-category')!
      return {
        child: element.getBoundingClientRect().left,
        parent: parent.getBoundingClientRect().left,
        color: getComputedStyle(parent).color,
      }
    })
    expect(geometry.child).toBeGreaterThan(geometry.parent + 10)
    expect(geometry.color).toBe('rgb(92, 61, 0)')
    await expect(page.getByText(/^Information \(/)).toHaveCount(0)
    await expect(page.locator('.cms-publication-report code')).toHaveCount(0)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy()
    const dialog = page.getByRole('dialog', { name: 'Publication review' })
    expect(
      await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBeTruthy()
    await page.screenshot({
      path: info.outputPath('cms-publication-mobile.png'),
    })
    await page.getByRole('button', { name: 'Continue to confirmation' }).click()
    await expect(
      page.getByRole('dialog', { name: 'Publish this edition?' }),
    ).toContainText(newName)
    await page
      .getByRole('button', { name: 'Back to review', exact: true })
      .focus()
    await page.keyboard.press('Enter')
    await expect(dialog).toBeVisible()
    await page.getByRole('button', { name: 'Continue to confirmation' }).click()
    const requests: string[] = []
    page.on('request', (request) => {
      if (request.url().endsWith('/rpc/cms_publish_draft'))
        requests.push(request.postDataJSON().p_request)
    })
    await page.route('**/rpc/cms_read_draft', (route) => route.abort(), {
      times: 1,
    })
    await page
      .getByRole('button', { name: 'Publish edition', exact: true })
      .click()
    await expect(
      page.getByText(/Publication awaiting confirmation/),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Back to review', exact: true }),
    ).toBeDisabled()
    await page
      .getByRole('button', { name: 'Retry publication confirmation' })
      .click()
    await expect(
      page.getByRole('region', { name: 'Published edition' }),
    ).toBeVisible()
    expect(requests).toHaveLength(2)
    expect(new Set(requests).size).toBe(1)
    const read = async (id: string) => {
      const response = await page.request.post(
        'http://127.0.0.1:55321/rest/v1/rpc/cms_read_draft',
        { headers: auth, data: { p_version: id } },
      )
      expect(response.ok()).toBeTruthy()
      return response.json()
    }
    const committed = await read(target.workspace.version_id)
    expect(committed.facts).toEqual(target.facts)
    expect(committed.edition.version_id).toBe(target.workspace.version_id)
    await page
      .getByRole('button', { name: 'Switch to Viewer', exact: true })
      .click()
    await expect(
      page.getByRole('combobox', { name: 'Edition', exact: true }),
    ).toHaveValue(target.workspace.version_id)
    await page.reload()
    await page
      .getByRole('button', { name: 'Switch to Editor', exact: true })
      .click()
    await page.getByText(/^Published CMS editions/).click()
    await page
      .getByRole('button', {
        name: `Edition ${committed.edition.version_number} · ${newName}`,
        exact: true,
      })
      .click()
    await expect(
      page.getByRole('heading', {
        name: `Published edition ${committed.edition.version_number}`,
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Save Changes', exact: true }),
    ).toHaveCount(0)
    await page.getByRole('button', { name: oldName, exact: true }).click()
    await page
      .getByRole('button', { name: 'Review publication', exact: true })
      .click()
    await expect(
      page.getByText('A newer edition has been published', { exact: true }),
    ).toBeVisible()
    await page
      .getByRole('button', { name: 'Create fresh draft from latest edition' })
      .click()
    await expect(
      page.getByRole('dialog', { name: 'Create a fresh draft?' }),
    ).toContainText('not automatically copied or merged')
    await page.getByLabel(/^Fresh draft name/).fill(`Recovered ${tag}`)
    const recoveredRead = page.waitForResponse((r) =>
      r.url().endsWith('/rpc/cms_read_draft'),
    )
    await page
      .getByRole('button', { name: 'Create fresh draft', exact: true })
      .click()
    const recovered = await (await recoveredRead).json()
    editions.push(recovered.workspace.version_id)
    await expect(
      page.getByRole('heading', { name: `Recovered ${tag}` }),
    ).toBeVisible()
    expect(recovered.workspace.source_version).toBe(target.workspace.version_id)
    expect(
      recovered.scenarios.some(
        (s: { description: string }) =>
          s.description === 'Old saved change, never merged automatically',
      ),
    ).toBeFalsy()
    expect(
      (await read(old.workspace.version_id)).scenarios.some(
        (s: { description: string }) =>
          s.description === 'Old saved change, never merged automatically',
      ),
    ).toBeTruthy()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy()
  } finally {
    execFileSync(
      'python3',
      ['../tools/cms_publication_test_support.py', 'cleanup', ...editions],
      { encoding: 'utf8' },
    )
  }
})
