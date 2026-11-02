import { expect, test } from '@playwright/test'

test('employment board, refresh, full month and CAC replay work at each viewport', async ({
  page,
}, info) => {
  test.setTimeout(60000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('http://127.0.0.1:54321/**', async (route) => {
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
    }
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers })
    expect(route.request().method()).toBe('GET')
    const url = route.request().url()
    const body = url.includes('/content_versions')
      ? [{ version_id: 'v1', version_number: 1 }]
      : url.includes('/personas')
        ? [
            {
              persona_id: 'p1',
              version_id: 'v1',
              name: 'Alex',
              description: 'Alex — Finding His Footing. Test household.',
              general_starting_balance: '350.00',
              weekly_income: 0,
              starting_job_id: null,
              has_english_skills: false,
              has_computer_skills: false,
            },
          ]
        : url.includes('/jobs')
          ? ['First job', 'Fallback job', 'Office job'].map((title, index) => ({
              job_id: `j${index}`,
              version_id: 'v1',
              title,
              description: 'Test job posting',
              soc_code: '00-0000',
              hours_per_week: 40,
              median_hourly_wage: '10.00',
              weekly_gross_income: '400.00',
              wage_year: 2025,
              area_name: 'Test area',
              wage_source_url: 'https://www.bls.gov/',
              needs_english_skills: index === 2,
              needs_computer_skills: index === 2,
            }))
          : []
    return route.fulfill({
      status: 200,
      headers,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
  const setup = async () => {
    await page.locator('.is-center .household-choice').click()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await page.getByRole('button', { name: 'Confirm selection' }).click()
    await expect(
      page.getByRole('group', { name: 'Job bulletin board' }),
    ).toBeVisible()
  }
  const selectJob = async (name: string) => {
    await page
      .getByRole('button', { name: `Choose ${name}`, exact: true })
      .click()
  }
  const clothes = async (name: string) => {
    await page.getByRole('button', { name: new RegExp(name) }).click()
  }
  await page.goto('/simulation/individual')
  await setup()
  await expect(page.getByRole('radio')).toHaveCount(0)
  await expect(
    page.getByRole('group', { name: 'Job bulletin board' }),
  ).toHaveCSS('border-top-color', 'rgb(179, 38, 30)')
  const available = page.getByRole('button', {
    name: 'Choose First job',
    exact: true,
  })
  const unavailable = page.getByRole('button', {
    name: 'Choose Office job',
    exact: true,
  })
  const normalShadow = await available.evaluate(
    (node) => getComputedStyle(node).boxShadow,
  )
  const lockedShadow = await unavailable.evaluate(
    (node) => getComputedStyle(node).boxShadow,
  )
  await unavailable.hover({ force: true })
  await expect(unavailable).toHaveCSS('box-shadow', lockedShadow)
  await available.hover()
  await expect(available).not.toHaveCSS('box-shadow', normalShadow)
  await expect(page.locator('.employment-sidebar')).toHaveCount(0)
  await expect(
    page.getByText('Selecting a posting does not hire you.'),
  ).toHaveCount(0)
  await expect(
    page.getByText(
      /BLS OEWS|skills not required|Not available for this application/,
    ),
  ).toHaveCount(0)
  await expect(
    page.getByText('Qualifications not met', { exact: true }),
  ).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'Choose Office job', exact: true }),
  ).toBeDisabled()
  await page.screenshot({ path: info.outputPath('job-board.png') })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await selectJob('First job')
  await page.getByRole('button', { name: 'Start Day 1' }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await clothes('Buy professional clothes')
  await page.reload()
  await page.getByRole('button', { name: 'Reapply today' }).click()
  await selectJob('Fallback job')
  await page.getByRole('button', { name: 'Continue Day 2' }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.employment-choice')).toHaveCount(1)
  await clothes('Wear my professional clothes')
  await page.getByRole('button', { name: 'Continue Day 3' }).click()
  for (let day = 3; day <= 30; day++) {
    if ([10, 17, 24].includes(day)) {
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Your weekly pay has arrived.',
      )
      if (day === 10) {
        await page.reload()
      }
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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'You reached Day 30.',
  )
  await expect(page.getByText('$1,490.00', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Try again with CAC support' }).click()
  await setup()
  await page.getByRole('button', { name: 'Complete CAC preparation' }).click()
  await page.getByRole('button', { name: 'Return to job board' }).click()
  await expect(
    page.getByRole('button', { name: 'Choose Office job', exact: true }),
  ).toBeEnabled()
  await selectJob('Office job')
  await page.getByRole('button', { name: 'Start Day 1' }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await clothes('Use the CAC clothing closet')
  await expect(
    page.getByRole('heading', { name: 'You got the Office job job.' }),
  ).toBeVisible()
  await page.screenshot({ path: info.outputPath('cac-interview-result.png') })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect(errors).toEqual([])
})
