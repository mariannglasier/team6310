import { useEffect, useRef, useState } from 'react'
import { formatUsd } from '../../lib/money'
import { usdCents, type UsdCents } from '../../types/domain'

// Animation is presentation only; the accessible balance is always committed.
export function BalanceDisplay({
  balance,
  incomeKey,
  income,
}: {
  balance: UsdCents | null
  incomeKey?: string
  income: UsdCents
}) {
  const [shown, setShown] = useState(balance)
  const [notification, setNotification] = useState<{
    key: string
    amount: UsdCents
  } | null>(null)
  const previous = useRef(balance)
  const announced = useRef<string | undefined>(undefined)
  useEffect(() => {
    const payday = incomeKey !== undefined && announced.current !== incomeKey
    if (payday) announced.current = incomeKey
    const from =
      payday && balance !== null ? balance - income : previous.current
    previous.current = balance
    const reduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    let frame = 0
    let start: number | undefined
    const animate = (time: number) => {
      const firstFrame = start === undefined
      start ??= time
      const progress = Math.min((time - start) / 900, 1)
      setShown(
        balance !== null && from !== null && payday && !reduced
          ? usdCents(Math.round(from + (balance - from) * progress))
          : balance,
      )
      if (payday && firstFrame)
        setNotification({ key: incomeKey, amount: income })
      if (progress < 1 && payday && !reduced)
        frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    const timer = window.setTimeout(() => setNotification(null), 2400)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [balance, incomeKey, income])
  const visible = incomeKey ? shown : balance
  return (
    <>
      <strong
        className="finance-balance"
        aria-label={
          balance === null
            ? 'Balance unavailable'
            : `Current balance ${formatUsd(balance)}`
        }
      >
        <span aria-hidden="true">
          {visible === null ? 'Unavailable' : formatUsd(visible)}
        </span>
      </strong>
      <span className="sr-only" aria-live="polite">
        {balance === null
          ? 'Balance unavailable'
          : `Current balance ${formatUsd(balance)}`}
      </span>
      {notification !== null && (
        <p
          key={notification.key}
          className="finance-income-toast"
          role="status"
        >
          +{formatUsd(notification.amount)} received
        </p>
      )}
    </>
  )
}
