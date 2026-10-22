import { Navigate } from 'react-router'
import { paths } from './paths'

// Fail closed until trusted Auth + staff authorization are integrated.
// Never unlock using browser storage or a client role flag.
// This UI boundary cannot replace database/API authorization.
export function AdminRouteBoundary() {
  return <Navigate to={paths.adminLogin} replace />
}
