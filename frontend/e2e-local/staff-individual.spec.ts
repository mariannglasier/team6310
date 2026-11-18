import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test, type Page, type Locator } from '@playwright/test'

const root = resolve(import.meta.dirname, '../..')
const fixtureTool = resolve(root, 'tools/staff_browser_fixture.py')
let fixturePath: string
let fixture: { email: string; password: string; actor: { id: string } }
function command(action: string, input?: string) {
  return execFileSync(
    'python3',
    [fixtureTool, action, ...(fixturePath ? [fixturePath] : [])],
    {
      cwd: root,
      input,
      encoding: 'utf8',
    },
  ).trim()
}
test.beforeAll(() => {
  fixturePath = command('create')
  fixture = JSON.parse(readFileSync(fixturePath, 'utf8'))
})
test.afterAll(() => {
  if (fixturePath) command('cleanup')
})

async function identity(page: Page) {
  return page.evaluate(async () => {
    const modulePath = '/src/lib/supabaseClient.ts'
    const { supabase } = await import(modulePath)
    const { data, error } = await supabase.auth.getUser()
    if (error) throw new Error('Unable to verify browser Auth user')
    return {
      id: data.user.id as string,
      anonymous: data.user.is_anonymous as boolean,
    }
  })
}
async function saved(page: Page, id: string) {
  return page.evaluate(async (runId) => {
    const modulePath = '/src/lib/supabaseClient.ts'
    const { supabase } = await import(modulePath)
    const { data, error } = await supabase.rpc('get_bill_snapshot', {
      p_run_id: runId,
    })
    if (error || !data) throw new Error('Unable to read saved browser run')
    return data
  }, id)
}
async function runId(page: Page) {
  const read = () =>
    page.evaluate(async () => {
      const modulePath = '/src/lib/supabaseClient.ts'
      const { supabase } = await import(modulePath)
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user)
        throw new Error('Verified browser identity required')
      return localStorage.getItem(`cac-employment-v1:${data.user.id}:run`)
    })
  await expect.poll(read).toMatch(/^[a-f0-9-]{36}$/)
  return (await read())!
}

async function begin(page: Page) {
  await page
    .getByRole('button', {
      name: 'Choose [LOCAL TEST] Bills Alex',
      exact: true,
    })
    .click()
  await page
    .getByRole('button', { name: 'Start simulation', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: "See who's hiring" }),
  ).toBeVisible()
  return runId(page)
}
async function mutate(page: Page, locator: Locator, endpoint: string) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith('/rpc/' + endpoint) && r.request().method() === 'POST',
    ),
    locator.click(),
  ])
  expect(response.status()).toBe(200)
}

