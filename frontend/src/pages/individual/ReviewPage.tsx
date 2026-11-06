import { Navigate } from 'react-router'
import { paths } from '../../app/paths'
import { useSetup } from '../../state/setupContext'

// Preserve old bookmarks without introducing another run-creation surface.
export function ReviewPage() {
  const { createdPlaythrough } = useSetup()
  return (
    <Navigate
      to={createdPlaythrough ? paths.simulation : paths.individual}
      replace
    />
  )
}
