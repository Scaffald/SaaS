/**
 * A mutating effect must not depend on the mutation *object*.
 *
 * useMutation returns a fresh object every render — it spreads its result — so
 * naming that object in a dependency array makes the effect re-run on the very
 * render its own mutate() caused. There is no terminating condition.
 *
 * In production this ran at ~88 requests/second, indefinitely, from a single
 * anonymous tab on a page listed in sitemap-users.xml (#731). It is invisible
 * to a "does the effect work?" test, because the effect does work — it works
 * repeatedly.
 *
 * So these tests count calls across re-renders rather than asserting one
 * happened, and they use the real useMutation rather than a stub, because the
 * unstable identity is the thing under test.
 */
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query'
import { act, render } from '@testing-library/react'
import React, { useEffect, useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOOP_CAP, unboundedLoopProbe } from './unbounded-loop-probe'

function client() {
  return new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
}

/** Lets a test force re-renders from outside, the way a parent would. */
let forceRerender: (() => void) | null = null

function useRerenderHandle() {
  const [, setTick] = useState(0)
  forceRerender = () => setTick((t) => t + 1)
}

/**
 * The shape the two profile routes had: the mutation object is a dependency.
 *
 * `shouldStop` is the test's bound, not part of the shape under test — the
 * effect still has no terminating condition of its own, and the probe only
 * trips it once the loop has already re-entered `LOOP_CAP` times. See
 * `unbounded-loop-probe.ts` for why a bound is needed at all.
 */
function Looping({
  onCall,
  userId,
  shouldStop,
}: {
  onCall: () => void
  userId: string
  shouldStop: () => boolean
}) {
  useRerenderHandle()
  const recordViewMutation = useMutation({
    mutationFn: async () => {
      onCall()
      return null
    },
  })

  useEffect(() => {
    if (!userId) return
    if (shouldStop()) return
    recordViewMutation.mutate()
  }, [userId, recordViewMutation, shouldStop])

  return null
}

/** The shape they have now: the stable mutate, plus a once-per-id guard. */
function Fixed({ onCall, userId }: { onCall: () => void; userId: string }) {
  useRerenderHandle()
  const { mutate: recordProfileView } = useMutation({
    mutationFn: async () => {
      onCall()
      return null
    },
  })
  const recordedProfileId = useRef<string | null>(null)

  useEffect(() => {
    if (!userId) return
    if (recordedProfileId.current === userId) return
    recordedProfileId.current = userId
    recordProfileView()
  }, [userId, recordProfileView])

  return null
}

async function settle(ms = 60) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms))
  })
}

afterEach(() => {
  forceRerender = null
})

describe('profile view tracking', () => {
  it('records the view exactly once, however many times the page re-renders', async () => {
    const onCall = vi.fn()
    render(
      <QueryClientProvider client={client()}>
        <Fixed onCall={onCall} userId="user-1" />
      </QueryClientProvider>,
    )

    await settle()
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        forceRerender?.()
      })
    }
    await settle()

    expect(onCall).toHaveBeenCalledTimes(1)
  })

  it('records again when the page moves to a different profile', async () => {
    // The guard is per profile, not per mount — otherwise client-side
    // navigation between two profiles would record only the first.
    const onCall = vi.fn()
    const { rerender } = render(
      <QueryClientProvider client={client()}>
        <Fixed onCall={onCall} userId="user-1" />
      </QueryClientProvider>,
    )
    await settle()

    rerender(
      <QueryClientProvider client={client()}>
        <Fixed onCall={onCall} userId="user-2" />
      </QueryClientProvider>,
    )
    await settle()

    expect(onCall).toHaveBeenCalledTimes(2)
  })

  it('the old shape really did loop — the guard above is not vacuous', async () => {
    // If this stalls, react-query changed its identity semantics and the
    // reasoning behind the fix needs revisiting rather than silently passing.
    const probe = unboundedLoopProbe()
    const { unmount } = render(
      <QueryClientProvider client={client()}>
        <Looping onCall={probe.onCall} userId="user-1" shouldStop={probe.shouldStop} />
      </QueryClientProvider>,
    )

    let outcome: 'looped' | 'stalled' = 'stalled'
    await act(async () => {
      outcome = await probe.settled()
    })
    unmount()

    expect(outcome).toBe('looped')
    expect(probe.calls).toBeGreaterThanOrEqual(LOOP_CAP)
  })
})
