import { useCallback, useEffect, useState } from 'react'
import {
  contentService,
  ContentUnavailableError,
  type ContentService,
} from '../services/contentService'
import type { PublishedHouseholds } from '../types/domain'

export type HouseholdsState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'ready'; readonly households: PublishedHouseholds }
  | { readonly status: 'error'; readonly message: string }

// Loads approved households on mount. It creates no run and changes no financial
// state; retry is an explicit user action.
export function useHouseholds(service: ContentService = contentService) {
  const [state, setState] = useState<HouseholdsState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    service.loadHouseholds().then(
      (households) => {
        if (current)
          setState(
            households ? { status: 'ready', households } : { status: 'empty' },
          )
      },
      (error: unknown) => {
        if (current)
          setState({
            status: 'error',
            message:
              error instanceof ContentUnavailableError
                ? error.message
                : new ContentUnavailableError().message,
          })
      },
    )
    return () => {
      current = false
    }
  }, [service, attempt])
  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])
  return { state, retry }
}
