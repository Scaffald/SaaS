/**
 * The XP award on the IPIP results page must happen once per view.
 *
 * Same defect as #731: the effect depended on the mutation *object*, which
 * useMutation returns fresh on every render, so it re-ran on the render its own
 * mutate() caused. `results.isComplete` stays true, which is precisely the
 * condition that fires it, so nothing terminated the loop.
 *
 * This one writes rather than 401s, so the consequence is data rather than
 * load — XP credited per render for as long as the page stays open.
 *
 * Counting calls across re-renders is the point; asserting "XP was awarded"
 * passes on the broken version too.
 */
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query'
import { act, render } from '@testing-library/react'
import React, { useEffect, useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

function client() {
  return new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
}

let forceRerender: (() => void) | null = null

function useRerenderHandle() {
  const [, setTick] = useState(0)
  forceRerender = () => setTick((t) => t + 1)
}

/** The old shape: mutation object in the deps, no guard. */
function Looping({ onAward, isComplete }: { onAward: () => void; isComplete: boolean }) {
  useRerenderHandle()
  const awardXP = useMutation({
    mutationFn: async () => {
      onAward()
      return null
    },
  })

  useEffect(() => {
    if (isComplete) awardXP.mutate()
  }, [isComplete, awardXP])

  return null
}

/** The shape it has now: stable mutate, mount-scoped ref guard. */
function Fixed({ onAward, isComplete }: { onAward: () => void; isComplete: boolean }) {
  useRerenderHandle()
  const { mutate: awardXP } = useMutation({
    mutationFn: async () => {
      onAward()
      return null
    },
  })
  const hasAwardedXP = useRef(false)

  useEffect(() => {
    if (!isComplete) return
    if (hasAwardedXP.current) return
    hasAwardedXP.current = true
    awardXP()
  }, [isComplete, awardXP])

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

describe('results view XP', () => {
  it('awards once, however many times the results page re-renders', async () => {
    const onAward = vi.fn()
    render(
      <QueryClientProvider client={client()}>
        <Fixed onAward={onAward} isComplete />
      </QueryClientProvider>,
    )

    await settle()
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        forceRerender?.()
      })
    }
    await settle()

    expect(onAward).toHaveBeenCalledTimes(1)
  })

  it('does not award while the results are still incomplete', async () => {
    const onAward = vi.fn()
    const { rerender } = render(
      <QueryClientProvider client={client()}>
        <Fixed onAward={onAward} isComplete={false} />
      </QueryClientProvider>,
    )
    await settle()
    expect(onAward).not.toHaveBeenCalled()

    // …and awards exactly once when they arrive.
    rerender(
      <QueryClientProvider client={client()}>
        <Fixed onAward={onAward} isComplete />
      </QueryClientProvider>,
    )
    await settle()

    expect(onAward).toHaveBeenCalledTimes(1)
  })

  it('the old shape really did loop — the guard above is not vacuous', async () => {
    const onAward = vi.fn()
    render(
      <QueryClientProvider client={client()}>
        <Looping onAward={onAward} isComplete />
      </QueryClientProvider>,
    )

    await settle(120)

    expect(onAward.mock.calls.length).toBeGreaterThan(20)
  })
})
