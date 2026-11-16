import { expect, test } from '@playwright/test'

test('group ending supports keyboard review and assistance replay', async ({
  page,
}, testInfo) => {
  const user = {
    id: 'host',
    is_anonymous: true,
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2026-11-16T12:00:00Z',
  }
  const state = {
    sessionId: 'session',
    joinCode: 'GROUP1234567',
    status: 'closed',
    roundState: 'completed',
    currentScenarioId: 'question',
    createdAt: '2026-11-16T12:00:00Z',
    versionId: 'edition',
    decisionDurationSeconds: 60,
    participantCount: 3,
    participantId: null,
    isHost: true,
    currentDay: 30,
    sharedBalance: '123.45',
    cacSupportEnabled: false,
  }
  await page.route('http://127.0.0.1:54321/**', async (route) => {
    const url = route.request().url()
    let body: unknown = []
    if (url.includes('/auth/v1/signup')) {
      const payload = Buffer.from(
        JSON.stringify({
          sub: user.id,
          exp: Math.floor(Date.now() / 1000) + 3600,
          is_anonymous: true,
          role: 'authenticated',
        }),
      ).toString('base64url')
      body = {
        access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`,
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user,
      }
    } else if (url.includes('/auth/v1/user')) body = user
    else if (url.includes('/rpc/get_group_session_review'))
      body = [
        {
          day: 1,
          scenarioId: 'question',
          title: 'A household decision',
          selectedChoiceId: null,
          choices: [
            { choiceId: 'a', text: 'Buy groceries', voteCount: 2 },
            { choiceId: 'b', text: 'Wait until tomorrow', voteCount: 1 },
          ],
        },
      ]
    else if (url.includes('/rpc/configure_host_group_session')) {
      const args = route.request().postDataJSON()
      if (args.p_create) {
        expect(args.p_cac_support_enabled).toBe(true)
        Object.assign(state, {
          sessionId: 'replay',
          joinCode: 'REPLAY123456',
          status: 'open',
          roundState: 'lobby',
          currentScenarioId: null,
          currentDay: 0,
          cacSupportEnabled: true,
        })
      }
      body = state
    } else if (url.includes('/rpc/get_group_session_state')) body = state
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
  await page.goto('/group/host')
  await expect(
    page.getByRole('heading', { name: 'Every choice has a story.' }),
  ).toBeVisible()
  const summary = page.locator('summary', { hasText: 'Day 1' })
  await summary.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('2 votes', { exact: true })).toBeVisible()
  await expect(page.getByText('$123.45')).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('group-ending.png'),
    fullPage: true,
  })
  await page
    .getByRole('button', { name: 'Replay with CAC assistance', exact: true })
    .click()
  await expect(page.getByText('REPLAY123456', { exact: true })).toBeVisible()
})
