import { Navigate, Outlet } from 'react-router'
import { PageSection } from '../components/ui/PageSection'
import { useStaffAuth } from '../state/staffAuthContext'
import { paths } from './paths'

// UI gate only: it hides the dashboard shell until Supabase Auth confirms a
// staff session and the database reports staff authorization. It never unlocks
// from browser storage or a client role flag, and cannot replace database/API
// authorization, which protects every staff record and mutation.
export function AdminRouteBoundary() {
  const { state } = useStaffAuth()
  if (state.status === 'checking')
    return (
      <PageSection title="Checking staff access">
        <p>Confirming your CAC staff sign-in…</p>
      </PageSection>
    )
  if (state.status === 'signed-out')
    return <Navigate to={paths.adminLogin} replace />
  return <Outlet />
}
