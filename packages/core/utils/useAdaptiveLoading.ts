import { useEffect, useState } from 'react'

/**
 * Returns `true` only after the provided `isLoading` flag has remained `true`
 * for at least `delayMs`. Helpful for hiding brief loading flashes.
 *
 * @param isLoading - Source loading flag
 * @param delayMs - Delay in milliseconds before surfacing the loading state
 */
export function useAdaptiveLoading(isLoading: boolean, delayMs = 300): boolean {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false)
      return
    }

    if (delayMs <= 0) {
      setShowLoading(true)
      return
    }

    const timer = setTimeout(() => {
      setShowLoading(true)
    }, delayMs)

    return () => {
      clearTimeout(timer)
    }
  }, [isLoading, delayMs])

  return showLoading
}
