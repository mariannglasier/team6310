// Pure calculations for the Explore Data visualizations. Money is integer
// cents. Sample values (cart items, job board, budget) are illustrative
// design values, not approved simulation or source data.
import { formatUsd } from '../../../lib/money'
import { usdCents } from '../../../types/domain'

const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** Whole dollars read as "$534"; amounts with cents keep both digits. */
export function usd(cents: number): string {
  return cents % 100 === 0
    ? usdWhole.format(cents / 100)
    : formatUsd(usdCents(cents))
}

export function formatTenths(tenths: number): string {
  return `${(tenths / 10).toFixed(1)}%`
}

// ---------------------------------------------------------------- Housing

export const WINDOW_COUNT = 20
// Fixed order so the same windows go dark as the share grows.
export const WINDOW_DARK_ORDER: readonly number[] = [
  3, 8, 14, 1, 17, 6, 11, 19, 4, 13, 9, 0, 16, 7, 12, 2, 18, 5, 10, 15,
]

export function darkWindowCount(percent: number, total = WINDOW_COUNT) {
  return Math.round((total * percent) / 100)
}

// The illustration relights half of the dark windows.
export function relitWindowCount(dark: number) {
  return Math.floor(dark / 2)
}

// ------------------------------------------------------------------- Food

export const GROCERY_BUDGET_CENTS = 50_000

export interface GroceryItem {
  readonly id: string
  readonly label: string
  readonly cents: number
}

// Illustrative $500 cart.
export const GROCERY_ITEMS: readonly GroceryItem[] = [
  { id: 'produce', label: 'Fresh produce', cents: 9_500 },
  { id: 'dairy', label: 'Milk and eggs', cents: 7_000 },
  { id: 'bread', label: 'Bread and grains', cents: 6_000 },
  { id: 'protein', label: 'Chicken and protein', cents: 11_000 },
  { id: 'staples', label: 'Rice and beans', cents: 4_500 },
  { id: 'breakfast', label: 'Cereal and breakfast', cents: 5_000 },
  { id: 'snacks', label: 'Snacks and lunch items', cents: 4_000 },
  { id: 'basics', label: 'Household basics', cents: 3_000 },
]

/** `tenths` is a price change in tenths of a percent (68 means +6.8%). */
export function priceAfterIncrease(cents: number, tenths: number) {
  return Math.round((cents * (1000 + tenths)) / 1000)
}

export function summarizeCart(
  removedIds: ReadonlySet<string>,
  tenths: number,
  budget = GROCERY_BUDGET_CENTS,
) {
  let fullCents = 0
  let payCents = 0
  for (const item of GROCERY_ITEMS) {
    const price = priceAfterIncrease(item.cents, tenths)
    fullCents += price
    if (!removedIds.has(item.id)) payCents += price
  }
  return {
    fullCents,
    payCents,
    pantryCents: fullCents - payCents,
    overByCents: Math.max(0, payCents - budget),
    remainingCents: budget - payCents,
    removedCount: removedIds.size,
  }
}

// ------------------------------------------------------------- Employment

export type Education = 'none' | 'diploma' | 'college'
export type EnglishLevel = 'limited' | 'proficient'

export interface JobProfile {
  readonly education: Education
  readonly english: EnglishLevel
  readonly digital: boolean
}

export interface SampleJob {
  readonly id: string
  readonly title: string
  readonly education: Education
  readonly strongEnglish: boolean
  readonly digital: boolean
}

const educationRank: Record<Education, number> = {
  none: 0,
  diploma: 1,
  college: 2,
}

export const educationLabels: Record<Education, string> = {
  none: 'No diploma needed',
  diploma: 'High school diploma or GED',
  college: 'College degree',
}

