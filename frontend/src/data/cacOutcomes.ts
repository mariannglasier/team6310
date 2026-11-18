// CAC program outcomes for the public Explore Data page.
//
// The figures live in `cac-outcomes.csv`, a long-format copy of CAC's "2025
// Outcomes" workbook (one row per metric and year). They are CAC-reported
// totals, not external statistics. A later staff admin section will replace the
// CSV; keep this module's shape (key, year, value, unit) so that swap is small.
//
// Loading is strict: a malformed file raises, so a bad edit cannot silently
// change what visitors see. The committed file is checked by tests.
import csvText from './cac-outcomes.csv?raw'

export type CacUnit = 'Number' | 'Dollars' | 'Pounds'

export interface CacOutcome {
  /** Stable machine key, `group.metric`, for example `food.households`. */
  readonly key: string
  /** Program heading in the workbook (for example BASIC NEEDS). */
  readonly program: string
  /** Sub-heading in the workbook; empty when the metric sits directly under the program. */
  readonly group: string
  /** The workbook's row label. */
  readonly metric: string
  readonly year: number
  readonly value: number
  readonly unit: CacUnit
}

export class CacOutcomesError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CacOutcomesError'
  }
}

const HEADER = ['key', 'program', 'group', 'metric', 'year', 'value', 'unit']
const UNITS: readonly CacUnit[] = ['Number', 'Dollars', 'Pounds']
const KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/
const NUMBER = /^\d+(\.\d+)?$/

/** Minimal RFC 4180 reader: quoted fields, doubled quotes, LF or CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
    } else if (char === '"' && field === '') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (quoted) throw new CacOutcomesError('The CSV ends inside a quoted field')
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

export function parseCacOutcomes(text: string): readonly CacOutcome[] {
  const [header, ...body] = parseCsv(text)
  if (!header || header.join(',') !== HEADER.join(',')) {
    throw new CacOutcomesError(`The CSV header must be ${HEADER.join(',')}`)
  }
  const seen = new Set<string>()
  return body.map((cells, index) => {
    const line = index + 2
    if (cells.length !== HEADER.length) {
      throw new CacOutcomesError(
        `Line ${line} must have ${HEADER.length} columns`,
      )
    }
    const [key, program, group, metric, year, value, unit] = cells
    if (!KEY.test(key)) throw new CacOutcomesError(`Line ${line}: invalid key`)
    if (metric.trim() === '') {
      throw new CacOutcomesError(`Line ${line}: the metric is empty`)
    }
    if (!/^\d{4}$/.test(year)) {
      throw new CacOutcomesError(`Line ${line}: the year must be four digits`)
    }
    if (!NUMBER.test(value)) {
      throw new CacOutcomesError(`Line ${line}: the value is not a number`)
    }
    if (!UNITS.includes(unit as CacUnit)) {
      throw new CacOutcomesError(`Line ${line}: unsupported unit "${unit}"`)
    }
    const identity = `${key}@${year}`
    if (seen.has(identity)) {
      throw new CacOutcomesError(`Line ${line}: ${identity} appears twice`)
    }
    seen.add(identity)
    return {
      key,
      program,
      group,
      metric,
      year: Number(year),
      value: Number(value),
      unit: unit as CacUnit,
    }
  })
}

function load(): readonly CacOutcome[] {
  try {
    return parseCacOutcomes(csvText)
  } catch (error) {
    // The page keeps working without CAC figures rather than failing to load.
    console.error('CAC outcomes could not be read.', error)
    return []
  }
}

export const cacOutcomes: readonly CacOutcome[] = load()

/** The most recent year's row for a metric, or undefined when it has none. */
export function latestOutcome(
  outcomes: readonly CacOutcome[],
  key: string,
): CacOutcome | undefined {
  let latest: CacOutcome | undefined
  for (const outcome of outcomes) {
    if (outcome.key === key && (!latest || outcome.year > latest.year)) {
      latest = outcome
    }
  }
  return latest
}

const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** Whole-number display with its unit; the CSV keeps the exact value. */
export function formatOutcomeValue(outcome: CacOutcome): string {
  switch (outcome.unit) {
    case 'Dollars':
      return `$${whole.format(outcome.value)}`
    case 'Pounds':
      return `${whole.format(outcome.value)} pounds`
    case 'Number':
      return whole.format(outcome.value)
  }
}
