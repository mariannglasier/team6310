import type { ReactNode } from 'react'

export function PageSection({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow?: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby="page-heading">
      {eyebrow && <p className="placeholder-label">{eyebrow}</p>}
      <h1 id="page-heading" tabIndex={-1}>
        {title}
      </h1>
      {children}
    </section>
  )
}
