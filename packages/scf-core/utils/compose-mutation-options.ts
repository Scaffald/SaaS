/**
 * Merge a caller's mutation options onto a hook's own, running both callbacks
 * instead of letting the caller's replace the hook's.
 *
 * The `...overrides` spread the `*WithSync` hooks used is a trap: it reads like
 * "let the caller add a success handler", but object spread means the caller's
 * `onSuccess` *replaces* the hook's. ProfileEmploymentLeft passed an empty
 * `onSuccess` purely as a place to hang a comment, and silently deleted the only
 * working invalidation on that page (#586).
 *
 * The hook's handler runs first — it owns cache correctness, and a caller's
 * handler should not be able to skip it.
 *
 * `onMutate` is deliberately not composed: react-query threads its return value
 * through as the rollback context, and two functions cannot both own that. The
 * hook's wins. A caller that genuinely needs its own optimistic update should
 * not be reaching for a `*WithSync` hook.
 *
 * Typed structurally rather than against `UseMutationOptions` generics so it
 * stays correct across react-query's callback-arity changes (v5 passes
 * `(data, variables, context)`, later versions add `onMutateResult`).
 */
type MutationCallbacks = {
  onMutate?: (...args: never[]) => unknown
  onSuccess?: (...args: never[]) => unknown
  onError?: (...args: never[]) => unknown
  onSettled?: (...args: never[]) => unknown
}

export function composeMutationOptions<TOptions extends MutationCallbacks>(
  base: TOptions,
  overrides?: TOptions
): TOptions {
  if (!overrides) return base

  const { onSuccess, onError, onSettled, onMutate: _ignored, ...rest } = overrides

  const chain = <TFn extends ((...args: never[]) => unknown) | undefined>(
    first: TFn,
    second: TFn
  ): TFn => {
    if (!first) return second
    if (!second) return first
    return (async (...args: never[]) => {
      await first(...args)
      return second(...args)
    }) as TFn
  }

  return {
    ...base,
    ...rest,
    // The hook's optimistic update owns the rollback context.
    onMutate: base.onMutate,
    onSuccess: chain(base.onSuccess, onSuccess),
    onError: chain(base.onError, onError),
    onSettled: chain(base.onSettled, onSettled),
  } as TOptions
}
