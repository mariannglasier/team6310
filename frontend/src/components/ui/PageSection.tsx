import type { ReactNode } from 'react'

export function PageSection({
  title,
  eyebrow,
  leading,
  children,
}: {
  title: string
  eyebrow?: string
  /** Content rendered inside the section before the eyebrow and heading. */
  leading?: ReactNode
  children: ReactNode
}) {
  return (
    <section aria-labelledby="page-heading">
      {leading}
      {eyebrow && <p className="placeholder-label">{eyebrow}</p>}
      <h1 id="page-heading" tabIndex={-1}>
        {title}
      </h1>
      {children}
    </section>
  )
}
