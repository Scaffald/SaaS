import { useMemo } from 'react'

/**
 * A specialized hook to memoize style factory calls.
 * This prevents unnecessary object re-allocation on every render,
 * solving performance bottlenecks especially in long lists.
 *
 * @param factory - The style factory function that returns your style config.
 * @param deps - The dependencies array (arguments passed to the factory).
 * @returns The memoized style object.
 *
 * @example
 * const styles = useStyles(getButtonStyles, [variant, size, theme])
 */
export function useStyles<T, Deps extends readonly unknown[]>(
  factory: (...args: Deps) => T,
  deps: Deps
): T {
  return useMemo(() => factory(...deps), [factory, deps])
}
