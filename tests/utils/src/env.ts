export type EnvStub = {
  track: (...keys: string[]) => void
  set: (values: Partial<NodeJS.ProcessEnv>) => void
  clear: (...keys: string[]) => void
  reset: (...keys: string[]) => void
  restore: () => void
}

export function createEnvStub(initial?: Partial<NodeJS.ProcessEnv>): EnvStub {
  const tracked = new Map<string, string | undefined>()

  const record = (key: string) => {
    if (!tracked.has(key)) {
      tracked.set(key, process.env[key])
    }
  }

  const set = (values: Partial<NodeJS.ProcessEnv>) => {
    for (const [key, value] of Object.entries(values)) {
      record(key)
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }

  const clear = (...keys: string[]) => {
    for (const key of keys) {
      record(key)
      delete process.env[key]
    }
  }

  const reset = (...keys: string[]) => {
    for (const key of keys) {
      if (!tracked.has(key)) {
        continue
      }

      const original = tracked.get(key)
      if (original === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = original
      }
    }
  }

  const track = (...keys: string[]) => {
    for (const key of keys) {
      record(key)
    }
  }

  const restore = () => {
    for (const [key, value] of tracked) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
    tracked.clear()
  }

  if (initial) {
    set(initial)
  }

  return { track, set, clear, reset, restore }
}
