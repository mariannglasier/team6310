import { useEffect, useState } from 'react'
import {
  loadExplorerStatistics,
  type ExplorerStatistic,
} from '../../../services/explorerService'

export type LiveStatisticsState =
  | { status: 'loading' }
  | { status: 'ready'; statistics: readonly ExplorerStatistic[] }
  | { status: 'error' }

type Loaded = { categoryKey: string; result: LiveStatisticsState }
const LOADING: LiveStatisticsState = { status: 'loading' }

/**
 * Loads the published statistics for one topic. State from a previous topic is
 * never shown for the current one, and Retry reloads after a failure.
 */
export function useExplorerStatistics(
  categoryKey: string,
  load: (
    categoryKey: string,
  ) => Promise<readonly ExplorerStatistic[]> = loadExplorerStatistics,
): { state: LiveStatisticsState; retry: () => void } {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    load(categoryKey).then(
      (statistics) => {
        if (!cancelled)
          setLoaded({
            categoryKey,
            result: { status: 'ready', statistics },
          })
      },
      () => {
        if (!cancelled) setLoaded({ categoryKey, result: { status: 'error' } })
      },
    )
    return () => {
      cancelled = true
    }
  }, [categoryKey, load, attempt])

  const state =
    loaded !== null && loaded.categoryKey === categoryKey
      ? loaded.result
      : LOADING
  return {
    state,
    retry: () => {
      setLoaded(null)
      setAttempt((count) => count + 1)
    },
  }
}
