import { describe, expect, test } from 'vitest'
import {
  cacOutcomes,
  formatOutcomeValue,
  latestOutcome,
  parseCacOutcomes,
  parseCsv,
  type CacOutcome,
} from './cacOutcomes'

const HEADER = 'key,program,group,metric,year,value,unit'

describe('parseCsv', () => {
  test('reads quoted fields with commas, doubled quotes and CRLF endings', () => {
    expect(parseCsv('a,"b,c","say ""hi"""\r\nd,e,f\r\n')).toEqual([
      ['a', 'b,c', 'say "hi"'],
      ['d', 'e', 'f'],
    ])
  })

  test('keeps empty fields and a final row with no trailing newline', () => {
    expect(parseCsv('a,,c\nd,e,')).toEqual([
      ['a', '', 'c'],
      ['d', 'e', ''],
    ])
  })

  test('rejects a quoted field that never closes', () => {
    expect(() => parseCsv('a,"b')).toThrow(/quoted field/)
  })
})

describe('parseCacOutcomes', () => {
  const row = 'food.households,BASIC NEEDS,Food,Households,2025,2995,Number'

  test('parses a valid row into typed values', () => {
    expect(parseCacOutcomes(`${HEADER}\n${row}\n`)).toEqual([
      {
        key: 'food.households',
        program: 'BASIC NEEDS',
        group: 'Food',
        metric: 'Households',
        year: 2025,
        value: 2995,
        unit: 'Number',
      },
    ])
  })

  test.each([
    ['a wrong header', `key,value\n${row}`, /header/],
    ['a short row', `${HEADER}\nfood.households,BASIC NEEDS,Food`, /columns/],
    [
      'a key without a group',
      `${HEADER}\nhouseholds,P,G,M,2025,1,Number`,
      /invalid key/,
    ],
    [
      'an empty metric',
      `${HEADER}\nfood.households,P,G, ,2025,1,Number`,
      /metric is empty/,
    ],
    [
      'a two-digit year',
      `${HEADER}\nfood.households,P,G,M,25,1,Number`,
      /year/,
    ],
    [
      'a value that is not a number',
      `${HEADER}\nfood.households,P,G,M,2025,12abc,Number`,
      /not a number/,
    ],
    [
      'a negative value',
      `${HEADER}\nfood.households,P,G,M,2025,-4,Number`,
      /not a number/,
    ],
    [
      'an unknown unit',
      `${HEADER}\nfood.households,P,G,M,2025,1,Punds`,
      /unsupported unit/,
    ],
    ['a duplicate key and year', `${HEADER}\n${row}\n${row}`, /twice/],
  ])('rejects %s', (_name, text, message) => {
    expect(() => parseCacOutcomes(text)).toThrow(message)
  })

  test('the same metric may repeat for a different year', () => {
    const next = row.replace('2025', '2026')
    expect(parseCacOutcomes(`${HEADER}\n${row}\n${next}`)).toHaveLength(2)
  })
})

describe('the committed 2025 workbook copy', () => {
  test('loads every row of the workbook, all for 2025, with unique keys', () => {
    expect(cacOutcomes).toHaveLength(66)
    expect(new Set(cacOutcomes.map((o) => o.year))).toEqual(new Set([2025]))
    expect(new Set(cacOutcomes.map((o) => o.key)).size).toBe(66)
  })

  test.each([
    ['clients.unduplicated_number_of_households', 4440],
    ['clients.unduplicated_number_of_individuals', 9632],
    ['financial_assistance.evictions_prevented_households', 1108],
    ['financial_assistance.amount_paid', 796416.64],
    ['food.visits_to_mini_market', 36521],
    ['food.pounds_of_food_provided_to_clients', 1096486.4],
    ['meals_for_kids.children', 1097],
    ['school_supply.children', 1090],
    ['teachers_closet.children', 8660],
    ['adult_education.total_undup_students', 610],
    ['adult_education.esol', 521],
    ['vita.federal_returns_prepared', 590],
    ['vita.federal_refund', 582083],
    ['vita.total_credits_earned_income_child_and_education_credit', 456469],
    ['volunteers.dollar_value_of_volunteer_hours', 1774795.852],
  ])('%s is %d, as in the workbook', (key, value) => {
    expect(latestOutcome(cacOutcomes, key)?.value).toBe(value)
  })

  test('corrects only the workbook typos recorded in the docs', () => {
    expect(
      latestOutcome(cacOutcomes, 'hope_for_the_holidays.value_in_kind'),
    ).toMatchObject({ metric: 'Value In-kind', unit: 'Dollars' })
    expect(
      latestOutcome(
        cacOutcomes,
        'food.pounds_available_purchase_donated_wasted',
      ),
    ).toMatchObject({ unit: 'Pounds' })
    expect(
      cacOutcomes.every((o) =>
        ['Number', 'Dollars', 'Pounds'].includes(o.unit),
      ),
    ).toBe(true)
  })
})

describe('latestOutcome and formatOutcomeValue', () => {
  const make = (year: number, value: number): CacOutcome => ({
    key: 'food.households',
    program: 'P',
    group: 'G',
    metric: 'M',
    year,
    value,
    unit: 'Number',
  })

  test('picks the newest year and returns undefined for an unknown key', () => {
    const outcomes = [make(2025, 1), make(2027, 3), make(2026, 2)]
    expect(latestOutcome(outcomes, 'food.households')?.value).toBe(3)
    expect(latestOutcome(outcomes, 'food.missing')).toBeUndefined()
  })

  test('shows counts, dollars and pounds in whole units without altering the stored value', () => {
    const base = make(2025, 0)
    expect(formatOutcomeValue({ ...base, value: 36521 })).toBe('36,521')
    expect(formatOutcomeValue({ ...base, value: 913738.666667 })).toBe(
      '913,739',
    )
    expect(
      formatOutcomeValue({ ...base, unit: 'Dollars', value: 796416.64 }),
    ).toBe('$796,417')
    expect(
      formatOutcomeValue({ ...base, unit: 'Pounds', value: 1096486.4 }),
    ).toBe('1,096,486 pounds')
  })
})
