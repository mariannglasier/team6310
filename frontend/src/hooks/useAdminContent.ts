import { useCallback, useEffect, useState } from 'react'
import { loadAdminContent } from '../services/adminContent'
import type { AdminContent } from '../types/adminContent'

export type AdminContentState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly content: AdminContent }

export function useAdminContent() {
  const [state, setState] = useState<AdminContentState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    loadAdminContent()
      .then((content) => {
        if (active) setState({ status: 'ready', content })
      })
      .catch((failure: unknown) => {
        if (!active) return
        setState({
          status: 'error',
          message:
            failure instanceof Error
              ? failure.message
              : 'Unable to load the stored content right now. Please try again.',
        })
      })
    return () => {
      active = false
    }
  }, [attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((count) => count + 1)
  }, [])

  return { state, reload }
}
