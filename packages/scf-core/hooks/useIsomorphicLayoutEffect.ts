import { useEffect, useLayoutEffect } from 'react'

/**
 * useIsomorphicLayoutEffect
 *
 * Uses useLayoutEffect on the client and useEffect on the server to avoid SSR warnings.
 * This is necessary because useLayoutEffect doesn't exist during server-side rendering.
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
