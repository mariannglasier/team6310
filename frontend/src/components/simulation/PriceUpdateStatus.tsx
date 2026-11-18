import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../../services/supabase'

interface UpdateItem {
  label: string
  status: 'current' | 'carried_forward' | 'fixed'
  lastSuccessfulAt: string | null
  observationPeriod: string | null
}
interface UpdateStatus {
  checkedAt: string | null
  items: UpdateItem[]
}
function date(value: string | null) {
  return value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleDateString()
    : 'date unavailable'
}

export function PriceUpdateStatus({ versionId }: { versionId: string | null }) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState<{
    versionId: string
    data: UpdateStatus | null
  } | null>(null)
  const status = loaded && loaded.versionId === versionId ? loaded.data : null
  useEffect(() => {
    let active = true
    if (versionId && open) {
      void getSupabaseClient()
        .then((client) =>
          client.rpc('get_edition_price_updates', { p_version_id: versionId }),
        )
        .then(({ data, error }) => {
          if (active)
            setLoaded({
              versionId,
              data:
                !error && data && Array.isArray(data.items)
                  ? (data as UpdateStatus)
                  : null,
            })
        })
        .catch(() => {
          if (active) setLoaded({ versionId, data: null })
        })
    }
    return () => {
      active = false
    }
  }, [versionId, open])
  const carried =
    status?.items.filter((item) => item.status === 'carried_forward').length ??
    0
  return (
    <details
      className="finance-source"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Last updated</summary>
      {!status && (
        <p>
          {loaded?.versionId === versionId
            ? 'Price update information is unavailable.'
            : 'Loading price update information…'}
        </p>
      )}
      {status && (
        <>
          <p>
            Prices checked {date(status.checkedAt)}.
            {carried > 0 &&
              ` ${carried} ${carried === 1 ? 'value' : 'values'} carried forward.`}
          </p>
          <ul>
            {status.items.map((item) => (
              <li key={item.label}>
                {item.label} —{' '}
                {item.status === 'fixed'
                  ? 'Fixed amount'
                  : item.status === 'carried_forward'
                    ? `Carried forward; last verified ${date(item.lastSuccessfulAt)}`
                    : `Verified ${date(item.lastSuccessfulAt)}`}
                {item.observationPeriod &&
                  ` · Source period ${item.observationPeriod}`}
              </li>
            ))}
          </ul>
          {status.items.length === 0 && (
            <p>No price-update history is available for this edition.</p>
          )}
        </>
      )}
    </details>
  )
}
