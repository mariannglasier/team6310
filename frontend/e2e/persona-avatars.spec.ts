import { expect, test, type Locator } from '@playwright/test'

// Exercise the real household, individual and participant layouts with local
// transport fixtures. No Auth accounts, runs or group records are created.
for (const [name, background] of [
  ['Alex', 'rgb(220, 235, 249)'],
  ['Jordan & Maya', 'rgb(251, 229, 227)'],
  ['Patricia', 'rgb(228, 234, 217)'],
  ['Sofia', 'rgb(235, 228, 245)'],
  ['Someone New', 'rgb(233, 233, 233)'],
]) {
  test(`${name} artwork loads in household cards and both profile layouts`, async ({
    page,
  }, testInfo) => {
    const persona = {
      persona_id: 'persona',
      version_id: 'edition',
      name,
      description: `${name} — A household finding its footing.`,
      general_starting_balance: 200,
      has_english_skills: false,
      has_computer_skills: false,
    }
    const user = {
      id: 'owner',
      is_anonymous: true,
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2026-11-13T00:00:00Z',
    }
    const run = {
      playthrough_id: 'run',
      persona_id: 'persona',
      version_id: 'edition',
      owner_user_id: 'owner',
      current_balance: 200,
      current_day: 1,
      current_job_id: null,
      current_scenario_id: null,
      cac_support_enabledabled: null,
      employment_state: {
        engine: 'employment-v1',
        schemaVersion: 1,
        stage: 'uninitialized',
        revision: 0,
        receipts: {},
      },
      status: 'active',
      session_id: null,
      started_at: null,
    }
    const session = {
      sessionId: 'session',
      joinCode: 'ABCD1234EF56',
      createdAt: '2026-11-13T00:00:00Z',
      versionId: 'edition',
      status: 'open',
      currentScenarioId: null,
      participantId: 'participant',
      isHost: false,
      decisionDurationSeconds: 60,
      participantCount: 1,
      roundState: 'voting',
      roundType: 'scenario',
      householdName: name,
      sharedHouseholdName: name,
      sharedBalance: 200,
      currentDay: 1,
      acceptingVotes: true,
      question: {
        scenarioId: 'scenario',
        title: 'A household decision',
        description: 'Consider your next step.',
        choices: [],
      },
    }
    await page.route('http://127.0.0.1:54321/**', async (route) => {
      const url = route.request().url()
      const headers = {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': '*',
      }
      if (route.request().method() === 'OPTIONS')
        return route.fulfill({ status: 204, headers })
      let body: unknown = []
      if (url.includes('/auth/v1/signup')) {
        const payload = Buffer.from(
          JSON.stringify({
            sub: 'owner',
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
        ).toString('base64url')
        body = {
          access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`,
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user,
        }
      } else if (url.includes('/auth/v1/user')) body = user
      else if (url.includes('/rpc/start_individual_playthrough')) body = 'run'
      else if (url.includes('/rpc/get_bill_snapshot'))
        body = {
          run,
          bills: [],
          paid_total: 0,
          overdue_total: 0,
          outstanding_total: 0,
          upcoming_total: 0,
          scenario_income: 0,
          scenario_charged: 0,
        }
      else if (
        url.includes('/rpc/join_group_session') ||
        url.includes('/rpc/get_group_session_state')
      )
        body = session
      else if (url.includes('/content_versions'))
        body = [{ version_id: 'edition', version_number: 1 }]
      else if (url.includes('/personas')) body = [persona]
      else if (url.includes('/playthroughs')) body = [run]
      await route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })
    })
    const loaded = async (image: Locator) => {
      await expect(image).toBeVisible()
      await expect
        .poll(() =>
          image.evaluate(
            (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
          ),
        )
        .toBe(true)
      await expect(image).toHaveAttribute('alt', '')
    }
    await page.goto('/simulation/individual')
    const card = page.locator('.household-photo .persona-avatar')
    await loaded(card)
    await expect(page.locator('.household-photo')).toHaveCSS(
      'background-color',
      background,
    )
    await expect(card).not.toHaveAttribute('src', /#profile$/)
    if (name === 'Someone New')
      await expect(card).toHaveClass(/persona-avatar--generic/)
    await page.screenshot({
      path: testInfo.outputPath('household.png'),
      fullPage: true,
      animations: 'disabled',
    })
    await page
      .getByRole('button', { name: `Choose ${name}`, exact: true })
      .click()
    await page.getByRole('button', { name: 'Start simulation' }).click()
    await expect(
      page.getByRole('button', { name: "See who's hiring" }),
    ).toBeVisible()
    const profile = page.locator('.finance-avatar .persona-avatar')
    await loaded(profile)
    await expect(profile).toHaveAttribute('src', /#profile$/)
    const checkProfileSize = async () => {
      await expect(page.locator('.finance-avatar')).toHaveCSS(
        'background-color',
        background,
      )
      const size = (await page.locator('.finance-avatar').boundingBox())!
      const image = (await profile.boundingBox())!
      expect(image.width).toBeCloseTo(size.width, 1)
      expect(image.height).toBeCloseTo(size.height, 1)
      expect(
        await profile.evaluate((node) => getComputedStyle(node).objectPosition),
      ).toBe('50% 100%')
      // Sample the loaded SVG itself: the figure must reach its lower edge,
      // rather than merely bottom-positioning a canvas with blank space below it.
      const bottom = await profile.evaluate((node: HTMLImageElement) => {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 128
        const context = canvas.getContext('2d')!
        context.drawImage(node, 0, 0, 128, 128)
        const pixels = context.getImageData(0, 0, 128, 128).data
        for (let y = 127; y >= 0; y--)
          for (let x = 0; x < 128; x++) {
            const i = (y * 128 + x) * 4
            if (
              pixels[i + 3] > 200 &&
              Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) < 220
            )
              return y
          }
        return -1
      })
      expect(bottom).toBeGreaterThanOrEqual(126)
      if (page.viewportSize()!.width <= 760) {
        expect(size.width).toBe(48)
        expect(size.height).toBe(48)
      } else if (page.viewportSize()!.width >= 1151) {
        expect(size.width).toBe(88)
        expect(size.height).toBe(88)
      } else {
        // The existing semi-wide sidebars are fluid and need not be identical.
        expect(size.width).toBeLessThanOrEqual(160)
        expect(size.width / size.height).toBeCloseTo(1.5, 2)
      }
    }
    await checkProfileSize()
    await page.screenshot({
      path: testInfo.outputPath('individual.png'),
      fullPage: true,
      animations: 'disabled',
    })
    await page.goto('/group/join')
    await page.getByLabel('Session code').fill('ABCD1234EF56')
    await page.getByRole('button', { name: /^Join session/ }).click()
    await expect(
      page.getByRole('heading', { name: 'A household decision' }),
    ).toBeVisible()
    await loaded(profile)
    await expect(profile).toHaveAttribute('src', /#profile$/)
    await checkProfileSize()
    await page.screenshot({
      path: testInfo.outputPath('group.png'),
      fullPage: true,
      animations: 'disabled',
    })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  })
}
