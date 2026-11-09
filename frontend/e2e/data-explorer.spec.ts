import { expect, test } from '@playwright/test'

const topics = [
  'Housing',
  'Food',
  'Employment',
  'Clothing',
  'Youth',
  'Finances',
]

test('Explore Data topics fit the viewport in both modes without console errors', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/data')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Explore our community',
  )
  for (const topic of topics) {
    await page.getByRole('tab', { name: topic }).click()
    for (const mode of ['Explore challenges', 'See CAC impact']) {
      await page.getByRole('button', { name: mode }).click()
      const layout = await page.evaluate(() => {
        const panel = document.querySelector<HTMLElement>('.stage__panel')!
        const bounds = panel.getBoundingClientRect()
        return {
          pageOverflow:
            document.documentElement.scrollWidth > window.innerWidth,
          panelOverflow: panel.scrollWidth > panel.clientWidth,
          escaping: [...panel.querySelectorAll('*')]
            .filter((element) => !element.closest('.belt'))
            .filter((element) => {
              const box = element.getBoundingClientRect()
              return (
                box.width > 0 &&
                (box.right > bounds.right + 1 || box.left < bounds.left - 1)
              )
            }).length,
        }
      })
      expect(layout, `${topic} / ${mode}`).toEqual({
        pageOverflow: false,
        panelOverflow: false,
        escaping: 0,
      })
    }
  }
  expect(errors).toEqual([])
})

test('Explore Data tabs work from the keyboard', async ({ page }) => {
  await page.goto('/data')
  await page.getByRole('tab', { name: 'Housing' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Food' })).toBeFocused()
  await expect(
    page.getByRole('heading', { level: 2, name: 'Stretch a grocery budget' }),
  ).toBeVisible()
})
