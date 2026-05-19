import type { ReloadPage } from './reloadPage'

export const reloadPage: ReloadPage = () => {
  if (typeof window === 'undefined' || !window.location) return
  window.location.reload()
}
