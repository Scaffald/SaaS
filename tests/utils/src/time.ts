import { vi, type FakeTimerInstallOpts, type VitestUtils } from 'vitest'

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
] satisfies NonNullable<FakeTimerInstallOpts['toFake']>

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
  options: FakeTimerInstallOpts = {}
): FrozenClock => {
  const reference = toDate(now)
  const mergedToFake = new Set([...(options.toFake ?? defaultToFake), 'performance'])
  const clock = vi.useFakeTimers({
    ...options,
    now: reference,
    toFake: Array.from(mergedToFake) as NonNullable<FakeTimerInstallOpts['toFake']>,
  })

  clock.setSystemTime(reference)

  const restore = () => {
    clock.clearAllTimers()
    clock.useRealTimers()
  }

  return Object.assign(clock, { restore }) as FrozenClock
}
