import { vi, type VitestUtils } from 'vitest'

type FakeTimersOptions = NonNullable<Parameters<typeof vi.useFakeTimers>[0]>
type FakeTimersToFake = NonNullable<FakeTimersOptions['toFake']>

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
] satisfies FakeTimersToFake

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
  options?: FakeTimersOptions
): FrozenClock => {
  const reference = toDate(now)
  const normalizedOptions = options ?? ({} as FakeTimersOptions)
  const mergedToFake = new Set([...(normalizedOptions.toFake ?? defaultToFake), 'performance'])
  const clock = vi.useFakeTimers({
    ...normalizedOptions,
    now: reference,
    toFake: Array.from(mergedToFake) as FakeTimersToFake,
  })

  clock.setSystemTime(reference)

  const restore = () => {
    clock.clearAllTimers()
    clock.useRealTimers()
  }

  return Object.assign(clock, { restore }) as FrozenClock
}
