import type { ReactNode } from 'react'

/** Web-only; native screen readers get status from the visible UI. */
export function LiveRegion(_props: { children: ReactNode }) {
  return null
}
