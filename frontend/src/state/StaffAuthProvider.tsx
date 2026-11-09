import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router'
import {
  onStaffSignedOut,
  restoreStaffSession,
  signInStaff,
  signOutStaff,
} from '../services/staffAuth'
import {
  StaffAuthContext,
  type StaffAuth,
  type StaffAuthState,
} from './staffAuthContext'

// Wraps only the /admin routes so public pages never touch staff Auth.
export function StaffAuthProvider() {
  const [state, setState] = useState<StaffAuthState>({ status: 'checking' })

  useEffect(() => {
    let active = true
    // Any failure to confirm staff access fails closed to signed-out.
    void restoreStaffSession()
      .then((session) => {
        if (active)
          setState(
            session ? { status: 'staff', session } : { status: 'signed-out' },
          )
      })
      .catch(() => {
        if (active) setState({ status: 'signed-out' })
      })
    const stopListening = onStaffSignedOut(() => {
      if (active) setState({ status: 'signed-out' })
    })
    return () => {
      active = false
      stopListening()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await signInStaff(email, password)
    setState({ status: 'staff', session })
  }, [])
  const signOut = useCallback(async () => {
    try {
      await signOutStaff()
    } finally {
      // Protected UI closes even if the network call fails; the next protected
      // request is still validated by the database.
      setState({ status: 'signed-out' })
    }
  }, [])

  const value = useMemo<StaffAuth>(
    () => ({ state, signIn, signOut }),
    [state, signIn, signOut],
  )
  return (
    <StaffAuthContext.Provider value={value}>
      <Outlet />
    </StaffAuthContext.Provider>
  )
}
