import { expect, it } from 'vitest'
import { gameplayText, scenarioDescription } from './gameplayText'

it('clarifies the lunch decision in previously published editions', () => {
  expect(
    scenarioDescription(
      'You can prepare lunches ahead of time or get lunch out with your coworkers. One option takes more time now; the other costs more money.',
      false,
    ),
  ).toBe(
    "You can prepare lunches ahead of time or get lunch out with your coworkers for this week's lunches. One option takes more time now; the other costs more money.",
  )
})

it('uses the past-year wording for saved annual price facts while retaining other dated facts', () => {
  expect(
    gameplayText(
      'Between 2025-09 and 2026-09, the average price of apparel increased by 3.4%.',
    ),
  ).toBe('In the past year, the average price of apparel increased by 3.4%.')
  expect(gameplayText('In 2020–2024, 4.0% of residents were unemployed.')).toBe(
    'In 2020–2024, 4.0% of residents were unemployed.',
  )
})

it('uses clear increase/decrease wording for older saved price-change facts', () => {
  expect(gameplayText('The average price of apparel changed by 3.4%.')).toBe(
    'The average price of apparel increased by 3.4%.',
  )
  expect(gameplayText('The average price of apparel changed by -3.4%.')).toBe(
    'The average price of apparel decreased by 3.4%.',
  )
  expect(gameplayText('The average price of apparel changed by 0.0%.')).toBe(
    'The average price of apparel did not change.',
  )
})

it('repairs older encoded punctuation and preserves correctly encoded words', () => {
  expect(
    gameplayText('The price isnâ€™t the same. Mayaâ€™s coat â€“ a necessity.'),
  ).toBe('The price isn’t the same. Maya’s coat – a necessity.')
  expect(gameplayText('Maya’s coat isn’t ready.')).toBe(
    'Maya’s coat isn’t ready.',
  )
})
it('keeps support-only service descriptions out of regular-mode old editions', () => {
  const coat =
    'Your coat is worn out. You can replace it, repair it, or look for a secondhand coat through Canopy Thrift.'
  expect(scenarioDescription(coat, false)).toBe(
    'Your coat is worn out. You can replace it or repair it.',
  )
  expect(scenarioDescription(coat, true)).toBe(coat)
  expect(
    scenarioDescription(
      'You can buy the gift you planned, choose a smaller gift, give your time, or use Canopy Thrift credits to find a gift.',
      false,
    ),
  ).toBe(
    'You can buy the gift you planned, choose a smaller gift, or give your time.',
  )
})
