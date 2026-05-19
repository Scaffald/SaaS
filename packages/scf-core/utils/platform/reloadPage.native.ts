import type { ReloadPage } from './reloadPage'

export const reloadPage: ReloadPage = () => {
  if (__DEV__) {
    console.warn(
      '[reloadPage] called on native — no-op. Invalidate react-query caches instead for parity.'
    )
  }
}
