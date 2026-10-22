import type { ReactNode } from 'react'
import { PageSection } from './ui/PageSection'

export function PlaceholderPage({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <PageSection title={title} eyebrow="Frontend setup placeholder">
      {children}
    </PageSection>
  )
}
