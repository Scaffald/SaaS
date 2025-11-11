import { describe, expect, it, vi } from 'vitest'

const randomUUIDMock = vi.hoisted(() => vi.fn(() => 'mock-uuid'))
const digestStringAsyncMock = vi.hoisted(() => vi.fn(() => Promise.resolve('hashed-nonce')))

vi.mock('expo-crypto', () => ({
  randomUUID: randomUUIDMock,
  digestStringAsync: digestStringAsyncMock,
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
}))

const { initiateGoogleSignIn } = await import('../initiateGoogleSignIn')

describe('initiateGoogleSignIn', () => {
  it('generates a nonce pair using expo-crypto helpers', async () => {
    const result = await initiateGoogleSignIn()

    expect(randomUUIDMock).toHaveBeenCalled()
    expect(digestStringAsyncMock).toHaveBeenCalledWith('SHA-256', 'mock-uuid')
    expect(result).toEqual({
      rawNonce: 'mock-uuid',
      hashedNonce: 'hashed-nonce',
    })
  })
})

