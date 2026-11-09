import { createContext, useContext } from 'react'
import type { StaffSession } from '../services/staffAuth'

export type StaffAuthState =
  | { readonly status: 'checking' }
  | { readonly status: 'signed-out' }
  | { readonly status: 'staff'; readonly session: StaffSession }

export interface StaffAuth {
  readonly state: StaffAuthState
  readonly signIn: (email: string, password: string) => Promise<void>
  readonly signOut: () => Promise<void>
}

export const StaffAuthContext = createContext<StaffAuth | null>(null)

export function useStaffAuth(): StaffAuth {
  const value = useContext(StaffAuthContext)
  if (!value)
    throw new Error('useStaffAuth must be used within StaffAuthProvider')
  return value
}