// Illustrative sample board, not real postings and not the simulation's
// approved job catalog.
export const SAMPLE_JOBS: readonly SampleJob[] = [
  {
    id: 'warehouse',
    title: 'Warehouse associate',
    education: 'none',
    strongEnglish: false,
    digital: false,
  },
  {
    id: 'housekeeper',
    title: 'Housekeeper',
    education: 'none',
    strongEnglish: false,
    digital: false,
  },
  {
    id: 'landscaper',
    title: 'Landscaping crew member',
    education: 'none',
    strongEnglish: false,
    digital: false,
  },
  {
    id: 'cook',
    title: 'Line cook',
    education: 'none',
    strongEnglish: false,
    digital: false,
  },
  {
    id: 'cashier',
    title: 'Retail cashier',
    education: 'none',
    strongEnglish: true,
    digital: true,
  },
  {
    id: 'greeter',
    title: 'Hotel front desk',
    education: 'none',
    strongEnglish: true,
    digital: true,
  },
  {
    id: 'aide',
    title: 'Home health aide',
    education: 'diploma',
    strongEnglish: true,
    digital: false,
  },
  {
    id: 'service',
    title: 'Customer service representative',
    education: 'diploma',
    strongEnglish: true,
    digital: true,
  },
  {
    id: 'office',
    title: 'Office assistant',
    education: 'diploma',
    strongEnglish: true,
    digital: true,
  },
  {
    id: 'reception',
    title: 'Medical receptionist',
    education: 'diploma',
    strongEnglish: true,
    digital: true,
  },
  {
    id: 'clerk',
    title: 'Accounting clerk',
    education: 'college',
    strongEnglish: true,
    digital: true,
  },
  {
    id: 'support',
    title: 'IT support specialist',
    education: 'college',
    strongEnglish: true,
    digital: true,
  },
]

/** Reasons a profile does not meet a job's requirements; empty when it does. */
export function jobBlockers(job: SampleJob, profile: JobProfile): string[] {
  const reasons: string[] = []
  if (educationRank[profile.education] < educationRank[job.education])
    reasons.push(`needs ${educationLabels[job.education].toLowerCase()}`)
  if (job.strongEnglish && profile.english !== 'proficient')
    reasons.push('needs strong English')
  if (job.digital && !profile.digital) reasons.push('needs computer skills')
  return reasons
}

export function openJobCount(profile: JobProfile) {
  return SAMPLE_JOBS.filter((job) => jobBlockers(job, profile).length === 0)
    .length
}

// --------------------------------------------------------------- Clothing

export type GarmentKind = 'shirt' | 'coat' | 'dress' | 'pants' | 'shoe'
export const BELT_GARMENTS: readonly GarmentKind[] = [
  'coat',
  'shirt',
  'dress',
  'pants',
  'shoe',
  'shirt',
  'coat',
  'pants',
  'dress',
  'shoe',
]

// ------------------------------------------------------------------ Youth

export const RIDER_COUNT = 18
// Seat positions drawn as "in need"; spread across the queue.
export const NEED_RIDER_SLOTS: readonly number[] = [2, 9, 15]

export function ridersInNeed(
  numerator: number,
  denominator: number,
  total = RIDER_COUNT,
) {
  return Math.round((total * numerator) / denominator)
}

// ---------------------------------------------------------------- Finance

export const BUDGET_INCOME_CENTS = 200_000
export const BUDGET_ESSENTIALS_CENTS = 185_000
export const BUDGET_STEP_CENTS = 2_500
export const BUDGET_LEFT_CENTS = BUDGET_INCOME_CENTS - BUDGET_ESSENTIALS_CENTS

export interface Allocation {
  readonly save: number
  readonly bills: number
  readonly setAside: number
}

export const EMPTY_ALLOCATION: Allocation = { save: 0, bills: 0, setAside: 0 }

export function planBudget(emergencyCents: number, allocation: Allocation) {
  const allocated = allocation.save + allocation.bills + allocation.setAside
  return {
    leftCents: BUDGET_LEFT_CENTS,
    allocatedCents: allocated,
    unallocatedCents: BUDGET_LEFT_CENTS - allocated,
    // Only money saved counts toward the emergency.
    gapCents: Math.max(0, emergencyCents - allocation.save),
  }
}

/** Moves one allocation by `deltaCents`, never below zero or past the money left. */
export function adjustAllocation(
  allocation: Allocation,
  key: keyof Allocation,
  deltaCents: number,
): Allocation {
  const { unallocatedCents } = planBudget(0, allocation)
  const next = allocation[key] + deltaCents
  if (next < 0 || deltaCents > unallocatedCents) return allocation
  return { ...allocation, [key]: next }
}
