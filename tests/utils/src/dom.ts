export type GlobalStubResult = {
  restore: () => void
}

type MutableGlobal = typeof globalThis & Record<PropertyKey, unknown> & { window?: typeof window }

export function stubGlobal<K extends keyof typeof globalThis>(
  key: K,
  value: (typeof globalThis)[K]
): GlobalStubResult {
  const target = globalThis as MutableGlobal
  const hadValue = Object.prototype.hasOwnProperty.call(target, key)
  const originalValue = target[key]

  target[key] = value

  return {
    restore: () => {
      if (hadValue) {
        target[key] = originalValue
      } else {
        Reflect.deleteProperty(target, key)
      }
    },
  }
}

export type WindowShimResult = GlobalStubResult & {
  window: typeof window
}

export function installWindowShim(overrides: Partial<typeof window> = {}): WindowShimResult {
  const target = globalThis as MutableGlobal
  const hadWindow = typeof target.window !== 'undefined'
  const originalWindow = hadWindow ? (target.window as typeof window) : undefined
  const shim = hadWindow
    ? originalWindow!
    : ((globalThis as unknown as typeof window) ?? ({} as typeof window))

  if (!hadWindow) {
    Object.defineProperty(target, 'window', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: shim,
    })
  }

  const shimRecord = shim as unknown as Record<PropertyKey, unknown>
  const previousValues = new Map<PropertyKey, unknown>()
  for (const [key, value] of Object.entries(overrides)) {
    previousValues.set(key, shimRecord[key])
    shimRecord[key] = value as unknown
  }

  return {
    window: shim,
    restore: () => {
      for (const [key, value] of previousValues) {
        if (value === undefined) {
          delete shimRecord[key]
        } else {
          shimRecord[key] = value
        }
      }

      if (!hadWindow) {
        Reflect.deleteProperty(target, 'window')
      } else {
        target.window = originalWindow!
      }
    },
  }
}
