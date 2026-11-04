import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { paths } from '../../app/paths'
import { useSetup } from '../../state/setupContext'

export function PlaythroughRecovery() {
  const { leavePlaythrough } = useSetup()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function leave() {
    setPending(true)
    setError('')
    try {
      await leavePlaythrough()
      navigate(paths.individual, { replace: true })
    } catch {
      setError(
        'Unable to clear the saved run selection. Check browser storage and try again. No new run was created.',
      )
      setPending(false)
    }
  }
  return (
    <div>
      <p>
        Return to household selection without changing saved runs or signing
        out. A new run is created only when you confirm your selection on
        Review.
      </p>
      {error && <p role="alert">{error}</p>}
      <Button
        loading={pending}
        onClick={() => {
          void leave()
        }}
      >
        Choose a household for a new run
      </Button>
    </div>
  )
}
