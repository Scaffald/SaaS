import type { OpenExternalLink } from './openExternalLink'

export const openExternalLink: OpenExternalLink = (url) => {
  if (!url) return
  if (typeof window === 'undefined') return
  window.open(url, '_blank', 'noopener,noreferrer')
}
