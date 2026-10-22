import { expect, test } from '@playwright/test'

test('landing renders without overflow, missing images, overlap, or console errors', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Financial hardship can happen to anyone. How would you respond?',
  )
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Start simulation' }),
  ).toBeVisible()
  const geometry = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    images: [...document.images].map((image) => ({
      loaded: image.complete && image.naturalWidth > 0,
      width: image.width,
      height: image.height,
    })),
    linksInViewport: [...document.querySelectorAll('a')]
      .filter((link) => !link.classList.contains('skip-link'))
      .every((link) => {
        const box = link.getBoundingClientRect()
        return box.left >= 0 && box.right <= window.innerWidth
      }),
    headerBottom: document.querySelector('header')!.getBoundingClientRect()
      .bottom,
    mainTop: document.querySelector('main')!.getBoundingClientRect().top,
    mainBottom: document.querySelector('main')!.getBoundingClientRect().bottom,
    footerTop: document.querySelector('footer')!.getBoundingClientRect().top,
    cards: [...document.querySelectorAll('.landing-step')].map((card) => {
      const box = card.getBoundingClientRect()
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
      }
    }),
  }))
  expect(geometry.overflow).toBe(false)
  expect(geometry.linksInViewport).toBe(true)
  expect(geometry.images).toHaveLength(3)
  geometry.images.forEach((image) => {
    expect(image.loaded).toBe(true)
    expect(image.width).toBeGreaterThan(0)
    expect(image.height).toBeGreaterThan(0)
  })
  expect(geometry.headerBottom).toBeLessThanOrEqual(geometry.mainTop)
  expect(geometry.mainBottom).toBeLessThanOrEqual(geometry.footerTop)
  for (let index = 1; index < geometry.cards.length; index++) {
    const previous = geometry.cards[index - 1]
    const current = geometry.cards[index]
    expect(
      current.left >= previous.right || current.top >= previous.bottom,
    ).toBe(true)
  }
  await page.screenshot({
    path: testInfo.outputPath('landing.png'),
    fullPage: true,
  })
  expect(errors).toEqual([])
})

test('keyboard and Play navigation reach the individual placeholder', async ({
  page,
}) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  const play = page
    .getByRole('main')
    .getByRole('link', { name: 'Start simulation' })
  await play.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/simulation\/individual$/)
  await expect(
    page.getByRole('heading', { name: 'Individual simulation' }),
  ).toBeFocused()
})

test('Learn and Donate navigate to the approved URLs', async ({ page }) => {
  // Intercept the external pages to verify the actual navigation without
  // depending on third-party uptime or loading a payment provider in tests.
  await page.route('https://ourcac.org/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<title>CAC destination test</title>',
    }),
  )
  for (const [label, url] of [
    ['Learn About CAC', 'https://ourcac.org/'],
    ['Donate', 'https://ourcac.org/donate-online/'],
  ]) {
    await page.goto('/')
    await page
      .getByRole('navigation')
      .getByRole('link', { name: label })
      .click()
    await expect(page).toHaveURL(url)
  }
})

test('landing group links and reserved data destination are connected', async ({
  page,
}) => {
  for (const [label, path] of [
    ['Join a group', '/group/join'],
    ['Host a group', '/group/host'],
    ['Explore Data', '/data'],
  ]) {
    await page.goto('/')
    await page.getByRole('link', { name: label, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
  }
})

test('placeholder header matches landing and both logos navigate home', async ({
  page,
}) => {
  await page.goto('/simulation/individual')
  await expect(
    page.getByRole('contentinfo').getByRole('heading', { name: 'Contact CAC' }),
  ).toBeVisible()
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Return to landing page' })
    .click()
  await expect(page).toHaveURL('http://127.0.0.1:4173/')
  await page.goto('/simulation/individual')
  await expect(page.getByRole('navigation').getByRole('link')).toHaveText([
    'Learn About CAC',
    'Explore Data',
    'Donate',
  ])
  await page
    .getByRole('banner')
    .getByRole('link', { name: 'CAC Poverty Simulation' })
    .click()
  await expect(page).toHaveURL('http://127.0.0.1:4173/')
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Return to landing page' })
    .click()
  await expect(page).toHaveURL('http://127.0.0.1:4173/')
})
