import { formatUsd } from '../../lib/money'
import type { UsdCents } from '../../types/domain'

export const MISSING = 'Not set'

export function money(value: UsdCents | null): string {
  return value === null ? MISSING : formatUsd(value)
}

// Always shows an explicit sign so gains and costs never rely on color alone.
export function signedMoney(value: UsdCents | null): string {
  if (value === null) return MISSING
  if (value === 0) return formatUsd(value)
  return `${value > 0 ? '+' : '−'}${formatUsd(Math.abs(value) as UsdCents)}`
}

export function yesNo(value: boolean | null): string {
  return value === null ? 'Unknown' : value ? 'Yes' : 'No'
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'America/New_York',
})
export function formatDate(value: string | null): string {
  if (!value) return MISSING
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? MISSING : dateFormat.format(date)
}

const numberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 4,
})
// Stored fact values keep their source unit; dollars are shown as currency.
export function formatFactValue(value: number | null, unit: string | null) {
  if (value === null) return MISSING
  if (unit?.toLowerCase() === 'dollars')
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value)
  return numberFormat.format(value)
}

export function humanize(key: string): string {
  const spaced = key.replace(/[_-]+/g, ' ').trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function scheduleLabel(type: string | null): string {
  if (type === 'scheduled') return 'Scheduled'
  if (type === 'non_scheduled') return 'Non-scheduled'
  return type ? humanize(type) : MISSING
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`
}

export type Tone =
  'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal'

const categoryTones: readonly Tone[] = [
  'blue',
  'red',
  'green',
  'amber',
  'violet',
  'teal',
]
export function categoryTone(index: number): Tone {
  return categoryTones[((index % 6) + 6) % 6]
}
