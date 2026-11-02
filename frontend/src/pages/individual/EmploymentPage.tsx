import { Navigate, useNavigate } from 'react-router'
import { paths } from '../../app/paths'
import { useSetup } from '../../state/setupContext'
import { EmploymentGame } from './EmploymentGame'

export function EmploymentPage() {
  const { walkthrough, dispatchPreview, resetPreview, storageAvailable } =
    useSetup()
  const navigate = useNavigate()
  if (!walkthrough) return <Navigate to={paths.individual} replace />
  return (
    <>
      {!storageAvailable && (
        <p role="alert">
          Browser storage is unavailable. Your walkthrough will be lost if you
          refresh or close this tab.
        </p>
      )}
      <EmploymentGame
        state={walkthrough}
        dispatch={dispatchPreview}
        onReplay={(support) => {
          resetPreview(support)
          navigate(paths.individual)
        }}
      />
    </>
  )
}