test('staff browser journey preserves identity, dashboard access, restoration and replay; anonymous regression', async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(240000)
  page.setDefaultTimeout(15000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const forbidden: string[] = []
  const userIds = new Set<string>()
  const requests = { signup: 0, logout: 0, password: 0 }
  const failures: string[] = []
  const evidence: Record<string, unknown> = {}
  const responseTasks: Promise<void>[] = []
  async function localOnly(p: Page) {
    await p.route('**/*', (route) => {
      const origin = new URL(route.request().url()).origin
      if (
        !['http://127.0.0.1:4175', 'http://127.0.0.1:55321'].includes(origin)
      ) {
        forbidden.push(origin)
        return route.abort()
      }
      return route.continue()
    })
  }
  await localOnly(page)
  page.on('pageerror', (error) => failures.push(error.message))
  page.on('request', (r) => {
    if (r.method() !== 'POST') return
    if (r.url().includes('/auth/v1/signup')) requests.signup++
    if (r.url().includes('/auth/v1/logout')) requests.logout++
    if (r.url().includes('grant_type=password')) requests.password++
  })
  page.on('response', (r) => {
    if (
      r.ok() &&
      (r.url().includes('/auth/v1/user') || r.url().includes('/auth/v1/token'))
    ) {
      responseTasks.push(
        r.json().then((data) => {
          userIds.add(data.user?.id ?? data.id)
        }),
      )
    }
  })
  try {
    await page.goto('/')
    await page.goto('/admin/login')
    await page.getByLabel('Work email').fill(fixture.email)
    await page.getByLabel(/Password/).fill(fixture.password)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: 'Employee dashboard', exact: true }),
    ).toBeVisible()
    await expect(page.getByText('Loading stored content…')).toHaveCount(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(await identity(page)).toEqual({
      id: fixture.actor.id,
      anonymous: false,
    })
    const before = JSON.parse(command('inspect'))
    await page.getByRole('link', { name: 'Main site', exact: true }).click()
    await page.getByRole('link', { name: /^Start simulation/ }).click()
    const id = await begin(page)
    evidence.staffRun = id
    expect((await saved(page, id)).run.owner_user_id).toBe(fixture.actor.id)
    let ordinary = 0,
      paid = 0,
      ignored = 0,
      returned = false
    for (let step = 0; step < 140; step++) {
      const snapshot = await saved(page, id)
      const run = snapshot.run
      const stage = run.employment_state.stage as string
      expect(run.owner_user_id).toBe(fixture.actor.id)
      if (stage === 'complete') break
      if (stage === 'uninitialized') {
        await mutate(
          page,
          page.getByRole('button', { name: "See who's hiring" }),
          'submit_employment_action',
        )
      } else if (stage === 'board' || stage === 'reapply') {
        await page
          .getByRole('button', { name: /^Choose / })
          .and(page.locator(':enabled'))
          .first()
          .click()
        await mutate(
          page,
          page.getByRole('button', { name: 'Submit application', exact: true }),
          'submit_employment_action',
        )
      } else if (stage === 'application-result') {
        await mutate(
          page,
          page.getByRole('button', { name: 'Start Day 1' }),
          'submit_employment_action',
        )
      } else if (stage === 'interview') {
        await page.getByRole('button', { name: /current clothes/i }).click()
        await mutate(
          page,
          page.getByRole('button', { name: 'Submit clothing decision' }),
          'submit_employment_action',
        )
      } else if (stage === 'interview-result' || stage === 'reapply-result') {
        await mutate(
          page,
          page.getByRole('button', {
            name: /^(Search open jobs|Continue to Day \d+)$/,
          }),
          'submit_employment_action',
        )
      } else if (stage === 'income') {
        await expect
          .poll(async () => (await saved(page, id)).run.employment_state.stage)
          .not.toBe('income')
      } else if (stage === 'day') {
        const day = run.current_day as number
        const due = snapshot.bills.filter(
          (b: { due_day: number }) => b.due_day === day,
        )
        if (due.length) {
          const region = page.getByRole('region', { name: 'Bills due today' })
          await expect(region).toBeVisible()
          for (const bill of due) {
            if (bill.paid_at || bill.ignored_at) continue
            const ignore = day === 2 || day === 30
            await mutate(
              page,
              region.getByRole('button', {
                name: `${ignore ? 'Ignore' : 'Pay'} ${bill.name_snapshot}`,
                exact: true,
              }),
              ignore ? 'ignore_bill' : 'pay_bill',
            )
            if (ignore) ignored++
            else paid++
          }
          await mutate(
            page,
            region.getByRole('button', {
              name: day === 30 ? 'Finish Day 30' : 'Continue to next day',
              exact: true,
            }),
            'submit_employment_action',
          )
        } else if (run.current_scenario_id) {
          const scenario = page.getByRole('region', {
            name: 'Ordinary scenario',
          })
          await expect(
            scenario.getByRole('button', { name: 'Submit decision' }),
          ).toBeVisible()
          await scenario
            .getByRole('button', { name: /No financial change/i })
            .click()
          await mutate(
            page,
            scenario.getByRole('button', { name: 'Submit decision' }),
            'submit_scenario_decision',
          )
          ordinary++
          await expect(
            scenario.getByRole('button', {
              name: 'Continue to next day',
              exact: true,
            }),
          ).toBeVisible()
          if (!returned) {
            const committed = await saved(page, id)
            await page.reload()
            await expect(
              page.getByRole('button', {
                name: 'Continue to next day',
                exact: true,
              }),
            ).toBeVisible()
            expect(await runId(page)).toBe(id)
            expect(await saved(page, id)).toEqual(committed)
            await page.screenshot({
              path: testInfo.outputPath('staff-gameplay-restored.png'),
              fullPage: true,
            })
            await page.goto('/admin/dashboard')
            await expect(
              page.getByRole('heading', {
                name: 'Employee dashboard',
                exact: true,
              }),
            ).toBeVisible()
            await expect(page.getByText('Loading stored content…')).toHaveCount(
              0,
            )
            await expect(page.getByRole('alert')).toHaveCount(0)
            expect(await identity(page)).toEqual({
              id: fixture.actor.id,
              anonymous: false,
            })
            await page.screenshot({
              path: testInfo.outputPath('staff-dashboard-return.png'),
              fullPage: true,
            })
            await page
              .getByRole('link', { name: 'Main site', exact: true })
              .click()
            await page.getByRole('link', { name: /^Start simulation/ }).click()
            expect(await runId(page)).toBe(id)
            expect(await saved(page, id)).toEqual(committed)
            await expect(
              page.getByRole('button', {
                name: 'Continue to next day',
                exact: true,
              }),
            ).toBeVisible()
            returned = true
          }
          await mutate(
            page,
            page.getByRole('button', {
              name: 'Continue to next day',
              exact: true,
            }),
            'submit_employment_action',
          )
        } else {
          await mutate(
            page,
            page.getByRole('button', { name: /^(Next|Finish Day 30)$/ }),
            'submit_employment_action',
          )
        }
      } else throw new Error('Unexpected browser stage ' + stage)
    }
    const complete = await saved(page, id)
    expect(complete.run.status).toBe('completed')
    expect(ordinary).toBeGreaterThan(0)
    expect(paid).toBeGreaterThan(0)
    expect(ignored).toBeGreaterThan(0)
    expect(returned).toBe(true)
    await expect(
      page.getByRole('button', { name: 'Try another mode' }),
    ).toBeVisible()
    await page.screenshot({
      path: testInfo.outputPath('staff-completed.png'),
      fullPage: true,
    })
    await page.getByRole('button', { name: 'Try another mode' }).click()
    const replay = await begin(page)
    expect(replay).not.toBe(id)
    await mutate(
      page,
      page.getByRole('button', { name: "See who's hiring" }),
      'submit_employment_action',
    )
    expect((await saved(page, replay)).run.cac_support_enabledabled).toBe(true)
    await mutate(
      page,
      page.getByRole('button', { name: 'Join CAC Adult Education classes' }),
      'submit_employment_action',
    )
    await expect(
      page.getByRole('button', { name: 'Return to job board' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Give Up', exact: true }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Give Up', exact: true })
      .click()
    await expect(
      page.getByRole('heading', {
        name: 'Simulation ended early.',
        exact: true,
      }),
    ).toBeVisible()
    expect((await saved(page, replay)).run.status).toBe('ended')
    await page.goto('/group/host')
    await expect(page.getByRole('alert')).toHaveText(
      'Unable to restore your session. Please retry.',
    )
    await page.goto('/admin/dashboard')
    await expect(
      page.getByRole('heading', { name: 'Employee dashboard', exact: true }),
    ).toBeVisible()
    await expect(page.getByText('Loading stored content…')).toHaveCount(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(await identity(page)).toEqual({
      id: fixture.actor.id,
      anonymous: false,
    })
    expect(JSON.parse(command('inspect'))).toEqual(before)
    await Promise.all(responseTasks)
    expect([...userIds]).toEqual([fixture.actor.id])
    expect(requests).toEqual({ signup: 0, logout: 0, password: 1 })
    evidence.staff = {
      uuid: fixture.actor.id,
      requests,
      ordinary,
      paid,
      ignored,
      sameRunRestored: returned,
      replayRun: replay,
    }

    const anonymousContext = await browser.newContext()
    const anonymous = await anonymousContext.newPage()
    const anonTasks: Promise<void>[] = []
    let anonymousSignups = 0
    await localOnly(anonymous)
    anonymous.on('response', (r) => {
      if (
        r.ok() &&
        r.url().includes('/auth/v1/signup') &&
        r.request().method() === 'POST'
      ) {
        anonymousSignups++
        anonTasks.push(
          r.json().then((session) => {
            command('anonymous', JSON.stringify(session))
          }),
        )
      }
    })
    try {
      await anonymous.goto('/')
      await anonymous.getByRole('link', { name: /^Start simulation/ }).click()
      const anonRun = await begin(anonymous)
      const anonUser = await identity(anonymous)
      expect(anonUser.anonymous).toBe(true)
      expect(anonUser.id).not.toBe(fixture.actor.id)
      expect((await saved(anonymous, anonRun)).run.owner_user_id).toBe(
        anonUser.id,
      )
      await mutate(
        anonymous,
        anonymous.getByRole('button', { name: "See who's hiring" }),
        'submit_employment_action',
      )
      await anonymous.reload()
      expect(await runId(anonymous)).toBe(anonRun)
      await expect(
        anonymous.getByRole('button', { name: 'Submit application' }),
      ).toBeVisible()
      await anonymous
        .getByRole('button', { name: /^Choose / })
        .and(anonymous.locator(':enabled'))
        .first()
        .click()
      await mutate(
        anonymous,
        anonymous.getByRole('button', { name: 'Submit application' }),
        'submit_employment_action',
      )
      await expect(
        anonymous.getByRole('button', { name: 'Start Day 1' }),
      ).toBeVisible()
      await anonymous
        .getByRole('button', { name: 'Give Up', exact: true })
        .click()
      await anonymous
        .getByRole('dialog')
        .getByRole('button', { name: 'Give Up', exact: true })
        .click()
      await expect(
        anonymous.getByRole('heading', {
          name: 'Simulation ended early.',
          exact: true,
        }),
      ).toBeVisible()
      expect((await saved(anonymous, anonRun)).run.status).toBe('ended')
      expect(anonymousSignups).toBe(1)
      await Promise.all(anonTasks)
      evidence.anonymous = {
        uuid: anonUser.id,
        signups: anonymousSignups,
        run: anonRun,
        restored: true,
        terminated: true,
      }
    } finally {
      await Promise.all(anonTasks)
      await anonymousContext.close()
    }
    expect(await identity(page)).toEqual({
      id: fixture.actor.id,
      anonymous: false,
    })
    expect(forbidden).toEqual([])
    expect(failures).toEqual([])
    writeFileSync(
      testInfo.outputPath('verification.json'),
      JSON.stringify(evidence, null, 2),
    )
  } catch (error) {
    await page.screenshot({
      path: testInfo.outputPath('failure.png'),
      fullPage: true,
    })
    throw error
  }
})
