import { expect, test } from '@playwright/test'
for (const [label, amount] of [
  ['Gain $25.00', 25],
  ['Spend $15.00', -15],
  ['No financial change', 0],
] as const) {
  test(`individual Day 4: ${label}, recap, refresh and Continue`, async ({
    page,
  }) => {
    await page.goto('/simulation')
    // Prepare a real employment run through existing protected actions, not admin writes.
    await page.evaluate(async () => {
      // @ts-expect-error Vite serves this runtime module in the local verification server.
      const { supabase: client } = await import('/src/lib/supabaseClient.ts')
      const auth = await client.auth.signInAnonymously()
      if (auth.error) throw auth.error
      const { data: id, error } = await client.rpc(
        'start_individual_playthrough',
        { p_persona_id: 'cfe33068-d657-482f-b770-ef3918a87e03' },
      )
      if (error) throw error
      const { data: jobs } = await client
        .from('jobs')
        .select('job_id')
        .eq('version_id', '3c463a7f-7036-4e0c-9c1b-1f5db7c502f3')
        .eq('needs_english_skills', false)
        .eq('needs_computer_skills', false)
        .order('job_id')
      async function act(action: object) {
        const { data: row } = await client
          .from('playthroughs')
          .select('employment_state')
          .eq('playthrough_id', id)
          .single()
        const { error } = await client.rpc('submit_employment_action', {
          p_run_id: id,
          p_request_id: crypto.randomUUID(),
          p_revision: row.employment_state.revision,
          p_action: action,
        })
        if (error) throw error
      }
      await act({ type: 'initialize' })
      await act({ type: 'apply', jobId: jobs[0].job_id })
      await act({ type: 'continue' })
      await act({ type: 'continue' })
      await act({ type: 'interview', choice: 'purchase' })
      await act({ type: 'continue' })
      await act({ type: 'apply', jobId: jobs[1].job_id })
      await act({ type: 'continue' })
      await act({ type: 'continue' })
      await act({ type: 'interview', choice: 'owned' })
      await act({ type: 'continue' })
      await act({ type: 'continue' })
      localStorage.setItem(`cac-employment-v1:${auth.data.user.id}:run`, id)
    })
    await page.reload()
    await expect(
      page.getByRole('heading', { name: '[LOCAL TEST] A decision for Day 4' }),
    ).toBeVisible()
    await expect(
      page.getByLabel('Current balance $140.00', { exact: true }),
    ).toBeVisible()
    await page
      .getByRole('button', { name: new RegExp(label.replace(/[.$]/g, '\\$&')) })
      .click()
    await expect(
      page.getByLabel('Current balance $140.00', { exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Submit decision' }).click()
    await expect(
      page.getByRole('button', { name: 'Continue to next day', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByLabel(`Current balance $${(140 + amount).toFixed(2)}`, {
        exact: true,
      }),
    ).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole('button', { name: 'Continue to next day', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Submit decision' }),
    ).toHaveCount(0)
    await expect(
      page
        .getByText('Starting balance', { exact: true })
        .locator('..')
        .locator('dd'),
    ).toHaveText('$200.00')
    await expect(
      page
        .getByText('Total income received', { exact: true })
        .locator('..')
        .locator('dd'),
    ).toHaveText(`$${Math.max(0, amount).toFixed(2)}`)
    await expect(
      page
        .getByText('Total expenses charged', { exact: true })
        .locator('..')
        .locator('dd'),
    ).toHaveText(`$${(60 + Math.max(0, -amount)).toFixed(2)}`)
    await page
      .getByRole('button', { name: 'Continue to next day', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Day 5 of 30', includeHidden: true }),
    ).toBeAttached()
    for (const [day, title] of [
      [5, 'An opportunity'],
      [6, 'An unexpected expense'],
      [7, 'A household tradeoff'],
    ] as const) {
      await expect(
        page.getByRole('heading', {
          name: `[LOCAL TEST] Day ${day} - ${title}`,
          exact: true,
        }),
      ).toBeVisible()
      await page.getByRole('button', { name: /No financial change/ }).click()
      await page
        .getByRole('button', { name: 'Submit decision', exact: true })
        .click()
      await expect(
        page.getByText(`Day ${day}: Your balance is unchanged.`, {
          exact: true,
        }),
      ).toBeVisible()
      await page.reload()
      await expect(
        page.getByText(`Day ${day}: Your balance is unchanged.`, {
          exact: true,
        }),
      ).toBeVisible()
      await page
        .getByRole('button', { name: 'Continue to next day', exact: true })
        .click()
    }
    await expect(
      page.getByRole('heading', { name: 'Day 8 of 30', includeHidden: true }),
    ).toBeAttached()
    await expect(
      page.getByRole('button', { name: 'Next', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByLabel(`Current balance $${(140 + amount).toFixed(2)}`, {
        exact: true,
      }),
    ).toBeVisible()
  })
}
