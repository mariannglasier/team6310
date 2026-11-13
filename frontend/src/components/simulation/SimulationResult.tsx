import { Button } from '../ui/Button'
import { formatUsd } from '../../lib/money'
import type { UsdCents } from '../../types/domain'

// Shared existing result presentation, independent of employment initialization.
export function SimulationResult({
  reason,
  balance,
  cacReplay = false,
  onReplay,
}: {
  reason: string | null
  balance: UsdCents
  cacReplay?: boolean
  onReplay: (support: boolean) => void
}) {
  return (
    <>
      <p>{reason ?? 'You reached the end of the month.'}</p>
      <p>
        Ending balance: <strong>{formatUsd(balance)}</strong>
      </p>
      <div className="employment-actions">
        <Button onClick={() => onReplay(false)}>
          Replay from household selection
        </Button>
        {cacReplay && (
          <Button variant="secondary" onClick={() => onReplay(true)}>
            Try again with CAC support
          </Button>
        )}
      </div>
    </>
  )
}
