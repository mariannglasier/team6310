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

test('jobs create, edit, reopen, preserve generated wages and block referenced deletion on desktop/mobile', async ({
  page,
}) => {
  test.setTimeout(90000)
  const path = process.env.CMS_BROWSER_FIXTURE
  test.skip(!path, 'Set the existing private local staff fixture')
  const fixture = JSON.parse(readFileSync(path!, 'utf8'))
  const [source, job, persona] = Array.from({ length: 3 }, randomUUID)
  let draft: string | undefined
  let auth: Record<string, string> | undefined
  sql(`BEGIN;
    INSERT INTO public.content_versions(version_id,version_number,status) VALUES('${source}',1,'draft');
    INSERT INTO public.jobs(job_id,version_id,soc_code,title,median_hourly_wage,hours_per_week,simulation_requirements)
      VALUES('${job}','${source}','11-1111','Browser legacy job',10.25,37.5,'{"notes":{"legacy":true},"retained":[1]}');
    INSERT INTO public.personas(persona_id,version_id,name,weekly_income,starting_job_id)
      VALUES('${persona}','${source}','Job household',9,'${job}');
    UPDATE public.content_versions SET status='published',published_at=now() WHERE version_id='${source}'; COMMIT;`)
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
    await page
      .getByRole('button', { name: 'Create new draft', exact: true })
      .click()
    await page.getByLabel(/^Published source edition/).selectOption(source)
    const name = `Job browser ${Date.now()}`
    await page.getByLabel(/^Draft name/).fill(name)
    const responsePromise = page.waitForResponse((r) =>
      r.url().endsWith('/rpc/cms_read_draft'),
    )
    await page
      .getByRole('button', { name: 'Create draft', exact: true })
      .click()
    const response = await responsePromise
    const initial = await response.json()
    draft = initial.workspace.version_id
    const headers = response.request().headers()
    auth = { apikey: headers.apikey, authorization: headers.authorization }
    await page.getByRole('tab', { name: /^Jobs/ }).click()
    const library = page.getByRole('region', {
      name: 'Job library',
      exact: true,
    })
    await page.getByLabel(/^Search jobs/).fill('missing')
    await expect(library.getByText('No jobs match this search.')).toBeVisible()
    await page.getByLabel(/^Search jobs/).fill('11-1111')
    await library
      .getByRole('button', { name: /^Browser legacy job SOC/ })
      .click()
    await expect(page.getByText('$384.38')).toBeVisible()
    await expect(page.getByLabel(/^Needs English skills/)).toHaveValue('')
    await page.getByLabel(/^Job description/).fill('Saved description')
    await page.getByRole('tab', { name: /^Personas/ }).click()
    await expect(
      page.getByRole('dialog', { name: 'Discard unsaved changes?' }),
    ).toBeVisible()
    await page
      .getByRole('button', { name: 'Keep editing', exact: true })
      .click()
    await expect(page.getByLabel(/^Job description/)).toHaveValue(
      'Saved description',
    )
    await page.getByLabel(/^Median hourly wage/).fill('12.34')
    await page.getByLabel(/^Hours per week/).fill('30.25')
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(
      page.getByText('Saved and reloaded from the database.'),
    ).toBeVisible()
    await expect(page.getByText('$373.29')).toBeVisible()
    await page
      .getByRole('button', {
        name: 'Delete job Browser legacy job',
        exact: true,
      })
      .click()
    await expect(
      page.getByRole('dialog', { name: 'Delete job?' }),
    ).toContainText('Browser legacy job')
    await page.getByRole('button', { name: 'Delete job', exact: true }).click()
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
      'persona',
    )
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await page.getByLabel(/^Search jobs/).fill('')
    await page.getByRole('button', { name: 'New job', exact: true }).click()
    await expect(page.getByLabel(/^Median hourly wage/)).toHaveValue('')
    await expect(page.getByLabel(/^Hours per week/)).toHaveValue('')
    await page.getByLabel(/^Job title/).fill('Created browser job')
    await page.getByLabel(/^SOC code/).fill('11-2222')
    await page.getByLabel(/^Hours per week/).fill('40')
    await page.getByLabel(/^Median hourly wage/).fill('15.25')
    await page.getByLabel(/^Area code/).fill('12060')
    await page.getByLabel(/^Area name/).fill('Atlanta')
    await page.getByLabel(/^Geography level/).selectOption('MSA')
    await page.getByLabel(/^Wage source URL/).fill('https://www.bls.gov/oes/')
    // Lose the readback after the real save commits; retry must recover one ID.
    await page.route('**/rpc/cms_read_draft', (route) => route.abort(), {
      times: 1,
    })
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(page.getByText('Save awaiting confirmation')).toBeVisible()
    await expect(page.getByLabel(/^Job title/)).toBeDisabled()
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(
      page.getByText('Saved and reloaded from the database.'),
    ).toBeVisible()
    await expect(page.getByText('$610.00')).toBeVisible()
    await expect(
      library.getByRole('button', { name: /^Created browser job SOC/ }),
    ).toHaveCount(1)
    await page.reload()
    await page
      .getByRole('button', { name: 'Switch to Editor', exact: true })
      .click()
    await page.getByRole('button', { name, exact: true }).click()
    await page.getByRole('tab', { name: /^Jobs/ }).click()
    await library
      .getByRole('button', { name: /^Created browser job SOC/ })
      .click()
    await expect(page.getByLabel(/^Median hourly wage/)).toHaveValue('15.25')
    await expect(page.getByText('$610.00')).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    const info = page.getByRole('button', {
      name: 'About Weekly gross',
      exact: true,
    })
    await info.focus()
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('note', { name: 'About Weekly gross' }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(info).toBeFocused()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy()
    await page
      .getByRole('button', {
        name: 'Delete job Created browser job',
        exact: true,
      })
      .click()
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(page.getByLabel(/^Job title/)).toHaveValue(
      'Created browser job',
    )
    await page
      .getByRole('button', {
        name: 'Delete job Created browser job',
        exact: true,
      })
      .click()
    await page.getByRole('button', { name: 'Delete job', exact: true }).click()
    await expect(page.getByText('Job deleted.')).toBeVisible()
    await expect(
      library.getByRole('button', { name: /^Created browser job SOC/ }),
    ).toHaveCount(0)
    expect(
      sql(
        `SELECT title || '|' || weekly_gross_income FROM public.jobs WHERE job_id='${job}'`,
      ).trim(),
    ).toBe('Browser legacy job|384.38')
  } finally {
    if (draft && auth) {
      const read = await page.request.post(
        'http://127.0.0.1:55321/rest/v1/rpc/cms_read_draft',
        { headers: auth, data: { p_version: draft } },
      )
      if (read.ok()) {
        const result = await read.json()
        const remove = await page.request.post(
          'http://127.0.0.1:55321/rest/v1/rpc/cms_delete_draft',
          {
            headers: auth,
            data: { p_version: draft, p_revision: result.workspace.revision },
          },
        )
        expect(remove.ok()).toBeTruthy()
      }
    }
    sql(`BEGIN; UPDATE public.content_versions SET status='draft',published_at=NULL WHERE version_id='${source}';
      DELETE FROM public.personas WHERE version_id='${source}'; DELETE FROM public.jobs WHERE version_id='${source}';
      DELETE FROM public.content_versions WHERE version_id='${source}'; COMMIT;`)
  }
})
