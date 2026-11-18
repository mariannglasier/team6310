import { useEffect, useMemo, useState } from 'react'
import {
  loadExplorerCategories,
  type ExplorerCategorySummary,
} from '../../../services/explorerService'
import { categories, type CategoryContent } from './dataExplorerContent'

/**
 * Category names and descriptions come from the database when it is
 * reachable, so staff-approved wording wins. Each scene stays tied to its
 * topic, and the static copy is the fallback, so the page never blocks on the
 * database. Unknown or unpublished database categories are ignored.
 */
export function mergeCategories(
  published: readonly ExplorerCategorySummary[],
): readonly CategoryContent[] {
  const byKey = new Map(published.map((category) => [category.key, category]))
  return categories.map((category) => {
    const remote = byKey.get(category.id)
    return remote
      ? { ...category, name: remote.name, description: remote.description }
      : category
  })
}

export function useExplorerCategories(
  load: () => Promise<
    readonly ExplorerCategorySummary[]
  > = loadExplorerCategories,
): readonly CategoryContent[] {
  const [published, setPublished] = useState<
    readonly ExplorerCategorySummary[]
  >([])

  useEffect(() => {
    let cancelled = false
    load().then(
      (rows) => {
        if (!cancelled) setPublished(rows)
      },
      () => {
        // Static category copy remains in use.
      },
    )
    return () => {
      cancelled = true
    }
  }, [load])

  return useMemo(() => mergeCategories(published), [published])
}
