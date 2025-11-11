import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let mockIsWeb = false
const replaceLocalhostMock = vi.fn((url: string) => `replaced(${url})`)

vi.mock('tamagui', () => ({
  get isWeb() {
    return mockIsWeb
  },
}))

vi.mock('../getLocalhost.native', () => ({
  replaceLocalhost: (address: string) => replaceLocalhostMock(address),
}))

const originalEnv = { ...process.env }

async function importModule() {
  vi.resetModules()
  return import('../getBaseUrl')
}

describe('getBaseUrl', () => {
  beforeEach(() => {
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key]
      }
    })
    Object.assign(process.env, originalEnv)
    mockIsWeb = false
    replaceLocalhostMock.mockClear()
  })

  afterEach(() => {
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key]
      }
    })
    Object.assign(process.env, originalEnv)
  })

  it('returns empty string when running on the web with window available', async () => {
    mockIsWeb = true
    const { getBaseUrl } = await importModule()
    expect(getBaseUrl()).toBe('')
    expect(replaceLocalhostMock).not.toHaveBeenCalled()
  })

  it('returns EXPO_PUBLIC_URL when provided for native platforms', async () => {
    process.env.EXPO_PUBLIC_URL = 'https://native.example.com'
    mockIsWeb = false
    const { getBaseUrl } = await importModule()
    expect(getBaseUrl()).toBe('replaced(https://native.example.com)')
    expect(replaceLocalhostMock).toHaveBeenCalledWith('https://native.example.com')
  })

  it('builds render internal URL when variables set', async () => {
    process.env.RENDER_INTERNAL_HOSTNAME = 'internal-host'
    process.env.PORT = '8888'
    mockIsWeb = false
    const { getBaseUrl } = await importModule()
    expect(getBaseUrl()).toBe('replaced(http://internal-host:8888)')
    expect(replaceLocalhostMock).toHaveBeenCalledWith('http://internal-host:8888')
  })

  it('falls back to localhost with default port', async () => {
    delete process.env.RENDER_INTERNAL_HOSTNAME
    delete process.env.EXPO_PUBLIC_URL
    delete process.env.PORT
    mockIsWeb = false
    const { _getBaseUrl, getBaseUrl } = await importModule()
    expect(_getBaseUrl()).toBe('http://localhost:3000')
    expect(getBaseUrl()).toBe('replaced(http://localhost:3000)')
    expect(replaceLocalhostMock).toHaveBeenCalledWith('http://localhost:3000')
  })
})


