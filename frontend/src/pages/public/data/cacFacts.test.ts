import { describe, expect, test } from 'vitest'
import { cacOutcomes, type CacOutcome } from '../../../data/cacOutcomes'
import {
  CAC_FACT_SPECS,
  buildCacFacts,
  cacFactsFor,
  cacFigure,
} from './cacFacts'
import { categories, type CategoryId } from './dataExplorerContent'

const ids = Object.keys(CAC_FACT_SPECS) as CategoryId[]

describe('CAC fact definitions', () => {
  test('every topic has facts and every referenced row exists in the CSV', () => {
    const keys = new Set(cacOutcomes.map((outcome) => outcome.key))
    expect(ids.sort()).toEqual(categories.map((c) => c.id).sort())
    for (const id of ids) {
      expect(CAC_FACT_SPECS[id].length).toBeGreaterThan(0)
      for (const spec of CAC_FACT_SPECS[id]) {
        expect(keys.has(spec.key), `${id}: ${spec.key}`).toBe(true)
        expect(spec.label.length).toBeGreaterThan(0)
      }
    }
  })

  test('no row is shown twice on the page', () => {
    const all = ids.flatMap((id) => CAC_FACT_SPECS[id].map((spec) => spec.key))
    expect(new Set(all).size).toBe(all.length)
  })

  test('rows whose meaning is unclear in the workbook are not used', () => {
    const all = ids.flatMap((id) => CAC_FACT_SPECS[id].map((spec) => spec.key))
    for (const key of ['clothing.sales_taxes', 'vita.returns']) {
      expect(all).not.toContain(key)
    }
    expect(all.some((key) => key.startsWith('coats_for_kids.'))).toBe(false)
    expect(all.some((key) => key.startsWith('volunteers.'))).toBe(false)
  })
})

describe('buildCacFacts', () => {
  const outcome = (key: string, value: number, year: number): CacOutcome => ({
    key,
    program: 'P',
    group: 'G',
    metric: 'M',
    year,
    value,
    unit: 'Number',
  })
  const specs = [
    { key: 'food.households', label: 'households were served.' },
    { key: 'food.absent', label: 'never shown.' },
  ]

  test('uses the newest year and leaves out a row the data does not have', () => {
    const facts = buildCacFacts(
      [
        outcome('food.households', 2995, 2025),
        outcome('food.households', 3100, 2026),
      ],
      specs,
    )
    expect(facts).toEqual([
      {
        id: 'cac-food-households',
        value: '3,100',
        label: 'households were served.',
        geography: 'CAC clients',
        period: '2026',
        sourceId: 'cacOutcomes',
      },
    ])
  })

  test('shows nothing when the data is empty', () => {
    expect(buildCacFacts([], specs)).toEqual([])
  })
})

describe('the committed facts', () => {
  test('carry the workbook values, formatted, with unique ids', () => {
    const housing = cacFactsFor('housing')
    expect(housing.map((fact) => fact.value)).toEqual([
      '1,108',
      '2,345',
      '$796,417',
    ])
    const all = ids.flatMap((id) => cacFactsFor(id))
    expect(new Set(all.map((fact) => fact.id)).size).toBe(all.length)
    expect(all.every((fact) => fact.period === '2025')).toBe(true)
  })

  test('cacFigure returns a figure for a CSV row and nothing otherwise', () => {
    expect(cacFigure('meals_for_kids.children')).toEqual({
      value: '1,097',
      year: 2025,
    })
    expect(cacFigure('meals_for_kids.nothing')).toBeUndefined()
  })
})
