import { describe, expect, it, vi } from 'vitest'
import { composeMutationOptions } from '../compose-mutation-options'

describe('composeMutationOptions', () => {
  it('returns the base untouched when there are no overrides', () => {
    const base = { onSuccess: vi.fn() }
    expect(composeMutationOptions(base)).toBe(base)
  })

  // The regression: ProfileEmploymentLeft passed an empty onSuccess as a place
  // to hang a comment, and object spread silently deleted the hook's own
  // invalidation — the only working one on that page (#586).
  it('runs the hook handler as well as the caller handler', async () => {
    const order: string[] = []
    const composed = composeMutationOptions(
      { onSuccess: () => void order.push('hook') },
      { onSuccess: () => void order.push('caller') }
    )

    await composed.onSuccess?.()

    expect(order).toEqual(['hook', 'caller'])
  })

  it('runs the hook handler even when the caller passes a no-op', async () => {
    const hookSuccess = vi.fn()
    const composed = composeMutationOptions(
      { onSuccess: hookSuccess },
      { onSuccess: () => {} }
    )

    await composed.onSuccess?.()

    expect(hookSuccess).toHaveBeenCalledTimes(1)
  })

  it('awaits an async hook handler before the caller runs', async () => {
    const order: string[] = []
    const composed = composeMutationOptions(
      {
        onSettled: async () => {
          await Promise.resolve()
          order.push('hook')
        },
      },
      { onSettled: () => void order.push('caller') }
    )

    await composed.onSettled?.()

    expect(order).toEqual(['hook', 'caller'])
  })

  it('composes onError the same way', async () => {
    const hookError = vi.fn()
    const callerError = vi.fn()
    const composed = composeMutationOptions(
      { onError: hookError },
      { onError: callerError }
    )

    await composed.onError?.()

    expect(hookError).toHaveBeenCalledTimes(1)
    expect(callerError).toHaveBeenCalledTimes(1)
  })

  it('forwards every argument to both handlers', async () => {
    const hookSuccess = vi.fn()
    const callerSuccess = vi.fn()
    const composed = composeMutationOptions(
      { onSuccess: hookSuccess },
      { onSuccess: callerSuccess }
    )

    await (composed.onSuccess as (...a: unknown[]) => unknown)?.('data', 'vars', 'ctx')

    expect(hookSuccess).toHaveBeenCalledWith('data', 'vars', 'ctx')
    expect(callerSuccess).toHaveBeenCalledWith('data', 'vars', 'ctx')
  })

  it('keeps the hook onMutate — two functions cannot both own the rollback context', () => {
    const hookMutate = vi.fn()
    const callerMutate = vi.fn()
    const composed = composeMutationOptions(
      { onMutate: hookMutate },
      { onMutate: callerMutate }
    )

    expect(composed.onMutate).toBe(hookMutate)
  })

  it('lets the caller supply a handler the hook does not define', async () => {
    const callerSuccess = vi.fn()
    const composed = composeMutationOptions({ onError: vi.fn() }, { onSuccess: callerSuccess })

    await composed.onSuccess?.()

    expect(callerSuccess).toHaveBeenCalledTimes(1)
  })

  it('passes through non-callback options such as retry', () => {
    const composed = composeMutationOptions(
      { onSuccess: vi.fn() } as Record<string, unknown>,
      { retry: 3 } as Record<string, unknown>
    )

    expect(composed.retry).toBe(3)
  })
})
