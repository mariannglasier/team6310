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

test('integrated expenses sort, edit, save/reopen, protect links, and delete unreferenced personas safely', async ({
  page,
}, info) => {
  test.setTimeout(60000)
  const path = process.env.CMS_BROWSER_FIXTURE
  test.skip(!path, 'Set the existing private local staff fixture')
  const fixture = JSON.parse(readFileSync(path!, 'utf8'))
  const [source, alex, jordan, ordinary, recap, linked, free] = Array.from(
    { length: 7 },
    randomUUID,
  )
  let draft: string | undefined
  let auth: Record<string, string> | undefined
  sql(`BEGIN;
    INSERT INTO public.content_versions(version_id,version_number,status) VALUES('${source}',1,'draft');
    INSERT INTO public.personas(persona_id,version_id,name,description,general_starting_balance,weekly_income,has_english_skills,has_computer_skills)
      VALUES('${alex}','${source}','Alex','Alex source',100,0,true,false),('${jordan}','${source}','Jordan','Jordan source',200,0,false,true);
    INSERT INTO public.scenarios(scenario_id,version_id,title,description,persona_intent,category_id,schedule_type,default_day)
      VALUES('${ordinary}','${source}','Ordinary fixture','Fixture','${alex}',(SELECT category_id FROM public.categories LIMIT 1),'scheduled',10),
            ('${recap}','${source}','Bill recap fixture','Fixture',NULL,(SELECT category_id FROM public.categories LIMIT 1),'non_scheduled',NULL);
    INSERT INTO public.persona_expenses(expense_id,persona_id,version_id,name,amount,first_due_day,late_fee_amount)
      VALUES('${linked}','${alex}','${source}','Linked bill',10,6,2),('${free}','${alex}','${source}','Free bill',12,8,0);
    INSERT INTO public.scenario_bill_links VALUES('${linked}','${recap}','${source}');
    UPDATE public.content_versions SET status='published',published_at=now() WHERE version_id='${source}';
    COMMIT;`)
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
    await page
      .getByLabel(/^Published source edition/, { exact: false })
      .selectOption(source)
    const name = `Expense browser ${Date.now()}`
    await page.getByLabel(/^Draft name/, { exact: false }).fill(name)
    const loaded = page.waitForResponse((r) =>
      r.url().endsWith('/rpc/cms_read_draft'),
    )
    await page
      .getByRole('button', { name: 'Create draft', exact: true })
      .click()
    const response = await loaded
    const initial = await response.json()
    draft = initial.workspace.version_id
    const headers = response.request().headers()
    auth = { apikey: headers.apikey, authorization: headers.authorization }
    await page.getByRole('tab', { name: /^Personas/ }).click()
    const library = page.getByRole('region', {
      name: 'Persona library',
      exact: true,
    })
    await library.getByRole('button', { name: /^Alex Starting/ }).click()
    await expect(page.locator('.cms-persona-avatar img')).toHaveClass(
      /persona-avatar--alex/,
    )
    await expect(
      page.getByRole('button', { name: 'Back to persona library' }),
    ).toHaveCount(0)
    const card = (name: string) =>
      page
        .locator('.cms-expense')
        .filter({ has: page.getByText(name, { exact: true }) })
    const titles = () =>
      page.locator('.cms-expense summary strong').allTextContents()
    expect(await titles()).toEqual(['Linked bill', 'Free bill'])
    const own = card('Free bill')
    await own.locator('summary').click()
    for (const [label, expected] of [
      ['Fixed late fee (USD)', 'Ignore'],
      ['First due day', 'first occurrence'],
      ['Expense recurrence', 'NULL'],
    ]) {
      await own
        .getByRole('button', { name: `About ${label}`, exact: true })
        .click()
      await expect(page.getByRole('note')).toContainText(expected)
      await page.keyboard.press('Escape')
    }

    await own.getByLabel(/^Expense amount/, { exact: false }).fill('18.25')
    await own.getByLabel(/^Fixed late fee/, { exact: false }).fill('0.75')
    await own.getByLabel(/^First due day/, { exact: false }).fill('7')
    await own.getByLabel(/^Expense recurrence/).selectOption('repeat')
    await expect(
      own.getByLabel(/^Repeat interval/, { exact: false }),
    ).toHaveValue('')
    await own.getByLabel(/^Repeat interval/, { exact: false }).fill('7')
    await own
      .getByRole('button', {
        name: 'About Repeat interval (days)',
        exact: true,
      })
      .click()
    await expect(page.getByRole('note')).toContainText('not the first due date')
    await page.keyboard.press('Escape')
    await own.locator('summary').click()
    await own.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(
      own.getByLabel(/^Expense amount/, { exact: false }),
    ).toHaveValue('18.25')
    await own.locator('summary').click()
    async function add(title: string, day: string, value: string) {
      await page
        .getByRole('button', { name: 'Add expense', exact: true })
        .click()
      const row = card('New expense')
      await row.locator('summary').click()
      await expect(
        row.getByLabel(/^Expense amount/, { exact: false }),
      ).toHaveValue('')
      await expect(
        row.getByLabel(/^Fixed late fee/, { exact: false }),
      ).toHaveValue('')
      await row.getByLabel(/^Expense name/, { exact: false }).fill(title)
      const renamed = card(title)
      await renamed.getByLabel(/^Expense amount/, { exact: false }).fill(value)
      await renamed.getByLabel(/^Fixed late fee/, { exact: false }).fill('0')
      await renamed.getByLabel(/^First due day/, { exact: false }).fill(day)
      await renamed.locator('summary').click()
    }
    await add('Early expense', '2', '5.25')
    await add('Alpha expense', '2', '2.50')
    expect(await titles()).toEqual([
      'Alpha expense',
      'Early expense',
      'Linked bill',
      'Free bill',
    ])
    const addExpense = page.getByRole('button', {
      name: 'Add expense',
      exact: true,
    })
    await expect(addExpense).toHaveClass(/ui-button--secondary/)
    expect(
      await addExpense.evaluate((button) => {
        const cards = button
          .closest('.cms-expenses')!
          .querySelectorAll('.cms-expense')
        return !!(
          cards[cards.length - 1].compareDocumentPosition(button) &
          Node.DOCUMENT_POSITION_FOLLOWING
        )
      }),
    ).toBe(true)
    await page.getByLabel(/^Persona name/, { exact: false }).fill('Alex CMS')
    const saved = page.waitForResponse((r) =>
      r.url().endsWith('/rpc/cms_read_draft'),
    )
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(
      page.getByText('Saved and reloaded from the database.'),
    ).toBeVisible()
    const after = await (await saved).json()
    const oldFree = initial.expenses.find(
      (e: { name: string }) => e.name === 'Free bill',
    )
    const changed = after.expenses.find(
      (e: { expense_id: string }) => e.expense_id === oldFree.expense_id,
    )
    expect(changed.amount).toBe(18.25)
    expect(changed.repeat_interval_days).toBe(7)
    const oldLink = initial.expenses.find(
      (e: { name: string }) => e.name === 'Linked bill',
    )
    expect(
      after.expenses.find(
        (e: { expense_id: string }) => e.expense_id === oldLink.expense_id,
      ),
    ).toEqual(oldLink)
    expect(after.bill_links).toEqual(initial.bill_links)
    await page.reload()
    await page
      .getByRole('button', { name: 'Switch to Editor', exact: true })
      .click()
    await page.getByRole('button', { name, exact: true }).click()
    await page.getByRole('tab', { name: /^Personas/ }).click()
    await library.getByRole('button', { name: /^Alex CMS Starting/ }).click()
    expect(await titles()).toEqual([
      'Alpha expense',
      'Early expense',
      'Linked bill',
      'Free bill',
    ])
    await page
      .getByRole('button', {
        name: 'Remove expense Early expense',
        exact: true,
      })
      .click()
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    expect(await titles()).toHaveLength(4)
    await page
      .getByRole('button', {
        name: 'Remove expense Early expense',
        exact: true,
      })
      .click()
    await page
      .getByRole('button', { name: 'Remove expense', exact: true })
      .click()
    await page
      .getByLabel(/^Persona description/)
      .fill('Saved together with removal.')
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(
      page.getByText('Saved and reloaded from the database.'),
    ).toBeVisible()
    expect(await titles()).toHaveLength(3)
    await page
      .getByRole('button', { name: 'Remove expense Linked bill', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Remove expense', exact: true })
      .click()
    await expect(page.getByRole('alert')).toContainText(
      'linked to a bill recap',
    )
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await page
      .getByRole('button', { name: 'Delete persona Alex CMS', exact: true })
      .click()
    await expect(
      page.getByRole('dialog', { name: 'Delete persona?' }),
    ).toContainText('Alex CMS')
    await page
      .getByRole('button', { name: 'Delete persona', exact: true })
      .click()
    await expect(page.getByRole('alert')).toContainText('linked scenarios')
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    // A conflicting expense change rolls back the simultaneous description edit.
    await card('Free bill').locator('summary').click()
    await card('Free bill')
      .getByLabel(/^First due day/, { exact: false })
      .fill('10')
    await page.getByLabel(/^Persona description/).fill('Must not commit.')
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(page.getByRole('alert')).toContainText('schedule collision')
    await expect(page.getByLabel(/^Persona description/)).toHaveValue(
      'Must not commit.',
    )
    const check = await page.request.post(
      'http://127.0.0.1:55321/rest/v1/rpc/cms_read_draft',
      { headers: auth, data: { p_version: draft } },
    )
    const committed = await check.json()
    expect(
      committed.personas.find((p: { name: string }) => p.name === 'Alex CMS')
        .description,
    ).toBe('Saved together with removal.')
    await card('Free bill')
      .getByLabel(/^First due day/, { exact: false })
      .fill('7')
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(
      page.getByText('Saved and reloaded from the database.'),
    ).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    await card('Alpha expense').locator('summary').click()
    await expect(
      card('Alpha expense').getByLabel(/^Expense amount/, { exact: false }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    const feeHelp = card('Alpha expense').getByRole('button', {
      name: 'About Fixed late fee (USD)',
      exact: true,
    })
    await feeHelp.scrollIntoViewIfNeeded()
    const beforeHelp = await card('Alpha expense')
      .getByLabel(/^Expense amount/)
      .boundingBox()
    await feeHelp.focus()
    await page.keyboard.press('Enter')
    const popup = await page.getByRole('note').boundingBox()
    expect(popup!.x).toBeGreaterThanOrEqual(0)
    expect(popup!.x + popup!.width).toBeLessThanOrEqual(390)
    expect(
      await card('Alpha expense')
        .getByLabel(/^Expense amount/)
        .boundingBox(),
    ).toEqual(beforeHelp)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.keyboard.press('Escape')
    await page.screenshot({
      path: info.outputPath('persona-expenses-mobile.png'),
      fullPage: true,
    })
    // Create and delete a persona with its own unreferenced expense, via real RPCs.
    await page.getByRole('button', { name: 'New persona', exact: true }).click()
    await page
      .getByLabel(/^Persona name/, { exact: false })
      .fill('Disposable household')
    await page
      .getByLabel(/^Persona description/)
      .fill('Explicit author details.')
    await page.getByLabel(/^Starting balance/, { exact: false }).fill('0')
    await page
      .getByLabel(/^English skills/, { exact: false })
      .selectOption('no')
    await page
      .getByLabel(/^Computer skills/, { exact: false })
      .selectOption('yes')
    await add('Owned expense', '3', '3.25')
    await page
      .getByRole('button', { name: 'Save Changes', exact: true })
      .click()
    await expect(
      page.getByText('Saved and reloaded from the database.'),
    ).toBeVisible()
    await page
      .getByRole('button', {
        name: 'Delete persona Disposable household',
        exact: true,
      })
      .click()
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(
      page.getByLabel(/^Persona name/, { exact: false }),
    ).toHaveValue('Disposable household')
    await page
      .getByRole('button', {
        name: 'Delete persona Disposable household',
        exact: true,
      })
      .click()
    await page
      .getByRole('button', { name: 'Delete persona', exact: true })
      .click()
    await expect(page.getByText('Persona deleted.')).toBeVisible()
    await expect(
      library.getByRole('button', { name: /^Disposable household Starting/ }),
    ).toHaveCount(0)
    const sourceRows = await page.request.get(
      `http://127.0.0.1:55321/rest/v1/persona_expenses?version_id=eq.${source}&select=*`,
      { headers: auth },
    )
    expect(
      (await sourceRows.json()).map((e: { amount: number }) => e.amount),
    ).toEqual([10, 12])
    expect(
      sql(`SELECT name FROM public.personas WHERE persona_id='${alex}'`).trim(),
    ).toBe('Alex')
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
      DELETE FROM public.scenario_bill_links WHERE version_id='${source}'; DELETE FROM public.persona_expenses WHERE version_id='${source}';
      DELETE FROM public.scenarios WHERE version_id='${source}'; DELETE FROM public.personas WHERE version_id='${source}';
      DELETE FROM public.content_versions WHERE version_id='${source}'; COMMIT;`)
  }
})
