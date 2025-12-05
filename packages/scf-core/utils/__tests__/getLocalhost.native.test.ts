import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const constantsMock = {
  expoConfig: {
    hostUri: '192.168.0.5:19000',
  },
}

vi.mock('expo-constants', () => ({
  __esModule: true,
  default: constantsMock,
}))

describe('getLocalhost native helpers', () => {
  beforeEach(() => {
    constantsMock.expoConfig = { hostUri: '192.168.0.5:19000' }
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('returns debugger host from Expo config and caches value', async () => {
    const module = await import('../getLocalhost.native')
    expect(module.getLocalhost()).toBe('192.168.0.5')

    constantsMock.expoConfig.hostUri = '10.0.0.1:8081'
    expect(module.getLocalhost()).toBe('192.168.0.5')
  })

  it('falls back to localhost when hostUri is absent', async () => {
    constantsMock.expoConfig.hostUri = ''
    const module = await import('../getLocalhost.native')
    expect(module.getLocalhost()).toBe('localhost')
  })

  it('replaces the hostname in provided URLs', async () => {
    const module = await import('../getLocalhost.native')
    expect(module.replaceLocalhost('http://localhost:3000/path')).toBe(
      'http://192.168.0.5:3000/path',
    )
  })
})


