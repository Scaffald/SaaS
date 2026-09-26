/**
 * Bounding a test that deliberately renders an unbounded render loop.
 *
 * Two suites — profile-view-tracking and results-view-xp — each keep a
 * "the old shape really did loop" case next to the fix, so that the guard
 * above it cannot pass vacuously. Both did it by rendering the broken
 * component, waiting a fixed 120 ms, and asserting the effect had re-entered
 * more than 20 times.
 *
 * That made the result a function of how fast the machine was. The loop is
 * not slow: measured locally it re-enters the effect **thousands** of times
 * in 60 ms, and letting it run for a fixed window is enough to take the
 * vitest worker down with it — `Error: Worker exited unexpectedly`, reported
 * as `STACK_TRACE_ERROR` against whichever test happened to be running. That
 * is the #753 flake: both suites failed that way on unrelated PRs and passed
 * on a plain re-run.
 *
 * The assertion never needed a clock. It needs to know the effect re-enters
 * itself without a terminating condition, which `CAP` iterations establish as
 * well as a thousand do. So this probe counts calls, stops the loop the
 * instant it reaches `CAP`, and resolves — fast machine or slow, the work is
 * the same and nothing runs away.
 *
 * The component still has no terminating condition of its own. `shouldStop`
 * is the *test's* bound, not a fix to the shape under test: it is consulted
 * only after the loop has already proved itself.
 */

/** Iterations that establish "this re-enters itself", with room to spare. */
export const LOOP_CAP = 25

/** How long to wait for the loop before calling it stalled. */
const STALL_AFTER_MS = 2_000

export interface UnboundedLoopProbe {
  /** Pass as the component's call-through; counts and stops at `LOOP_CAP`. */
  onCall: () => void
  /** Pass to the component's effect: true once `LOOP_CAP` is reached. */
  shouldStop: () => boolean
  /** Iterations observed so far. */
  readonly calls: number
  /**
   * Resolves `'looped'` once `LOOP_CAP` is reached, or `'stalled'` after
   * {@link STALL_AFTER_MS}. A stall is the interesting failure: it means the
   * old shape no longer loops, so react-query changed its identity semantics
   * and the reasoning behind the fix needs revisiting. Asserting on this
   * rather than awaiting the loop alone keeps that case a clear failure
   * instead of a suite-level timeout.
   */
  settled: () => Promise<'looped' | 'stalled'>
}

export function unboundedLoopProbe(): UnboundedLoopProbe {
  let calls = 0
  let stopped = false
  let reached!: () => void
  const looped = new Promise<'looped'>((resolve) => {
    reached = () => resolve('looped')
  })

  return {
    onCall() {
      calls += 1
      if (calls >= LOOP_CAP && !stopped) {
        stopped = true
        reached()
      }
    },
    shouldStop: () => stopped,
    get calls() {
      return calls
    },
    settled() {
      let timer: ReturnType<typeof setTimeout>
      const stalled = new Promise<'stalled'>((resolve) => {
        timer = setTimeout(() => resolve('stalled'), STALL_AFTER_MS)
      })
      return Promise.race([looped, stalled]).finally(() => clearTimeout(timer))
    },
  }
}
