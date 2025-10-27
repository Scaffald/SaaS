import type { ReactNode } from 'react'
import { StyleguideShell } from './StyleguideShell'

export type StyleguidePageProps = {
  title: string
  description?: string
  badge?: ReactNode
  children: ReactNode
}

export function StyleguidePage({ title, description, badge, children }: StyleguidePageProps) {
  return (
    <StyleguideShell title={title} description={description} badge={badge}>
      {children}
    </StyleguideShell>
  )
}
