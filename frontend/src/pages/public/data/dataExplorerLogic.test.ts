import { expect, test } from 'vitest'
import {
  BUDGET_LEFT_CENTS,
  BUDGET_STEP_CENTS,
  EMPTY_ALLOCATION,
  GROCERY_BUDGET_CENTS,
  GROCERY_ITEMS,
  NEED_RIDER_SLOTS,
  RIDER_COUNT,
  SAMPLE_JOBS,
  WINDOW_COUNT,
  WINDOW_DARK_ORDER,
  adjustAllocation,
  darkWindowCount,
  jobBlockers,
  openJobCount,
  planBudget,
  priceAfterIncrease,
  relitWindowCount,
  ridersInNeed,
  summarizeCart,
  usd,
} from './dataExplorerLogic'
import { categories, facts, sources } from './dataExplorerContent'

test('sample cart is a $500 budget and a 6.8% rise costs $534', () => {
  expect(GROCERY_ITEMS.reduce((sum, item) => sum + item.cents, 0)).toBe(
    GROCERY_BUDGET_CENTS,
  )
  expect(summarizeCart(new Set(), 68).fullCents).toBe(53_400)
  expect(summarizeCart(new Set(), 0).overByCents).toBe(0)
})

test('price increases use exact integer cents', () => {
  expect(priceAfterIncrease(9_500, 68)).toBe(10_146)
  expect(priceAfterIncrease(4_000, 0)).toBe(4_000)
  expect(Number.isInteger(priceAfterIncrease(3_333, 114))).toBe(true)
})

test('removing items lowers what you pay and tracks the pantry value', () => {
  const removed = new Set(['protein', 'produce'])
  const cart = summarizeCart(removed, 68)
  expect(cart.payCents).toBe(53_400 - 10_146 - 11_748)
  expect(cart.pantryCents).toBe(10_146 + 11_748)
  expect(cart.fullCents).toBe(cart.payCents + cart.pantryCents)
  expect(cart.overByCents).toBe(0)
  expect(cart.remainingCents).toBe(GROCERY_BUDGET_CENTS - cart.payCents)
  expect(cart.removedCount).toBe(2)
})

test('over budget reports the shortfall', () => {
  const cart = summarizeCart(new Set(), 68)
  expect(cart.overByCents).toBe(3_400)
  expect(cart.remainingCents).toBe(-3_400)
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

test('one in six riders is three of eighteen and fits the marked seats', () => {
  expect(ridersInNeed(1, 6)).toBe(3)
  expect(NEED_RIDER_SLOTS.length).toBeGreaterThanOrEqual(3)
  expect(NEED_RIDER_SLOTS.every((slot) => slot < RIDER_COUNT)).toBe(true)
})

test('job profiles open and close postings with named reasons', () => {
  const start = {
    education: 'none',
    english: 'limited',
    digital: false,
  } as const
  expect(openJobCount(start)).toBe(4)
  const cashier = SAMPLE_JOBS.find((job) => job.id === 'cashier')!
  expect(jobBlockers(cashier, start)).toEqual([
    'needs strong English',
    'needs computer skills',
  ])
  const classes = { ...start, english: 'proficient', digital: true } as const
  expect(openJobCount(classes)).toBe(6)
  expect(
    openJobCount({
      education: 'diploma',
      english: 'proficient',
      digital: true,
    }),
  ).toBe(10)
  expect(
    openJobCount({
      education: 'college',
      english: 'proficient',
      digital: true,
    }),
  ).toBe(SAMPLE_JOBS.length)
})

test('classes never lower the open count', () => {
  for (const education of ['none', 'diploma', 'college'] as const) {
    const before = openJobCount({
      education,
      english: 'limited',
      digital: false,
    })
    const after = openJobCount({
      education,
      english: 'proficient',
      digital: true,
    })
    expect(after).toBeGreaterThanOrEqual(before)
  }
})

test('budget gap counts only saved money', () => {
  expect(BUDGET_LEFT_CENTS).toBe(15_000)
  expect(planBudget(20_000, EMPTY_ALLOCATION).gapCents).toBe(20_000)
  const saved = { save: 15_000, bills: 0, setAside: 0 }
  const plan = planBudget(20_000, saved)
  expect(plan.gapCents).toBe(5_000)
  expect(plan.unallocatedCents).toBe(0)
  const billsOnly = { save: 0, bills: 15_000, setAside: 0 }
  expect(planBudget(20_000, billsOnly).gapCents).toBe(20_000)
  expect(
    planBudget(10_000, { save: 15_000, bills: 0, setAside: 0 }).gapCents,
  ).toBe(0)
})

test('allocations stay between zero and the money left', () => {
  let allocation = EMPTY_ALLOCATION
  expect(adjustAllocation(allocation, 'save', -BUDGET_STEP_CENTS)).toBe(
    allocation,
  )
  for (let i = 0; i < 6; i++)
    allocation = adjustAllocation(allocation, 'save', BUDGET_STEP_CENTS)
  expect(allocation.save).toBe(15_000)
  expect(adjustAllocation(allocation, 'bills', BUDGET_STEP_CENTS)).toBe(
    allocation,
  )
  allocation = adjustAllocation(allocation, 'save', -BUDGET_STEP_CENTS)
  allocation = adjustAllocation(allocation, 'bills', BUDGET_STEP_CENTS)
  expect(allocation).toEqual({ save: 12_500, bills: 2_500, setAside: 0 })
})

test('every fact and category cites a known source with geography and period', () => {
  for (const fact of Object.values(facts)) {
    expect(sources[fact.sourceId].url).toMatch(/^https:\/\//)
    expect(fact.geography.length).toBeGreaterThan(0)
    expect(fact.period.length).toBeGreaterThan(0)
    if ('percent' in fact) {
      expect(fact.percent).toBeGreaterThan(0)
      expect(fact.percent).toBeLessThanOrEqual(100)
    }
  }
  expect(categories.map((category) => category.id)).toEqual([
    'housing',
    'food',
    'employment',
    'clothing',
    'youth',
    'finances',
  ])
  for (const category of categories)
    expect(category.facts.length).toBeGreaterThan(0)
})
