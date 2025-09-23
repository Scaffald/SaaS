import { vi, type VitestUtils } from 'vitest'

type FakeTimerOptions = Parameters<(typeof vi)['useFakeTimers']>[0]
type ResolvedFakeTimerOptions = NonNullable<FakeTimerOptions>
type FakeTimerToFake = ResolvedFakeTimerOptions extends { toFake?: infer T } ? T : never

export type FrozenClock = VitestUtils & {
  restore: () => void
}

const defaultToFake = [
  'Date',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'setImmediate',
  'clearImmediate',
  'performance',
] satisfies NonNullable<FakeTimerToFake>

const toDate = (value: Date | string | number) => {
  if (value instanceof Date) {
    return value
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`freezeTime received an invalid date value: ${String(value)}`)
  }

  return date
}

export const freezeTime = (
  now: Date | string | number,
  options: FakeTimerOptions = {} as FakeTimerOptions
): FrozenClock => {
  const reference = toDate(now)
  const resolvedOptions = (options ?? {}) as ResolvedFakeTimerOptions
  const mergedToFake = new Set([...(resolvedOptions.toFake ?? defaultToFake), 'performance'])
  const timerOptions = {
    ...resolvedOptions,
    now: reference,
    toFake: Array.from(mergedToFake) as NonNullable<FakeTimerToFake>,
  } as ResolvedFakeTimerOptions
  const clock = vi.useFakeTimers(timerOptions as FakeTimerOptions)

  clock.setSystemTime(reference)

  const restore = () => {
    clock.clearAllTimers()
    clock.useRealTimers()
  }

  return Object.assign(clock, { restore }) as FrozenClock
}
