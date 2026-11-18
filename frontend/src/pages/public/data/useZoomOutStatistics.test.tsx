import { renderHook, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import type { ExplorerStatistic } from '../../../services/explorerService'
import { useZoomOutStatistics } from './useZoomOutStatistics'

function stat(key: string): ExplorerStatistic {
  return {
    key,
    title: key,
    description: '',
    contextNote: null,
    value: 5,
    valueHigh: null,
    unit: 'percent',
    geography: 'Somewhere',
    geographyCode: null,
    periodLabel: '2024',
    sourceName: 'S',
    sourceTitle: 'T',
    sourceUrl: 'https://example.org',
    lastCheckedAt: null,
    visualization: 'meter',
    visualizationConfig: {},
    isDerived: false,
    derivationNote: null,
    displayOrder: 1,
  }
}

const bindings = [
  { category: 'youth', statistic: 'b' },
  { category: 'employment', statistic: 'a' },
  { category: 'youth', statistic: 'c' },
] as const

test('returns published statistics in binding order, loading each topic once', async () => {
  const load = vi.fn(async (category: string) =>
    category === 'youth' ? [stat('c'), stat('b')] : [stat('a')],
  )
  const { result } = renderHook(() => useZoomOutStatistics(bindings, load))
  await waitFor(() =>
    expect(result.current.map((s) => s.key)).toEqual(['b', 'a', 'c']),
  )
  expect(load).toHaveBeenCalledTimes(2)
})

test('leaves out unpublished statistics and unreachable topics without substituting', async () => {
  const load = vi.fn(async (category: string) => {
    if (category === 'employment') throw new Error('offline')
    return [stat('b')]
  })
  const { result } = renderHook(() => useZoomOutStatistics(bindings, load))
  await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
  await waitFor(() => expect(result.current.map((s) => s.key)).toEqual(['b']))
})
