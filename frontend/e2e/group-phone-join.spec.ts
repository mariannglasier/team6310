import { expect, test, type BrowserContext } from '@playwright/test'

test('phone joins, votes, reconnects and reads group results by keyboard', async ({
  browser,
  page,
}, testInfo) => {
  test.skip(!['mobile', 'narrow-mobile'].includes(testInfo.project.name))

  const host = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  })
  const facilitator = await host.newPage()
  const code = 'K7M4'
  const sessionId = 'group-one'
  let created = false
  let joined = false
  let ready = false
  let round: 'lobby' | 'voting' | 'results' = 'lobby'
  let selected: string | null = null
  let joinCalls = 0
  let phoneSignups = 0
  let phoneDisconnected = false
  let deadline = new Date(Date.now() + 120_000).toISOString()

  async function mockBackend(context: BrowserContext, isHost: boolean) {
    const sub = isHost ? 'facilitator' : 'participant'
    const user = {
      id: sub,
      is_anonymous: true,
      role: 'authenticated',
      aud: 'authenticated',
    }
    const payload = Buffer.from(
      JSON.stringify({
        sub,
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64url')
    await context.route('http://127.0.0.1:54321/**', async (route) => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      const args = request.method() === 'POST' ? request.postDataJSON() : null
      const state = () => ({
        sessionId,
        joinCode: code,
        status: 'open',
        roundState: round,
        currentScenarioId: round === 'lobby' ? null : 'q',
        currentDay: round === 'lobby' ? 0 : 1,
        roundType: 'scenario',
        createdAt: '2026-11-17T12:00:00Z',
        versionId: 'edition',
        decisionDurationSeconds: 60,
        participantCount: joined ? 1 : 0,
        participantId: isHost ? null : 'member',
        isHost,
        householdId: isHost ? null : 'household',
        householdName: 'Jordan',
        ready,
        readyCount: Number(ready),
        sharedBalance: '400',
        acceptingVotes: round === 'voting' && Date.parse(deadline) > Date.now(),
        roundDeadline: round === 'voting' ? deadline : null,
        selectedChoiceId: isHost ? null : selected,
        voteCount: Number(Boolean(selected)),
        roundFacts:
          round === 'results'
            ? [
                {
                  role: 'general',
                  text: 'A verified fact about this household decision.',
                  sourceUrl: 'https://example.com/fact',
                  copyKind: 'fact',
                },
              ]
            : [],
        question:
          round === 'lobby'
            ? null
            : {
                scenarioId: 'q',
                title: 'Groceries',
                description: 'Choose what to buy.',
                choices: [
                  {
                    choiceId: 'buy',
                    text: 'Buy groceries',
                    balanceChange: -25,
                    upfrontCost: 0,
                    voteCount:
                      round === 'results' ? Number(selected === 'buy') : null,
                  },
                  {
                    choiceId: 'wait',
                    text: 'Wait',
                    balanceChange: 0,
                    upfrontCost: 0,
                    voteCount:
                      round === 'results' ? Number(selected === 'wait') : null,
                  },
                ],
              },
      })
      let body: unknown = []
      if (path.endsWith('/signup')) {
        if (!isHost) phoneSignups++
        body = {
          access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`,
          refresh_token: 'refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user,
        }
      } else if (path.endsWith('/user')) body = user
      else if (path.endsWith('/configure_host_group_session')) {
        if (args.p_create) created = true
        body = created ? state() : null
      } else if (path.endsWith('/join_group_session')) {
        joinCalls++
        if (args.p_code === code && created) {
          joined = true
          body = state()
        } else
          body = {
            error:
              'Session unavailable. Check the code with your facilitator and try again.',
          }
      } else if (path.endsWith('/get_group_session_state')) {
        expect(args.p_session_id).toBe(sessionId)
        if (!isHost && phoneDisconnected) {
          await route.fulfill({ status: 503, json: { message: 'Unavailable' } })
          return
        }
        body = state()
      } else if (path.endsWith('/update_group_participant_setup')) {
        ready = args.p_ready
        body = state()
      } else if (path.endsWith('/submit_group_vote')) {
        selected = args.p_choice_id
        body = state()
      } else if (path.endsWith('/control_group_session')) {
        expect(isHost).toBe(true)
        round = args.p_action === 'start' ? 'voting' : 'results'
        body = state()
      }
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(body),
      })
    })
  }

  const noOverflow = async () =>
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)

  await mockBackend(host, true)
  await mockBackend(page.context(), false)
  try {
    await facilitator.goto('/group/host')
    await facilitator
      .getByRole('button', { name: /create group session/i })
      .click()
    await expect(facilitator.getByText(code, { exact: true })).toBeVisible()
    await page.goto('/group/join')
    const codeInput = page.getByLabel(/Session code/)
    await expect(page.locator('form input')).toHaveCount(1)
    await expect(page.getByText(/facilitator sets CAC support/i)).toBeVisible()
    await codeInput.fill('NOPE')
    await codeInput.press('Enter')
    await expect(page.getByRole('alert')).toHaveText(/session unavailable/i)
    await codeInput.fill(code.toLowerCase())
    await codeInput.press('Tab')
    await expect(
      page.getByRole('button', { name: /join session/i }),
    ).toBeFocused()
    await page.keyboard.press('Enter')
    const readyButton = page.getByRole('button', { name: /I’m ready/i })
    await readyButton.focus()
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('heading', { name: /take a breath/i }),
    ).toBeVisible()
    await noOverflow()

    await facilitator.getByRole('button', { name: 'Start session' }).click()
    const option = page.getByRole('button', { name: /buy groceries/i })
    await option.focus()
    await page.keyboard.press('Enter')
    await expect(option).toHaveAttribute('aria-pressed', 'true')
    await noOverflow()

    phoneDisconnected = true
    await expect(page.getByText(/group updates are delayed/i)).toBeVisible()
    await expect(option).toBeDisabled()
    phoneDisconnected = false
    await expect(page.getByText(/group updates are delayed/i)).toHaveCount(0)
    await expect(option).toHaveAttribute('aria-pressed', 'true')
    await expect(option).toBeEnabled()

    await page.reload()
    await expect(option).toHaveAttribute('aria-pressed', 'true')
    expect(joinCalls).toBe(2)
    expect(phoneSignups).toBe(1)
    deadline = new Date(Date.now() - 1_000).toISOString()
    await expect(option).toBeDisabled()
    await expect(
      page.getByText(/waiting for the facilitator to reveal/i),
    ).toBeVisible()
    await expect(page.getByText('1 vote (100%)')).toHaveCount(0)
    await facilitator.getByRole('button', { name: 'Reveal results' }).click()
    await expect(page.getByText('1 vote (100%)')).toBeVisible()
    await expect(page.getByText('1 of 1 answered · 0 unanswered')).toBeVisible()
    await expect(
      page.getByText('Percentages are based on 1 vote cast.'),
    ).toBeVisible()
    await expect(
      page.getByText('A verified fact about this household decision.'),
    ).toBeVisible()
    await expect(
      facilitator.getByText('A verified fact about this household decision.'),
    ).toBeVisible()
    await expect(option).toBeDisabled()
    await expect(
      page.getByRole('button', { name: 'Reveal results' }),
    ).toHaveCount(0)
    await noOverflow()
  } finally {
    await host.close()
  }
})
