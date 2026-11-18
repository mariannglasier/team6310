import { expect, test } from 'vitest'
import {
  GROCERY_ITEMS,
  RIDER_NEED_ORDER,
  RIDER_COUNT,
  WINDOW_COUNT,
  WINDOW_DARK_ORDER,
  basketCents,
  darkWindowCount,
  pricePresets,
  priceAfterIncrease,
  relitWindowCount,
  ridersInNeed,
  usd,
} from './dataExplorerLogic'
import { categories, sources } from './dataExplorerContent'

test('the sample basket is $500 and a 6.8% rise costs $534', () => {
  expect(GROCERY_ITEMS.reduce((sum, item) => sum + item.cents, 0)).toBe(50_000)
  expect(basketCents(0)).toBe(50_000)
  expect(basketCents(68)).toBe(53_400)
})

test('price increases use exact integer cents', () => {
  expect(priceAfterIncrease(9_500, 68)).toBe(10_146)
  expect(priceAfterIncrease(4_000, 0)).toBe(4_000)
  expect(Number.isInteger(priceAfterIncrease(3_333, 114))).toBe(true)
})

test('whole dollars drop cents and other amounts keep them', () => {
  expect(usd(53_400)).toBe('$534')
  expect(usd(10_146)).toBe('$101.46')
  expect(usd(0)).toBe('$0')
})

test('window shares and the dark order cover every window once', () => {
  expect([...WINDOW_DARK_ORDER].sort((a, b) => a - b)).toEqual(
    Array.from({ length: WINDOW_COUNT }, (_, i) => i),
  )
  expect(darkWindowCount(50)).toBe(10)
  expect(darkWindowCount(34)).toBe(7)
  expect(relitWindowCount(10)).toBe(5)
  expect(relitWindowCount(7)).toBe(3)
})

test('rider shares round to whole riders and never exceed the bus', () => {
  expect(ridersInNeed(10.1, 100)).toBe(2)
  expect(ridersInNeed(50, 100)).toBe(9)
  expect(ridersInNeed(100, 100)).toBe(RIDER_COUNT)
  expect(ridersInNeed(140, 100)).toBe(RIDER_COUNT)
  expect(ridersInNeed(0, 100)).toBe(0)
})

test('the marked-seat order covers every rider once', () => {
  expect([...RIDER_NEED_ORDER].sort((a, b) => a - b)).toEqual(
    Array.from({ length: RIDER_COUNT }, (_, i) => i),
  )
})

test('every topic has CAC facts that cite the CAC source with a year', () => {
  expect(categories.map((category) => category.id)).toEqual([
    'housing',
    'food',
    'employment',
    'clothing',
    'youth',
    'finances',
  ])
  for (const category of categories) {
    expect(category.facts.length).toBeGreaterThan(0)
    for (const fact of category.facts) {
      expect(fact.sourceId).toBe('cacOutcomes')
      expect(sources[fact.sourceId].url).toMatch(/^https:\/\//)
      expect(fact.geography.length).toBeGreaterThan(0)
      expect(fact.period).toMatch(/^\d{4}$/)
    }
  }
})

test('price presets keep only rises inside the range and drop duplicates', () => {
  expect(pricePresets([])).toEqual([{ value: 0, label: 'Last year’s prices' }])
  expect(
    pricePresets([
      { percent: 1.8, label: 'A' },
      { percent: 3.6307, label: 'B' },
      { percent: 1.84, label: 'same position as A' },
      { percent: -0.5, label: 'a fall cannot be shown' },
      { percent: 0, label: 'no change is already offered' },
      { percent: 15.1, label: 'beyond the slider' },
      { percent: Number.NaN, label: 'not a number' },
    ]),
  ).toEqual([
    { value: 0, label: 'Last year’s prices' },
    { value: 18, label: 'A' },
    { value: 36, label: 'B' },
  ])
})
