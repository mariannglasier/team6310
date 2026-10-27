import type { UsdCents } from '../types/domain'

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

// Display only: money is stored and calculated as integer cents.
export function formatUsd(cents: UsdCents): string {
  return usd.format(cents / 100)
}
