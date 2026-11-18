const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function GroupChoicePrice({
  balanceChange,
  upfrontCost,
}: {
  balanceChange?: number | string | null
  upfrontCost?: number | string | null
}) {
  const upfront = Number(upfrontCost ?? 0)
  if (Number.isFinite(upfront) && upfront > 0)
    return (
      <span className="group-choice-price">
        Cost {currency.format(upfront)}
      </span>
    )
  if (balanceChange == null || balanceChange === '') return null
  const amount = Number(balanceChange)
  if (!Number.isFinite(amount)) return null
  const price = currency.format(Math.abs(amount))
  return (
    <span className="group-choice-price">
      {amount < 0
        ? `Cost ${price}`
        : amount > 0
          ? `Receive ${price}`
          : 'No cost'}
    </span>
  )
}
