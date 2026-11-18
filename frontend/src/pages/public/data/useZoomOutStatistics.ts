import { useEffect, useMemo, useState } from 'react'
import {
  loadExplorerStatistics,
  type ExplorerStatistic,
} from '../../../services/explorerService'
import { zoomOutStatistics, type CategoryId } from './dataExplorerContent'

type Binding = { readonly category: CategoryId; readonly statistic: string }

/**
 * The published statistics named for the closing "Zoom out" section, in the
 * order they are listed. A statistic that is not published, or a topic that
 * cannot be loaded, is simply absent: nothing is substituted for it, and the
 * topics' own Retry handles load failures.
 */
export function useZoomOutStatistics(
  bindings: readonly Binding[] = zoomOutStatistics,
  load: (
    categoryKey: string,
  ) => Promise<readonly ExplorerStatistic[]> = loadExplorerStatistics,
): readonly ExplorerStatistic[] {
  const [published, setPublished] = useState<
    ReadonlyMap<string, ExplorerStatistic>
  >(new Map())

  const categories = useMemo(
    () => [...new Set(bindings.map((binding) => binding.category))].sort(),
    [bindings],
  )

  useEffect(() => {
    let cancelled = false
    for (const category of categories) {
      load(category).then(
        (statistics) => {
          if (cancelled) return
          setPublished((current) => {
            const next = new Map(current)
            for (const statistic of statistics) {
              next.set(`${category}:${statistic.key}`, statistic)
            }
            return next
          })
        },
        () => {
          // Unreachable topic: nothing is shown for its statistics.
        },
      )
    }
    return () => {
      cancelled = true
    }
  }, [categories, load])

  return useMemo(
    () =>
      bindings.flatMap((binding) => {
        const statistic = published.get(
          `${binding.category}:${binding.statistic}`,
        )
        return statistic ? [statistic] : []
      }),
    [bindings, published],
  )
}
