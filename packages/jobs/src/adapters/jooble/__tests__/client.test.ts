import axios, { type AxiosInstance } from 'axios'
import { performance } from 'node:perf_hooks'
import { createEnvStub, freezeTime } from '@app/test-utils'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { JoobleClient, assertApiKey, cleanPayload, type JoobleSearchResponse } from '../client'

const env = createEnvStub()

afterAll(() => {
  env.restore()
})

describe('assertApiKey', () => {
  afterEach(() => {
    env.reset('JOOBLE_API_KEY')
  })

  it('returns explicit keys when provided', () => {
    expect(assertApiKey('explicit')).toBe('explicit')
  })

  it('reads the key from the environment', () => {
    env.set({ JOOBLE_API_KEY: 'env-key' })
    expect(assertApiKey()).toBe('env-key')
  })

  it('throws when no key can be resolved', () => {
    env.clear('JOOBLE_API_KEY')
    expect(() => assertApiKey()).toThrowError('JOOBLE_API_KEY is not defined')
  })
})

describe('cleanPayload', () => {
  it('omits empty values while preserving valid numbers', () => {
    const payload = cleanPayload({
      keywords: ' developer ',
      location: '',
      radius: 25,
      page: undefined,
      size: 0,
    })

    expect(payload).toEqual({ keywords: ' developer ', radius: 25, size: 0 })
  })
})

describe('JoobleClient', () => {
  const createClient = (postImpl: AxiosInstance['post']) => {
    const post = vi.fn(postImpl)
    const httpClient = { post } as unknown as AxiosInstance
    const client = new JoobleClient({ apiKey: 'test-key', httpClient })
    return { client, post }
  }

  beforeEach(() => {
    env.set({ JOOBLE_API_KEY: 'env-key' })
  })

  afterEach(() => {
    env.reset('JOOBLE_API_KEY')
    vi.restoreAllMocks()
  })

  it('cleans the payload and normalizes successful responses', async () => {
    const response: JoobleSearchResponse = {
      totalCount: 2,
      jobs: [
        { id: '1', title: 'Role', link: 'https://example.com/1' },
        { id: '2', title: 'Role 2', link: 'https://example.com/2' },
      ],
    }

    const clock = freezeTime('2024-01-01T00:00:00Z')
    const performanceNowSpy = vi.spyOn(performance, 'now')
    performanceNowSpy.mockImplementationOnce(() => 100)
    performanceNowSpy.mockImplementationOnce(() => 142)
    performanceNowSpy.mockImplementation(() => 142)

    try {
      const { client, post } = createClient(async (_url, _payload, _config) => {
        clock.advanceTimersByTime(42)
        return { status: 200, data: response }
      })

      const result = await client.search({
        keywords: 'engineer',
        location: 'Remote',
        radius: 10,
        page: undefined,
        size: 50,
      })

      expect(post).toHaveBeenCalledWith(
        '/test-key',
        { keywords: 'engineer', location: 'Remote', radius: 10, size: 50 },
        { signal: undefined }
      )
      expect(result.data).toEqual(response)
      expect(result.status).toBe(200)
      expect(result.durationMs).toBe(42)
    } finally {
      performanceNowSpy.mockRestore()
      clock.restore()
    }
  })

  it('throws when the API returns an error payload', async () => {
    const { client } = createClient((_url, _payload, _config) =>
      Promise.resolve({ status: 200, data: { error: 'Upstream error', jobs: [] } })
    )

    await expect(client.search({})).rejects.toThrow('Upstream error')
  })

  it('propagates abort signals without wrapping the error', async () => {
    const controller = new AbortController()
    const abortError = new Error('aborted')
    const isAxiosErrorSpy = vi.spyOn(axios, 'isAxiosError').mockReturnValue(false)

    const { client, post } = createClient(
      (url, payload, config) =>
        new Promise((_, reject) => {
          config?.signal?.addEventListener('abort', () => reject(abortError))
        })
    )

    const pending = client.search({ keywords: 'test' }, { signal: controller.signal })
    controller.abort()

    await expect(pending).rejects.toBe(abortError)
    expect(post).toHaveBeenCalledWith(
      '/test-key',
      { keywords: 'test' },
      { signal: controller.signal }
    )
    expect(isAxiosErrorSpy).toHaveBeenCalledWith(abortError)
  })

  it('wraps axios errors with status codes and messages from the response', async () => {
    const axiosError = new Error('Network failure') as Error & {
      response?: { status?: number; data?: unknown }
    }
    axiosError.response = { status: 503, data: { error: 'Service unavailable' } }

    const isAxiosErrorSpy = vi
      .spyOn(axios, 'isAxiosError')
      .mockImplementation((error) => error === axiosError)

    const { client } = createClient((_url, _payload, _config) => Promise.reject(axiosError))

    await expect(client.search({})).rejects.toThrow(
      'Jooble request failed (503): Service unavailable'
    )
    expect(isAxiosErrorSpy).toHaveBeenCalledWith(axiosError)
  })

  it('uses string response bodies when available in axios errors', async () => {
    const axiosError = new Error('Request failed') as Error & {
      response?: { status?: number; data?: unknown }
    }
    axiosError.response = { status: 400, data: 'Bad request' }

    vi.spyOn(axios, 'isAxiosError').mockImplementation((error) => error === axiosError)

    const { client } = createClient((_url, _payload, _config) => Promise.reject(axiosError))

    await expect(client.search({})).rejects.toThrow('Jooble request failed (400): Bad request')
  })
})
