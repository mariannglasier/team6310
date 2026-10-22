import { NavLink } from 'react-router'

export function Navigation({
  label,
  items,
}: {
  label: string
  items: readonly { to: string; label: string; external?: boolean }[]
}) {
  return (
    <nav aria-label={label}>
      {items.map((item) =>
        item.external ? (
          <a key={item.to} href={item.to}>
            {item.label}
          </a>
        ) : (
          <NavLink key={item.to} to={item.to} end>
            {item.label}
          </NavLink>
        ),
      )}
    </nav>
  )
}
