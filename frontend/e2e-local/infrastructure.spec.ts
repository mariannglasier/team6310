import { existsSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test('actual UI reaches only the isolated local API and reports missing application schema', async ({
  page,
}) => {
  test.skip(
    existsSync('/tmp/team6310-phase2-verification/fixture.json'),
    'Application schema installed; run employment integration instead',
  )
  const apiRequests: string[] = []
  const forbidden: string[] = []
  let writes = 0
  // No mocked Supabase responses: block all non-loopback traffic defensively.
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (
      !['http://127.0.0.1:4175', 'http://127.0.0.1:55321'].includes(url.origin)
    ) {
      forbidden.push(url.origin)
      return route.abort()
    }
    if (url.port === '55321') {
      apiRequests.push(url.href)
      if (!['GET', 'OPTIONS'].includes(request.method())) writes++
    }
    return route.continue()
  })
  await page.goto('/simulation/individual')
  await expect(page.getByRole('alert')).toContainText(
    'Unable to load households and jobs',
  )
  await expect(
    page.getByRole('button', { name: 'Continue', exact: true }),
  ).toBeDisabled()
  expect(
    apiRequests.some((url) => url.includes('/rest/v1/content_versions')),
  ).toBe(true)
  expect(forbidden).toEqual([])
  expect(writes).toBe(0)
})
