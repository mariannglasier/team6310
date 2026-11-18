// Pure calculations for the Explore Data visualizations. Money is integer
// cents. The sample basket's prices are an illustrative design value, not
// approved simulation or source data; every percentage comes from a published
// statistic.
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

export interface GroceryItem {
  readonly id: string
  readonly label: string
  readonly cents: number
}

// Illustrative $500 basket.
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

export const MAX_PRICE_CHANGE_TENTHS = 150

export interface PricePreset {
  readonly value: number
  readonly label: string
  /** Place and period behind the figure, shown once the preset is chosen. */
  readonly detail?: string
}

/**
 * Slider presets taken from published price changes. A change that is not a
 * rise inside the slider's range cannot be shown, and two changes that land on
 * the same slider position are shown once, under the first label.
 */
export function pricePresets(
  published: readonly {
    readonly percent: number
    readonly label: string
    readonly detail?: string
  }[],
): readonly PricePreset[] {
  const presets: PricePreset[] = [{ value: 0, label: 'Last year’s prices' }]
  for (const { percent, label, detail } of published) {
    const tenths = Math.round(percent * 10)
    if (
      !Number.isFinite(percent) ||
      tenths <= 0 ||
      tenths > MAX_PRICE_CHANGE_TENTHS ||
      presets.some((preset) => preset.value === tenths)
    )
      continue
    presets.push({ value: tenths, label, detail })
  }
  return presets
}

/** What the sample basket costs after a price change of `tenths`. */
export function basketCents(tenths: number) {
  return GROCERY_ITEMS.reduce(
    (sum, item) => sum + priceAfterIncrease(item.cents, tenths),
    0,
  )
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
// Fixed order in which seats are marked, spread across the queue, so the same
// riders stay marked as the share grows.
export const RIDER_NEED_ORDER: readonly number[] = [
  2, 9, 15, 6, 12, 0, 17, 4, 10, 13, 7, 1, 16, 5, 11, 3, 14, 8,
]

export function ridersInNeed(
  numerator: number,
  denominator: number,
  total = RIDER_COUNT,
) {
  return Math.min(total, Math.round((total * numerator) / denominator))
}
